"""
나스닥100 (^NDX) 일별 종가 자동 업데이트 스크립트

최근 한 달치 일봉을 받아와서, CSV 마지막 날짜 이후의 '마감된' 거래일만 덧붙인다.
  1순위: Yahoo Finance chart API
  2순위: Nasdaq 공식 API (Yahoo 실패 시)

갱신 대상 (형식: Date,Close — 둘 다 같은 내용 유지):
  data/ndx_1971_now.csv     — 백테스트 스크립트용
  web/public/ndx.csv        — 웹 (시뮬레이터 + 200일 지수이동평균 신호 카드)

실행:
  python scripts/update_ndx_prices.py
"""

import csv
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

ROOT      = Path(__file__).parent.parent
CSV_PATHS = [ROOT / "data/ndx_1971_now.csv", ROOT / "web/public/ndx.csv"]

ET = ZoneInfo("America/New_York")

_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

YAHOO_URLS = [
    "https://query1.finance.yahoo.com/v8/finance/chart/%5ENDX?range=1mo&interval=1d",
    "https://query2.finance.yahoo.com/v8/finance/chart/%5ENDX?range=1mo&interval=1d",
]
NASDAQ_URL = "https://api.nasdaq.com/api/quote/NDX/historical"
NASDAQ_HEADERS = {
    "User-Agent": _BROWSER_UA,
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.nasdaq.com",
    "Referer": "https://www.nasdaq.com/",
}


def last_closed_session() -> date:
    """오늘 미국장이 아직 마감 전(ET 17시 이전)이면 오늘 봉은 제외한다."""
    now_et = datetime.now(ET)
    return now_et.date() if now_et.hour >= 17 else now_et.date() - timedelta(days=1)


def fetch_yahoo() -> list[tuple[str, float]]:
    last_err = None
    for url in YAHOO_URLS:
        try:
            r = requests.get(url, headers={"User-Agent": _BROWSER_UA}, timeout=20)
            r.raise_for_status()
            res = r.json()["chart"]["result"][0]
            tz  = ZoneInfo(res["meta"].get("exchangeTimezoneName", "America/New_York"))
            out = []
            for ts, close in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]):
                if close is None:
                    continue
                d = datetime.fromtimestamp(ts, tz).date()
                out.append((d.isoformat(), float(close)))
            if out:
                return out
        except Exception as e:  # noqa: BLE001
            last_err = e
            print(f"  Yahoo 실패 ({url[:40]}...): {e}")
            time.sleep(2)
    raise RuntimeError(f"Yahoo 전체 실패: {last_err}")


def fetch_nasdaq() -> list[tuple[str, float]]:
    today = datetime.now(ET).date()
    params = {
        "assetclass": "index",
        "fromdate":   (today - timedelta(days=35)).isoformat(),
        "todate":     today.isoformat(),
        "limit":      100,
    }
    r = requests.get(NASDAQ_URL, params=params, headers=NASDAQ_HEADERS, timeout=20)
    r.raise_for_status()
    rows = r.json()["data"]["tradesTable"]["rows"]
    out = []
    for row in rows:
        d = datetime.strptime(row["date"], "%m/%d/%Y").date()
        out.append((d.isoformat(), float(str(row["close"]).replace(",", ""))))
    out.sort()
    if not out:
        raise RuntimeError("Nasdaq 응답에 데이터 없음")
    return out


def read_last_date(path: Path) -> str:
    with path.open(encoding="utf-8") as f:
        rows = [r for r in csv.reader(f) if r]
    return rows[-1][0]


def append_rows(path: Path, rows: list[tuple[str, float]]) -> int:
    last = read_last_date(path)
    new  = [(d, c) for d, c in rows if d > last]
    if not new:
        return 0
    text = path.read_text(encoding="utf-8")
    with path.open("a", encoding="utf-8", newline="") as f:
        if not text.endswith("\n"):
            f.write("\n")
        for d, c in new:
            f.write(f"{d},{c}\n")
    return len(new)


def main() -> int:
    try:
        rows = fetch_yahoo()
        src  = "Yahoo"
    except Exception as e:  # noqa: BLE001
        print(f"Yahoo 실패 → Nasdaq API 시도 ({e})")
        rows = fetch_nasdaq()
        src  = "Nasdaq"

    cutoff = last_closed_session().isoformat()
    rows   = [(d, c) for d, c in rows if d <= cutoff]
    print(f"[{src}] 마감된 거래일 {len(rows)}개 수신 (최신 {rows[-1][0] if rows else '-'})")

    for path in CSV_PATHS:
        n = append_rows(path, rows)
        print(f"  {path.relative_to(ROOT)}: +{n}행 (마지막 {read_last_date(path)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
