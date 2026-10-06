"""
export_synthetic_chart_data.py
포스트에 삽입할 차트용 JSON 데이터 생성

출력 파일:
  web/public/data/synthetic_ndx_cohorts.json   -- 베타별 코호트 결과 (산점도)
  web/public/data/synthetic_ndx_prices.json    -- 베타별 월별 가격 히스토리 (1927~)

가격 계산: 운용보수 반영 (TQQQ 0.88%/년, QQQ 0.20%/년)
"""

import json
import sys
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices, EXP_3X, EXP_1X

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR = str(_ROOT / "data") + "/"
OUT_DIR  = str(_ROOT / "web/public/data") + "/"

DAILY_INVEST = 200_000
TARGET       = 1_000_000_000

BETAS = [
    ("pre-tech",  0.7670,  0.0 / 252),
    ("recent",    1.1380,  4.45 / 100 / 252),
    ("tech-era",  1.2444,  4.34 / 100 / 252),
    ("latest",    1.2940, -1.53 / 100 / 252),
]


# ── 데이터 로드 ──────────────────────────────────────────

def load_sp500():
    df = pd.read_csv(DATA_DIR + "sp500_1927_now.csv", parse_dates=["Date"])
    return df.sort_values("Date").reset_index(drop=True)


# ── Synthetic 1x NDX (pre-1971 SP500 베타 회귀 + 실제 NDX 접합) ────────

def make_synthetic_1x(sp500_df, ndx_df, beta, alpha_daily):
    """SP500 베타 회귀로 pre-1971 NDX 합성 → 실제 NDX와 접합 (1x 원지수)"""
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


# ── 레버리지 적용 (운용보수 포함) ──────────────────────────

def apply_3x(prices_1x: np.ndarray) -> np.ndarray:
    """3x ETF 합성가격 — 운용보수(TQQQ 0.88%/년) 반영"""
    ret = np.diff(prices_1x) / prices_1x[:-1]
    ret = np.concatenate([[0.0], ret])
    f = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252.0)
    f[0] = 1.0
    return 100.0 * np.cumprod(f)

def apply_1x(prices_raw: np.ndarray) -> np.ndarray:
    """1x ETF 합성가격 — 운용보수(QQQ 0.20%/년) 반영"""
    ret = np.diff(prices_raw) / prices_raw[:-1]
    ret = np.concatenate([[0.0], ret])
    f = (1.0 + ret) * (1.0 - EXP_1X / 252.0)
    f[0] = 1.0
    return 100.0 * np.cumprod(f)


# ── 코호트 백테스트 (일 20만원 A전략) ─────────────────────

def backtest_a(dates, prices):
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
    """매월 마지막 거래일 가격 반환"""
    dates_pd = pd.Series(pd.to_datetime(dates))
    df = pd.DataFrame({"d": dates_pd, "p": prices})
    df["ym"] = df["d"].dt.to_period("M")
    last = df.groupby("ym", sort=True).last().reset_index()
    return [
        {"d": str(r["ym"]), "p": round(float(r["p"]), 4)}
        for _, r in last.iterrows()
    ]


# ── main ─────────────────────────────────────────────────

def main():
    print("로드 중...")
    d = load_ndx_prices('standard')   # 운용보수 반영 가격
    ndx_df   = pd.DataFrame({"Date": d["dates"], "Close": d["closes"]})
    sp500_df = load_sp500()

    # 실제 NDX 코호트 (비교 기준선) — data_loader standard 가격 직접 사용
    real_cohorts = {
        "1x": backtest_a(d["dates"].values, d["ndx1x"]),
        "3x": backtest_a(d["dates"].values, d["ndx3x"]),
    }

    cohort_out = {}
    price_out  = {}

    for key, beta, alpha in BETAS:
        print(f"  {key} β={beta}...")
        dates, px_raw = make_synthetic_1x(sp500_df, ndx_df, beta, alpha)

        px1x = apply_1x(px_raw)
        px3x = apply_3x(px_raw)

        cohort_out[key] = {
            "1x": backtest_a(dates, px1x),
            "3x": backtest_a(dates, px3x),
        }
        price_out[key] = monthly_prices(dates, px3x)

    # ── 저장 ──────────────────────────────────────────────
    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)

    cohorts_path = OUT_DIR + "synthetic_ndx_cohorts.json"
    with open(cohorts_path, "w", encoding="utf-8") as f:
        json.dump({
            "note":  "A전략 — 베타별·레버리지별 시작 시점 소요기간 (일 20만원, 목표 10억, 운용보수 반영)",
            "betas": {k: b for k, b, _ in BETAS},
            "real":  real_cohorts,
            "synth": cohort_out,
        }, f, ensure_ascii=False, separators=(",", ":"))
    size = Path(cohorts_path).stat().st_size / 1024
    print(f"  → synthetic_ndx_cohorts.json  ({size:.1f} KB)")

    prices_path = OUT_DIR + "synthetic_ndx_prices.json"
    with open(prices_path, "w", encoding="utf-8") as f:
        json.dump({
            "note":  "NDX 3x 합성가격 월별 (1927~, 1927-12=100, 운용보수 반영)",
            "synth": price_out,
        }, f, ensure_ascii=False, separators=(",", ":"))
    size = Path(prices_path).stat().st_size / 1024
    print(f"  → synthetic_ndx_prices.json  ({size:.1f} KB)")

    print("완료.")


if __name__ == "__main__":
    main()
