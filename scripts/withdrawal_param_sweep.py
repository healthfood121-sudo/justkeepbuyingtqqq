"""
withdrawal_param_sweep.py

B3C1 파라미터 최적화 그리드 서치 (multiprocessing 병렬화)
──────────────────────────────────────────────────────
연속일 필터 × 동적 인출률 × 구간 기준 + EMA200 + 초기버퍼 + 하이브리드 탐색

그리드:
  time_filter_days  : [5, 7, 10, 15, 20]
  dynamic_thrs      : [(5억,15억), (10억,20억), (15억,30억), (10억,30억)]
  dynamic_rates     : [(0.002,0.004,0.006), (0.003,0.005,0.007),
                       (0.004,0.006,0.008), (0.003,0.006,0.009)]
  => 5 × 4 × 4 = 80 조합

추가:
  EMA200 변형 (best 조합에 적용) × 8
  초기 현금버퍼 6/12개월 × 2
  이격도+연속일 하이브리드 × 4
  월말 체크 × 1

총 약 95 조합 × 418 코호트 — 22코어 병렬
"""

import json
import time
import itertools
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

# ─── 경로 ──────────────────────────────────────────────────────
DATA_DIR = (_ROOT / "data")
FED_PATH = (_ROOT / "data/fed_funds_rate.json")
OUT_PATH = (_ROOT / "web/public/data/withdrawal_param_sweep.json")

# ─── 공통 파라미터 ──────────────────────────────────────────────
INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_RATIO  = 0.0088
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


@dataclass
class Param:
    name: str
    desc: str
    time_filter_days: int  = 10
    ma_sell_thr: float     = 0.0
    ma_buy_thr: float      = 0.0
    monthly_check: bool    = False
    use_ema: bool          = False
    dynamic_rates: tuple   = (0.003, 0.005, 0.007)
    dynamic_thrs: tuple    = (1_000_000_000, 2_000_000_000)
    prebuf_months: int     = 0


# ═══════════════════════════════════════════════════════════════
# 데이터 로드 (프로세스별 1회 실행)
# ═══════════════════════════════════════════════════════════════

def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i-1, "Close"] / ndx.loc[i, "Close"]

    ndx_closes = ndx["Close"].values.astype(float)
    dates      = pd.DatetimeIndex(ndx["Date"])

    ret    = np.diff(ndx_closes) / ndx_closes[:-1]
    ret    = np.insert(ret, 0, 0.0)
    factor = (1.0 + ret * 3.0) * (1.0 - EXP_RATIO / 252)
    factor[0] = 1.0
    ndx3x  = 100.0 * np.cumprod(factor)

    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    n = len(ndx_closes)
    sma200 = np.full(n, np.nan)
    ws = 0.0
    for i in range(n):
        ws += ndx_closes[i]
        if i >= MA_N:
            ws -= ndx_closes[i - MA_N]
        if i >= MA_N - 1:
            sma200[i] = ws / MA_N

    ema200 = np.full(n, np.nan)
    alpha  = 2.0 / (MA_N + 1)
    seed   = MA_N - 1
    ema200[seed] = np.mean(ndx_closes[:MA_N])
    for i in range(seed + 1, n):
        ema200[i] = ndx_closes[i] * alpha + ema200[i-1] * (1 - alpha)

    return ndx3x, ndx_closes, sma200, ema200, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════════
# 단일 시뮬레이션
# ═══════════════════════════════════════════════════════════════

def run_sim(ndx3x, ndx_closes, sma200, ema200, dates, sp500, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))
    ma200   = ema200 if p.use_ema else sma200

    ma_init = ma200[start_idx]
    if not np.isnan(ma_init) and ndx_closes[start_idx] < ma_init * (1 - p.ma_sell_thr):
        is_invested = False
        cash        = float(INITIAL)
        shares      = 0.0
    else:
        is_invested = True
        shares      = INITIAL / ndx3x[start_idx]
        cash        = 0.0

    avg_cost     = ndx3x[start_idx]
    cash_reserve = 0.0
    if p.prebuf_months > 0 and is_invested:
        est_monthly  = INITIAL * 0.005
        buf_val      = min(est_monthly * p.prebuf_months, INITIAL * 0.3)
        cash_reserve = buf_val
        shares       = max(0.0, shares - buf_val / ndx3x[start_idx])

    tax_reserve   = 0.0
    annual_gain   = 0.0
    last_tax_yr   = -1
    cum_tax       = 0.0
    cum_fees      = 0.0
    cum_withdrawn = 0.0
    voo_shares    = 0.0
    voo_avg_cost  = 0.0

    last_snap_month      = None
    last_mon_month       = None
    trading_day_in_month = 0
    monthly_living_used  = 0.0
    monthly_living_cap   = 0.0
    trade_count          = 0
    below_ma_days        = 0
    above_ma_days        = 0
    min_val              = float('inf')

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        cur_date  = dates[ci]
        cur_month = (cur_date.year, cur_date.month)
        month_key = cur_date.strftime("%Y-%m")

        if cur_month != last_mon_month:
            trading_day_in_month = 0
            monthly_living_used  = 0.0

            annual_rate_pct = fed_rates.get(month_key, 3.0)
            rp_monthly      = max(0.0, annual_rate_pct / 100.0 - RP_SPREAD) / 12.0
            if cash_reserve > 0:
                gross         = cash_reserve * rp_monthly
                cum_tax      += gross * RP_TAX_R
                cash_reserve += gross * (1 - RP_TAX_R)
            if tax_reserve > 0:
                gross         = tax_reserve * rp_monthly
                cum_tax      += gross * RP_TAX_R
                cash_reserve += gross * (1 - RP_TAX_R)

            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax  = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund      = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0
            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year

            if voo_shares > 0:
                gross         = voo_shares * sp500[ci] * VOO_DIV_MO
                cum_tax      += gross * DIV_TAX_R
                cash_reserve += gross * (1 - DIV_TAX_R)

            pv_c    = shares * ndx3x[ci] if is_invested else cash
            voo_c   = voo_shares * sp500[ci]
            total_c = pv_c + cash_reserve + tax_reserve + voo_c
            if total_c < p.dynamic_thrs[0]:
                monthly_living_cap = total_c * p.dynamic_rates[0]
            elif total_c < p.dynamic_thrs[1]:
                monthly_living_cap = total_c * p.dynamic_rates[1]
            else:
                monthly_living_cap = min(total_c * p.dynamic_rates[2], LIV_MAX)

            last_mon_month = cur_month

        trading_day_in_month += 1

        ma_val     = ma200[ci]
        ma_ok      = not np.isnan(ma_val) and ma_val > 0
        divergence = (ndx_closes[ci] - ma_val) / ma_val if ma_ok else 0.0

        if ma_ok:
            if divergence < -p.ma_sell_thr:
                below_ma_days += 1
                above_ma_days  = 0
            elif divergence > p.ma_buy_thr:
                above_ma_days += 1
                below_ma_days  = 0
            else:
                below_ma_days = 0
                above_ma_days = 0

        is_last_day = False
        if p.monthly_check:
            if ci + 1 < n:
                is_last_day = ((dates[ci+1].year, dates[ci+1].month) != cur_month)
            else:
                is_last_day = True
        do_check = (not p.monthly_check) or is_last_day

        if ma_ok and do_check:
            if p.time_filter_days > 0:
                sell_sig = (below_ma_days >= p.time_filter_days)
                buy_sig  = (above_ma_days >= p.time_filter_days)
            else:
                sell_sig = (divergence < -p.ma_sell_thr)
                buy_sig  = (divergence > p.ma_buy_thr)

            if is_invested and sell_sig:
                sell_val      = shares * ndx3x[ci]
                fee           = sell_val * FEE_RATE
                cum_fees     += fee
                cash          = sell_val - fee
                shares        = 0.0
                is_invested   = False
                trade_count  += 1
                below_ma_days = 0

            elif not is_invested and buy_sig:
                fee           = cash * FEE_RATE
                cum_fees     += fee
                shares        = (cash - fee) / ndx3x[ci]
                avg_cost      = ndx3x[ci]
                cash          = 0.0
                is_invested   = True
                trade_count  += 1
                above_ma_days = 0

        if trading_day_in_month == 1 and j > 0:
            if is_invested:
                withdrawal  = monthly_living_cap
                shares_sold = withdrawal / ndx3x[ci]
                cost_basis  = shares_sold * avg_cost
                gain        = max(0.0, withdrawal - cost_basis)
                annual_gain += gain
                tax_w        = gain * TAX_RATE
                tax_reserve += tax_w
                after_tax    = withdrawal - tax_w
                shares       = max(0.0, shares - shares_sold)

                remaining    = max(0.0, monthly_living_cap - monthly_living_used)
                if after_tax >= remaining:
                    living_expense = remaining
                    cash_reserve  += after_tax - living_expense
                else:
                    from_res       = min(remaining - after_tax, cash_reserve)
                    cash_reserve  -= from_res
                    living_expense = after_tax + from_res

                monthly_living_used += living_expense
                cum_withdrawn       += living_expense

            else:
                total_cash = cash + cash_reserve
                yearly_liv = monthly_living_cap * 12
                lr = (1.0 if yearly_liv <= 0 or total_cash / yearly_liv >= 2 else
                      0.7 if total_cash / yearly_liv >= 1 else
                      0.5 if total_cash / yearly_liv >= 0.5 else 0.3)
                living_expense       = max(0.0, monthly_living_cap * lr - monthly_living_used)
                monthly_living_used += living_expense
                if cash_reserve >= living_expense:
                    cash_reserve -= living_expense
                else:
                    cash         = max(0.0, cash - (living_expense - cash_reserve))
                    cash_reserve = 0.0
                cum_withdrawn += living_expense

        if not is_invested and cash > 0:
            daily_r  = max(0.0, fed_rates.get(month_key, 3.0) / 100.0 - RP_SPREAD) / 252
            gross    = cash * daily_r
            cum_tax += gross * RP_TAX_R
            cash    += gross * (1 - RP_TAX_R)

        if cash_reserve > 0 and monthly_living_cap > 0:
            pv2 = shares * ndx3x[ci] if is_invested else cash
            ta2 = pv2 + cash_reserve + tax_reserve + voo_shares * sp500[ci]
            if ta2 >= VOO_THR and sp500[ci] > 0:
                exc = cash_reserve - monthly_living_cap * VOO_KEEP
                if exc > 0:
                    bs = exc / sp500[ci]
                    voo_avg_cost = ((voo_avg_cost * voo_shares + sp500[ci] * bs)
                                    / (voo_shares + bs)) if voo_shares > 0 else sp500[ci]
                    voo_shares   += bs
                    cash_reserve -= exc

        if p.prebuf_months > 0 and is_invested and shares > 0:
            target_buf = monthly_living_cap * p.prebuf_months
            if cash_reserve < target_buf * 0.5:
                topup = min(target_buf - cash_reserve, shares * ndx3x[ci] * 0.03)
                if topup > 0:
                    ss = topup / ndx3x[ci]
                    g  = max(0.0, topup - ss * avg_cost)
                    annual_gain  += g
                    tax_reserve  += g * TAX_RATE
                    cash_reserve += topup - g * TAX_RATE
                    shares        = max(0.0, shares - ss)

        pv_s  = shares * ndx3x[ci] if is_invested else cash
        total = pv_s + cash_reserve + voo_shares * sp500[ci]
        if total < min_val:
            min_val = total

        if cur_month != last_snap_month:
            last_snap_month = cur_month

        if total <= 0:
            break

    ci_end  = min(start_idx + sim_len - 1, n - 1)
    pv_end  = shares * ndx3x[ci_end] if is_invested else cash
    final   = pv_end + cash_reserve + voo_shares * sp500[ci_end]
    n_months = len([None for j in range(sim_len)
                    if start_idx + j < n and
                    (j == 0 or (dates[start_idx + j].year, dates[start_idx + j].month) !=
                                (dates[start_idx + j - 1].year, dates[start_idx + j - 1].month))])
    actual_yr = n_months / 12
    cagr = ((final / INITIAL) ** (1 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'):
        min_val = 0.0

    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
        "trades":    trade_count,
    }


# ═══════════════════════════════════════════════════════════════
# 병렬 워커: 단일 Param × 전체 코호트
# ═══════════════════════════════════════════════════════════════

# 전역 공유 데이터 (프로세스 fork 시 복사)
_SHARED = {}

def _init_worker(ndx3x, ndx_closes, sma200, ema200, dates_list, sp500, fed_rates, starts):
    _SHARED['ndx3x']      = ndx3x
    _SHARED['ndx_closes'] = ndx_closes
    _SHARED['sma200']     = sma200
    _SHARED['ema200']     = ema200
    _SHARED['dates']      = pd.DatetimeIndex(dates_list)
    _SHARED['sp500']      = sp500
    _SHARED['fed_rates']  = fed_rates
    _SHARED['starts']     = starts


def _run_one_param(p: Param) -> tuple[str, list]:
    ndx3x      = _SHARED['ndx3x']
    ndx_closes = _SHARED['ndx_closes']
    sma200     = _SHARED['sma200']
    ema200     = _SHARED['ema200']
    dates      = _SHARED['dates']
    sp500      = _SHARED['sp500']
    fed_rates  = _SHARED['fed_rates']
    starts     = _SHARED['starts']

    results = [run_sim(ndx3x, ndx_closes, sma200, ema200, dates, sp500, fed_rates, si, p)
               for si in starts]
    return (p.name, results)


# ═══════════════════════════════════════════════════════════════
# 그리드 생성
# ═══════════════════════════════════════════════════════════════

def build_grid() -> list[Param]:
    params = []

    # 기준선
    params.append(Param("B3C1_base",
                        "기준 B3C1 (days=10, 10/20억, 0.3/0.5/0.7%)",
                        time_filter_days=10,
                        dynamic_rates=(0.003, 0.005, 0.007),
                        dynamic_thrs=(1_000_000_000, 2_000_000_000)))

    days_grid  = [5, 7, 10, 15, 20]
    thrs_grid  = [
        (500_000_000,   1_500_000_000),
        (1_000_000_000, 2_000_000_000),
        (1_500_000_000, 3_000_000_000),
        (1_000_000_000, 3_000_000_000),
    ]
    rates_grid = [
        (0.002, 0.004, 0.006),
        (0.003, 0.005, 0.007),
        (0.004, 0.006, 0.008),
        (0.003, 0.006, 0.009),
    ]

    for d, thrs, rates in itertools.product(days_grid, thrs_grid, rates_grid):
        if (d == 10 and thrs == (1_000_000_000, 2_000_000_000)
                    and rates == (0.003, 0.005, 0.007)):
            continue
        t1 = thrs[0] // 100_000_000
        t2 = thrs[1] // 100_000_000
        r1 = int(rates[0] * 1000)
        r2 = int(rates[1] * 1000)
        r3 = int(rates[2] * 1000)
        params.append(Param(
            f"d{d}_t{t1}{t2}_r{r1}{r2}{r3}",
            f"연속{d}일, {t1}/{t2}억, {r1/10:.1f}/{r2/10:.1f}/{r3/10:.1f}%",
            time_filter_days=d, dynamic_rates=rates, dynamic_thrs=thrs))

    # EMA200
    for d, thrs, rates in itertools.product([10, 15], thrs_grid[:2],
                                             [rates_grid[1], rates_grid[3]]):
        t1 = thrs[0] // 100_000_000
        t2 = thrs[1] // 100_000_000
        r1 = int(rates[0] * 1000)
        r2 = int(rates[1] * 1000)
        r3 = int(rates[2] * 1000)
        params.append(Param(
            f"EMA_d{d}_t{t1}{t2}_r{r1}{r2}{r3}",
            f"EMA200 연속{d}일, {t1}/{t2}억, {r1/10:.1f}/{r2/10:.1f}/{r3/10:.1f}%",
            use_ema=True, time_filter_days=d, dynamic_rates=rates, dynamic_thrs=thrs))

    # 초기 현금버퍼
    for buf in [6, 12]:
        params.append(Param(
            f"B3C1_buf{buf}m",
            f"B3C1 + 초기버퍼 {buf}개월",
            time_filter_days=10,
            dynamic_rates=(0.003, 0.005, 0.007),
            dynamic_thrs=(1_000_000_000, 2_000_000_000),
            prebuf_months=buf))

    # 이격도+연속일 하이브리드
    for d, spread in itertools.product([5, 10], [0.02, 0.03]):
        params.append(Param(
            f"hyb_d{d}_s{int(spread*100)}",
            f"이격도±{int(spread*100)}%+연속{d}일 동적인출",
            time_filter_days=d, ma_sell_thr=spread, ma_buy_thr=spread,
            dynamic_rates=(0.003, 0.005, 0.007),
            dynamic_thrs=(1_000_000_000, 2_000_000_000)))

    # 월말 체크
    params.append(Param("monthly_s3_dyn",
                        "월말체크 ±3% 동적인출",
                        monthly_check=True, ma_sell_thr=0.03, ma_buy_thr=0.03,
                        time_filter_days=0,
                        dynamic_rates=(0.003, 0.005, 0.007),
                        dynamic_thrs=(1_000_000_000, 2_000_000_000)))

    return params


# ═══════════════════════════════════════════════════════════════
# 메인
# ═══════════════════════════════════════════════════════════════

def main():
    t0 = time.time()
    print("=" * 70, flush=True)
    print("B3C1 파라미터 그리드 서치 (병렬)", flush=True)
    print("=" * 70, flush=True)

    ndx3x, ndx_closes, sma200, ema200, dates, sp500, fed_rates = load_data()
    first_valid    = int(np.where(~np.isnan(sma200))[0][0])
    monthly_starts = [i for i in get_monthly_starts(dates)
                      if i >= first_valid and (len(ndx3x) - i) / 252 >= SIM_YEARS]
    n_cohorts = len(monthly_starts)

    all_params = build_grid()
    total_sims = len(all_params) * n_cohorts

    print(f"유효 코호트: {n_cohorts}개", flush=True)
    print(f"파라미터 조합: {len(all_params)}개", flush=True)
    print(f"총 시뮬레이션: {total_sims:,}회", flush=True)
    print(f"코어 수: {mp.cpu_count()}개", flush=True)
    print(flush=True)

    # Pool 병렬 실행
    n_workers = min(mp.cpu_count(), len(all_params))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(ndx3x, ndx_closes, sma200, ema200,
                  dates.tolist(), sp500, fed_rates, monthly_starts)
    ) as pool:
        raw = pool.map(_run_one_param, all_params, chunksize=1)

    print(f"시뮬레이션 완료 ({time.time()-t0:.1f}s)", flush=True)

    # 결과 집계
    summary_rows = []
    for pname, results in raw:
        p = next(x for x in all_params if x.name == pname)
        total    = len(results)
        bankrupt = sum(1 for r in results if r["bankrupt"])
        finals   = [r["final"]     for r in results if not r["bankrupt"]]
        withds   = [r["withdrawn"] for r in results]
        mins     = [r["min"]       for r in results]
        cagrs    = [r["cagr"]      for r in results if not r["bankrupt"]]
        trades   = [r["trades"]    for r in results]

        sorted_f = sorted(finals)
        n_f      = len(sorted_f)
        med_f = sorted_f[n_f // 2]       if n_f else 0.0
        avg_f = sum(sorted_f) / n_f       if n_f else 0.0
        p25_f = sorted_f[n_f // 4]       if n_f else 0.0
        p75_f = sorted_f[3 * n_f // 4]   if n_f else 0.0
        avg_w = sum(withds) / len(withds) if withds else 0.0
        min_m = min(mins)                 if mins   else 0.0
        avg_c = sum(cagrs) / len(cagrs)   if cagrs  else 0.0
        avg_t = sum(trades) / len(trades) if trades else 0.0
        surv  = (total - bankrupt) / total * 100

        summary_rows.append({
            "name":          p.name,
            "desc":          p.desc,
            "survival_rate": round(surv, 1),
            "med_final":     round(med_f, 1),
            "avg_final":     round(avg_f, 1),
            "p25_final":     round(p25_f, 1),
            "p75_final":     round(p75_f, 1),
            "avg_withdrawn": round(avg_w, 2),
            "min_of_min":    round(min_m, 4),
            "avg_cagr":      round(avg_c, 2),
            "avg_trades":    round(avg_t, 1),
            "time_filter_days": p.time_filter_days,
            "ma_sell_thr":      p.ma_sell_thr,
            "use_ema":          bool(p.use_ema),
            "dynamic_rates":    list(p.dynamic_rates),
            "dynamic_thrs":     [t / 1e8 for t in p.dynamic_thrs],
            "prebuf_months":    p.prebuf_months,
        })

    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    # 콘솔 출력
    print(f"\n{'순위':<4} {'이름':<28} {'생존율':>6} {'중앙':>8} {'평균':>8} "
          f"{'P25':>7} {'P75':>8} {'CAGR':>6} {'거래':>5}", flush=True)
    print("-" * 90, flush=True)
    for rank, row in enumerate(summary_rows[:30], 1):
        print(f"{rank:<4} {row['name']:<28} {row['survival_rate']:>5.1f}% "
              f"{row['med_final']:>7.1f}억 {row['avg_final']:>7.1f}억 "
              f"{row['p25_final']:>6.1f}억 {row['p75_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}% {row['avg_trades']:>4.0f}", flush=True)

    print(f"\n... 전체 {len(summary_rows)}개 조합", flush=True)

    # JSON 저장
    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.bool_,)): return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    output = {
        "meta": {
            "generated":      str(dates[-1].date()),
            "sim_years":      SIM_YEARS,
            "n_cohorts":      n_cohorts,
            "n_combinations": len(all_params),
        },
        "summary": summary_rows,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    elapsed = time.time() - t0
    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size/1024:.0f} KB)", flush=True)
    print(f"소요: {elapsed:.1f}초", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("TOP 10 (중앙 최종값 기준)", flush=True)
    print("=" * 70, flush=True)
    for row in summary_rows[:10]:
        print(f"  [{row['name']}] {row['desc']}", flush=True)
        print(f"    생존율={row['survival_rate']}%  중앙={row['med_final']}억  "
              f"CAGR={row['avg_cagr']}%  최솟값={row['min_of_min']}억", flush=True)


if __name__ == "__main__":
    main()
