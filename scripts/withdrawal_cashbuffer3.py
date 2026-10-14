"""
withdrawal_cashbuffer3.py

초기 집중형 버퍼 (phase-out) 전략 백테스트

핵심 아이디어:
  - 현금 버퍼는 초기 생존 구간(포트 작고 하락장)에서만 실질적으로 필요.
  - 후기에는 신호매도 자체가 수억 현금을 만들어 → 자연 버퍼가 됨.
  - 따라서: 초기에 더 큰 버퍼 유지, 포트 성장 후 단계적 축소(phase-out).

비교 전략:
  B0          : 기준선 (RULE25, 생활비 부족 시 TQQQ 소량 매도)
  T12_floor   : 현재 최선 비교용 (12개월 고정, floor 조건)
  EARLY12     : 처음 5년 12개월 버퍼 → 이후 B0 방식 (floor 조건)
  EARLY24     : 처음 5년 24개월 버퍼 → 이후 B0 방식 (floor 조건)
  TAPER_free  : 포트규모 기반 자동축소 24→12→0개월 / 조건없이 보충
  TAPER_floor : 포트규모 기반 자동축소 24→12→0개월 / floor 조건

추가 출력 지표:
  drought_y1_5  : 초기 5년 중 목표 생활비의 90% 미만 달수
  drought_y6_20 : 후기(6~20년) 생활비 공백 달수
  → 버퍼가 실제로 초기 생존에 기여하는지 직접 검증
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/withdrawal_cashbuffer3.json"

INITIAL     = 1_000_000_000
SIM_YEARS   = 20
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

# TAPER 임계값: 포트 크기 → 목표 버퍼 개월수
TAPER_BRK   = (1_000_000_000, 2_000_000_000)   # 10억, 20억
TAPER_MTHS  = (24, 12, 0)                       # <10억, 10~20억, ≥20억


@dataclass
class Param:
    name: str
    desc: str
    buf_mode: str = 'none'    # 'none' | 'fixed' | 'early' | 'taper'
    fixed_months: int = 0     # buf_mode='fixed'일 때 고정 버퍼 개월수
    refill_cond: str = ''     # '' | 'free' | 'floor'
    early_months: int = 0     # buf_mode='early'일 때 초기 버퍼 개월수
    early_yrs: float = 5.0    # buf_mode='early'일 때 phase-out 기준 연수


STRATEGIES = [
    Param("B0",
          "기준선: RULE25, 생활비 부족 시 TQQQ 소량 매도",
          buf_mode='none'),
    Param("T12_floor",
          "12개월 버퍼 / 총자산 10억 이상일 때만 보충 (현재 최선)",
          buf_mode='fixed', fixed_months=12, refill_cond='floor'),
    Param("EARLY12",
          "처음 5년 12개월 버퍼 → 이후 B0 방식 (floor 조건)",
          buf_mode='early', early_months=12, refill_cond='floor', early_yrs=5.0),
    Param("EARLY24",
          "처음 5년 24개월 버퍼 → 이후 B0 방식 (floor 조건)",
          buf_mode='early', early_months=24, refill_cond='floor', early_yrs=5.0),
    Param("TAPER_free",
          "포트 <10억:24개월 / 10~20억:12개월 / ≥20억:0 / 조건없이 보충",
          buf_mode='taper', refill_cond='free'),
    Param("TAPER_floor",
          "포트 <10억:24개월 / 10~20억:12개월 / ≥20억:0 / floor 조건",
          buf_mode='taper', refill_cond='floor'),
]


# ─────────────────────────────────────────────────────────
# 동적 인출률
# ─────────────────────────────────────────────────────────

def dyn_rate(total: float) -> float:
    if total < DYN_THRS[0]: return DYN_RATES[0]
    if total < DYN_THRS[1]: return DYN_RATES[1]
    return DYN_RATES[2]


# ─────────────────────────────────────────────────────────
# 버퍼 목표 개월수 (전략·경과시간·포트규모 기반)
# ─────────────────────────────────────────────────────────

def get_buf_months(p: Param, elapsed_yrs: float, total: float) -> int:
    if p.buf_mode == 'none':
        return 0
    elif p.buf_mode == 'fixed':
        return p.fixed_months
    elif p.buf_mode == 'early':
        return p.early_months if elapsed_yrs < p.early_yrs else 0
    elif p.buf_mode == 'taper':
        if total < TAPER_BRK[0]:
            return TAPER_MTHS[0]
        elif total < TAPER_BRK[1]:
            return TAPER_MTHS[1]
        else:
            return TAPER_MTHS[2]
    return 0


# ─────────────────────────────────────────────────────────
# 데이터 로드
# ─────────────────────────────────────────────────────────

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

    ret = np.diff(closes) / closes[:-1]
    ret = np.insert(ret, 0, 0.0)

    with open(DATA_DIR / "fed_funds_rate.json", encoding="utf-8") as f:
        fed_raw = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed_raw}

    fed_daily = np.array([
        fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 / 252
        for d in dates
    ])

    if with_swap:
        f3 = (1.0 + ret * 3.0 - 2.0 * (fed_daily + SWAP_SPREAD / 252.0)) * (1.0 - EXP_3X / 252)
    else:
        f3 = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    tqqq = 100.0 * np.cumprod(f3)

    a200   = 2.0 / 201
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
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기 자산 배분 ──
    e0             = ema200[start_idx]
    e0_valid       = not np.isnan(e0) and e0 > 0
    below_at_start = e0_valid and closes[start_idx] < e0

    if below_at_start:
        is_invested = False
        cash        = float(INITIAL)
        tqqq_sh     = 0.0
        tqqq_avg    = 0.0
    else:
        is_invested  = True
        init_months  = get_buf_months(p, 0.0, float(INITIAL))
        if init_months > 0:
            init_buf = min(INITIAL * DYN_RATES[0] * init_months, INITIAL * MAX_BUF_PCT)
        else:
            init_buf = 0.0
        invest_amt   = INITIAL - init_buf
        fee          = invest_amt * FEE_RATE
        tqqq_sh      = (invest_amt - fee) / tqqq[start_idx]
        tqqq_avg     = tqqq[start_idx]
        cash         = init_buf

    annual_gain   = 0.0
    tax_due       = 0.0
    cur_year      = dates[start_idx].year
    cum_withdrawn = 0.0
    refill_count  = 0

    # 생활비 공백 추적
    drought_y1_5  = 0   # 초기 5년 중 목표의 90% 미달 달수
    drought_y6_20 = 0   # 후기(6~20년) 공백 달수

    below_days  = 0
    above_days  = 0
    pend        = None
    pend_at     = 0
    last_mon    = None
    monthly_cap = 0.0

    peak_tot = float(INITIAL)
    max_dd   = 0.0
    min_val  = float('inf')

    for j in range(sim_len):
        ci          = start_idx + j
        d           = dates[ci]
        mon         = (d.year, d.month)
        elapsed_yrs = j / 252.0    # 경과 연수 (근사)

        # ═══ 월초 처리 ═══
        if mon != last_mon:
            last_mon = mon

            # 연초 세금
            if d.year != cur_year:
                tax_due    += max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                annual_gain = 0.0
                cur_year    = d.year

            if tax_due > 0:
                if cash >= tax_due:
                    cash   -= tax_due; tax_due = 0.0
                elif is_invested:
                    need    = (tax_due - cash) / (1 - FEE_RATE)
                    sell_v  = min(need, tqqq_sh * tqqq[ci])
                    sh      = sell_v / tqqq[ci]
                    annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                    tqqq_sh = max(0.0, tqqq_sh - sh)
                    cash   += sell_v * (1 - FEE_RATE)
                    cash    = max(0.0, cash - tax_due); tax_due = 0.0
                else:
                    cash    = max(0.0, cash - tax_due); tax_due = 0.0

            if j > 0:
                pv          = tqqq_sh * tqqq[ci] if is_invested else 0.0
                tot         = pv + cash
                monthly_cap = tot * dyn_rate(tot)
                target_mths = get_buf_months(p, elapsed_yrs, tot)

                # ── 생활비 지출 ──
                # 공통: 현금에서 먼저
                if is_invested:
                    living_cash = min(monthly_cap, cash)
                    cash        = max(0.0, cash - living_cash)
                else:
                    yearly_cap = monthly_cap * 12
                    lr = (1.0 if yearly_cap <= 0 or cash / yearly_cap >= 2 else
                          0.7 if cash / yearly_cap >= 1 else
                          0.5 if cash / yearly_cap >= 0.5 else 0.3)
                    living_cash = monthly_cap * lr
                    cash        = max(0.0, cash - living_cash)

                cum_withdrawn += living_cash
                month_living   = living_cash

                # B0 / phase-out 후기: 생활비 부족 시 TQQQ 소량 매도
                if is_invested and target_mths == 0:
                    if month_living < monthly_cap and tqqq_sh > 0:
                        short  = monthly_cap - month_living
                        sell_v = min(short / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                        sh     = sell_v / tqqq[ci]
                        annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                        tqqq_sh  = max(0.0, tqqq_sh - sh)
                        cash    += sell_v * (1 - FEE_RATE)
                        extra    = min(monthly_cap - month_living, cash)
                        cash    -= extra
                        cum_withdrawn += extra
                        month_living  += extra

                # 버퍼 전략: 현금 버퍼 보충 (조건 확인)
                if is_invested and target_mths > 0:
                    target_buf = monthly_cap * target_mths
                    if cash < target_buf and tqqq_sh > 0:
                        can_refill = False
                        if p.refill_cond == 'free':
                            can_refill = True
                        elif p.refill_cond == 'floor':
                            can_refill = (tqqq_sh * tqqq[ci] + cash) >= INITIAL

                        if can_refill:
                            shortage = target_buf - cash
                            sell_v   = min(shortage / (1 - FEE_RATE),
                                          tqqq_sh * tqqq[ci])
                            if sell_v > 0:
                                sh  = sell_v / tqqq[ci]
                                annual_gain += max(0.0, sell_v - sh * tqqq_avg)
                                tqqq_sh  = max(0.0, tqqq_sh - sh)
                                cash    += sell_v * (1 - FEE_RATE)
                                refill_count += 1

                # ── 생활비 공백 기록 ──
                if monthly_cap > 0 and month_living < monthly_cap * 0.9:
                    if elapsed_yrs <= 5.0:
                        drought_y1_5 += 1
                    else:
                        drought_y6_20 += 1

        # ═══ 신호 처리 (RULE25 매도 + EMA200-15일 매수) ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0

        if e200ok:
            sell_sig_raw = closes[ci] < peaks[ci] * (1.0 - TRAIL_THR)
            if closes[ci] > e200:
                above_days += 1; below_days = 0
            elif closes[ci] < e200:
                below_days += 1; above_days = 0
            else:
                above_days = below_days = 0
            buy_sig_raw = above_days >= TIME_FILTER
        else:
            sell_sig_raw = buy_sig_raw = False

        # pend 실행 (다음 거래일 종가)
        fire_sell = fire_buy = False
        if pend is not None and j >= pend_at:
            fire_sell = (pend == 'sell' and is_invested)
            fire_buy  = (pend == 'buy'  and not is_invested)
            pend = None

        if pend is None and not (fire_sell or fire_buy):
            if is_invested and sell_sig_raw:
                pend = 'sell'; pend_at = j + 1
            elif not is_invested and buy_sig_raw:
                pend = 'buy';  pend_at = j + 1

        # ═══ 신호매도 (RULE25) ═══
        if is_invested and fire_sell:
            sell_v      = tqqq_sh * tqqq[ci]
            fee         = sell_v * FEE_RATE
            annual_gain += max(0.0, sell_v - tqqq_sh * tqqq_avg)
            cash       += sell_v - fee
            tqqq_sh     = 0.0
            tqqq_avg    = 0.0
            is_invested = False
            below_days  = 0

        # ═══ 신호매수 (EMA200-15일) ─── 버퍼 유지하며 재진입 ═══
        elif not is_invested and fire_buy:
            cur_tot    = cash   # 현금만 있는 상태
            cur_mths   = get_buf_months(p, elapsed_yrs, cur_tot)
            if cur_mths > 0:
                rate_new   = dyn_rate(cur_tot)
                target_buf = min(cur_tot * rate_new * cur_mths, cur_tot * MAX_BUF_PCT)
                invest_now = max(0.0, cur_tot - target_buf)
            else:
                invest_now = cur_tot

            if invest_now > 0:
                fee      = invest_now * FEE_RATE
                tqqq_sh  = (invest_now - fee) / tqqq[ci]
                tqqq_avg = tqqq[ci]
                cash     = cur_tot - invest_now
            is_invested = True
            above_days  = 0

        # ═══ RP 이자 ═══
        if cash > 0:
            cash += cash * rp_daily[ci]

        # ═══ 총자산 추적 ═══
        pv       = tqqq_sh * tqqq[ci] if is_invested else 0.0
        tot      = pv + cash
        min_val  = min(min_val, tot)
        peak_tot = max(peak_tot, tot)
        if peak_tot > 0:
            max_dd = max(max_dd, 1.0 - tot / peak_tot)
        if tot <= 0:
            break

    ci_end    = min(start_idx + sim_len - 1, n - 1)
    pv_end    = tqqq_sh * tqqq[ci_end] if is_invested else 0.0
    final     = pv_end + cash
    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1.0 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'): min_val = 0.0

    return {
        "final":         round(final / 1e8, 2),
        "withdrawn":     round(cum_withdrawn / 1e8, 2),
        "min":           round(min_val / 1e8, 4),
        "bankrupt":      bool(final <= 0),
        "cagr":          round(cagr, 2),
        "refills":       refill_count,
        "drought_y1_5":  drought_y1_5,
        "drought_y6_20": drought_y6_20,
    }


# ─────────────────────────────────────────────────────────
# 병렬 실행
# ─────────────────────────────────────────────────────────

_SHARED = {}


def _init_worker(tqqq, closes, ema200, peaks, rp_daily, dates_list, fed_rates, starts):
    _SHARED.update({
        'tqqq': tqqq, 'closes': closes, 'ema200': ema200,
        'peaks': peaks, 'rp_daily': rp_daily,
        'dates': pd.DatetimeIndex(dates_list),
        'fed_rates': fed_rates, 'starts': starts,
    })


def _run_one(p: Param):
    d = _SHARED
    results = [
        run_sim(d['tqqq'], d['closes'], d['ema200'], d['peaks'],
                d['rp_daily'], d['dates'], d['fed_rates'], si, p)
        for si in d['starts']
    ]
    return (p.name, results)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-swap", action="store_true")
    args = parser.parse_args()
    with_swap = not args.no_swap

    t0 = time.time()
    print("=" * 80, flush=True)
    print("초기 집중형 버퍼 (phase-out) 전략 백테스트 (RULE25 기반)", flush=True)
    print(f"{'스왑금리 포함' if with_swap else '운용보수만'}", flush=True)
    print("=" * 80, flush=True)

    tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates = load_data(with_swap)
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    starts = [i for i in get_monthly_starts(dates)
              if i >= first_valid and (len(tqqq) - i) / 252 >= SIM_YEARS]

    print(f"코호트: {len(starts)}개  전략: {len(STRATEGIES)}개\n", flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(tqqq, closes, ema200, peaks, rp_daily,
                  dates.tolist(), fed_rates, starts)
    ) as pool:
        raw = dict(pool.map(_run_one, STRATEGIES))

    # ── 결과 출력 ──
    hdr = (f"{'전략':<14} {'중앙값':>8} {'평균':>8} {'최악':>7} "
           f"{'인출합계':>9} {'총재산':>9}  "
           f"{'공백(초기)':>9} {'공백(후기)':>9}")
    print(hdr, flush=True)
    print("-" * len(hdr), flush=True)

    summary = {}
    start_dates = [dates[si].strftime("%Y-%m") for si in starts]

    for p in STRATEGIES:
        rows   = raw[p.name]
        finals = [r["final"]         for r in rows]
        wds    = [r["withdrawn"]     for r in rows]
        bnk    = [r["bankrupt"]      for r in rows]
        rfs    = [r["refills"]       for r in rows]
        dr1    = [r["drought_y1_5"]  for r in rows]
        dr2    = [r["drought_y6_20"] for r in rows]

        med_f   = float(np.median(finals))
        avg_f   = float(np.mean(finals))
        min_f   = float(np.min(finals))
        med_wd  = float(np.median(wds))
        total   = med_f + med_wd
        avg_rf  = float(np.mean(rfs))
        surv    = 100.0 * (1 - sum(bnk) / len(bnk))
        med_dr1 = float(np.median(dr1))
        med_dr2 = float(np.median(dr2))

        print(
            f"{p.name:<14} {med_f:>7.0f}억 {avg_f:>7.0f}억 {min_f:>6.1f}억 "
            f"{med_wd:>8.1f}억 {total:>8.1f}억  "
            f"{med_dr1:>7.1f}개월 {med_dr2:>7.1f}개월",
            flush=True
        )

        summary[p.name] = {
            "desc":         p.desc,
            "buf_mode":     p.buf_mode,
            "fixed_months": p.fixed_months,
            "refill_cond":  p.refill_cond,
            "early_months": p.early_months,
            "early_yrs":    p.early_yrs,
            "survival":     round(surv, 1),
            "median":       round(med_f, 2),
            "mean":         round(avg_f, 2),
            "min":          round(min_f, 2),
            "median_wd":    round(med_wd, 2),
            "total":        round(total, 2),
            "avg_refills":  round(avg_rf, 1),
            "med_drought_y1_5":  round(med_dr1, 1),
            "med_drought_y6_20": round(med_dr2, 1),
        }

    # ── JSON 저장 ──
    out = {
        "meta": {
            "generated":  pd.Timestamp.now().strftime("%Y-%m-%d"),
            "initial":    INITIAL,
            "sim_years":  SIM_YEARS,
            "with_swap":  with_swap,
            "n_cohorts":  len(starts),
            "sell_rule":  f"RULE25 (52주 고점 -{int(TRAIL_THR*100)}%)",
            "buy_rule":   f"EMA200 {TIME_FILTER}일 연속 위",
            "withdrawal": "동적 0.3/0.5/0.7% (10억/20억 기준)",
            "taper_breaks": list(TAPER_BRK),
            "taper_months": list(TAPER_MTHS),
        },
        "summary": summary,
        "strategies": [p.name for p in STRATEGIES],
        "start_dates": start_dates,
        "rows": [
            {
                "s": start_dates[i],
                **{p.name: {
                    "final":         raw[p.name][i]["final"],
                    "withdrawn":     raw[p.name][i]["withdrawn"],
                    "bankrupt":      raw[p.name][i]["bankrupt"],
                    "refills":       raw[p.name][i]["refills"],
                    "drought_y1_5":  raw[p.name][i]["drought_y1_5"],
                    "drought_y6_20": raw[p.name][i]["drought_y6_20"],
                } for p in STRATEGIES}
            }
            for i in range(len(starts))
        ]
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\n저장: {OUT_PATH}", flush=True)
    print(f"총 소요: {time.time() - t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
