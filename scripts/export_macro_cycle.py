"""경기 둔화·침체 판단용 거시 지표 원자료 수집 — GitHub Actions에서 실행(샌드박스는 외부 접속 불가).

출처: FRED(세인트루이스 연준, fredgraph.csv — 키 불필요), 야후 파이낸스(월말 종가), 쉴러 CAPE(예일대 ie_data.xls).
결과: web/public/data/macro_cycle.json
  {generated, series: {키: {name, src, start: 'YYYY-MM', v: [월별 값 ...]}}}
  일·주 단위 지표는 월평균. 1950년 이후만. 실패한 지표는 건너뛰고 errors에 기록.
가공(하락장 유형 분류·지표 비교)은 scripts/build_slowdown.py.
"""
import csv, io, json, time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "data" / "macro_cycle.json"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
SINCE = "1950-01"

FRED = {
    "USREC": "경기침체 기간(NBER, 1=침체)",
    "FEDFUNDS": "기준금리(연방기금금리)",
    "GS10": "10년 국채 금리",
    "TB3MS": "3개월 국채 금리",
    "GS2": "2년 국채 금리",
    "BAA": "BAA 회사채 금리",
    "BAMLH0A0HYM2": "하이일드 스프레드(ICE BofA)",
    "UNRATE": "실업률",
    "SAHMREALTIME": "삼 규칙 지표(실시간)",
    "ICSA": "실업수당 신규 청구(주간→월평균)",
    "CPIAUCSL": "소비자물가지수",
    "INDPRO": "산업생산지수",
    "UMCSENT": "미시간대 소비자심리",
    "RECPROUSM156N": "경기침체 확률(차우베-피거)",
    "PCOPPUSDM": "구리 가격(IMF)",
    "NFCI": "시카고 연준 금융여건지수",
    "PERMIT": "주택 착공 허가",
    "T10Y3M": "10년-3개월 금리차(일간→월평균)",
}
YAHOO = {
    "NDX": "^NDX", "SPX": "^GSPC", "VIX": "^VIX",
    "XLY": "XLY", "XLP": "XLP", "XLI": "XLI", "XLU": "XLU", "XLV": "XLV", "XLB": "XLB", "XLF": "XLF",
    "RSP": "RSP", "SPY": "SPY", "HYG": "HYG", "IEF": "IEF", "LQD": "LQD",
    "TNX": "^TNX", "IRX": "^IRX", "FVX": "^FVX", "COPPER": "HG=F", "GOLD": "GC=F",
}

UAS = [{"User-Agent": "curl/8.5.0", "Accept": "*/*"},
       {"User-Agent": "python-requests/2.32", "Accept": "text/csv,*/*"},
       UA]

def get(url, tries=4, timeout=60, **kw):
    for a in range(tries):
        try:
            r = requests.get(url, headers=kw.pop("headers", UA), timeout=timeout, **kw)
            if r.status_code == 200: return r
            print("  HTTP", r.status_code, url, flush=True)
        except requests.RequestException as e:
            print("  ERR", str(e)[:120], flush=True)
        time.sleep(2 * (a + 1))
    return None

FRED_DEAD = []  # FRED가 응답하지 않으면 남은 지표는 시간 낭비 없이 건너뛴다(GitHub 서버를 막는 경우가 있음)

def fred_text(sid):
    if len(FRED_DEAD) >= 3: return None
    for h in UAS:
        for url in (f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}",
                    f"https://fred.stlouisfed.org/series/{sid}/downloaddata/{sid}.csv"):
            try:
                r = requests.get(url, headers=h, timeout=25)
                if r.status_code == 200 and r.text[:20].upper().startswith(("DATE", "OBSERVATION_DATE")):
                    return r.text
                print("  FRED", sid, r.status_code, h["User-Agent"][:12], flush=True)
            except requests.RequestException as e:
                print("  FRED ERR", sid, h["User-Agent"][:12], str(e)[:80], flush=True)
    FRED_DEAD.append(sid)
    return None

def monthly(points):
    acc = {}
    for ym, v in points:
        if ym < SINCE: continue
        acc.setdefault(ym, []).append(v)
    return {k: sum(v) / len(v) for k, v in acc.items()}

def pack(m):
    if not m: return None
    ks = sorted(m)
    y, mo = map(int, ks[0].split("-")); out = []
    while True:
        k = f"{y:04d}-{mo:02d}"
        if k > ks[-1]: break
        out.append(round(m[k], 4) if k in m else None)
        mo += 1
        if mo == 13: y += 1; mo = 1
    return {"start": ks[0], "v": out}

def fred(sid):
    txt = fred_text(sid)
    if not txt: return None
    pts = []
    for row in csv.reader(io.StringIO(txt)):
        if len(row) < 2 or not row[0][:4].isdigit(): continue
        try: pts.append((row[0][:7], float(row[1])))
        except ValueError: pass
    return monthly(pts)

def fred_raw(sid, since):
    """일·주 단위 원래 값 그대로 [[YYYY-MM-DD, 값], ...] — 주간 신호용(하이일드 스프레드, 실업수당 청구)."""
    txt = fred_text(sid)
    if not txt: return None
    out = []
    for row in csv.reader(io.StringIO(txt)):
        if len(row) < 2 or not row[0][:4].isdigit() or row[0] < since: continue
        try: out.append([row[0][:10], float(row[1])])
        except ValueError: pass
    return out or None

HY_HIST = ROOT / "web" / "public" / "data" / "hy_history.json"

def gz_ebp():
    """연준(길크리스트·자크라이섹) GZ 회사채 스프레드·초과 채권 프리미엄(EBP)·12개월 침체 확률 — 1973년~ 월별.
    하이일드 스프레드 옛 기록(FRED는 최근 3년만)을 대신하는 긴 신용 지표."""
    for url in ("https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv",
                "https://www.federalreserve.gov/econresdata/notes/feds-notes/2016/files/ebp_csv.csv"):
        for h in UAS[::-1]:
            try:
                r = requests.get(url, headers=h, timeout=40)
            except requests.RequestException as e:
                print("  EBP ERR", str(e)[:80], flush=True); continue
            print("  EBP", r.status_code, url[-40:], r.text[:120].replace("\n", " | "), flush=True)
            if r.status_code != 200 or "gz" not in r.text[:200].lower(): continue
            rows = list(csv.DictReader(io.StringIO(r.text)))
            out = {"GZ": {}, "EBP": {}, "EBPPROB": {}}
            for x in rows:
                d0 = (x.get("date") or x.get("DATE") or "")[:10]
                if len(d0) < 7: continue
                mo = d0[:7] if d0[4] == "-" else None
                if not mo:
                    try:
                        from datetime import datetime
                        mo = datetime.strptime(d0.split(" ")[0], "%m/%d/%Y").strftime("%Y-%m")
                    except ValueError: continue
                for k, col in (("GZ", "gz_spread"), ("EBP", "ebp"), ("EBPPROB", "est_prob")):
                    try: out[k][mo] = float(x[col])
                    except (KeyError, ValueError, TypeError): pass
            return out
    return None

def alfred_hist(sid):
    """FRED는 ICE 지표를 최근 3년만 공개한다. 기록 보관소 ALFRED의 옛 버전(잘리기 전)에서 1996년~ 전체를 받는다.
    한 번 받으면 hy_history.json에 저장해 두고 다음부터는 그 파일을 쓴다."""
    vintages = ["2022-12-30", "2022-06-30", "2021-12-31", "2020-12-31", "2023-03-31", "2023-06-30"]
    for vd in vintages:
        for url in (f"https://alfred.stlouisfed.org/graph/alfredgraph.csv?id={sid}&vintage_date={vd}",
                    f"https://alfred.stlouisfed.org/graph/alfredgraph.csv?id={sid}_{vd.replace('-', '')}",
                    f"https://alfred.stlouisfed.org/series/downloaddata?seid={sid}&vintage_date={vd}"):
            for h in UAS:
                try:
                    r = requests.get(url, headers=h, timeout=30)
                except requests.RequestException as e:
                    print("  ALFRED ERR", vd, str(e)[:80], flush=True); continue
                head = r.text[:200].replace("\n", " ")
                print(f"  ALFRED {r.status_code} {vd} {url[:80]} | {head[:100]}", flush=True)
                if r.status_code != 200: continue
                pts = []
                for row in csv.reader(io.StringIO(r.text)):
                    if len(row) < 2 or not row[0][:4].isdigit(): continue
                    try: pts.append([row[0][:10], float(row[-1])])
                    except ValueError: pass
                if pts and pts[0][0] < "2000-01-01":
                    print(f"  ALFRED 성공 {vd} {pts[0][0]}~{pts[-1][0]} n={len(pts)}", flush=True)
                    return pts
                break
    return None

WEEKLY = {  # 키: (FRED 아이디, 시작일, 이름)
    "HY": ("BAMLH0A0HYM2", "2018-01-01", "하이일드 스프레드(일간)"),
    "BAA10Y": ("BAA10Y", "2018-01-01", "BAA 회사채 − 10년 국채(일간)"),
    "ICSA": ("ICSA", "1967-01-01", "실업수당 신규 청구(주간)"),
    "CCSA": ("CCSA", "1967-01-01", "실업수당 계속 청구(주간)"),
}

def bls(sid):
    """FRED가 막혔을 때 실업률 등은 미국 노동통계국 공개 API(v1, 키 없음, 한 번에 10년)로."""
    out = {}
    y = int(time.strftime("%Y"))
    for end in range(y, 1947, -10):
        r = None
        try:
            r = requests.post("https://api.bls.gov/publicAPI/v1/timeseries/data/",
                              json={"seriesid": [sid], "startyear": str(max(1948, end - 9)), "endyear": str(end)}, timeout=40)
        except requests.RequestException as e:
            print("  BLS ERR", str(e)[:80], flush=True); break
        js = r.json() if r is not None and r.status_code == 200 else {}
        data = (js.get("Results") or {}).get("series", [{}])[0].get("data", [])
        if not data: print("  BLS", sid, js.get("status"), (js.get("message") or [""])[:1], flush=True); break
        for d in data:
            if d["period"].startswith("M") and d["period"] != "M13":
                try: out[f"{d['year']}-{d['period'][1:]}"] = float(d["value"])
                except ValueError: pass
        if end - 9 <= 1950: break
    return {k: v for k, v in out.items() if k >= SINCE} or None

def yahoo(sym):
    r = get(f"https://query1.finance.yahoo.com/v8/finance/chart/{requests.utils.quote(sym)}",
            params={"period1": 0, "period2": int(time.time()), "interval": "1mo", "events": "div"})
    if not r: return None
    res = r.json()["chart"]["result"][0]
    ts = res["timestamp"]; q = res["indicators"]
    cl = (q.get("adjclose") or [{}])[0].get("adjclose") or q["quote"][0]["close"]
    pts = [(time.strftime("%Y-%m", time.gmtime(t)), c) for t, c in zip(ts, cl) if c is not None]
    return dict(pts) if pts else None  # 월초 타임스탬프 = 그달 값

def shiller():
    r = get("http://www.econ.yale.edu/~shiller/data/ie_data.xls")
    if not r: return None
    import pandas as pd
    df = pd.read_excel(io.BytesIO(r.content), sheet_name="Data", skiprows=7)
    cape_col = next(c for c in df.columns if str(c).strip().upper() == "CAPE")
    out = {}
    for d, c in zip(df["Date"], df[cape_col]):
        try:
            d = float(d); c = float(c)
        except (TypeError, ValueError): continue
        if c != c: continue
        y = int(d); m = int(round((d - y) * 100)) or 1
        k = f"{y:04d}-{m:02d}"
        if k >= SINCE: out[k] = c
    return out

def main():
    series, errors = {}, []
    for sid, name in FRED.items():
        m = fred(sid); p = pack(m)
        if p: series[sid] = {"name": name, "src": "FRED", **p}; print(f"FRED {sid} {p['start']} n={len(p['v'])}", flush=True)
        else: errors.append(f"FRED {sid}")
    for k, sym in YAHOO.items():
        try: m = yahoo(sym)
        except Exception as e: m = None; print("  yahoo", sym, e, flush=True)
        p = pack({a: b for a, b in (m or {}).items() if a >= SINCE})
        if p: series[k] = {"name": sym, "src": "Yahoo", **p}; print(f"YAHOO {k} {p['start']} n={len(p['v'])}", flush=True)
        else: errors.append(f"Yahoo {sym}")
    # FRED가 막혔을 때 대신: 실업률(BLS), 금리(야후 국채 금리)
    if "UNRATE" not in series:
        m = bls("LNS14000000"); p = pack(m)
        if p: series["UNRATE"] = {"name": "실업률(BLS)", "src": "BLS", **p}; print("BLS UNRATE", p["start"], len(p["v"]), flush=True)
    if "ICSA" not in series:
        pass
    for fk, yk, nm in (("GS10", "TNX", "10년 국채 금리(야후 ^TNX)"), ("TB3MS", "IRX", "3개월 국채 금리(야후 ^IRX)")):
        if fk not in series and yk in series:
            series[fk] = {**series[yk], "name": nm, "src": "Yahoo"}
    try:
        m = shiller(); p = pack(m)
        if p: series["CAPE"] = {"name": "쉴러 경기조정 PER(S&P 500)", "src": "Shiller", **p}; print("CAPE", p["start"], len(p["v"]), flush=True)
        else: errors.append("Shiller CAPE")
    except Exception as e:
        print("  shiller", e, flush=True); errors.append("Shiller CAPE")
    ge = gz_ebp()
    if ge:
        for k, nm in (("GZ", "GZ 회사채 스프레드(연준)"), ("EBP", "초과 채권 프리미엄(연준)"), ("EBPPROB", "EBP 기반 12개월 침체 확률(연준)")):
            p = pack({a: b for a, b in ge[k].items() if a >= SINCE})
            if p: series[k] = {"name": nm, "src": "Fed", **p}; print("EBP", k, p["start"], len(p["v"]), flush=True)
    else:
        errors.append("연준 GZ·EBP")
    if not HY_HIST.exists():
        hist = alfred_hist("BAMLH0A0HYM2")
        if hist:
            HY_HIST.write_text(json.dumps({"src": "ALFRED(FRED 기록 보관소) BAMLH0A0HYM2 옛 버전", "generated": time.strftime("%Y-%m-%d"), "pts": hist}, separators=(",", ":")))
        else:
            errors.append("ALFRED 하이일드 옛 기록")
    weekly = {}
    for k, (sid, since, nm) in WEEKLY.items():
        pts = fred_raw(sid, since)
        if pts and k == "HY" and HY_HIST.exists():  # 옛 기록 + 최근 3년(겹치면 최근 값)
            old = [x for x in json.loads(HY_HIST.read_text())["pts"] if x[0] < pts[0][0]]
            pts = old + pts
        if pts: weekly[k] = {"name": nm, "id": sid, "pts": pts}; print(f"WEEKLY {k} {pts[0][0]}~{pts[-1][0]} n={len(pts)}", flush=True)
        else: errors.append(f"FRED 주간 {sid}")
    OUT.write_text(json.dumps({"generated": time.strftime("%Y-%m-%d"), "errors": errors, "series": series, "weekly": weekly},
                              ensure_ascii=False, separators=(",", ":")))
    print("errors:", errors)

if __name__ == "__main__":
    main()
