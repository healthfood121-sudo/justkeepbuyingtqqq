"""
backtest_c_sweep.py

C전략 거치 기간 (N년치) 스윕
─────────────────────────────────────────────────────────────────
(작성 당시) C전략: 매일 20만 + LUMP_SUM(2.5억) ÷ 36개월 × 36개월 추가 — 2026-10-03부터 C전략은 60개월
  → 월 추가: ~694만/월 × 36개월

N년치 C전략:  월 추가 동일 (~694만), 하지만 N×12개월 동안 유지
  4년치: ~694만/월 × 48개월 = 총 ~3.33억 거치
  5년치: ~694만/월 × 60개월 = 총 ~4.17억 거치
  ...

목적: v2(스왑금리 포함) 기준으로 최장 기간(worst case) 단축에 최적 N 탐색
"""

import sys
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices, get_monthly_starts

DAILY_INVEST   = 200_000
BASE_LUMP_SUM  = 250_000_000   # 3년치 기준 (현재 설정)
BASE_MONTHS    = 36             # 현재 3년 = 36개월
MONTHLY_CHUNK  = BASE_LUMP_SUM / BASE_MONTHS   # ~694만/월 고정
TARGET         = 1_000_000_000  # 10억

SWEEP_YEARS = [2, 3, 4, 5, 6, 7, 8, 10]


def backtest_cohort_c_n(prices, dates, start_i, n_years: int) -> dict | None:
    total = len(prices)
    n = total - start_i
    if n <= 0:
        return None

    px  = prices[start_i : start_i + n]
    inv = np.full(n, float(DAILY_INVEST))

    # N년 = N×12개월 동안 월 청크 추가
    n_months = n_years * 12
    local_months = get_monthly_starts(dates[start_i : start_i + n])
    for ms in local_months[:n_months]:
        inv[ms] += MONTHLY_CHUNK

    cum_shares = np.cumsum(inv / px)
    port_value = cum_shares * px

    hit = port_value >= TARGET
    if hit.any():
        hi  = int(np.argmax(hit))
        yrs = (dates[start_i + hi] - dates[start_i]).days / 365.25
        return {"status": "completed", "years": yrs}
    else:
        return {"status": "ongoing", "years": None}


def backtest_cohort_ab(prices, dates, start_i, strategy: str) -> dict | None:
    """A, B전략 기준선"""
    CAP = 1250  # B전략 한도 1250일 = 2.5억

    total = len(prices)
    n     = total - start_i
    if n <= 0:
        return None

    px  = prices[start_i : start_i + n]
    inv = np.full(n, float(DAILY_INVEST))
    if strategy == "B":
        inv[CAP:] = 0.0

    cum_shares = np.cumsum(inv / px)
    port_value = cum_shares * px

    hit = port_value >= TARGET
    if hit.any():
        hi  = int(np.argmax(hit))
        yrs = (dates[start_i + hi] - dates[start_i]).days / 365.25
        return {"status": "completed", "years": yrs}
    else:
        return {"status": "ongoing", "years": None}


def run_sweep(prices, dates, mode_label: str):
    all_starts = get_monthly_starts(dates)

    # ── A, B 기준선 ──
    for strat in ["A", "B"]:
        results = [backtest_cohort_ab(prices, dates, si, strat) for si in all_starts]
        comp    = [r for r in results if r and r["status"] == "completed"]
        yrs     = sorted(r["years"] for r in comp)
        n_tot   = len(results)
        if yrs:
            med = yrs[len(yrs) // 2]
            wrst = yrs[-1]
            print(f"  {strat}전략         {len(comp):>4}/{n_tot}  {med:>5.1f}년  {wrst:>5.1f}년  (거치금 없음)")

    # ── C전략 N년치 스윕 ──
    for n_years in SWEEP_YEARS:
        results = [backtest_cohort_c_n(prices, dates, si, n_years) for si in all_starts]
        comp    = [r for r in results if r and r["status"] == "completed"]
        yrs     = sorted(r["years"] for r in comp)
        n_tot   = len(results)
        total_lump = MONTHLY_CHUNK * n_years * 12

        if yrs:
            med  = yrs[len(yrs) // 2]
            wrst = yrs[-1]
            mark = " ★" if n_years == 3 else ""
            print(f"  C {n_years}년치{mark}   "
                  f"{len(comp):>4}/{n_tot}  {med:>5.1f}년  {wrst:>5.1f}년  "
                  f"(총거치 {total_lump/1e8:.2f}억)")


def main():
    import time
    t0 = time.time()

    print("=" * 65)
    print(f"C전략 거치 기간(N년치) 스윕  — 월 추가: {MONTHLY_CHUNK/10000:.0f}만원/월 고정")
    print("=" * 65)
    print(f"{'':20} {'완료':>8}  {'중앙값':>6}  {'최장':>6}  {'비고'}")
    print("-" * 65)

    for mode in ["standard", "with_costs"]:
        d      = load_ndx_prices(mode)
        prices = d["ndx3x"]
        dates  = d["dates"]
        label  = "standard (운용보수만)" if mode == "standard" else "with_costs (+ 스왑금리)"
        print(f"\n[{label}]")
        run_sweep(prices, dates, label)

    print(f"\n소요: {time.time()-t0:.1f}초")


if __name__ == "__main__":
    main()
