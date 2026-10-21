"""
export_rms_dividend.py — 에르메스(RMS.PA) 10년 보유 수익률에서 배당 몫 분리

배당 미포함 종가(Close)와 배당 재투자 종가(Adj Close)의 연말 값을 비교해
매수 연도별 '주가만 오른 연평균 수익률'과 '배당 효과'를 계산한다.
Yahoo 데이터가 있는 2000년 이후 매수 구간만 계산 (1993~1999는 출처가 달라 제외).

출력: web/public/data/rolling/RMS_dividend.json
실행: GitHub Actions 'RMS 배당 분해 데이터 생성' (workflow_dispatch)
"""
import json
from pathlib import Path

import pandas as pd
import yfinance as yf

OUT = Path(__file__).parent.parent / "web" / "public" / "data" / "rolling" / "RMS_dividend.json"

raw = yf.download("RMS.PA", start="1999-12-01", auto_adjust=False, progress=False)
close = raw["Close"]
adj = raw["Adj Close"]
if isinstance(close, pd.DataFrame):
    close = close.iloc[:, 0]
    adj = adj.iloc[:, 0]

ye_close = close.groupby(close.index.year).last()
ye_adj = adj.groupby(adj.index.year).last()
last_full_year = pd.Timestamp.today().year - 1

rows = []
for buy in range(2000, last_full_year - 9):
    sell = buy + 10
    if buy not in ye_close.index or sell not in ye_close.index:
        continue
    price_cagr = (ye_close[sell] / ye_close[buy]) ** 0.1 - 1
    total_cagr = (ye_adj[sell] / ye_adj[buy]) ** 0.1 - 1
    div_cagr = (1 + total_cagr) / (1 + price_cagr) - 1
    rows.append({
        "buyYear": buy,
        "sellYear": sell,
        "priceCagr": round(price_cagr * 100, 2),   # 배당 미포함 주가 연평균 상승률
        "totalCagr": round(total_cagr * 100, 2),   # 배당 재투자 포함
        "divCagr": round(div_cagr * 100, 2),       # 배당 효과 (곱셈 기준)
    })
    print(buy, sell, rows[-1])

OUT.write_text(json.dumps({
    "ticker": "RMS.PA",
    "source": "Yahoo Finance 연말 Close(배당 미포함) vs Adj Close(배당 재투자)",
    "generated": pd.Timestamp.today().strftime("%Y-%m-%d"),
    "rows": rows,
}, ensure_ascii=False, indent=1))
print(f"저장: {OUT} ({len(rows)}개 구간)")
