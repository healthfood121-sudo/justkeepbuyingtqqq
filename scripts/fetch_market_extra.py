"""
fetch_market_extra.py

백테스트 검증용 외부 데이터를 받아 data/extra/ 에 CSV로 저장한다.
작업 환경에서 금융 데이터 사이트 접속이 막혀 있을 수 있어 GitHub Actions(fetch-market-extra.yml)에서 실행한다.

  실제 ETF 가격 (Yahoo, 배당·분할 반영 수정종가 adjclose + 종가 close)
    TQQQ (2010-02~) · QLD (2006-06~) · QQQ (1999-03~) · ^NDX
  환율·물가 (FRED)
    DEXKOUS          원/달러 환율 일별 (1981-04~)
    CPIAUCSL         미국 소비자물가 월별
    KORCPIALLMINMEI  한국 소비자물가 월별

  python scripts/fetch_market_extra.py
"""

import io
import sys
import time
from pathlib import Path

import pandas as pd
import requests

ROOT    = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "data/extra"
UA      = {"User-Agent": "Mozilla/5.0"}

YAHOO = {"TQQQ": "tqqq", "QLD": "qld", "QQQ": "qqq", "^NDX": "ndx_yahoo"}
FRED  = {"DEXKOUS": "usdkrw", "CPIAUCSL": "cpi_us", "KORCPIALLMINMEI": "cpi_kr"}


def get(url: str) -> requests.Response:
    for i in range(4):
        try:
            r = requests.get(url, headers=UA, timeout=30)
            r.raise_for_status()
            return r
        except Exception as e:
            if i == 3:
                raise
            print(f"  재시도 {i + 1}: {e}", file=sys.stderr)
            time.sleep(2 ** (i + 1))


def fetch_yahoo(symbol: str) -> pd.DataFrame:
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{requests.utils.quote(symbol)}"
           f"?period1=0&period2={int(time.time())}&interval=1d&events=div,split&includeAdjustedClose=true")
    res = get(url).json()["chart"]["result"][0]
    q = res["indicators"]["quote"][0]
    adj = res["indicators"].get("adjclose", [{}])[0].get("adjclose") or q["close"]
    df = pd.DataFrame({
        "Date":     pd.to_datetime(res["timestamp"], unit="s").tz_localize("UTC")
                      .tz_convert("America/New_York").date,
        "Close":    q["close"],
        "AdjClose": adj,
    }).dropna()
    return df.drop_duplicates("Date", keep="last")


def fetch_fred(series: str) -> pd.DataFrame:
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series}"
    df = pd.read_csv(io.StringIO(get(url).text))
    df.columns = ["Date", "Value"]
    df["Value"] = pd.to_numeric(df["Value"], errors="coerce")    # 휴일은 '.'
    return df.dropna()


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    failed = []
    for sym, name in YAHOO.items():
        try:
            df = fetch_yahoo(sym)
            df.to_csv(OUT_DIR / f"{name}.csv", index=False)
            print(f"{sym}: {len(df)}행 {df.Date.iloc[0]} ~ {df.Date.iloc[-1]}")
        except Exception as e:
            failed.append(sym); print(f"[실패] {sym}: {e}", file=sys.stderr)
    for sid, name in FRED.items():
        try:
            df = fetch_fred(sid)
            df.to_csv(OUT_DIR / f"{name}.csv", index=False)
            print(f"{sid}: {len(df)}행 {df.Date.iloc[0]} ~ {df.Date.iloc[-1]}")
        except Exception as e:
            failed.append(sid); print(f"[실패] {sid}: {e}", file=sys.stderr)
    if failed:
        sys.exit(f"실패: {failed}")


if __name__ == "__main__":
    main()
