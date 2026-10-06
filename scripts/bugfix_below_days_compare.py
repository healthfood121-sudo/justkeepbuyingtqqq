"""
bugfix_below_days_compare.py

버그 수정 전/후 D10GK 전략 비교
버그: RSI 조기 재진입 후 below_days 리셋 안 됨
수정: 매수 실행 시 below_days = 0 추가

668 시작점 전체 돌려서 중앙값·생존율·거래수 비교
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR = (_ROOT / "data")
FED_PATH = (_ROOT / "data/fed_funds_rate.json")

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_3X     = 0.0088
LIV_MAX    = 15_000_000
TAX_RATE   = 0.22
DEDUCTION  = 2_500_000
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
DIV_TAX_R  = 0.154
DYN_RATES  = (0.003, 0.005, 0.007)
DYN_THRS   = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15
RSI_THR    = 30.0
DIV_THR    = -0.10
VOO_DIV_MO = 0.013 / 12


def compute_rsi(closes, period=14):
    n = len(closes)
    rsi = np.full(n, np.nan)
    deltas = np.diff(closes)
    gains  = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    if n <= period + 1:
        return rsi
    ag = float(np.mean(gains[:period]))
    al = float(np.mean(losses[:period]))
    for i in range(period, n - 1):
        ag = (ag * (period - 1) + gains[i]) / period
        al = (al * (period - 1) + losses[i]) / period
        rsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)
    return rsi


def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i-1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)
    ret    = np.diff(closes) / closes[:-1]
    ret    = np.insert(ret, 0, 0.0)

    f3 = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    ndx3x = 100.0 * np.cumprod(f3)

    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    a200 = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i-1] * (1 - a200)

    rsi14 = compute_rsi(closes, 14)

    return ndx3x, closes, ema200, rsi14, dates, sp500, fed_rates


def run_sim(ndx3x, closes, ema200, rsi14, dates, sp500, fed_rates,
            start_idx: int, fix_below_days: bool) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    e200_init  = ema200[start_idx]
    e200_valid = not np.isnan(e200_init) and e200_init > 0
    if e200_valid and closes[start_idx] < e200_init:
        is_invested = False
        cash        = float(INITIAL)
        tqqq_sh     = 0.0
    else:
        is_invested = True
        tqqq_sh     = INITIAL / ndx3x[start_idx]
        cash        = 0.0

    avg_cost     = ndx3x[start_idx]
    cash_reserve = 0.0
    tax_reserve  = 0.0
    annual_gain  = 0.0
    last_tax_yr  = -1
    cum_withdrawn= 0.0
    cum_fees     = 0.0

    gk_mult          = 1.0
    gk_initial_cap   = 0.0
    gk_initialized   = False
    gk_port_yr_start = float(INITIAL)

    below_days   = 0
    above_days   = 0

    last_mon    = None
    tday_in_mon = 0
    mon_cap     = 0.0
    mon_used    = 0.0
    trade_count = 0
    min_val     = float('inf')

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        cur_date = dates[ci]
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        # 월초 처리
        if cur_mon != last_mon:
            tday_in_mon = 0
            mon_used    = 0.0

            annual_rate = fed_rates.get(mon_key, 3.0)
            rp_mo = max(0.0, annual_rate / 100.0 - RP_SPREAD) / 12.0

            if cash_reserve > 0:
                g = cash_reserve * rp_mo
                cash_reserve += g * (1 - RP_TAX_R)
            if tax_reserve > 0:
                g = tax_reserve * rp_mo
                cash_reserve += g * (1 - RP_TAX_R)

            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                tax_reserve = 0.0
                annual_gain = 0.0

                if gk_initialized:
                    pv_now   = tqqq_sh * ndx3x[ci] if is_invested else cash
                    port_now = pv_now + cash_reserve
                    yr_ret   = ((port_now - gk_port_yr_start) / gk_port_yr_start
                                if gk_port_yr_start > 0 else 0.0)
                    if gk_initial_cap > 0:
                        ratio = mon_cap / gk_initial_cap
                        if ratio > 1.20:
                            gk_mult = max(0.50, gk_mult * 0.80)
                        elif ratio < 0.80 and yr_ret >= 0:
                            gk_mult = min(1.50, gk_mult * 1.10)
                    gk_port_yr_start = port_now

            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year

            pv_c    = tqqq_sh * ndx3x[ci] if is_invested else cash
            total_c = pv_c + cash_reserve + tax_reserve
            base_rate = (DYN_RATES[0] if total_c < DYN_THRS[0]
                         else DYN_RATES[1] if total_c < DYN_THRS[1]
                         else DYN_RATES[2])
            mon_cap = min(total_c * base_rate * gk_mult, float(LIV_MAX))

            if not gk_initialized and mon_cap > 0:
                gk_initial_cap = mon_cap
                gk_initialized = True

            last_mon = cur_mon

        tday_in_mon += 1

        # 신호 계산
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        div    = 0.0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0:
                below_days += 1; above_days = 0
            elif div > 0:
                above_days += 1; below_days = 0
            else:
                below_days = above_days = 0

        sell_sig = e200ok and below_days >= TIME_FILTER
        buy_sig  = e200ok and above_days >= TIME_FILTER

        # RSI 조기 재진입 (D10GK)
        if not is_invested and not buy_sig and e200ok:
            rsi_v = rsi14[ci]
            if not np.isnan(rsi_v) and rsi_v < RSI_THR and div <= DIV_THR:
                buy_sig = True

        # 매도
        if is_invested and sell_sig:
            sell_val = tqqq_sh * ndx3x[ci]
            fee      = sell_val * FEE_RATE
            cum_fees += fee
            cash     = sell_val - fee
            tqqq_sh  = 0.0
            is_invested = False
            trade_count += 1
            below_days  = 0

        # 매수
        elif not is_invested and buy_sig:
            invest   = cash
            fee      = invest * FEE_RATE
            cum_fees += fee
            net      = invest - fee
            tqqq_sh  = net / ndx3x[ci]
            avg_cost = ndx3x[ci]
            cash     = 0.0
            is_invested = True
            trade_count += 1
            above_days  = 0
            if fix_below_days:
                below_days = 0  # ← 버그 수정

        # 월초 인출
        if tday_in_mon == 1 and j > 0:
            if is_invested:
                pv     = tqqq_sh * ndx3x[ci]
                wd_val = min(mon_cap, pv)
                if wd_val > 0:
                    sh_w    = wd_val / ndx3x[ci]
                    gain_w  = max(0.0, wd_val - sh_w * avg_cost)
                    annual_gain += gain_w
                    tw      = gain_w * TAX_RATE
                    tax_reserve += tw
                    tqqq_sh -= sh_w
                    cash_reserve += wd_val - tw
                    living  = min(mon_cap, cash_reserve)
                    cash_reserve -= living
                    cum_withdrawn += living
                    if not gk_initialized and living > 0:
                        gk_initial_cap = mon_cap
                        gk_initialized = True
            else:
                withdraw = min(mon_cap, cash + cash_reserve)
                if cash >= withdraw:
                    cash -= withdraw
                else:
                    rem = withdraw - cash
                    cash = 0.0
                    cash_reserve -= min(rem, cash_reserve)
                cum_withdrawn += withdraw

        # 최솟값 추적
        pv_now  = tqqq_sh * ndx3x[ci] if is_invested else cash
        total_v = pv_now + cash_reserve + tax_reserve
        if total_v < min_val:
            min_val = total_v

    pv_end    = tqqq_sh * ndx3x[start_idx + sim_len - 1] if is_invested else cash
    total_end = pv_end + cash_reserve
    completed = sim_len >= int(SIM_YEARS * 252) - 5

    return {
        'start': str(dates[start_idx].date()),
        'terminal': total_end,
        'trades': trade_count,
        'survived': total_end > 0,
        'completed': completed,
    }


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


def worker(args):
    ndx3x, closes, ema200, rsi14, dates, sp500, fed_rates, start_idx, fix = args
    return run_sim(ndx3x, closes, ema200, rsi14, dates, sp500, fed_rates,
                   start_idx, fix_below_days=fix)


if __name__ == "__main__":
    print("데이터 로드 중...")
    ndx3x, closes, ema200, rsi14, dates, sp500, fed_rates = load_data()
    starts = get_monthly_starts(dates)

    for fix, label in [(False, "원본(버그 있음)"), (True, "수정(below_days 리셋)")]:
        t0 = time.time()
        args = [(ndx3x, closes, ema200, rsi14, dates, sp500, fed_rates, s, fix)
                for s in starts]
        with mp.Pool(mp.cpu_count()) as pool:
            results = pool.map(worker, args)

        completed = [r for r in results if r['completed']]
        terminals = [r['terminal'] for r in completed]
        all_trades = [r['trades'] for r in results]
        survived   = sum(1 for r in completed if r['survived'])

        terminals_arr = np.array(terminals)
        med = np.median(terminals_arr) / 1e8
        avg = np.mean(terminals_arr) / 1e8
        mn  = np.min(terminals_arr) / 1e8
        mx  = np.max(terminals_arr) / 1e8
        avg_trades = np.mean(all_trades)
        survival   = survived / len(completed) * 100 if completed else 0

        print(f"\n{'='*55}")
        print(f"  {label}")
        print(f"{'='*55}")
        print(f"  전체 시작점: {len(results)}개 / 20년 완료: {len(completed)}개")
        print(f"  생존율    : {survival:.1f}% ({survived}/{len(completed)})")
        print(f"  중앙값    : {med:.0f}억")
        print(f"  평균      : {avg:.0f}억")
        print(f"  최솟값    : {mn:.1f}억")
        print(f"  최댓값    : {mx:.0f}억")
        print(f"  평균 거래 : {avg_trades:.1f}회/20년")
        print(f"  소요시간  : {time.time()-t0:.1f}초")

        # 특정 케이스 비교 (닷컴버블)
        dotcom = next((r for r in results if r['start'].startswith('2000-03')), None)
        if dotcom:
            print(f"\n  [닷컴버블 2000-03] 최종 {dotcom['terminal']/1e8:.1f}억 / 거래 {dotcom['trades']}회")

    # 케이스별 비교
    print(f"\n{'='*55}")
    print("  케이스별 비교 (수정 전 → 수정 후)")
    print(f"{'='*55}")
    check_dates = ['2000-03', '2001-01', '2002-01', '2003-03', '2008-09', '2009-03']

    orig_results  = {}
    fixed_results = {}

    for fix, store in [(False, orig_results), (True, fixed_results)]:
        args = [(ndx3x, closes, ema200, rsi14, dates, sp500, fed_rates, s, fix)
                for s in starts]
        with mp.Pool(mp.cpu_count()) as pool:
            res = pool.map(worker, args)
        for r in res:
            store[r['start'][:7]] = r

    for d in check_dates:
        o = orig_results.get(d)
        f = fixed_results.get(d)
        if o and f:
            diff = (f['terminal'] - o['terminal']) / 1e8
            sign = "+" if diff >= 0 else ""
            print(f"  {d}: {o['terminal']/1e8:6.0f}억 ({o['trades']:2d}회) → "
                  f"{f['terminal']/1e8:6.0f}억 ({f['trades']:2d}회)  [{sign}{diff:.0f}억]")
