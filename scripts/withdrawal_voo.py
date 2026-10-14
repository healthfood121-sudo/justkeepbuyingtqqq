"""
withdrawal_voo.py

TQQQ + VOO 분산 전략
총자산 > 임계값이면 초과분 → VOO (SPX 1x)

아이디어: mcv 사이트처럼 자산이 커지면 VOO에 분산.
VOO는 TQQQ 하락장에서도 유지 → 하락장 생활비 쿠션 역할.
스왑금리+세금 현실 비용 반영.

전략:
  B0        : TQQQ만 (기준선, EARLY24 버퍼)
  VOO_20    : 총자산 20억 초과분 → VOO (EARLY24 버퍼)
  VOO_30    : 총자산 30억 초과분 → VOO (EARLY24 버퍼)
  VOO_50    : 총자산 50억 초과분 → VOO (EARLY24 버퍼)

공통: EARLY24 버퍼 (처음 5년 24개월)
VOO 매도는 하락장 생활비 부족 시에만 (불가피할 때)
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass, field

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/withdrawal_voo.json"

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

VOO_DIVIDEND_ANNUAL = 0.013   # 연 1.3% 배당 (세전)
VOO_DIV_WITHHOLD    = 0.15    # 미국 배당 원천징수세 15%
VOO_EXP_RATIO       = 0.0003  # 운용보수 0.03%/yr


@dataclass
class Param:
    name: str
    desc: str
    voo_thr: float = 0.0   # 0 = VOO 없음, >0 = 이 금액 초과분 → VOO (원)


STRATEGIES = [
    Param("B0",      "TQQQ만 (기준선)",            voo_thr=0.0),
    Param("VOO_20",  "20억 초과분 → VOO",          voo_thr=2_000_000_000.0),
    Param("VOO_30",  "30억 초과분 → VOO",          voo_thr=3_000_000_000.0),
    Param("VOO_50",  "50억 초과분 → VOO",          voo_thr=5_000_000_000.0),
]


# ─────────────────────────────────────────────────────────

def dyn_rate(total: float) -> float:
    if total < DYN_THRS[0]: return DYN_RATES[0]
    if total < DYN_THRS[1]: return DYN_RATES[1]
    return DYN_RATES[2]


def get_buf_months(elapsed_yrs: float) -> int:
    return EARLY_MONTHS if elapsed_yrs < EARLY_YRS else 0


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


def load_data():
    # NDX 데이터
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

    # SPX 데이터 → VOO 합성 (기간 정렬)
    spx = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    # NDX 날짜와 정렬
    spx_idx = {str(d.date()): c for d, c in zip(spx["Date"], spx["Close"])}
    spx_aligned = np.array([spx_idx.get(str(d.date()), np.nan) for d in dates])

    # NaN 전방 채우기 (거래일 불일치)
    for i in range(1, n):
        if np.isnan(spx_aligned[i]):
            spx_aligned[i] = spx_aligned[i - 1]
    # 시작부분 NaN: 첫 유효값으로 채우기
    first_valid_spx = next((i for i, v in enumerate(spx_aligned) if not np.isnan(v)), 0)
    for i in range(first_valid_spx):
        spx_aligned[i] = spx_aligned[first_valid_spx]

    spx_ret = np.insert(np.diff(spx_aligned) / spx_aligned[:-1], 0, 0.0)
    spx_ret = np.nan_to_num(spx_ret, nan=0.0)

    # VOO: SPX 1x - 운용보수 + 배당 (세후)
    # 배당은 매월 말에 지급 (daily로 분산 처리)
    net_div_daily = VOO_DIVIDEND_ANNUAL * (1.0 - VOO_DIV_WITHHOLD) / 252.0
    voo_factor = (1.0 + spx_ret) * (1.0 - VOO_EXP_RATIO / 252.0) + net_div_daily
    voo_factor[0] = 1.0
    voo = 100.0 * np.cumprod(voo_factor)

    return tqqq, voo, closes, ema200, peaks, rp_daily, dates, fed_rates


def get_monthly_starts(dates):
    seen, out = set(), []
    for i, d in enumerate(dates):
        if (d.year, d.month) not in seen:
            seen.add((d.year, d.month))
            out.append(i)
    return out


# ─────────────────────────────────────────────────────────

def run_sim(tqqq, voo, closes, ema200, peaks, rp_daily, dates, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(tqqq)
    sim_len = n - start_idx

    e0             = ema200[start_idx]
    e0_valid       = not np.isnan(e0) and e0 > 0
    below_at_start = e0_valid and closes[start_idx] < e0

    if below_at_start:
        is_invested = False; cash = float(INITIAL); tqqq_sh = 0.0; tqqq_avg = 0.0
    else:
        is_invested = True
        init_buf    = min(INITIAL * DYN_RATES[0] * EARLY_MONTHS, INITIAL * MAX_BUF_PCT)
        tqqq_sh     = ((INITIAL - init_buf) * (1 - FEE_RATE)) / tqqq[start_idx]
        tqqq_avg    = tqqq[start_idx]
        cash        = init_buf

    voo_sh  = 0.0   # VOO 보유 수량
    voo_avg = 0.0   # VOO 평균 매수단가 (세금 계산용)

    annual_gain   = 0.0
    tax_due       = 0.0
    cur_year      = dates[start_idx].year
    cum_withdrawn = 0.0
    cum_to_voo    = 0.0   # 누적 VOO 이체금액

    flow_days: list = []
    flow_vals: list = []
    snaps:    dict  = {}
    snaps_wd: dict  = {}

    below_days = 0; above_days = 0
    pend = None; pend_at = 0
    last_mon = None
    peak_tot = float(INITIAL)

    for j in range(sim_len):
        ci          = start_idx + j
        d           = dates[ci]
        mon         = (d.year, d.month)
        elapsed_yrs = j / 252.0

        for sd in SNAP_DAYS:
            if sd not in snaps and j >= sd:
                pv_s    = tqqq_sh * tqqq[ci] if is_invested else 0.0
                voo_val = voo_sh  * voo[ci]
                snaps[sd]    = round((pv_s + cash + voo_val) / 1e8, 1)
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
                    need   = (tax_due - cash) / (1 - FEE_RATE)
                    sell_v = min(need, tqqq_sh * tqqq[ci])
                    sh     = sell_v / tqqq[ci]
                    annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                    tqqq_sh = max(0.0, tqqq_sh - sh)
                    cash   += sell_v * (1 - FEE_RATE)
                    cash    = max(0.0, cash - tax_due); tax_due = 0.0
                elif voo_sh > 0:
                    need   = (tax_due - cash) / (1 - FEE_RATE)
                    sell_v = min(need, voo_sh * voo[ci])
                    sh     = sell_v / voo[ci]
                    annual_gain += max(0.0, sell_v - sh * voo_avg)
                    voo_sh  = max(0.0, voo_sh - sh)
                    cash   += sell_v * (1 - FEE_RATE)
                    cash    = max(0.0, cash - tax_due); tax_due = 0.0
                else:
                    cash = max(0.0, cash - tax_due); tax_due = 0.0

            if j > 0:
                pv       = tqqq_sh * tqqq[ci] if is_invested else 0.0
                voo_val  = voo_sh  * voo[ci]
                tot      = pv + cash + voo_val
                monthly_cap = tot * dyn_rate(tot)
                target_mths = get_buf_months(elapsed_yrs)

                # ── VOO 리밸런싱: 총자산 > 임계값이면 초과분 → VOO ──
                if p.voo_thr > 0 and is_invested and tot > p.voo_thr:
                    target_voo = tot - p.voo_thr
                    if voo_val < target_voo:
                        transfer_net = target_voo - voo_val
                        sell_v       = min(transfer_net / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                        if sell_v > 0:
                            sh = sell_v / tqqq[ci]
                            annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                            tqqq_sh  = max(0.0, tqqq_sh - sh)
                            net_buy  = sell_v * (1 - FEE_RATE)
                            new_sh   = net_buy / voo[ci]
                            if voo_sh > 0:
                                voo_avg = (voo_sh * voo_avg + net_buy) / (voo_sh + new_sh)
                            else:
                                voo_avg = voo[ci]
                            voo_sh      += new_sh
                            cum_to_voo  += net_buy

                # 재계산 (리밸런싱 후)
                pv       = tqqq_sh * tqqq[ci] if is_invested else 0.0
                voo_val  = voo_sh  * voo[ci]
                tot      = pv + cash + voo_val

                # 생활비 지출
                if is_invested:
                    living_cash = min(monthly_cap, cash)
                    cash        = max(0.0, cash - living_cash)
                else:
                    # 하락장: cash → VOO 순으로 사용
                    yearly_target = monthly_cap * 12
                    total_avail   = cash + voo_val
                    lr = (1.0 if yearly_target <= 0 or total_avail / yearly_target >= 2 else
                          0.7 if total_avail / yearly_target >= 1 else
                          0.5 if total_avail / yearly_target >= 0.5 else 0.3)
                    living_target_adj = monthly_cap * lr
                    living_cash = min(living_target_adj, cash)
                    cash = max(0.0, cash - living_cash)
                    # 현금 부족 시 VOO 매도
                    if living_cash < living_target_adj and voo_sh > 0:
                        short  = living_target_adj - living_cash
                        sell_v = min(short / (1 - FEE_RATE), voo_sh * voo[ci])
                        sh     = sell_v / voo[ci]
                        annual_gain += max(0.0, sell_v - sh * voo_avg)
                        voo_sh = max(0.0, voo_sh - sh)
                        extra  = sell_v * (1 - FEE_RATE)
                        living_cash += min(short, extra)
                        cash = max(0.0, cash + extra - min(short, extra))

                cum_withdrawn += living_cash

                # phase-out 후기: 부족 시 TQQQ 소량 매도
                if is_invested and target_mths == 0:
                    if living_cash < monthly_cap and tqqq_sh > 0:
                        short  = monthly_cap - living_cash
                        sell_v = min(short / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                        sh     = sell_v / tqqq[ci]
                        annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                        tqqq_sh  = max(0.0, tqqq_sh - sh)
                        cash    += sell_v * (1 - FEE_RATE)
                        extra    = min(monthly_cap - living_cash, cash)
                        cash    -= extra
                        cum_withdrawn += extra
                        living_cash   += extra

                # 버퍼1 보충 (floor 조건)
                if is_invested and target_mths > 0:
                    target_buf = monthly_cap * target_mths
                    if cash < target_buf and tqqq_sh > 0:
                        if (tqqq_sh * tqqq[ci] + cash + voo_val) >= INITIAL:
                            shortage = target_buf - cash
                            sell_v   = min(shortage / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                            if sell_v > 0:
                                sh  = sell_v / tqqq[ci]
                                annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                                tqqq_sh  = max(0.0, tqqq_sh - sh)
                                cash    += sell_v * (1 - FEE_RATE)

                if living_cash > 0:
                    flow_days.append(j)
                    flow_vals.append(living_cash)

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
            # VOO는 그대로 유지 (하락장에서도 보유)

        elif not is_invested and fire_buy:
            cur_tot  = cash
            cur_mths = get_buf_months(elapsed_yrs)
            if cur_mths > 0:
                rate_new   = dyn_rate(cur_tot)
                monthly_lv = cur_tot * rate_new
                target_buf = min(monthly_lv * cur_mths, cur_tot * MAX_BUF_PCT)
                invest_now = max(0.0, cur_tot - target_buf)
            else:
                invest_now = cur_tot
            if invest_now > 0:
                tqqq_sh  = (invest_now * (1 - FEE_RATE)) / tqqq[ci]
                tqqq_avg = tqqq[ci]
                cash     = cur_tot - invest_now
            is_invested = True; above_days = 0
            # VOO는 그대로 유지 (재진입해도 VOO 건드리지 않음)

        if cash > 0:
            cash += cash * rp_daily[ci]

        pv       = tqqq_sh * tqqq[ci] if is_invested else 0.0
        voo_val  = voo_sh  * voo[ci]
        tot      = pv + cash + voo_val
        peak_tot = max(peak_tot, tot)
        if tot <= 0: break

    ci_end  = min(start_idx + sim_len - 1, n - 1)
    pv_end  = tqqq_sh * tqqq[ci_end] if is_invested else 0.0
    voo_end = voo_sh  * voo[ci_end]
    final   = pv_end + cash + voo_end
    actual_yr = sim_len / 252
    final_eok = round(final / 1e8, 2)
    irr_val   = calc_irr(flow_days, flow_vals, final_eok, actual_yr)
    cagr_val  = round(((max(final, 1) / INITIAL) ** (1 / actual_yr) - 1) * 100, 2) if actual_yr > 0 else -100.0

    return {
        "final":       final_eok,
        "final_tqqq":  round(pv_end / 1e8, 2),
        "final_voo":   round(voo_end / 1e8, 2),
        "withdrawn":   round(cum_withdrawn / 1e8, 2),
        "to_voo":      round(cum_to_voo / 1e8, 2),
        "bankrupt":    bool(final <= 0),
        "irr":         irr_val,
        "cagr":        cagr_val,
        "actual_yr":   round(actual_yr, 1),
        "snaps":    {str(y): snaps.get(y * 252)    for y in SNAP_YRS},
        "snaps_wd": {str(y): snaps_wd.get(y * 252) for y in SNAP_YRS},
    }


# ─────────────────────────────────────────────────────────

_SHARED = {}

def _init_worker(tqqq, voo, closes, ema200, peaks, rp_daily, dates_list, fed_rates, starts):
    _SHARED.update({'tqqq': tqqq, 'voo': voo, 'closes': closes, 'ema200': ema200,
                    'peaks': peaks, 'rp_daily': rp_daily,
                    'dates': pd.DatetimeIndex(dates_list),
                    'fed_rates': fed_rates, 'starts': starts})

def _run_one(p: Param):
    d = _SHARED
    return (p.name, [run_sim(d['tqqq'], d['voo'], d['closes'], d['ema200'], d['peaks'],
                             d['rp_daily'], d['dates'], d['fed_rates'], si, p)
                     for si in d['starts']])

def q50(xs): return float(np.median(xs))
def q10(xs): return float(np.percentile(xs, 10))


def main():
    t0 = time.time()
    print("=" * 80, flush=True)
    print("TQQQ + VOO 분산 전략 — 초과분 VOO 이체 (스왑금리+세금 포함)", flush=True)
    print("스왑금리 포함  전체기간 + IRR", flush=True)
    print("=" * 80, flush=True)

    tqqq, voo, closes, ema200, peaks, rp_daily, dates, fed_rates = load_data()
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    all_starts  = [i for i in get_monthly_starts(dates) if i >= first_valid]
    long_starts = set(i for i in all_starts if (len(tqqq) - i) >= MIN_YEARS * 252)
    long_idx    = [i for i, si in enumerate(all_starts) if si in long_starts]

    print(f"코호트: {len(all_starts)}개  IRR 대상: {len(long_starts)}개  전략: {len(STRATEGIES)}개\n", flush=True)

    with mp.Pool(min(mp.cpu_count(), len(STRATEGIES)),
                 initializer=_init_worker,
                 initargs=(tqqq, voo, closes, ema200, peaks, rp_daily,
                           dates.tolist(), fed_rates, all_starts)) as pool:
        raw = dict(pool.map(_run_one, STRATEGIES))

    print(f"{'전략':<10} {'임계':>7} {'IRR중앙':>8} {'IRR하10%':>9} {'최종중앙':>9} {'TQQQ':>7} {'VOO':>7} {'인출중앙':>9}", flush=True)
    print("-" * 72, flush=True)

    snap_hdr = f"{'전략':<10}" + "".join(f"  {y:>3}년" for y in SNAP_YRS if y <= 40)
    print("\n" + snap_hdr, flush=True)
    print("-" * len(snap_hdr), flush=True)

    summary = {}
    start_dates = [dates[si].strftime("%Y-%m") for si in all_starts]

    for p in STRATEGIES:
        rows = raw[p.name]
        lr   = [rows[i] for i in long_idx]

        irrs    = [r["irr"]        for r in lr]
        fins    = [r["final"]      for r in lr]
        fins_tq = [r["final_tqqq"] for r in lr]
        fins_vo = [r["final_voo"]  for r in lr]
        wds     = [r["withdrawn"]  for r in lr]
        bnk     = [r["bankrupt"]   for r in lr]

        med_irr = q50(irrs); p10_irr = q10(irrs)
        med_fin = q50(fins); med_wd  = q50(wds)
        surv    = 100.0 * (1 - sum(bnk) / len(bnk))
        thr_str = "없음" if p.voo_thr == 0 else f"{int(p.voo_thr/1e8)}억"

        print(
            f"{p.name:<10} {thr_str:>7} {med_irr:>7.1f}%  {p10_irr:>7.1f}%  "
            f"{med_fin:>8.0f}억  {q50(fins_tq):>6.0f}억  {q50(fins_vo):>6.0f}억  "
            f"{med_wd:>8.0f}억",
            flush=True
        )

        snap_line = f"{p.name:<10}"
        for y in SNAP_YRS:
            if y > 40: continue
            vals = [r["snaps"].get(str(y)) for r in lr if r["snaps"].get(str(y)) is not None]
            snap_line += f"  {q50(vals):>5.0f}억" if vals else f"  {'—':>5}"
        print(snap_line, flush=True)

        snap_stats = {}
        for y in SNAP_YRS:
            key = str(y)
            v_f = [r["snaps"].get(key)    for r in lr if r["snaps"].get(key) is not None]
            v_w = [r["snaps_wd"].get(key) for r in lr if r["snaps_wd"].get(key) is not None]
            if v_f:
                snap_stats[key] = {"n": len(v_f),
                                   "med_fin": round(q50(v_f), 1),
                                   "p10_fin": round(q10(v_f), 1),
                                   "med_wd":  round(q50(v_w), 1) if v_w else None}

        summary[p.name] = {
            "desc": p.desc,
            "voo_thr_eok": round(p.voo_thr / 1e8, 0),
            "survival": round(surv, 1),
            "med_irr": round(med_irr, 2), "p10_irr": round(p10_irr, 2),
            "med_final": round(med_fin, 1),
            "med_final_tqqq": round(q50(fins_tq), 1),
            "med_final_voo":  round(q50(fins_vo), 1),
            "med_withdrawn": round(med_wd, 1),
            "snaps": snap_stats,
        }

    out = {
        "meta": {
            "generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "initial": INITIAL, "min_years": MIN_YEARS,
            "with_swap": True, "n_all": len(all_starts), "n_long": len(long_starts),
            "sell_rule": f"RULE25 (52주 고점 -{int(TRAIL_THR*100)}%)",
            "buy_rule": f"EMA200 {TIME_FILTER}일 연속 위",
            "withdrawal": "동적 0.3/0.5/0.7% (10억/20억 기준)",
            "buffer": "EARLY24 (처음 5년 24개월)",
            "voo_model": f"SPX 1x + 배당{VOO_DIVIDEND_ANNUAL*100:.1f}%(원천세{VOO_DIV_WITHHOLD*100:.0f}% 차감) - 운용보수{VOO_EXP_RATIO*100:.2f}%",
        },
        "summary": summary,
        "strategies": [p.name for p in STRATEGIES],
        "start_dates": start_dates,
        "rows": [
            {"s": start_dates[i],
             "yr": raw[STRATEGIES[0].name][i]["actual_yr"],
             **{p.name: {
                 "final": raw[p.name][i]["final"],
                 "final_tqqq": raw[p.name][i]["final_tqqq"],
                 "final_voo":  raw[p.name][i]["final_voo"],
                 "withdrawn":  raw[p.name][i]["withdrawn"],
                 "to_voo":     raw[p.name][i]["to_voo"],
                 "irr":        raw[p.name][i]["irr"],
                 "bankrupt":   raw[p.name][i]["bankrupt"],
                 "snaps":      raw[p.name][i]["snaps"],
                 "snaps_wd":   raw[p.name][i]["snaps_wd"],
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
