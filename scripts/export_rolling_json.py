"""
export_rolling_json.py  —  rolling CSV → web/public/data/rolling/*.json
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
import json
from pathlib import Path
from rolling_analysis import RollingAnalyzer, summary_stats, full_period_cagr

SRC = Path(__file__).parent / "data" / "rolling"
DST = Path(__file__).parent.parent / "web" / "public" / "data" / "rolling"
DST.mkdir(parents=True, exist_ok=True)

# ── NKE EPS 데이터 (SEC EDGAR XBRL) ─────────────────────────────
# NKE 회계연도(FY) = 6월~5월. 달력 연도 Y → FY(Y) EPS (5월 31일 종료) 사용.
#
# EDGAR XBRL 특성: 각 FY 값은 그것을 비교 기간으로 제시한 가장 최근 10-K의 값.
# → 해당 10-K 제출 시점에 적용된 주식분할만 반영됨 (이후 분할 미적용).
#
# NKE 주요 분할 (Yahoo Finance 기준): 1990, 1995, 1996, 2007, 2012, 2015 (각 2:1)
# EDGAR 데이터의 분할 반영 현황:
#   FY2008-2010: FY2010-2012 10-K 비교 데이터 → 2007 분할까지만 반영 → 2012·2015 분할 추가 적용(÷4)
#   FY2011-2013: FY2013-2015 10-K 비교 데이터 → 2012 분할까지 반영    → 2015 분할 추가 적용(÷2)
#   FY2014+    : FY2016+ 10-K 비교 데이터    → 2015 분할까지 반영    → 추가 조정 없음
#
# 참고: FY2018은 세금개혁(TCJA) 일회성 비용으로 EPS -53%, FY2020은 COVID 영향
_NKE_EDGAR_RAW = {
    2008: 3.74, 2009: 3.03, 2010: 3.86,   # ÷4 필요
    2011: 2.20, 2012: 2.35, 2013: 2.70,   # ÷2 필요
    2014: 1.49, 2015: 1.85,               # 조정 불필요
    2016: 2.16, 2017: 2.51, 2018: 1.17,
    2019: 2.49, 2020: 1.60, 2021: 3.56,
    2022: 3.75, 2023: 3.23, 2024: 3.73,
    2025: 2.16, 2026: 2.10,
}
# 일회성 항목으로 EPS 왜곡이 심한 연도
_NKE_ONE_TIME = {2018: "세금개혁(TCJA)", 2020: "COVID-19"}

def _nke_split_adj(fy, raw):
    if fy <= 2010: return raw / 4
    if fy <= 2013: return raw / 2
    return raw

NKE_EPS = {yr: round(_nke_split_adj(yr, v), 4) for yr, v in _NKE_EDGAR_RAW.items()}


def compute_eps_decomp(df_annual: pd.DataFrame, eps_dict: dict, one_time: dict) -> list:
    """완결 10년 롤링 구간별 EPS/PER 분해 계산.

    price = EPS × PER 항등식으로 분해:
      EPS 배수  = EPS_sell / EPS_buy
      PER 배수  = PER_sell / PER_buy  (PER = adj_price / EPS, 배당조정가 사용 → PER 약간 낮게 표시)
      가격 배수 ≈ EPS 배수 × PER 배수  (배당 효과는 총수익률에 추가 반영)

    주의: buy_price / sell_price는 Yahoo Finance 배당+분할 조정 종가로,
          배당 누적분만큼 역산 가격이 낮아져 PER 절대값이 실제보다 약간 낮음.
          다만 PER 배수(비율)는 근사적으로 유효.
    """
    result = []
    completed = df_annual[df_annual["is_complete"]].copy()
    for _, r in completed.iterrows():
        by = int(r["buy_date"].year)
        sy = int(r["sell_date"].year)
        if by not in eps_dict or sy not in eps_dict:
            continue
        eps_b = eps_dict[by]
        eps_s = eps_dict[sy]
        if eps_b is None or eps_s is None or eps_b <= 0:
            continue

        p_b = float(r["buy_price"])
        p_s = float(r["sell_price"])
        yrs = float(r["years_actual"])

        pe_b   = p_b / eps_b
        pe_s   = p_s / eps_s
        eps_x  = eps_s / eps_b        # EPS 배수
        pe_x   = pe_s / pe_b          # PER 배수
        eps_cagr = (eps_x ** (1/yrs) - 1) * 100
        pe_cagr  = (pe_x ** (1/yrs) - 1) * 100

        note = []
        if by in one_time:  note.append(f"매수연도 EPS: {one_time[by]}")
        if sy in one_time:  note.append(f"매도연도 EPS: {one_time[sy]}")

        result.append({
            "buyYear":      by,
            "sellYear":     sy,
            "epsBuy":       round(eps_b, 3),
            "epsSell":      round(eps_s, 3),
            "epsMultiple":  round(eps_x, 2),
            "peBuy":        round(pe_b, 1),
            "peSell":       round(pe_s, 1),
            "peMultiple":   round(pe_x, 2),
            "epsGrowthCagr": round(eps_cagr, 2),
            "peCagr":       round(pe_cagr, 2),
            "totalCagr":    float(r["cagr"]),
            "note":         "; ".join(note) if note else None,
        })
    return result

def df_to_rows(df: pd.DataFrame) -> list:
    rows = []
    for _, r in df.iterrows():
        row = {
            "buyYear":    int(r["buy_date"].year),
            "sellYear":   int(r["sell_date"].year),
            "sellDate":   r["sell_date"].strftime("%Y-%m-%d"),
            "yearsActual": float(round(r["years_actual"], 1)),
            "cagr":       float(r["cagr"]),
            "multiple":   float(r["multiple"]),
            "isComplete": bool(r["is_complete"]),
        }
        if "bench_cagr" in r and pd.notna(r["bench_cagr"]):
            row["benchCagr"] = float(r["bench_cagr"])
            row["diff"]      = float(r["diff_pct"])
        rows.append(row)
    return rows

# ── NKE ──────────────────────────────────────────────────────
print("[NKE] 데이터 로드...")
az_nke = RollingAnalyzer("NKE", benchmark="^SP500TR")
df10a = pd.read_csv(SRC / "NKE_10y_annual.csv",  parse_dates=["buy_date","sell_date"])
df5a  = pd.read_csv(SRC / "NKE_5y_annual.csv",   parse_dates=["buy_date","sell_date"])
fp_nke = az_nke.full_period()
st_nke = summary_stats(df10a, label="NKE")

loss5 = df5a[df5a["is_complete"] & (df5a["cagr"] < 0)]

import yfinance as yf

def get_metrics(ticker: str) -> dict:
    info = yf.Ticker(ticker).info
    pe  = info.get("trailingPE") or info.get("forwardPE")
    div = (info.get("dividendYield") or 0)   # yfinance returns decimal (0.044 = 4.4%)
    eps = info.get("trailingEps") or info.get("forwardEps")
    price = info.get("currentPrice") or info.get("regularMarketPrice")
    return {
        "price":    round(price, 2) if price else None,
        "pe":       round(pe, 1) if pe else None,
        "divYield": round(div, 2),   # percent (yfinance already in %)
        "eps":      round(eps, 2) if eps else None,
    }

print("[현재 지표 조회] NKE, RMS.PA ...")
nke_metrics = get_metrics("NKE")
rms_metrics = get_metrics("RMS.PA")
print(f"  NKE:    {nke_metrics}")
print(f"  RMS.PA: {rms_metrics}")

nke_out = {
    "ticker":    "NKE",
    "name":      "나이키",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1980~1982 매수 구간은 Yahoo Finance 분할 이력 누락으로 macrotrends 대비 약 8~9pp 낮을 수 있음",
    "current":   nke_metrics,
    "fullPeriod": fp_nke,
    "stats": {
        "n":        st_nke["n_complete"],
        "min":      st_nke["min_cagr"],
        "minBuy":   st_nke["min_buy"],
        "median":   st_nke["median_cagr"],
        "mean":     st_nke["mean_cagr"],
        "max":      st_nke["max_cagr"],
        "maxBuy":   st_nke["max_buy"],
        "over10":   st_nke["pct_over_10"],
        "over15":   st_nke["pct_over_15"],
        "over20":   st_nke["pct_over_20"],
        "losses":   st_nke["n_losses"],
        "beatBench":  st_nke.get("n_beat_bench"),
        "beatTotal":  st_nke.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a, NKE_EPS, _NKE_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL (FY2008~2026). 분할조정: FY2008-2010÷4, FY2011-2013÷2. PER은 Yahoo Finance 배당조정 종가 사용 → 실제 PER 대비 소폭 낮게 표시될 수 있음.",
}

out_path = DST / "NKE_rolling.json"
out_path.write_text(json.dumps(nke_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path}")

# ── RMS.PA ────────────────────────────────────────────────────
print("[RMS.PA] 데이터 로드...")
df_rms = pd.read_csv(SRC / "RMS_10y_annual_full.csv", parse_dates=["buy_date","sell_date"])
az_rms = RollingAnalyzer("RMS.PA", benchmark="^SP500TR")
fp_rms = az_rms.full_period()
st_rms = summary_stats(df_rms, label="RMS")

rms_out = {
    "ticker":    "RMS.PA",
    "name":      "에르메스",
    "currency":  "EUR",
    "benchmark": "S&P 500",
    "note":      "1993~1999 연간 수익률은 TradingView 데이터, 2000년 이후는 Yahoo Finance. 1993~1999는 가격 수익률일 수 있음(배당 미포함 가능성)",
    "current":   rms_metrics,
    "fullPeriod": fp_rms,
    "stats": {
        "n":       st_rms["n_complete"],
        "min":     st_rms["min_cagr"],
        "minBuy":  st_rms["min_buy"],
        "median":  st_rms["median_cagr"],
        "mean":    st_rms["mean_cagr"],
        "max":     st_rms["max_cagr"],
        "maxBuy":  st_rms["max_buy"],
        "over10":  st_rms["pct_over_10"],
        "over15":  st_rms["pct_over_15"],
        "over20":  st_rms["pct_over_20"],
        "losses":  st_rms["n_losses"],
        "beatBench":  st_rms.get("n_beat_bench"),
        "beatTotal":  st_rms.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df_rms),
    "loss5y": [],
    "epsDecomp": [],
    "epsNote": "EPS 이력 데이터 미확보 (에르메스는 SEC 미상장, EDGAR XBRL 없음). 향후 수동 입력 예정.",
}

out_path2 = DST / "RMS_rolling.json"
out_path2.write_text(json.dumps(rms_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path2}")
print("\n[완료]")
