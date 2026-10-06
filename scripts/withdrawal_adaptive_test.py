"""
withdrawal_adaptive_test.py  [탐색용 — 터미널 출력만]

적응형 생활비 vs 고정 생활비 비교
──────────────────────────────────────────────────────────────
현재 전략(D10GK)에서 현금 보유 중 생활비 로직이 두 가지:

  adaptive=True  (기존):
    현금 잔고 2년치 이상 → 100%
    현금 잔고 1~2년치   → 70%
    현금 잔고 6개월~1년  → 50%
    현금 잔고 6개월 미만 → 30%

  adaptive=False (테스트):
    항상 100% 지출 (lr=1.0 고정)

사용자 질문: 가족이 있으면 생활비를 30%로 못 줄인다.
             적응형 생활비 없애도 되는가?
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

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
VOO_DIV_MO = 0.013 / 12
DIV_TAX_R  = 0.154
DYN_RATES  = (0.003, 0.005, 0.007)
DYN_THRS   = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15


@dataclass
class Param:
    name:            str
    adaptive_living: bool  = True   # False → 현금 중에도 lr=1.0 고정
    trail_thr:       float = 0.0    # >0이면 트레일링 스탑 (T25)
    use_rsi:         bool  = True   # False이면 D10GK RSI 재진입 없음 (S0)


STRATEGIES = [
    # S0: EMA200 15일 기준선
    Param("S0_ADAPT",     adaptive_living=True,  use_rsi=False),
    Param("S0_FIXED",     adaptive_living=False, use_rsi=False),
    # T25: 트레일링 스탑 -25%
    Param("T25_ADAPT",    adaptive_living=True,  trail_thr=0.25, use_rsi=False),
    Param("T25_FIXED",    adaptive_living=False, trail_thr=0.25, use_rsi=False),
    # D10GK: RSI<30 + 이격도<-10% + GK
    Param("D10GK_ADAPT",  adaptive_living=True),
    Param("D10GK_FIXED",  adaptive_living=False),
]


# ═══════════════════════════════════════════════════════════
# 보조 함수
# ═══════════════════════════════════════════════════════════

def compute_rsi(closes, period=14):
    n      = len(closes)
    rsi    = np.full(n, np.nan)
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
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    ret    = np.diff(closes, prepend=closes[0]) / np.where(closes > 0, closes, 1.0)
    f3     = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252)
    f3[0]  = 1.0
    ndx3x  = 100.0 * np.cumprod(f3)

    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    a200   = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    rsi14 = compute_rsi(closes, 14)

    # T25용 52주 고점
    trail_peaks = pd.Series(closes).rolling(252, min_periods=1).max().values

    return ndx3x, closes, ema200, rsi14, trail_peaks, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════
# 시뮬레이션 코어 (S0 / T25 / D10GK)
# ═══════════════════════════════════════════════════════════

def run_sim(ndx3x, closes, ema200, rsi14, trail_peaks, dates, sp500,
            fed_rates, start_idx: int, p: Param) -> dict:
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

    avg_cost      = ndx3x[start_idx]
    cash_reserve  = 0.0
    tax_reserve   = 0.0
    annual_gain   = 0.0
    last_tax_yr   = -1
    cum_tax       = 0.0
    cum_fees      = 0.0
    cum_withdrawn = 0.0
    voo_sh        = 0.0
    voo_avg       = 0.0

    # GK 상태
    gk_mult          = 1.0
    gk_initial_cap   = 0.0
    gk_initialized   = False
    gk_port_yr_start = float(INITIAL)

    below_days   = 0
    above_days   = 0
    days_in_cash = 0

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

        # ═══ 월초 처리 ═══
        if cur_mon != last_mon:
            tday_in_mon = 0
            mon_used    = 0.0

            annual_rate = fed_rates.get(mon_key, 3.0)
            rp_mo = max(0.0, annual_rate / 100.0 - RP_SPREAD) / 12.0

            if cash_reserve > 0:
                g = cash_reserve * rp_mo
                cum_tax      += g * RP_TAX_R
                cash_reserve += g * (1 - RP_TAX_R)
            if tax_reserve > 0:
                g = tax_reserve * rp_mo
                cum_tax      += g * RP_TAX_R
                cash_reserve += g * (1 - RP_TAX_R)

            # 연말 세금 + GK 조정
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0

                if gk_initialized:
                    pv_now   = tqqq_sh * ndx3x[ci] if is_invested else cash
                    port_now = pv_now + cash_reserve + voo_sh * sp500[ci]
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
                pv_yr = tqqq_sh * ndx3x[ci] if is_invested else cash
                gk_port_yr_start = pv_yr + cash_reserve + voo_sh * sp500[ci]

            if voo_sh > 0:
                g = voo_sh * sp500[ci] * VOO_DIV_MO
                cum_tax      += g * DIV_TAX_R
                cash_reserve += g * (1 - DIV_TAX_R)

            # 인출 캡
            pv_c    = tqqq_sh * ndx3x[ci] if is_invested else cash
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            base_rate = (DYN_RATES[0] if total_c < DYN_THRS[0]
                         else DYN_RATES[1] if total_c < DYN_THRS[1]
                         else DYN_RATES[2])
            mon_cap = min(total_c * base_rate * gk_mult, float(LIV_MAX))

            last_mon = cur_mon

        tday_in_mon += 1
        if not is_invested:
            days_in_cash += 1

        # ═══ EMA200 신호 ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        div    = 0.0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0:
                below_days += 1; above_days  = 0
            elif div > 0:
                above_days += 1; below_days  = 0
            else:
                below_days = above_days = 0

        if p.trail_thr > 0:
            # T25: 52주 고점 대비 -trail_thr% → 매도
            peak = trail_peaks[ci]
            sell_sig = is_invested and peak > 0 and closes[ci] < peak * (1 - p.trail_thr)
            buy_sig  = e200ok and above_days >= TIME_FILTER
        else:
            sell_sig = e200ok and below_days >= TIME_FILTER
            buy_sig  = e200ok and above_days >= TIME_FILTER

        # D10GK RSI 조기 재진입 (RSI<30 AND 이격도<-10%)
        if p.use_rsi and not is_invested and not buy_sig and e200ok:
            rsi_v = rsi14[ci]
            if not np.isnan(rsi_v) and rsi_v < 30.0 and div <= -0.10:
                buy_sig = True

        # ═══ 매도 ═══
        if is_invested and sell_sig:
            sell_val = tqqq_sh * ndx3x[ci]
            fee      = sell_val * FEE_RATE
            cum_fees += fee
            cash        = sell_val - fee
            tqqq_sh     = 0.0
            is_invested = False
            trade_count += 1
            below_days  = 0
            days_in_cash = 0

        # ═══ 매수 ═══
        elif not is_invested and buy_sig:
            fee      = cash * FEE_RATE
            cum_fees += fee
            tqqq_sh  = (cash - fee) / ndx3x[ci]
            avg_cost = ndx3x[ci]
            cash     = 0.0
            is_invested   = True
            trade_count  += 1
            above_days    = 0
            days_in_cash  = 0

        # ═══ 월초 인출 ═══
        if tday_in_mon == 1 and j > 0:
            if is_invested:
                pv       = tqqq_sh * ndx3x[ci]
                wd_val   = min(mon_cap, pv)
                sh_sold  = wd_val / ndx3x[ci]
                gain     = max(0.0, wd_val - sh_sold * avg_cost)
                annual_gain += gain
                tax_w        = gain * TAX_RATE
                tax_reserve += tax_w
                after_tax    = wd_val - tax_w
                tqqq_sh      = max(0.0, tqqq_sh - sh_sold)

                remaining = max(0.0, mon_cap - mon_used)
                if after_tax >= remaining:
                    living        = remaining
                    cash_reserve += after_tax - living
                else:
                    from_res      = min(remaining - after_tax, cash_reserve)
                    cash_reserve -= from_res
                    living        = after_tax + from_res
                mon_used      += living
                cum_withdrawn += living

                if not gk_initialized and living > 0:
                    gk_initial_cap = mon_cap
                    gk_initialized = True

            else:
                # ── 핵심 비교 지점 ──
                if p.adaptive_living:
                    total_cash = cash + cash_reserve
                    yearly_cap = mon_cap * 12
                    lr = (1.0 if yearly_cap <= 0 or total_cash / yearly_cap >= 2 else
                          0.7 if total_cash / yearly_cap >= 1 else
                          0.5 if total_cash / yearly_cap >= 0.5 else 0.3)
                else:
                    lr = 1.0  # 적응형 없음 — 항상 100% 지출

                living        = max(0.0, mon_cap * lr - mon_used)
                mon_used      += living
                cum_withdrawn += living
                if cash_reserve >= living:
                    cash_reserve -= living
                else:
                    cash = max(0.0, cash - (living - cash_reserve))
                    cash_reserve = 0.0

        # RP 이자
        if not is_invested:
            daily_r = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            if cash > 0:
                g    = cash * daily_r
                cum_tax += g * RP_TAX_R
                cash    += g * (1 - RP_TAX_R)

        # VOO 편입 (총자산 20억+, 현금 36개월치 초과)
        if is_invested and cash_reserve > 0 and sp500[ci] > 0:
            pv2 = tqqq_sh * ndx3x[ci]
            ta2 = pv2 + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    bs = exc / sp500[ci]
                    voo_avg = ((voo_avg * voo_sh + sp500[ci] * bs)
                               / (voo_sh + bs)) if voo_sh > 0 else sp500[ci]
                    voo_sh       += bs
                    cash_reserve -= bs * sp500[ci]
                    trade_count  += 1

        # 자산 추적
        pv_now   = tqqq_sh * ndx3x[ci] if is_invested else cash
        total    = pv_now + cash_reserve + tax_reserve + voo_sh * sp500[ci]
        if total < min_val:
            min_val = total
        if total <= 0:
            break

    ci_end  = min(start_idx + sim_len - 1, n - 1)
    pv_end  = tqqq_sh * ndx3x[ci_end] if is_invested else cash
    final   = pv_end + cash_reserve + voo_sh * sp500[ci_end]
    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'):
        min_val = 0.0

    ongoing = (sim_len < int(SIM_YEARS * 252)) and (final > 0)
    return {
        "final":    final,
        "min":      min_val,
        "bankrupt": bool(final <= 0),
        "cagr":     cagr,
        "trades":   trade_count,
        "ongoing":  bool(ongoing),
        "actual_yr": actual_yr,
    }


# ═══════════════════════════════════════════════════════════
# 병렬 실행
# ═══════════════════════════════════════════════════════════

_SHARED = {}


def _init_worker(ndx3x, closes, ema200, rsi14, trail_peaks, dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'ndx3x': ndx3x, 'closes': closes, 'ema200': ema200, 'rsi14': rsi14,
        'trail_peaks': trail_peaks,
        'dates': pd.DatetimeIndex(dates_list), 'sp500': sp500,
        'fed_rates': fed_rates, 'starts': starts,
    })


def _run_one(p: Param):
    d = _SHARED
    results = [
        run_sim(d['ndx3x'], d['closes'], d['ema200'], d['rsi14'],
                d['trail_peaks'], d['dates'], d['sp500'], d['fed_rates'], si, p)
        for si in d['starts']
    ]
    return (p.name, results)


def summarize(name, results, dates, starts):
    finals    = [r["final"] for r in results if not r["ongoing"] and not r["bankrupt"]]
    n_total   = len(results)
    n_ongoing = sum(r["ongoing"] for r in results)
    n_bankrupt= sum(r["bankrupt"] for r in results)
    n_done    = n_total - n_ongoing
    survival  = (n_done - n_bankrupt) / n_done * 100 if n_done > 0 else 0.0

    if finals:
        finals_arr = np.array(finals)
        med   = float(np.median(finals_arr))
        avg   = float(np.mean(finals_arr))
        p25   = float(np.percentile(finals_arr, 25))
        p75   = float(np.percentile(finals_arr, 75))
        mn    = float(np.min(finals_arr))
    else:
        med = avg = p25 = p75 = mn = 0.0

    avg_cagr  = float(np.mean([r["cagr"]   for r in results if not r["bankrupt"]]))
    avg_trades= float(np.mean([r["trades"] for r in results]))

    print(f"\n{'─'*60}")
    print(f"  {name}")
    print(f"{'─'*60}")
    print(f"  생존율     : {survival:.1f}%  (완료 {n_done}개, 파산 {n_bankrupt}개, 진행중 {n_ongoing}개)")
    print(f"  중앙값     : {med/1e8:.1f}억")
    print(f"  평균       : {avg/1e8:.1f}억")
    print(f"  25~75%ile  : {p25/1e8:.1f}억 ~ {p75/1e8:.1f}억")
    print(f"  최솟값     : {mn/1e8:.2f}억")
    print(f"  연평균수익률: {avg_cagr:.1f}%")
    print(f"  평균 거래  : {avg_trades:.0f}회/20년")

    # 주요 시작 시점 비교
    KEY_DATES = ["2000-03", "2003-03", "2007-10", "2009-03", "1996-10", "1999-03"]
    print(f"\n  주요 시작 시점 결과:")
    for kd in KEY_DATES:
        for i, si in enumerate(starts):
            dt = dates[si].strftime("%Y-%m")
            if dt == kd:
                r = results[i]
                tag = "~" if r["ongoing"] else ("파산" if r["bankrupt"] else "")
                print(f"    {kd}: {r['final']/1e8:.1f}억{tag}  ({r['actual_yr']:.0f}년, {r['trades']}회)")
                break

    return {"med": med, "survival": survival, "avg_cagr": avg_cagr}


def main():
    t0 = time.time()
    print("=" * 60)
    print("적응형 생활비 vs 고정 생활비 비교 (S0 / T25 / D10GK)")
    print("=" * 60)

    ndx3x, closes, ema200, rsi14, trail_peaks, dates, sp500, fed_rates = load_data()
    starts = list(get_monthly_starts(dates))
    print(f"시작점: {len(starts)}개")

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(ndx3x, closes, ema200, rsi14, trail_peaks,
                  dates.tolist(), sp500, fed_rates, starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)

    print(f"\n완료 ({time.time() - t0:.1f}s)")

    summaries = {}
    for name, results in raw:
        s = summarize(name, results, dates, starts)
        summaries[name] = s

    # 차이 요약
    print(f"\n{'='*60}")
    print(f"  비교 요약 (적응형 vs 고정)")
    print(f"{'='*60}")
    for base in ["S0", "T25", "D10GK"]:
        a = summaries.get(f"{base}_ADAPT", {})
        f = summaries.get(f"{base}_FIXED", {})
        if a and f:
            diff = (f["med"] - a["med"]) / a["med"] * 100 if a["med"] > 0 else 0
            same = abs(diff) < 0.1
            print(f"  {base:8s}: 적응형 {a['med']/1e8:.1f}억 / 고정 {f['med']/1e8:.1f}억  "
                  f"→ {'동일' if same else f'{diff:+.1f}%'}")


if __name__ == "__main__":
    main()
