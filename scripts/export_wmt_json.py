"""
export_wmt_json.py  —  WMT rolling CSV → web/public/data/rolling/WMT_rolling.json
단독 실행용. export_rolling_json.py에도 동일 내용이 추가되어 있음.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
import json
import yfinance as yf
from pathlib import Path
from rolling_analysis import RollingAnalyzer, summary_stats

SRC = Path(__file__).parent / "data" / "rolling"
DST = Path(__file__).parent.parent / "web" / "public" / "data" / "rolling"
DST.mkdir(parents=True, exist_ok=True)

# ── WMT EPS 데이터 (SEC EDGAR XBRL, CIK: 0000104169) ─────────────
# 월마트 회계연도: FY(Y+1) ending January 31, Y+1 → 달력연도 Y에 매핑
# 예) FY2025 ending 2025-01-31 → 달력연도 2024 EPS
#
# 분할 이력:
#   2:1 × 11회 (1971~1999), 3:1 × 1회 (2024-02-26)
#   → FY ending 2024-01-31 이전(달력연도 2023 이하)은 ÷3 조정 완료
#
# 주요 EPS 왜곡 연도:
#   2017: TCJA 세금개혁 일회성 전환세 → EPS 급감
#   2018: Flipkart 인수 관련 항목 포함
#   2021: Asda(영국) 매각 + COVID 영향
#   2022: 오피오이드 합의 비용($3.1B) + 기타 일회성 비용
#   2023: 투자 관련 평가 손실
#
# 출처: SEC EDGAR XBRL companyfacts EarningsPerShareDiluted (USD/shares)
_WMT_EPS = {
    2007: 1.0433,  # FY ending 2008-01-31 ÷3
    2008: 1.1300,  # FY ending 2009-01-31 ÷3
    2009: 1.2367,  # FY ending 2010-01-31 ÷3
    2010: 1.4900,  # FY ending 2011-01-31 ÷3
    2011: 1.5067,  # FY ending 2012-01-31 ÷3
    2012: 1.6733,  # FY ending 2013-01-31 ÷3
    2013: 1.6267,  # FY ending 2014-01-31 ÷3
    2014: 1.6833,  # FY ending 2015-01-31 ÷3
    2015: 1.5233,  # FY ending 2016-01-31 ÷3
    2016: 1.4600,  # FY ending 2017-01-31 ÷3
    2017: 1.0933,  # FY ending 2018-01-31 ÷3 (TCJA 일회성)
    2018: 0.7533,  # FY ending 2019-01-31 ÷3 (Flipkart 관련)
    2019: 1.7300,  # FY ending 2020-01-31 ÷3
    2020: 1.5833,  # FY ending 2021-01-31 ÷3
    2021: 0.5400,  # FY ending 2022-01-31 ÷3 (Asda 매각 손실 등)
    2022: 0.4733,  # FY ending 2023-01-31 ÷3 (오피오이드 합의 비용)
    2023: 0.6367,  # FY ending 2024-01-31 ÷3 (투자 평가손실)
    2024: 2.4100,  # FY ending 2025-01-31 (3:1 분할 이후, 조정 불필요)
    2025: 2.7300,  # FY ending 2026-01-31 (3:1 분할 이후, 조정 불필요)
}
_WMT_ONE_TIME = {
    2017: "TCJA 세금개혁 일회성 전환세(EPS 급감)",
    2018: "Flipkart 인수 관련 비용 및 기타 항목",
    2021: "Asda(영국) 매각 손실 + COVID-19",
    2022: "오피오이드 합의 비용($3.1B) + 기타 일회성 비용",
    2023: "투자 관련 평가 손실(JD.com 등)",
}


def compute_eps_decomp(df_annual: pd.DataFrame, eps_dict: dict, one_time: dict) -> list:
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
        eps_x  = eps_s / eps_b
        pe_x   = pe_s / pe_b
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


def df_to_rows(df: pd.DataFrame, eps_dict: dict = None) -> list:
    rows = []
    for _, r in df.iterrows():
        buy_yr = int(r["buy_date"].year)
        row = {
            "buyYear":    buy_yr,
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
        if eps_dict and buy_yr in eps_dict and eps_dict[buy_yr]:
            eps = eps_dict[buy_yr]
            if eps > 0:
                row["peBuy"] = round(float(r["buy_price"]) / eps, 1)
        rows.append(row)
    return rows


# ── WMT ──────────────────────────────────────────────────────────
print("[WMT] 데이터 로드...")
az_wmt = RollingAnalyzer("WMT", benchmark="^SP500TR")
df10a_wmt = pd.read_csv(SRC / "WMT_10y_annual.csv", parse_dates=["buy_date", "sell_date"])
df5a_wmt  = pd.read_csv(SRC / "WMT_5y_annual.csv",  parse_dates=["buy_date", "sell_date"])
fp_wmt = az_wmt.full_period()
st_wmt = summary_stats(df10a_wmt, label="WMT")

loss5_wmt = df5a_wmt[df5a_wmt["is_complete"] & (df5a_wmt["cagr"] < 0)]

print("[현재 지표 조회] WMT ...")
info = yf.Ticker("WMT").info
pe  = info.get("trailingPE") or info.get("forwardPE")
div = (info.get("dividendYield") or 0)
eps = info.get("trailingEps") or info.get("forwardEps")
price = info.get("currentPrice") or info.get("regularMarketPrice")
wmt_metrics = {
    "price":    round(price, 2) if price else None,
    "pe":       round(pe, 1) if pe else None,
    "divYield": round(div, 2),
    "eps":      round(eps, 2) if eps else None,
}
print(f"  WMT: {wmt_metrics}")

wmt_out = {
    "ticker":    "WMT",
    "name":      "월마트",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "분할 이력: 2:1 × 11회(1971~1999) + 3:1(2024-02-26). EPS는 현재 분할 기준으로 소급 조정. EPS 커버리지는 2007년부터 (SEC EDGAR XBRL).",
    "current":   wmt_metrics,
    "fullPeriod": fp_wmt,
    "stats": {
        "n":        st_wmt["n_complete"],
        "min":      st_wmt["min_cagr"],
        "minBuy":   st_wmt["min_buy"],
        "median":   st_wmt["median_cagr"],
        "mean":     st_wmt["mean_cagr"],
        "max":      st_wmt["max_cagr"],
        "maxBuy":   st_wmt["max_buy"],
        "over10":   st_wmt["pct_over_10"],
        "over15":   st_wmt["pct_over_15"],
        "over20":   st_wmt["pct_over_20"],
        "losses":   st_wmt["n_losses"],
        "beatBench":  st_wmt.get("n_beat_bench"),
        "beatTotal":  st_wmt.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_wmt, _WMT_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_wmt.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_wmt, _WMT_EPS, _WMT_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL (FY2008~FY2026, USD/shares, 달력연도 기준). 2024-02-26 3:1 분할 반영: 달력연도 2023 이하 EPS ÷3 조정. 2021~2023년 EPS는 일회성 항목으로 왜곡됨 (주석 참고). PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path = DST / "WMT_rolling.json"
out_path.write_text(json.dumps(wmt_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path}")
print("\n[완료]")
