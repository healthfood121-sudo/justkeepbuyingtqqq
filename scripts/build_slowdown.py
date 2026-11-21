"""둔화 판단 페이지 데이터 — 과거 하락장을 유형별로 나누고, 고점·바닥 때 경기 지표가 어땠는지, 지금 지표가 어느 유형을 닮았는지.

입력: web/public/data/macro_cycle.json (export_macro_cycle.py), web/public/data/synthetic_daily.json (나스닥100·합성 TQQQ 일간, 1971~)
출력: web/public/data/slowdown.json
하락장: 나스닥100 고점 대비 −15% 이상(1971년~). 2000~2002년 안의 2007~2009년 하락은 따로 뗀다.
유형(사람이 붙인 분류, 근거는 TYPE_NOTE): soft 둔화만 / hike 금리 인상 둔화 / rec 경기침체 / bubble 침체 + 거품 붕괴 / crash 단기 폭락
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "public" / "data"
M = json.loads((DATA / "macro_cycle.json").read_text())["series"]
SD = json.loads((DATA / "synthetic_daily.json").read_text())
D, N, T = SD["d"], SD["ndx"], SD["tqqq"]

# 사람이 붙인 유형과 원인(보도·역사 기준)
LABEL = {
    "1973": ("bubble", "니프티 피프티(우량주 거품) 붕괴 + 1차 오일쇼크 + 물가 급등"),
    "1978": ("hike", "물가 급등, 연준 금리 인상(10월 대폭락)"),
    "1980": ("rec", "볼커 연준의 금리 급등, 신용 통제 — 짧은 침체"),
    "1981": ("rec", "볼커 2차 긴축(기준금리 19%대) — 깊은 침체"),
    "1983": ("hike", "경기 회복 속 금리 재인상, 기술주 과열 해소"),
    "1986": ("soft", "성장 둔화 우려"),
    "1987": ("crash", "블랙 먼데이(하루 −20%대) — 프로그램 매매·금리 상승, 침체 없음"),
    "1989": ("soft", "저축대부조합 위기, 일본 거품 꼭대기"),
    "1990": ("rec", "이라크의 쿠웨이트 침공·유가 급등 — 침체"),
    "1992": ("soft", "성장 둔화, 기술주 조정"),
    "1994": ("hike", "연준이 1년에 기준금리 3%→6% — 채권 대학살"),
    "1997a": ("soft", "기술주 조정"),
    "1997b": ("crash", "아시아 외환위기"),
    "1998": ("crash", "러시아 디폴트·LTCM 파산 — 연준 금리 인하로 수습"),
    "2000": ("bubble", "닷컴 거품 붕괴 + 2001년 침체 + 9·11 + 회계 부정"),
    "2007": ("bubble", "주택·신용 거품 붕괴 — 금융위기, 리먼 파산"),
    "2015": ("soft", "중국 위안화 쇼크·유가 폭락·제조업 둔화"),
    "2018": ("hike", "연준 금리 인상 + 양적 긴축 + 미중 무역전쟁"),
    "2020": ("rec", "코로나 봉쇄 — 가장 짧은 침체"),
    "2021": ("hike", "물가 9%, 연준이 1년에 기준금리 0%→4%대 — 침체 없음"),
    "2025": ("crash", "트럼프 관세 전쟁(4월) — 침체 없음"),
}
TYPE_NOTE = {
    "soft": "둔화만 — 경기침체 없음, 금리도 크게 안 올림",
    "hike": "금리 인상 둔화 — 연준이 빠르게 올림, 침체는 없거나 짧음",
    "crash": "단기 폭락 — 사건·충격, 경기는 버팀",
    "rec": "경기침체 — 실업률이 오르고 기업 이익 감소",
    "bubble": "침체 + 거품 붕괴 — 비쌌던 값이 꺼지며 침체와 겹침",
}

def ym(d): return d[:7]
def series(k):
    s = M.get(k)
    if not s: return {}
    y, m = map(int, s["start"].split("-")); out = {}
    for v in s["v"]:
        if v is not None: out[f"{y:04d}-{m:02d}"] = v
        m += 1
        if m == 13: y += 1; m = 1
    return out
S = {k: series(k) for k in M}
def at(k, mo):
    return S.get(k, {}).get(mo)
def shift(mo, n):
    y, m = map(int, mo.split("-")); m += n
    while m > 12: y += 1; m -= 12
    while m < 1: y -= 1; m += 12
    return f"{y:04d}-{m:02d}"
def window(k, a, b):
    s = S.get(k, {}); return [s[x] for x in sorted(s) if a <= x <= b]
def r1(x, n=1): return None if x is None else round(x, n)

# 파생: 금리차(10년-3개월), 신용 스프레드(BAA-10년), 물가 상승률(전년 대비), 산업생산 전년 대비
for mo in list(S.get("GS10", {})):
    if mo in S.get("TB3MS", {}): S.setdefault("CURVE", {})[mo] = S["GS10"][mo] - S["TB3MS"][mo]
    if mo in S.get("BAA", {}): S.setdefault("CREDIT", {})[mo] = S["BAA"][mo] - S["GS10"][mo]
for src, dst in (("CPIAUCSL", "INFL"), ("INDPRO", "IPYOY"), ("PCOPPUSDM", "COPYOY")):
    for mo, v in S.get(src, {}).items():
        p = S[src].get(shift(mo, -12))
        if p: S.setdefault(dst, {})[mo] = (v / p - 1) * 100
# 방어주 ÷ 경기민감주(필수소비재+유틸리티+헬스케어 vs 임의소비재+산업재+소재), 동일가중 ÷ 시가총액가중(시장 폭)
for mo in S.get("XLP", {}):
    try:
        S.setdefault("DEFCYC", {})[mo] = (S["XLP"][mo] * S["XLU"][mo] * S["XLV"][mo]) ** (1/3) / (S["XLY"][mo] * S["XLI"][mo] * S["XLB"][mo]) ** (1/3)
    except (KeyError, TypeError): pass
for mo in S.get("RSP", {}):
    if mo in S.get("SPY", {}): S.setdefault("BREADTH", {})[mo] = S["RSP"][mo] / S["SPY"][mo]

# ── 하락장 찾기 (나스닥100 일간) ──
n = len(D); eps = []; pk = 0; tr = 0
for i in range(1, n):
    if N[i] >= N[pk]:
        if N[tr] / N[pk] - 1 <= -0.15: eps.append((pk, tr))
        pk = i; tr = i
    elif N[i] < N[tr]: tr = i
if N[tr] / N[pk] - 1 <= -0.15: eps.append((pk, tr))
# 2000년 하락 안의 2007~2009년을 따로
def idx(d): return next(i for i, x in enumerate(D) if x >= d)
a, b = idx("2007-06-01"), idx("2009-06-30")
p07 = max(range(a, b), key=lambda i: N[i]); t07 = min(range(p07, b), key=lambda i: N[i])
eps.append((p07, t07)); eps.sort()

rows = []
used = {}
for p, t in eps:
    y = D[p][:4]
    key = y
    if y == "1997":
        key = "1997a" if D[p][5:7] < "06" else "1997b"
    if key not in LABEL: continue
    typ, cause = LABEL[key]
    pm, tm = ym(D[p]), ym(D[t])
    # 회복: 고점 회복까지 일수
    rec_i = next((j for j in range(t, n) if N[j] >= N[p]), None)
    tq_pk_i = max(range(p, t + 1), key=lambda j: T[j]); tq_pk = T[tq_pk_i]; tq_tr_i = min(range(tq_pk_i, t + 1), key=lambda j: T[j])
    # 경기침체 겹침
    usrec = window("USREC", pm, shift(tm, 6))
    pre = lambda k, m=24: window(k, shift(pm, -m), pm)
    # 바닥 뒤 수익
    def fwd(arr, i, yrs):
        j = i + 252 * yrs
        return round(arr[j] / arr[i], 2) if j < n else None
    unr_lo = min(window("UNRATE", shift(pm, -12), pm) or [None]) if window("UNRATE", shift(pm, -12), pm) else None
    unr_hi = max(window("UNRATE", pm, shift(tm, 12)) or [None]) if window("UNRATE", pm, shift(tm, 12)) else None
    cr_pk = at("CREDIT", pm); cr_max = max(window("CREDIT", pm, shift(tm, 3)) or [None]) if window("CREDIT", pm, shift(tm, 3)) else None
    cr_series = S.get("CREDIT", {})
    cr_peak_mo = max((m for m in cr_series if pm <= m <= shift(tm, 12)), key=lambda m: cr_series[m], default=None)
    rows.append({
        "key": key, "type": typ, "cause": cause,
        "peak": D[p], "trough": D[t], "months": round((t - p) / 21),
        "ndx": round((N[t] / N[p] - 1) * 100), "tqqq": round((T[tq_tr_i] / tq_pk - 1) * 100),
        "spx": r1((min(window("SPX", pm, tm) or [0]) / at("SPX", pm) - 1) * 100, 0) if at("SPX", pm) else None,
        "recoverMonths": round((rec_i - p) / 21) if rec_i else None,
        "recession": bool(usrec and max(usrec) >= 1),
        "fed12": r1(at("FEDFUNDS", pm) - at("FEDFUNDS", shift(pm, -12))) if at("FEDFUNDS", pm) is not None and at("FEDFUNDS", shift(pm, -12)) is not None else None,
        "fedPk": r1(at("FEDFUNDS", pm)),
        "fedUpDuring": r1(max(window("FEDFUNDS", shift(pm, -12), tm) or [0]) - min(window("FEDFUNDS", shift(pm, -24), pm) or [0])) if window("FEDFUNDS", pm, tm) else None,
        "unrPeakLag": (lambda s: (lambda m: None if m is None else (int(m[:4]) - int(tm[:4])) * 12 + int(m[5:]) - int(tm[5:]))(max((x for x in s if pm <= x <= shift(tm, 24)), key=lambda x: s[x], default=None)))(S.get("UNRATE", {})),
        "curveMin24": r1(min(pre("CURVE") or [None]) if pre("CURVE") else None, 2),
        "creditPk": r1(cr_pk, 2), "creditMax": r1(cr_max, 2),
        "creditUp": r1(cr_max - cr_pk, 2) if cr_max is not None and cr_pk is not None else None,
        "creditPeakVsTrough": (lambda a, b: (int(a[:4]) - int(b[:4])) * 12 + int(a[5:]) - int(b[5:]))(cr_peak_mo, tm) if cr_peak_mo else None,
        "unrUp": r1(unr_hi - unr_lo) if unr_hi is not None and unr_lo is not None else None,
        "cape": r1(at("CAPE", pm)), "infl": r1(at("INFL", pm)),
        "tq3": fwd(T, t, 3), "tq5": fwd(T, t, 5), "ndx3": fwd(N, t, 3),
    })

def med(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs: return None
    k = len(xs) // 2
    return xs[k] if len(xs) % 2 else round((xs[k - 1] + xs[k]) / 2, 2)
types = {}
for typ in TYPE_NOTE:
    rs = [r for r in rows if r["type"] == typ]
    types[typ] = {"note": TYPE_NOTE[typ], "n": len(rs),
                  **{k: med([r[k] for r in rs]) for k in ("ndx", "tqqq", "months", "recoverMonths", "fed12", "fedUpDuring", "curveMin24", "creditUp", "unrUp", "cape", "tq3", "tq5")},
                  "ndxRange": [min(r["ndx"] for r in rs), max(r["ndx"] for r in rs)] if rs else None}

# ── 지금 ──
def last(k):
    s = S.get(k, {})
    if not s: return None, None
    mo = max(s); return mo, s[mo]
def chg(k, m):
    mo, v = last(k)
    if mo is None: return None
    p = S[k].get(shift(mo, -m)); return None if p is None else v - p
def pct(k, m):
    mo, v = last(k)
    if mo is None: return None
    p = S[k].get(shift(mo, -m)); return None if not p else (v / p - 1) * 100
now = {}
for k in ("FEDFUNDS", "GS10", "TB3MS", "CURVE", "CREDIT", "BAMLH0A0HYM2", "UNRATE", "SAHMREALTIME", "ICSA", "INFL", "IPYOY", "UMCSENT", "RECPROUSM156N", "COPYOY", "PCOPPUSDM", "NFCI", "CAPE", "DEFCYC", "BREADTH", "VIX", "NDX", "SPX", "PERMIT"):
    mo, v = last(k)
    now[k] = {"month": mo, "v": r1(v, 2)}
now["FEDFUNDS"]["chg12"] = r1(chg("FEDFUNDS", 12), 2)
now["CURVE"]["min24"] = r1(min(window("CURVE", shift(now["CURVE"]["month"] or "2000-01", -24), "9999") or [0]), 2) if now["CURVE"]["month"] else None
now["CREDIT"]["chg6"] = r1(chg("CREDIT", 6), 2)
now["BAMLH0A0HYM2"]["chg6"] = r1(chg("BAMLH0A0HYM2", 6), 2)
now["BAMLH0A0HYM2"]["min12"] = r1(min(window("BAMLH0A0HYM2", shift(now["BAMLH0A0HYM2"]["month"] or "2000-01", -12), "9999") or [0]), 2) if now["BAMLH0A0HYM2"]["month"] else None
now["UNRATE"]["low12"] = r1(min(window("UNRATE", shift(now["UNRATE"]["month"] or "2000-01", -12), "9999") or [0]), 2) if now["UNRATE"]["month"] else None
now["ICSA"]["chg6pct"] = r1(pct("ICSA", 6))
now["DEFCYC"]["chg6pct"] = r1(pct("DEFCYC", 6)); now["DEFCYC"]["chg12pct"] = r1(pct("DEFCYC", 12))
now["BREADTH"]["chg6pct"] = r1(pct("BREADTH", 6))
now["PCOPPUSDM"]["chg6pct"] = r1(pct("PCOPPUSDM", 6))
now["PERMIT"]["chg12pct"] = r1(pct("PERMIT", 12))
for k in ("NDX", "SPX"):
    s = S.get(k, {})
    if s:
        mo = max(s); hi = max(v for m, v in s.items() if m >= shift(mo, -12))
        now[k]["fromHigh12"] = r1((s[mo] / hi - 1) * 100)

# 그래프용 월별 시계열(1970년~): 금리차, 신용 스프레드, 실업률, 기준금리, 침체 기간, 나스닥100(로그용), 하이일드, 방어/경기민감
chart = {}
for k in ("CURVE", "CREDIT", "BAMLH0A0HYM2", "UNRATE", "FEDFUNDS", "USREC", "NDX", "SPX", "CAPE", "SAHMREALTIME", "DEFCYC", "BREADTH", "INFL", "RECPROUSM156N"):
    s = S.get(k, {})
    ks = [m for m in sorted(s) if m >= "1970-01"]
    if ks: chart[k] = {"start": ks[0], "v": [r1(s.get(m), 3) for m in (lambda a, b: [a] + [shift(a, i) for i in range(1, (int(b[:4]) - int(a[:4])) * 12 + int(b[5:]) - int(a[5:]) + 1)])(ks[0], ks[-1])]}
# 나스닥100 1985년 이전은 합성 일간 월말 값으로 채움
mm = {}
for d, v in zip(D, N): mm[d[:7]] = v
if "NDX" in chart:
    first = chart["NDX"]["start"]; scale = S["NDX"][first] / mm[first]
    pre = [m for m in sorted(mm) if "1971-02" <= m < first]
    chart["NDX"] = {"start": pre[0], "v": [r1(mm[m] * scale, 2) for m in pre] + chart["NDX"]["v"]}

# 지금 낙폭을 이미 지난 하락장들의 최종 깊이(조건부)
cur_dd = now["NDX"].get("fromHigh12")
given = None
if cur_dd is not None:
    past = [r for r in rows if r["ndx"] <= cur_dd]
    given = {"dd": cur_dd, "n": len(past), "rows": [[r["key"], r["type"], r["ndx"], r["tqqq"]] for r in past],
             "within5": sum(1 for r in past if r["ndx"] >= cur_dd - 5), "deeper15": sum(1 for r in past if r["ndx"] <= cur_dd - 15),
             "median": med([r["ndx"] for r in past])}
# 예측 도구의 과거 성적: 금리차 역전(월평균 < 0) 시작 월과 그 뒤 24개월 안 침체 여부, 삼 규칙 0.5 첫 도달
inv = []; prev = None
for mo in sorted(S.get("CURVE", {})):
    v = S["CURVE"][mo]; neg = v < 0
    if neg and not prev and mo >= "1960-01":
        if not inv or mo > shift(inv[-1][0], 12):
            hit = max(window("USREC", mo, shift(mo, 24)) or [0]) >= 1
            first = next((m for m in sorted(S["USREC"]) if mo <= m <= shift(mo, 24) and S["USREC"][m] >= 1), None)
            inv.append([mo, bool(hit), first])
    prev = neg
sahm = []; prev = False
for mo in sorted(S.get("SAHMREALTIME", {})):
    on = S["SAHMREALTIME"][mo] >= 0.5
    if on and not prev:
        recm = next((m for m in sorted(S["USREC"]) if shift(mo, -6) <= m <= shift(mo, 6) and S["USREC"][m] >= 1), None)
        sahm.append([mo, recm])
    prev = on
# ── 주간 신호(하이일드 스프레드·실업수당 청구) ──
W = json.loads((DATA / "macro_cycle.json").read_text()).get("weekly", {})
from datetime import date, timedelta
def dd(s): return date.fromisoformat(s)
def weekly_last(pts):  # 일간 → 주말(금요일까지) 마지막 값
    out = {}
    for d, v in pts:
        x = dd(d); fri = x + timedelta(days=(4 - x.weekday()) % 7)
        out[fri.isoformat()] = v
    return sorted(out.items())
weekly = {}
HY_BANDS = [(4, "평온"), (5, "조정"), (6, "주의 — 약한 회사의 돈줄이 조여짐"), (8, "위험 — 침체 때 수준에 다가감"), (99, "침체급")]
if W.get("HY"):
    pts = W["HY"]["pts"]; last_d, last_v = pts[-1]
    yr = [v for d, v in pts if dd(d) >= dd(last_d) - timedelta(days=365)]
    q = [v for d, v in pts if dd(d) >= dd(last_d) - timedelta(days=91)]
    lo = min(yr); lo_d = next(d for d, v in pts if v == lo and dd(d) >= dd(last_d) - timedelta(days=365))
    weekly["HY"] = {"date": last_d, "v": last_v, "low52": lo, "lowDate": lo_d, "up52": round(last_v - lo, 2),
                    "chg13w": round(last_v - q[0], 2), "max52": max(yr),
                    "band": next(nm for th, nm in HY_BANDS if last_v < th)}
if W.get("BAA10Y"):
    pts = W["BAA10Y"]["pts"]; last_d, last_v = pts[-1]
    old = [v for d, v in pts if dd(d) <= dd(last_d) - timedelta(days=182)]
    weekly["BAA10Y"] = {"date": last_d, "v": last_v, "chg26w": round(last_v - old[-1], 2) if old else None}
claims_hist = None
if W.get("ICSA"):
    pts = W["ICSA"]["pts"]
    vals = [v for _, v in pts]; days = [d for d, _ in pts]
    ma = [sum(vals[max(0, i - 3):i + 1]) / len(vals[max(0, i - 3):i + 1]) for i in range(len(vals))]
    i = len(ma) - 1
    lo = min(ma[max(0, i - 51):i + 1])
    weekly["ICSA"] = {"date": days[i], "v": vals[i], "ma4": round(ma[i]), "low52": round(lo), "upPct": round((ma[i] / lo - 1) * 100, 1)}
    # 과거 성적: 4주 평균이 52주 최저보다 20% 넘게 오른 첫 주 → 그 뒤 12개월 안(또는 이미) 침체였나
    rec = S.get("USREC", {})
    sig = []; on = False
    for j in range(52, len(ma)):
        lo_j = min(ma[j - 51:j + 1]); up = ma[j] / lo_j - 1
        if up >= 0.20 and not on:
            mo = days[j][:7]
            hit = max([rec.get(shift(mo, k), 0) for k in range(-3, 13)]) >= 1
            if not sig or days[j] > (dd(sig[-1][0]) + timedelta(days=365)).isoformat():
                sig.append([days[j], round(up * 100), bool(hit), round(ma[j])])
            on = True
        if up < 0.10: on = False
    claims_hist = sig
    # 그래프: 최근 3년 4주 평균
    # 긴 그래프(1967년~): 날짜, 4주 평균, 그때까지 52주 최저(4주 평균 기준) — 최저 +20% 선이 '돌파선'
    weekly["ICSA_long"] = [[days[k], round(ma[k]), round(min(ma[max(0, k - 51):k + 1]))] for k in range(len(ma))]
if W.get("CCSA"):
    pts = W["CCSA"]["pts"]; last_d, last_v = pts[-1]
    old = [v for d, v in pts if dd(d) <= dd(last_d) - timedelta(days=182)]
    weekly["CCSA"] = {"date": last_d, "v": last_v, "chg26wPct": round((last_v / old[-1] - 1) * 100, 1) if old else None}
    weekly["CCSA_long"] = [[d0, round(v0)] for d0, v0 in pts]
for k in ("HY", "BAA10Y"):
    if W.get(k): weekly[f"{k}_chart"] = [[d, v] for d, v in weekly_last(W[k]["pts"])]
weekly["claimsHist"] = claims_hist
# ── 하이일드 쐐기(사용자가 월봉에 그은 선, 2026-11-21) ──
# 위쪽 추세선: 2020년 3월 월말 8.64 → 2025년 4월 월말(FRED 값)을 잇는 로그 직선(2022년 꼭대기 약 5.9도 이 선에 닿음).
# 가로선: 2.42(2007년 바닥)·2.62(30년 바닥대)·5.02(첫 목표)·8.64(2020년 꼭대기).
WEDGE = None
if W.get("HY"):
    import math
    mclose = {}
    for d0, v0 in W["HY"]["pts"]: mclose[d0[:7]] = (d0, v0)
    A_M, A_V = "2020-03", 8.64
    B_M = "2025-04"; B_V = mclose[B_M][1] if B_M in mclose else 3.94
    mi = lambda m: int(m[:4]) * 12 + int(m[5:]) - 1
    slope = math.log(B_V / A_V) / (mi(B_M) - mi(A_M))
    line = lambda m: A_V * math.exp(slope * (mi(m) - mi(A_M)))
    hist = [[m, mclose[m][0], round(mclose[m][1], 2), round(line(m), 2), mclose[m][1] > line(m)] for m in sorted(mclose)]
    cur = hist[-1]; last_done = [h for h in hist if h[1][8:] >= "28" or h[0] < cur[0]]
    done = [h for h in hist[:-1]]  # 지난 달까지는 월말 종가
    above_done = 0
    for h in reversed(done):
        if h[4]: above_done += 1
        else: break
    status = ("확정 — 지난 %d개월 연속 월말 종가가 선 위" % above_done) if above_done >= 2 else \
             ("돌파 첫 달 — 지난달 월말 종가가 선 위, 이번 달 월말까지 버티면 확정" if above_done == 1 else \
             ("진행 중 — 이번 달 현재 선 위, 월말 종가로 확인" if cur[4] else "선 아래 — 돌파 아님"))
    pts = W["HY"]["pts"]; last_d, last_v = pts[-1]
    rec26 = [(d0, v0) for d0, v0 in pts if dd(d0) >= dd(last_d) - timedelta(days=182)]
    pk_d, pk_v = max(rec26, key=lambda x: x[1])
    lo52 = weekly["HY"]["low52"]
    turned = (pk_v - lo52 >= 1.0) and (pk_v - last_v >= 0.5)
    WEDGE = {"anchorA": [A_M, A_V], "anchorB": [B_M, round(B_V, 2)], "slopeYr": round((math.exp(slope * 12) - 1) * 100, 1),
             "lineNow": round(line(cur[0]), 2), "now": last_v, "nowDate": last_d, "status": status, "aboveDone": above_done,
             "levels": [[2.42, "2007년 바닥"], [2.62, "30년 바닥대"], [line(cur[0]), "위쪽 추세선(이번 달)"], [3.94, "2025년 4월 꼭대기(월말)"], [5.02, "첫 목표"], [5.9, "2022년 꼭대기"], [8.64, "2020년 꼭대기(월말)"], [11.14, "2002년 꼭대기"], [21.44, "2008년 꼭대기(하루 최고)"]],
             "peak6m": [pk_d, pk_v], "dropFromPeak": round(pk_v - last_v, 2), "turned": turned,
             "hist": hist[-24:]}
    WEDGE["levels"] = [[round(a, 2), b] for a, b in WEDGE["levels"]]
weekly["wedge"] = WEDGE


# ── 닮은 시기 찾기: 지금 지표 10개와 가장 가까운 과거 달(1972~, 2년 뒤 결과가 있는 달만) ──
def analogs():
    G, TB, BAA, U, C, F, R, CA = (S.get(k, {}) for k in ("GS10", "TB3MS", "BAA", "UNRATE", "CPIAUCSL", "FEDFUNDS", "USREC", "CAPE"))
    nd, tq = {}, {}
    for d0, a0, b0 in zip(D, N, T): nd[d0[:7]] = a0; tq[d0[:7]] = b0
    yx = S.get("NDX", {}); lastm = max(nd)
    for m in sorted(yx):
        if m > lastm and lastm in yx: nd[m] = nd[lastm] * yx[m] / yx[lastm]
    cr = {m: BAA[m] - G[m] for m in BAA if m in G}
    capelast = CA[max(CA)] if CA else None
    def fill(s):  # 빠진 달(예: 2025년 10월 미국 정부 셧다운으로 실업률 미발표)은 직전 달 값으로
        out = dict(s)
        if not s: return out
        m = min(s)
        while m < max(s):
            m2 = shift(m, 1)
            if m2 not in out: out[m2] = out[m]
            m = m2
        return out
    G, TB, BAA, U, C, F = (fill(x) for x in (G, TB, BAA, U, C, F))
    cr = {m: BAA[m] - G[m] for m in BAA if m in G}
    def feat(mo, dd=None, cape=None, infl_mo=None):
        try:
            hi = max(nd[shift(mo, -k)] for k in range(12))
            im = infl_mo or mo
            return {"dd": dd if dd is not None else (nd[mo] / hi - 1) * 100, "curve": G[mo] - TB[mo],
                    "curvemin": min(G[shift(mo, -k)] - TB[shift(mo, -k)] for k in range(24)),
                    "cr": cr[mo], "cr6": cr[mo] - cr[shift(mo, -6)], "unr": U[mo] - min(U[shift(mo, -k)] for k in range(12)),
                    "infl": (C[im] / C[shift(im, -12)] - 1) * 100, "fed12": F[mo] - F[shift(mo, -12)], "g10": G[mo],
                    "cape": cape if cape is not None else CA[mo]}
        except KeyError as e:
            if mo_dbg[0]: print("feat 실패", mo, e)
            return None
    mo_dbg = [True]
    mo = min(max(G), max(TB), max(BAA), max(U), max(F))
    nowf = feat(mo, dd=now["NDX"].get("fromHigh12"), cape=capelast, infl_mo=max(C))
    mo_dbg[0] = False
    if not nowf or nowf["dd"] is None: print('지금 지표 없음', nowf); return None
    last_ok = shift(max(nd), -24)
    F_ = [(m, feat(m)) for m in sorted(nd) if "1972-01" <= m <= last_ok]
    F_ = [(m, x) for m, x in F_ if x]
    keys = list(nowf)
    mean = {k: sum(x[k] for _, x in F_) / len(F_) for k in keys}
    sd = {k: (sum((x[k] - mean[k]) ** 2 for _, x in F_) / len(F_)) ** 0.5 for k in keys}
    w = {"dd": 1.5, "curve": 1, "curvemin": 0.7, "cr": 1, "cr6": 1, "unr": 1.5, "infl": 1, "fed12": 0.7, "g10": 0.7, "cape": 1}
    dist = sorted(((sum(w[k] * ((x[k] - nowf[k]) / sd[k]) ** 2 for k in keys)) ** 0.5, m, x) for m, x in F_)
    top = []
    idx = lambda m: int(m[:4]) * 12 + int(m[5:])
    for dval, m, x in dist:
        if any(abs(idx(m) - idx(s[1])) < 18 for s in top): continue
        fw = lambda arr, n: r1((arr[shift(m, n)] / arr[m] - 1) * 100, 0) if shift(m, n) in arr else None
        low2 = min(nd[shift(m, k)] for k in range(25) if shift(m, k) in nd) / nd[m] - 1
        tlow2 = min(tq[shift(m, k)] for k in range(25) if shift(m, k) in tq) / tq[m] - 1
        recm = next((shift(m, k) for k in range(25) if R.get(shift(m, k), 0)), None)
        top.append([round(dval, 2), m, {k: r1(v, 2) for k, v in x.items()}, fw(nd, 6), fw(nd, 12), fw(nd, 24), fw(tq, 12), fw(tq, 24), r1(low2 * 100, 0), r1(tlow2 * 100, 0), recm])
        if len(top) == 10: break
    up12 = [a[4] for a in top if a[4] is not None]
    return {"month": mo, "now": {k: r1(v, 2) for k, v in nowf.items()}, "top": top,
            "summary": {"n": len(top), "up12": sum(1 for v in up12 if v > 0), "med12": med(up12),
                        "deep": sum(1 for a in top if a[8] is not None and a[8] <= -25), "rec2y": sum(1 for a in top if a[10])}}
ANALOG = analogs()

for r in rows: r.pop("spx", None)
out = {"generated": json.loads((DATA / "macro_cycle.json").read_text())["generated"], "rows": rows, "types": types, "now": now, "chart": chart, "given": given, "inversions": inv, "sahm": sahm, "weekly": weekly, "analog": ANALOG,
       "errors": json.loads((DATA / "macro_cycle.json").read_text()).get("errors", [])}
(DATA / "slowdown.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print("하락장", len(rows), "유형", {k: v["n"] for k, v in types.items()})
for r in rows: print(r["key"], r["type"], r["ndx"], r["tqqq"], r["months"], r["recoverMonths"], "침체" if r["recession"] else "", "금리인상폭", r["fedUpDuring"], "금리차최저", r["curveMin24"], "신용↑", r["creditUp"], "실업↑", r["unrUp"], "CAPE", r["cape"], "신용고점-바닥", r["creditPeakVsTrough"], "실업고점-바닥", r["unrPeakLag"], "tq3", r["tq3"], "tq5", r["tq5"])
for k, v in types.items(): print(k, v)
print("weekly", {k: v for k, v in weekly.items() if not k.endswith("_chart")});
print("analog", json.dumps(ANALOG, ensure_ascii=False)[:1800]);
print("given", given); print("inv", inv); print("sahm", sahm)
print(json.dumps(now, ensure_ascii=False)[:2500])
