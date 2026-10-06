"""
vr_withdrawal_backtest.py  (탐색용 — 터미널 출력만)

라오어 밸류리밸런싱(VR) 인출식 vs 기존 EMA200 전략 비교

────────────────────────────────────────────────
[VR 인출식 공식 — 정확한 버전]
  · V (밸류)  : 주식 평가금의 목표값
  · P (풀)    : 현금 보유량
  · G (그라디언트) : 20 (인출식 기본값)
  · 밴드      : 상단 V×1.15 / 하단 V×0.85

  · 인출금 = P/G  (현재 Pool을 G로 나눈 값, 매 사이클 동적 변동)
    → 지속 가능 조건: 인출금 ≤ P/G (항상 성립)
    → new_V = V + P/G - P/G = V  (V는 변하지 않음)
    → 상승장 매도 → P 증가 → P/G 증가 → 인출금 자동 증가
    → 하락장 매수 → P 감소 → P/G 감소 → 인출금 자동 감소

  · 사이클 순서 (2주=10 영업일):
      1) V 갱신 (인출금=P/G이면 V 불변)
      2) Pool에서 인출: P -= P/G
      3) 밴드 재설정 (V 기준)
      4) 2주간 매일 밴드 체크 → 매도(초과→V로 복귀) / 매수(Pool 25% 한도)
  · Pool 소진 시: 인출 중단, 주식 매도 없음

[비교 전략]
  S0 : EMA200-15일 + 동적인출 0.3/0.5/0.7% (현재 최선)
  VR : VR 인출식, G=20, 밴드±15%, 인출금=P/G (동적)

[초기 설정]
  전체 자산 = 10억
  VR : V0 = 8억 (주식), P0 = 2억 (Pool)
       → 첫 사이클 인출금 = 2억/20 = 1,000만원 (사이클당)
       → 월 환산 ≈ 2,000만원/월 (상승장 매도 시 더 증가)
  S0 : 전액 TQQQ 투자 (EMA200 미만이면 현금 보유)
"""

import json, time
import numpy as np
import pandas as pd
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR = (_ROOT / "data")

INITIAL    = 1_000_000_000   # 10억
SIM_YEARS  = 20
EXP_RATIO  = 0.0088          # TQQQ 운용보수

# ─── VR 파라미터 ───────────────────────────────────────────────
VR_G             = 20          # 그라디언트 (인출식 최소 권장값)
VR_BAND          = 0.15        # 밴드 ±15%
VR_POOL_LIMIT    = 0.25        # Pool 매수 사용 한도 25%
VR_CYCLE_DAYS    = 10          # 사이클 = 2주 ≈ 10 영업일
VR_V_RATIO       = 0.80        # 초기 V 비율 (총 자산 80%)
# 인출금: 초기 자산 10억의 월 1% = 1,000만원/월 → 사이클당 500만원
VR_MONTHLY_RATE  = 0.01        # 월 인출률 (초기 자산 기준 고정)
VR_CYCLE_WD      = INITIAL * VR_MONTHLY_RATE / 2  # 사이클당 500만원

# ─── EMA200 파라미터 ────────────────────────────────────────────
EMA_N      = 200
EMA_CONSEC = 15               # 연속 15일 아래 → 매도
DYN_RATES  = (0.003, 0.005, 0.007)      # 동적인출률 0.3/0.5/0.7%
DYN_THRS   = (5_000_000_000, 10_000_000_000)  # 50억/100억 기준


# ═══════════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════════

def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    # 1985-10-01 splice 보정
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    ndx_closes = ndx["Close"].values.astype(float)
    dates       = pd.DatetimeIndex(ndx["Date"])

    # NDX 3x 합성 (운용보수 포함)
    ret = np.diff(ndx_closes) / ndx_closes[:-1]
    ret = np.insert(ret, 0, 0.0)
    daily_drag = EXP_RATIO / 252
    factor     = (1.0 + ret * 3.0) * (1.0 - daily_drag)
    factor[0]  = 1.0
    ndx3x      = 100.0 * np.cumprod(factor)

    # EMA200 계산 (NDX 원가격 기준)
    n     = len(ndx_closes)
    alpha = 2.0 / (EMA_N + 1)
    ema200 = np.full(n, np.nan)
    ema_v  = ndx_closes[0]
    for i in range(n):
        ema_v     = alpha * ndx_closes[i] + (1 - alpha) * ema_v
        if i >= EMA_N - 1:
            ema200[i] = ema_v

    return ndx3x, ndx_closes, ema200, dates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════════
# VR 인출식 시뮬레이션
# ═══════════════════════════════════════════════════════════════

def run_vr(ndx3x, dates, start_idx, g_val=VR_G):
    """
    라오어 밸류리밸런싱 인출식 (정확한 공식)
    g_val: 그라디언트 (기본값 VR_G=20)
    """
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # 초기화
    V      = INITIAL * VR_V_RATIO        # 8억
    P      = INITIAL * (1 - VR_V_RATIO)  # 2억
    shares = V / ndx3x[start_idx]

    # 사이클 시작 시 V/밴드 고정 (2주간 유지)
    upper = V * (1 + VR_BAND)
    lower = V * (1 - VR_BAND)
    pool_after_wd = P  # 인출 후 Pool (매수 한도 계산 기준)

    days_in_cycle   = 0
    total_withdrawn = 0.0
    monthly_snaps   = []
    last_snap_month = None

    def do_cycle_start(V, P):
        """사이클 시작: V갱신 → 인출 → 밴드 재설정"""
        cycle_wd = VR_CYCLE_WD  # 고정 인출금 (초기 자산 × 월1% / 2)

        # V 갱신: new_V = V + P/G - 인출금
        new_V = V + P / g_val - cycle_wd
        new_V = max(0.0, new_V)

        # Pool에서 인출 (소진 시 인출 중단, 주식 매도 없음)
        wd_actual = 0.0
        if P >= cycle_wd:
            P        -= cycle_wd
            wd_actual = cycle_wd
        else:
            wd_actual = P
            P         = 0.0

        new_upper = new_V * (1 + VR_BAND)
        new_lower = new_V * (1 - VR_BAND)
        return new_V, P, new_upper, new_lower, wd_actual

    # 첫 사이클 시작
    V, P, upper, lower, wd0 = do_cycle_start(V, P)
    total_withdrawn += wd0
    pool_after_wd    = P

    for j in range(sim_len):
        ci    = start_idx + j
        if ci >= n:
            break

        price    = ndx3x[ci]
        port_val = shares * price

        # ── 밴드 체크 & 매매 (매일, 이 사이클의 V/밴드 기준) ─────
        if port_val > upper:
            # 매도: 평가금 → V로 복귀, 차액 Pool 편입
            excess  = port_val - V
            shares -= excess / price
            P      += excess
            pool_after_wd = P  # 매도로 Pool 증가 반영

        elif port_val < lower and pool_after_wd > 0:
            # 매수: 인출 후 남은 Pool의 25% 한도, V까지 복귀
            needed      = V - (shares * price)
            pool_budget = pool_after_wd * VR_POOL_LIMIT
            buy_amount  = min(needed, pool_budget)
            if buy_amount > 0 and P >= buy_amount:
                shares        += buy_amount / price
                P             -= buy_amount
                pool_after_wd -= buy_amount

        # ── 사이클 종료 → 다음 사이클 시작 ───────────────────────
        days_in_cycle += 1
        if days_in_cycle >= VR_CYCLE_DAYS:
            days_in_cycle = 0
            V, P, upper, lower, wd = do_cycle_start(V, P)
            total_withdrawn += wd
            pool_after_wd    = P

        # ── 월별 스냅샷 ──────────────────────────────────────────
        cur_month = (dates[ci].year, dates[ci].month)
        if cur_month != last_snap_month:
            total_assets = shares * price + P
            monthly_snaps.append({
                "date":  dates[ci].strftime("%Y-%m"),
                "value": round(total_assets / 1e8, 4),
            })
            last_snap_month = cur_month

    ci_end       = min(start_idx + sim_len - 1, n - 1)
    final_assets = shares * ndx3x[ci_end] + P
    min_val      = min((s["value"] for s in monthly_snaps), default=0.0)
    n_months     = len(monthly_snaps)
    actual_yr    = n_months / 12
    cagr = ((final_assets / INITIAL) ** (1.0 / actual_yr) - 1.0) * 100 \
           if actual_yr > 0 and final_assets > 0 else -100.0

    # Pool 소진으로 자산이 0이 된 경우만 파산
    return {
        "final":     round(final_assets / 1e8, 2),
        "withdrawn": round(total_withdrawn / 1e8, 2),
        "min":       round(min_val, 4),
        "bankrupt":  final_assets <= 0,
        "cagr":      round(cagr, 2),
    }


# ═══════════════════════════════════════════════════════════════
# EMA200 기반 전략 (현재 최선 S0)
# ═══════════════════════════════════════════════════════════════

def run_s0(ndx3x, ndx_closes, ema200, dates, start_idx):
    """
    EMA200 연속15일 + 동적인출 0.3/0.5/0.7%  (현재 최선)
    """
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    ema_init = ema200[start_idx]
    if np.isnan(ema_init) or ndx_closes[start_idx] >= ema_init:
        is_invested     = True
        shares          = INITIAL / ndx3x[start_idx]
        cash            = 0.0
    else:
        is_invested     = False
        shares          = 0.0
        cash            = float(INITIAL)

    consec_below    = 0
    total_withdrawn = 0.0
    monthly_snaps   = []
    last_snap_month = None
    last_wd_month   = None

    for j in range(sim_len):
        ci    = start_idx + j
        if ci >= n:
            break

        price     = ndx3x[ci]
        ema_val   = ema200[ci]

        # EMA 신호 처리
        if not np.isnan(ema_val):
            below = ndx_closes[ci] < ema_val
            if below:
                consec_below += 1
            else:
                consec_below = 0

            if is_invested and consec_below >= EMA_CONSEC:
                cash        = shares * price
                shares      = 0.0
                is_invested = False
                consec_below = 0

            elif not is_invested and not below:
                shares      = cash / price
                cash        = 0.0
                is_invested = True

        # 월별 인출
        cur_month = (dates[ci].year, dates[ci].month)
        if cur_month != last_wd_month and j > 0:
            total_assets = shares * price + cash
            if total_assets < DYN_THRS[0]:
                rate = DYN_RATES[0]
            elif total_assets < DYN_THRS[1]:
                rate = DYN_RATES[1]
            else:
                rate = DYN_RATES[2]
            wd = total_assets * rate
            if is_invested:
                shares = max(0.0, shares - wd / price)
            else:
                cash = max(0.0, cash - wd)
            total_withdrawn += wd
            last_wd_month = cur_month

        # 월별 스냅샷
        if cur_month != last_snap_month:
            total_assets = shares * price + cash
            monthly_snaps.append({
                "date":  dates[ci].strftime("%Y-%m"),
                "value": round(total_assets / 1e8, 4),
            })
            last_snap_month = cur_month

        if shares * price + cash <= 0:
            break

    ci_end       = min(start_idx + sim_len - 1, n - 1)
    final_assets = shares * ndx3x[ci_end] + cash
    min_val      = min((s["value"] for s in monthly_snaps), default=0.0)
    n_months     = len(monthly_snaps)
    actual_yr    = n_months / 12
    cagr = ((final_assets / INITIAL) ** (1.0 / actual_yr) - 1.0) * 100 \
           if actual_yr > 0 and final_assets > 0 else -100.0

    return {
        "final":     round(final_assets / 1e8, 2),
        "withdrawn": round(total_withdrawn / 1e8, 2),
        "min":       round(min_val, 4),
        "bankrupt":  final_assets <= 0,
        "cagr":      round(cagr, 2),
    }


# ═══════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════

def summarize(vals):
    bankrupt  = sum(1 for v in vals if v["bankrupt"])
    total     = len(vals)
    finals    = [v["final"]     for v in vals if not v["bankrupt"]]
    wds       = [v["withdrawn"] for v in vals]
    mins      = [v["min"]       for v in vals]
    cagrs     = [v["cagr"]      for v in vals if not v["bankrupt"]]
    sorted_f  = sorted(finals)
    return {
        "total":       total,
        "bankrupt":    bankrupt,
        "survival":    round((total - bankrupt) / total * 100, 1),
        "med_final":   round(sorted_f[len(sorted_f) // 2], 1) if finals else 0,
        "avg_final":   round(sum(finals) / len(finals), 1) if finals else 0,
        "p25_final":   round(sorted_f[len(sorted_f) // 4], 1) if finals else 0,
        "p75_final":   round(sorted_f[len(sorted_f) * 3 // 4], 1) if finals else 0,
        "avg_wd":      round(sum(wds) / len(wds), 2) if wds else 0,
        "min_of_min":  round(min(mins), 4) if mins else 0,
        "avg_cagr":    round(sum(cagrs) / len(cagrs), 2) if cagrs else 0,
    }


G_SWEEP = [20, 30, 40, 50, 60, 70, 80, 90, 100]


def main():
    t0 = time.time()
    print("=" * 90)
    print("라오어 VR 인출식 G값 스윕 vs EMA200 동적인출")
    print(f"  초기자산 10억 | 시뮬 기간 {SIM_YEARS}년 | 코호트: 1971~")
    print(f"  VR 공통: 밴드±{VR_BAND*100:.0f}%  Pool한도{VR_POOL_LIMIT*100:.0f}%"
          f"  사이클 {VR_CYCLE_DAYS}영업일  초기 V:P={VR_V_RATIO:.0%}:{1-VR_V_RATIO:.0%}"
          f"  고정인출 {VR_CYCLE_WD*2/1e4:.0f}만원/월")
    print("=" * 90)

    print("\n[1] 데이터 로드 ...")
    ndx3x, ndx_closes, ema200, dates = load_data()
    print(f"    NDX: {len(dates)}일  {dates[0].date()} ~ {dates[-1].date()}")

    first_valid    = int(np.where(~np.isnan(ema200))[0][0])
    monthly_starts = [i for i in get_monthly_starts(dates)
                      if i >= first_valid]

    valid_starts = [si for si in monthly_starts
                    if (len(ndx3x) - si) / 252 >= SIM_YEARS]
    n_valid = len(valid_starts)

    print(f"\n[2] 코호트별 시뮬레이션 ({n_valid}개) ...")

    # S0는 한 번만 계산
    s0_results = []
    for si in valid_starts:
        s0_results.append(run_s0(ndx3x, ndx_closes, ema200, dates, si))
    print(f"    S0 완료")

    # G값별 VR 결과
    vr_results = {}
    for g in G_SWEEP:
        vr_res = []
        for si in valid_starts:
            vr_res.append(run_vr(ndx3x, dates, si, g_val=g))
        vr_results[g] = vr_res
        st = summarize(vr_res)
        print(f"    G={g:>3}  생존율={st['survival']:.1f}%  중앙값={st['med_final']:.0f}억")

    n_cohorts = n_valid
    print(f"\n    완료: {n_cohorts}개 코호트")

    # ── 결과 테이블 ──
    s0_stats = summarize(s0_results)
    vr_stats = {g: summarize(vr_results[g]) for g in G_SWEEP}

    metrics = [
        ("파산 수",              "bankrupt"),
        ("생존율 (%)",           "survival"),
        ("중앙값 최종 (억)",     "med_final"),
        ("평균 최종 (억)",       "avg_final"),
        ("P25 최종 (억)",        "p25_final"),
        ("P75 최종 (억)",        "p75_final"),
        ("평균 인출 총액 (억)",  "avg_wd"),
        ("평균 연평균수익률 (%)","avg_cagr"),
    ]

    # 헤더
    col = 10
    print("\n[3] G값 스윕 결과 요약")
    header = f"{'지표':<24}  {'S0(EMA200)':>{col}}"
    for g in G_SWEEP:
        header += f"  {'VR G='+str(g):>{col}}"
    print("    " + header)
    print("    " + "─" * len(header))

    for label, key in metrics:
        row = f"{label:<24}  {s0_stats[key]:>{col}}"
        for g in G_SWEEP:
            row += f"  {vr_stats[g][key]:>{col}}"
        print("    " + row)

    # ── VR > S0 개별 승률 ──
    print("\n[4] VR > S0 개별 코호트 승률")
    for g in G_SWEEP:
        wins = sum(1 for a, b in zip(s0_results, vr_results[g])
                   if b["final"] > a["final"])
        print(f"    G={g:>3}: {wins}/{n_cohorts} = {wins/n_cohorts*100:.1f}%")

    # ── 주요 시작점 상세 ──
    KEY_STARTS = ["1999-03", "2000-03", "2007-10", "2009-03", "2020-03"]
    start_strs = [dates[si].strftime("%Y-%m") for si in valid_starts]

    print("\n[5] 주요 시작점 상세")
    g_cols = "  ".join(f"{'G='+str(g):>9}" for g in G_SWEEP)
    print(f"    {'시작':>8}  {'S0':>9}  {g_cols}")
    for i, st_str in enumerate(start_strs):
        if st_str in KEY_STARTS:
            s0f = s0_results[i]["final"]
            vr_line = "  ".join(f"{vr_results[g][i]['final']:>8.0f}억" for g in G_SWEEP)
            print(f"    {st_str:>8}  {s0f:>8.0f}억  {vr_line}")

    print(f"\n소요 시간: {time.time() - t0:.1f}초")
    print("=" * 90)


if __name__ == "__main__":
    main()
