"""
export_dividend_decomp.py — 10년 보유 수익률에서 배당 몫 분리 (종목 지정)

배당 미포함 종가(Close)와 배당 재투자 종가(Adj Close)의 연말 값을 비교해
매수 연도별 '주가만 오른 연평균 수익률'과 '배당 효과'를 계산한다.
Yahoo 데이터가 있는 구간만 계산 (에르메스 1993~1999는 출처가 달라 제외됨).

사용: python scripts/export_dividend_decomp.py RMS:RMS.PA NKE:NKE
출력: web/public/data/rolling/{KEY}_dividend.json
실행: GitHub Actions '배당 분해 데이터 생성' (workflow_dispatch, 입력 tickers)
"""
import json
import sys
from pathlib import Path

import pandas as pd
import yfinance as yf

DST = Path(__file__).parent.parent / "web" / "public" / "data" / "rolling"


def export(key: str, yf_ticker: str) -> None:
  OUT = DST / f"{key}_dividend.json"
  raw = yf.download(yf_ticker, start="1970-01-01", auto_adjust=False, progress=False)
  close = raw["Close"]
  adj = raw["Adj Close"]
  if isinstance(close, pd.DataFrame):
      close = close.iloc[:, 0]
      adj = adj.iloc[:, 0]

  ye_close = close.groupby(close.index.year).last()
  ye_adj = adj.groupby(adj.index.year).last()
  last_full_year = pd.Timestamp.today().year - 1

  rows = []
  for buy in range(int(ye_close.index[0]), last_full_year - 9):
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
      "ticker": yf_ticker,
      "source": "Yahoo Finance 연말 Close(배당 미포함) vs Adj Close(배당 재투자)",
      "generated": pd.Timestamp.today().strftime("%Y-%m-%d"),
      "rows": rows,
  }, ensure_ascii=False, indent=1))
  print(f"저장: {OUT} ({len(rows)}개 구간)")


if __name__ == "__main__":
  for arg in sys.argv[1:]:
    k, t = arg.split(":")
    export(k, t)
