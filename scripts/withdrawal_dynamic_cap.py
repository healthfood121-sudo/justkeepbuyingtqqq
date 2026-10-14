"""
withdrawal_dynamic_cap.py

동적 상한 전략: 총자산 1억당 N만원씩 생활비 상한 증가
EARLY24 버퍼 고정.

비교:
  PER_10   : 1억당 10만원 (10억→100만, 100억→1000만)
  PER_30   : 1억당 30만원 (10억→300만, 100억→3000만)
  PER_50   : 1억당 50만원 (10억→500만, 100억→5000만)
  FIXED_1500: 고정 1500만원 (비교용)
  NO_CAP   : 상한 없음 (비교용)
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/withdrawal_dynamic_cap.json"

INITIAL     = 1_000_000_000
MIN_YEARS   = 10
SNAP_YRS    = (10, 20, 30, 40, 50)
SNAP_DAYS   = tuple(y * 252 for y in SNAP_YRS)
EXP_3X      = 0.0088
SWAP_SPREAD = 0.005
TAX_RATE    = 0.22
DEDUCTION   = 2_500_000
RP_SPREAD   = 0.004
RP_TAX_R    = 0.154
FEE_RATE    = 0.0007
DYN_RATES   = (0.003, 0.005, 0.007)
DYN_THRS    = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15
TRAIL_THR   = 0.25
MAX_BUF_PCT = 0.50
EARLY_MONTHS = 24
EARLY_YRS    = 5.0


@dataclass
class Param:
    name: str
    desc: str
    cap_mode: str = 'none'   # 'none' | 'fixed' | 'dynamic'
    fixed_cap: float = 0.0   # cap_mode='fixed'일 때 월 상한 (원)
    per_eok: float = 0.0     # cap_mode='dynamic'일 때 1억당 (원)

    def get_cap(self, total: float) -> float:
        if self.cap_mode == 'none':
            return float('inf')
        elif self.cap_mode == 'fixed':
            return self.fixed_cap
        else:  # dynamic
            eok = total / 1e8
            return max(eok, 0.0) * self.per_eok


STRATEGIES = [
    Param("NO_CAP",     "상한 없음",            cap_mode='none'),
    Param("PER_10",     "1억당 10만원",          cap_mode='dynamic', per_eok=100_000),
    Param("PER_30",     "1억당 30만원",          cap_mode='dynamic', per_eok=300_000),
    Param("PER_50",     "1억당 50만원",          cap_mode='dynamic', per_eok=500_000),
    Param("FIXED_1500", "고정 1,500만원",        cap_mode='fixed',   fixed_cap=15_000_000),
]


# ─────────────────────────────────────────────────────────

def dyn_rate(total: float) -> float:
    if total < DYN_THRS[0]: return DYN_RATES[0]
    if total < DYN_THRS[1]: return DYN_RATES[1]
    return DYN_RATES[2]


def calc_irr(flow_days, flow_vals, final, years):
    if years < 1 or final < 0:
        return -99.0
    t  = np.array([0.0] + [d / 252 for d in flow_days] + [years])
    cf = np.array([-INITIAL / 1e8] + [v / 1e8 for v in flow_vals] + [final])
    lo, hi = -0.99, 5.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if (cf / (1.0 + mid) ** t).sum() > 0: lo = mid
        else: hi = mid
    return round(mid * 100, 2)


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
    ret    = np.insert(np.diff(closes) / closes[:-1], 0, 0.0)

    with open(DATA_DIR / "fed_funds_rate.json", encoding="utf-8") as f:
        fed_raw = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed_raw}
    fed_daily = np.array([fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 / 252 for d in dates])

    f3 = (1.0 + ret * 3.0 - 2.0 * (fed_daily + SWAP_SPREAD / 252.0)) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    tqqq = 100.0 * np.cumprod(f3)

    a200 = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    peaks = pd.Series(closes).rolling(252, min_periods=1).max().values
    rp_daily = np.array([
        max(0.0, fed_rates.get(f"{d.year}-{d.month:02d}", 3.0) / 100.0 - RP_SPREAD) / 252
        for d in dates
    ]) * (1.0 - RP_TAX_R)

    return tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates


def get_monthly_starts(dates):
    seen, out = set(), []
    for i, d in enumerate(dates):
        if (d.year, d.month) not in seen:
            seen.add((d.year, d.month))
            out.append(i)
    return out


# ─────────────────────────────────────────────────────────

def run_sim(tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates,
            start_idx, p: Param):
    n       = len(tqqq)
    sim_len = n - start_idx

    e0             = ema200[start_idx]
    e0_valid       = not np.isnan(e0) and e0 > 0
    below_at_start = e0_valid and closes[start_idx] < e0

    def get_buf_months(elapsed_yrs):
        return EARLY_MONTHS if elapsed_yrs < EARLY_YRS else 0

    if below_at_start:
        is_invested = False; cash = float(INITIAL); tqqq_sh = 0.0; tqqq_avg = 0.0
    else:
        is_invested = True
        init_buf    = min(INITIAL * DYN_RATES[0] * EARLY_MONTHS, INITIAL * MAX_BUF_PCT)
        tqqq_sh     = ((INITIAL - init_buf) * (1 - FEE_RATE)) / tqqq[start_idx]
        tqqq_avg    = tqqq[start_idx]
        cash        = init_buf

    annual_gain   = 0.0
    tax_due       = 0.0
    cur_year      = dates[start_idx].year
    cum_withdrawn = 0.0
    cum_cap_saved = 0.0

    flow_days = []; flow_vals = []
    snaps = {}; snaps_wd = {}
    # 연도별 생활비 & 자산 추적 (최대 60년)
    yearly_living = {}   # year_offset → 연간 생활비
    yearly_total  = {}   # year_offset → 연말 총자산
    month_living_buf = 0.0
    month_count = 0

    below_days = 0; above_days = 0
    pend = None; pend_at = 0
    last_mon = None

    for j in range(sim_len):
        ci          = start_idx + j
        d           = dates[ci]
        mon         = (d.year, d.month)
        elapsed_yrs = j / 252.0
        year_offset = int(elapsed_yrs)

        for sd in SNAP_DAYS:
            if sd not in snaps and j >= sd:
                pv_s = tqqq_sh * tqqq[ci] if is_invested else 0.0
                snaps[sd]    = round((pv_s + cash) / 1e8, 1)
                snaps_wd[sd] = round(cum_withdrawn / 1e8, 1)

        if mon != last_mon:
            last_mon = mon

            # 연말 세금
            if d.year != cur_year:
                # 연간 생활비·자산 기록
                pv_y  = tqqq_sh * tqqq[ci] if is_invested else 0.0
                tot_y = pv_y + cash
                prev_offset = int((j - 1) / 252.0)
                yearly_living[prev_offset] = round(month_living_buf / 1e4)  # 만원 단위
                yearly_total[prev_offset]  = round(tot_y / 1e8, 1)
                month_living_buf = 0.0

                tax_due += max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                annual_gain = 0.0; cur_year = d.year

            if tax_due > 0:
                if cash >= tax_due:
                    cash -= tax_due; tax_due = 0.0
                elif is_invested:
                    need   = (tax_due - cash) / (1 - FEE_RATE)
                    sell_v = min(need, tqqq_sh * tqqq[ci])
                    sh     = sell_v / tqqq[ci]
                    annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                    tqqq_sh = max(0.0, tqqq_sh - sh)
                    cash   += sell_v * (1 - FEE_RATE)
                    cash    = max(0.0, cash - tax_due); tax_due = 0.0
                else:
                    cash = max(0.0, cash - tax_due); tax_due = 0.0

            if j > 0:
                pv          = tqqq_sh * tqqq[ci] if is_invested else 0.0
                tot         = pv + cash
                monthly_cap = tot * dyn_rate(tot)
                target_mths = get_buf_months(elapsed_yrs)
                living_cap  = p.get_cap(tot)

                living_target = min(monthly_cap, living_cap)
                cum_cap_saved += max(0.0, monthly_cap - living_target)

                if is_invested:
                    living_cash = min(living_target, cash)
                    cash        = max(0.0, cash - living_cash)
                else:
                    yearly_target = living_target * 12
                    total_cash    = cash
                    lr = (1.0 if yearly_target <= 0 or total_cash / yearly_target >= 2 else
                          0.7 if total_cash / yearly_target >= 1 else
                          0.5 if total_cash / yearly_target >= 0.5 else 0.3)
                    living_cash = living_target * lr
                    cash        = max(0.0, cash - living_cash)

                cum_withdrawn    += living_cash
                month_living_buf += living_cash

                if is_invested and target_mths == 0:
                    if living_cash < living_target and tqqq_sh > 0:
                        short  = living_target - living_cash
                        sell_v = min(short / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                        sh     = sell_v / tqqq[ci]
                        annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                        tqqq_sh  = max(0.0, tqqq_sh - sh)
                        cash    += sell_v * (1 - FEE_RATE)
                        extra    = min(living_target - living_cash, cash)
                        cash    -= extra; cum_withdrawn += extra
                        living_cash += extra; month_living_buf += extra

                if is_invested and target_mths > 0:
                    target_buf = living_target * target_mths
                    if cash < target_buf and tqqq_sh > 0:
                        if (tqqq_sh * tqqq[ci] + cash) >= INITIAL:
                            shortage = target_buf - cash
                            sell_v   = min(shortage / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                            if sell_v > 0:
                                sh  = sell_v / tqqq[ci]
                                annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                                tqqq_sh  = max(0.0, tqqq_sh - sh)
                                cash    += sell_v * (1 - FEE_RATE)

                if living_cash > 0:
                    flow_days.append(j); flow_vals.append(living_cash)

            month_count += 1

        # 신호
        e200 = ema200[ci]; e200ok = not np.isnan(e200) and e200 > 0
        if e200ok:
            sell_sig_raw = closes[ci] < peaks[ci] * (1.0 - TRAIL_THR)
            if closes[ci] > e200:   above_days += 1; below_days = 0
            elif closes[ci] < e200: below_days += 1; above_days = 0
            else:                   above_days = below_days = 0
            buy_sig_raw = above_days >= TIME_FILTER
        else:
            sell_sig_raw = buy_sig_raw = False

        fire_sell = fire_buy = False
        if pend is not None and j >= pend_at:
            fire_sell = (pend == 'sell' and is_invested)
            fire_buy  = (pend == 'buy'  and not is_invested)
            pend = None
        if pend is None and not (fire_sell or fire_buy):
            if is_invested and sell_sig_raw:      pend = 'sell'; pend_at = j + 1
            elif not is_invested and buy_sig_raw: pend = 'buy';  pend_at = j + 1

        if is_invested and fire_sell:
            sell_v      = tqqq_sh * tqqq[ci]
            annual_gain += max(0.0, sell_v - tqqq_sh * tqqq_avg)
            cash       += sell_v * (1 - FEE_RATE)
            tqqq_sh     = 0.0; tqqq_avg = 0.0
            is_invested = False; below_days = 0

        elif not is_invested and fire_buy:
            cur_tot  = cash
            cur_mths = get_buf_months(elapsed_yrs)
            if cur_mths > 0:
                rate_new   = dyn_rate(cur_tot)
                living_cap = p.get_cap(cur_tot)
                monthly_lv = min(cur_tot * rate_new, living_cap)
                target_buf = min(monthly_lv * cur_mths, cur_tot * MAX_BUF_PCT)
                invest_now = max(0.0, cur_tot - target_buf)
            else:
                invest_now = cur_tot
            if invest_now > 0:
                tqqq_sh  = (invest_now * (1 - FEE_RATE)) / tqqq[ci]
                tqqq_avg = tqqq[ci]
                cash     = cur_tot - invest_now
            is_invested = True; above_days = 0

        if cash > 0:
            cash += cash * rp_daily[ci]

        pv  = tqqq_sh * tqqq[ci] if is_invested else 0.0
        tot = pv + cash
        if tot <= 0: break

    ci_end    = min(start_idx + sim_len - 1, n - 1)
    pv_end    = tqqq_sh * tqqq[ci_end] if is_invested else 0.0
    final     = pv_end + cash
    actual_yr = sim_len / 252
    final_eok = round(final / 1e8, 2)
    irr_val   = calc_irr(flow_days, flow_vals, final_eok, actual_yr)
    cagr_val  = round(((max(final, 1) / INITIAL) ** (1 / actual_yr) - 1) * 100, 2) if actual_yr > 0 else -100.0

    return {
        "final":       final_eok,
        "withdrawn":   round(cum_withdrawn / 1e8, 2),
        "cap_saved":   round(cum_cap_saved / 1e8, 2),
        "bankrupt":    bool(final <= 0),
        "irr":         irr_val,
        "cagr":        cagr_val,
        "actual_yr":   round(actual_yr, 1),
        "snaps":    {str(y): snaps.get(y * 252)    for y in SNAP_YRS},
        "snaps_wd": {str(y): snaps_wd.get(y * 252) for y in SNAP_YRS},
        "yearly_living": {str(k): v for k, v in yearly_living.items()},
        "yearly_total":  {str(k): v for k, v in yearly_total.items()},
    }


# ─────────────────────────────────────────────────────────

_SHARED = {}

def _init_worker(tqqq, closes, ema200, peaks, rp_daily, dates_list, fed_rates, starts):
    _SHARED.update({'tqqq': tqqq, 'closes': closes, 'ema200': ema200,
                    'peaks': peaks, 'rp_daily': rp_daily,
                    'dates': pd.DatetimeIndex(dates_list),
                    'fed_rates': fed_rates, 'starts': starts})

def _run_one(p: Param):
    d = _SHARED
    return (p.name, [run_sim(d['tqqq'], d['closes'], d['ema200'], d['peaks'],
                             d['rp_daily'], d['dates'], d['fed_rates'], si, p)
                     for si in d['starts']])

def q50(xs): return float(np.median(xs))
def q10(xs): return float(np.percentile(xs, 10))


def main():
    t0 = time.time()
    print("=" * 85, flush=True)
    print("동적 상한 전략 — 총자산 1억당 N만원 상한 (EARLY24 버퍼 고정)", flush=True)
    print("스왑금리 포함  전체기간 + IRR", flush=True)
    print("=" * 85, flush=True)

    tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates = load_data()
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    all_starts  = [i for i in get_monthly_starts(dates) if i >= first_valid]
    long_starts = set(i for i in all_starts if (len(tqqq) - i) >= MIN_YEARS * 252)
    long_idx    = [i for i, si in enumerate(all_starts) if si in long_starts]

    print(f"코호트: {len(all_starts)}개  IRR 대상: {len(long_starts)}개  전략: {len(STRATEGIES)}개\n", flush=True)

    with mp.Pool(min(mp.cpu_count(), len(STRATEGIES)),
                 initializer=_init_worker,
                 initargs=(tqqq, closes, ema200, peaks, rp_daily,
                           dates.tolist(), fed_rates, all_starts)) as pool:
        raw = dict(pool.map(_run_one, STRATEGIES))

    # ── 핵심 수치 출력 ──
    print(f"{'전략':<13} {'IRR중앙':>8} {'IRR하10%':>9} {'최종중앙':>9} {'인출중앙':>9} {'버퍼2합계':>9}", flush=True)
    print("-" * 62, flush=True)

    for p in STRATEGIES:
        lr = [raw[p.name][i] for i in long_idx]
        irrs = [r["irr"] for r in lr]; fins = [r["final"] for r in lr]
        wds  = [r["withdrawn"] for r in lr]; caps = [r["cap_saved"] for r in lr]
        print(
            f"{p.name:<13} {q50(irrs):>7.1f}%  {q10(irrs):>7.1f}%  "
            f"{q50(fins):>8.0f}억  {q50(wds):>8.0f}억  {q50(caps):>8.0f}억",
            flush=True
        )

    # ── 연도별 중앙값 추적 ──
    print("\n── 연도별 생활비(만원/연) 중앙값 ──", flush=True)
    hdr = f"{'연도':>4}" + "".join(f"  {p.name:>13}" for p in STRATEGIES)
    print(hdr, flush=True)
    print("-" * len(hdr), flush=True)
    for yr in range(1, 51):
        key = str(yr - 1)
        row = f"{yr:>4}년"
        any_data = False
        for p in STRATEGIES:
            lr = [raw[p.name][i] for i in long_idx]
            vals = [r["yearly_living"].get(key) for r in lr if r["yearly_living"].get(key) is not None]
            if vals:
                row += f"  {q50(vals):>12.0f}만"
                any_data = True
            else:
                row += f"  {'—':>13}"
        if any_data:
            print(row, flush=True)
        else:
            break

    print("\n── 연도별 총자산(억) 중앙값 ──", flush=True)
    hdr2 = f"{'연도':>4}" + "".join(f"  {p.name:>13}" for p in STRATEGIES)
    print(hdr2, flush=True)
    print("-" * len(hdr2), flush=True)
    for yr in range(1, 51):
        key = str(yr - 1)
        row = f"{yr:>4}년"
        any_data = False
        for p in STRATEGIES:
            lr = [raw[p.name][i] for i in long_idx]
            vals = [r["yearly_total"].get(key) for r in lr if r["yearly_total"].get(key) is not None]
            if vals:
                row += f"  {q50(vals):>11.1f}억"
                any_data = True
            else:
                row += f"  {'—':>13}"
        if any_data:
            print(row, flush=True)
        else:
            break

    # ── JSON 저장 ──
    summary = {}
    start_dates = [dates[si].strftime("%Y-%m") for si in all_starts]

    for p in STRATEGIES:
        lr = [raw[p.name][i] for i in long_idx]
        irrs = [r["irr"] for r in lr]; fins = [r["final"] for r in lr]
        wds  = [r["withdrawn"] for r in lr]; caps = [r["cap_saved"] for r in lr]
        bnk  = [r["bankrupt"]  for r in lr]

        snap_stats = {}
        for y in SNAP_YRS:
            key = str(y)
            v_f = [r["snaps"].get(key) for r in lr if r["snaps"].get(key) is not None]
            v_w = [r["snaps_wd"].get(key) for r in lr if r["snaps_wd"].get(key) is not None]
            if v_f:
                snap_stats[key] = {"n": len(v_f), "med_fin": round(q50(v_f), 1),
                                   "p10_fin": round(q10(v_f), 1),
                                   "med_wd":  round(q50(v_w), 1) if v_w else None}

        # 연도별 중앙값 시리즈
        yearly_med_living = {}; yearly_med_total = {}
        for yr in range(60):
            key = str(yr)
            v_l = [r["yearly_living"].get(key) for r in lr if r["yearly_living"].get(key) is not None]
            v_t = [r["yearly_total"].get(key)  for r in lr if r["yearly_total"].get(key)  is not None]
            if v_l: yearly_med_living[key] = round(q50(v_l))
            if v_t: yearly_med_total[key]  = round(q50(v_t), 1)

        summary[p.name] = {
            "desc": p.desc,
            "cap_mode": p.cap_mode,
            "per_eok_man": int(p.per_eok / 10_000) if p.cap_mode == 'dynamic' else 0,
            "fixed_cap_man": int(p.fixed_cap / 10_000) if p.cap_mode == 'fixed' else 0,
            "survival": round(100.0 * (1 - sum(bnk) / len(bnk)), 1),
            "med_irr": round(q50(irrs), 2), "p10_irr": round(q10(irrs), 2),
            "med_final": round(q50(fins), 1), "med_withdrawn": round(q50(wds), 1),
            "med_cap_saved": round(q50(caps), 1),
            "snaps": snap_stats,
            "yearly_med_living": yearly_med_living,
            "yearly_med_total":  yearly_med_total,
        }

    out = {
        "meta": {
            "generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "initial": INITIAL, "min_years": MIN_YEARS,
            "with_swap": True, "n_all": len(all_starts), "n_long": len(long_starts),
            "sell_rule": "RULE25 (52주 고점 -25%)",
            "buy_rule": "EMA200 15일 연속 위",
            "withdrawal": "동적 0.3/0.5/0.7% (10억/20억 기준)",
            "buffer": "EARLY24 (처음 5년 24개월)",
        },
        "summary": summary,
        "strategies": [p.name for p in STRATEGIES],
        "start_dates": start_dates,
        "rows": [
            {"s": start_dates[i],
             "yr": raw[STRATEGIES[0].name][i]["actual_yr"],
             **{p.name: {
                 "final": raw[p.name][i]["final"],
                 "withdrawn": raw[p.name][i]["withdrawn"],
                 "irr": raw[p.name][i]["irr"],
                 "bankrupt": raw[p.name][i]["bankrupt"],
                 "snaps": raw[p.name][i]["snaps"],
                 "snaps_wd": raw[p.name][i]["snaps_wd"],
             } for p in STRATEGIES}}
            for i in range(len(all_starts))
        ]
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH}")
    print(f"총 소요: {time.time() - t0:.1f}초")


if __name__ == "__main__":
    main()
