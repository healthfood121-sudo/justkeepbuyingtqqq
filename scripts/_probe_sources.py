"""임시: 나스닥100 데이터 소스 후보 상세 테스트 (확인 후 삭제)"""
import json, re, requests
from datetime import date, timedelta

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
H = {"User-Agent": UA, "Accept": "application/json, text/javascript, */*; q=0.01", "X-Requested-With": "XMLHttpRequest",
     "Referer": "https://indexes.nasdaqomx.com/Index/Weighting/NDX"}

# 1) Nasdaq Global Indexes: 페이지 JS 가 보내는 파라미터 확인
page = requests.get("https://indexes.nasdaqomx.com/Index/Weighting/NDX", headers={"User-Agent": UA}, timeout=25).text
for m in re.finditer(r"(WeightingData|mDataProp|aoColumns|sTitle|Weight|timeOfDay)[^\n]{0,200}", page):
    print("PAGE:", m.group(0)[:220])

d = date.today() - timedelta(days=1)
while d.weekday() >= 5:
    d -= timedelta(days=1)
cols = ["Name", "Symbol", "Weight", "Sector", "Price", "Shares", "IndexWeight", "PercentWeight"]
form = {"id": "NDX", "tradeDate": f"{d.isoformat()}T00:00:00.000", "timeOfDay": "EOD",
        "sEcho": 1, "iColumns": len(cols), "iDisplayStart": 0, "iDisplayLength": 200}
for i, c in enumerate(cols):
    form[f"mDataProp_{i}"] = c
r = requests.post("https://indexes.nasdaqomx.com/Index/WeightingData", headers=H, data=form, timeout=25)
print("WEIGHTING:", r.status_code, r.text[:600])

# 2) stockanalysis: 전체 목록이 들어있는지
for url in ("https://stockanalysis.com/etf/qqq/holdings/", "https://stockanalysis.com/etf/qqq/holdings/__data.json"):
    r = requests.get(url, headers={"User-Agent": UA}, timeout=25)
    t = r.text
    print("SA:", url, r.status_code, len(t))
    syms = re.findall(r'"?s"?\s*:\s*"\$?([A-Z.]{1,6})"', t)
    print("   symbols-like:", len(syms), syms[:10])
    for kw in ("NVDA", "NQZ6", "USD", "SPCX", "WDAY", "holdings", "count", "asOf", "date"):
        i = t.find(kw)
        if i >= 0:
            print(f"   [{kw}] ...{re.sub(chr(10),' ',t[max(0,i-150):i+200])}...")
