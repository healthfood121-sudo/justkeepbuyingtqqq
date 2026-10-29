"""nike_segments_raw.json → nike_segments.json (지역별 분기 매출·EBIT·도매/직판, 회사 전체 매출·매출총이익).
4분기 = 연간(10-K) − 9개월 누적(3분기 10-Q). 단위: 백만 달러.
"""
import json
from datetime import date
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent / "web" / "public" / "data"
raw = json.load(open(ROOT / "nike_segments_raw.json"))["facts"]

REG = {"NA": "nke:NorthAmericaSegmentMember", "EMEA": "nke:EuropeMiddleEastAndAfricaSegmentMember",
       "GC": "nke:GreaterChinaSegmentMember", "APLA": "nke:AsiaPacificAndLatinAmericaSegmentMember",
       "CONV": "nke:ConverseSegmentMember"}
OK_EXTRA = {"us-gaap:OperatingSegmentsMember", "nke:NIKEBrandMember"}
CH = {"wholesale": "nke:SalesChannelWholesaleMember", "direct": "us-gaap:SalesChannelDirectlyToConsumerMember"}
REV = ("RevenueFromContractWithCustomerExcludingAssessedTax", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet", "Revenues")

def days(f): return (date.fromisoformat(f["end"]) - date.fromisoformat(f["start"])).days if f["start"] else None

def pick(region, concept_ok, channel=None, total=False):
    """(start,end) → 값. 최신 공시 우선."""
    out = {}
    for f in sorted(raw, key=lambda f: f["accn"]):
        if not concept_ok(f["concept"]) or not f["start"]: continue
        ms = set(f["dims"].values()); axes = set(f["dims"].keys())
        if any("ProductOrService" in a for a in axes): continue
        if total:
            if ms - {"us-gaap:OperatingSegmentsMember"} and ms: continue
            if ms and ms != {"us-gaap:OperatingSegmentsMember"}: continue
            if ms: continue  # 회사 전체 = 차원 없음
        else:
            if REG[region] not in ms: continue
            rest = ms - {REG[region]}
            if channel:
                if CH[channel] not in rest: continue
                rest -= {CH[channel]}
            elif any("SalesChannel" in a for a in axes): continue
            if rest - OK_EXTRA: continue
        out[(f["start"], f["end"])] = f["value"] / 1e6
    return out

def quarters(series):
    """분기 값 사전: 회계연도 분기 끝날짜 → 값."""
    q = {k[1]: v for k, v in series.items() if 80 <= days({"start": k[0], "end": k[1]}) <= 100}
    ytd9 = {k[1]: v for k, v in series.items() if 260 <= days({"start": k[0], "end": k[1]}) <= 280}
    fy = {k[1]: (k[0], v) for k, v in series.items() if 355 <= days({"start": k[0], "end": k[1]}) <= 375}
    for end, (start, v) in fy.items():
        # 같은 회계연도의 9개월 누적(시작일 같음)
        m = [vv for (s, e), vv in series.items() if s == start and 260 <= days({"start": s, "end": e}) <= 280]
        if m and end not in q: q[end] = v - m[0]
    return q

def fyq(end):
    d = date.fromisoformat(end); m = d.month
    qi = {8: 1, 9: 1, 11: 2, 12: 2, 2: 3, 3: 3, 5: 4, 6: 4}[m]
    fy = d.year + (1 if m >= 6 else 0)
    return f"FY{str(fy)[2:]} Q{qi}"

is_rev = lambda c: c in REV
is_ebit = lambda c: c == "EarningsBeforeInterestAndTaxes"
out = {"generated": date.today().isoformat(), "unit": "백만 달러", "regions": {}, "total": []}
for r in REG:
    rev = quarters(pick(r, is_rev)); ebit = quarters(pick(r, is_ebit))
    wh = quarters(pick(r, is_rev, "wholesale")); di = quarters(pick(r, is_rev, "direct"))
    rows = []
    for end in sorted(rev):
        rows.append({"q": fyq(end), "end": end, "rev": round(rev[end], 1),
                     "ebit": round(ebit[end], 1) if end in ebit else None,
                     "wholesale": round(wh[end], 1) if end in wh else None,
                     "direct": round(di[end], 1) if end in di else None})
    out["regions"][r] = [x for x in rows if x["end"] >= "2018-08-01"]
tot = quarters(pick(None, is_rev, total=True)); gp = quarters(pick(None, lambda c: c == "GrossProfit", total=True))
out["total"] = [{"q": fyq(e), "end": e, "rev": round(tot[e], 1), "gp": round(gp[e], 1) if e in gp else None} for e in sorted(tot) if e >= "2018-08-01"]
# 2026 회계연도 10-K 연간 수치가 분기(10-Q)와 다른 기준으로 재분류된 것으로 보여, 연간−9개월로 구한 4분기 값이 비정상(매출총이익률 49%, 북미 EBIT 20억)
# → 해당 값은 비운다. 매출은 정상(지역 합 = 회사 전체).
BAD = {("total", "FY26 Q4", "gp"), ("NA", "FY26 Q4", "ebit")}
for x in out["total"]:
    if ("total", x["q"], "gp") in BAD: x["gp"] = None
for r, rows in out["regions"].items():
    for x in rows:
        if (r, x["q"], "ebit") in BAD: x["ebit"] = None
out["note"] = "FY26 Q4 회사 매출총이익·북미 EBIT은 10-K 재분류로 분기 역산이 불가해 null"
(ROOT / "nike_segments.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
for r, rows in out["regions"].items():
    print(r, len(rows), [(x["q"], round(x["rev"])) for x in rows[-6:]])
print("total", len(out["total"]), [(x["q"], round(x["rev"]), x["gp"] and round(x["gp"])) for x in out["total"][-5:]])
