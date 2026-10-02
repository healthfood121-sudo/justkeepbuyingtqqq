"""
export_vr_sweep_json.py  (데이터 생성용)

라오어 밸류리밸런싱(VR) 인출식 파라미터 스윕
→ web/public/data/vr_sweep.json 생성

스윕 변수:
  G (그라디언트):  20, 30, 40, 50, 60, 70, 80, 90, 100  (9가지)
  초기 P 비율(%):  10, 20, 30, 40, 50, 60, 70, 80        (8가지)
  월 인출률(‰):   5, 10, 15  → 0.5%, 1.0%, 1.5%          (3가지)

총 216가지 VR 조합 + S0 기준선 (EMA200 연속15일 + 동적인출)

[파산(insolvent) 정의]
  VR: Pool 소진으로 인출이 1회라도 중단된 경우
  S0: 최종 자산 0 이하

[V=0 버그 수정]
  V가 0 이하가 되면 밴드 비활성(매매 중단), 인출 중단.
  기존에는 V=0 → upper=0 → 주식 전량 매도 → Pool 고갈 → 진짜 파산
  수정 후: V=0이면 주식 그대로 보유, 인출만 중단
"""

import json
import time
import multiprocessing as mp
from itertools import product
from pathlib import Path

import numpy as np
import pandas as pd

# ─── 경로 ──────────────────────────────────────────────────────
DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
OUT_FILE = Path("D:/justkeepbuyingtqqq/web/public/data/vr_sweep.json")

# ─── 공통 파라미터 ─────────────────────────────────────────────
INITIAL       = 1_000_000_000
SIM_YEARS     = 20
EXP_RATIO     = 0.0088

VR_BAND       = 0.15
VR_POOL_LIMIT = 0.25
VR_CYCLE_DAYS = 10

EMA_N      = 200
EMA_CONSEC = 15
DYN_RATES  = (0.003, 0.005, 0.007)
DYN_THRS   = (5_000_000_000, 10_000_000_000)

# ─── 스윕 변수 ─────────────────────────────────────────────────
G_VALUES         = [20, 30, 40, 50, 60, 70, 80, 90, 100]
P_RATIOS_PCT     = [10, 20, 30, 40, 50, 60, 70, 80]
MONTHLY_RATES_PM = [5, 10, 15]   # per-mille: 5→0.5%, 10→1.0%, 15→1.5%


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
    dates      = pd.DatetimeIndex(ndx["Date"])

    ret = np.diff(ndx_closes) / ndx_closes[:-1]
    ret = np.insert(ret, 0, 0.0)
    daily_drag = EXP_RATIO / 252
    factor     = (1.0 + ret * 3.0) * (1.0 - daily_drag)
    factor[0]  = 1.0
    ndx3x      = 100.0 * np.cumprod(factor)

    n      = len(ndx_closes)
    alpha  = 2.0 / (EMA_N + 1)
    ema200 = np.full(n, np.nan)
    ema_v  = ndx_closes[0]
    for i in range(n):
        ema_v    = alpha * ndx_closes[i] + (1 - alpha) * ema_v
        if i >= EMA_N - 1:
            ema200[i] = ema_v

    return ndx3x, ndx_closes, ema200, dates


def get_valid_starts(ndx3x, ema200, dates):
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    seen, result = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen and i >= first_valid:
            seen.add(k)
            if (len(ndx3x) - i) / 252 >= SIM_YEARS:
                result.append(i)
    return result


# ═══════════════════════════════════════════════════════════════
# VR 인출식 시뮬레이션 (V=0 버그 수정)
# ═══════════════════════════════════════════════════════════════

def run_vr(ndx3x, dates, start_idx, g_val, p_ratio, monthly_rate):
    """
    파라미터:
      g_val        : 그라디언트 (V 상승 기울기)
      p_ratio      : 초기 P 비율 (0.10~0.80)
      monthly_rate : 월 인출률 (0.005, 0.010, 0.015)

    사이클 공식:
      new_V = V + P/G - cycle_wd
      V=0이 되면 밴드 비활성 → 매매 중단, 인출 중단
    """
    n        = len(ndx3x)
    sim_len  = min(n - start_idx, int(SIM_YEARS * 252))
    cycle_wd = INITIAL * monthly_rate / 2   # 사이클당 (월 2사이클)

    V              = INITIAL * (1.0 - p_ratio)
    P              = INITIAL * p_ratio
    shares         = V / ndx3x[start_idx]
    upper          = V * (1 + VR_BAND)
    lower          = V * (1 - VR_BAND)
    pool_after_wd  = P
    days_in_cycle  = 0
    total_withdrawn = 0.0
    ever_insolvent  = False   # Pool 소진으로 인출 미달 발생
    monthly_snaps   = []
    last_snap_month = None

    def do_cycle_start(V_cur, P_cur):
        nonlocal ever_insolvent
        new_V = V_cur + P_cur / g_val - cycle_wd

        if new_V <= 0:
            # V가 0 이하 → 더 이상 리밸런싱 중단
            # 남은 Pool에서 가능한 만큼 인출
            wd_actual = min(P_cur, cycle_wd)
            new_P     = max(0.0, P_cur - wd_actual)
            if P_cur < cycle_wd:
                ever_insolvent = True
            # upper=inf: 상단 밴드 매도 없음, lower=0: 하단 매수 없음
            return 0.0, new_P, float("inf"), 0.0, wd_actual

        # 정상 사이클
        wd_actual = cycle_wd
        new_P     = P_cur - cycle_wd
        if P_cur < cycle_wd:
            wd_actual      = P_cur
            new_P          = 0.0
            ever_insolvent = True

        new_upper = new_V * (1 + VR_BAND)
        new_lower = new_V * (1 - VR_BAND)
        return new_V, new_P, new_upper, new_lower, wd_actual

    # 첫 사이클
    V, P, upper, lower, wd0 = do_cycle_start(V, P)
    total_withdrawn += wd0
    pool_after_wd    = P

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        price    = ndx3x[ci]
        port_val = shares * price

        # V>0일 때만 밴드 체크
        if V > 0:
            if port_val > upper:
                excess  = port_val - V
                shares -= excess / price
                P      += excess
                pool_after_wd = P
            elif port_val < lower and pool_after_wd > 0:
                needed     = V - port_val
                buy_amount = min(needed, pool_after_wd * VR_POOL_LIMIT)
                if buy_amount > 0 and P >= buy_amount:
                    shares        += buy_amount / price
                    P             -= buy_amount
                    pool_after_wd -= buy_amount

        days_in_cycle += 1
        if days_in_cycle >= VR_CYCLE_DAYS:
            days_in_cycle = 0
            V, P, upper, lower, wd = do_cycle_start(V, P)
            total_withdrawn += wd
            pool_after_wd    = P

        cur_month = (dates[ci].year, dates[ci].month)
        if cur_month != last_snap_month:
            monthly_snaps.append(shares * price + P)
            last_snap_month = cur_month

    ci_end       = min(start_idx + sim_len - 1, n - 1)
    final_assets = shares * ndx3x[ci_end] + P
    n_months     = len(monthly_snaps)
    actual_yr    = n_months / 12
    cagr = ((final_assets / INITIAL) ** (1.0 / actual_yr) - 1.0) * 100 \
           if actual_yr > 0 and final_assets > 0 else -100.0

    return {
        "final":     final_assets,
        "withdrawn": total_withdrawn,
        "insolvent": ever_insolvent,
        "cagr":      cagr,
    }


# ═══════════════════════════════════════════════════════════════
# EMA200 기준선 (S0)
# ═══════════════════════════════════════════════════════════════

def run_s0(ndx3x, ndx_closes, ema200, dates, start_idx):
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    ema_init = ema200[start_idx]
    if np.isnan(ema_init) or ndx_closes[start_idx] >= ema_init:
        is_invested = True
        shares      = INITIAL / ndx3x[start_idx]
        cash        = 0.0
    else:
        is_invested = False
        shares      = 0.0
        cash        = float(INITIAL)

    consec_below    = 0
    total_withdrawn = 0.0
    monthly_snaps   = []
    last_snap_month = None
    last_wd_month   = None

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        price   = ndx3x[ci]
        ema_val = ema200[ci]

        if not np.isnan(ema_val):
            below        = ndx_closes[ci] < ema_val
            consec_below = consec_below + 1 if below else 0

            if is_invested and consec_below >= EMA_CONSEC:
                cash         = shares * price
                shares       = 0.0
                is_invested  = False
                consec_below = 0
            elif not is_invested and not below:
                shares      = cash / price
                cash        = 0.0
                is_invested = True

        cur_month = (dates[ci].year, dates[ci].month)
        if cur_month != last_wd_month and j > 0:
            total_assets = shares * price + cash
            rate = DYN_RATES[0] if total_assets < DYN_THRS[0] \
                   else DYN_RATES[1] if total_assets < DYN_THRS[1] \
                   else DYN_RATES[2]
            wd = total_assets * rate
            if is_invested:
                shares = max(0.0, shares - wd / price)
            else:
                cash = max(0.0, cash - wd)
            total_withdrawn += wd
            last_wd_month = cur_month

        if cur_month != last_snap_month:
            monthly_snaps.append(shares * price + cash)
            last_snap_month = cur_month

        if shares * price + cash <= 0:
            break

    ci_end       = min(start_idx + sim_len - 1, n - 1)
    final_assets = shares * ndx3x[ci_end] + cash
    n_months     = len(monthly_snaps)
    actual_yr    = n_months / 12
    cagr = ((final_assets / INITIAL) ** (1.0 / actual_yr) - 1.0) * 100 \
           if actual_yr > 0 and final_assets > 0 else -100.0

    return {
        "final":     final_assets,
        "withdrawn": total_withdrawn,
        "insolvent": final_assets <= 0,
        "cagr":      cagr,
    }


# ═══════════════════════════════════════════════════════════════
# 요약 통계
# ═══════════════════════════════════════════════════════════════

def summarize(vals):
    insolvents = sum(1 for v in vals if v["insolvent"])
    total      = len(vals)
    finals     = sorted(v["final"] for v in vals)
    wds        = [v["withdrawn"] for v in vals]
    cagrs      = [v["cagr"] for v in vals]
    n = len(finals)
    return {
        "survival":  round((total - insolvents) / total * 100, 1),
        "insolvent": insolvents,
        "med":       round(finals[n // 2] / 1e8, 1) if finals else 0,
        "avg":       round(sum(finals) / n / 1e8, 1) if finals else 0,
        "p25":       round(finals[n // 4] / 1e8, 1) if finals else 0,
        "p75":       round(finals[n * 3 // 4] / 1e8, 1) if finals else 0,
        "avg_wd":    round(sum(wds) / len(wds) / 1e8, 2) if wds else 0,
        "avg_cagr":  round(sum(cagrs) / len(cagrs), 2) if cagrs else 0,
    }


# ═══════════════════════════════════════════════════════════════
# multiprocessing
# ═══════════════════════════════════════════════════════════════

_ndx3x = _dates = _valid_starts = None

def _initializer():
    global _ndx3x, _dates, _valid_starts
    ndx3x, ndx_closes, ema200, dates = load_data()
    _ndx3x        = ndx3x
    _dates        = dates
    _valid_starts = get_valid_starts(ndx3x, ema200, dates)


def _worker(combo):
    g, p_pct, r_pm = combo
    results = [
        run_vr(_ndx3x, _dates, si,
               g_val=g,
               p_ratio=p_pct / 100.0,
               monthly_rate=r_pm / 1000.0)
        for si in _valid_starts
    ]
    return {"g": g, "p": p_pct, "r": r_pm, **summarize(results)}


# ═══════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════

def main():
    t0     = time.time()
    combos = list(product(G_VALUES, P_RATIOS_PCT, MONTHLY_RATES_PM))

    print("=" * 65)
    print(f"VR 인출식 파라미터 스윕  →  {OUT_FILE.name}")
    print(f"  G {len(G_VALUES)}가지 × P비율 {len(P_RATIOS_PCT)}가지 "
          f"× 인출률 {len(MONTHLY_RATES_PM)}가지 = {len(combos)}조합")
    print("=" * 65)

    # ── 데이터 로드 (메인 프로세스 S0용) ──────────────────────
    ndx3x, ndx_closes, ema200, dates = load_data()
    valid_starts = get_valid_starts(ndx3x, ema200, dates)
    print(f"유효 진입 시점: {len(valid_starts)}개\n")

    # ── S0 계산 ────────────────────────────────────────────────
    print("S0 (EMA200 기준선) 계산 중...")
    s0_res  = [run_s0(ndx3x, ndx_closes, ema200, dates, si) for si in valid_starts]
    s0_stat = summarize(s0_res)
    print(f"  생존율={s0_stat['survival']}%  중앙값={s0_stat['med']}억  "
          f"평균인출={s0_stat['avg_wd']}억\n")

    # ── VR 스윕 (병렬) ─────────────────────────────────────────
    n_procs = max(1, min(mp.cpu_count() - 1, len(combos)))
    print(f"VR 스윕: {len(combos)}가지 조합, {n_procs}프로세스 병렬 처리 중...")
    t1 = time.time()

    vr_rows = []
    with mp.Pool(n_procs, initializer=_initializer) as pool:
        for i, row in enumerate(pool.imap_unordered(_worker, combos, chunksize=3)):
            vr_rows.append(row)
            done = i + 1
            if done % 36 == 0 or done == len(combos):
                elapsed = time.time() - t1
                eta     = elapsed / done * (len(combos) - done)
                print(f"  {done:>3}/{len(combos)}  경과 {elapsed:.0f}s  "
                      f"예상잔여 {eta:.0f}s")

    # ── 저장 ────────────────────────────────────────────────────
    vr_rows.sort(key=lambda x: (x["r"], x["g"], x["p"]))

    out = {
        "meta": {
            "initial":       INITIAL,
            "sim_years":     SIM_YEARS,
            "n_cohorts":     len(valid_starts),
            "band":          VR_BAND,
            "pool_limit":    VR_POOL_LIMIT,
            "cycle_days":    VR_CYCLE_DAYS,
            "g_values":      G_VALUES,
            "p_ratios":      P_RATIOS_PCT,
            "monthly_rates": MONTHLY_RATES_PM,
        },
        "s0": s0_stat,
        "vr": vr_rows,
    }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    kb = OUT_FILE.stat().st_size / 1024
    print(f"\n저장: {OUT_FILE}  ({kb:.1f} KB)")
    print(f"총 소요: {time.time() - t0:.1f}초")
    print("=" * 65)


if __name__ == "__main__":
    main()
