"""
withdrawal_cashbuffer5.py

버퍼1 (운용 현금) + 버퍼2 (생활비 상한 초과분 자동 축적) 전략

아이디어:
  현실적으로 포트폴리오가 커져도 실제 생활비는 월 1,500만원을 넘기 어렵다.
  동적 인출률로 계산된 금액이 1,500만원을 넘으면 초과분은 포트폴리오 안에
  현금으로 자동 남아 "버퍼2"가 됨.

  버퍼1: EARLY24 운용 현금 (포트 내, RP이자 적용)
  버퍼2: 생활비 상한 초과분이 포트 내 현금으로 쌓인 것 (별도 계좌가 아닌, 자연 축적)

  → 포트가 클 때 더 많이 쌓이고, 하락장에서 TQQQ 안 팔아도 되는 여유 증가

비교 전략 (전체기간, IRR 기준):
  B0            기준선 (상한 없음)
  EARLY24       현재 최선 (상한 없음)
  B0_CAP        B0 + 1,500만원 상한
  EARLY24_CAP   EARLY24 + 1,500만원 상한  ← 핵심 실험
  CAP_ONLY      B0 방식 + 1,500만원 상한만 (버퍼1 없음, 버퍼2만)

추가 출력:
  cap_saved_eok: 상한으로 인해 포트에 남은 누적 금액 (버퍼2 총량)
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/withdrawal_cashbuffer5.json"

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
TAPER_BRK   = (1_000_000_000, 2_000_000_000)
TAPER_MTHS  = (24, 12, 0)

LIVING_CAP  = 15_000_000   # 버퍼2 기준: 월 생활비 상한 (1,500만원)


@dataclass
class Param:
    name: str
    desc: str
    buf_mode: str = 'none'    # 'none' | 'fixed' | 'early' | 'taper'
    fixed_months: int = 0
    refill_cond: str = ''
    early_months: int = 0
    early_yrs: float = 5.0
    use_cap: bool = False     # True = 버퍼2 활성화 (1,500만원 생활비 상한)


STRATEGIES = [
    Param("B0",
          "기준선: 상한 없음",
          buf_mode='none', use_cap=False),
    Param("EARLY24",
          "처음 5년 24개월 버퍼1 → 이후 B0 (상한 없음)",
          buf_mode='early', early_months=24, refill_cond='floor', early_yrs=5.0,
          use_cap=False),
    Param("CAP_ONLY",
          "상한 1,500만원만 (버퍼1 없음)",
          buf_mode='none', use_cap=True),
    Param("B0_CAP",
          "B0 + 상한 1,500만원 (버퍼2만)",
          buf_mode='none', use_cap=True),
    Param("EARLY24_CAP",
          "처음 5년 24개월 버퍼1 + 상한 1,500만원 버퍼2",
          buf_mode='early', early_months=24, refill_cond='floor', early_yrs=5.0,
          use_cap=True),
    Param("EARLY12_CAP",
          "처음 5년 12개월 버퍼1 + 상한 1,500만원 버퍼2",
          buf_mode='early', early_months=12, refill_cond='floor', early_yrs=5.0,
          use_cap=True),
]


# ─────────────────────────────────────────────────────────

def dyn_rate(total: float) -> float:
    if total < DYN_THRS[0]: return DYN_RATES[0]
    if total < DYN_THRS[1]: return DYN_RATES[1]
    return DYN_RATES[2]


def get_buf_months(p: Param, elapsed_yrs: float, total: float) -> int:
    if p.buf_mode == 'none':
        return 0
    elif p.buf_mode == 'fixed':
        return p.fixed_months
    elif p.buf_mode == 'early':
        return p.early_months if elapsed_yrs < p.early_yrs else 0
    elif p.buf_mode == 'taper':
        if total < TAPER_BRK[0]:   return TAPER_MTHS[0]
        elif total < TAPER_BRK[1]: return TAPER_MTHS[1]
        else:                      return TAPER_MTHS[2]
    return 0


def calc_irr(flow_days: list, flow_vals: list, final: float, years: float) -> float:
    if years < 1 or final < 0:
        return -99.0
    t  = np.array([0.0] + [d / 252 for d in flow_days] + [years])
    cf = np.array([-INITIAL / 1e8] + [v / 1e8 for v in flow_vals] + [final])
    lo, hi = -0.99, 5.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if (cf / (1.0 + mid) ** t).sum() > 0:
            lo = mid
        else:
            hi = mid
    return round(mid * 100, 2)


def load_data(with_swap: bool = True):
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

    if with_swap:
        f3 = (1.0 + ret * 3.0 - 2.0 * (fed_daily + SWAP_SPREAD / 252.0)) * (1.0 - EXP_3X / 252)
    else:
        f3 = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252)
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
# 시뮬레이션 코어
# ─────────────────────────────────────────────────────────

def run_sim(tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(tqqq)
    sim_len = n - start_idx

    e0             = ema200[start_idx]
    e0_valid       = not np.isnan(e0) and e0 > 0
    below_at_start = e0_valid and closes[start_idx] < e0

    if below_at_start:
        is_invested = False; cash = float(INITIAL); tqqq_sh = 0.0; tqqq_avg = 0.0
    else:
        is_invested  = True
        init_months  = get_buf_months(p, 0.0, float(INITIAL))
        init_buf     = min(INITIAL * DYN_RATES[0] * init_months, INITIAL * MAX_BUF_PCT) if init_months > 0 else 0.0
        invest_amt   = INITIAL - init_buf
        tqqq_sh      = (invest_amt * (1 - FEE_RATE)) / tqqq[start_idx]
        tqqq_avg     = tqqq[start_idx]
        cash         = init_buf

    annual_gain   = 0.0
    tax_due       = 0.0
    cur_year      = dates[start_idx].year
    cum_withdrawn = 0.0
    cum_cap_saved = 0.0   # 상한으로 포트에 남은 누적금 (버퍼2 총량)
    refill_count  = 0
    drought_y1_5  = 0
    drought_y6_20 = 0

    flow_days: list = []
    flow_vals: list = []
    snaps:    dict  = {}
    snaps_wd: dict  = {}

    below_days = 0; above_days = 0
    pend = None; pend_at = 0
    last_mon = None; monthly_cap = 0.0
    peak_tot = float(INITIAL); max_dd = 0.0; min_val = float('inf')

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
                tax_due += max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                annual_gain = 0.0; cur_year = d.year

            if tax_due > 0:
                if cash >= tax_due:
                    cash -= tax_due; tax_due = 0.0
                elif is_invested:
                    need    = (tax_due - cash) / (1 - FEE_RATE)
                    sell_v  = min(need, tqqq_sh * tqqq[ci])
                    sh      = sell_v / tqqq[ci]
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
                target_mths = get_buf_months(p, elapsed_yrs, tot)

                # ── 버퍼2: 생활비 상한 적용 ──
                # 상한 초과분은 포트폴리오에 현금으로 자연 잔류 (따로 빼지 않음)
                living_target = min(monthly_cap, LIVING_CAP) if p.use_cap else monthly_cap
                cap_saved_now = max(0.0, monthly_cap - living_target)
                cum_cap_saved += cap_saved_now

                # ── 생활비 지출 (현금에서 먼저) ──
                if is_invested:
                    living_cash = min(living_target, cash)
                    cash        = max(0.0, cash - living_cash)
                else:
                    yearly_target = living_target * 12
                    lr = (1.0 if yearly_target <= 0 or cash / yearly_target >= 2 else
                          0.7 if cash / yearly_target >= 1 else
                          0.5 if cash / yearly_target >= 0.5 else 0.3)
                    living_cash = living_target * lr
                    cash        = max(0.0, cash - living_cash)

                cum_withdrawn += living_cash
                month_living   = living_cash

                # ── B0 / phase-out 후기: 생활비 부족 시 TQQQ 소량 매도 ──
                if is_invested and target_mths == 0:
                    if month_living < living_target and tqqq_sh > 0:
                        short  = living_target - month_living
                        sell_v = min(short / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                        sh     = sell_v / tqqq[ci]
                        annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                        tqqq_sh  = max(0.0, tqqq_sh - sh)
                        cash    += sell_v * (1 - FEE_RATE)
                        extra    = min(living_target - month_living, cash)
                        cash    -= extra
                        cum_withdrawn += extra
                        month_living  += extra

                # ── 버퍼1 보충 ──
                if is_invested and target_mths > 0:
                    target_buf = living_target * target_mths   # 상한 적용된 기준으로 버퍼 크기 계산
                    if cash < target_buf and tqqq_sh > 0:
                        can_refill = False
                        if p.refill_cond == 'free':
                            can_refill = True
                        elif p.refill_cond == 'floor':
                            can_refill = (tqqq_sh * tqqq[ci] + cash) >= INITIAL
                        if can_refill:
                            shortage = target_buf - cash
                            sell_v   = min(shortage / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                            if sell_v > 0:
                                sh  = sell_v / tqqq[ci]
                                annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                                tqqq_sh  = max(0.0, tqqq_sh - sh)
                                cash    += sell_v * (1 - FEE_RATE)
                                refill_count += 1

                # 생활비 공백
                if living_target > 0 and month_living < living_target * 0.9:
                    if elapsed_yrs <= 5.0: drought_y1_5 += 1
                    else:                  drought_y6_20 += 1

                if month_living > 0:
                    flow_days.append(j)
                    flow_vals.append(month_living)

        # ═══ 신호 처리 ═══
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
            if is_invested and sell_sig_raw:     pend = 'sell'; pend_at = j + 1
            elif not is_invested and buy_sig_raw: pend = 'buy';  pend_at = j + 1

        if is_invested and fire_sell:
            sell_v      = tqqq_sh * tqqq[ci]
            annual_gain += max(0.0, sell_v - tqqq_sh * tqqq_avg)
            cash       += sell_v * (1 - FEE_RATE)
            tqqq_sh     = 0.0; tqqq_avg = 0.0
            is_invested = False; below_days = 0

        elif not is_invested and fire_buy:
            cur_tot    = cash
            cur_mths   = get_buf_months(p, elapsed_yrs, cur_tot)
            if cur_mths > 0:
                # 버퍼1 크기: 상한 적용된 생활비 기준
                rate_new      = dyn_rate(cur_tot)
                monthly_live  = min(cur_tot * rate_new, LIVING_CAP) if p.use_cap else cur_tot * rate_new
                target_buf    = min(monthly_live * cur_mths, cur_tot * MAX_BUF_PCT)
                invest_now    = max(0.0, cur_tot - target_buf)
            else:
                invest_now = cur_tot
            if invest_now > 0:
                tqqq_sh  = (invest_now * (1 - FEE_RATE)) / tqqq[ci]
                tqqq_avg = tqqq[ci]
                cash     = cur_tot - invest_now
            is_invested = True; above_days = 0

        if cash > 0:
            cash += cash * rp_daily[ci]

        pv       = tqqq_sh * tqqq[ci] if is_invested else 0.0
        tot      = pv + cash
        min_val  = min(min_val, tot)
        peak_tot = max(peak_tot, tot)
        if peak_tot > 0: max_dd = max(max_dd, 1.0 - tot / peak_tot)
        if tot <= 0: break

    ci_end    = min(start_idx + sim_len - 1, n - 1)
    pv_end    = tqqq_sh * tqqq[ci_end] if is_invested else 0.0
    final     = pv_end + cash
    actual_yr = sim_len / 252
    final_eok = round(final / 1e8, 2)
    irr_val   = calc_irr(flow_days, flow_vals, final_eok, actual_yr)
    cagr_val  = round(((max(final, 1) / INITIAL) ** (1 / actual_yr) - 1) * 100, 2) if actual_yr > 0 else -100.0
    if min_val == float('inf'): min_val = 0.0

    return {
        "final":         final_eok,
        "withdrawn":     round(cum_withdrawn / 1e8, 2),
        "cap_saved":     round(cum_cap_saved / 1e8, 2),
        "min":           round(min_val / 1e8, 4),
        "bankrupt":      bool(final <= 0),
        "irr":           irr_val,
        "cagr":          cagr_val,
        "actual_yr":     round(actual_yr, 1),
        "refills":       refill_count,
        "drought_y1_5":  drought_y1_5,
        "drought_y6_20": drought_y6_20,
        "snaps":    {str(y): snaps.get(y * 252)    for y in SNAP_YRS},
        "snaps_wd": {str(y): snaps_wd.get(y * 252) for y in SNAP_YRS},
    }


# ─────────────────────────────────────────────────────────
# 병렬 실행
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
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-swap", action="store_true")
    args = parser.parse_args()
    with_swap = not args.no_swap

    t0 = time.time()
    print("=" * 90, flush=True)
    print("버퍼1 (운용) + 버퍼2 (생활비 상한 1,500만원) 전략 백테스트", flush=True)
    print(f"{'스왑금리 포함' if with_swap else '운용보수만'}  전체기간 + IRR", flush=True)
    print("=" * 90, flush=True)

    tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates = load_data(with_swap)
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    all_starts  = [i for i in get_monthly_starts(dates) if i >= first_valid]
    long_starts = set(i for i in all_starts if (len(tqqq) - i) >= MIN_YEARS * 252)
    long_idx    = [i for i, si in enumerate(all_starts) if si in long_starts]

    print(f"전체 코호트: {len(all_starts)}개  IRR 대상: {len(long_starts)}개  전략: {len(STRATEGIES)}개\n", flush=True)

    with mp.Pool(min(mp.cpu_count(), len(STRATEGIES)),
                 initializer=_init_worker,
                 initargs=(tqqq, closes, ema200, peaks, rp_daily,
                           dates.tolist(), fed_rates, all_starts)) as pool:
        raw = dict(pool.map(_run_one, STRATEGIES))

    # ── 결과 출력 ──
    hdr = (f"{'전략':<16} {'IRR중앙':>7} {'IRR하10%':>8} "
           f"{'최종중앙':>9} {'인출중앙':>9} {'버퍼2합계':>9}  "
           f"{'공백초기':>7} {'공백후기':>7}")
    print(hdr, flush=True)
    print("-" * len(hdr), flush=True)

    snap_hdr = f"{'전략':<16}" + "".join(f"  {y:>3}년자산" for y in SNAP_YRS if y <= 40)
    print("\n" + snap_hdr, flush=True)
    print("-" * len(snap_hdr), flush=True)

    summary = {}
    start_dates = [dates[si].strftime("%Y-%m") for si in all_starts]

    for p in STRATEGIES:
        rows      = raw[p.name]
        lr        = [rows[i] for i in long_idx]

        irrs  = [r["irr"]         for r in lr]
        fins  = [r["final"]       for r in lr]
        wds   = [r["withdrawn"]   for r in lr]
        caps  = [r["cap_saved"]   for r in lr]
        bnk   = [r["bankrupt"]    for r in lr]
        dr1   = [r["drought_y1_5"]  for r in lr]
        dr2   = [r["drought_y6_20"] for r in lr]

        med_irr = q50(irrs); p10_irr = q10(irrs)
        med_fin = q50(fins); med_wd  = q50(wds)
        med_cap = q50(caps)
        surv    = 100.0 * (1 - sum(bnk) / len(bnk))

        print(
            f"{p.name:<16} {med_irr:>6.1f}%  {p10_irr:>6.1f}%  "
            f"{med_fin:>8.0f}억  {med_wd:>8.0f}억  {med_cap:>8.0f}억  "
            f"{q50(dr1):>5.1f}개월  {q50(dr2):>5.1f}개월",
            flush=True
        )

        snap_line = f"{p.name:<16}"
        for y in SNAP_YRS:
            if y > 40: continue
            vals = [r["snaps"].get(str(y)) for r in lr if r["snaps"].get(str(y)) is not None]
            snap_line += f"  {q50(vals):>7.0f}억" if vals else f"  {'—':>7}"
        print(snap_line, flush=True)

        snap_stats = {}
        for y in SNAP_YRS:
            key = str(y)
            v_f = [r["snaps"].get(key)    for r in lr if r["snaps"].get(key) is not None]
            v_w = [r["snaps_wd"].get(key) for r in lr if r["snaps_wd"].get(key) is not None]
            if v_f:
                snap_stats[key] = {"n": len(v_f), "med_fin": round(q50(v_f), 1),
                                   "p10_fin": round(q10(v_f), 1),
                                   "med_wd": round(q50(v_w), 1) if v_w else None}

        summary[p.name] = {
            "desc": p.desc, "buf_mode": p.buf_mode,
            "early_months": p.early_months, "refill_cond": p.refill_cond,
            "use_cap": p.use_cap, "living_cap_man": int(LIVING_CAP / 10_000),
            "survival": round(surv, 1),
            "med_irr": round(med_irr, 2), "p10_irr": round(p10_irr, 2),
            "med_final": round(med_fin, 1), "med_withdrawn": round(med_wd, 1),
            "med_cap_saved": round(med_cap, 1),
            "med_drought_y1_5": round(q50(dr1), 1),
            "med_drought_y6_20": round(q50(dr2), 1),
            "snaps": snap_stats,
        }

    out = {
        "meta": {
            "generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "initial": INITIAL, "min_years": MIN_YEARS,
            "with_swap": with_swap, "n_all": len(all_starts),
            "n_long": len(long_starts),
            "sell_rule": f"RULE25 (52주 고점 -{int(TRAIL_THR*100)}%)",
            "buy_rule": f"EMA200 {TIME_FILTER}일 연속 위",
            "withdrawal": "동적 0.3/0.5/0.7% (10억/20억 기준)",
            "living_cap_man": int(LIVING_CAP / 10_000),
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
                 "cap_saved": raw[p.name][i]["cap_saved"],
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
