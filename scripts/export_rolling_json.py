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

# ── NKE EPS 데이터 ────────────────────────────────────────────
# NKE 회계연도(FY) = 6월~5월. 달력 연도 Y → FY(Y) EPS (5월 31일 종료) 사용.
#
# NKE 주요 분할: 1990, 1995, 1996, 2007(Apr), 2012, 2015 (각 2:1)
#
# 출처별 분할 반영 현황:
#   FY1989-2002: Nike 1999 Annual Report + FY2002 10-K
#                → 1990+1995+1996 분할까지 반영 → 2007+2012+2015 분할 추가 적용(÷8)
#   FY2003-2007: Nike FY2007 10-K (Apr 2007 분할 이후 소급 적용)
#                → 2007 분할까지 반영           → 2012+2015 분할 추가 적용(÷4)
#   FY2008-2010: EDGAR XBRL (FY2010-2012 10-K 비교 데이터)
#                → 2007 분할까지 반영           → 2012+2015 분할 추가 적용(÷4)
#   FY2011-2013: EDGAR XBRL (FY2013-2015 10-K 비교 데이터)
#                → 2012 분할까지 반영           → 2015 분할 추가 적용(÷2)
#   FY2014+    : EDGAR XBRL (FY2016+ 10-K)     → 추가 조정 없음
#
# 주요 EPS 왜곡 연도:
#   FY1998: 아시아 금융위기 영향(-50%), FY2003: 사업부 손상차손(-28%)
#   FY2018: 세금개혁(TCJA, -53%), FY2020: COVID-19
_NKE_EDGAR_RAW = {
    # FY1984-1988: pre-EDGAR 시대. FY1987은 UPI 1988 기사에서 $0.93/주(pre-1990 split) 확인.
    #   FY1988은 Nike 1997 10-K에서 $0.34(post-1990+1995+1996) 확인.
    #   FY1984-1986은 순이익(Motley Fool/UPI 확인) ÷ 추정 주식수(~38.1M, FY1987-1988 평균) 로 산출.
    #   모두 post-1990+1995+1996 기준으로 환산 후 저장 (÷8 추가 필요).
    1984: 0.134,  # NI $40.7M 확인, ~38.1M주 추정 → $1.07/주(pre-split) ÷8
    1985: 0.034,  # NI $10.3M 확인, ~38.1M주 추정 → $0.27/주(pre-split) ÷8
    1986: 0.194,  # NI $59.2M 확인, ~38.1M주 추정 → $1.55/주(pre-split) ÷8
    1987: 0.116,  # $0.93/주 확인(UPI 1988.07 기사, pre-1990 split) ÷8
    1988: 0.34,   # $0.34/주 확인(Nike 1997 10-K, post-1990+1995+1996 splits)
    # FY1989-1999: Nike 1999 Annual Report (post-1990+1995+1996 splits, ÷8 필요)
    1989: 0.56, 1990: 0.80, 1991: 0.94, 1992: 1.07, 1993: 1.18,
    1994: 0.99, 1995: 1.36, 1996: 1.88, 1997: 2.68, 1998: 1.35, 1999: 1.57,
    # FY2000-2002: Nike FY2002 10-K (동일 기준, ÷8 필요)
    2000: 2.07, 2001: 2.16, 2002: 2.46,
    # FY2003-2007: Nike FY2007 10-K (post-Apr2007 split, ÷4 필요)
    2003: 0.89, 2004: 1.75, 2005: 2.24, 2006: 2.64, 2007: 2.93,
    # FY2008-2010: EDGAR XBRL (÷4 필요)
    2008: 3.74, 2009: 3.03, 2010: 3.86,
    # FY2011-2013: EDGAR XBRL (÷2 필요)
    2011: 2.20, 2012: 2.35, 2013: 2.70,
    # FY2014+: EDGAR XBRL (조정 불필요)
    2014: 1.49, 2015: 1.85, 2016: 2.16, 2017: 2.51, 2018: 1.17,
    2019: 2.49, 2020: 1.60, 2021: 3.56, 2022: 3.75, 2023: 3.23,
    2024: 3.73, 2025: 2.16, 2026: 2.10,
}
# 일회성 항목으로 EPS 왜곡이 심한 연도
_NKE_ONE_TIME = {
    1984: "이익 첫 감소(-29%: 경쟁 심화, 추정값)",
    1985: "이익 급감(-75%: 리복 패권기, 일부 분기 적자, 추정값)",
    1986: "이익 급회복(+474%: Air Jordan 효과, 추정값)",
    1987: "이익 급감(-39%: 리복에 시장점유율 잠식)",
    1998: "아시아 금융위기(-50% EPS)",
    2003: "사업부 손상차손(Bauer Hockey 등, -28% EPS)",
    2018: "세금개혁(TCJA, -53% EPS)",
    2020: "COVID-19",
}

def _nke_split_adj(fy, raw):
    if fy <= 2002: return raw / 8   # post-1996 splits → 2007+2012+2015 추가 적용
    if fy <= 2010: return raw / 4   # post-2007 split  → 2012+2015 추가 적용
    if fy <= 2013: return raw / 2   # post-2012 split  → 2015 추가 적용
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
        # 매수 PER: EPS 데이터 있는 연도만 추가
        if eps_dict and buy_yr in eps_dict and eps_dict[buy_yr]:
            eps = eps_dict[buy_yr]
            if eps > 0:
                row["peBuy"] = round(float(r["buy_price"]) / eps, 1)
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

print("[현재 지표 조회] NKE, RMS.PA, KO, AAPL, COST, GOOGL, META, NVDA, AMZN, MSFT, WMT, BRK-B, LLY, AVGO, TSLA, JNJ, JPM, V ...")
nke_metrics   = get_metrics("NKE")
rms_metrics   = get_metrics("RMS.PA")
ko_metrics    = get_metrics("KO")
aapl_metrics  = get_metrics("AAPL")
cost_metrics  = get_metrics("COST")
googl_metrics = get_metrics("GOOGL")
meta_metrics  = get_metrics("META")
nvda_metrics  = get_metrics("NVDA")
amzn_metrics  = get_metrics("AMZN")
msft_metrics  = get_metrics("MSFT")
wmt_metrics   = get_metrics("WMT")
brkb_metrics  = get_metrics("BRK-B")
lly_metrics   = get_metrics("LLY")
avgo_metrics  = get_metrics("AVGO")
tsla_metrics  = get_metrics("TSLA")
jnj_metrics   = get_metrics("JNJ")
jpm_metrics   = get_metrics("JPM")
v_metrics     = get_metrics("V")
print(f"  NKE:    {nke_metrics}")
print(f"  RMS.PA: {rms_metrics}")
print(f"  KO:     {ko_metrics}")
print(f"  AAPL:   {aapl_metrics}")
print(f"  COST:   {cost_metrics}")
print(f"  GOOGL:  {googl_metrics}")
print(f"  META:   {meta_metrics}")
print(f"  NVDA:   {nvda_metrics}")
print(f"  AMZN:   {amzn_metrics}")
print(f"  MSFT:   {msft_metrics}")
print(f"  WMT:    {wmt_metrics}")
print(f"  BRK-B:  {brkb_metrics}")
print(f"  LLY:    {lly_metrics}")
print(f"  AVGO:   {avgo_metrics}")
print(f"  TSLA:   {tsla_metrics}")
print(f"  JNJ:    {jnj_metrics}")
print(f"  JPM:    {jpm_metrics}")
print(f"  V:      {v_metrics}")

nke_out = {
    "ticker":    "NKE",
    "name":      "나이키",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1980~1982 매수 구간: TradingView adj-on 주가로 보정 완료 (+약 3pp). 단 macrotrends 기준값 대비 여전히 약 5~6pp 차이 존재 (분할 이력 완전 일치 불가)",
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
    "rows10y": df_to_rows(df10a, NKE_EPS),
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

# ── RMS.PA EPS 데이터 ─────────────────────────────────────────
# 출처: 사용자 제공 USD EPS → 연도별 평균 USD/EUR 환율로 EUR 환산
# 에르메스는 파리증권거래소 상장 (RMS.PA), EUR 기준 재무제표
# 주요 참고: 2020 COVID 영향(-0.6%), 2021 펜트업 수요 급등(+62.1%), 2014 소폭 역성장(-4.4%)
_RMS_EUR_EPS = {
    # 1993~2000: AI 역산 추정치 (1:9 분할 완전 반영 기준, EUR)
    # 분할 이력: 1997-06-06 1:3, 2006-06-12 1:3 (누적 1:9)
    1993: 0.44,  1994: 0.50,  1995: 0.51,  1996: 0.58,
    1997: 0.70,  1998: 0.81,  1999: 0.95,  2000: 1.20,
    2001: 1.81,  2002: 2.30,  2003: 1.88,  2004: 1.95,  2005: 2.16,
    2006: 2.77,  2007: 2.70,  2008: 2.64,  2009: 2.71,  2010: 4.02,
    2011: 5.13,  2012: 6.88,  2013: 7.07,  2014: 6.76,  2015: 9.18,
    2016: 11.38, 2017: 12.40, 2018: 13.06, 2019: 14.66, 2020: 14.29,
    2021: 22.37, 2022: 32.80, 2023: 42.12, 2024: 43.00, 2025: 46.50,
}
_RMS_ONE_TIME = {
    2020: "COVID-19 팬데믹(EPS -0.6%, PER 급등)",
    2021: "코로나 펜트업 수요(EPS +62.1%, 일회성)",
}

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
    "rows10y": df_to_rows(df_rms, _RMS_EUR_EPS),
    "loss5y": [],
    "epsDecomp": compute_eps_decomp(df_rms, _RMS_EUR_EPS, _RMS_ONE_TIME),
    "epsNote": "EUR EPS: 1993~2000년은 AI 역산 추정치 (1:9 분할 완전 반영 기준), 2001~2025년은 사용자 제공 데이터. 분할 이력: 1997-06-06 1:3, 2006-06-12 1:3 (누적 1:9). PER은 Yahoo Finance EUR 종가(배당조정) 기준.",
}

out_path2 = DST / "RMS_rolling.json"
out_path2.write_text(json.dumps(rms_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path2}")

# ── AAPL EPS 데이터 (SEC EDGAR XBRL) ─────────────────────────
# Apple 회계연도(FY) = 10월~9월. 달력 연도 Y → FY(Y) EPS (9월 말 종료) 사용.
#
# Apple 주식 분할 이력:
#   2000-06-21: 2:1  /  2005-02-28: 2:1  /  2014-06-09: 7:1  /  2020-08-31: 4:1
#   → 2014년 이후 기준으로 누적 조정 배수: 2014 이전 ÷28, 2014~2020 ÷4, 2020 이후 무조정
#
# EDGAR 데이터 분할 반영 현황 (end 날짜 기준으로 FY 결정):
#   FY2007~2011: FY2009~2013 10-K 비교 데이터 → 어떤 분할도 미적용 → ÷28 필요
#   FY2012~2017: FY2014~2019 10-K 데이터 → 2014 7:1 반영, 2020 4:1 미반영 → ÷4 필요
#   FY2018~2019: FY2020 10-K 데이터 → 2020 4:1까지 반영 → 추가 조정 없음
#   FY2020+    : 모든 분할 반영 → 추가 조정 없음
#
# 참고: FY2001~2002 닷컴 버블 후폭풍으로 EPS 마이너스 (EPS 분해 해당 구간 제외됨)
_AAPL_EDGAR_RAW = {
    2007: 3.93,   # ÷28 필요 (pre 7:1, pre 4:1)
    2008: 6.78,
    2009: 9.08,
    2010: 15.15,
    2011: 27.68,
    2012: 6.31,   # ÷4 필요 (post 7:1, pre 4:1)
    2013: 5.68,
    2014: 6.45,
    2015: 9.22,
    2016: 8.31,
    2017: 9.21,
    2018: 2.98,   # 추가 조정 없음 (FY2020 10-K, post 4:1)
    2019: 2.97,
    2020: 3.28,
    2021: 5.61,
    2022: 6.11,
    2023: 6.13,
    2024: 6.08,
    2025: 7.46,
}
_AAPL_ONE_TIME = {}  # 주요 일회성 왜곡 없음

def _aapl_split_adj(fy, raw):
    if fy <= 2011: return raw / 28   # pre 7:1, pre 4:1
    if fy <= 2017: return raw / 4    # post 7:1, pre 4:1
    return raw

AAPL_EPS = {yr: round(_aapl_split_adj(yr, v), 4) for yr, v in _AAPL_EDGAR_RAW.items()}

# ── AAPL ──────────────────────────────────────────────────────
print("[AAPL] 데이터 로드...")
az_aapl = RollingAnalyzer("AAPL", benchmark="^SP500TR")
df10a_aapl = pd.read_csv(SRC / "AAPL_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_aapl  = pd.read_csv(SRC / "AAPL_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_aapl = az_aapl.full_period()
st_aapl = summary_stats(df10a_aapl, label="AAPL")

loss5_aapl = df5a_aapl[df5a_aapl["is_complete"] & (df5a_aapl["cagr"] < 0)]

aapl_out = {
    "ticker":    "AAPL",
    "name":      "애플",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "",
    "current":   aapl_metrics,
    "fullPeriod": fp_aapl,
    "stats": {
        "n":        st_aapl["n_complete"],
        "min":      st_aapl["min_cagr"],
        "minBuy":   st_aapl["min_buy"],
        "median":   st_aapl["median_cagr"],
        "mean":     st_aapl["mean_cagr"],
        "max":      st_aapl["max_cagr"],
        "maxBuy":   st_aapl["max_buy"],
        "over10":   st_aapl["pct_over_10"],
        "over15":   st_aapl["pct_over_15"],
        "over20":   st_aapl["pct_over_20"],
        "losses":   st_aapl["n_losses"],
        "beatBench":  st_aapl.get("n_beat_bench"),
        "beatTotal":  st_aapl.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_aapl, AAPL_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_aapl.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_aapl, AAPL_EPS, _AAPL_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL (FY2007~2025). 분할조정: FY2007~2011÷28(7:1·4:1 누적), FY2012~2017÷4(4:1). PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path3 = DST / "AAPL_rolling.json"
out_path3.write_text(json.dumps(aapl_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path3}")

# ── COST EPS 데이터 ───────────────────────────────────────────
# COST 회계연도: 8월 말(마지막 일요일) 종료 → 달력 연도 Y = FY_Y
# 출처: SEC EDGAR XBRL (FY2009~FY2026, USD/shares, 10-K 기준)
# 분할 이력: 없음 (1993년 Price Club 합병 이후 주식 분할 없음)
# 주의: 특별 배당($7/주 2012, $10/주 2020, $15/주 2023) → Yahoo Finance
#       배당조정 주가 기준이므로 PER 절대값이 실제보다 소폭 낮게 표시될 수 있음
_COST_EPS = {
    2009: 2.47,
    2010: 2.92,
    2011: 3.30,
    2012: 3.89,
    2013: 4.63,
    2014: 4.65,
    2015: 5.37,
    2016: 5.33,
    2017: 6.08,
    2018: 7.09,
    2019: 8.26,
    2020: 9.02,
    2021: 11.27,
    2022: 13.14,
    2023: 14.16,
    2024: 16.56,
    2025: 18.21,
    2026: 20.76,
}
_COST_ONE_TIME = {
    2020: "COVID-19 영향 + 특별 배당 $10/주",
}

# ── COST ──────────────────────────────────────────────────────
print("[COST] 데이터 로드...")
az_cost = RollingAnalyzer("COST", benchmark="^SP500TR")
df10a_cost = pd.read_csv(SRC / "COST_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_cost  = pd.read_csv(SRC / "COST_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_cost = az_cost.full_period()
st_cost = summary_stats(df10a_cost, label="COST")

loss5_cost = df5a_cost[df5a_cost["is_complete"] & (df5a_cost["cagr"] < 0)]

cost_out = {
    "ticker":    "COST",
    "name":      "코스트코",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1986~1992 구간은 Price Club(합병 전) 데이터 포함. 특별 배당($7/2012, $10/2020, $15/2023) 반영 총수익률 기준.",
    "current":   cost_metrics,
    "fullPeriod": fp_cost,
    "stats": {
        "n":       st_cost["n_complete"],
        "min":     st_cost["min_cagr"],
        "minBuy":  st_cost["min_buy"],
        "median":  st_cost["median_cagr"],
        "mean":    st_cost["mean_cagr"],
        "max":     st_cost["max_cagr"],
        "maxBuy":  st_cost["max_buy"],
        "over10":  st_cost["pct_over_10"],
        "over15":  st_cost["pct_over_15"],
        "over20":  st_cost["pct_over_20"],
        "losses":  st_cost["n_losses"],
        "beatBench":  st_cost.get("n_beat_bench"),
        "beatTotal":  st_cost.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_cost, _COST_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_cost.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_cost, _COST_EPS, _COST_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL (FY2009~FY2026, USD/shares). 코스트코 회계연도는 8월 말 종료. 분할 이력 없음. Yahoo Finance 배당조정 주가 기준 PER → 특별 배당 반영으로 PER 절대값이 실제보다 소폭 낮을 수 있음.",
}

out_path4 = DST / "COST_rolling.json"
out_path4.write_text(json.dumps(cost_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path4}")

# ── KO EPS 데이터 ─────────────────────────────────────────────
# 코카콜라 회계연도 = 달력연도 (1월~12월)
# 분할 이력: 1965·1968·1977·1986(3:1)·1990·1992·1996·2012 (마지막: 2012-08-13 2:1)
# 누적 조정배수(1977년 이후): 2×3×2×2×2×2 = 96:1
#
# ★ 모든 EPS는 2012-08-13 분할 이후 기준(현재 주식수 기준)으로 통일
#   1988~2009: 원천 데이터가 pre-2012-split → ÷2 적용
#   2010~    : EDGAR XBRL post-2012-split → 조정 없음
#
# 출처별:
#   1988~1997: FY2002 Annual Report Exhibit 13 실측 diluted EPS ÷2
#   1998~2002: FY2002 Annual Report Exhibit 13 실측 diluted EPS ÷2
#   2003:      FY2004 10-K 실측 diluted EPS ($1.77) ÷2
#   2004~2006: FY2008 10-K 실측 diluted EPS ÷2
#   2007~2009: SEC EDGAR XBRL (pre-2012-split 신고분) ÷2
#   2010~2025: SEC EDGAR XBRL (post-2012-split 신고분, 그대로 사용)
#
# 주요 EPS 왜곡 연도:
#   1999: 구조조정 비용 및 자산상각 → EPS 급락
#   2000: 병입업체(bottler) 구조조정 비용
#   2010: CCE 북미 인수 관련 지분 재평가 이익 포함 (EPS 일시 급증)
#   2017: 세금개혁(TCJA) 일회성 세금 비용 → EPS 0.29 (정상 기준 ~0.75 수준)
#   2020: COVID-19 팬데믹
KO_EPS = {
    # 1988~2009: pre-2012-split 원천 ÷2 후 값 (현재 주식수 기준)
    # 1988~1997: FY2002 Annual Report 실측 ÷2
    1988: 0.18, 1989: 0.21, 1990: 0.26, 1991: 0.31, 1992: 0.36,
    1993: 0.42, 1994: 0.49, 1995: 0.59, 1996: 0.69, 1997: 0.82,
    # 1998~2002: FY2002 Annual Report 실측 ÷2
    1998: 0.71, 1999: 0.49, 2000: 0.44, 2001: 0.80, 2002: 0.62,
    # 2003: FY2004 10-K 실측 $1.77 ÷2 (기존 $1.95는 오류)
    2003: 0.89,
    # 2004~2006: FY2008 10-K 실측 ÷2
    2004: 1.00, 2005: 1.02, 2006: 1.08,
    # 2007~2009: EDGAR XBRL pre-2012-split (신고일 2010~2012-02) ÷2
    2007: 1.29, 2008: 1.25, 2009: 1.47,
    # 2010~2025: EDGAR XBRL post-2012-split (현재 기준, 조정 없음)
    2010: 2.53, 2011: 1.85, 2012: 1.97, 2013: 1.90, 2014: 1.60, 2015: 1.67, 2016: 1.49,
    2017: 0.29, 2018: 1.50, 2019: 2.07, 2020: 1.79, 2021: 2.25,
    2022: 2.19, 2023: 2.47, 2024: 2.46, 2025: 3.04,
}
_KO_ONE_TIME = {
    1999: "구조조정 비용 및 자산상각(EPS 급락)",
    2000: "병입업체 구조조정 비용",
    2010: "CCE 북미 인수 관련 지분 재평가 이익(EPS 일시 급증)",
    2017: "세금개혁(TCJA) 일회성 세금 비용(EPS 0.29, 정상 기준 ~0.75 수준)",
    2020: "COVID-19",
}

# ── KO ───────────────────────────────────────────────────────
print("[KO] 데이터 로드...")
az_ko = RollingAnalyzer("KO", benchmark="^SP500TR")
df10a_ko = pd.read_csv(SRC / "KO_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_ko  = pd.read_csv(SRC / "KO_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_ko = az_ko.full_period()
st_ko = summary_stats(df10a_ko, label="KO")

loss5_ko = df5a_ko[df5a_ko["is_complete"] & (df5a_ko["cagr"] < 0)]

ko_out = {
    "ticker":    "KO",
    "name":      "코카콜라",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "",
    "current":   ko_metrics,
    "fullPeriod": fp_ko,
    "stats": {
        "n":        st_ko["n_complete"],
        "min":      st_ko["min_cagr"],
        "minBuy":   st_ko["min_buy"],
        "median":   st_ko["median_cagr"],
        "mean":     st_ko["mean_cagr"],
        "max":      st_ko["max_cagr"],
        "maxBuy":   st_ko["max_buy"],
        "over10":   st_ko["pct_over_10"],
        "over15":   st_ko["pct_over_15"],
        "over20":   st_ko["pct_over_20"],
        "losses":   st_ko["n_losses"],
        "beatBench":  st_ko.get("n_beat_bench"),
        "beatTotal":  st_ko.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_ko, KO_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_ko.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_ko, KO_EPS, _KO_ONE_TIME),
    "epsNote": "EPS 출처: 1988~2009년은 FY2002·FY2008 Annual Report 실측값 및 SEC EDGAR XBRL을 2012-08-13 2:1 분할로 ÷2 조정. 2010년 이후는 EDGAR XBRL 그대로 사용. 분할 이력: 1965·1968·1977(2:1)·1986(3:1)·1990·1992·1996·2012(2:1), 누적 96:1. PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path5 = DST / "KO_rolling.json"
out_path5.write_text(json.dumps(ko_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path5}")

# ── GOOGL EPS 데이터 ──────────────────────────────────────────
# 구글(Google Inc.) 상장: 2004년 8월 19일 (NASDAQ)
# 2014년 4월: Class A+B → Class A+B+C 2:1 주식 분할 (= 주식 수 2배, EPS 1/2)
# 2022년 7월: 20:1 주식 분할 (= 주식 수 20배, EPS 1/20)
# 현재 기준 총 조정배수:
#   2004~2011 (pre-2014 split): ÷40 (2014 2:1 × 2022 20:1)
#   2012~2019 (post-2014, pre-2022): ÷20 (2022 20:1만)
#   2020~     (post-2022 split): 조정 없음
#
# 출처:
#   2004~2007: Google Inc. FY2007 10-K (diluted, pre-all-splits) ÷40
#   2008~2011: SEC EDGAR XBRL CIK 0001288776 (pre-all-splits) ÷40
#   2012:      Google FY2014 10-K (post-2014 split) ÷20
#   2013~2014: Alphabet FY2015 10-K (post-2014 split) ÷20
#   2015:      Alphabet FY2016 10-K XBRL (post-2014 split) ÷20
#   2016~2019: Alphabet EDGAR XBRL CIK 0001652044 (post-2014, pre-2022) ÷20
#   2020~2025: Alphabet EDGAR XBRL (post-2022 split)
#
# 주요 EPS 왜곡 연도:
#   2017: TCJA 세금개혁 일회성 전환세 부과 (-35% EPS)
#   2022: 디지털 광고 시장 침체 + 대규모 비용 증가 (-19% EPS)
_GOOGL_RAW_PRE2012 = {
    # FY2004~2007: Google Inc. FY2007 10-K diluted EPS (pre-2014, pre-2022) → ÷40
    2004: 1.46, 2005: 5.02, 2006: 9.94, 2007: 13.29,
    # FY2008~2011: EDGAR XBRL (pre-2014, pre-2022) → ÷40
    2008: 13.31, 2009: 20.41, 2010: 26.31, 2011: 29.76,
}
_GOOGL_RAW_2012_2019 = {
    # FY2012: Google FY2014 10-K (post-2014 split) → ÷20
    2012: 16.16,
    # FY2013~2014: Alphabet FY2015 10-K (post-2014 split) → ÷20
    2013: 18.79, 2014: 20.57,
    # FY2015: Alphabet FY2016 10-K XBRL (post-2014 split) → ÷20
    2015: 22.84,
    # FY2016~2019: Alphabet EDGAR XBRL (post-2014, pre-2022) → ÷20
    2016: 27.85, 2017: 18.00, 2018: 43.70, 2019: 49.16,
}
GOOGL_EPS = {}
for yr, raw in _GOOGL_RAW_PRE2012.items():
    GOOGL_EPS[yr] = round(raw / 40, 4)
for yr, raw in _GOOGL_RAW_2012_2019.items():
    GOOGL_EPS[yr] = round(raw / 20, 4)
# FY2020~2025: post-2022 split (조정 없음)
GOOGL_EPS.update({
    2020: 2.9300, 2021: 5.6100, 2022: 4.5600,
    2023: 5.8000, 2024: 8.0400, 2025: 10.8100,
})

_GOOGL_ONE_TIME = {
    2017: "TCJA 세금개혁 일회성 전환세(-35% EPS)",
    2022: "디지털 광고 침체 + 비용 급증(-19% EPS)",
}

# ── GOOGL ─────────────────────────────────────────────────────
print("[GOOGL] 데이터 로드...")
az_googl = RollingAnalyzer("GOOGL", benchmark="^SP500TR")
df10a_googl = pd.read_csv(SRC / "GOOGL_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_googl  = pd.read_csv(SRC / "GOOGL_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_googl = az_googl.full_period()
st_googl = summary_stats(df10a_googl, label="GOOGL")

loss5_googl = df5a_googl[df5a_googl["is_complete"] & (df5a_googl["cagr"] < 0)]

googl_out = {
    "ticker":    "GOOGL",
    "name":      "구글(알파벳)",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "2004년 8월 상장. 분할 이력: 2014-04 2:1(Class C 분리), 2022-07 20:1. EPS는 현재 분할 기준으로 소급 조정.",
    "current":   googl_metrics,
    "fullPeriod": fp_googl,
    "stats": {
        "n":        st_googl["n_complete"],
        "min":      st_googl["min_cagr"],
        "minBuy":   st_googl["min_buy"],
        "median":   st_googl["median_cagr"],
        "mean":     st_googl["mean_cagr"],
        "max":      st_googl["max_cagr"],
        "maxBuy":   st_googl["max_buy"],
        "over10":   st_googl["pct_over_10"],
        "over15":   st_googl["pct_over_15"],
        "over20":   st_googl["pct_over_20"],
        "losses":   st_googl["n_losses"],
        "beatBench":  st_googl.get("n_beat_bench"),
        "beatTotal":  st_googl.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_googl, GOOGL_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_googl.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_googl, GOOGL_EPS, _GOOGL_ONE_TIME),
    "epsNote": "EPS 출처: 2004~2007 Google FY2007 10-K, 2008~2011 SEC EDGAR XBRL(Google Inc.), 2012~2019 Alphabet EDGAR XBRL. 분할 조정: 2004~2011÷40, 2012~2019÷20, 2020~ 조정 없음. PER은 Yahoo Finance 종가(배당없음) 기준.",
}

out_path6 = DST / "GOOGL_rolling.json"
out_path6.write_text(json.dumps(googl_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path6}")

# ── META EPS 데이터 ───────────────────────────────────────────
# 메타 플랫폼스(Facebook → Meta) 회계연도 = 달력연도 (1월~12월)
# 상장: 2012년 5월 18일 (NASDAQ)
# 주식 분할 이력: 없음 → 조정 불필요
#
# 출처: SEC EDGAR XBRL CIK 0001326801 (us-gaap/EarningsPerShareDiluted, 10-K 기준)
#
# 주요 EPS 왜곡 연도:
#   2012: IPO 관련 주식보상 비용(RSU 비용 일시 인식) → EPS $0.01 (비정상적 저점)
#   2019: FTC 합의금 $5B 일회성 비용 → EPS -$3.14 감소 효과
#   2022: Reality Labs 대규모 적자($13.7B) + 디지털 광고 침체 → EPS 급락
_META_EPS = {
    2012: 0.0100,
    2013: 0.6000,
    2014: 1.1000,
    2015: 1.2900,
    2016: 3.4900,
    2017: 5.3900,
    2018: 7.5700,
    2019: 6.4300,
    2020: 10.0900,
    2021: 13.7700,
    2022: 8.5900,
    2023: 14.8700,
    2024: 23.8600,
    2025: 23.4900,
}
_META_ONE_TIME = {
    2012: "IPO 관련 RSU 비용 일시 인식(EPS $0.01, 비정상적 저점)",
    2019: "FTC 합의금 $5B 일회성 비용",
    2022: "Reality Labs 적자 $13.7B + 디지털 광고 시장 침체",
}

# ── META ──────────────────────────────────────────────────────
print("[META] 데이터 로드...")
az_meta = RollingAnalyzer("META", benchmark="^SP500TR")
df10a_meta = pd.read_csv(SRC / "META_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_meta  = pd.read_csv(SRC / "META_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_meta = az_meta.full_period()
st_meta = summary_stats(df10a_meta, label="META")

loss5_meta = df5a_meta[df5a_meta["is_complete"] & (df5a_meta["cagr"] < 0)]

meta_out = {
    "ticker":    "META",
    "name":      "메타 플랫폼스",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "2012년 5월 상장. 완결 구간 4개(2012~2015년 말 매수)로 아직 역사 짧음. 주식 분할 없음.",
    "current":   meta_metrics,
    "fullPeriod": fp_meta,
    "stats": {
        "n":        st_meta["n_complete"],
        "min":      st_meta["min_cagr"],
        "minBuy":   st_meta["min_buy"],
        "median":   st_meta["median_cagr"],
        "mean":     st_meta["mean_cagr"],
        "max":      st_meta["max_cagr"],
        "maxBuy":   st_meta["max_buy"],
        "over10":   st_meta["pct_over_10"],
        "over15":   st_meta["pct_over_15"],
        "over20":   st_meta["pct_over_20"],
        "losses":   st_meta["n_losses"],
        "beatBench":  st_meta.get("n_beat_bench"),
        "beatTotal":  st_meta.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_meta, _META_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_meta.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_meta, _META_EPS, _META_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK 0001326801 (달력연도 10-K, 2012~2025). 주식 분할 없어 조정 불필요. PER은 Yahoo Finance 주가(배당 없음) 기준.",
}

out_path7 = DST / "META_rolling.json"
out_path7.write_text(json.dumps(meta_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path7}")

# ── AMZN EPS 데이터 ───────────────────────────────────────────
# 아마존 회계연도 = 달력연도 (1월~12월)
# 상장: 1997년 5월 15일 (NASDAQ)
#
# 아마존 주식 분할 이력:
#   1998-06-02: 2:1  /  1999-01-05: 3:1  /  1999-09-02: 2:1  /  2022-06-06: 20:1
#
# EDGAR 데이터 분할 반영 현황 (filed 날짜 기준):
#   FY2007~FY2019: 2022년 6월 이전 제출 → 20:1 미반영 → ÷20 필요
#   FY2020~FY2025: 2022년 6월 이후 제출 → 이미 20:1 소급 반영
#
# 출처: SEC EDGAR XBRL CIK 0001018724 (us-gaap/EarningsPerShareDiluted, 10-K)
#       end 날짜 기준 연도별 최신 filed 값 사용
#
# 주요 EPS 왜곡 연도:
#   2012: EPS 소폭 음수 (아마존 적극적 투자 사이클)
#   2014: EPS 음수 (파이어폰 실패 + 인프라 투자 급증)
#   2022: Rivian Automotive 투자 평가손실 ~$12.7B → EPS -$0.270
_AMZN_EDGAR_RAW = {
    # FY2007~2019: EDGAR XBRL (÷20 필요)
    2007:  1.120,
    2008:  1.490,
    2009:  2.040,
    2010:  2.530,
    2011:  1.370,
    2012: -0.090,  # 소폭 음수 (투자 사이클)
    2013:  0.590,
    2014: -0.520,  # 음수 (파이어폰 + 인프라 투자)
    2015:  1.250,
    2016:  4.900,
    2017:  6.150,
    2018: 20.140,
    2019: 23.010,
}
_AMZN_POST2022_EPS = {
    # FY2020~2025: 2022-06 분할 이후 10-K에서 소급 반영된 값
    2020:  2.090,
    2021:  3.240,
    2022: -0.270,  # Rivian 평가손실 (~$12.7B)
    2023:  2.900,
    2024:  5.530,
    2025:  7.170,
}

AMZN_EPS = {}
for yr, raw in _AMZN_EDGAR_RAW.items():
    AMZN_EPS[yr] = round(raw / 20, 4)
AMZN_EPS.update(_AMZN_POST2022_EPS)

_AMZN_ONE_TIME = {
    2012: "선제 투자 사이클 — EPS 소폭 음수",
    2014: "파이어폰 실패 + AWS·물류 인프라 대규모 투자 — EPS 음수",
    2022: "Rivian Automotive 투자 평가손실 ~$12.7B — EPS -0.27(영업이익은 흑자)",
}

# ── AMZN ──────────────────────────────────────────────────────
print("[AMZN] 데이터 로드...")
az_amzn = RollingAnalyzer("AMZN", benchmark="^SP500TR")
df10a_amzn = pd.read_csv(SRC / "AMZN_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_amzn  = pd.read_csv(SRC / "AMZN_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_amzn = az_amzn.full_period()
st_amzn = summary_stats(df10a_amzn, label="AMZN")

loss5_amzn = df5a_amzn[df5a_amzn["is_complete"] & (df5a_amzn["cagr"] < 0)]

amzn_out = {
    "ticker":    "AMZN",
    "name":      "아마존",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1997년 5월 상장. 분할 이력: 1998 2:1, 1999-01 3:1, 1999-09 2:1, 2022-06 20:1. 초기(2007~2014) EPS가 극히 낮거나 음수여서 해당 구간 EPS 분해 일부 생략.",
    "current":   amzn_metrics,
    "fullPeriod": fp_amzn,
    "stats": {
        "n":        st_amzn["n_complete"],
        "min":      st_amzn["min_cagr"],
        "minBuy":   st_amzn["min_buy"],
        "median":   st_amzn["median_cagr"],
        "mean":     st_amzn["mean_cagr"],
        "max":      st_amzn["max_cagr"],
        "maxBuy":   st_amzn["max_buy"],
        "over10":   st_amzn["pct_over_10"],
        "over15":   st_amzn["pct_over_15"],
        "over20":   st_amzn["pct_over_20"],
        "losses":   st_amzn["n_losses"],
        "beatBench":  st_amzn.get("n_beat_bench"),
        "beatTotal":  st_amzn.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_amzn, AMZN_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_amzn.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_amzn, AMZN_EPS, _AMZN_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK 0001018724 (달력연도 10-K). 분할 조정: FY2007~2019÷20(2022-06 20:1 미반영), FY2020~2025는 2022년 이후 제출 10-K 소급값. EPS 음수 연도(2012, 2014, 2022) 해당 구간 EPS·PER 분해 제외. PER은 Yahoo Finance 주가(배당 없음) 기준.",
}

out_path8 = DST / "AMZN_rolling.json"
out_path8.write_text(json.dumps(amzn_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path8}")

# ── NVDA EPS 데이터 ───────────────────────────────────────────
# 엔비디아 회계연도(FY) = 2월~1월 말 종료. 달력 연도 Y → FY(Y) EPS (Y년 1월 말 종료) 사용.
#
# 분할 이력: 2000-06-27(2:1), 2001-09-10(2:1), 2006-04-07(2:1),
#            2007-09-11(1.5:1), 2021-07-20(4:1), 2024-06-10(10:1) → 누적 480:1
#
# EDGAR 데이터 분할 반영 현황 (filed 날짜 기준):
#   FY2008~FY2019: filed ≤ 2021-02-26 → 2021·2024 분할 미반영 → ÷40 필요
#   FY2020~FY2022: filed 2022-03 ~ 2024-02 → 2021 반영, 2024 미반영 → ÷10 필요
#   FY2023~FY2026: filed ≥ 2025-02 → 2024 분할까지 반영 → 조정 없음
#
# 주요 EPS 왜곡 연도 (달력 연도 기준):
#   달력 2009: FY2009 금융위기 EPS 음수
#   달력 2010: FY2010 음수
#   달력 2019: FY2020 게임 수요 감소 + AI 전환기 이익 급락(전년 대비 -32%)
#   달력 2022: FY2023 중국 수출규제 + PC 시장 침체(전년 대비 -96%)
_NVDA_EDGAR_RAW = {
    # FY2008~FY2019: filed ≤ 2021-02-26 → ÷40 필요
    2008: 1.31,  2009: -0.05, 2010: -0.12, 2011: 0.43,
    2012: 0.94,  2013: 0.90,  2014: 0.74,  2015: 1.12,
    2016: 1.08,  2017: 2.57,  2018: 4.82,  2019: 6.63,
    # FY2020~FY2022: filed 2022-03 ~ 2024-02 → ÷10 필요
    2020: 1.13,  2021: 1.73,  2022: 3.85,
    # FY2023~FY2026: filed ≥ 2025-02 → 조정 없음
    2023: 0.17,  2024: 1.19,  2025: 2.94,  2026: 4.90,
}
_NVDA_ONE_TIME = {
    2009: "금융위기(FY2009 EPS 음수)",
    2010: "수요 감소 + 전략 재편(FY2010 EPS 음수)",
    2019: "게임 수요 급락 + AI 전환기(FY2020 EPS 전년 대비 -32%)",
    2022: "중국 수출규제 + PC 시장 침체(FY2023 EPS 전년 대비 -96%)",
}

def _nvda_split_adj(fy, raw):
    if fy <= 2019: return raw / 40   # pre-2021 split
    if fy <= 2022: return raw / 10   # post-2021, pre-2024 split
    return raw                        # post-2024 split

NVDA_EPS = {yr: round(_nvda_split_adj(yr, v), 4) for yr, v in _NVDA_EDGAR_RAW.items()}

# ── NVDA ──────────────────────────────────────────────────────
print("[NVDA] 데이터 로드...")
az_nvda = RollingAnalyzer("NVDA", benchmark="^SP500TR")
df10a_nvda = pd.read_csv(SRC / "NVDA_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_nvda  = pd.read_csv(SRC / "NVDA_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_nvda = az_nvda.full_period()
st_nvda = summary_stats(df10a_nvda, label="NVDA")

loss5_nvda = df5a_nvda[df5a_nvda["is_complete"] & (df5a_nvda["cagr"] < 0)]

nvda_out = {
    "ticker":    "NVDA",
    "name":      "엔비디아",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1999년 1월 상장. 분할 이력: 2000·2001·2006(2:1×3), 2007(1.5:1), 2021(4:1), 2024(10:1) → 누적 480:1. FY2009·FY2010 EPS 음수 구간은 EPS 분해 제외.",
    "current":   nvda_metrics,
    "fullPeriod": fp_nvda,
    "stats": {
        "n":        st_nvda["n_complete"],
        "min":      st_nvda["min_cagr"],
        "minBuy":   st_nvda["min_buy"],
        "median":   st_nvda["median_cagr"],
        "mean":     st_nvda["mean_cagr"],
        "max":      st_nvda["max_cagr"],
        "maxBuy":   st_nvda["max_buy"],
        "over10":   st_nvda["pct_over_10"],
        "over15":   st_nvda["pct_over_15"],
        "over20":   st_nvda["pct_over_20"],
        "losses":   st_nvda["n_losses"],
        "beatBench":  st_nvda.get("n_beat_bench"),
        "beatTotal":  st_nvda.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_nvda, NVDA_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_nvda.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_nvda, NVDA_EPS, _NVDA_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK 0001045810 (FY2008~FY2026). NVDA 회계연도(FY)는 1월 말 종료, 달력 연도 Y말 매수 시 FY(Y) EPS 기준. 분할 조정: FY2008~FY2019÷40, FY2020~FY2022÷10. PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path9 = DST / "NVDA_rolling.json"
out_path9.write_text(json.dumps(nvda_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path9}")

# ── MSFT EPS 데이터 ───────────────────────────────────────────
# 마이크로소프트 회계연도(FY) = 7월~6월 말 종료. 달력 연도 Y → FY(Y) EPS (6월 30일 종료) 사용.
#
# 분할 이력:
#   1987-09-21(2:1), 1990-04-16(2:1), 1991-06-27(2:1), 1992-06-15(3:2),
#   1994-05-23(2:1), 1996-12-09(2:1), 1998-02-23(2:1), 1999-03-29(2:1),
#   2003-02-18(2:1) → 누적 384:1
#   마지막 분할 2003-02-18 이후 추가 분할 없음.
#   FY2003 10-K(2003년 10월 제출) 이후 모든 10-K는 2003년 분할까지 소급 반영됨.
#
# 출처별:
#   FY2008~FY2026: SEC EDGAR XBRL CIK 0000789019 (6월 말 연도 기준) → 조정 불필요
#   FY1993~FY2007: AI 역산 추정치 (모든 분할 완전 반영 기준, macrotrends 참고)
#
# 주요 EPS 왜곡 연도 (달력 연도 = FY 종료 연도 기준):
#   2002: 기술주 버블 붕괴 + 투자 손실·구조조정 비용 (EPS 전년 대비 급감)
#   2012: aQuantive 인수 관련 굿윌 손상차손 $6.2B (EPS -$0.75)
#   2015: Nokia 인수 관련 대규모 손상차손 ~$7.6B (EPS -$0.95 수준 영향)
#   2018: TCJA 세금개혁 일회성 전환세 부담 $13.8B (EPS -$1.82 영향)
MSFT_EPS = {
    # FY1993~FY2007: AI 역산 추정치 (macrotrends 참고, 현재 분할 기준)
    1993: 0.06,  1994: 0.08,  1995: 0.12,  1996: 0.18,
    1997: 0.25,  1998: 0.32,  1999: 0.37,
    2000: 0.53,  2001: 0.44,  2002: 0.38,
    2003: 0.51,  2004: 0.75,
    2005: 1.12,  2006: 1.20,  2007: 1.42,
    # FY2008~FY2026: SEC EDGAR XBRL (조정 불필요)
    2008: 1.87,  2009: 1.62,  2010: 2.10,
    2011: 2.69,  2012: 2.00,  2013: 2.58,
    2014: 2.63,  2015: 1.48,  2016: 2.56,
    2017: 3.25,  2018: 2.13,  2019: 5.06,
    2020: 5.76,  2021: 8.05,  2022: 9.65,
    2023: 9.68,  2024: 11.80, 2025: 13.64,
    2026: 17.95,
}
_MSFT_ONE_TIME = {
    2002: "기술주 버블 붕괴 후 투자 손실 + 구조조정 비용 (EPS 급감)",
    2012: "aQuantive 굿윌 손상차손 $6.2B (EPS 약 -$0.75 영향)",
    2015: "Nokia 인수 손상차손 ~$7.6B (EPS 약 -$0.95 영향)",
    2018: "세금개혁(TCJA) 일회성 전환세 $13.8B (EPS 약 -$1.82 영향)",
}

# ── MSFT ──────────────────────────────────────────────────────
print("[MSFT] 데이터 로드...")
az_msft = RollingAnalyzer("MSFT", benchmark="^SP500TR")
df10a_msft = pd.read_csv(SRC / "MSFT_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_msft  = pd.read_csv(SRC / "MSFT_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_msft = az_msft.full_period()
st_msft = summary_stats(df10a_msft, label="MSFT")

loss5_msft = df5a_msft[df5a_msft["is_complete"] & (df5a_msft["cagr"] < 0)]

msft_out = {
    "ticker":    "MSFT",
    "name":      "마이크로소프트",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1986년 3월 상장. 분할 이력: 1987·1990·1991(2:1×3), 1992(3:2), 1994·1996·1998·1999·2003(2:1×5) → 누적 384:1. 마지막 분할 2003-02-18 이후 추가 분할 없음.",
    "current":   msft_metrics,
    "fullPeriod": fp_msft,
    "stats": {
        "n":        st_msft["n_complete"],
        "min":      st_msft["min_cagr"],
        "minBuy":   st_msft["min_buy"],
        "median":   st_msft["median_cagr"],
        "mean":     st_msft["mean_cagr"],
        "max":      st_msft["max_cagr"],
        "maxBuy":   st_msft["max_buy"],
        "over10":   st_msft["pct_over_10"],
        "over15":   st_msft["pct_over_15"],
        "over20":   st_msft["pct_over_20"],
        "losses":   st_msft["n_losses"],
        "beatBench":  st_msft.get("n_beat_bench"),
        "beatTotal":  st_msft.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_msft, MSFT_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_msft.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_msft, MSFT_EPS, _MSFT_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL (FY2008~FY2026, June 30 기준). FY1993~2007은 AI 역산 추정치 (macrotrends 참고, 384:1 분할 완전 반영). PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path10 = DST / "MSFT_rolling.json"
out_path10.write_text(json.dumps(msft_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path10}")

# ── WMT EPS 데이터 ────────────────────────────────────────────
# 월마트 회계연도: FY(Y+1) ending January 31, Y+1 → 달력연도 Y에 매핑
# 분할 이력: 2:1 × 11회(1971~1999) + 3:1 × 1회(2024-02-26) → 누적 6144:1
# FY ending 2024-01-31 이전(달력연도 2023 이하)은 ÷3 조정 완료
# 출처: SEC EDGAR XBRL CIK 0000104169 (EarningsPerShareDiluted, USD/shares, 10-K)
#
# 주요 EPS 왜곡 연도:
#   2017: TCJA 세금개혁 일회성 전환세 → EPS 급감
#   2018: Flipkart 인수 관련 비용
#   2021: Asda(영국) 매각 손실 + COVID-19
#   2022: 오피오이드 합의 비용($3.1B) + 기타 일회성 비용
#   2023: 투자 관련 평가 손실(JD.com 등)
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
    2024: 2.4100,  # FY ending 2025-01-31 (3:1 분할 이후)
    2025: 2.7300,  # FY ending 2026-01-31 (3:1 분할 이후)
}
_WMT_ONE_TIME = {
    2017: "TCJA 세금개혁 일회성 전환세(EPS 급감)",
    2018: "Flipkart 인수 관련 비용 및 기타 항목",
    2021: "Asda(영국) 매각 손실 + COVID-19",
    2022: "오피오이드 합의 비용($3.1B) + 기타 일회성 비용",
    2023: "투자 관련 평가 손실(JD.com 등)",
}

# ── WMT ──────────────────────────────────────────────────────────
print("[WMT] 데이터 로드...")
az_wmt = RollingAnalyzer("WMT", benchmark="^SP500TR")
df10a_wmt = pd.read_csv(SRC / "WMT_10y_annual.csv", parse_dates=["buy_date", "sell_date"])
df5a_wmt  = pd.read_csv(SRC / "WMT_5y_annual.csv",  parse_dates=["buy_date", "sell_date"])
fp_wmt = az_wmt.full_period()
st_wmt = summary_stats(df10a_wmt, label="WMT")

loss5_wmt = df5a_wmt[df5a_wmt["is_complete"] & (df5a_wmt["cagr"] < 0)]

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

out_path11 = DST / "WMT_rolling.json"
out_path11.write_text(json.dumps(wmt_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path11}")

# ── BRK-B EPS 데이터 ─────────────────────────────────────────
# 버크셔 해서웨이 클래스 B 회계연도 = 달력연도 (1월~12월)
# 상장: 1996년 5월 9일 (NYSE)
# 분할 이력: 2010-01-21 BRK-B 50:1 (BRK-A 1주 = BRK-B 1500주)
#   → yfinance는 현재 기준 소급 조정 주가 제공
#
# EPS 특이사항:
#   버크셔는 2018년부터 ASC 321 회계기준 적용으로 보유 주식의
#   미실현 투자손익이 GAAP 순이익에 포함됨.
#   이로 인해 2018년 이후 EPS는 주식시장 변동에 따라 극단적으로 움직여
#   EPS/PER 분해가 무의미함.
#   (예: 2022년 EPS 큰 폭 적자, 2023년 대폭 흑자)
#   워런 버핏도 매년 주주서한에서 GAAP EPS 대신 영업이익을 참고하라고 강조.
#
# → EPS 분해 생략. epsNote에 이유 명시.
_BRKB_EPS = {}
_BRKB_ONE_TIME = {}

# ── BRK-B ────────────────────────────────────────────────────
print("[BRK-B] 데이터 로드...")
az_brkb = RollingAnalyzer("BRK-B", benchmark="^SP500TR")
df10a_brkb = pd.read_csv(SRC / "BRKB_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_brkb  = pd.read_csv(SRC / "BRKB_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_brkb = az_brkb.full_period()
st_brkb = summary_stats(df10a_brkb, label="BRK-B")

loss5_brkb = df5a_brkb[df5a_brkb["is_complete"] & (df5a_brkb["cagr"] < 0)]

brkb_out = {
    "ticker":    "BRK-B",
    "name":      "버크셔 해서웨이",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1996년 5월 상장(BRK-B). 분할 이력: 2010-01-21 50:1(BRK-A 1주 = BRK-B 1500주). 배당 없음.",
    "current":   brkb_metrics,
    "fullPeriod": fp_brkb,
    "stats": {
        "n":        st_brkb["n_complete"],
        "min":      st_brkb["min_cagr"],
        "minBuy":   st_brkb["min_buy"],
        "median":   st_brkb["median_cagr"],
        "mean":     st_brkb["mean_cagr"],
        "max":      st_brkb["max_cagr"],
        "maxBuy":   st_brkb["max_buy"],
        "over10":   st_brkb["pct_over_10"],
        "over15":   st_brkb["pct_over_15"],
        "over20":   st_brkb["pct_over_20"],
        "losses":   st_brkb["n_losses"],
        "beatBench":  st_brkb.get("n_beat_bench"),
        "beatTotal":  st_brkb.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_brkb, _BRKB_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_brkb.iterrows()
    ],
    "epsDecomp": [],
    "epsNote": "EPS/PER 분해 미제공. 버크셔는 2018년부터 ASC 321 적용으로 보유 주식의 미실현 투자손익이 GAAP 순이익에 포함되어 EPS 변동이 극단적임(주식시장 등락에 직결). 워런 버핏은 GAAP EPS 대신 영업이익(Operating Earnings)을 참고하도록 권고. 이 페이지에서는 주가(배당재투자 포함) 기준 총수익률만 표시.",
}

out_path12 = DST / "BRKB_rolling.json"
out_path12.write_text(json.dumps(brkb_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path12}")

# ── LLY EPS 데이터 ────────────────────────────────────────────
# 일라이릴리 회계연도 = 달력연도 (1월~12월)
# 상장: NYSE, 오랜 역사 (1952년 이전 상장)
#
# 주식 분할 이력 (yfinance 확인):
#   1986-01-30: 2:1 / 1989-05-01: 2:1 / 1995-12-21: 2:1 / 1997-10-16: 2:1
#   → 누적 16:1, 마지막 분할 1997-10-16 이후 추가 분할 없음
#   → 2000년 이후 제출된 10-K EPS는 모든 분할이 반영됨 → 추가 조정 불필요
#
# 출처: SEC EDGAR XBRL CIK 0000059478 (EarningsPerShareDiluted, USD/shares, 10-K)
#       end 날짜 기준 최신 filed 값 사용
#
# 주요 EPS 왜곡 연도:
#   2008: 일회성 손상차손 및 법적 비용으로 EPS 음수 (실제 영업 이익은 양수)
#   2017: TCJA 세금개혁 일회성 전환세 부담 → EPS -0.19
#   2019: Elanco Animal Health 분사 관련 일회성 이익 포함 가능성 (EPS 급등)
_LLY_EPS = {
    2008: -1.89,  # 일회성 음수 → EPS 분해 제외
    2009:  3.94,
    2010:  4.58,
    2011:  3.90,
    2012:  3.66,
    2013:  4.32,
    2014:  2.23,  # Cymbalta 특허 만료(2014) 등 특허 절벽 본격화
    2015:  2.26,
    2016:  2.58,
    2017: -0.19,  # TCJA 세금개혁 일회성 전환세
    2018:  3.13,
    2019:  8.89,  # Elanco 분사 이익 등 일회성 요인 포함 가능
    2020:  6.79,
    2021:  6.12,
    2022:  6.90,
    2023:  5.80,
    2024: 11.71,
    2025: 22.95,
}
_LLY_ONE_TIME = {
    2008: "일회성 손상차손 및 법적 비용(EPS 음수, 영업이익은 양수)",
    2017: "TCJA 세금개혁 일회성 전환세(EPS -0.19)",
    2019: "Elanco Animal Health 분사 관련 일회성 이익 가능성(EPS 대폭 증가)",
}

# ── LLY ──────────────────────────────────────────────────────
print("[LLY] 데이터 로드...")
az_lly = RollingAnalyzer("LLY", benchmark="^SP500TR")
df10a_lly = pd.read_csv(SRC / "LLY_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_lly  = pd.read_csv(SRC / "LLY_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_lly = az_lly.full_period()
st_lly = summary_stats(df10a_lly, label="LLY")

loss5_lly = df5a_lly[df5a_lly["is_complete"] & (df5a_lly["cagr"] < 0)]

lly_out = {
    "ticker":    "LLY",
    "name":      "일라이릴리",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "분할 이력: 1986·1989·1995·1997 각 2:1(누적 16:1). 1997년 이후 분할 없음. 2000~2013년은 특허 절벽(Prozac·Zyprexa·Cymbalta 순차 만료)으로 수익률이 저조했으나 2014년 이후 GLP-1·면역항암 신약으로 급반등.",
    "current":   lly_metrics,
    "fullPeriod": fp_lly,
    "stats": {
        "n":        st_lly["n_complete"],
        "min":      st_lly["min_cagr"],
        "minBuy":   st_lly["min_buy"],
        "median":   st_lly["median_cagr"],
        "mean":     st_lly["mean_cagr"],
        "max":      st_lly["max_cagr"],
        "maxBuy":   st_lly["max_buy"],
        "over10":   st_lly["pct_over_10"],
        "over15":   st_lly["pct_over_15"],
        "over20":   st_lly["pct_over_20"],
        "losses":   st_lly["n_losses"],
        "beatBench":  st_lly.get("n_beat_bench"),
        "beatTotal":  st_lly.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_lly, _LLY_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_lly.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_lly, _LLY_EPS, _LLY_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK 0000059478 (달력연도 10-K, 2008~2025). 분할 이력(누적 16:1) 이미 반영 → 추가 조정 없음. 2008년·2017년 EPS 음수/왜곡 구간은 주석 표시. PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path13 = DST / "LLY_rolling.json"
out_path13.write_text(json.dumps(lly_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path13}")

# ── AVGO EPS 데이터 ───────────────────────────────────────────
# 브로드컴(Avago Technologies → Broadcom Inc.) 회계연도: 10월 말 종료
# 달력연도 Y = FY(Y) EPS (Y년 10월 말 종료)
#
# 분할 이력: 2024-07-15 10:1
#   FY2016~FY2023: 분할 전 기준 제출 → ÷10 필요
#   FY2024~       : 분할 후 기준 (소급 조정) → 추가 조정 없음
#
# 출처: SEC EDGAR XBRL CIK 0001730168 (Broadcom Inc.)
#   FY2016 이전 데이터 없음 (구 Avago Technologies 법인, 싱가포르 상장)
#
# 주요 EPS 왜곡 연도:
#   FY2016: Avago-Broadcom 합병 무형자산 상각 + 통합비용 → EPS 음수
#   FY2018: TCJA 세금개혁 혜택(이연법인세 재측정) → 이례적 고 EPS
#   FY2024: VMware 인수 무형자산 상각 대규모 반영 → 이례적 저 EPS
_AVGO_EPS_RAW = {
    # FY2016~FY2023: 분할 전 기준 → ÷10
    2016: -4.8600,   # 합병 비용 → EPS 음수
    2017:  4.0200,
    2018: 28.4400,   # TCJA 세금 혜택
    2019:  6.4300,
    2020:  6.3300,
    2021: 15.0000,
    2022: 26.5300,
    2023: 32.9800,
    # FY2024~: 분할 후 기준 (소급 조정) → 추가 조정 없음
    2024:  1.2300,   # VMware 무형자산 상각 → 이례적 저 EPS
    2025:  4.7700,
}
_AVGO_ONE_TIME = {
    2016: "Avago-Broadcom 합병 관련 무형자산 상각 및 통합비용(EPS 음수)",
    2018: "TCJA 세금개혁 이연법인세 재측정 혜택(이례적 고 EPS)",
    2024: "VMware 인수 무형자산 상각 대규모 반영(이례적 저 EPS)",
}

def _avgo_split_adj(fy, raw):
    if fy <= 2023: return raw / 10   # pre 2024-07 10:1 분할
    return raw                        # FY2024~ 소급 조정 완료

AVGO_EPS = {yr: round(_avgo_split_adj(yr, v), 4) for yr, v in _AVGO_EPS_RAW.items()}

# ── AVGO ──────────────────────────────────────────────────────
print("[AVGO] 데이터 로드...")
az_avgo = RollingAnalyzer("AVGO", benchmark="^SP500TR")
df10a_avgo = pd.read_csv(SRC / "AVGO_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_avgo  = pd.read_csv(SRC / "AVGO_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_avgo = az_avgo.full_period()
st_avgo = summary_stats(df10a_avgo, label="AVGO")

loss5_avgo = df5a_avgo[df5a_avgo["is_complete"] & (df5a_avgo["cagr"] < 0)]

avgo_out = {
    "ticker":    "AVGO",
    "name":      "브로드컴",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "2009년 8월 상장(Avago Technologies). 2016년 Broadcom 합병, 2018년 미국 법인 전환. 2024년 7월 10:1 주식 분할.",
    "current":   avgo_metrics,
    "fullPeriod": fp_avgo,
    "stats": {
        "n":        st_avgo["n_complete"],
        "min":      st_avgo["min_cagr"],
        "minBuy":   st_avgo["min_buy"],
        "median":   st_avgo["median_cagr"],
        "mean":     st_avgo["mean_cagr"],
        "max":      st_avgo["max_cagr"],
        "maxBuy":   st_avgo["max_buy"],
        "over10":   st_avgo["pct_over_10"],
        "over15":   st_avgo["pct_over_15"],
        "over20":   st_avgo["pct_over_20"],
        "losses":   st_avgo["n_losses"],
        "beatBench":  st_avgo.get("n_beat_bench"),
        "beatTotal":  st_avgo.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_avgo, AVGO_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_avgo.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_avgo, AVGO_EPS, _AVGO_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK 0001730168 (Broadcom Inc., FY2016~FY2025). 회계연도 10월 말 종료 기준. 분할조정: FY2016~FY2023 ÷10(2024-07 10:1 분할). FY2016 이전(Avago Technologies 싱가포르 법인) 데이터 미수집. PER은 Yahoo Finance 주가 기준.",
}

out_path14 = DST / "AVGO_rolling.json"
out_path14.write_text(json.dumps(avgo_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path14}")

# ── TSLA EPS 데이터 ───────────────────────────────────────────
# 테슬라 회계연도 = 달력연도 (1월~12월)
# 상장: 2010-06-29 (NASDAQ)
#
# 주식 분할 이력:
#   2020-08-31: 5:1 / 2022-08-25: 3:1 → 누적 15:1
#
# EDGAR 데이터 분할 반영 현황 (filed 날짜 기준):
#   FY2015~FY2017: filed ≤ 2020-02-13 → 두 분할 모두 미반영 → ÷15 필요
#   FY2018~FY2019: filed 2021-02-08 ~ 2022-02-07 → 2020 5:1 반영, 2022 3:1 미반영 → ÷3 필요
#   FY2020~FY2025: filed ≥ 2023-01-31 → 두 분할 모두 반영 → 추가 조정 없음
#
# 출처: SEC EDGAR XBRL CIK0001318605 (us-gaap/EarningsPerShareDiluted, 10-K)
#   FY2010~FY2014: EDGAR XBRL 미수집 (해당 기간 EPS 음수)
#
# 주요 EPS 왜곡 연도:
#   FY2010~FY2019: 모두 GAAP 순손실(EPS 음수) — EPS 분해 해당 구간 제외
#   FY2017: Model 3 양산 지연·개발비 집중 → 최대 적자(-$0.79 split-adj.)
#   FY2020: 첫 연간 흑자 전환(EPS $0.21)
#   FY2022: 공격적 가격 인하 시작 전 이익 정점(EPS $3.62)
#   FY2023: 대규모 가격 인하 → 영업이익률 급감(EPS $4.30)
#   FY2025: 가격 인하 지속·EPS 급락(EPS $1.08)
_TSLA_EDGAR_RAW = {
    # FY2015~FY2017: filed ≤ 2020-02-13 → ÷15 필요
    2015: -6.9300,
    2016: -4.6800,
    2017: -11.8300,
    # FY2018~FY2019: filed 2021-02-08 ~ 2022-02-07 → ÷3 필요
    2018: -1.1400,
    2019: -0.9800,
}
_TSLA_POST_SPLIT_EPS = {
    # FY2020~FY2025: 두 분할 모두 반영 (소급 조정 완료)
    2020:  0.2100,
    2021:  1.6300,
    2022:  3.6200,
    2023:  4.3000,
    2024:  2.0400,
    2025:  1.0800,
}
_TSLA_ONE_TIME = {
    2017: "Model 3 양산 지연·개발비 집중(분할조정 EPS -$0.79, 역대 최저)",
    2020: "첫 연간 GAAP 흑자 전환(EPS +$0.21, 양전환)",
    2022: "공격적 가격 인하 개시 직전 이익 정점(EPS $3.62)",
    2023: "대규모 가격 인하로 영업이익률 급감",
    2025: "가격 인하 지속 + 수요 불확실성 → EPS $1.08로 급락",
}

TSLA_EPS = {}
for yr, raw in _TSLA_EDGAR_RAW.items():
    if yr <= 2017:
        TSLA_EPS[yr] = round(raw / 15, 4)   # ÷15
    else:
        TSLA_EPS[yr] = round(raw / 3, 4)    # ÷3
TSLA_EPS.update(_TSLA_POST_SPLIT_EPS)

# ── TSLA ──────────────────────────────────────────────────────
print("[TSLA] 데이터 로드...")
az_tsla = RollingAnalyzer("TSLA", benchmark="^SP500TR")
df10a_tsla = pd.read_csv(SRC / "TSLA_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_tsla  = pd.read_csv(SRC / "TSLA_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_tsla = az_tsla.full_period()
st_tsla = summary_stats(df10a_tsla, label="TSLA")

loss5_tsla = df5a_tsla[df5a_tsla["is_complete"] & (df5a_tsla["cagr"] < 0)]

tsla_out = {
    "ticker":    "TSLA",
    "name":      "테슬라",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "2010년 6월 상장. 분할 이력: 2020-08-31 5:1, 2022-08-25 3:1(누적 15:1). 2010~2019년은 GAAP 순손실 → EPS 분해 해당 구간 제외.",
    "current":   tsla_metrics,
    "fullPeriod": fp_tsla,
    "stats": {
        "n":        st_tsla["n_complete"],
        "min":      st_tsla["min_cagr"],
        "minBuy":   st_tsla["min_buy"],
        "median":   st_tsla["median_cagr"],
        "mean":     st_tsla["mean_cagr"],
        "max":      st_tsla["max_cagr"],
        "maxBuy":   st_tsla["max_buy"],
        "over10":   st_tsla["pct_over_10"],
        "over15":   st_tsla["pct_over_15"],
        "over20":   st_tsla["pct_over_20"],
        "losses":   st_tsla["n_losses"],
        "beatBench":  st_tsla.get("n_beat_bench"),
        "beatTotal":  st_tsla.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_tsla, TSLA_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_tsla.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_tsla, TSLA_EPS, _TSLA_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK0001318605 (달력연도 10-K). 분할 조정: FY2015~2017÷15, FY2018~2019÷3, FY2020~2025 조정 없음. FY2010~2014 EDGAR 미수집(전기간 음수 EPS). EPS 음수 구간(2010~2019 매수) EPS·PER 분해 제외. PER은 Yahoo Finance 주가(배당 없음) 기준.",
}

out_path15 = DST / "TSLA_rolling.json"
out_path15.write_text(json.dumps(tsla_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path15}")

# ── JNJ EPS 데이터 ────────────────────────────────────────────
# 존슨앤존슨 회계연도 = 달력연도 (12월 말 종료, 정확히는 12월 마지막 일요일 근처)
# 상장: NYSE, 1944년 이전 상장 (오랜 역사)
#
# 주식 분할 이력 (모두 2:1):
#   1970-05-07 / 1981-05-07 / 1989-10-06 / 1992-05-22
#   1996-06-12 / 1999-06-09 / 2001-06-04 → 누적 128:1
#   마지막 분할 2001-06-04 이후 추가 분할 없음
#   → 2002년 이후 제출된 10-K는 모든 분할이 소급 반영됨 → 추가 조정 불필요
#
# 출처: SEC EDGAR XBRL CIK 0000200406 (EarningsPerShareDiluted, USD/shares, 10-K)
#       end 날짜 기반 FY 매핑 (1월 초 종료는 이전 연도로 처리)
#
# 주요 EPS 왜곡 연도:
#   2011: 대규모 리콜(타이레놀·DePuy ASR 임플란트) + 법적 비용 → EPS $3.49
#   2017: TCJA 세금개혁 일회성 전환세 → EPS $0.47
#   2020: COVID-19 팬데믹
#   2023: Kenvue(소비자 헬스케어 부문) 분사 일회성 이익 → EPS $13.72
#   2025: 특별 항목 포함(EPS $11.03, 정상 운영 대비 높음)
_JNJ_EPS = {
    2007: 3.63,
    2008: 4.57,
    2009: 4.40,
    2010: 4.78,
    2011: 3.49,  # 리콜·법적 비용
    2012: 3.86,
    2013: 4.81,
    2014: 5.70,
    2015: 5.48,
    2016: 5.93,
    2017: 0.47,  # TCJA 일회성
    2018: 5.61,
    2019: 5.63,
    2020: 5.51,  # COVID-19
    2021: 7.81,
    2022: 6.73,
    2023: 13.72, # Kenvue 분사 일회성
    2024: 5.79,
    2025: 11.03, # 특별 항목 포함 가능성
}
_JNJ_ONE_TIME = {
    2011: "대규모 리콜(타이레놀·DePuy ASR 임플란트) + 법적 비용(EPS $3.49)",
    2017: "TCJA 세금개혁 일회성 전환세(EPS $0.47, 정상 기준 ~$6)",
    2020: "COVID-19 팬데믹",
    2023: "Kenvue(소비자 헬스케어) 분사 일회성 이익(EPS $13.72, 정상 운영 ~$5.8)",
    2025: "특별 항목 포함 가능성(EPS $11.03, 정상 운영 대비 높음)",
}

# ── JNJ ──────────────────────────────────────────────────────
print("[JNJ] 데이터 로드...")
az_jnj = RollingAnalyzer("JNJ", benchmark="^SP500TR")
df10a_jnj = pd.read_csv(SRC / "JNJ_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_jnj  = pd.read_csv(SRC / "JNJ_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_jnj = az_jnj.full_period()
st_jnj = summary_stats(df10a_jnj, label="JNJ")

loss5_jnj = df5a_jnj[df5a_jnj["is_complete"] & (df5a_jnj["cagr"] < 0)]

jnj_out = {
    "ticker":    "JNJ",
    "name":      "존슨앤존슨",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "분할 이력: 1970·1981·1989·1992·1996·1999·2001 (각 2:1, 누적 128:1). 2001-06-04 이후 분할 없음. 2023년 소비자 헬스케어 부문을 Kenvue로 분사.",
    "current":   jnj_metrics,
    "fullPeriod": fp_jnj,
    "stats": {
        "n":        st_jnj["n_complete"],
        "min":      st_jnj["min_cagr"],
        "minBuy":   st_jnj["min_buy"],
        "median":   st_jnj["median_cagr"],
        "mean":     st_jnj["mean_cagr"],
        "max":      st_jnj["max_cagr"],
        "maxBuy":   st_jnj["max_buy"],
        "over10":   st_jnj["pct_over_10"],
        "over15":   st_jnj["pct_over_15"],
        "over20":   st_jnj["pct_over_20"],
        "losses":   st_jnj["n_losses"],
        "beatBench":  st_jnj.get("n_beat_bench"),
        "beatTotal":  st_jnj.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_jnj, _JNJ_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_jnj.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_jnj, _JNJ_EPS, _JNJ_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK 0000200406 (달력연도 10-K, FY2007~FY2025). 분할 이력(2001년까지 누적 128:1) 이미 반영 → 추가 조정 없음. 2023년 Kenvue 분사 일회성 이익으로 EPS 급등. PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path16 = DST / "JNJ_rolling.json"
out_path16.write_text(json.dumps(jnj_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path16}")

# ── JPM EPS 데이터 ─────────────────────────────────────────────
# JP모건 체이스 회계연도 = 달력연도 (12월 31일 종료)
# 현 법인(JPMorgan Chase & Co.) 탄생: 2001년 Chemical Banking + J.P. Morgan 합병
# 2004년 Bank One 추가 합병 (현재 구조 완성)
#
# 주식 분할 이력:
#   JPMorgan Chase(2001 이후) 및 직전 법인 모두 추가 분할 없음
#   → EPS 추가 조정 불필요
#
# 출처:
#   2007~2025: SEC EDGAR XBRL CIK 0000019617 (EarningsPerShareDiluted, USD/shares, 10-K)
#   2001~2006: AI 역산 추정치 (macrotrends 참고, JPMorgan Chase 합병 이후 기준)
#   2000년 이전: 합병 전 법인(Chemical Banking/Chase Manhattan) EPS는 현재 기준 비교 불가로 미수록
#
# 주요 EPS 왜곡 연도:
#   2002: 텔레콤 버블 붕괴(WorldCom 손실 등) + 9/11 여파로 신용 손실 급증 → EPS $0.80
#   2008: 금융위기 — Bear Stearns·WaMu 인수, 모기지 손실 → EPS $1.35
#   2013: London Whale 거래 손실 + DOJ 합의금 $13B 일회성 비용 → EPS $4.34
#   2020: COVID-19 — 대규모 대손충당금 설정 → EPS $8.88(정상화 전 $10.72)
_JPM_EPS = {
    # 2001~2006: AI 역산 추정치 (macrotrends 참고)
    2001:  1.76,
    2002:  0.80,
    2003:  2.26,
    2004:  2.31,
    2005:  3.37,
    2006:  4.04,
    # 2007~2025: SEC EDGAR XBRL (추가 조정 불필요)
    2007:  4.33,
    2008:  1.35,
    2009:  2.26,
    2010:  3.96,
    2011:  4.48,
    2012:  5.20,
    2013:  4.34,
    2014:  5.29,
    2015:  6.00,
    2016:  6.19,
    2017:  6.31,
    2018:  9.00,
    2019: 10.72,
    2020:  8.88,
    2021: 15.36,
    2022: 12.09,
    2023: 16.23,
    2024: 19.75,
    2025: 20.02,
}
_JPM_ONE_TIME = {
    2002: "텔레콤 버블 붕괴 + WorldCom 손실 + 9/11 여파(EPS $0.80, 전년 대비 -55%)",
    2008: "금융위기 — Bear Stearns·WaMu 인수, 모기지 손실(EPS $1.35)",
    2013: "London Whale 거래 손실 + DOJ 합의금 $13B 일회성 비용(EPS $4.34)",
    2020: "COVID-19 대규모 대손충당금 설정(EPS $8.88, 정상 수준 대비 약 -17%)",
}

# ── JPM ───────────────────────────────────────────────────────
print("[JPM] 데이터 로드...")
az_jpm = RollingAnalyzer("JPM", benchmark="^SP500TR")
df10a_jpm = pd.read_csv(SRC / "JPM_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_jpm  = pd.read_csv(SRC / "JPM_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_jpm = az_jpm.full_period()
st_jpm = summary_stats(df10a_jpm, label="JPM")

loss5_jpm = df5a_jpm[df5a_jpm["is_complete"] & (df5a_jpm["cagr"] < 0)]

jpm_out = {
    "ticker":    "JPM",
    "name":      "JP모건 체이스",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1980년부터 Yahoo Finance 데이터. 현 법인(JPMorgan Chase)은 2001년 Chemical Banking + J.P. Morgan 합병, 2004년 Bank One 합병으로 완성. 주식 분할 없음. 2000년 이전 구간은 합병 전 법인 데이터 포함.",
    "current":   jpm_metrics,
    "fullPeriod": fp_jpm,
    "stats": {
        "n":        st_jpm["n_complete"],
        "min":      st_jpm["min_cagr"],
        "minBuy":   st_jpm["min_buy"],
        "median":   st_jpm["median_cagr"],
        "mean":     st_jpm["mean_cagr"],
        "max":      st_jpm["max_cagr"],
        "maxBuy":   st_jpm["max_buy"],
        "over10":   st_jpm["pct_over_10"],
        "over15":   st_jpm["pct_over_15"],
        "over20":   st_jpm["pct_over_20"],
        "losses":   st_jpm["n_losses"],
        "beatBench":  st_jpm.get("n_beat_bench"),
        "beatTotal":  st_jpm.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_jpm, _JPM_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_jpm.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_jpm, _JPM_EPS, _JPM_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR XBRL CIK 0000019617 (2007~2025). 2001~2006년은 AI 역산 추정치 (macrotrends 참고). 주식 분할 없어 조정 불필요. EPS 분해는 2001년 이후 매수 구간에만 적용. PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path17 = DST / "JPM_rolling.json"
out_path17.write_text(json.dumps(jpm_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path17}")

# ── 레버리지 ETF (QQQ / QLD / TQQQ) ─────────────────────────
# 합성가격 방식: data_loader.py 'with_costs' 모드
#   QQQ  (1x): NDX × 1 − 운용보수 0.20%/년
#   QLD  (2x): NDX × 2 − (SOFR + 0.50%) × 1 − 운용보수 0.95%/년
#   TQQQ (3x): NDX × 3 − (SOFR + 0.50%) × 2 − 운용보수 0.88%/년
# NDX 데이터: 1971-02-05~ (1985-10-01 이전은 스플라이스 전 구간)
# 벤치마크: S&P 500 TR (기존 종목과 동일 기준)
# EPS 분해 없음 (ETF는 개별 주식 EPS 개념 없음)
# type: "etf" 플래그 → UI에서 시나리오 테이블 숨김

import sys as _sys
_sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices as _load_ndx
from rolling_analysis import full_period_cagr as _fp_cagr

print("[레버리지 ETF] 합성가격 로드 (with_costs)...")
_etf_d     = _load_ndx('with_costs')
_etf_dates = _etf_d['dates']
_qqq_s  = pd.Series(_etf_d['ndx1x'], index=_etf_dates, name='QQQ')
_qld_s  = pd.Series(_etf_d['ndx2x'], index=_etf_dates, name='QLD')
_tqqq_s = pd.Series(_etf_d['ndx3x'], index=_etf_dates, name='TQQQ')

print("[현재 지표 조회] QQQ, QLD, TQQQ ...")
qqq_metrics  = get_metrics("QQQ")
qld_metrics  = get_metrics("QLD")
tqqq_metrics = get_metrics("TQQQ")
print(f"  QQQ:  {qqq_metrics}")
print(f"  QLD:  {qld_metrics}")
print(f"  TQQQ: {tqqq_metrics}")

fp_qqq_etf  = _fp_cagr(_qqq_s)
fp_qld_etf  = _fp_cagr(_qld_s)
fp_tqqq_etf = _fp_cagr(_tqqq_s)

df10a_qqq  = pd.read_csv(SRC / "QQQ_10y_annual.csv",  parse_dates=["buy_date","sell_date"])
df5a_qqq   = pd.read_csv(SRC / "QQQ_5y_annual.csv",   parse_dates=["buy_date","sell_date"])
df10a_qld  = pd.read_csv(SRC / "QLD_10y_annual.csv",  parse_dates=["buy_date","sell_date"])
df5a_qld   = pd.read_csv(SRC / "QLD_5y_annual.csv",   parse_dates=["buy_date","sell_date"])
df10a_tqqq = pd.read_csv(SRC / "TQQQ_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_tqqq  = pd.read_csv(SRC / "TQQQ_5y_annual.csv",  parse_dates=["buy_date","sell_date"])

st_qqq  = summary_stats(df10a_qqq,  "QQQ")
st_qld  = summary_stats(df10a_qld,  "QLD")
st_tqqq = summary_stats(df10a_tqqq, "TQQQ")

loss5_qqq  = df5a_qqq [df5a_qqq ["is_complete"] & (df5a_qqq ["cagr"] < 0)]
loss5_qld  = df5a_qld [df5a_qld ["is_complete"] & (df5a_qld ["cagr"] < 0)]
loss5_tqqq = df5a_tqqq[df5a_tqqq["is_complete"] & (df5a_tqqq["cagr"] < 0)]

_ETF_COMMON_NOTE = "합성가격: NDX 일별수익률 기반, 스왑금리(SOFR+0.50%/년)·운용보수 차감. 1985-10-01 이전은 스플라이스 전 구간 (NDX 공식 출범 전). 실제 ETF 상장일과 무관하게 NDX 역사 전체 시뮬레이션."

def _etf_stats(st):
    return {
        "n":        st["n_complete"],
        "min":      st["min_cagr"],
        "minBuy":   st["min_buy"],
        "median":   st["median_cagr"],
        "mean":     st["mean_cagr"],
        "max":      st["max_cagr"],
        "maxBuy":   st["max_buy"],
        "over10":   st["pct_over_10"],
        "over15":   st["pct_over_15"],
        "over20":   st["pct_over_20"],
        "losses":   st["n_losses"],
        "beatBench":  st.get("n_beat_bench"),
        "beatTotal":  st.get("n_beat_bench_total"),
    }

def _loss5_rows(df):
    return [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in df.iterrows()
    ]

qqq_out = {
    "ticker":     "QQQ",
    "name":       "나스닥100",
    "currency":   "USD",
    "benchmark":  "S&P 500",
    "type":       "etf",
    "note":       _ETF_COMMON_NOTE + " | QQQ 운용보수: 0.20%/년",
    "current":    qqq_metrics,
    "fullPeriod": fp_qqq_etf,
    "stats":      _etf_stats(st_qqq),
    "rows10y":    df_to_rows(df10a_qqq),
    "loss5y":     _loss5_rows(loss5_qqq),
    "epsDecomp":  [],
    "epsNote":    "",
}

qld_out = {
    "ticker":     "QLD",
    "name":       "나스닥100 2배",
    "currency":   "USD",
    "benchmark":  "S&P 500",
    "type":       "etf",
    "note":       _ETF_COMMON_NOTE + " | QLD 운용보수: 0.95%/년, 스왑비용: SOFR+0.50%×1",
    "current":    qld_metrics,
    "fullPeriod": fp_qld_etf,
    "stats":      _etf_stats(st_qld),
    "rows10y":    df_to_rows(df10a_qld),
    "loss5y":     _loss5_rows(loss5_qld),
    "epsDecomp":  [],
    "epsNote":    "",
}

tqqq_out = {
    "ticker":     "TQQQ",
    "name":       "나스닥100 3배",
    "currency":   "USD",
    "benchmark":  "S&P 500",
    "type":       "etf",
    "note":       _ETF_COMMON_NOTE + " | TQQQ 운용보수: 0.88%/년, 스왑비용: SOFR+0.50%×2",
    "current":    tqqq_metrics,
    "fullPeriod": fp_tqqq_etf,
    "stats":      _etf_stats(st_tqqq),
    "rows10y":    df_to_rows(df10a_tqqq),
    "loss5y":     _loss5_rows(loss5_tqqq),
    "epsDecomp":  [],
    "epsNote":    "",
}

for ticker, out_obj in [("QQQ", qqq_out), ("QLD", qld_out), ("TQQQ", tqqq_out)]:
    p = DST / f"{ticker}_rolling.json"
    p.write_text(json.dumps(out_obj, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  저장 → {p}")

# ── V EPS 데이터 ──────────────────────────────────────────────
# 비자(Visa Inc.) 회계연도: 9월 30일 종료 (FY = 달력연도 Y)
# 상장: 2008-03-19 (NYSE, Class A common stock)
#
# 주식 분할 이력:
#   2015-03-19: 4:1 분할
#   → FY2015 이후: 분할 후 기준 (소급 조정)
#   → FY2009~FY2014: SEC EDGAR 10-K 신고 기준 "diluted earnings per share
#                    class A common stock" ÷ 4
#
# 비자 주식 구조 특성: Class A(상장)·B(은행)·C(가맹점) 3종.
#   Class A diluted EPS = Class A 귀속 순이익 ÷ Class A equivalent diluted shares.
#   Yahoo Finance 주가(V)는 Class A 기준 → 이 EPS와 일관성 있음.
#
# 주요 EPS 왜곡 연도:
#   FY2012(end Sep-2012): 미국 소송 충당금 $4.1B → EPS 급락
#   FY2018(end Sep-2018): TCJA 세금개혁 일회성 세금 혜택 → EPS 급등
#   FY2020(end Sep-2020): COVID-19 여행·결제 감소 → EPS 감소
#
# FY2008(end Sep-2008): IPO 직후 회계연도, EPS 불안정 → EPS 분해에서 제외
# FY2026(end Sep-2026): Q4 미발표(예정 2026-10-27) → 미수록
_V_EPS = {
    # FY2009~FY2014: EDGAR 10-K 분할 전 Class A diluted EPS ÷ 4
    2009: round(3.10 / 4, 4),   # FY2011 10-K 3년 비교에서 확인
    2010: round(4.01 / 4, 4),   # FY2011 10-K
    2011: round(5.16 / 4, 4),   # FY2011 10-K
    2012: round(3.16 / 4, 4),   # FY2013 10-K 3년 비교에서 확인 (소송 충당금)
    2013: round(7.59 / 4, 4),   # FY2013 10-K
    2014: round(8.62 / 4, 4),   # FY2014 10-K
    # FY2015~FY2025: 분할 후 기준 (10-K 및 yfinance 확인)
    2015: 2.58,
    2016: 2.48,
    2017: 2.80,
    2018: 4.42,   # TCJA 세금개혁 일회성 혜택 포함
    2019: 5.32,
    2020: 4.89,   # COVID-19 영향
    2021: 5.63,
    2022: 7.00,
    2023: 8.28,
    2024: 9.73,
    2025: 10.20,
}
_V_ONE_TIME = {
    2012: "미국 소송 충당금 $4.1B 설정 → EPS 급락(FY12 end Sep-2012)",
    2018: "TCJA 세금개혁 일회성 세금 혜택 → EPS 급등(FY18 end Sep-2018)",
    2020: "COVID-19 여행·결제 감소 → EPS 감소(FY20 end Sep-2020)",
}

# ── V ─────────────────────────────────────────────────────────
print("[V] 데이터 로드...")
az_v = RollingAnalyzer("V", benchmark="^SP500TR")
df10a_v = pd.read_csv(SRC / "V_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_v  = pd.read_csv(SRC / "V_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_v = az_v.full_period()
st_v = summary_stats(df10a_v, label="V")

loss5_v = df5a_v[df5a_v["is_complete"] & (df5a_v["cagr"] < 0)]

v_out = {
    "ticker":    "V",
    "name":      "비자",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "2008년 3월 IPO. 분할 이력: 2015-03-19 4:1. Class A 상장주 기준 수익률. EPS는 FY2008(IPO 연도) 제외 → 2009년 이후 매수 구간부터 EPS 분해 적용.",
    "current":   v_metrics,
    "fullPeriod": fp_v,
    "stats": {
        "n":       st_v["n_complete"],
        "min":     st_v["min_cagr"],
        "minBuy":  st_v["min_buy"],
        "median":  st_v["median_cagr"],
        "mean":    st_v["mean_cagr"],
        "max":     st_v["max_cagr"],
        "maxBuy":  st_v["max_buy"],
        "over10":  st_v["pct_over_10"],
        "over15":  st_v["pct_over_15"],
        "over20":  st_v["pct_over_20"],
        "losses":  st_v["n_losses"],
        "beatBench":  st_v.get("n_beat_bench"),
        "beatTotal":  st_v.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_v, _V_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_v.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_v, _V_EPS, _V_ONE_TIME),
    "epsNote": "EPS 출처: SEC EDGAR 10-K (FY2009~FY2014 분할 전 Class A diluted EPS ÷4; FY2015~FY2025 분할 후). 분할: 2015-03-19 4:1. FY2008(IPO 연도) EPS 제외. PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path_v = DST / "V_rolling.json"
out_path_v.write_text(json.dumps(v_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path_v}")

# ── ORCL EPS 데이터 ───────────────────────────────────────────
# 오라클 회계연도(FY) = 6월~5월 말 종료. 달력 연도 Y → FY(Y) EPS (Y년 5월 31일 종료) 사용.
#
# 분할 이력: 1987-10(2:1), 1989-01(2:1), 1989-09(2:1), 1993-10(3:2),
#            1996-03(2:1), 2000-01(2:1) → 누적 48:1
# 마지막 분할 2000-01-18 이후 추가 분할 없음.
#
# 출처별:
#   FY1997~FY2001: Oracle FY2001 10-K (CIK 777676, 5년 요약) → 2000-01 분할까지 소급 반영 완료
#   FY2002~FY2003: Oracle FY2003 10-K (CIK 777676, 3년 비교)
#   FY2004~FY2005: Oracle FY2005 10-K (CIK 777676, 3년 비교)
#   FY2006~FY2007: Oracle FY2007 10-K (CIK 1341439, 3년 비교)
#   FY2008~FY2026: SEC EDGAR XBRL CIK 0001341439 (USD/shares, 10-K 최신 filed 기준)
#
# 주요 EPS 왜곡 연도:
#   FY2000: 닷컴 버블 정점 — 소프트웨어 수요 폭증(EPS 1.05, 이후 급락)
#   FY2001: 닷컴 버블 붕괴 + IT 예산 급감(EPS 0.44로 급락)
#   FY2002: IT 경기침체 지속(EPS 0.39)
#   FY2018: 세금개혁(TCJA) 일회성 세금 비용 — EPS 0.85 (정상 기준 ~2.2 수준)
#   FY2022: Cerner 인수 완료 + PPA 상각·구조조정 비용 — EPS 2.41 (vs FY2021 4.55)
_ORCL_EPS = {
    # FY1997~FY2001: Oracle FY2001 10-K 5년 요약 (2000-01 분할까지 소급 반영)
    1997: 0.14,
    1998: 0.14,
    1999: 0.22,
    2000: 1.05,
    2001: 0.44,
    # FY2002~FY2003: Oracle FY2003 10-K
    2002: 0.39,
    2003: 0.43,
    # FY2004~FY2005: Oracle FY2005 10-K
    2004: 0.50,
    2005: 0.55,
    # FY2006~FY2007: Oracle FY2007 10-K (CIK 1341439)
    2006: 0.64,
    2007: 0.81,
    # FY2008~FY2026: SEC EDGAR XBRL CIK 0001341439 (USD/shares)
    2008: 1.06,
    2009: 1.09,
    2010: 1.21,
    2011: 1.67,
    2012: 1.96,
    2013: 2.26,
    2014: 2.38,
    2015: 2.21,
    2016: 2.07,
    2017: 2.24,
    2018: 0.85,
    2019: 2.97,
    2020: 3.08,
    2021: 4.55,
    2022: 2.41,
    2023: 3.07,
    2024: 3.71,
    2025: 4.34,
    2026: 5.83,
}
_ORCL_ONE_TIME = {
    2000: "닷컴 버블 정점 — 소프트웨어 수요 폭증(EPS 1.05, 이후 급락)",
    2001: "닷컴 버블 붕괴 + IT 예산 급감(EPS 0.44)",
    2002: "IT 경기침체 지속(EPS 0.39)",
    2018: "세금개혁(TCJA) 일회성 세금 비용(EPS 0.85, 정상 기준 ~2.2 수준)",
    2022: "Cerner 인수 완료 + PPA 상각·구조조정 비용(EPS 2.41 vs FY2021 4.55)",
}

# ── ORCL ──────────────────────────────────────────────────────
print("[ORCL] 데이터 로드...")
az_orcl = RollingAnalyzer("ORCL", benchmark="^SP500TR")
df10a_orcl = pd.read_csv(SRC / "ORCL_10y_annual.csv", parse_dates=["buy_date","sell_date"])
df5a_orcl  = pd.read_csv(SRC / "ORCL_5y_annual.csv",  parse_dates=["buy_date","sell_date"])
fp_orcl = az_orcl.full_period()
st_orcl = summary_stats(df10a_orcl, label="ORCL")

loss5_orcl = df5a_orcl[df5a_orcl["is_complete"] & (df5a_orcl["cagr"] < 0)]
orcl_metrics = get_metrics("ORCL")
print(f"  ORCL:  {orcl_metrics}")

orcl_out = {
    "ticker":    "ORCL",
    "name":      "오라클",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "1986년 3월 상장. 분할 이력: 1987·1989(×2)·1993·1996·2000 → 누적 48:1. 마지막 분할 2000-01-18 이후 추가 분할 없음.",
    "current":   orcl_metrics,
    "fullPeriod": fp_orcl,
    "stats": {
        "n":        st_orcl["n_complete"],
        "min":      st_orcl["min_cagr"],
        "minBuy":   st_orcl["min_buy"],
        "median":   st_orcl["median_cagr"],
        "mean":     st_orcl["mean_cagr"],
        "max":      st_orcl["max_cagr"],
        "maxBuy":   st_orcl["max_buy"],
        "over10":   st_orcl["pct_over_10"],
        "over15":   st_orcl["pct_over_15"],
        "over20":   st_orcl["pct_over_20"],
        "losses":   st_orcl["n_losses"],
        "beatBench":  st_orcl.get("n_beat_bench"),
        "beatTotal":  st_orcl.get("n_beat_bench_total"),
    },
    "rows10y": df_to_rows(df10a_orcl, _ORCL_EPS),
    "loss5y": [
        {"buyYear": int(r["buy_date"].year), "sellYear": int(r["sell_date"].year), "cagr": float(r["cagr"])}
        for _, r in loss5_orcl.iterrows()
    ],
    "epsDecomp": compute_eps_decomp(df10a_orcl, _ORCL_EPS, _ORCL_ONE_TIME),
    "epsNote": "EPS 출처: FY1997~FY2007 Oracle 10-K (EDGAR, CIK 0000777676 / 0001341439), FY2008~FY2026 SEC EDGAR XBRL (USD/shares). 분할 이력: 1987·1989(×2)·1993·1996·2000, 누적 48:1. FY2001 10-K 5년 요약 기준으로 2000-01 분할까지 소급 반영 완료. PER은 Yahoo Finance 배당조정 종가 기준.",
}

out_path_orcl = DST / "ORCL_rolling.json"
out_path_orcl.write_text(json.dumps(orcl_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path_orcl}")

print("\n[완료]")
