"""
withdrawal_bonus.py

기존 동적인출률 + 추가 1억당 N만원 (포트 임계값 초과 시)

월 인출 = (동적인출률 × 총자산) + (총자산/1억 × N만원)  ← 임계값 이상일 때만

비교:
  NO_CAP      : 기존 동적인출률만 (기준선)
  ADD_10_10억 : 10억 이상, 1억당 10만원 추가
  ADD_10_20억 : 20억 이상, 1억당 10만원 추가
  ADD_30_10억 : 10억 이상, 1억당 30만원 추가
  ADD_30_20억 : 20억 이상, 1억당 30만원 추가

EARLY24 버퍼 고정, 스왑금리+세금 포함, 전체기간 IRR
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/withdrawal_bonus.json"

INITIAL      = 1_000_000_000
MIN_YEARS    = 10
SNAP_YRS     = (10, 20, 30, 40, 50)
SNAP_DAYS    = tuple(y * 252 for y in SNAP_YRS)
EXP_3X       = 0.0088
SWAP_SPREAD  = 0.005
TAX_RATE     = 0.22
DEDUCTION    = 2_500_000
RP_SPREAD    = 0.004
RP_TAX_R     = 0.154
FEE_RATE     = 0.0007
DYN_RATES    = (0.003, 0.005, 0.007)
DYN_THRS     = (1_000_000_000, 2_000_000_000)
TIME_FILTER  = 15
TRAIL_THR    = 0.25
MAX_BUF_PCT  = 0.50
EARLY_MONTHS = 24
EARLY_YRS    = 5.0


@dataclass
class Param:
    name: str
    desc: str
    bonus_thr: float = 0.0    # 추가 인출 시작 임계값 (원), 0=없음
    per_eok:   float = 0.0    # 1억당 추가 인출액 (원)

    def monthly_living(self, total: float) -> float:
        base = dyn_rate(total) * total
        if self.bonus_thr > 0 and total >= self.bonus_thr:
            base += (total / 1e8) * self.per_eok
        return base


def dyn_rate(total: float) -> float:
    if total < DYN_THRS[0]: return DYN_RATES[0]
    if total < DYN_THRS[1]: return DYN_RATES[1]
    return DYN_RATES[2]


STRATEGIES = [
    Param("NO_CAP",      "기존 동적인출률만 (기준선)"),
    Param("ADD_10_10억", "10억↑ 1억당 +10만원",  bonus_thr=1e9,  per_eok=100_000),
    Param("ADD_10_20억", "20억↑ 1억당 +10만원",  bonus_thr=2e9,  per_eok=100_000),
    Param("ADD_30_10억", "10억↑ 1억당 +30만원",  bonus_thr=1e9,  per_eok=300_000),
    Param("ADD_30_20억", "20억↑ 1억당 +30만원",  bonus_thr=2e9,  per_eok=300_000),
]


# ─────────────────────────────────────────────────────────

def calc_irr(flow_days, flow_vals, final, years):
    if years < 1 or final < 0: return -99.0
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

    peaks    = pd.Series(closes).rolling(252, min_periods=1).max().values
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
    year_living   = 0.0

    flow_days = []; flow_vals = []
    snaps = {}; snaps_wd = {}
    yearly_living = {}
    yearly_total  = {}

    below_days = 0; above_days = 0
    pend = None; pend_at = 0
    last_mon = None

    for j in range(sim_len):
        ci          = start_idx + j
        d           = dates[ci]
        mon         = (d.year, d.month)
        elapsed_yrs = j / 252.0

        for sd in SNAP_DAYS:
            if sd not in snaps and j >= sd:
                pv_s = tqqq_sh * tqqq[ci] if is_invested else 0.0
                snaps[sd]    = round((pv_s + cash) / 1e8, 1)
                snaps_wd[sd] = round(cum_withdrawn / 1e8, 1)

        if mon != last_mon:
            last_mon = mon

            if d.year != cur_year:
                yr_off = int((j - 1) / 252.0)
                pv_y   = tqqq_sh * tqqq[ci] if is_invested else 0.0
                yearly_living[yr_off] = round(year_living / 1e4)
                yearly_total[yr_off]  = round((pv_y + cash) / 1e8, 1)
                year_living = 0.0

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
                target_mths = get_buf_months(elapsed_yrs)
                living_tgt  = p.monthly_living(tot)

                # 생활비 지출
                if is_invested:
                    living_cash = min(living_tgt, cash)
                    cash        = max(0.0, cash - living_cash)
                else:
                    yearly_avail = cash
                    yearly_need  = living_tgt * 12
                    lr = (1.0 if yearly_need <= 0 or yearly_avail / yearly_need >= 2 else
                          0.7 if yearly_avail / yearly_need >= 1 else
                          0.5 if yearly_avail / yearly_need >= 0.5 else 0.3)
                    living_cash = living_tgt * lr
                    cash        = max(0.0, cash - living_cash)

                cum_withdrawn += living_cash
                year_living   += living_cash

                # phase-out 후기: TQQQ 소량 매도
                if is_invested and target_mths == 0:
                    if living_cash < living_tgt and tqqq_sh > 0:
                        short  = living_tgt - living_cash
                        sell_v = min(short / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                        sh     = sell_v / tqqq[ci]
                        annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                        tqqq_sh      = max(0.0, tqqq_sh - sh)
                        cash        += sell_v * (1 - FEE_RATE)
                        extra        = min(living_tgt - living_cash, cash)
                        cash        -= extra; cum_withdrawn += extra
                        living_cash += extra; year_living   += extra

                # 버퍼1 보충 (floor 조건)
                if is_invested and target_mths > 0:
                    base_living = dyn_rate(tot) * tot   # 버퍼는 기본 동적인출 기준
                    target_buf  = base_living * target_mths
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
                base_lv    = dyn_rate(cur_tot) * cur_tot
                target_buf = min(base_lv * cur_mths, cur_tot * MAX_BUF_PCT)
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
        if pv + cash <= 0: break

    ci_end    = min(start_idx + sim_len - 1, n - 1)
    pv_end    = tqqq_sh * tqqq[ci_end] if is_invested else 0.0
    final     = pv_end + cash
    actual_yr = sim_len / 252
    final_eok = round(final / 1e8, 2)
    irr_val   = calc_irr(flow_days, flow_vals, final_eok, actual_yr)
    cagr_val  = round(((max(final, 1) / INITIAL) ** (1 / actual_yr) - 1) * 100, 2) if actual_yr > 0 else -100.0

    return {
        "final":         final_eok,
        "withdrawn":     round(cum_withdrawn / 1e8, 2),
        "bankrupt":      bool(final <= 0),
        "irr":           irr_val,
        "cagr":          cagr_val,
        "actual_yr":     round(actual_yr, 1),
        "snaps":         {str(y): snaps.get(y * 252)    for y in SNAP_YRS},
        "snaps_wd":      {str(y): snaps_wd.get(y * 252) for y in SNAP_YRS},
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
    print("기존 동적인출 + 추가 1억당 N만원 전략", flush=True)
    print("스왑금리 포함  전체기간 + IRR  EARLY24 버퍼", flush=True)
    print("=" * 85, flush=True)

    tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates = load_data()
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    all_starts  = [i for i in get_monthly_starts(dates) if i >= first_valid]
    long_starts = set(i for i in all_starts if (len(tqqq) - i) >= MIN_YEARS * 252)
    long_idx    = [i for i, si in enumerate(all_starts) if si in long_starts]

    print(f"코호트: {len(all_starts)}개  IRR 대상: {len(long_starts)}개  전략: {len(STRATEGIES)}개\n")

    with mp.Pool(min(mp.cpu_count(), len(STRATEGIES)),
                 initializer=_init_worker,
                 initargs=(tqqq, closes, ema200, peaks, rp_daily,
                           dates.tolist(), fed_rates, all_starts)) as pool:
        raw = dict(pool.map(_run_one, STRATEGIES))

    # ── 핵심 수치 ──
    print(f"\n{'전략':<14} {'IRR중앙':>8} {'IRR하10%':>9} {'최종중앙':>9} {'인출합계':>9}", flush=True)
    print("-" * 54, flush=True)
    for p in STRATEGIES:
        lr   = [raw[p.name][i] for i in long_idx]
        irrs = [r["irr"] for r in lr]; fins = [r["final"] for r in lr]
        wds  = [r["withdrawn"] for r in lr]
        print(f"{p.name:<14} {q50(irrs):>7.1f}%  {q10(irrs):>7.1f}%  "
              f"{q50(fins):>8.0f}억  {q50(wds):>8.0f}억", flush=True)

    # ── 연도별 생활비(억원/년) 비교 ──
    print("\n── 연도별 생활비(억원/년) 중앙값 ──", flush=True)
    hdr = f"{'연도':>4}" + "".join(f"  {p.name:>14}" for p in STRATEGIES)
    print(hdr); print("-" * len(hdr), flush=True)
    for yr in range(1, 51):
        key = str(yr - 1)
        vals_per_strat = []
        any_data = False
        for p in STRATEGIES:
            lr   = [raw[p.name][i] for i in long_idx]
            vals = [r["yearly_living"].get(key) for r in lr if r["yearly_living"].get(key) is not None]
            if vals:
                vals_per_strat.append(f"{q50(vals)/100:>13.1f}억")
                any_data = True
            else:
                vals_per_strat.append(f"{'—':>14}")
        if not any_data: break
        print(f"{yr:>4}년" + "".join(f"  {v}" for v in vals_per_strat), flush=True)

    # ── 연도별 총자산(억) 비교 ──
    print("\n── 연도별 총자산(억) 중앙값 ──", flush=True)
    print(hdr); print("-" * len(hdr), flush=True)
    for yr in range(1, 51):
        key = str(yr - 1)
        vals_per_strat = []
        any_data = False
        for p in STRATEGIES:
            lr   = [raw[p.name][i] for i in long_idx]
            vals = [r["yearly_total"].get(key) for r in lr if r["yearly_total"].get(key) is not None]
            if vals:
                vals_per_strat.append(f"{q50(vals):>13.1f}억")
                any_data = True
            else:
                vals_per_strat.append(f"{'—':>14}")
        if not any_data: break
        print(f"{yr:>4}년" + "".join(f"  {v}" for v in vals_per_strat), flush=True)

    # ── JSON 저장 ──
    summary = {}
    start_dates = [dates[si].strftime("%Y-%m") for si in all_starts]
    for p in STRATEGIES:
        lr   = [raw[p.name][i] for i in long_idx]
        irrs = [r["irr"] for r in lr]; fins = [r["final"] for r in lr]
        wds  = [r["withdrawn"] for r in lr]; bnk = [r["bankrupt"] for r in lr]

        snap_stats = {}
        for y in SNAP_YRS:
            key = str(y)
            v_f = [r["snaps"].get(key) for r in lr if r["snaps"].get(key) is not None]
            v_w = [r["snaps_wd"].get(key) for r in lr if r["snaps_wd"].get(key) is not None]
            if v_f:
                snap_stats[key] = {"n": len(v_f), "med_fin": round(q50(v_f), 1),
                                   "p10_fin": round(q10(v_f), 1),
                                   "med_wd": round(q50(v_w), 1) if v_w else None}

        yearly_med_living = {}; yearly_med_total = {}
        for yr in range(60):
            key = str(yr)
            v_l = [r["yearly_living"].get(key) for r in lr if r["yearly_living"].get(key) is not None]
            v_t = [r["yearly_total"].get(key)  for r in lr if r["yearly_total"].get(key)  is not None]
            if v_l: yearly_med_living[key] = round(q50(v_l))
            if v_t: yearly_med_total[key]  = round(q50(v_t), 1)

        summary[p.name] = {
            "desc": p.desc,
            "bonus_thr_eok": round(p.bonus_thr / 1e8),
            "per_eok_man": int(p.per_eok / 10_000),
            "survival": round(100.0 * (1 - sum(bnk) / len(bnk)), 1),
            "med_irr": round(q50(irrs), 2), "p10_irr": round(q10(irrs), 2),
            "med_final": round(q50(fins), 1), "med_withdrawn": round(q50(wds), 1),
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
            "base_withdrawal": "동적 0.3/0.5/0.7% (10억/20억 기준)",
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
