"""
export_monthly_price.py — 월말 종가(배당 미반영, 분할만 반영) 내보내기 (종목 지정)

'이익 성장선 vs 주가' 그래프용. PER 비교는 실제 종가로 해야 해서 배당 조정 전 Close를 쓴다.

사용: python scripts/export_monthly_price.py RMS:RMS.PA NKE:NKE
출력: web/public/data/rolling/{KEY}_monthly_price.json
실행: GitHub Actions '월별 주가 데이터 생성' (workflow_dispatch, 입력 tickers)
"""
import json
import sys
from pathlib import Path

import pandas as pd
import yfinance as yf

DST = Path(__file__).parent.parent / "web" / "public" / "data" / "rolling"


def export(key: str, yf_ticker: str) -> None:
    raw = yf.download(yf_ticker, start="1990-01-01", auto_adjust=False, progress=False)
    close = raw["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]
    close = close.dropna()
    me = close.groupby([close.index.year, close.index.month]).last()
    rows = [{"d": f"{y}-{m:02d}", "c": round(float(v), 2)} for (y, m), v in me.items()]
    out = {
        "ticker": yf_ticker,
        "source": "Yahoo Finance 월말 Close (배당 미반영, 분할 반영)",
        "generated": pd.Timestamp.today().strftime("%Y-%m-%d"),
        "last": {"date": close.index[-1].strftime("%Y-%m-%d"), "close": round(float(close.iloc[-1]), 2)},
        "rows": rows,
    }
    path = DST / f"{key}_monthly_price.json"
    path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(key, len(rows), rows[0], out["last"])


if __name__ == "__main__":
    for arg in sys.argv[1:] or ["RMS:RMS.PA"]:
        k, t = arg.split(":", 1)
        export(k, t)
