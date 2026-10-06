"""
withdrawal_strategy_sweep.py

인출 전략 아이디어 전수 비교
——————————————————————————

비교할 전략 파라미터:

[Whipsaw 방지 계열]
  B0  기준선 — MA200 threshold=0%
  B1  이격도 버퍼 ±3% (매도 MA-3%, 매수 MA+3%)
  B2  이격도 버퍼 ±5%
  B3  연속일 필터 10일 (MA200 아래 10거래일 연속 시 전환)
  B4  월말 단일 체크 (매월 마지막 거래일만 신호 확인)
  B5  이격도 ±3% + 월말 체크 (복합)

[인출 방식 계열]
  C0  고정 생활비 월 500만 (비율 인출 대신)
  C1  동적 인출률 (자산 구간별 차등: 0.3/0.5/0.7%)
  C2  현금 버퍼 24개월 상시 유지 + MA200 ±3%

[이중 확인 계열]
  D0  SP500 -20% 또는 MA200 이탈 → 인출 중단 (어느 하나)
  D1  SP500 -20% AND MA200 이탈 → 인출 중단 (둘 다)
  D2  MA200 ±5% + SP500 드로다운 -15% 이중 확인

공통 조건:
  초기자산 10억, NDX 3x, 20년 시뮬레이션
  생활비 캡: 300만 + 1억당 20만 (상한 1500만)
  세금: 22%, 기본공제 250만, 외화RP 이자 포함
"""

import json
import time
import numpy as np
import pandas as pd
from pathlib import Path
from dataclasses import dataclass, field

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

# ─── 경로 ──────────────────────────────────────────────────────
DATA_DIR = (_ROOT / "data")
FED_PATH = (_ROOT / "data/fed_funds_rate.json")
OUT_PATH = (_ROOT / "web/public/data/withdrawal_sweep.json")

# ─── 공통 파라미터 ──────────────────────────────────────────────
INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_RATIO  = 0.0088
LIV_BASE   = 3_000_000
LIV_PER_1B = 200_000
LIV_MAX    = 15_000_000
TAX_RATE   = 0.22
DEDUCTION  = 2_500_000
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
VOO_THR    = 2_000_000_000
VOO_KEEP   = 36
VOO_DIV_MO = 0.013 / 12
DIV_TAX_R  = 0.154
MA_N       = 200
SP_STOP    = -0.20   # A안 SP500 인출 중단 기준


# ═══════════════════════════════════════════════════════════════
# 전략 파라미터 정의
# ═══════════════════════════════════════════════════════════════

@dataclass
class StrategyParam:
    name: str
    desc: str
    # MA200 관련
    ma_sell_thr: float = 0.0          # 매도: NDX < MA × (1 - sell_thr)
    ma_buy_thr: float  = 0.0          # 매수: NDX > MA × (1 + buy_thr)
    time_filter_days: int = 0         # 연속일 필터 (0=없음)
    monthly_check: bool = False       # True=월말만 체크
    partial_hedge: float = 1.0        # 현금 전환 비율 (1.0=전량, 0.5=절반)
    # SP500 조합
    sp500_mode: str = "none"          # "none", "or", "and"
    sp500_dd_thr: float = -0.20       # SP500 드로다운 신호 기준
    # 인출 방식
    living_mode: str = "cap"          # "cap"=기존캡, "fixed"=고정, "dynamic"=동적
    fixed_living: float = 5_000_000   # living_mode="fixed"일 때 월 고정액
    dynamic_rates: tuple = (0.003, 0.005, 0.007)  # (low, mid, high)
    dynamic_thrs: tuple = (1_000_000_000, 2_000_000_000)  # 구간 기준 자산
    # 현금 버퍼
    prebuf_months: int = 0            # 사전 현금 버퍼 유지 개월 수


STRATEGIES: list[StrategyParam] = [
    # ── Whipsaw 방지 계열 ──────────────────────────────────────
    StrategyParam("B0", "기준 MA200 (threshold=0%)",
                  ma_sell_thr=0.00, ma_buy_thr=0.00),

    StrategyParam("B1", "이격도 버퍼 ±3%",
                  ma_sell_thr=0.03, ma_buy_thr=0.03),

    StrategyParam("B2", "이격도 버퍼 ±5%",
                  ma_sell_thr=0.05, ma_buy_thr=0.05),

    StrategyParam("B3", "연속일 필터 10일",
                  ma_sell_thr=0.00, ma_buy_thr=0.00, time_filter_days=10),

    StrategyParam("B4", "월말 단일 체크",
                  ma_sell_thr=0.00, ma_buy_thr=0.00, monthly_check=True),

    StrategyParam("B5", "이격도 ±3% + 월말 체크",
                  ma_sell_thr=0.03, ma_buy_thr=0.03, monthly_check=True),

    # ── 인출 방식 계열 ─────────────────────────────────────────
    StrategyParam("C0", "고정 생활비 500만/월 (MA200 ±3%)",
                  ma_sell_thr=0.03, ma_buy_thr=0.03,
                  living_mode="fixed", fixed_living=5_000_000),

    StrategyParam("C1", "동적 인출률 0.3/0.5/0.7% (MA200 ±3%)",
                  ma_sell_thr=0.03, ma_buy_thr=0.03,
                  living_mode="dynamic"),

    StrategyParam("C2", "현금 버퍼 24개월 + MA200 ±3%",
                  ma_sell_thr=0.03, ma_buy_thr=0.03,
                  prebuf_months=24),

    # ── 이중 확인 계열 ─────────────────────────────────────────
    StrategyParam("D0", "SP500 OR MA200 → 인출 중단",
                  ma_sell_thr=0.03, ma_buy_thr=0.03,
                  sp500_mode="or", sp500_dd_thr=-0.20),

    StrategyParam("D1", "SP500 AND MA200 → 인출 중단 (보수적 신호)",
                  ma_sell_thr=0.03, ma_buy_thr=0.03,
                  sp500_mode="and", sp500_dd_thr=-0.20),

    StrategyParam("D2", "SP500 -15% AND MA200 -5% 이중 확인",
                  ma_sell_thr=0.05, ma_buy_thr=0.05,
                  sp500_mode="and", sp500_dd_thr=-0.15),

    # ── 최종 후보 ──────────────────────────────────────────────
    StrategyParam("B3C1", "★ 연속10일 + 동적인출률 (최종 후보)",
                  time_filter_days=10,
                  living_mode="dynamic",
                  dynamic_rates=(0.003, 0.005, 0.007),
                  dynamic_thrs=(1_000_000_000, 2_000_000_000)),
]


# ═══════════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════════

def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i-1, "Close"] / ndx.loc[i, "Close"]

    ndx_closes = ndx["Close"].values.astype(float)
    dates = pd.DatetimeIndex(ndx["Date"])

    ret = np.diff(ndx_closes) / ndx_closes[:-1]
    ret = np.insert(ret, 0, 0.0)
    factor = (1.0 + ret * 3.0) * (1.0 - EXP_RATIO / 252)
    factor[0] = 1.0
    ndx3x = 100.0 * np.cumprod(factor)

    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    n = len(ndx_closes)
    ma200 = np.full(n, np.nan)
    ws = 0.0
    for i in range(n):
        ws += ndx_closes[i]
        if i >= MA_N:
            ws -= ndx_closes[i - MA_N]
        if i >= MA_N - 1:
            ma200[i] = ws / MA_N

    return ndx3x, ndx_closes, ma200, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════════
# 통합 시뮬레이터
# ═══════════════════════════════════════════════════════════════

def run_sim(ndx3x, ndx_closes, ma200, dates, sp500, fed_rates,
            start_idx, p: StrategyParam):
    n = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기 상태 ──
    ma_init = ma200[start_idx]
    if not np.isnan(ma_init) and ndx_closes[start_idx] < ma_init * (1 - p.ma_sell_thr):
        is_invested = False
        cash = float(INITIAL)
        shares = 0.0
    else:
        is_invested = True
        shares = INITIAL / ndx3x[start_idx]
        cash = 0.0

    avg_cost     = ndx3x[start_idx]
    cash_reserve = float(INITIAL * p.prebuf_months / 12 * 0.01) if p.prebuf_months > 0 else 0.0
    # 사전 버퍼가 있으면 주식에서 그만큼 차감
    if p.prebuf_months > 0 and is_invested:
        buf_val = LIV_BASE * p.prebuf_months
        buf_val = min(buf_val, INITIAL * 0.5)
        cash_reserve = buf_val
        shares = max(0.0, shares - buf_val / ndx3x[start_idx])

    tax_reserve   = 0.0
    annual_gain   = 0.0
    last_tax_year = -1
    cum_tax        = 0.0
    cum_fees       = 0.0
    cum_withdrawn  = 0.0

    voo_shares   = 0.0
    voo_avg_cost = 0.0

    sp500_peak   = sp500[start_idx]

    monthly_snapshots = []
    last_snap_month   = None
    last_mon_month    = None
    trading_day_in_month = 0
    monthly_living_used  = 0.0
    monthly_living_cap   = 0.0
    trade_count = 0

    # 연속일 필터용
    below_ma_days = 0
    above_ma_days = 0

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

            # RP 이자
            annual_rate_pct = fed_rates.get(month_key, 3.0)
            rp_annual  = max(0.0, annual_rate_pct / 100.0 - RP_SPREAD)
            rp_monthly = rp_annual / 12.0
            if cash_reserve > 0:
                gross = cash_reserve * rp_monthly
                cum_tax      += gross * RP_TAX_R
                cash_reserve += gross * (1 - RP_TAX_R)
            if tax_reserve > 0:
                gross = tax_reserve * rp_monthly
                cum_tax      += gross * RP_TAX_R
                cash_reserve += gross * (1 - RP_TAX_R)

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

            # VOO 배당
            if voo_shares > 0:
                voo_val = voo_shares * sp500[ci]
                gross = voo_val * VOO_DIV_MO
                cum_tax      += gross * DIV_TAX_R
                cash_reserve += gross * (1 - DIV_TAX_R)

            # 생활비 캡 계산
            pv_c = shares * ndx3x[ci] if is_invested else cash
            voo_c = voo_shares * sp500[ci] if voo_shares > 0 else 0.0
            total_c = pv_c + cash_reserve + tax_reserve + voo_c
            if p.living_mode == "cap":
                scaled = LIV_BASE + int(total_c / 1e8) * LIV_PER_1B
                monthly_living_cap = min(scaled, LIV_MAX)
            elif p.living_mode == "fixed":
                monthly_living_cap = p.fixed_living
            else:  # dynamic
                if total_c < p.dynamic_thrs[0]:
                    monthly_living_cap = total_c * p.dynamic_rates[0]
                elif total_c < p.dynamic_thrs[1]:
                    monthly_living_cap = total_c * p.dynamic_rates[1]
                else:
                    monthly_living_cap = min(total_c * p.dynamic_rates[2], LIV_MAX)

            last_mon_month = cur_month

        trading_day_in_month += 1

        # ── SP500 피크 ──
        if sp500[ci] > sp500_peak:
            sp500_peak = sp500[ci]
        sp500_dd = (sp500[ci] / sp500_peak - 1.0) if sp500_peak > 0 else 0.0

        # ── MA200 신호 계산 ──
        ma_val = ma200[ci]
        ma_ok = not np.isnan(ma_val) and ma_val > 0
        divergence = (ndx_closes[ci] - ma_val) / ma_val if ma_ok else 0.0

        # 연속일 카운터 업데이트
        if ma_ok:
            if divergence < -p.ma_sell_thr:
                below_ma_days += 1
                above_ma_days  = 0
            elif divergence > p.ma_buy_thr:
                above_ma_days += 1
                below_ma_days  = 0
            else:
                # 데드존 — 연속일 리셋
                below_ma_days = 0
                above_ma_days = 0

        # 월말 체크 여부 결정
        is_last_day_of_month = False
        if p.monthly_check and ci + 1 < n:
            next_month = (dates[ci + 1].year, dates[ci + 1].month)
            is_last_day_of_month = (next_month != cur_month)
        elif p.monthly_check:
            is_last_day_of_month = True

        do_signal_check = (not p.monthly_check) or is_last_day_of_month

        # ── MA200 신호 처리 ──
        if ma_ok and do_signal_check:
            sell_signal = False
            buy_signal  = False

            if p.time_filter_days > 0:
                sell_signal = (below_ma_days >= p.time_filter_days)
                buy_signal  = (above_ma_days >= p.time_filter_days)
            else:
                sell_signal = (divergence < -p.ma_sell_thr)
                buy_signal  = (divergence > p.ma_buy_thr)

            # SP500 이중 확인 적용
            if p.sp500_mode == "or":
                sell_signal = sell_signal or (sp500_dd <= p.sp500_dd_thr)
                buy_signal  = buy_signal  and (sp500_dd > p.sp500_dd_thr)
            elif p.sp500_mode == "and":
                sell_signal = sell_signal and (sp500_dd <= p.sp500_dd_thr)
                # 재매수는 MA 신호 단독 (AND는 매도만 이중확인)

            if is_invested and sell_signal:
                sell_val = shares * ndx3x[ci]
                fee = sell_val * FEE_RATE
                cum_fees += fee
                cash = sell_val - fee
                shares = 0.0
                is_invested = False
                trade_count += 1
                below_ma_days = 0

            elif not is_invested and buy_signal:
                buy_cash = cash
                fee = buy_cash * FEE_RATE
                cum_fees += fee
                shares = (buy_cash - fee) / ndx3x[ci]
                avg_cost = ndx3x[ci]
                cash = 0.0
                is_invested = True
                trade_count += 1
                above_ma_days = 0

        # ── 월초 인출 & 생활비 ──
        if trading_day_in_month == 1 and j > 0:
            if is_invested:
                pv = shares * ndx3x[ci]
                withdrawal = pv * 0.01   # 기본 월 1%
                # living_mode 오버라이드
                if p.living_mode == "fixed":
                    withdrawal = min(p.fixed_living, pv * 0.02)   # 최대 2% 캡
                elif p.living_mode == "dynamic":
                    withdrawal = monthly_living_cap   # 이미 계산된 캡 사용

                shares_sold = withdrawal / ndx3x[ci]
                cost_basis  = shares_sold * avg_cost
                gain        = max(0.0, withdrawal - cost_basis)
                annual_gain += gain
                tax_w        = gain * TAX_RATE
                tax_reserve += tax_w
                after_tax    = withdrawal - tax_w
                shares = max(0.0, shares - shares_sold)

                monthly_remaining = max(0.0, monthly_living_cap - monthly_living_used)
                if after_tax >= monthly_remaining:
                    living_expense  = monthly_remaining
                    cash_reserve   += after_tax - living_expense
                else:
                    from_res    = min(monthly_remaining - after_tax, cash_reserve)
                    cash_reserve -= from_res
                    living_expense = after_tax + from_res

                monthly_living_used += living_expense
                cum_withdrawn       += living_expense

            else:
                # 현금 보유 중 적응형 생활비
                total_cash = cash + cash_reserve
                yearly_liv = monthly_living_cap * 12
                if yearly_liv > 0:
                    yr_left = total_cash / yearly_liv
                    lr = 1.0 if yr_left >= 2 else (0.7 if yr_left >= 1 else (0.5 if yr_left >= 0.5 else 0.3))
                else:
                    lr = 1.0

                living_expense = max(0.0, monthly_living_cap * lr - monthly_living_used)
                monthly_living_used += living_expense

                if cash_reserve >= living_expense:
                    cash_reserve -= living_expense
                else:
                    cash = max(0.0, cash - (living_expense - cash_reserve))
                    cash_reserve = 0.0

                cum_withdrawn += living_expense

        # ── RP 일별 이자 (현금 보유 중) ──
        if not is_invested and cash > 0:
            annual_rate_pct = fed_rates.get(month_key, 3.0)
            daily_r = max(0.0, annual_rate_pct / 100.0 - RP_SPREAD) / 252
            gross = cash * daily_r
            cum_tax += gross * RP_TAX_R
            cash    += gross * (1 - RP_TAX_R)

        # ── VOO 매수 ──
        if cash_reserve > 0 and monthly_living_cap > 0:
            pv2 = shares * ndx3x[ci] if is_invested else cash
            vv2 = voo_shares * sp500[ci] if voo_shares > 0 else 0.0
            ta2 = pv2 + cash_reserve + tax_reserve + vv2
            if ta2 >= VOO_THR and sp500[ci] > 0:
                keep = monthly_living_cap * VOO_KEEP
                exc  = cash_reserve - keep
                if exc > 0:
                    bs = exc / sp500[ci]
                    voo_avg_cost = (voo_avg_cost * voo_shares + sp500[ci] * bs) / (voo_shares + bs) if voo_shares > 0 else sp500[ci]
                    voo_shares   += bs
                    cash_reserve -= exc

        # ── 현금 버퍼 보충 (prebuf_months > 0) ──
        # 투자 중이고 현금 버퍼가 목표치의 50% 미만이면 주식에서 보충
        if p.prebuf_months > 0 and is_invested and shares > 0:
            target_buf = monthly_living_cap * p.prebuf_months
            if cash_reserve < target_buf * 0.5:
                topup = min(target_buf - cash_reserve, shares * ndx3x[ci] * 0.03)
                if topup > 0:
                    shares_sold = topup / ndx3x[ci]
                    gain = max(0.0, topup - shares_sold * avg_cost)
                    annual_gain += gain
                    tax_reserve += gain * TAX_RATE
                    cash_reserve += topup - gain * TAX_RATE
                    shares = max(0.0, shares - shares_sold)

        # ── 월별 스냅샷 ──
        if cur_month != last_snap_month:
            pv_s = shares * ndx3x[ci] if is_invested else cash
            vv_s = voo_shares * sp500[ci] if voo_shares > 0 else 0.0
            monthly_snapshots.append({
                "date":  cur_date.strftime("%Y-%m"),
                "value": round((pv_s + cash_reserve + vv_s) / 1e8, 4),
                "invested": is_invested,
            })
            last_snap_month = cur_month

        pv_chk = shares * ndx3x[ci] if is_invested else cash
        if pv_chk + cash_reserve + cash <= 0:
            break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = shares * ndx3x[ci_end] if is_invested else cash
    vv_end = voo_shares * sp500[ci_end] if voo_shares > 0 else 0.0
    final_val = pv_end + cash_reserve + vv_end
    min_val   = min((s["value"] for s in monthly_snapshots), default=0.0)
    n_months  = len(monthly_snapshots)
    actual_yr = n_months / 12
    cagr = ((final_val / INITIAL) ** (1 / actual_yr) - 1) * 100 if actual_yr > 0 and final_val > 0 else -100.0

    return {
        "final":        round(final_val / 1e8, 2),
        "withdrawn":    round(cum_withdrawn / 1e8, 2),
        "min":          round(min_val, 4),
        "bankrupt":     bool(final_val <= 0),
        "cagr":         round(cagr, 2),
        "trades":       trade_count,
        "monthly":      monthly_snapshots,
    }


# ═══════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════

def main():
    t0 = time.time()
    print("=" * 70)
    print("인출 전략 아이디어 전수 비교")
    print("=" * 70)

    ndx3x, ndx_closes, ma200, dates, sp500, fed_rates = load_data()
    first_valid = int(np.where(~np.isnan(ma200))[0][0])
    monthly_starts = [i for i in get_monthly_starts(dates)
                      if i >= first_valid and (len(ndx3x) - i) / 252 >= SIM_YEARS]
    print(f"유효 코호트: {len(monthly_starts)}개")

    # 각 전략 결과 저장
    all_results: dict[str, list] = {p.name: [] for p in STRATEGIES}

    for k, si in enumerate(monthly_starts):
        for p in STRATEGIES:
            r = run_sim(ndx3x, ndx_closes, ma200, dates, sp500, fed_rates, si, p)
            all_results[p.name].append(r)

        if (k + 1) % 100 == 0:
            print(f"  {k+1}/{len(monthly_starts)} ...")

    print(f"\n{'전략':<5} {'설명':<40} {'생존율':>6} {'중앙최종':>8} {'평균최종':>8} {'평균인출':>8} {'최솟값':>8} {'CAGR':>6} {'거래수':>6}")
    print("-" * 105)

    summary_out = {}
    for p in STRATEGIES:
        rs = all_results[p.name]
        total = len(rs)
        bankrupt  = sum(1 for r in rs if r["bankrupt"])
        finals    = [r["final"]     for r in rs if not r["bankrupt"]]
        withds    = [r["withdrawn"] for r in rs]
        mins      = [r["min"]       for r in rs]
        cagrs     = [r["cagr"]      for r in rs if not r["bankrupt"]]
        trades    = [r["trades"]    for r in rs]

        med_f = sorted(finals)[len(finals)//2] if finals else 0
        avg_f = sum(finals) / len(finals) if finals else 0
        avg_w = sum(withds) / len(withds) if withds else 0
        min_m = min(mins) if mins else 0
        avg_c = sum(cagrs) / len(cagrs) if cagrs else 0
        avg_t = sum(trades) / len(trades) if trades else 0
        surv  = (total - bankrupt) / total * 100

        print(f"{p.name:<5} {p.desc:<40} {surv:>5.1f}% {med_f:>7.1f}억 {avg_f:>7.0f}억 {avg_w:>7.1f}억 {min_m:>7.4f} {avg_c:>5.1f}% {avg_t:>5.1f}")

        summary_out[p.name] = {
            "desc": p.desc,
            "total": total,
            "bankrupt": bankrupt,
            "survival_rate": round(surv, 1),
            "med_final": round(med_f, 2),
            "avg_final": round(avg_f, 1),
            "avg_withdrawn": round(avg_w, 2),
            "min_of_min": round(min_m, 4),
            "avg_cagr": round(avg_c, 2),
            "avg_trades": round(avg_t, 1),
        }

    # 주요 코호트 (닷컴버블 정점, 직전) 상세
    KEY_STARTS = ["2000-03", "1996-10", "1999-03", "2003-03", "2007-10", "2009-03"]
    monthly_detail: dict = {}
    for k, si in enumerate(monthly_starts):
        slab = dates[si].strftime("%Y-%m")
        if slab in KEY_STARTS:
            monthly_detail[slab] = {}
            for p in STRATEGIES:
                monthly_detail[slab][p.name] = all_results[p.name][k]["monthly"]

    # 코호트별 요약
    cohorts_out = []
    for k, si in enumerate(monthly_starts):
        row = {"start": dates[si].strftime("%Y-%m")}
        for p in STRATEGIES:
            r = all_results[p.name][k]
            row[p.name] = {
                "final": r["final"], "withdrawn": r["withdrawn"],
                "min": r["min"], "bankrupt": r["bankrupt"],
                "cagr": r["cagr"], "trades": r["trades"],
            }
        cohorts_out.append(row)

    output = {
        "meta": {
            "generated": str(dates[-1].date()),
            "sim_years": SIM_YEARS,
            "strategies": {p.name: p.desc for p in STRATEGIES},
        },
        "summary": summary_out,
        "cohorts": cohorts_out,
        "monthly_detail": monthly_detail,
    }

    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.bool_,)): return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size/1024:.0f} KB)")
    print(f"소요: {time.time()-t0:.1f}초")


if __name__ == "__main__":
    main()
