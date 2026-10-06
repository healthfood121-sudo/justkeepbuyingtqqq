"""
synthetic_ndx_beta_sweep.py
SP500 1927~1971 데이터에 여러 베타 값을 적용해 synthetic NDX를 만들고,
실제 NDX(1971~)와 접합 후 C전략 worst-case 소요기간을 비교한다.

비교 베타:
  β=0.767  pre-tech (1971-1990 실측) — 이전에 사용한 값
  β=1.138  recent   (2011-2026 실측)
  β=1.244  tech-era (1991-2026 실측)
  β=1.294  latest   (2021-2026 실측)
"""

import numpy as np
import pandas as pd

from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR = str(_ROOT / "data") + "/"

DAILY_INVEST = 200_000
TARGET       = 1_000_000_000

BETAS = [
    ("pre-tech β=0.767", 0.7670, 0.0/252),    # α=0 (일 단위 초과수익 없음, 순수 베타만)
    ("recent  β=1.138", 1.1380, 4.45/100/252),
    ("tech-era β=1.244", 1.2444, 4.34/100/252),
    ("latest  β=1.294", 1.2940, -1.53/100/252),
]


# ─── 1. 데이터 로드 ───────────────────────────────────────

def load_ndx():
    df = pd.read_csv(DATA_DIR + "ndx_1971_now.csv", parse_dates=["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    # 1985-10-01 splice 보정
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i - 1, "Close"] / df.loc[i, "Close"]
        df.loc[i:, "Close"] *= scale
    return df

def load_sp500():
    df = pd.read_csv(DATA_DIR + "sp500_1927_now.csv", parse_dates=["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    return df


# ─── 2. Synthetic NDX 생성 ────────────────────────────────

def make_synthetic_ndx(sp500_df, ndx_df, beta, alpha_daily):
    """
    SP500 pre-1971 구간에 beta+alpha 적용해 synthetic NDX 생성,
    1971-02-05 이후는 실제 NDX로 접합.
    반환: (dates, prices) numpy arrays
    """
    ndx_start = ndx_df["Date"].iloc[0]  # 1971-02-05

    # SP500 pre-1971 구간
    sp_pre = sp500_df[sp500_df["Date"] < ndx_start].copy()
    sp_ret = sp_pre["Close"].pct_change().fillna(0).values  # 일별 수익률

    # synthetic 수익률 = β * sp_ret + α
    syn_ret = beta * sp_ret + alpha_daily

    # 실제 NDX 일별 수익률
    ndx_ret = ndx_df["Close"].pct_change().fillna(0).values

    # 접합 지점: synthetic 마지막 날 가격 = 실제 NDX 첫날 가격이 되도록 스케일
    # 1) synthetic 가격 (100에서 시작)
    syn_prices = 100.0 * np.cumprod(1.0 + syn_ret)

    # 2) 실제 NDX 가격 (100에서 시작)
    ndx_prices = 100.0 * np.cumprod(1.0 + ndx_ret)

    # 접합: synthetic 마지막 값 = ndx_prices[0]이 되도록 NDX 스케일 조정
    # → 전체 가격 연속성 유지
    scale = syn_prices[-1] / ndx_prices[0]
    ndx_prices_adj = ndx_prices * scale

    # 날짜 + 가격 합치기
    dates = np.concatenate([sp_pre["Date"].values, ndx_df["Date"].values])
    prices = np.concatenate([syn_prices, ndx_prices_adj])

    return dates, prices


# ─── 3. C전략 백테스트 (월별 코호트) ─────────────────────

def backtest_c(dates, prices):
    dates_pd = pd.Series(dates).dt.normalize()

    # 월별 첫 거래일 인덱스
    ym = dates_pd.dt.to_period("M")
    seen = {}
    cohort_idxs = []
    for i, p in enumerate(ym):
        if p not in seen:
            seen[p] = True
            cohort_idxs.append(i)

    results = []
    for ci in cohort_idxs:
        px = prices[ci:]
        n  = len(px)
        inv = np.full(n, float(DAILY_INVEST))
        shares = inv / px
        cum_shares = np.cumsum(shares)
        port = cum_shares * px

        hit = port >= TARGET
        start_dt = dates_pd.iloc[ci]

        if hit.any():
            hi = int(np.argmax(hit))
            end_dt = dates_pd.iloc[ci + hi]
            years = (end_dt - start_dt).days / 365.25
            results.append({
                "start": start_dt,
                "years": years,
                "end":   end_dt,
                "status": "completed",
            })
        else:
            results.append({
                "start": start_dt,
                "years": None,
                "end":   dates_pd.iloc[-1],
                "status": "in_progress",
            })

    return pd.DataFrame(results)


# ─── 4. 요약 출력 ─────────────────────────────────────────

def summarize(df, label):
    completed = df[df["status"] == "completed"]
    total = len(df)
    n_done = len(completed)
    if n_done == 0:
        print(f"  {label:30s}  완료 0/{total}")
        return

    worst_row = completed.loc[completed["years"].idxmax()]
    yrs_sorted = completed["years"].sort_values(ascending=False)

    print(f"\n  ── {label} ──")
    print(f"     완료: {n_done}/{total}  ({n_done/total*100:.1f}%)")
    print(f"     최장: {worst_row['years']:.2f}년  시작={worst_row['start'].strftime('%Y-%m')}  종료={worst_row['end'].strftime('%Y-%m')}")
    print(f"     상위 5위:")
    for _, r in completed.nlargest(5, "years").iterrows():
        print(f"       {r['start'].strftime('%Y-%m')} → {r['years']:.2f}년  ({r['end'].strftime('%Y-%m')})")

    # 1929년 전후 코호트 (1928-12 ~ 1930-06)
    crisis = completed[
        (completed["start"] >= "1928-12-01") &
        (completed["start"] <= "1930-06-30")
    ]
    if not crisis.empty:
        print(f"     1929 대공황 구간 (1928-12 ~ 1930-06):")
        for _, r in crisis.iterrows():
            print(f"       {r['start'].strftime('%Y-%m')} → {r['years']:.2f}년")
    else:
        print(f"     1929 대공황 구간: 코호트 없음")


# ─── 5. NDX3x + NDX1x 비교 (실측 1971~) ──────────────────

def compare_real_ndx(ndx_df):
    """실제 NDX로만 (1971~) A/B/C 전략 최장 확인"""
    for lev, label in [(1.0, "NDX 1x"), (2.0, "NDX 2x"), (3.0, "NDX 3x")]:
        ret = ndx_df["Close"].pct_change().fillna(0).values
        prices = 100.0 * np.cumprod(1.0 + ret * lev)
        dates  = ndx_df["Date"].values
        df = backtest_c(dates, prices)
        completed = df[df["status"] == "completed"]
        if completed.empty:
            print(f"  {label}: 완료 없음")
            continue
        worst = completed.loc[completed["years"].idxmax()]
        print(f"  {label:10s} 최장={worst['years']:.2f}년  시작={worst['start'].strftime('%Y-%m')}")


# ─── main ─────────────────────────────────────────────────

def main():
    print("데이터 로드 중...")
    ndx_df   = load_ndx()
    sp500_df = load_sp500()

    print(f"  NDX:   {ndx_df['Date'].iloc[0].strftime('%Y-%m-%d')} ~ {ndx_df['Date'].iloc[-1].strftime('%Y-%m-%d')}  ({len(ndx_df):,}일)")
    print(f"  SP500: {sp500_df['Date'].iloc[0].strftime('%Y-%m-%d')} ~ {sp500_df['Date'].iloc[-1].strftime('%Y-%m-%d')}  ({len(sp500_df):,}일)")

    print("\n─── 실제 NDX 데이터 (1971~) C전략 최장 ───")
    compare_real_ndx(ndx_df)

    print("\n" + "="*70)
    print("Synthetic NDX 1x (SP500 1927~1971 + 실제 NDX 1971~) — C전략 최장")
    print("="*70)

    for label, beta, alpha in BETAS:
        dates, prices = make_synthetic_ndx(sp500_df, ndx_df, beta, alpha)
        df = backtest_c(dates, prices)
        summarize(df, label)

    print("\n" + "="*70)
    print("Synthetic NDX 3x — C전략 최장")
    print("="*70)

    for label, beta, alpha in BETAS:
        dates, prices_1x = make_synthetic_ndx(sp500_df, ndx_df, beta, alpha)
        # 3x 합성: synthetic 구간은 3x ret, NDX 구간은 3x ret
        # 이미 prices_1x는 접합된 1x 가격 → 일별 수익률에서 3x를 재구성해야 함
        # prices_1x에서 일별 수익률 역산 후 ×3
        ret_1x = np.diff(prices_1x) / prices_1x[:-1]
        ret_1x = np.concatenate([[0], ret_1x])
        prices_3x = 100.0 * np.cumprod(1.0 + ret_1x * 3)

        df = backtest_c(dates, prices_3x)
        summarize(df, label + " → 3x")

    print()


if __name__ == "__main__":
    main()
