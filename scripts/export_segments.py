"""전 종목 사업부·지역별 분기 매출 원자료 수집 — SEC 10-Q/10-K XBRL 인스턴스(차원 포함)에서.
나이키(export_nike_segments.py)를 일반화. GitHub Actions에서 실행(샌드박스는 SEC 접속 불가).

사용: python scripts/export_segments.py --grade A        (_quality.json 등급)
      python scripts/export_segments.py --keys AAPL,MSFT
결과: scripts/data/segments_raw/{KEY}.json.gz
  {key, ticker, cik, generated, facts: [[concept, start, end, {축: 멤버}, value, accn], ...]}
  매출·영업이익 계열 항목만, 기간(시작~끝) 값만, 축 3개 이하만 남김. 이미 있는 파일은 --force 없으면 건너뜀.
가공은 scripts/process_segments.py.
"""
import argparse, gzip, json, re, time, sys
import xml.etree.ElementTree as ET
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
FUND = ROOT / "web" / "public" / "data" / "fundamentals"
OUT = ROOT / "scripts" / "data" / "segments_raw"; OUT.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "justkeepbuyingtqqq research justkeepbuyingtqqq@gmail.com"}
SINCE = "2022-06-01"
CIK_EXTRA = {"XOM": [34088], "MMC": [62709]}
SKIP = {"RMS", "DEO", "QQQ", "QLD", "TQQQ"}  # 비미국(SEC 10-Q 없음)·ETF
KEEP = re.compile(r"Revenue|Sales|OperatingIncomeLoss|OperatingProfit|SegmentOperatingIncome|EarningsBeforeInterestAndTaxes|NetInterestIncome|PremiumsEarned", re.I)
DROP = re.compile(r"Cost|Expense|Deferred|Receivable|Liabilit|Asset|Tax|Unbilled|Remaining|Percentage|Proceeds|Payment|Gain|Loss(?!$)|Allowance", re.I)

def get(url, as_json=False):
    for a in range(5):
        try:
            r = requests.get(url, headers=UA, timeout=90)
            if r.status_code == 200:
                time.sleep(0.11)
                return r.json() if as_json else r.content
            if r.status_code == 404: return None
            print("  HTTP", r.status_code, url, flush=True)
        except requests.RequestException as e:
            print("  ERR", e, flush=True)
        time.sleep(3 * (a + 1))
    return None

def filings(cik):
    sub = get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json", True)
    if not sub: return []
    blocks = [sub["filings"]["recent"]]
    for f in sub["filings"].get("files", []):
        if f.get("filingTo", "9999") < SINCE: continue
        b = get(f"https://data.sec.gov/submissions/{f['name']}", True)
        if b: blocks.append(b)
    out = []
    for b in blocks:
        for form, acc, date in zip(b["form"], b["accessionNumber"], b["filingDate"]):
            if form in ("10-Q", "10-K", "10-KT") and date >= SINCE:
                out.append((date, form, acc))
    return sorted(set(out))

def instance_url(cik, acc):
    nod = acc.replace("-", "")
    idx = get(f"https://www.sec.gov/Archives/edgar/data/{cik}/{nod}/index.json", True)
    if not idx: return None
    names = [i["name"] for i in idx["directory"]["item"]]
    cand = [n for n in names if n.endswith("_htm.xml")]
    if not cand:
        cand = [n for n in names if n.endswith(".xml") and not re.search(r"_(cal|def|lab|pre)\.xml$|FilingSummary|MetaLinks", n)]
    return f"https://www.sec.gov/Archives/edgar/data/{cik}/{nod}/{cand[0]}" if cand else None

def parse(xml_bytes, acc):
    root = ET.fromstring(xml_bytes)
    nx = "{http://www.xbrl.org/2003/instance}"; nd = "{http://xbrl.org/2006/xbrldi}"
    ctx = {}
    for c in root.iter(f"{nx}context"):
        per = c.find(f"{nx}period")
        st = per.find(f"{nx}startDate"); en = per.find(f"{nx}endDate")
        if st is None or en is None: continue
        dims = {m.get("dimension"): (m.text or "").strip() for m in c.iter(f"{nd}explicitMember")}
        if len(dims) > 3: continue
        ctx[c.get("id")] = (st.text.strip(), en.text.strip(), dims)
    out, seen = [], set()
    for el in root:
        tag = el.tag
        if not tag.startswith("{") or el.get("contextRef") not in ctx: continue
        name = tag.split("}")[1]
        if not KEEP.search(name) or DROP.search(re.sub(r"OperatingIncomeLoss|(Ex|In)cludingAssessedTax|NetOfInterestExpense", "", name)): continue
        try: v = float(el.text)
        except (TypeError, ValueError): continue
        st, en, dims = ctx[el.get("contextRef")]
        k = (name, st, en, tuple(sorted(dims.items())))
        if k in seen: continue
        seen.add(k); out.append([name, st, en, dims, v, acc])
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--grade"); ap.add_argument("--keys"); ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    if a.keys: keys = [k.strip() for k in a.keys.split(",") if k.strip()]
    else:
        q = json.loads((FUND / "_quality.json").read_text())["stocks"]
        keys = sorted(k for k, v in q.items() if not a.grade or v["grade"] in a.grade)
    cmap = {v["ticker"].upper(): int(v["cik_str"]) for v in get("https://www.sec.gov/files/company_tickers.json", True).values()}
    for i, key in enumerate(keys):
        if key in SKIP: continue
        dst = OUT / f"{key}.json.gz"
        if dst.exists() and not a.force: continue
        fj = FUND / f"{key}.json"
        tk = json.loads(fj.read_text()).get("ticker", key) if fj.exists() else key
        cik = cmap.get(tk.upper()) or cmap.get(tk.upper().replace("-", ".")) or cmap.get(tk.upper().replace("-", "")) or (CIK_EXTRA.get(key) or [None])[0]
        if not cik:
            print(f"[{i+1}/{len(keys)}] {key} CIK 없음", flush=True); continue
        t0 = time.time(); facts = []; n = 0
        jobs = [(c, f) for c in [cik] + [x for x in CIK_EXTRA.get(key, []) if x != cik] for f in filings(c)]
        for c, (date, form, acc) in jobs:
            u = instance_url(c, acc)
            x = get(u) if u else None
            if not x: continue
            try: facts += parse(x, acc); n += 1
            except ET.ParseError as e: print("  파싱 실패", acc, e, flush=True)
        dst.write_bytes(gzip.compress(json.dumps({"key": key, "ticker": tk, "cik": cik, "generated": time.strftime("%Y-%m-%d"), "facts": facts},
                                                 ensure_ascii=False, separators=(",", ":")).encode()))
        print(f"[{i+1}/{len(keys)}] {key} 공시 {n} 사실 {len(facts)} {time.time()-t0:.0f}s", flush=True)

if __name__ == "__main__":
    main()
