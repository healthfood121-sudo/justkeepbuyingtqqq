"""나이키 지역별(사업 부문) 분기 매출·EBIT 원자료 수집 — SEC 10-Q/10-K의 XBRL 인스턴스에서.

결과: web/public/data/nike_segments_raw.json
  facts: [{concept, start, end, dims: {축: 멤버}, value, form, accn}]
가공(분기 값 만들기, 4분기 = 연간 − 9개월 누적)은 web 쪽 또는 별도 스크립트에서 한다.
"""
import json, re, time, sys
import xml.etree.ElementTree as ET
from pathlib import Path
import requests

UA = {"User-Agent": "justkeepbuyingtqqq research justkeepbuyingtqqq@gmail.com"}
CIK = 320187
OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "nike_segments_raw.json"
SINCE = "2018-09-01"  # FY19 1분기(2018년 8월 말) 10-Q부터

def get(url, as_json=False):
    for a in range(5):
        try:
            r = requests.get(url, headers=UA, timeout=60)
            if r.status_code == 200:
                time.sleep(0.15)
                return r.json() if as_json else r.content
            print("  HTTP", r.status_code, url, flush=True)
        except requests.RequestException as e:
            print("  ERR", e, flush=True)
        time.sleep(3 * (a + 1))
    return None

def filings():
    sub = get(f"https://data.sec.gov/submissions/CIK{CIK:010d}.json", True)
    blocks = [sub["filings"]["recent"]]
    for f in sub["filings"].get("files", []):
        b = get(f"https://data.sec.gov/submissions/{f['name']}", True)
        if b: blocks.append(b)
    out = []
    for b in blocks:
        for form, acc, date in zip(b["form"], b["accessionNumber"], b["filingDate"]):
            if form in ("10-Q", "10-K") and date >= SINCE:
                out.append((date, form, acc))
    return sorted(set(out))

KEEP = re.compile(r"Revenue|EarningsBeforeInterestAndTaxes|OperatingIncomeLoss|GrossProfit|InventoryNet", re.I)

def instance_url(acc):
    nod = acc.replace("-", "")
    idx = get(f"https://www.sec.gov/Archives/edgar/data/{CIK}/{nod}/index.json", True)
    if not idx: return None
    names = [i["name"] for i in idx["directory"]["item"]]
    cand = [n for n in names if n.endswith("_htm.xml")]
    if not cand:
        cand = [n for n in names if n.endswith(".xml") and not re.search(r"_(cal|def|lab|pre)\.xml$|FilingSummary|MetaLinks", n)]
    return f"https://www.sec.gov/Archives/edgar/data/{CIK}/{nod}/{cand[0]}" if cand else None

def parse(xml_bytes, form, acc):
    root = ET.fromstring(xml_bytes)
    ns_x = "{http://www.xbrl.org/2003/instance}"
    ns_d = "{http://xbrl.org/2006/xbrldi}"
    ctx = {}
    for c in root.iter(f"{ns_x}context"):
        cid = c.get("id")
        per = c.find(f"{ns_x}period")
        st = per.find(f"{ns_x}startDate"); en = per.find(f"{ns_x}endDate"); ins = per.find(f"{ns_x}instant")
        dims = {}
        for m in c.iter(f"{ns_d}explicitMember"):
            dims[m.get("dimension")] = (m.text or "").strip()
        ctx[cid] = (st.text if st is not None else None, en.text if en is not None else (ins.text if ins is not None else None), dims)
    facts = []
    for el in root:
        tag = el.tag
        if not tag.startswith("{") or el.get("contextRef") is None: continue
        name = tag.split("}")[1]
        if not KEEP.search(name): continue
        try: v = float(el.text)
        except (TypeError, ValueError): continue
        st, en, dims = ctx.get(el.get("contextRef"), (None, None, {}))
        prefix = tag.split("}")[0][1:]
        facts.append({"concept": name, "ns": prefix.rsplit("/", 1)[-1][:40], "start": st, "end": en, "dims": dims,
                      "value": v, "form": form, "accn": acc})
    return facts

def main():
    fl = filings()
    print(f"10-Q/10-K {len(fl)}건", flush=True)
    allf = []
    for date, form, acc in fl:
        u = instance_url(acc)
        if not u:
            print("  인스턴스 없음", date, form, acc, flush=True); continue
        x = get(u)
        if not x: continue
        f = parse(x, form, acc)
        segs = sorted({m for ff in f for m in ff["dims"].values()})
        print(f"{date} {form} {acc} facts {len(f)} members {len(segs)}", flush=True)
        allf += f
    members = sorted({(a, m) for ff in allf for a, m in ff["dims"].items()})
    print("=== 축·멤버 목록 ===")
    for a, m in members: print(" ", a, m)
    OUT.write_text(json.dumps({"generated": time.strftime("%Y-%m-%d"), "facts": allf}, ensure_ascii=False, separators=(",", ":")))
    print("저장", OUT, len(allf), flush=True)

if __name__ == "__main__":
    main()
