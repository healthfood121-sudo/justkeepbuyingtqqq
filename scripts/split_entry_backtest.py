"""
거치금 분할 진입 백테스트
B전략 기반: 거치 2.5억을 어떻게 넣느냐만 바꾸고, 일 20만원 적립은 동일하게 유지.

테스트 방식:
  (0) 기준선: 첫날 2.5억 한번에 거치 (기존 B전략)
  (1) 하락 대기형: 고점 대비 -15% / -20% / -30% 하락 시 분할 매수
      분할은 거치금을 하락 조건 만족 시점부터 252거래일(1년)에 걸쳐 균등 매수
      조건이 안 걸리면 10년 후 한번에 매수 (worst case)
  (2) 시간 분할형 (월 단위): 3년 / 4년 / 5년
  (3) 시간 분할형 (일 단위): 1년 / 2년 / 3년

모든 케이스에서 일 20만원 적립은 유지.
평가: 전체 코호트 avg/median/max years_to_target, 미완료 코호트 수
"""

import numpy as np
import pandas as pd

from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR    = str(_ROOT / "data") + "/"
DAILY_INV   = 200_000
LUMP        = 250_000_000
TARGET      = 1_000_000_000


def load_ndx():
    df = pd.read_csv(DATA_DIR + "ndx_1971_now.csv", parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i - 1, "Close"] / df.loc[i, "Close"]
        df.loc[i:, "Close"] *= scale
    return df

def make_synthetic(df, leverage):
    ret = df["Close"].pct_change().fillna(0).values
    return 100.0 * np.cumprod(1.0 + ret * leverage)

def get_monthly_starts(dates_pd):
    ym = pd.Series(dates_pd.values).dt.to_period("M")
    seen = {}
    idxs = []
    for i, p in enumerate(ym):
        if p not in seen:
            seen[p] = True
            idxs.append(i)
    return idxs


def backtest_cohort_split(prices, start_i, dates_pd, lump_schedule):
    """
    prices       : 전체 합성가격 배열
    start_i      : 코호트 시작 인덱스
    lump_schedule: 길이 n인 배열 — 날짜별 거치금 투자액 (합이 LUMP)
                   shape = (len(prices) - start_i,) 또는 그보다 짧을 수 있음
    일 적립(DAILY_INV)은 무조건 day 0부터 매일 추가.
    """
    n = len(prices) - start_i
    if n <= 0:
        return None

    px = prices[start_i: start_i + n]

    # 일 적립: day 0부터 매일 20만원
    daily_arr = np.full(n, float(DAILY_INV))

    # 거치금 스케줄
    sched = np.zeros(n)
    m = min(len(lump_schedule), n)
    sched[:m] = lump_schedule[:m]

    inv = daily_arr + sched
    shares_per_day = inv / px
    cum_shares     = np.cumsum(shares_per_day)
    port_value     = cum_shares * px

    hit = port_value >= TARGET
    if hit.any():
        hi = int(np.argmax(hit))
        end_dt = dates_pd[start_i + hi]
        days   = (end_dt - dates_pd[start_i]).days
        return {
            "status": "completed",
            "years_to_target": days / 365.25,
            "end_date": end_dt,
        }
    else:
        return {
            "status": "in_progress",
            "years_to_target": None,
            "end_date": None,
        }


def make_lump_instant():
    """기준: 첫날 전액 거치"""
    return np.array([float(LUMP)])


def make_lump_daily_split(n_days):
    """n_days 거래일에 걸쳐 매일 균등 (일 단위 분할)"""
    per_day = LUMP / n_days
    return np.full(n_days, per_day)


def make_lump_monthly_split(prices_from_start, n_months):
    """
    n_months 개월에 걸쳐 매월 균등.
    월별 첫 거래일에 월 할당액을 넣는 방식.
    prices_from_start: 시작일 이후의 가격 배열 (길이 제한 없음) — 날짜 계산용
    dates_from_start : 시작일 이후 DatetimeIndex
    """
    raise NotImplementedError("use make_lump_monthly_split_dates instead")


def make_lump_monthly_split_dates(dates_from_start, n_months):
    """
    n_months 개월치 월 첫 거래일에 균등 분배.
    dates_from_start: 시작일 이후 DatetimeIndex
    returns: array of length len(dates_from_start)
    """
    n = len(dates_from_start)
    arr = np.zeros(n)
    per_month = LUMP / n_months

    ym = pd.Series(dates_from_start.values).dt.to_period("M")
    seen = {}
    count = 0
    for i, p in enumerate(ym):
        if p not in seen:
            seen[p] = True
            arr[i] += per_month
            count += 1
            if count >= n_months:
                break
    return arr


def make_lump_dip_split(prices_from_start, dip_pct, split_days=252):
    """
    고점 대비 dip_pct 이상 하락 시, 그 시점부터 split_days 거래일에 걸쳐 균등 매수.
    조건 미충족 시: 10년(2520거래일) 뒤 한번에 매수 (이 코호트는 사실상 거치금 미투자).
    dip_pct: 예) 0.20 → -20%
    """
    n = len(prices_from_start)
    arr = np.zeros(n)

    peak = prices_from_start[0]
    trigger_i = None
    for i in range(n):
        px = prices_from_start[i]
        if px > peak:
            peak = px
        drawdown = (peak - px) / peak
        if drawdown >= dip_pct:
            trigger_i = i
            break

    if trigger_i is None:
        # 조건 안 걸림 → 10년 뒤(또는 끝에서 한번에)
        fallback_i = min(2520, n - 1)
        arr[fallback_i] = float(LUMP)
        return arr

    # 트리거 시점부터 split_days에 걸쳐 분산
    end_i = min(trigger_i + split_days, n)
    actual_days = end_i - trigger_i
    per_day = LUMP / split_days  # 일정 일수로 나눔 (남은 기간 무관하게)
    arr[trigger_i:end_i] = per_day
    # 혹시 모자란 부분(기간 끝 도달)은 마지막날에 몰아서
    if actual_days < split_days:
        leftover = LUMP - per_day * actual_days
        arr[end_i - 1] += leftover
    return arr


def run_variant(prices, dates_pd, monthly_starts, variant_name, lump_fn):
    """한 가지 분할 방식에 대해 모든 코호트를 돌림"""
    results = []
    for ci in monthly_starts:
        n = len(prices) - ci
        dates_from_start = dates_pd[ci:]
        lump_schedule = lump_fn(prices[ci:], dates_from_start, n)
        r = backtest_cohort_split(prices, ci, dates_pd, lump_schedule)
        if r:
            results.append(r)
    return results


def summarize(results, name):
    completed = [r for r in results if r["status"] == "completed"]
    years = [r["years_to_target"] for r in completed]
    total = len(results)
    n_done = len(completed)
    avg   = np.mean(years) if years else None
    med   = np.median(years) if years else None
    mx    = np.max(years) if years else None
    mn    = np.min(years) if years else None
    return {
        "name":        name,
        "total":       total,
        "completed":   n_done,
        "pct":         round(100 * n_done / total, 1) if total else 0,
        "avg":         round(avg, 2) if avg else None,
        "median":      round(med, 2) if med else None,
        "max":         round(mx, 2) if mx else None,
        "min":         round(mn, 2) if mn else None,
    }


def print_table(summaries):
    print(f"\n{'방식':<30} {'완료%':>6} {'평균':>7} {'중앙':>7} {'최단':>7} {'최장':>7}")
    print("-" * 70)
    for s in summaries:
        avg = f"{s['avg']:.2f}년" if s['avg'] else "—"
        med = f"{s['median']:.2f}년" if s['median'] else "—"
        mx  = f"{s['max']:.2f}년"  if s['max']  else "—"
        mn  = f"{s['min']:.2f}년"  if s['min']  else "—"
        print(f"{s['name']:<30} {s['pct']:>5}% {avg:>7} {med:>7} {mn:>7} {mx:>7}")


# ── 레버리지별로 돌리기 ─────────────────────────────────────────────

def run_for_leverage(leverage, label):
    print(f"\n{'='*70}")
    print(f"  {label} (leverage={leverage}x)")
    print(f"{'='*70}")

    df    = load_ndx()
    prices = make_synthetic(df, leverage)
    dates_pd = df["Date"]
    monthly_starts = get_monthly_starts(dates_pd)
    print(f"  코호트 수: {len(monthly_starts)}")

    def make_fn(fn_inner):
        """fn_inner(prices_slice, dates_slice, n) → lump_schedule array"""
        return fn_inner

    variants = [
        # (이름, lump_fn(prices_slice, dates_slice, n) → array)
        ("0. 즉시 거치 (기준선)",
            lambda p, d, n: np.array([float(LUMP)])),

        # 하락 대기형
        ("1a. 하락 -15% 후 1년 분산",
            lambda p, d, n: make_lump_dip_split(p, 0.15, 252)),
        ("1b. 하락 -20% 후 1년 분산",
            lambda p, d, n: make_lump_dip_split(p, 0.20, 252)),
        ("1c. 하락 -30% 후 1년 분산",
            lambda p, d, n: make_lump_dip_split(p, 0.30, 252)),

        # 시간 분할 (월 단위)
        ("2a. 월 분할 3년 (36개월)",
            lambda p, d, n: make_lump_monthly_split_dates(d, 36)),
        ("2b. 월 분할 4년 (48개월)",
            lambda p, d, n: make_lump_monthly_split_dates(d, 48)),
        ("2c. 월 분할 5년 (60개월)",
            lambda p, d, n: make_lump_monthly_split_dates(d, 60)),

        # 시간 분할 (일 단위)
        ("3a. 일 분할 1년 (252일)",
            lambda p, d, n: make_lump_daily_split(252)),
        ("3b. 일 분할 2년 (504일)",
            lambda p, d, n: make_lump_daily_split(504)),
        ("3c. 일 분할 3년 (756일)",
            lambda p, d, n: make_lump_daily_split(756)),
    ]

    summaries = []
    for name, lump_fn in variants:
        results = []
        for ci in monthly_starts:
            prices_slice = prices[ci:]
            dates_slice  = dates_pd[ci:]
            lump_schedule = lump_fn(prices_slice, dates_slice, len(prices_slice))
            r = backtest_cohort_split(prices, ci, dates_pd, lump_schedule)
            if r:
                results.append(r)
        summaries.append(summarize(results, name))

    print_table(summaries)
    return summaries


if __name__ == "__main__":
    import time
    t0 = time.time()

    all_results = {}
    for lev, label in [(3, "TQQQ NDX 3x"), (2, "QLD NDX 2x"), (1, "QQQ NDX 1x")]:
        all_results[label] = run_for_leverage(lev, label)

    print(f"\n총 소요: {time.time()-t0:.1f}초")
