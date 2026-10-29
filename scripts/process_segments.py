"""segments_raw/{KEY}.json.gz → web/public/data/segments/{KEY}.json (사업부·지역·제품별 분기 매출, 사업부 영업이익).

- 분기 값: 80~100일 기간 값. 없으면 연간 − 9개월, 반기 − 1분기, 9개월 − 반기(시작일 같은 것끼리).
- 같은 기간·항목이 여러 공시에 있으면 최신 공시 값(재작성 반영).
- 축(차원)마다 최근 4분기 합이 회사 전체 매출과 맞는(±2.5%) 멤버 조합을 찾는다(겹치는 멤버 제거). 못 찾으면 partial 표시.
- 축 종류: geo(지역) / seg(사업부) / prod(제품·서비스) / other.
사용: python scripts/process_segments.py [KEY ...]
"""
import gzip, json, re, sys
from datetime import date
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "scripts" / "data" / "segments_raw"
OUT = ROOT / "web" / "public" / "data" / "segments"; OUT.mkdir(parents=True, exist_ok=True)
REV_PRI = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "RevenueFromContractWithCustomerIncludingAssessedTax",
           "SalesRevenueNet", "SalesRevenueGoodsNet", "RevenuesNetOfInterestExpense", "RevenueNet"]
OI = ["OperatingIncomeLoss", "SegmentOperatingIncomeLoss", "EarningsBeforeInterestAndTaxes"]
NEUTRAL = {("us-gaap:ConsolidationItemsAxis", "us-gaap:OperatingSegmentsMember"), ("srt:ConsolidationItemsAxis", "srt:OperatingSegmentsMember"),
           ("srt:ConsolidationItemsAxis", "us-gaap:OperatingSegmentsMember")}
KO = [("UnitedStates", "미국"), ("US", "미국"), ("Us", "미국"), ("Domestic", "미국"), ("NonUs", "미국 외"), ("Americas", "미주"), ("NorthAmerica", "북미"), ("LatinAmerica", "중남미"), ("SouthAmerica", "남미"),
      ("Canada", "캐나다"), ("Mexico", "멕시코"), ("EuropeMiddleEastAndAfrica", "유럽·중동·아프리카"), ("Emea", "유럽·중동·아프리카"), ("Europe", "유럽"),
      ("GreaterChina", "중화권"), ("China", "중국"), ("Japan", "일본"), ("RestOfAsiaPacific", "기타 아시아태평양"), ("AsiaPacific", "아시아태평양"),
      ("Asia", "아시아"), ("International", "해외"), ("Foreign", "해외"), ("Other", "기타"), ("UnitedKingdom", "영국"), ("Germany", "독일"),
      ("France", "프랑스"), ("India", "인도"), ("Korea", "한국"), ("Taiwan", "대만"), ("Australia", "호주")]

def days(s, e): return (date.fromisoformat(e) - date.fromisoformat(s)).days

def axis_kind(ax):
    a = ax.split(":")[-1]
    if "Geograph" in a or "Region" in a or "Countr" in a: return "geo"
    if "ProductOrService" in a or "Product" in a: return "prod"
    if "BusinessSegment" in a or "Segment" in a: return "seg"
    return "other"

def label(mem):
    m = mem.split(":")[-1]; m = re.sub(r"(Segment|Reportable|Operating)?Member$", "", m); m = re.sub(r"Segment$", "", m)
    for en, ko in KO:
        if m.replace("And", "") == en.replace("And", "") or m == en: return ko
    return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", m).strip()

def quarterize(series):
    """{(start,end): v} → {end: v} 분기 값"""
    q = {e: v for (s, e), v in series.items() if 80 <= days(s, e) <= 115}
    by_start = {}
    for (s, e), v in series.items(): by_start.setdefault(s, []).append((days(s, e), e, v))
    for s, lst in by_start.items():
        lst.sort()
        def find(lo, hi): return [(d, e, v) for d, e, v in lst if lo <= d <= hi]
        q1, h1, m9, fy = find(80, 115), find(160, 200), find(250, 290), find(355, 375)
        if h1 and q1 and h1[0][1] not in q: q[h1[0][1]] = h1[0][2] - q1[0][2]
        if m9 and h1 and m9[0][1] not in q: q[m9[0][1]] = m9[0][2] - h1[0][2]
        if fy and m9 and fy[0][1] not in q: q[fy[0][1]] = fy[0][2] - m9[0][2]
    return q

def process(key):
    d = json.loads(gzip.decompress((RAW / f"{key}.json.gz").read_bytes()))
    facts = sorted(d["facts"], key=lambda f: f[5])  # 공시 번호순 → 최신이 덮어씀
    S = {}  # (concept, dimkey) → {(s,e): v}
    for c, s, e, dims, v, acc in facts:
        dk = tuple(sorted((a, m) for a, m in dims.items() if (a, m) not in NEUTRAL))
        if len(dk) > 2: continue
        S.setdefault((c, dk), {})[(s, e)] = v
    # 회사 전체 매출
    tot_c = None; tot = {}; cands = []
    for c in REV_PRI + sorted({c for c, dk in S if not dk and re.search("Revenue|Sales", c)}):
        if (c, ()) in S:
            qq = quarterize(S[(c, ())])
            if qq: cands.append((len(qq), qq[max(qq)], c, qq))
    if cands:
        last = max(max(x[3]) for x in cands)
        cands = [x for x in cands if days(max(x[3]), last) <= 120]  # 최근까지 이어지는 항목만(항목 이름이 바뀐 경우)
        mx = max(x[0] for x in cands)
        ok = [x for x in cands if x[0] >= min(8, mx)]  # 충분히 긴 것 중 가장 큰 값(은행 등 부분 매출 항목 배제)
        _, _, tot_c, tot = max(ok, key=lambda x: x[1])
        # 항목 이름이 중간에 바뀐 경우: 같은 날짜에 값이 없으면 다른 항목 값으로 앞쪽을 채운다
        for x in sorted(cands, key=lambda x: -x[0]):
            for e, v in x[3].items():
                if e not in tot and all(abs(days(e, k)) > 7 for k in tot) and abs(v / tot[max(tot)] - 1) < 0.6: tot[e] = v
    if not tot: return None
    ends = sorted(tot)[-20:]
    def near(qd, e):  # 끝 날짜가 며칠 다른 경우(52·53주 회계연도)
        if e in qd: return qd[e]
        for k, v in qd.items():
            if abs(days(k, e)) <= 7: return v
        return None
    axes = {}  # (축, 함께 붙은 다른 차원) → 종류 → 항목 → 멤버 → 분기 값
    for (c, dk), ser in S.items():
        if not dk: continue
        if not re.search("Revenue|Sales|NetInterestIncome|PremiumsEarned", c) and c not in OI: continue
        kind = "oi" if c in OI else "rev"
        pairs = [(dk[0], dk[1]), (dk[1], dk[0])] if len(dk) == 2 else [(dk[0], None)]
        for (ax, mem), qual in pairs:
            if qual and re.search("SalesChannel", qual[0]): continue
            axes.setdefault((ax, qual), {}).setdefault(kind, {}).setdefault(c, {})[mem] = quarterize(ser)
    res = []
    last4 = ends[-4:]; T4 = sum(tot[e] for e in last4)
    for (ax, qual), kinds in axes.items():
        if "rev" not in kinds: continue
        # 멤버 커버리지가 가장 넓은 매출 항목
        c_best = max(kinds["rev"], key=lambda c: sum(1 for m, qd in kinds["rev"][c].items() for e in ends if near(qd, e) is not None))
        pool = dict(kinds["rev"][c_best])
        if qual:  # 하위 구분(예: 브랜드 안의 지역) + 같은 축의 다른 사업부(예: 컨버스·힐스)를 합쳐 전체를 맞춘다
            for m, qd in axes.get((qual[0], None), {}).get("rev", {}).get(c_best, {}).items():
                if m != qual[1] and m not in pool: pool[m] = qd
        mems = {m: qd for m, qd in pool.items() if all(near(qd, e) is not None for e in last4)}
        mems = {m: qd for m, qd in mems.items() if not re.search(r"Total|Consolidat|Elimination|Intersegment|Corporate", m)}
        if len(mems) < 2: continue
        sums = {m: sum(near(qd, e) for e in last4) for m, qd in mems.items()}
        names = sorted(mems, key=lambda m: -sums[m])[:14]
        best = None
        for r in range(len(names), 1, -1):
            for comb in combinations(names, r):
                if abs(sum(sums[m] for m in comb) / T4 - 1) <= 0.025:
                    best = comb; break
            if best: break
            if r < len(names) - 5: break
        partial = best is None
        chosen = list(best) if best else names
        oi = kinds.get("oi", {})
        oic = max(oi, key=lambda c: len(oi[c])) if oi else None
        members = []
        for m in sorted(chosen, key=lambda m: -sums[m]):
            members.append({"id": m, "name": label(m), "rev": [near(mems[m], e) for e in ends],
                            "oi": [near(oi[oic][m], e) for e in ends] if oic and m in oi[oic] else None})
        sh = sum(sums[m] for m in chosen) / T4
        own = sum(sums[m] for m in chosen if m in kinds["rev"][c_best]) / T4
        if qual and own < 0.6: continue  # 작은 사업부 안의 지역 + 다른 사업부를 섞은 조합은 버림
        if partial and (sh < 0.5 or sh > 1.05 or (qual and sh < 0.85)): continue
        if re.search("TimingOfTransfer|RevenueRecognition|Measurement", ax): continue
        chosen = [m for m in chosen if sums[m] > 0]
        if len(chosen) < 2: continue
        kind = axis_kind(ax)
        GEO = r"America|Europe|EMEA|China|Asia|Japan|Pacific|International|Domestic|UnitedStates|Canada|Mexico|Countr|Africa|MiddleEast|Foreign|NonUs|Region"
        if kind in ("seg", "other") and sum(1 for m in chosen if re.search(GEO, m.split(":")[-1])) >= max(2, len(chosen) - 1): kind = "geo"
        res.append({"axis": ax, "qual": qual[1] if qual else None, "kind": kind, "concept": c_best, "partial": partial, "share4": round(sum(sums[m] for m in chosen) / T4, 3), "members": members})
    pref = {"geo": 0, "seg": 1, "prod": 2, "other": 3}
    res.sort(key=lambda a: (a["partial"], pref[a["kind"]], a["qual"] is not None, -len(a["members"])))
    full = {a["axis"] for a in res if not a["qual"] and not a["partial"]}
    res = [a for a in res if not (a["qual"] and a["axis"] in full)]
    # 같은 축·같은 멤버 조합 중복 제거
    seen, uniq = set(), []
    for a in res:
        k = tuple(sorted(m["id"] for m in a["members"]))
        if k in seen: continue
        seen.add(k); uniq.append(a)
    res = uniq
    out = {"key": key, "ticker": d.get("ticker"), "generated": date.today().isoformat(), "unit": "백만 달러",
           "ends": ends, "total": [round(tot[e] / 1e6, 1) for e in ends], "totalConcept": tot_c, "axes": []}
    for a in res:
        for m in a["members"]:
            m["rev"] = [None if v is None else round(v / 1e6, 1) for v in m["rev"]]
            if m["oi"]: m["oi"] = [None if v is None else round(v / 1e6, 1) for v in m["oi"]]
        out["axes"].append(a)
    (OUT / f"{key}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    return out

if __name__ == "__main__":
    keys = sys.argv[1:] or sorted(p.name[:-8] for p in RAW.glob("*.json.gz"))
    for k in keys:
        o = process(k)
        if not o: print(k, "매출 없음"); continue
        print(k, len(o["ends"]), o["ends"][-1], "total", o["total"][-1])
        for a in o["axes"]:
            print("  ", a["kind"], a["axis"].split(":")[-1], a["qual"] or "", "partial" if a["partial"] else "", a["share4"], [(m["name"], m["rev"][-1]) for m in a["members"]][:8])
