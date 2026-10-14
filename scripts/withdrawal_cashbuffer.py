"""
withdrawal_cashbuffer.py

초기 현금 버퍼 전략 백테스트

아이디어: 10억 중 일정 비율(20/25/30%)을 현금으로 먼저 뽑아두고 시작.
투자 중에는 TQQQ를 생활비 목적으로 절대 팔지 않는다.
매도 신호가 와야만 TQQQ를 매도한다.

전략 비교:
  B0  : 기준선 (RULE25, 초기 버퍼 없음 — 생활비 부족 시 TQQQ 매도)
  B20 : 초기 현금 20% + TQQQ 80%, 투자 중 TQQQ 생활비 매도 없음
  B25 : 초기 현금 25% + TQQQ 75%, 투자 중 TQQQ 생활비 매도 없음
  B30 : 초기 현금 30% + TQQQ 70%, 투자 중 TQQQ 생활비 매도 없음

매도 신호: NDX 52주 고점 대비 -25% (RULE25)
매수 신호: NDX EMA200 15거래일 연속 위
인출률:   동적 0.3/0.5/0.7% (총자산 10억/20억 기준)
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/withdrawal_cashbuffer.json"

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_3X     = 0.0088
SWAP_SPREAD = 0.005   # SOFR 위에 붙는 스왑 스프레드 50bps
TAX_RATE   = 0.22
DEDUCTION  = 2_500_000
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
DYN_RATES  = (0.003, 0.005, 0.007)
DYN_THRS   = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15   # EMA200 연속일
TRAIL_THR   = 0.25  # RULE25: 52주 고점 -25%
BAND        = 0.05


@dataclass
class Param:
    name:     str
    desc:     str
    buf_ratio: float        # 초기 현금 비율 (0.0 ~ 0.3)
    no_sell_for_living: bool  # True: 투자 중 TQQQ를 생활비 목적으로 팔지 않음
    reseed: bool = False    # True: 재진입 시에도 buf_ratio만큼 현금 남기고 TQQQ 매수


STRATEGIES = [
    Param("B0",  "RULE25 기준선 (초기 버퍼 없음, 생활비 매도 허용)",
          buf_ratio=0.00, no_sell_for_living=False, reseed=False),
    Param("B20", "초기 20% 버퍼, 생활비 매도 없음, 재진입 시 버퍼 없음",
          buf_ratio=0.20, no_sell_for_living=True,  reseed=False),
    Param("R20", "초기 20% 버퍼, 생활비 매도 없음, 재진입마다 20% 리시드",
          buf_ratio=0.20, no_sell_for_living=True,  reseed=True),
    Param("R25", "초기 25% 버퍼, 생활비 매도 없음, 재진입마다 25% 리시드",
          buf_ratio=0.25, no_sell_for_living=True,  reseed=True),
    Param("R30", "초기 30% 버퍼, 생활비 매도 없음, 재진입마다 30% 리시드",
          buf_ratio=0.30, no_sell_for_living=True,  reseed=True),
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

    # EMA200
    a200   = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    # 52주(252거래일) 이동 최고값
    peaks = pd.Series(closes).rolling(252, min_periods=1).max().values

    # RP 일이자 (세후)
    rp_daily = np.array([
        max(0.0, fed_rates.get(f"{d.year}-{d.month:02d}", 3.0) / 100.0 - RP_SPREAD) / 252
        for d in dates
    ]) * (1.0 - RP_TAX_R)

    return tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates


def get_monthly_starts(dates):
    seen, out = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            out.append(i)
    return out


# ═══════════════════════════════════════════════════════════
# 시뮬레이션 코어
# ═══════════════════════════════════════════════════════════

def run_sim(tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(tqqq)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기 포지션 ──
    buf_cash  = INITIAL * p.buf_ratio          # 현금 버퍼
    invest_amt = INITIAL * (1.0 - p.buf_ratio) # TQQQ 투자금

    e0      = ema200[start_idx]
    e0_valid = not np.isnan(e0) and e0 > 0

    # EMA200 위에 있으면 투자, 아래면 현금 보유
    if e0_valid and closes[start_idx] < e0:
        is_invested = False
        cash        = float(INITIAL)   # 버퍼 포함 전체 현금
        tqqq_sh     = 0.0
        tqqq_avg    = 0.0
        buf_cash    = 0.0  # 처음부터 현금 상태면 버퍼 별도 없음
    else:
        is_invested = True
        fee         = invest_amt * FEE_RATE
        tqqq_sh     = (invest_amt - fee) / tqqq[start_idx]
        tqqq_avg    = tqqq[start_idx]
        cash        = buf_cash   # 현금 버퍼만 cash로

    annual_gain   = 0.0
    tax_due       = 0.0
    cur_year      = dates[start_idx].year
    cum_withdrawn = 0.0
    cum_tqqq_sell_for_living = 0   # 생활비 목적 TQQQ 매도 횟수 (B0만 해당)

    below_days = 0
    above_days = 0
    pend       = None   # 'sell' | 'buy' | None
    pend_at    = 0

    last_mon   = None
    monthly_living_cap = 0.0   # 이번 달 인출 한도
    peak_tot   = float(INITIAL)
    max_dd     = 0.0
    min_val    = float('inf')

    def total_val(ci):
        pv = tqqq_sh * tqqq[ci] if is_invested else cash
        return pv + (cash if is_invested else 0.0)

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
                    # 세금은 TQQQ 매도로 충당 (생활비와 무관)
                    need    = tax_due - cash
                    v       = tqqq_sh * tqqq[ci]
                    sell_v  = min(need / (1 - FEE_RATE), v)
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

            # 이번 달 생활비 한도 계산
            if j > 0:
                pv  = tqqq_sh * tqqq[ci] if is_invested else 0.0
                tot = pv + cash
                rate = (DYN_RATES[0] if tot < DYN_THRS[0]
                        else DYN_RATES[1] if tot < DYN_THRS[1]
                        else DYN_RATES[2])
                monthly_living_cap = tot * rate

                # ── 생활비 인출 ──
                if is_invested:
                    if p.no_sell_for_living:
                        # 현금 버퍼에서만 인출 (TQQQ 매도 없음)
                        living = min(monthly_living_cap, cash)
                        cash   = max(0.0, cash - living)
                    else:
                        # 기준선(B0): 현금 먼저, 부족하면 TQQQ 매도
                        living = monthly_living_cap
                        if cash < living:
                            short  = living - cash
                            sell_v = min(short / (1 - FEE_RATE),
                                         tqqq_sh * tqqq[ci])
                            if sell_v > 0:
                                sh       = sell_v / tqqq[ci]
                                gain     = max(0.0, sell_v - sh * tqqq_avg)
                                annual_gain += gain
                                tqqq_sh  = max(0.0, tqqq_sh - sh)
                                cash    += sell_v * (1 - FEE_RATE)
                                cum_tqqq_sell_for_living += 1
                        living = min(monthly_living_cap, cash)
                        cash   = max(0.0, cash - living)
                else:
                    # 현금 보유 중: 적응형 인출
                    yearly_cap = monthly_living_cap * 12
                    lr = (1.0 if yearly_cap <= 0 or cash / yearly_cap >= 2 else
                          0.7 if cash / yearly_cap >= 1 else
                          0.5 if cash / yearly_cap >= 0.5 else 0.3)
                    living = monthly_living_cap * lr
                    cash   = max(0.0, cash - living)

                cum_withdrawn += living

        # ═══ 신호 생성 (RULE25 매도 + EMA200-15일 매수) ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        sell_sig = False
        buy_sig  = False

        if e200ok:
            # 매도: 52주 고점 -25% 이하
            sell_sig = closes[ci] < peaks[ci] * (1.0 - TRAIL_THR)
            # 매수: EMA200 위 15일 연속
            if closes[ci] > e200:
                above_days += 1; below_days = 0
            elif closes[ci] < e200:
                below_days += 1; above_days = 0
            else:
                above_days = below_days = 0
            buy_sig = above_days >= TIME_FILTER

        # 신호는 다음 거래일 종가에 실행 (pend 방식)
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

        # ═══ 매도 실행 (EMA200 / RULE25 신호) ═══
        if is_invested and sell_sig:
            sell_v    = tqqq_sh * tqqq[ci]
            fee       = sell_v * FEE_RATE
            gain      = max(0.0, sell_v - tqqq_sh * tqqq_avg)
            annual_gain += gain
            cash      += sell_v - fee   # 버퍼 현금과 합산
            tqqq_sh   = 0.0
            tqqq_avg  = 0.0
            is_invested = False
            below_days  = 0

        # ═══ 매수 실행 ═══
        elif not is_invested and buy_sig:
            # 재진입 시 리시드: buf_ratio만큼 현금으로 남기고 나머지만 TQQQ 매수
            if p.reseed and p.buf_ratio > 0:
                keep_cash  = cash * p.buf_ratio
                invest_now = cash - keep_cash
            else:
                keep_cash  = 0.0
                invest_now = cash
            fee        = invest_now * FEE_RATE
            tqqq_sh    = (invest_now - fee) / tqqq[ci]
            tqqq_avg   = tqqq[ci]
            cash       = keep_cash
            is_invested = True
            above_days  = 0

        # ═══ RP 이자 (현금 보유 중) ═══
        if not is_invested:
            cash += cash * rp_daily[ci]
        else:
            # 투자 중 현금 버퍼에도 RP 이자 적용
            if cash > 0:
                cash += cash * rp_daily[ci]

        # ═══ 총자산 추적 ═══
        pv  = tqqq_sh * tqqq[ci] if is_invested else 0.0
        tot = pv + cash
        if tot < min_val:
            min_val = tot
        peak_tot = max(peak_tot, tot)
        if peak_tot > 0:
            max_dd = max(max_dd, 1.0 - tot / peak_tot)
        if tot <= 0:
            break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = tqqq_sh * tqqq[ci_end] if is_invested else 0.0
    final  = pv_end + cash

    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1.0 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'):
        min_val = 0.0

    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
        "tqqq_liv_sells": cum_tqqq_sell_for_living,
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
    parser.add_argument("--no-swap", action="store_true", help="스왑금리 없이 운용보수만")
    args = parser.parse_args()
    with_swap = not args.no_swap

    t0 = time.time()
    print("=" * 72, flush=True)
    print("초기 현금 버퍼 전략 백테스트 (RULE25 기반)", flush=True)
    print(f"{'스왑금리 포함' if with_swap else '운용보수만'}", flush=True)
    print("=" * 72, flush=True)

    tqqq, closes, ema200, peaks, rp_daily, dates, fed_rates = load_data(with_swap)

    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    all_starts  = get_monthly_starts(dates)
    starts      = [i for i in all_starts
                   if i >= first_valid and (len(tqqq) - i) / 252 >= SIM_YEARS]

    print(f"코호트: {len(starts)}개  전략: {len(STRATEGIES)}개", flush=True)
    print(flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(tqqq, closes, ema200, peaks, rp_daily,
                  dates.tolist(), fed_rates, starts)
    ) as pool:
        raw = dict(pool.map(_run_one, STRATEGIES))

    # ── 통계 요약 출력 ──
    print(f"{'전략':<8} {'설명':<38} {'중앙값':>8} {'평균':>8} {'최악':>8} "
          f"{'인출합계':>10} {'생존율':>7}", flush=True)
    print("-" * 95, flush=True)

    summary = {}
    start_dates = [dates[si].strftime("%Y-%m") for si in starts]

    for p in STRATEGIES:
        rows = raw[p.name]
        finals    = [r["final"]     for r in rows]
        wds       = [r["withdrawn"] for r in rows]
        bankrupts = [r["bankrupt"]  for r in rows]
        tls       = [r["tqqq_liv_sells"] for r in rows]

        med_f  = float(np.median(finals))
        avg_f  = float(np.mean(finals))
        min_f  = float(np.min(finals))
        med_wd = float(np.median(wds))
        surv   = 100.0 * (1 - sum(bankrupts) / len(bankrupts))
        avg_tls = float(np.mean(tls))

        print(f"{p.name:<8} {p.desc:<38} {med_f:>7.0f}억 {avg_f:>7.0f}억 {min_f:>7.1f}억 "
              f"{med_wd:>8.1f}억 {surv:>6.1f}%  (TQQQ생활비매도 평균 {avg_tls:.1f}회)", flush=True)

        summary[p.name] = {
            "desc":       p.desc,
            "buf_ratio":  p.buf_ratio,
            "median":     round(med_f, 2),
            "mean":       round(avg_f, 2),
            "min":        round(min_f, 2),
            "median_wd":  round(med_wd, 2),
            "survival":   round(surv, 1),
            "avg_tqqq_liv_sells": round(avg_tls, 1),
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
                    "tls":       raw[p.name][i]["tqqq_liv_sells"],
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
