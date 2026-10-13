"""
krw_accumulation.py

원화 기준 적립식 백테스트 — 달러 기준(기존)과 비교
──────────────────────────────────────────────────────────────────────
달러 기준(기존): 원화 20만원을 달러 합성가격으로 직접 나눔 (환율 1 고정 가정)
원화 기준(신규): 원화 20만원을 당일 환율로 환산한 원화 TQQQ 가격으로 나눔
  원화 TQQQ 가격 = 달러 합성가격 × 당일 환율
  → 위기 시 환율 상승이 낙폭을 줄이는 효과 반영

비교 대상: 1990-01 이후 코호트 (환율 데이터 시작 + 1997 외환위기 포함)
전략: A전략 (매일 20만원 무한 적립), 목표 원화 10억

출력: web/public/data/krw_accumulation.json
"""

import json
import sys
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices, get_monthly_starts

ROOT    = Path(__file__).resolve().parent.parent
OUT     = ROOT / "web/public/data/krw_accumulation.json"

DAILY_KRW = 200_000          # 매일 원화 투자금
TARGET_KRW = 1_000_000_000   # 목표 원화 10억
START_DATE = "1990-01-01"    # 환율 데이터 시작

# ── 환율 로드 ─────────────────────────────────────────────────────
def load_fx(ndx_dates: pd.DatetimeIndex) -> np.ndarray:
    """NDX 거래일 배열에 맞춰 환율(원/달러) 반환. 공휴일은 직전 거래일 값으로 채움."""
    fx_df = pd.read_csv(ROOT / "data/extra/usdkrw.csv", parse_dates=["Date"])
    fx_df = fx_df.sort_values("Date").set_index("Date")
    # NDX 날짜로 reindex → 없는 날은 앞값 채움
    fx_aligned = fx_df.reindex(ndx_dates).ffill().bfill()
    return fx_aligned["Value"].values.astype(float)


def run():
    # ── 데이터 로드 ────────────────────────────────────────────────
    d = load_ndx_prices("with_costs")
    dates  = d["dates"]
    ndx3x  = d["ndx3x"]   # 달러 합성가격

    fx = load_fx(dates)   # 원/달러 환율 (NDX 날짜 기준)

    # ── 1990-01 이후 코호트 시작 인덱스 ─────────────────────────────
    monthly_starts = get_monthly_starts(dates)
    cohort_starts = [
        i for i in monthly_starts
        if dates[i] >= pd.Timestamp(START_DATE)
    ]

    rows = []
    n = len(ndx3x)

    for ci in cohort_starts:
        start_date = dates[ci]

        # ── 달러 기준 시뮬 ──────────────────────────────────────────
        # 매일 원화 20만원을 달러 합성가격으로 나눔 (환율 무시)
        usd_completed = False
        usd_years = None
        usd_end = None
        usd_invested = 0

        shares_usd = 0.0
        invested_usd = 0

        for j in range(ci, n):
            inv = DAILY_KRW
            shares_usd += inv / ndx3x[j]
            invested_usd += inv
            port = shares_usd * ndx3x[j]
            if port >= TARGET_KRW:
                usd_completed = True
                usd_years = round((dates[j] - start_date).days / 365.25, 4)
                usd_end = dates[j].strftime("%Y-%m-%d")
                usd_invested = invested_usd
                break

        if not usd_completed:
            usd_years = round((dates[-1] - start_date).days / 365.25, 4)
            usd_end = None
            usd_invested = invested_usd

        # ── 원화 기준 시뮬 ──────────────────────────────────────────
        # 매일 원화 20만원을 (달러 합성가격 × 당일 환율)로 나눔
        krw_completed = False
        krw_years = None
        krw_end = None
        krw_invested = 0

        shares_krw = 0.0
        invested_krw = 0

        for j in range(ci, n):
            krw_price = ndx3x[j] * fx[j]   # 원화 TQQQ 가격
            inv = DAILY_KRW
            shares_krw += inv / krw_price
            invested_krw += inv
            port_krw = shares_krw * krw_price
            if port_krw >= TARGET_KRW:
                krw_completed = True
                krw_years = round((dates[j] - start_date).days / 365.25, 4)
                krw_end = dates[j].strftime("%Y-%m-%d")
                krw_invested = invested_krw
                break

        if not krw_completed:
            krw_years = round((dates[-1] - start_date).days / 365.25, 4)
            krw_end = None
            krw_invested = invested_krw

        rows.append({
            "s":  start_date.strftime("%Y-%m-%d"),
            "usd": {
                "completed": usd_completed,
                "y":  usd_years,
                "e":  usd_end,
                "i":  usd_invested,
            },
            "krw": {
                "completed": krw_completed,
                "y":  krw_years,
                "e":  krw_end,
                "i":  krw_invested,
            },
            "fx_start": round(float(fx[ci]), 1),   # 시작 시점 환율
        })

        if len(rows) % 50 == 0:
            print(f"  {len(rows)}/{len(cohort_starts)} 완료...", flush=True)

    # ── 통계 계산 ─────────────────────────────────────────────────
    completed_usd = [r for r in rows if r["usd"]["completed"]]
    completed_krw = [r for r in rows if r["krw"]["completed"]]

    def stats(lst, key):
        ys = sorted(r[key]["y"] for r in lst)
        if not ys:
            return {}
        return {
            "median": round(float(np.median(ys)), 2),
            "p25":    round(float(np.percentile(ys, 25)), 2),
            "p75":    round(float(np.percentile(ys, 75)), 2),
            "worst":  round(float(max(ys)), 2),
            "best":   round(float(min(ys)), 2),
            "n_completed": len(lst),
        }

    result = {
        "meta": {
            "period": f"{START_DATE[:7]} ~ {dates[-1].strftime('%Y-%m')}",
            "n_cohorts": len(rows),
            "daily_invest_krw": DAILY_KRW,
            "target_krw": TARGET_KRW,
            "note": "1997년 이전은 관리변동환율 구간 (1997-11-17 자유변동환율 전환)",
            "price_mode": "with_costs (스왑금리 0.5%/yr + 운용보수 0.88%/yr 반영)",
        },
        "stats": {
            "usd": stats(completed_usd, "usd"),
            "krw": stats(completed_krw, "krw"),
        },
        "rows": rows,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\n=== 완료: {len(rows)}개 시작 시점 ===")
    print(f"달러 기준 완료: {len(completed_usd)}개  중간: {result['stats']['usd'].get('median','N/A')}년  최장: {result['stats']['usd'].get('worst','N/A')}년")
    print(f"원화 기준 완료: {len(completed_krw)}개  중간: {result['stats']['krw'].get('median','N/A')}년  최장: {result['stats']['krw'].get('worst','N/A')}년")
    print(f"저장: {OUT}")


if __name__ == "__main__":
    run()
