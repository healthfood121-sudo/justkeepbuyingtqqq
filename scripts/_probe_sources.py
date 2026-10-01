"""임시: 나스닥100 데이터 소스 후보 접속 테스트 (확인 후 삭제)"""
import json, re, requests
from datetime import date, timedelta

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
NASDAQ_H = {"User-Agent": UA, "Accept": "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9",
            "Origin": "https://www.nasdaq.com", "Referer": "https://www.nasdaq.com/"}
HTML_H = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9"}

d = date.today()
while d.weekday() >= 5:
    d -= timedelta(days=1)
prev = d - timedelta(days=1)
while prev.weekday() >= 5:
    prev -= timedelta(days=1)

probes = [
    ("nasdaq list-type nasdaq100", "GET", "https://api.nasdaq.com/api/quote/list-type/nasdaq100", NASDAQ_H, None),
    ("nasdaq QQQ holdings v1", "GET", "https://api.nasdaq.com/api/quote/QQQ/holdings?assetclass=etf", NASDAQ_H, None),
    ("nasdaq NDX info", "GET", "https://api.nasdaq.com/api/quote/NDX/info?assetclass=index", NASDAQ_H, None),
    ("nasdaq NDX constituents", "GET", "https://api.nasdaq.com/api/quote/NDX/constituents?assetclass=index", NASDAQ_H, None),
    ("nasdaq indexes weighting page", "GET", "https://indexes.nasdaqomx.com/Index/Weighting/NDX", HTML_H, None),
    ("nasdaq indexes WeightingData SOD", "POST", "https://indexes.nasdaqomx.com/Index/WeightingData",
     {**HTML_H, "Accept": "application/json", "X-Requested-With": "XMLHttpRequest"},
     {"id": "NDX", "tradeDate": f"{d.isoformat()}T00:00:00.000", "timeOfDay": "SOD"}),
    ("nasdaq indexes WeightingData EOD prev", "POST", "https://indexes.nasdaqomx.com/Index/WeightingData",
     {**HTML_H, "Accept": "application/json", "X-Requested-With": "XMLHttpRequest"},
     {"id": "NDX", "tradeDate": f"{prev.isoformat()}T00:00:00.000", "timeOfDay": "EOD"}),
    ("nasdaq.com NDX page", "GET", "https://www.nasdaq.com/market-activity/quotes/nasdaq-ndx-index", HTML_H, None),
    ("invesco dng holdings", "GET", "https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/QQQ/holdings/fund?idType=ticker&productType=ETF",
     {"User-Agent": UA, "Accept": "application/json"}, None),
    ("stockanalysis qqq", "GET", "https://stockanalysis.com/etf/qqq/holdings/", HTML_H, None),
    ("zacks qqq", "GET", "https://www.zacks.com/funds/etf/QQQ/holding", HTML_H, None),
    ("wikipedia nasdaq-100", "GET", "https://en.wikipedia.org/wiki/Nasdaq-100", HTML_H, None),
]

for name, method, url, headers, data in probes:
    try:
        r = requests.request(method, url, headers=headers, data=data, timeout=25)
        body = r.text
        ctype = r.headers.get("Content-Type", "")
        info = f"{r.status_code} {len(body):,}B {ctype}"
        extra = ""
        if "json" in ctype or body.lstrip().startswith(("{", "[")):
            try:
                j = r.json()
                extra = " keys=" + (str(list(j.keys()))[:200] if isinstance(j, dict) else f"list[{len(j)}]")
            except Exception:
                pass
        n_pct = len(re.findall(r"\d+\.\d+\s*%", body))
        print(f"### {name}: {info}{extra} pct_count={n_pct}")
        print("    " + re.sub(r"\s+", " ", body[:700]))
    except Exception as e:
        print(f"### {name}: ERROR {e}")
