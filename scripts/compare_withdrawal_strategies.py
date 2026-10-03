"""
compare_withdrawal_strategies.py

두 인출 전략 백테스트 비교:

A안 — justkeepbuyingtqqq (SP500 드로다운 기반)
  - 초기 자산 전액 NDX 3x 투자
  - 매월 포트폴리오 × 1% 인출
  - SP500 -20%: 인출 중단 → 주식 보유 유지
  - SP500 -50%: 더 깊은 하락 모드 (인출 중단)
  - SP500 회복 시 인출 재개

B안 — mcv-nextjs tqqq-backtest (NDX 200MA 기반)
  - NDX 200MA 아래: 전량 현금 전환 + 외화RP 이자
  - NDX 200MA 이상 회복: 재매수
  - 매월 포트폴리오 × 1% 인출 (생활비 캡 적용)
  - 세금: 수익분만 22%, 250만원 기본공제 연말 정산
  - 생활비 캡: 300만 + 1억당 20만 (상한 1500만)
  - 현금 2년치 미만 시 단계별 생활비 축소
  - 총자산 20억 초과분 → VOO(S&P500) 분산

동일 시작 조건: 초기 자산 10억, NDX 3x
월별 코호트: 1971년 3월 ~ (MA200 계산 가능한 시점부터)
시뮬레이션 기간: 20년

결과: web/public/data/withdrawal_comparison.json
"""

import json
import math
import time
import numpy as np
import pandas as pd
from pathlib import Path

# ─── 경로 ──────────────────────────────────────────────────────
DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/justkeepbuyingtqqq/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_comparison.json")

# ─── 공통 파라미터 ──────────────────────────────────────────────
INITIAL    = 1_000_000_000   # 10억 원
RATE       = 0.01            # 월 1% 인출
SIM_YEARS  = 20
EXP_RATIO  = 0.0088          # TQQQ 연 운용보수

# A안 파라미터
SP_STOP_DD = -0.20   # SP500 -20%: 인출 중단
SP_DEEP_DD = -0.50   # SP500 -50%: 깊은 하락 모드

# B안 파라미터
MA_N        = 200
MA_THR      = 0.00       # 0%: MA200 터치 시 재매수
TAX_RATE    = 0.22       # 양도소득세 22%
DEDUCTION   = 2_500_000  # 250만원 기본공제
LIV_BASE    = 3_000_000  # 월 기본 생활비 300만
LIV_PER_1B  = 200_000    # 1억당 20만 추가
LIV_MAX     = 15_000_000 # 생활비 상한 1500만
RP_SPREAD   = 0.004      # 외화RP = 기준금리 - 0.4%
RP_TAX_R    = 0.154      # RP 이자 원천징수 15.4%
FEE_RATE    = 0.0007     # 매매 수수료 0.07%
VOO_THR     = 2_000_000_000  # 20억 초과 시 VOO 분산
VOO_KEEP_MO = 36             # VOO 매수 전 현금 보유 개월 수 (3년)
VOO_DIV_MO  = 0.013 / 12    # VOO 월 배당 (연 1.3%)
DIV_TAX_R   = 0.154          # 배당세 원천징수


# ═══════════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════════

def load_data():
    # NDX (splice 보정 포함)
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        scale = ndx.loc[i-1, "Close"] / ndx.loc[i, "Close"]
        ndx.loc[i:, "Close"] *= scale

    ndx_closes = ndx["Close"].values.astype(float)
    dates = pd.DatetimeIndex(ndx["Date"])

    # NDX 3x 합성 (운용보수 포함)
    ret = np.diff(ndx_closes) / ndx_closes[:-1]
    ret = np.insert(ret, 0, 0.0)
    daily_drag = EXP_RATIO / 252
    factor = (1.0 + ret * 3.0) * (1.0 - daily_drag)
    factor[0] = 1.0
    ndx3x = 100.0 * np.cumprod(factor)

    # SP500 (NDX 거래일 기준 ffill)
    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp5_series = sp5.set_index("Date")["Close"]
    sp500 = sp5_series.reindex(dates, method="ffill").values.astype(float)

    # 연방기금금리 (YYYY-MM → float)
    with open(FED_PATH, encoding="utf-8") as f:
        fed_raw = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed_raw}

    # NDX 3x v2 (스왑금리 2× 포함)
    fed_daily_arr = np.array([
        fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 / 252
        for d in dates
    ])
    factor_v2 = (1.0 + ret * 3.0 - 2.0 * fed_daily_arr) * (1.0 - daily_drag)
    factor_v2[0] = 1.0
    ndx3x_v2 = 100.0 * np.cumprod(factor_v2)

    # MA200 미리 계산 (NDX 원가격 기준)
    n = len(ndx_closes)
    ma200 = np.full(n, np.nan)
    window_sum = 0.0
    for i in range(n):
        window_sum += ndx_closes[i]
        if i >= MA_N:
            window_sum -= ndx_closes[i - MA_N]
        if i >= MA_N - 1:
            ma200[i] = window_sum / MA_N

    return ndx3x, ndx3x_v2, ndx_closes, ma200, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════════
# A안 시뮬레이션
# ═══════════════════════════════════════════════════════════════

def run_strategy_a(ndx3x, dates, sp500, start_idx):
    """
    SP500 드로다운 기반 인출 중단 전략

    상태:
      WITHDRAW  : 매월 포트폴리오 × 1% 인출
      HOLD      : SP500 -20% 이하 → 인출 중단
      HOLD_DEEP : SP500 -50% 이하 → 인출 중단 (더 깊은 하락)

    HOLD/HOLD_DEEP 중에는 주식을 그대로 보유.
    현금 버퍼 없음 (단순 비교 기준).
    """
    n = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    shares = INITIAL / ndx3x[start_idx]
    sp500_peak = sp500[start_idx]

    state = "WITHDRAW"
    total_withdrawn = 0.0
    monthly_snapshots = []
    last_snap_month = None
    last_withdraw_month = None

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        px = ndx3x[ci]
        sp = sp500[ci]
        port_val = shares * px

        if port_val <= 0 or px <= 0:
            break

        # SP500 피크 업데이트
        if sp > sp500_peak:
            sp500_peak = sp
        sp_dd = (sp / sp500_peak - 1.0) if sp500_peak > 0 else 0.0

        # 상태 전이
        if state == "WITHDRAW":
            if sp_dd <= SP_DEEP_DD:
                state = "HOLD_DEEP"
            elif sp_dd <= SP_STOP_DD:
                state = "HOLD"
        elif state == "HOLD":
            if sp_dd <= SP_DEEP_DD:
                state = "HOLD_DEEP"
            elif sp_dd > SP_STOP_DD:
                state = "WITHDRAW"
                sp500_peak = sp  # 회복 후 피크 리셋
        elif state == "HOLD_DEEP":
            if sp_dd > SP_STOP_DD:
                state = "WITHDRAW"
                sp500_peak = sp

        # 월별 인출 (매월 첫 거래일)
        cur_month = (dates[ci].year, dates[ci].month)
        if state == "WITHDRAW" and cur_month != last_withdraw_month and j > 0:
            withdrawal = shares * px * RATE
            shares = max(0.0, shares - withdrawal / px)
            total_withdrawn += withdrawal
            last_withdraw_month = cur_month

        # 월별 스냅샷
        if cur_month != last_snap_month:
            monthly_snapshots.append({
                "date":  dates[ci].strftime("%Y-%m"),
                "value": round(shares * px / 1e8, 4),
                "state": state,
            })
            last_snap_month = cur_month

        if shares <= 0:
            break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    final_val = shares * ndx3x[ci_end]
    min_val = min((s["value"] for s in monthly_snapshots), default=0.0)
    n_months = len(monthly_snapshots)
    actual_yr = n_months / 12
    cagr = ((final_val / INITIAL) ** (1.0 / actual_yr) - 1.0) * 100 if actual_yr > 0 and final_val > 0 else -100.0

    return {
        "final":     round(final_val / 1e8, 2),
        "withdrawn": round(total_withdrawn / 1e8, 2),
        "min":       round(min_val, 4),
        "bankrupt":  final_val <= 0,
        "cagr":      round(cagr, 2),
        "monthly":   monthly_snapshots,
    }


# ═══════════════════════════════════════════════════════════════
# B안 시뮬레이션
# ═══════════════════════════════════════════════════════════════

def run_strategy_b(ndx3x, ndx_closes, ma200, dates, sp500, fed_rates, start_idx):
    """
    NDX 200MA 기반 현금 전환 전략

    투자 상태(is_invested=True):
      - 매월 포트폴리오 × 1% 인출 → 세금 처리 후 생활비
      - NDX < MA200: 전량 매도 → 현금(cash)
    현금 상태(is_invested=False):
      - 외화RP 이자 수령 (기준금리 - 0.4%)
      - 생활비는 현금(cash_reserve 우선)에서 차감
      - NDX > MA200: 전액 재매수

    세금: 수익분만 22%, 250만원 기본공제 연말 정산
    생활비 캡: 300만 + 1억당 20만 (상한 1500만)
    적응형 생활비: 현금 2년치 미만 시 단계별 축소
    VOO 분산: 총자산 20억 초과 + 현금 3년치 초과분
    """
    n = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기화 ──
    ma_init = ma200[start_idx]
    if not np.isnan(ma_init) and ndx_closes[start_idx] < ma_init:
        is_invested = False
        cash = float(INITIAL)
        shares = 0.0
    else:
        is_invested = True
        shares = INITIAL / ndx3x[start_idx]
        cash = 0.0

    avg_cost       = ndx3x[start_idx]   # 평균 매수 단가 (ETF 가격 기준)
    cash_reserve   = 0.0   # 잉여 현금 (초과 인출분 적립)
    tax_reserve    = 0.0   # 연말까지 유예 중인 세금
    annual_gain    = 0.0   # 연간 양도차익 누계
    last_tax_year  = -1
    cum_tax        = 0.0
    cum_fees       = 0.0
    cum_withdrawn  = 0.0

    # VOO (S&P500 지수 분산)
    voo_shares     = 0.0
    voo_avg_cost   = 0.0

    monthly_snapshots = []
    last_snap_month   = None
    last_mon_month    = None   # 마지막 월 처리 완료 월
    trading_day_in_month = 0
    monthly_living_used  = 0.0
    monthly_living_cap   = 0.0

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        cur_date  = dates[ci]
        cur_month = (cur_date.year, cur_date.month)
        month_key = cur_date.strftime("%Y-%m")

        # ── 월초 처리 ──
        if cur_month != last_mon_month:
            trading_day_in_month = 0
            monthly_living_used  = 0.0

            # RP 이자 (cashReserve + taxReserve에 월초 적용)
            annual_rate_pct = fed_rates.get(month_key, 3.0)
            rp_annual = max(0.0, annual_rate_pct / 100.0 - RP_SPREAD)
            rp_monthly = rp_annual / 12.0
            if cash_reserve > 0:
                gross = cash_reserve * rp_monthly
                rp_tax = gross * RP_TAX_R
                cum_tax    += rp_tax
                cash_reserve += gross - rp_tax
            if tax_reserve > 0:
                gross = tax_reserve * rp_monthly
                rp_tax = gross * RP_TAX_R
                cum_tax    += rp_tax
                cash_reserve += gross - rp_tax  # 이자 수익은 내 몫

            # 연말 세금 정산
            if last_tax_year >= 0 and cur_date.year > last_tax_year:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0
            if last_tax_year < 0 or cur_date.year > last_tax_year:
                last_tax_year = cur_date.year

            # VOO 배당 (월초)
            spx_now = sp500[ci]
            if voo_shares > 0 and spx_now > 0:
                voo_val_now = voo_shares * spx_now
                gross_div = voo_val_now * VOO_DIV_MO
                div_tax   = gross_div * DIV_TAX_R
                cum_tax       += div_tax
                cash_reserve  += gross_div - div_tax

            # 생활비 캡 계산 (월초 고정)
            pv_check = shares * ndx3x[ci] if is_invested else cash
            voo_check = voo_shares * spx_now if voo_shares > 0 else 0.0
            total_assets = pv_check + cash_reserve + tax_reserve + voo_check
            scaled = LIV_BASE + int(total_assets / 1e8) * LIV_PER_1B
            monthly_living_cap = min(scaled, LIV_MAX)

            last_mon_month = cur_month

        trading_day_in_month += 1

        # ── 200MA 신호 처리 (일별) ──
        ma_val = ma200[ci]
        if not np.isnan(ma_val) and ma_val > 0:
            divergence = (ndx_closes[ci] - ma_val) / ma_val

            if is_invested and divergence < 0:
                # 매도 → 현금 전환 (수수료만, 세금은 인출 시)
                sell_val = shares * ndx3x[ci]
                fee = sell_val * FEE_RATE
                cum_fees += fee
                cash = sell_val - fee
                shares = 0.0
                is_invested = False

            elif not is_invested and divergence > MA_THR:
                # 재매수 (현금 전체)
                buy_cash = cash
                fee = buy_cash * FEE_RATE
                cum_fees += fee
                shares = (buy_cash - fee) / ndx3x[ci]
                avg_cost = ndx3x[ci]
                cash = 0.0
                is_invested = True

        # ── 월초 인출 & 생활비 (거래일 1번째) ──
        if trading_day_in_month == 1 and j > 0:
            if is_invested:
                # 투자 중: 포트폴리오에서 인출
                pv = shares * ndx3x[ci]
                withdrawal = pv * RATE

                # 수익분 과세
                shares_sold = withdrawal / ndx3x[ci]
                cost_basis  = shares_sold * avg_cost
                gain        = max(0.0, withdrawal - cost_basis)
                annual_gain += gain
                tax_w        = gain * TAX_RATE
                tax_reserve += tax_w
                after_tax    = withdrawal - tax_w
                shares = max(0.0, shares - shares_sold)

                # 생활비 처리 (캡 기준)
                monthly_remaining = max(0.0, monthly_living_cap - monthly_living_used)
                if after_tax >= monthly_remaining:
                    living_expense  = monthly_remaining
                    cash_reserve   += after_tax - living_expense
                else:
                    shortage    = monthly_remaining - after_tax
                    from_res    = min(shortage, cash_reserve)
                    cash_reserve -= from_res
                    living_expense = after_tax + from_res

                monthly_living_used += living_expense
                cum_withdrawn       += living_expense

            else:
                # 현금 보유 중: 적응형 생활비 (현금 잔고 기준 축소)
                total_cash = cash + cash_reserve
                yearly_liv = monthly_living_cap * 12
                if yearly_liv > 0:
                    years_left = total_cash / yearly_liv
                    if years_left < 0.5:
                        living_ratio = 0.3
                    elif years_left < 1.0:
                        living_ratio = 0.5
                    elif years_left < 2.0:
                        living_ratio = 0.7
                    else:
                        living_ratio = 1.0
                else:
                    living_ratio = 1.0

                monthly_remaining = max(0.0, monthly_living_cap * living_ratio - monthly_living_used)
                living_expense = monthly_remaining

                if cash_reserve >= living_expense:
                    cash_reserve -= living_expense
                else:
                    from_res     = cash_reserve
                    cash_reserve = 0.0
                    cash         = max(0.0, cash - (living_expense - from_res))

                monthly_living_used += living_expense
                cum_withdrawn       += living_expense

        # ── RP 일별 이자 (현금 보유 중 매도 현금에만) ──
        if not is_invested and cash > 0:
            annual_rate_pct = fed_rates.get(month_key, 3.0)
            rp_daily = max(0.0, annual_rate_pct / 100.0 - RP_SPREAD) / 252
            gross    = cash * rp_daily
            rp_tax   = gross * RP_TAX_R
            cum_tax  += rp_tax
            cash     += gross - rp_tax

        # ── VOO 매수 (매일 체크) ──
        if cash_reserve > 0 and monthly_living_cap > 0:
            pv_now  = shares * ndx3x[ci] if is_invested else cash
            voo_now = voo_shares * sp500[ci] if voo_shares > 0 else 0.0
            total_assets2 = pv_now + cash_reserve + tax_reserve + voo_now
            if total_assets2 >= VOO_THR:
                keep_cash = monthly_living_cap * VOO_KEEP_MO
                excess    = cash_reserve - keep_cash
                if excess > 0 and sp500[ci] > 0:
                    buy_sh = excess / sp500[ci]
                    if voo_shares == 0:
                        voo_avg_cost = sp500[ci]
                    else:
                        voo_avg_cost = (voo_avg_cost * voo_shares + sp500[ci] * buy_sh) / (voo_shares + buy_sh)
                    voo_shares   += buy_sh
                    cash_reserve -= excess

        # ── 월별 스냅샷 ──
        if cur_month != last_snap_month:
            pv_snap  = shares * ndx3x[ci] if is_invested else cash
            voo_snap = voo_shares * sp500[ci] if voo_shares > 0 else 0.0
            total_snap = pv_snap + cash_reserve + voo_snap
            monthly_snapshots.append({
                "date":       cur_date.strftime("%Y-%m"),
                "value":      round(total_snap / 1e8, 4),
                "is_invested": is_invested,
            })
            last_snap_month = cur_month

        # 파산 체크
        pv_chk = shares * ndx3x[ci] if is_invested else cash
        if pv_chk + cash_reserve + cash <= 0:
            break

    # ── 최종 값 ──
    ci_end   = min(start_idx + sim_len - 1, n - 1)
    pv_end   = shares * ndx3x[ci_end] if is_invested else cash
    voo_end  = voo_shares * sp500[ci_end] if voo_shares > 0 else 0.0
    final_val = pv_end + cash_reserve + voo_end
    min_val  = min((s["value"] for s in monthly_snapshots), default=0.0)

    n_months = len(monthly_snapshots)
    actual_yr = n_months / 12
    cagr = ((final_val / INITIAL) ** (1.0 / actual_yr) - 1.0) * 100 if actual_yr > 0 and final_val > 0 else -100.0

    return {
        "final":     round(final_val / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val, 4),
        "bankrupt":  final_val <= 0,
        "cagr":      round(cagr, 2),
        "monthly":   monthly_snapshots,
    }


# ═══════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--v2", action="store_true", help="스왑금리 포함 버전 생성")
    args = parser.parse_args()
    suffix = "_v2" if args.v2 else ""
    out_path = OUT_PATH.parent / f"withdrawal_comparison{suffix}.json"

    t0 = time.time()
    print("=" * 65)
    print("인출 전략 비교 백테스트")
    print(f"  초기자산={INITIAL/1e8:.0f}억  월인출률={RATE*100:.0f}%  기간={SIM_YEARS}년")
    print(f"  {'스왑금리 포함 (v2)' if args.v2 else '운용보수만 (standard)'}")
    print("=" * 65)

    print("\n[1] 데이터 로드 ...")
    ndx3x, ndx3x_v2, ndx_closes, ma200, dates, sp500, fed_rates = load_data()
    prices = ndx3x_v2 if args.v2 else ndx3x
    print(f"    NDX: {len(dates)}일  {dates[0].date()} ~ {dates[-1].date()}")

    # MA200 계산 가능한 첫 거래일 이후만 코호트로 사용
    first_valid = int(np.where(~np.isnan(ma200))[0][0])
    monthly_starts = [i for i in get_monthly_starts(dates) if i >= first_valid]
    print(f"    유효 코호트 시작 수: {len(monthly_starts)}")

    print("\n[2] 코호트별 시뮬레이션 ...")
    cohorts = []
    for k, si in enumerate(monthly_starts):
        # 데이터가 20년치 이상 남지 않은 시작점은 제외
        remaining_years = (len(ndx3x) - si) / 252
        if remaining_years < SIM_YEARS:
            continue

        start_label = dates[si].strftime("%Y-%m")

        res_a = run_strategy_a(prices, dates, sp500, si)
        res_b = run_strategy_b(prices, ndx_closes, ma200, dates, sp500, fed_rates, si)

        cohort = {
            "start": start_label,
            "a": {k2: v for k2, v in res_a.items() if k2 != "monthly"},
            "b": {k2: v for k2, v in res_b.items() if k2 != "monthly"},
            "_monthly_a": res_a["monthly"],
            "_monthly_b": res_b["monthly"],
        }
        cohorts.append(cohort)

        if (k + 1) % 100 == 0:
            print(f"    {k+1}/{len(monthly_starts)}  ({start_label}) "
                  f"A={res_a['final']:.0f}억  B={res_b['final']:.0f}억")

    print(f"    완료: {len(cohorts)}개 코호트")

    # ── 통계 요약 ──
    def summarize(key):
        vals = [c[key] for c in cohorts]
        bankrupt   = sum(1 for v in vals if v["bankrupt"])
        total      = len(vals)
        finals     = [v["final"]     for v in vals if not v["bankrupt"]]
        withdrawns = [v["withdrawn"] for v in vals]
        mins       = [v["min"]       for v in vals]
        cagrs      = [v["cagr"]      for v in vals if not v["bankrupt"]]
        return {
            "total":         total,
            "bankrupt":      bankrupt,
            "survival_rate": round((total - bankrupt) / total * 100, 1),
            "avg_final":     round(sum(finals) / len(finals), 2) if finals else 0,
            "med_final":     round(sorted(finals)[len(finals)//2], 2) if finals else 0,
            "avg_withdrawn": round(sum(withdrawns) / len(withdrawns), 2) if withdrawns else 0,
            "avg_min":       round(sum(mins) / len(mins), 4) if mins else 0,
            "min_of_min":    round(min(mins), 4) if mins else 0,
            "avg_cagr":      round(sum(cagrs) / len(cagrs), 2) if cagrs else 0,
        }

    summary_a = summarize("a")
    summary_b = summarize("b")

    print("\n[3] 결과 요약")
    print(f"    {'지표':<22} {'A안':>10} {'B안':>10}")
    print(f"    {'-'*42}")
    for label, va, vb in [
        ("코호트 수",         summary_a["total"],         summary_b["total"]),
        ("파산 수",           summary_a["bankrupt"],       summary_b["bankrupt"]),
        ("생존율 (%)",        summary_a["survival_rate"],  summary_b["survival_rate"]),
        ("평균 최종값 (억)",  summary_a["avg_final"],      summary_b["avg_final"]),
        ("중앙값 최종 (억)", summary_a["med_final"],      summary_b["med_final"]),
        ("평균 인출 총액 (억)", summary_a["avg_withdrawn"], summary_b["avg_withdrawn"]),
        ("최소 최솟값 (억)",  summary_a["min_of_min"],     summary_b["min_of_min"]),
        ("평균 CAGR (%)",     summary_a["avg_cagr"],       summary_b["avg_cagr"]),
    ]:
        print(f"    {label:<22} {va:>10} {vb:>10}")

    # ── JSON 저장 ──
    # monthly_detail: 주요 코호트 (닷컴버블 전후, 금융위기 등) 저장
    KEY_COHORTS = {
        "1996-10", "1999-03", "2000-03", "2003-03",
        "2007-10", "2009-03", "2019-01", "2020-03",
        "2021-01",
    }
    # worst/best/median 코호트 추가
    sorted_by_min_a = sorted(cohorts, key=lambda c: c["a"]["min"])
    sorted_by_min_b = sorted(cohorts, key=lambda c: c["b"]["min"])
    for c in [sorted_by_min_a[0], sorted_by_min_b[0],
               cohorts[len(cohorts)//2]]:
        KEY_COHORTS.add(c["start"])

    monthly_detail = {}
    for c in cohorts:
        if c["start"] in KEY_COHORTS:
            monthly_detail[c["start"]] = {
                "a": c["_monthly_a"],
                "b": c["_monthly_b"],
            }

    # cohorts에서 monthly 제거 후 저장
    cohorts_clean = [
        {"start": c["start"], "a": c["a"], "b": c["b"]}
        for c in cohorts
    ]

    output = {
        "meta": {
            "generated":   str(dates[-1].date()),
            "initial_10b": 1,   # 10억 = 1단위
            "sim_years":   SIM_YEARS,
            "monthly_rate": RATE,
            "strategy_a_desc": "SP500 -20% 인출중단 | 월1% NDX3x",
            "strategy_b_desc": "NDX MA200 현금전환 | 월1% 세금22% 생활비캡",
        },
        "summary": {
            "a": summary_a,
            "b": summary_b,
        },
        "cohorts": cohorts_clean,
        "monthly_detail": monthly_detail,
    }

    class NpEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, (np.bool_,)):
                return bool(obj)
            if isinstance(obj, np.integer):
                return int(obj)
            if isinstance(obj, np.floating):
                return float(obj)
            return super().default(obj)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"), cls=NpEncoder)

    size_kb = out_path.stat().st_size / 1024
    print(f"\n[4] 저장 완료: {out_path}")
    print(f"    파일 크기: {size_kb:.0f} KB")

    # ── 전체 코호트 월별 데이터 (상세 페이지용) ──
    # 컴팩트 포맷: a=[[value, state(0W/1H/2HD)], ...], b=[[value, inv(0/1)], ...]
    STATE_MAP = {"WITHDRAW": 0, "HOLD": 1, "HOLD_DEEP": 2}
    monthly_all = {}
    for c in cohorts:
        monthly_all[c["start"]] = {
            "a": [[round(s["value"], 4), STATE_MAP.get(s["state"], 0)] for s in c["_monthly_a"]],
            "b": [[round(s["value"], 4), 1 if s["is_invested"] else 0] for s in c["_monthly_b"]],
        }

    monthly_path = out_path.parent / f"withdrawal_monthly{suffix}.json"
    with open(monthly_path, "w", encoding="utf-8") as f:
        json.dump(monthly_all, f, ensure_ascii=False, separators=(",", ":"), cls=NpEncoder)

    m_kb = monthly_path.stat().st_size / 1024
    print(f"    월별 전체 데이터: {monthly_path.name}  ({m_kb:.0f} KB)")
    print(f"    소요 시간: {time.time() - t0:.1f}초")


if __name__ == "__main__":
    main()
