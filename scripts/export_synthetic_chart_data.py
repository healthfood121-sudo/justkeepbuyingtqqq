"""
export_synthetic_chart_data.py
포스트에 삽입할 차트용 JSON 데이터 생성

출력 파일:
  web/public/data/synthetic_ndx_cohorts.json   -- 베타별 코호트 결과 (산점도)
  web/public/data/synthetic_ndx_prices.json    -- 베타별 월별 가격 히스토리 (1927~)
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = "D:/justkeepbuyingtqqq/data/"
OUT_DIR  = "D:/justkeepbuyingtqqq/web/public/data/"

DAILY_INVEST = 200_000
TARGET       = 1_000_000_000

BETAS = [
    ("pre-tech",  0.7670,  0.0 / 252),
    ("recent",    1.1380,  4.45 / 100 / 252),
    ("tech-era",  1.2444,  4.34 / 100 / 252),
    ("latest",    1.2940, -1.53 / 100 / 252),
]


# ── 데이터 로드 ──────────────────────────────────────────

def load_ndx():
    df = pd.read_csv(DATA_DIR + "ndx_1971_now.csv", parse_dates=["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i - 1, "Close"] / df.loc[i, "Close"]
        df.loc[i:, "Close"] *= scale
    return df

def load_sp500():
    df = pd.read_csv(DATA_DIR + "sp500_1927_now.csv", parse_dates=["Date"])
    return df.sort_values("Date").reset_index(drop=True)


# ── Synthetic 생성 ────────────────────────────────────────

def make_synthetic(sp500_df, ndx_df, beta, alpha_daily):
    ndx_start = ndx_df["Date"].iloc[0]
    sp_pre    = sp500_df[sp500_df["Date"] < ndx_start].copy()

    sp_ret  = sp_pre["Close"].pct_change().fillna(0).values
    syn_ret = beta * sp_ret + alpha_daily
    syn_px  = 100.0 * np.cumprod(1.0 + syn_ret)

    ndx_ret = ndx_df["Close"].pct_change().fillna(0).values
    ndx_px  = 100.0 * np.cumprod(1.0 + ndx_ret)
    scale   = syn_px[-1] / ndx_px[0]

    dates  = np.concatenate([sp_pre["Date"].values, ndx_df["Date"].values])
    prices = np.concatenate([syn_px, ndx_px * scale])
    return dates, prices


# ── 레버리지 적용 ─────────────────────────────────────────

def apply_leverage(prices, lev):
    ret = np.diff(prices) / prices[:-1]
    ret = np.concatenate([[0], ret])
    return 100.0 * np.cumprod(1.0 + ret * lev)


# ── C전략 코호트 백테스트 ─────────────────────────────────

def backtest_c(dates, prices):
    dates_pd = pd.Series(pd.to_datetime(dates))
    ym = dates_pd.dt.to_period("M")
    seen = {}
    cohort_idxs = []
    for i, p in enumerate(ym):
        if p not in seen:
            seen[p] = True
            cohort_idxs.append(i)

    rows = []
    for ci in cohort_idxs:
        px = prices[ci:]
        n  = len(px)
        inv = np.full(n, float(DAILY_INVEST))
        cum_shares = np.cumsum(inv / px)
        port = cum_shares * px
        hit  = port >= TARGET
        start_dt = dates_pd.iloc[ci]

        if hit.any():
            hi = int(np.argmax(hit))
            end_dt = dates_pd.iloc[ci + hi]
            years  = (end_dt - start_dt).days / 365.25
            rows.append({
                "s": start_dt.strftime("%Y-%m"),
                "y": round(years, 2),
            })
        else:
            rows.append({
                "s": start_dt.strftime("%Y-%m"),
                "y": None,
            })
    return rows


# ── 월별 가격 다운샘플 ─────────────────────────────────────

def monthly_prices(dates, prices):
    """매월 마지막 거래일 가격 반환 (1927~2026)"""
    dates_pd = pd.Series(pd.to_datetime(dates))
    df = pd.DataFrame({"d": dates_pd, "p": prices})
    df["ym"] = df["d"].dt.to_period("M")
    # 월별 마지막 행
    last = df.groupby("ym", sort=True).last().reset_index()
    return [
        {"d": str(r["ym"]), "p": round(float(r["p"]), 4)}
        for _, r in last.iterrows()
    ]


# ── main ─────────────────────────────────────────────────

def main():
    print("로드 중...")
    ndx_df   = load_ndx()
    sp500_df = load_sp500()

    cohort_out = {}   # {beta_key: [rows]}
    price_out  = {}   # {beta_key: [monthly]}
    real_ndx3x = {}   # 실제 NDX 3x (1971~)

    # 실제 NDX 3x 코호트 (비교 기준선)
    ndx_ret   = ndx_df["Close"].pct_change().fillna(0).values
    ndx3x_px  = 100.0 * np.cumprod(1.0 + ndx_ret * 3)
    real_ndx3x["cohorts"] = backtest_c(ndx_df["Date"].values, ndx3x_px)

    for key, beta, alpha in BETAS:
        print(f"  {key} β={beta}...")
        dates, px1x = make_synthetic(sp500_df, ndx_df, beta, alpha)
        px3x = apply_leverage(px1x, 3.0)

        cohort_out[key] = backtest_c(dates, px3x)
        price_out[key]  = monthly_prices(dates, px3x)

    # ── 저장 ──────────────────────────────────────────────
    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)

    # 코호트 JSON
    cohorts_path = OUT_DIR + "synthetic_ndx_cohorts.json"
    with open(cohorts_path, "w", encoding="utf-8") as f:
        json.dump({
            "note":   "NDX 3x C전략 — 베타별 코호트 소요기간 (일 20만원, 목표 10억)",
            "betas":  {k: b for k, b, _ in [(k, b, a) for k, b, a in BETAS]},
            "real":   real_ndx3x["cohorts"],
            "synth":  cohort_out,
        }, f, ensure_ascii=False, separators=(",", ":"))
    size = Path(cohorts_path).stat().st_size / 1024
    print(f"  → {cohorts_path}  ({size:.1f} KB)")

    # 가격 히스토리 JSON
    prices_path = OUT_DIR + "synthetic_ndx_prices.json"
    with open(prices_path, "w", encoding="utf-8") as f:
        json.dump({
            "note":  "NDX 3x 합성가격 월별 (1927~2026, 1927-12=100)",
            "synth": price_out,
        }, f, ensure_ascii=False, separators=(",", ":"))
    size = Path(prices_path).stat().st_size / 1024
    print(f"  → {prices_path}  ({size:.1f} KB)")

    print("완료.")


if __name__ == "__main__":
    main()
