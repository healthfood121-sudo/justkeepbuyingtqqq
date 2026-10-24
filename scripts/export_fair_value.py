"""
export_fair_value.py — 전 종목 '이익 시계' 적정가 재료를 한 파일로 모음 (/private 종목 비교 표의 '적정가 대비' 열용)

이익 시계(page.tsx StockValueClock/ValueClockCore)와 같은 계산:
  - EPS 기준점: SEC 10-K 연간 EPS(결산일) + 그 이전 EPS(epsOld, 롤링 epsDecomp) + 최근 1년 EPS(ttmAsOf)
  - 적정 PER: 마지막 실적 시점 전 20년 월말 PER(= 월말 종가 ÷ 그때 EPS, 기준점 사이는 기하 보간, 200배 이상 제외)의 중간값, 반올림
    (자료 24개월 미만이면 20배)
  - 적정가(오늘) = 마지막 EPS × (1+성장률)^(마지막 실적 이후 경과 연수) × 적정 PER  ← 성장률·오늘 날짜는 화면에서 계산
출력: web/public/data/fundamentals/_fair.json  {asOf, stocks: {KEY: {fairPe, eps, t, price, priceDate}}}
사용: python scripts/export_fair_value.py   (export_fundamentals.py 다음에 실행)
"""
import json, math, datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
FUND = ROOT / "web" / "public" / "data" / "fundamentals"
ROLL = ROOT / "web" / "public" / "data" / "rolling"


def dec_year(s: str) -> float:
    d = datetime.date.fromisoformat(s[:10])
    y0 = datetime.date(d.year, 1, 1)
    return d.year + (d - y0).days / (datetime.date(d.year + 1, 1, 1) - y0).days


def eps_at(anchors, t):
    if t < anchors[0][0]:
        return None
    if t >= anchors[-1][0]:
        return anchors[-1][1]
    for i in range(1, len(anchors)):
        t1, e1 = anchors[i]
        if t <= t1:
            t0, e0 = anchors[i - 1]
            w = (t - t0) / (t1 - t0)
            if e0 > 0 and e1 > 0:
                return math.exp(math.log(e0) * (1 - w) + math.log(e1) * w)
            return e0 + (e1 - e0) * w
    return anchors[-1][1]


def quantile(a, q):
    a = sorted(a)
    i = (len(a) - 1) * q
    lo = math.floor(i)
    return a[lo] + (a[math.ceil(i)] - a[lo]) * (i - lo)


def build(f: dict, rolling: dict | None):
    m = f.get("metrics") or {}
    if not f.get("monthly") or not f.get("epsEnd") or not f.get("lastPrice") or m.get("stale") or m.get("ttmEps") is None:
        return None
    eps, end = f["eps"], f["epsEnd"]
    anchors = sorted((dec_year(end[y]), e) for y, e in eps.items() if e is not None and end.get(y))
    older = {}
    for d in (rolling or {}).get("epsDecomp") or []:
        if d.get("epsBuy") is not None:
            older[d["buyYear"]] = d["epsBuy"]
        if d.get("epsSell") is not None:
            older[d["sellYear"]] = d["epsSell"]
    for y, e in (f.get("epsOld") or {}).items():
        older[int(y)] = e
    first = min(int(y) for y in end)
    if anchors and older:
        mmdd = end[str(first)][4:]
        for y, e in older.items():
            if y < first and e is not None:
                anchors.append((dec_year(f"{y}{mmdd}"), e))
        anchors.sort()
    if len(anchors) < 3:
        return None
    if f.get("ttmAsOf"):
        tT = dec_year(f["ttmAsOf"])
        if tT > anchors[-1][0] + 0.1:
            anchors.append((tT, m["ttmEps"]))
    y0, m0 = map(int, f["monthly"]["start"].split("-"))
    t_last = anchors[-1][0]
    pes = []
    for i, c in enumerate(f["monthly"]["c"]):
        if c is None or c <= 0:
            continue
        t = y0 + (m0 + i) / 12
        if t < anchors[0][0] or t < t_last - 20 or t > t_last:
            continue
        e = eps_at(anchors, t)
        if e and e > 0 and c / e < 200:
            pes.append(c / e)
    fair_pe = round(quantile(pes, 0.5)) if len(pes) >= 24 else 20
    return {"fairPe": fair_pe, "eps": anchors[-1][1], "t": round(t_last, 4),
            "price": f["lastPrice"]["close"], "priceDate": f["lastPrice"]["date"]}


if __name__ == "__main__":
    out = {}
    for p in sorted(FUND.glob("*.json")):
        if p.name.startswith("_"):
            continue
        f = json.loads(p.read_text())
        rp = ROLL / f"{f['key']}_rolling.json"
        r = build(f, json.loads(rp.read_text()) if rp.exists() else None)
        if r:
            out[f["key"]] = r
    path = FUND / "_fair.json"
    path.write_text(json.dumps({"asOf": datetime.date.today().isoformat(), "stocks": out}, ensure_ascii=False, separators=(",", ":")))
    print(f"{len(out)}개 → {path} ({path.stat().st_size // 1024} KB)")
    for k in ["AAPL", "MSFT", "NKE", "KO", "NVDA"]:
        print(k, out.get(k))
