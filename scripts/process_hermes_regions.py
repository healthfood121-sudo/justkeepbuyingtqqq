"""에르메스 보도자료 텍스트(scripts/data/hermes_releases/*.txt) → 지역별 분기 매출 JSON.
각 보도자료의 '지역별 매출' 표(분기 또는 누적)를 읽어, 분기별 매출(백만 유로)과 1년 전 대비 성장률(발표 기준·환율 영향 제외)을 모은다.
같은 분기가 여러 보도자료에 나오면 최신 보도자료 값을 쓴다(재작성 반영). 성장률은 그 분기를 처음 발표한 보도자료 값.
결과: web/public/data/hermes_regions.json
"""
import json, re
from pathlib import Path
from datetime import date
SRC = Path(__file__).resolve().parent / "data" / "hermes_releases"
OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "hermes_regions.json"
ROWS = [("FR", r"France"), ("EU", r"Europe \(excl\.? ?France\)|Europe excl(?:uding|\.) France"), ("EUT", r"Total Europe"),
        ("JP", r"Japan"), ("APAC", r"Asia[- ]Pacific \(excl\.? ?Japan\)|Asia[- ]Pacific excl(?:uding|\.) Japan|Asia excl(?:uding|\.) Japan"),
        ("ASIA", r"Total Asia"), ("AM", r"Americas"), ("OTH", r"Other(?: \(Middle East\))?"), ("TOT", r"TOTAL|Total")]
NUM = r"\(?-?[\d,\.]+\)?%?\)?"
def num(s):
    s = s.strip(); neg = s.startswith("(") or s.startswith("-")
    v = float(s.strip("()%-").replace(",", "")); return -v if neg else v

def period_of(h):
    h = h.lower()
    for k, q in [("1st quarter", "Q1"), ("first quarter", "Q1"), ("2nd quarter", "Q2"), ("second quarter", "Q2"), ("3rd quarter", "Q3"), ("third quarter", "Q3"),
                 ("4th quarter", "Q4"), ("fourth quarter", "Q4"), ("end of march", "Q1"), ("first half", "H1"), ("end of june", "H1"), ("june 30", "H1"),
                 ("end of september", "9M"), ("sept", "9M"), ("dec. 31", "FY"), ("dec 31", "FY"), ("end of december", "FY"), ("full year", "FY")]:
        if k in h: return q
    return None

recs = []  # (rel_date, period, year, region -> (cur, prev, pub, cc))
for f in sorted(SRC.glob("*.txt")):
    m = re.search(r"(20\d{6})", f.name)
    if not m: continue
    rd = m.group(1)
    L = [re.sub(r"(?<=[\d)])\s+%", "%", l) for l in f.read_text(errors="ignore").splitlines()]
    for i, line in enumerate(L):
        if not re.match(rf"\s*France\s+{NUM}\s+{NUM}", line): continue
        per = yrs = None; skip = False
        for j in range(i - 1, max(-1, i - 15), -1):
            t = L[j]
            if "Report" in t: skip = True; break
            if yrs is None:
                ys = re.findall(r"\b(20\d\d)\b", t)
                if len(ys) >= 2: yrs = ys
            if per is None and not re.search(r"REMINDER", t): per = period_of(t)
            if re.search(r"REMINDER", t) and per is None: per = period_of(t)
            if per and yrs: break
        if skip or not per or not yrs: continue
        y = int(yrs[0]); row = {}
        for l in L[i:i + 14]:
            for k, pat in ROWS:
                mm = re.match(rf"\s*(?:{pat})\s+({NUM})\s+({NUM})\s+({NUM})\s+({NUM})(?:\s+{NUM})?\s*$", l)
                if mm:
                    if k not in row: row[k] = tuple(num(x) for x in mm.groups())
                    break
            if "TOT" in row: break
        if len(row) >= 8: recs.append((rd, per, y, row))
for r in recs: print("REC", r[0], r[1], r[2], r[3]["TOT"][:2])

# 분기 값 만들기: Q1, Q2, Q3, Q4 직접 + (H1−Q1 → Q2), (9M−H1 → Q3), (FY−9M → Q4)
Q = {}  # (year, q) -> {region: rev}; G = 성장률(발표, 환율 제외)
G = {}
for rd, per, y, row in sorted(recs):
    for yy, idx in [(y, 0), (y - 1, 1)]:
        if per in ("Q1", "Q2", "Q3", "Q4"):
            Q[(yy, per)] = {k: v[idx] for k, v in row.items()}
    if per in ("Q1", "Q2", "Q3", "Q4") and (y, per) not in G:
        G[(y, per)] = {k: (v[2], v[3]) for k, v in row.items()}
cum = {}
for rd, per, y, row in sorted(recs):
    if per in ("H1", "9M", "FY"):
        for yy, idx in [(y, 0), (y - 1, 1)]:
            cum[(yy, per)] = {k: v[idx] for k, v in row.items()}
for (yy, per), v in list(cum.items()):
    prev = {"H1": "Q1", "9M": "H1", "FY": "9M"}[per]; tgt = {"H1": "Q2", "9M": "Q3", "FY": "Q4"}[per]
    base = Q.get((yy, "Q1")) if prev == "Q1" else cum.get((yy, prev))
    if base and (yy, tgt) not in Q:
        Q[(yy, tgt)] = {k: round(v[k] - base[k], 1) for k in v if k in base}
rows = []
for (yy, q) in sorted(Q):
    if yy < 2018: continue
    rows.append({"q": f"{yy} {q}", "rev": Q[(yy, q)], "g": {k: {"pub": a, "cc": b} for k, (a, b) in G.get((yy, q), {}).items()}})
OUT.write_text(json.dumps({"generated": date.today().isoformat(), "unit": "백만 유로", "regions": [r[0] for r in ROWS], "quarters": rows}, ensure_ascii=False, indent=1))
for r in rows: print(r["q"], r["rev"].get("APAC"), r["rev"].get("AM"), r["rev"].get("TOT"), (r["g"].get("APAC") or {}).get("cc"))
