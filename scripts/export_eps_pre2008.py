"""
export_eps_pre2008.py — SEC 전자 데이터(XBRL, 2008년 무렵~) 이전의 연도별 EPS를 10-K 원문에서 읽어 채움

방법:
  1. 10-K의 '최근 5년 주요 재무 요약(Selected Financial Data)' 표에서 희석 EPS 행을 찾는다.
     (본문에 없으면 연차보고서 첨부(EX-13)에서 찾는다)
  2. 4년 간격으로 보고서를 골라 1995년까지 거슬러 올라간다.
  3. 이미 확인된 값(XBRL 또는 바로 앞 단계)과 겹치는 해를 비교해 비율이 일정할 때만 채택한다.
     겹치는 해의 비율로 나눠 주식 분할도 함께 보정한다. 회사가 부르는 회계연도와
     우리 표기(1~3월 결산은 전년도)의 1년 차이도 겹치는 해로 판별한다.

출력: web/public/data/fundamentals/{KEY}.json 에 "epsOld": {연도: EPS}, "epsOldSrc" 추가
실행: GitHub Actions 'SEC 이전 EPS 채우기' (workflow_dispatch, 입력 tickers — 비우면 전 종목)
"""
import json
import re
import sys
import time
from html import unescape
from pathlib import Path

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent.parent
OUT = ROOT / "web" / "public" / "data" / "fundamentals"
UA = {"User-Agent": "justkeepbuyingtqqq research research@example.com"}
FORMS = {"10-K", "10-K405", "10-KT", "10-K/A"}
YEAR_RE = re.compile(r"(?<!\d)(19[89]\d|20[0-2]\d)(?!\d)")
NUM_RE = re.compile(r"^\(?-?\$?\s*\(?\d{0,3}(?:,\d{3})*\.\d+\)?$|^\(?-?\$?\s*\d+\.\d+\)?$")


def get(url, tries=4):
    for i in range(tries):
        try:
            r = requests.get(url, headers=UA, timeout=60)
            time.sleep(0.12)
            if r.status_code == 200:
                return r
            if r.status_code == 404:
                return None
        except requests.RequestException:
            pass
        time.sleep(2 * (i + 1))
    return None


def load_cik_map():
    r = get("https://www.sec.gov/files/company_tickers.json")
    return {v["ticker"].upper(): int(v["cik_str"]) for v in r.json().values()}


def list_10k(cik):
    """(접수일, accession, 주 문서명) 목록 — 오래된 공시 파일까지 포함."""
    r = get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json")
    if not r:
        return []
    j = r.json()
    blocks = [j["filings"]["recent"]]
    for f in j["filings"].get("files", []):
        rr = get(f"https://data.sec.gov/submissions/{f['name']}")
        if rr:
            blocks.append(rr.json())
    out = []
    for b in blocks:
        for form, date, accn, doc in zip(b["form"], b["filingDate"], b["accessionNumber"], b["primaryDocument"]):
            if form in FORMS and "1996-01-01" <= date <= "2011-12-31":
                out.append((date, accn, doc, form))
    out.sort(reverse=True)
    return out


def filing_docs(cik, accn):
    """공시 색인에서 10-K 본문과 EX-13(연차보고서) 문서 주소."""
    nodash = accn.replace("-", "")
    base = f"https://www.sec.gov/Archives/edgar/data/{cik}/{nodash}/"
    r = get(base + f"{accn}-index.htm")
    docs = []
    if r:
        soup = BeautifulSoup(r.text, "html.parser")
        for tr in soup.select("table.tableFile tr"):
            tds = tr.find_all("td")
            if len(tds) < 4:
                continue
            a = tds[2].find("a")
            typ = tds[3].get_text(strip=True).upper()
            if a and (typ.startswith("10-K") or typ.startswith("EX-13")):
                href = a.get("href", "")
                if href.endswith((".htm", ".html", ".txt")):
                    docs.append("https://www.sec.gov" + href if href.startswith("/") else base + href)
    if not docs:  # 옛날 공시: 전체 제출 텍스트 하나
        docs.append(base + f"{accn}.txt")
    return docs


def parse_num(s):
    s = s.replace("$", "").replace(",", "").replace(" ", "").strip()
    if not s or s in ("-", "—", "–"):
        return None
    neg = s.startswith("(") and s.endswith(")") or s.startswith("-")
    s = s.strip("()-")
    try:
        v = float(s)
    except ValueError:
        return None
    return -v if neg else v


def label_score(label):
    """EPS 행일 가능성 점수 (높을수록 좋음). 0이면 EPS 행 아님."""
    l = label.lower()
    if "dividend" in l or "book value" in l or "shares" in l and "per" not in l:
        return 0
    s = 0
    if "diluted" in l or "assuming dilution" in l or "fully diluted" in l:
        s += 3
    elif "basic" in l or "primary" in l:
        s += 1
    if "per share" in l or "per common share" in l or "eps" in l:
        s += 1
    if "net income" in l or "net earnings" in l or "net (loss) income" in l or "net income (loss)" in l:
        s += 2
    if "continuing" in l or "before" in l or "operating" in l or "adjusted" in l or "pro forma" in l:
        s -= 2
    return s


def rows_from_html(html):
    soup = BeautifulSoup(html, "html.parser")
    for t in soup.find_all("table"):
        rows = []
        for tr in t.find_all("tr"):
            cells = [unescape(td.get_text(" ", strip=True)) for td in tr.find_all(["td", "th"])]
            cells = [c for c in cells if c and c not in ("$", ")", "%")]
            if cells:
                rows.append(cells)
        if rows:
            yield rows


def rows_from_text(text):
    """고정폭 텍스트 표: 빈 줄로 나뉜 블록을 표로 보고, 2칸 이상 공백으로 칸을 나눈다."""
    block = []
    for line in text.splitlines() + [""]:
        if line.strip():
            block.append(line)
            continue
        if len(block) >= 3:
            yield [[c for c in re.split(r"\s{2,}", ln.strip()) if c and c not in ("$",)] for ln in block]
        block = []


def find_eps(rows):
    """표에서 (연도 목록, EPS 값 목록, 점수). 연도 머리줄 아래 EPS 행을 찾는다."""
    best = None
    years = None
    for cells in rows:
        ys = [int(m) for c in cells for m in YEAR_RE.findall(c)]
        # 머리줄: 서로 다른 연도 4개 이상, 연속(1년 간격)
        if len(ys) >= 4 and len(set(ys)) == len(ys) and all(abs(a - b) == 1 for a, b in zip(ys, ys[1:])):
            years = ys
            continue
        if not years or not cells:
            continue
        label = cells[0]
        sc = label_score(label)
        if sc <= 0:
            continue
        nums = [parse_num(c) for c in cells[1:]]
        nums = [n for n in nums if n is not None]
        if len(nums) < len(years):
            continue
        vals = nums[: len(years)]
        if any(abs(v) > 200 for v in vals):
            continue
        cand = (years, vals, sc)
        if best is None or sc > best[2]:
            best = cand
    return best


def eps_from_filing(cik, accn):
    best = None
    for url in filing_docs(cik, accn):
        r = get(url)
        if not r:
            continue
        txt = r.text
        is_html = "<tr" in txt.lower()
        if not is_html:  # 옛날 SGML 텍스트: 표 표시 태그 제거
            txt = re.sub(r"</?(TABLE|CAPTION|S|C|FN|PAGE)>", "", txt, flags=re.I)
        tables = rows_from_html(txt) if is_html else rows_from_text(txt)
        for rows in tables:
            f = find_eps(rows)
            if f and (best is None or f[2] > best[2] or (f[2] == best[2] and len(f[0]) > len(best[0]))):
                best = f
    if not best:
        return None
    return {y: v for y, v in zip(best[0], best[1])}


def reconcile(found, known):
    """found(회사 표기 연도)를 known(확정 값)에 맞춤: 연도 차이(0/−1)와 분할 비율을 겹치는 해로 판별."""
    for shift in (0, -1):
        f2 = {y + shift: v for y, v in found.items()}
        ov = [y for y in f2 if y in known and f2[y] and known[y] and abs(known[y]) > 0.005]
        if len(ov) < 1:
            continue
        ratios = [known[y] / f2[y] for y in ov]
        if any(r <= 0 for r in ratios):
            continue
        med = sorted(ratios)[len(ratios) // 2]
        if not all(abs(r / med - 1) < 0.04 for r in ratios):
            continue
        if len(ov) == 1:  # 겹치는 해가 하나면 비율이 1 또는 흔한 분할 비율일 때만
            ok = any(abs(med * k - 1) < 0.03 for k in (1, 2, 3, 4, 5, 6, 8, 10, 1.5, 1.25, 2.5, 1 / 1.5))
            if not ok:
                continue
        return {y: v * med for y, v in f2.items() if y not in known}, len(ov)
    return None, 0


def process(key, cik):
    path = OUT / f"{key}.json"
    d = json.loads(path.read_text())
    known = {int(y): v for y, v in d["eps"].items() if v is not None}
    if not known:
        return
    first = min(known)
    if first <= 1995:
        return
    filings = list_10k(cik)
    if not filings:
        print(f"  {key}: 10-K 목록 없음", flush=True)
        return
    added = {}
    target = first  # 이 해보다 이전을 채우는 중
    tried = set()
    while target > 1995:
        # 회계연도 target 무렵 끝난 보고서(접수는 그다음 해) 중 가장 가까운 것부터
        cands = [f for f in filings if f[1] not in tried and int(f[0][:4]) in (target + 1, target + 2, target)]
        got = False
        for date, accn, doc, form in cands[:3]:
            tried.add(accn)
            found = eps_from_filing(cik, accn)
            if not found:
                print(f"  {key}: {date} {form} 표 못 찾음", flush=True)
                continue
            base = {**known, **added}
            new, nov = reconcile(found, base)
            if not new:
                print(f"  {key}: {date} 겹치는 해 불일치 {found}", flush=True)
                continue
            new = {y: v for y, v in new.items() if 1995 <= y < target + 1}
            if not new:
                continue
            added.update(new)
            print(f"  {key}: {date} 채택 (겹침 {nov}) → {sorted(new.items())}", flush=True)
            got = True
            break
        if not got:
            break
        target = min(added)
    if added:
        d["epsOld"] = {str(y): round(v, 3) for y, v in sorted(added.items())}
        d["epsOldSrc"] = "SEC 10-K 원문의 5년 요약 표(희석 EPS), 겹치는 해로 분할·연도 보정"
        path.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")))


def main():
    only = set(sys.argv[1:])
    keys = sorted(f.stem for f in OUT.glob("*.json") if not f.stem.startswith("_"))
    if only:
        keys = [k for k in keys if k in only]
    cik_map = load_cik_map()
    for i, k in enumerate(keys, 1):
        d = json.loads((OUT / f"{k}.json").read_text())
        if d.get("metrics", {}).get("stale"):
            continue
        t = d["ticker"].replace(".", "-").upper()
        cik = cik_map.get(t) or cik_map.get(t.replace("-", "."))
        if k == "BRKB":
            continue  # A주 기준 공시라 별도 환산 필요
        print(f"[{i}/{len(keys)}] {k}", flush=True)
        if not cik:
            continue
        try:
            process(k, cik)
        except Exception as e:
            print(f"  {k}: 오류 {e}", flush=True)


if __name__ == "__main__":
    main()
