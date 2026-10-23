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
import warnings
import sys
import time
from html import unescape
from pathlib import Path

import pandas as pd
import requests
import yfinance as yf
from bs4 import BeautifulSoup

warnings.filterwarnings("ignore")

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
                out.append((date, accn, doc, form, cik))
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
    s = re.sub(r"\((?:[a-zA-Z]|\d{1,2})\)$|\*+$", "", s.strip())  # 각주 표시 (1) (a) * 제거
    if "." not in s:  # EPS는 소수점이 있는 숫자만 (각주 번호·연도·퍼센트 오인 방지)
        return None
    s = s.replace("$", "").replace(",", "").replace(" ", "").strip()
    if not s or s in ("-", "—", "–"):
        return None
    neg = s.startswith("(") or s.startswith("-")  # 닫는 괄호가 다음 칸으로 갈라진 경우도 음수
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
    """문서 전체의 표 행을 순서대로 (표 번호, 칸 목록)."""
    soup = BeautifulSoup(html, "html.parser")
    for ti, t in enumerate(soup.find_all("table")):
        for tr in t.find_all("tr"):
            cells = [unescape(td.get_text(" ", strip=True)) for td in tr.find_all(["td", "th"])]
            cells = [c for c in cells if c and c not in ("$", ")", "%", "(")]
            if cells:
                yield cells


def rows_from_text(text):
    """고정폭 텍스트: 줄마다 2칸 이상 공백으로 칸을 나눔."""
    for ln in text.splitlines():
        if ln.strip():
            yield [c for c in re.split(r"\s{2,}", ln.strip()) if c and c not in ("$",)]


DEBUG = bool(__import__("os").environ.get("EPS_DEBUG")) or "--debug" in sys.argv


def find_eps(rows, max_gap=80):
    """연도 머리줄 아래(max_gap 줄 이내) EPS 후보 행들을 점수순으로.
    숫자가 다음 줄로 넘어간 행은 이어 붙이고, 칸 수가 많으면 왼쪽·오른쪽 정렬을 모두 후보로 낸다."""
    cands = []
    years, since = None, 0
    pend = None  # 숫자 없이 끝난 EPS 이름 줄 (점수, 이름)
    recent = []
    for cells in rows:
        since += 1
        recent = (recent + [cells])[-6:]
        # 연도: 짧은 칸 기준 ("Five fiscal years ended September 29, 2007" 같은 설명 칸 제외),
        # 안 되면 전체 칸에서 연속 중복만 지운 것 ("September 29, 2007" 처럼 날짜로 된 머리줄)
        ys_all = [int(m) for c in cells for m in YEAR_RE.findall(c)]
        ys_short = [int(m) for c in cells if len(c.strip()) <= 14 for m in YEAR_RE.findall(c)]
        ys_dedup = [y for i, y in enumerate(ys_all) if i == 0 or y != ys_all[i - 1]]
        ok = lambda v: len(v) >= 3 and len(set(v)) == len(v) and all(abs(a - b) == 1 for a, b in zip(v, v[1:]))
        ys = ys_short if ok(ys_short) else ys_dedup if ok(ys_dedup) else ys_all
        seq = len(set(ys)) == len(ys) and all(abs(a - b) == 1 for a, b in zip(ys, ys[1:])) \
            and not any(parse_num(c) is not None for c in cells)
        # 10년 표처럼 연도 줄이 두 줄로 나뉜 경우 이어 붙임
        if seq and ys and years and since == 1 and len(years) >= 2 \
                and ys[0] == years[-1] + (1 if years[-1] > years[0] else -1):
            years, since, pend = years + ys, 0, None
            continue
        if seq and len(ys) >= 3:
            years, since, pend = ys, 0, None
            continue
        if not years or since > max_gap or not cells:
            if DEBUG and cells and "dilut" in cells[0].lower() and len(cells) > 2:
                print(f"    [디버그] 연도 줄 없음/멂 since={since} 줄{cells[:6]}", flush=True)
            continue
        label = cells[0]
        body = cells[1:]
        if parse_num(label) is not None and pend:  # 이름 없이 숫자만 있는 줄 → 바로 위 이름 줄의 숫자
            sc, label = pend
            body = cells
        else:
            sc = label_score(label)
        pend = None
        if sc <= 0:
            continue
        nums = [parse_num(c) for c in body if not re.fullmatch(r"\((?:[a-zA-Z]|\d{1,2})\)|\*+", c.strip())]
        nums = [n for n in nums if n is not None]
        if not nums:
            pend = (sc, label)
            continue
        n = len(years)
        if not (n <= len(nums) <= n + 3):
            if DEBUG and "dilut" in label.lower():
                print(f"    [디버그] 칸 수 불일치 연도{years} 숫자{nums} 이름«{label}»", flush=True)
            continue
        aligns = [nums[:n]] if len(nums) <= n + 1 else []
        if len(nums) > n:
            aligns.append(nums[-n:])  # 앞쪽에 증가율 칸이 붙은 표
        for vals in aligns:
            if any(abs(v) > 200 for v in vals):
                continue
            cands.append((sc, {y: v for y, v in zip(years, vals)}))
        if DEBUG and "dilut" in label.lower():
            print(f"    [디버그] 후보 연도{years} 숫자{nums} 이름«{label}» 앞줄{[r[:4] for r in recent[-4:-1]]}", flush=True)
    cands.sort(key=lambda c: -c[0])
    return [c[1] for c in cands]


LAST_DIAG = {}


def eps_from_filing(cik, accn):
    """보고서의 EPS 후보들(점수 높은 순)."""
    out = []
    diag = []
    for url in filing_docs(cik, accn):
        r = get(url)
        if not r:
            diag.append(f"{url.rsplit('/', 1)[-1]}:없음")
            continue
        txt = r.text
        low = txt.lower()
        i = low.find("diluted")
        diag.append(f"{url.rsplit('/', 1)[-1]}:{len(txt)//1000}KB tr={'<tr' in low} 희석={i >= 0}"
                    + (f" «{re.sub(r'<[^>]+>|\s+', ' ', txt[max(0, i - 150):i + 250])[:300]}»" if i >= 0 else ""))
        if "<tr" in txt.lower():
            out += find_eps(rows_from_html(txt), max_gap=60)
        else:  # 옛날 SGML 텍스트: 표 표시 태그 제거
            txt = re.sub(r"</?(TABLE|CAPTION|S|C|FN|PAGE)>", "", txt, flags=re.I)
            out += find_eps(rows_from_text(txt), max_gap=80)
    LAST_DIAG["msg"] = " | ".join(diag)
    return out


def split_factor(splits, filed):
    """공시일 이후 일어난 분할 배수의 곱 (예: 2:1 두 번 → 4)."""
    f = 1.0
    t0 = pd.Timestamp(filed)
    for d, r in splits.items():
        t = pd.Timestamp(d)
        if t.tzinfo is not None:
            t = t.tz_localize(None)
        if t > t0 and r > 0:
            f *= float(r)
    return f


def reconcile(found, known, factor):
    """분할 보정 후 겹치는 해가 모두 12% 안, 최소 한 해는 4% 안이면 채택 → (보정된 전체 값, 겹친 해 수).
    회사 연도 표기 차이(0/−1)도 판별."""
    adj = {y: v / factor for y, v in found.items()}
    for shift in (0, -1):
        f2 = {y + shift: v for y, v in adj.items()}
        ov = [y for y in f2 if y in known and known[y] and abs(known[y]) > 0.01]
        if not ov:
            continue
        diffs = [abs(f2[y] / known[y] - 1) for y in ov]
        # 회사가 과거 실적을 재작성한 해가 섞일 수 있어, 겹치는 해의 2/3 이상이 12% 안이면 인정
        need = -(-2 * len(ov) // 3)
        if sum(d < 0.12 for d in diffs) >= need and min(diffs) < 0.04 and max(diffs) < 0.6:
            ref = sum(abs(known[y]) for y in ov) / len(ov)
            rest = [v for y, v in f2.items() if y not in known]
            if sum(1 for v in rest if v < 0) >= 3 or any(abs(v) > 15 * ref for v in rest):
                continue
            return f2, len(ov)
    return None, 0


# 지주사 전환·본사 이전으로 SEC 등록번호가 바뀐 회사: 예전 회사의 등록번호
PREDECESSOR = {
    "GOOGL": 1288776,  # Google Inc. → Alphabet (2015)
    "GOOG": 1288776,
    "DIS": 1001039,    # Walt Disney Co (현 TWDC Enterprises 18) → 새 지주사 (2019)
    "MDT": 64670,      # Medtronic Inc → Medtronic plc (2015)
    "BG": 1144519,     # Bunge Ltd → Bunge Global (2023)
    "APA": 6769,       # Apache Corp → APA Corp (2021)
    "BLK": 1364742,    # BlackRock Inc (구) → 새 지주사 (2024)
    "TPL": 97517,      # Texas Pacific Land Trust → Corp (2021)
    "AVGO": 1441634,   # Avago Technologies → Broadcom (2016)
    "STE": 815065,     # STERIS Corp → STERIS plc
    "ETN": 31277,      # Eaton Corp → Eaton plc (2012)
    "CI": 701221,      # Cigna Corp (구) → 새 Cigna (2018)
    "MRVL": 1058057,   # Marvell Technology Group → Marvell Technology (2021)
    "BKR": 808362,     # Baker Hughes Inc → Baker Hughes Co (2017)
    "ICE": 1174746,    # IntercontinentalExchange Inc → ICE Inc (2013)
    "CHTR": 1091667,   # Charter Communications (구) → 새 Charter (2016)
    "MRK": 64978,      # 원래 Merck & Co (지금 번호는 2009년 합병한 셰링플라우 것)
}
# 지금 번호의 이 날짜 이전 보고서는 다른 회사 것 → 제외
CURRENT_FROM = {"MRK": "2009-11-04"}


def xbrl_eps(cik, first=False):
    """회계연도 종료일 → (EPS, 공시일): 연간(10-K) 희석 EPS.
    first=True면 처음 발표된 값(나중에 실적을 재작성하기 전 값)."""
    best = {}
    for concept in ("EarningsPerShareDiluted", "EarningsPerShareBasicAndDiluted", "EarningsPerShareBasic"):
        r = get(f"https://data.sec.gov/api/xbrl/companyconcept/CIK{cik:010d}/us-gaap/{concept}.json")
        if not r:
            continue
        for unit, items in r.json().get("units", {}).items():
            if "/shares" not in unit:
                continue
            for it in items:
                if it.get("form") not in ("10-K", "10-K/A", "20-F") or not it.get("start"):
                    continue
                days = (pd.Timestamp(it["end"]) - pd.Timestamp(it["start"])).days
                if not 340 <= days <= 390:
                    continue
                prev = best.get(it["end"])
                newer = it["filed"] < prev[1] if (first and prev) else (prev and it["filed"] > prev[1])
                if prev is None or (prev[2] == concept and newer):
                    best[it["end"]] = (float(it["val"]), it["filed"], concept)
        if best:
            break
    return best


def process(key, cik):
    path = OUT / f"{key}.json"
    d = json.loads(path.read_text())
    known = {int(y): v for y, v in d["eps"].items() if v is not None}
    if not known:
        return
    first = min(known)
    if first <= 1995:
        return
    try:
        splits = yf.Ticker(d["ticker"].replace(".", "-")).splits
    except Exception:
        splits = pd.Series(dtype=float)
    added = {}
    pred = PREDECESSOR.get(key)
    if pred:
        # 예전 회사의 XBRL EPS로 2008~전환 전 구간부터 채움 (겹치는 해로 검증)
        raw = xbrl_eps(pred)
        by = {}
        for end, (v, filed, _) in sorted(raw.items()):
            t = pd.Timestamp(end)
            y = t.year - 1 if t.month <= 3 else t.year
            by[y] = v / split_factor(splits, filed)
        new, nov = reconcile(by, known, 1.0)
        if new:
            added.update({y: v for y, v in new.items() if y >= 1995 and y not in known})
            print(f"  {key}: 예전 회사 XBRL 채택 (겹침 {nov}) → {sorted(added.items())}", flush=True)
        else:
            print(f"  {key}: 예전 회사 XBRL 불일치 {sorted(by.items())[-6:]} / 지금 {sorted(known.items())[:4]}", flush=True)
    cur = [f for f in list_10k(cik) if f[0] >= CURRENT_FROM.get(key, "")]
    filings = cur + (list_10k(pred) if pred else [])
    filings = sorted({f[1]: f for f in filings if f[3] != "10-K/A"}.values(), reverse=True)
    base = {**known, **added}
    first_all = min(base)
    filings = [f for f in filings if int(f[0][:4]) <= first_all + 2]
    if not filings:
        print(f"  {key}: 10-K 목록 없음", flush=True)
        return
    # 회사가 실적을 재작성한 경우(예: 애플 2007~2009) 옛 보고서는 처음 발표값과 맞으므로 그것도 대조에 씀
    alt = {}
    for end, (v, filed, _) in xbrl_eps(cik, first=True).items():
        t = pd.Timestamp(end)
        alt[t.year - 1 if t.month <= 3 else t.year] = v / split_factor(splits, filed)
    obs = {}  # 연도 → [(접수일, 값, 겹친 해 수)]
    fails = 0
    for date, accn, doc, form, fcik in filings:
        founds = eps_from_filing(fcik, accn)
        if not founds:
            print(f"  {key}: {date} {form} 표 못 찾음 {LAST_DIAG.get('msg', '')[:400]}", flush=True)
            fails += 1
            if fails >= 6 and not obs:
                break
            continue
        ref = dict(base)
        for y, lst in obs.items():
            ref.setdefault(y, lst[0][1])
        fac = split_factor(splits, date)
        got = None
        for found in founds:  # 통과한 후보 중 연도가 가장 많은 표(5년·10년 표 우선)
            f2, nov = reconcile(found, ref, fac)
            if f2 is None and alt:
                ref_alt = {**ref, **{y: v for y, v in alt.items() if y in known}}
                f2, nov = reconcile(found, ref_alt, fac)
            if f2 is not None and (got is None or (len(f2), nov) > (len(got[0]), got[1])):
                got = (f2, nov)
        if not got:
            print(f"  {key}: {date} 겹치는 해 불일치 (분할 {fac:g}배) 첫 후보 {founds[0]}", flush=True)
            fails += 1
            if fails >= 6 and not obs:
                break
            continue
        f2, nov = got
        fresh = []
        for y, v in f2.items():
            if y in base or not (1995 <= y < first_all):
                continue
            obs.setdefault(y, []).append((date, v, nov))
            fresh.append(y)
        print(f"  {key}: {date} 채택 (겹침 {nov}) → {sorted((y, round(f2[y], 3)) for y in fresh)}", flush=True)
    # 판정: 보고서끼리 7% 안에서 맞는 묶음 중 가장 큰 것(같으면 최근 보고서 쪽). 2개 이상 일치,
    # 또는 보고서가 1개뿐이면 그 보고서가 겹친 해 2개 이상으로 검증됐을 때만 채택
    def close(a, b):
        return (abs(a) < 0.02 and abs(b) < 0.02) or (a != 0 and abs(b / a - 1) < 0.07)
    for y, lst in obs.items():
        lst.sort(reverse=True)
        best = max(([v for _, v, _ in lst if close(c, v)] for _, c, _ in lst), key=len)
        if len(best) >= 2:
            added[y] = best[0]
        elif len(lst) == 1 and lst[0][2] >= 2:
            added[y] = lst[0][1]
        else:
            print(f"  {key}: {y}년 보고서끼리 불일치·근거 부족 {[(d, round(v, 3)) for d, v, _ in lst]}", flush=True)
    # 이상치: 앞뒤 해(2년 안) 모두보다 4배 넘게 혼자 튀거나 꺼진 값은 버림 (끝 해는 이웃 하나와 6배)
    full = {**known, **added}
    for y in sorted([y for y in added if y not in known]):
        v = full.get(y)
        if v is None or v <= 0:
            continue
        nb = [full[z] for z in (y - 1, y + 1, y - 2, y + 2) if z in full and full[z] and full[z] > 0]
        prev = next((full[z] for z in (y - 1, y - 2) if z in full and full[z] and full[z] > 0), None)
        nxt = next((full[z] for z in (y + 1, y + 2) if z in full and full[z] and full[z] > 0), None)
        r = lambda o: max(v / o, o / v)
        bad = (prev and nxt and r(prev) > 4 and r(nxt) > 4 and (v > prev) == (v > nxt)) or \
              (bool(prev) != bool(nxt) and r(prev or nxt) > 6)
        if bad:
            print(f"  {key}: {y}년 이상치 제외 {v:.3f} (앞 {prev}, 뒤 {nxt})", flush=True)
            added.pop(y)
            full.pop(y)
    if added:
        d["epsOld"] = {str(y): round(v, 4) for y, v in sorted(added.items())}
        d["epsOldSrc"] = "SEC 10-K 원문의 5년 요약 표(희석 EPS). 매년 보고서를 대조해 2개 이상 일치한 값, 겹치는 해로 분할·연도 보정"
    else:
        d.pop("epsOld", None)
        d.pop("epsOldSrc", None)
    path.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")))
    print(f"  {key}: 최종 {sorted((y, round(v, 3)) for y, v in added.items())}", flush=True)


def main():
    args = sys.argv[1:]
    shard = next((a for a in args if a.startswith("--shard=")), None)
    only = {a for a in args if not a.startswith("--")}
    keys = sorted(f.stem for f in OUT.glob("*.json") if not f.stem.startswith("_"))
    if only:
        keys = [k for k in keys if k in only]
    if shard:  # 예: --shard=2/4 → 4묶음 중 2번째
        i, n = map(int, shard.split("=")[1].split("/"))
        keys = [k for j, k in enumerate(keys) if j % n == i - 1]
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
