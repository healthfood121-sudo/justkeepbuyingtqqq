"""
withdrawal_cashbuffer2.py

현금 버퍼 유지 전략 백테스트 — 버킷 전략

아이디어:
  - 항상 N개월치 생활비를 현금으로 유지
  - 생활비는 현금에서 지출 (TQQQ는 건들지 않음)
  - 현금 < 목표치가 되면 조건에 따라 TQQQ를 팔아서 보충
  - TQQQ를 보충하는 조건:
      free : 조건 없이 항상 보충
      ema  : EMA200 위일 때만 (상승장)
      cost : 현재가 > 평균매수가일 때만 (수익 중)
      floor: 총자산 >= 10억일 때만 (원금 유지)

매도 신호: RULE25 (52주 고점 -25%)
매수 신호: EMA200 15거래일 연속 위
인출률:   동적 0.3/0.5/0.7% (총자산 10억/20억 기준)

전략: B0 (기준선) + 버퍼 12/24/36개월 × 조건 free/ema/cost/floor = 13가지
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass, field

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/withdrawal_cashbuffer2.json"

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
MAX_BUF_PCT = 0.50   # 재진입 시 현금으로 남길 최대 비율 (총자산 대비)


@dataclass
class Param:
    name:        str
    desc:        str
    buf_months:  int   = 0     # 목표 현금 버퍼 개월수 (0 = B0 기준선)
    refill_cond: str   = ''    # '' | 'free' | 'ema' | 'cost' | 'floor'


STRATEGIES = [
    Param("B0",       "기준선: RULE25, 매달 TQQQ 소량 매도",
          buf_months=0,  refill_cond=''),
    # ── 12개월 버퍼 ──────────────────────────────────────────
    Param("T12_free", "12개월 버퍼 / 조건없이 보충",
          buf_months=12, refill_cond='free'),
    Param("T12_ema",  "12개월 버퍼 / EMA200 위일 때만",
          buf_months=12, refill_cond='ema'),
    Param("T12_cost", "12개월 버퍼 / 평균단가 위일 때만",
          buf_months=12, refill_cond='cost'),
    Param("T12_floor","12개월 버퍼 / 총자산 10억 이상일 때만",
          buf_months=12, refill_cond='floor'),
    # ── 24개월 버퍼 ──────────────────────────────────────────
    Param("T24_free", "24개월 버퍼 / 조건없이 보충",
          buf_months=24, refill_cond='free'),
    Param("T24_ema",  "24개월 버퍼 / EMA200 위일 때만",
          buf_months=24, refill_cond='ema'),
    Param("T24_cost", "24개월 버퍼 / 평균단가 위일 때만",
          buf_months=24, refill_cond='cost'),
    Param("T24_floor","24개월 버퍼 / 총자산 10억 이상일 때만",
          buf_months=24, refill_cond='floor'),
    # ── 36개월 버퍼 ──────────────────────────────────────────
    Param("T36_free", "36개월 버퍼 / 조건없이 보충",
          buf_months=36, refill_cond='free'),
    Param("T36_ema",  "36개월 버퍼 / EMA200 위일 때만",
          buf_months=36, refill_cond='ema'),
    Param("T36_cost", "36개월 버퍼 / 평균단가 위일 때만",
          buf_months=36, refill_cond='cost'),
    Param("T36_floor","36개월 버퍼 / 총자산 10억 이상일 때만",
          buf_months=36, refill_cond='floor'),
]


# ═══════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════
# 동적 인출률 계산
# ═══════════════════════════════════════════════════════════

def dyn_rate(total: float) -> float:
    if total < DYN_THRS[0]: return DYN_RATES[0]
    if total < DYN_THRS[1]: return DYN_RATES[1]
    return DYN_RATES[2]


# ═══════════════════════════════════════════════════════════
# 시뮬레이션 코어
# ═══════════════════════════════════════════════════════════

def run_sim(tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(tqqq)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기 자산 배분 ──
    e0       = ema200[start_idx]
    e0_valid = not np.isnan(e0) and e0 > 0
    below_ema_at_start = e0_valid and closes[start_idx] < e0

    if below_ema_at_start:
        # 이미 하락장 → 전부 현금으로 시작
        is_invested = False
        cash        = float(INITIAL)
        tqqq_sh     = 0.0
        tqqq_avg    = 0.0
    else:
        # 상승장 → 버퍼만큼 현금, 나머지 TQQQ
        is_invested = True
        if p.buf_months > 0:
            initial_monthly = INITIAL * DYN_RATES[0]
            init_buf = min(initial_monthly * p.buf_months, INITIAL * MAX_BUF_PCT)
        else:
            init_buf = 0.0
        invest_amt  = INITIAL - init_buf
        fee         = invest_amt * FEE_RATE
        tqqq_sh     = (invest_amt - fee) / tqqq[start_idx]
        tqqq_avg    = tqqq[start_idx]
        cash        = init_buf

    annual_gain   = 0.0
    tax_due       = 0.0
    cur_year      = dates[start_idx].year
    cum_withdrawn = 0.0
    refill_count  = 0   # 버퍼 보충을 위한 TQQQ 매도 횟수

    below_days = 0
    above_days = 0
    pend       = None
    pend_at    = 0
    last_mon   = None
    monthly_cap = 0.0

    peak_tot = float(INITIAL)
    max_dd   = 0.0
    min_val  = float('inf')

    for j in range(sim_len):
        ci  = start_idx + j
        d   = dates[ci]
        mon = (d.year, d.month)

        # ═══ 월초 처리 ═══
        if mon != last_mon:
            last_mon = mon

            # 연초 세금 납부
            if d.year != cur_year:
                tax_due += max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                annual_gain = 0.0
                cur_year    = d.year

            if tax_due > 0:
                if cash >= tax_due:
                    cash    -= tax_due
                    tax_due  = 0.0
                elif is_invested:
                    need    = (tax_due - cash) / (1 - FEE_RATE)
                    sell_v  = min(need, tqqq_sh * tqqq[ci])
                    sh      = sell_v / tqqq[ci]
                    gain    = max(0.0, sell_v - sh * tqqq_avg)
                    annual_gain += gain
                    tqqq_sh = max(0.0, tqqq_sh - sh)
                    cash   += sell_v * (1 - FEE_RATE)
                    cash    = max(0.0, cash - tax_due)
                    tax_due = 0.0
                else:
                    cash    = max(0.0, cash - tax_due)
                    tax_due = 0.0

            if j > 0:
                pv   = tqqq_sh * tqqq[ci] if is_invested else 0.0
                tot  = pv + cash
                monthly_cap = tot * dyn_rate(tot)

                # ── 생활비 지출 (항상 현금에서) ──
                if is_invested:
                    living = min(monthly_cap, cash)
                    cash   = max(0.0, cash - living)
                else:
                    # 현금 보유 중: 적응형 인출
                    yearly_cap = monthly_cap * 12
                    lr = (1.0 if yearly_cap <= 0 or cash / yearly_cap >= 2 else
                          0.7 if cash / yearly_cap >= 1 else
                          0.5 if cash / yearly_cap >= 0.5 else 0.3)
                    living = monthly_cap * lr
                    cash   = max(0.0, cash - living)

                cum_withdrawn += living

                # ── 현금 버퍼 보충 (투자 중, 버퍼 전략만) ──
                if is_invested and p.buf_months > 0:
                    target_buf = monthly_cap * p.buf_months
                    if cash < target_buf and tqqq_sh > 0:
                        # 보충 조건 확인
                        can_refill = False
                        e200_ci    = ema200[ci]
                        e200ok_ci  = not np.isnan(e200_ci) and e200_ci > 0

                        if p.refill_cond == 'free':
                            can_refill = True
                        elif p.refill_cond == 'ema':
                            can_refill = e200ok_ci and closes[ci] > e200_ci
                        elif p.refill_cond == 'cost':
                            can_refill = tqqq[ci] > tqqq_avg
                        elif p.refill_cond == 'floor':
                            can_refill = (tqqq_sh * tqqq[ci] + cash) >= INITIAL

                        if can_refill:
                            shortage = target_buf - cash
                            sell_v   = min(shortage / (1 - FEE_RATE),
                                          tqqq_sh * tqqq[ci])
                            if sell_v > 0:
                                sh       = sell_v / tqqq[ci]
                                gain     = max(0.0, sell_v - sh * tqqq_avg)
                                annual_gain += gain
                                tqqq_sh  = max(0.0, tqqq_sh - sh)
                                cash    += sell_v * (1 - FEE_RATE)
                                refill_count += 1

                # ── B0: 생활비 부족 시 TQQQ 매도 (기존 방식) ──
                elif not is_invested and p.buf_months == 0:
                    pass  # 현금 상태에서는 위에서 이미 처리

                elif is_invested and p.buf_months == 0:
                    # B0: 생활비가 부족했으면 TQQQ 매도로 보충
                    if cash < monthly_cap and tqqq_sh > 0:
                        short  = monthly_cap - cash
                        sell_v = min(short / (1 - FEE_RATE), tqqq_sh * tqqq[ci])
                        sh     = sell_v / tqqq[ci]
                        gain   = max(0.0, sell_v - sh * tqqq_avg)
                        annual_gain += gain
                        tqqq_sh = max(0.0, tqqq_sh - sh)
                        cash   += sell_v * (1 - FEE_RATE)
                        # 추가 인출
                        extra   = min(monthly_cap - living, cash)
                        cash   -= extra
                        cum_withdrawn += extra

        # ═══ 신호 (RULE25 매도 + EMA200-15일 매수) ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        sell_sig = False
        buy_sig  = False

        if e200ok:
            sell_sig = closes[ci] < peaks[ci] * (1.0 - TRAIL_THR)
            if closes[ci] > e200:
                above_days += 1; below_days = 0
            elif closes[ci] < e200:
                below_days += 1; above_days = 0
            else:
                above_days = below_days = 0
            buy_sig = above_days >= TIME_FILTER

        # 다음 거래일 종가에 실행
        fire_sell = fire_buy = False
        if pend is not None and j >= pend_at:
            fire_sell = (pend == 'sell' and is_invested)
            fire_buy  = (pend == 'buy'  and not is_invested)
            pend = None

        if pend is None and not (fire_sell or fire_buy):
            if is_invested and sell_sig:
                pend = 'sell'; pend_at = j + 1
            elif not is_invested and buy_sig:
                pend = 'buy';  pend_at = j + 1

        sell_sig = fire_sell
        buy_sig  = fire_buy

        # ═══ 매도 (RULE25 신호) ═══
        if is_invested and sell_sig:
            sell_v      = tqqq_sh * tqqq[ci]
            fee         = sell_v * FEE_RATE
            gain        = max(0.0, sell_v - tqqq_sh * tqqq_avg)
            annual_gain += gain
            cash       += sell_v - fee
            tqqq_sh     = 0.0
            tqqq_avg    = 0.0
            is_invested = False
            below_days  = 0

        # ═══ 매수 (EMA200 신호) — 버퍼 유지하며 재진입 ═══
        elif not is_invested and buy_sig:
            if p.buf_months > 0:
                # 현금의 buf_months × rate만큼 버퍼로 남기고 나머지 투자
                rate_new   = dyn_rate(cash)
                target_buf = min(cash * rate_new * p.buf_months, cash * MAX_BUF_PCT)
                invest_now = max(0.0, cash - target_buf)
                keep_cash  = cash - invest_now
            else:
                invest_now = cash
                keep_cash  = 0.0

            if invest_now > 0:
                fee      = invest_now * FEE_RATE
                tqqq_sh  = (invest_now - fee) / tqqq[ci]
                tqqq_avg = tqqq[ci]
                cash     = keep_cash
            is_invested = True
            above_days  = 0

        # ═══ RP 이자 ═══
        if not is_invested:
            cash += cash * rp_daily[ci]
        elif cash > 0:
            cash += cash * rp_daily[ci]

        # ═══ 총자산 추적 ═══
        pv  = tqqq_sh * tqqq[ci] if is_invested else 0.0
        tot = pv + cash
        if tot < min_val: min_val = tot
        peak_tot = max(peak_tot, tot)
        if peak_tot > 0: max_dd = max(max_dd, 1.0 - tot / peak_tot)
        if tot <= 0: break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = tqqq_sh * tqqq[ci_end] if is_invested else 0.0
    final  = pv_end + cash
    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1.0 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'): min_val = 0.0

    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
        "refills":   refill_count,
    }


# ═══════════════════════════════════════════════════════════
# 병렬 실행
# ═══════════════════════════════════════════════════════════

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
    print("현금 버퍼 유지 전략 백테스트 (RULE25 기반)", flush=True)
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
    hdr = (f"{'전략':<12} {'버퍼':>4} {'조건':<6} "
           f"{'중앙값':>8} {'평균':>8} {'최악':>7} "
           f"{'인출합계':>9} {'총재산':>9} {'보충횟수':>8}")
    print(hdr, flush=True)
    print("-" * len(hdr), flush=True)

    summary = {}
    start_dates = [dates[si].strftime("%Y-%m") for si in starts]

    for p in STRATEGIES:
        rows   = raw[p.name]
        finals = [r["final"]     for r in rows]
        wds    = [r["withdrawn"] for r in rows]
        bnk    = [r["bankrupt"]  for r in rows]
        rfs    = [r["refills"]   for r in rows]

        med_f  = float(np.median(finals))
        avg_f  = float(np.mean(finals))
        min_f  = float(np.min(finals))
        med_wd = float(np.median(wds))
        total  = med_f + med_wd
        avg_rf = float(np.mean(rfs))
        surv   = 100.0 * (1 - sum(bnk) / len(bnk))

        cond_label = {'': '—', 'free': 'free', 'ema': 'EMA', 'cost': 'cost', 'floor': '10억+'}
        print(
            f"{p.name:<12} {p.buf_months:>4}개월 {cond_label.get(p.refill_cond,''):^6} "
            f"{med_f:>7.0f}억 {avg_f:>7.0f}억 {min_f:>6.1f}억 "
            f"{med_wd:>8.1f}억 {total:>8.1f}억  보충 {avg_rf:>5.1f}회",
            flush=True
        )

        summary[p.name] = {
            "desc":       p.desc,
            "buf_months": p.buf_months,
            "refill_cond":p.refill_cond,
            "survival":   round(surv, 1),
            "median":     round(med_f, 2),
            "mean":       round(avg_f, 2),
            "min":        round(min_f, 2),
            "median_wd":  round(med_wd, 2),
            "total":      round(total, 2),
            "avg_refills":round(avg_rf, 1),
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
        },
        "summary": summary,
        "strategies": [p.name for p in STRATEGIES],
        "start_dates": start_dates,
        "rows": [
            {
                "s": start_dates[i],
                **{p.name: {
                    "final":     raw[p.name][i]["final"],
                    "withdrawn": raw[p.name][i]["withdrawn"],
                    "bankrupt":  raw[p.name][i]["bankrupt"],
                    "refills":   raw[p.name][i]["refills"],
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
