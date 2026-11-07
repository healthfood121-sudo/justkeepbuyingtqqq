"""
screen_universe.py — 미국 상장 전 종목(나스닥·뉴욕 등, 러셀2000·나스닥100 표시)에서 '숨은 알짜'를 숫자로 1차 선별

데이터 (모두 무료·공개, 샌드박스에서 접속 불가 → GitHub Actions 'screen-universe'에서 실행)
  - 종목 목록: nasdaqtrader.com 나스닥·기타 상장 목록, 저장소 나스닥100 보유 종목 파일
  - 러셀2000 표시: 정의대로 추정(공시가 있는 미국 상장사 시가총액 1,001~3,000위)
  - 업종: SEC 회사 정보 SIC 코드
  - 재무: SEC XBRL frames API (항목·연도별로 전 회사 값을 한 번에 받음 — 회사별 요청 대신 약 200번 요청)
  - 주가: Yahoo Finance 월간 수정주가(배당 포함)

출력: web/public/data/screen/universe.json  (시가총액 3억 달러 이상, 연간 재무 5년 이상인 회사)
점수(0~100): 꾸준한 흑자 20 · 매출 성장 15 · EPS 성장 15 · 투하자본이익률 20 · 잉여현금 10 · 재무 건전성 10 · 주식 수 희석 10
"""
import io, json, math, statistics, sys, time
from pathlib import Path

import pandas as pd
import requests
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "data" / "screen"
OUT.mkdir(parents=True, exist_ok=True)
ROLL = ROOT / "web" / "public" / "data" / "rolling"

UA = {"User-Agent": "justkeepbuyingtqqq research research@example.com"}
WEB_UA = UA  # 평범한 연구용 요청 표시(브라우저 흉내 안 함)
YEARS = list(range(2015, 2026))  # CY2015 ~ CY2025
MIN_MCAP = 300e6


def get(url, headers=UA, tries=3):
    for i in range(tries):
        try:
            r = requests.get(url, headers=headers, timeout=90)
            if r.status_code == 200:
                return r
            print("  ", r.status_code, url[:100], flush=True)
            if r.status_code == 404:
                return None
        except Exception as e:
            print("  err", e, url[:100], flush=True)
        time.sleep(2 * (i + 1))
    return None


# ── 1. 종목 목록 ─────────────────────────────────────────────
def nasdaq_listed():
    r = get("https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt", WEB_UA)
    out = {}
    if not r:
        return out
    for ln in r.text.splitlines()[1:]:
        f = ln.split("|")
        if len(f) < 8 or f[0].startswith("File Creation"):
            continue
        sym, name, test, etf = f[0], f[1], f[3], f[6]
        if test == "Y" or etf == "Y":
            continue
        low = name.lower()
        if any(w in low for w in ("warrant", " unit", " right", "preferred", "depositary", "notes due", "%")):
            continue
        out[sym] = name
    print("nasdaq listed", len(out), flush=True)
    return out


def other_listed():
    """뉴욕증권거래소·NYSE American 등 (나스닥 외) 상장 보통주"""
    r = get("https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt", WEB_UA)
    out = {}
    if not r:
        return out
    for ln in r.text.splitlines()[1:]:
        f = ln.split("|")
        if len(f) < 8 or f[0].startswith("File Creation"):
            continue
        sym, name, etf, test = f[0], f[1], f[4], f[6]
        if test == "Y" or etf == "Y" or "$" in sym:
            continue
        low = name.lower()
        if any(w in low for w in ("warrant", " unit", " right", "preferred", "depositary", "notes due", "%")):
            continue
        out[sym] = name
    print("other listed", len(out), flush=True)
    return out


def russell2000():
    """러셀2000 실제 목록은 ETF 운용사 사이트가 자동 요청을 막아 받지 않는다.
    대신 아래 main()에서 정의(미국 상장사 시가총액 1,001~3,000위)로 추정 표시한다."""
    return {}


def nasdaq100():
    """저장소의 나스닥100 보유 종목 파일(update_nasdaq100_holdings.py가 갱신)에서 읽는다"""
    import re
    src = (ROOT / "web" / "app" / "nasdaq100-holdings" / "data.ts").read_text()
    out = {t for t, typ in re.findall(r"ticker: '([A-Z.\-]+)'.*?type: '(\w+)'", src, re.S) if typ == "stock"}
    print("nasdaq100", len(out), flush=True)
    return out


# ── 2. SEC frames ────────────────────────────────────────────
def frame(tax, concept, unit, period):
    r = get(f"https://data.sec.gov/api/xbrl/frames/{tax}/{concept}/{unit}/{period}.json")
    time.sleep(0.15)
    if not r:
        return {}
    return {d["cik"]: d["val"] for d in r.json().get("data", [])}


def series(concepts, unit, instant=False, tax="us-gaap"):
    """{cik: {year: val}} — 앞 항목을 우선, 없으면 다음 항목으로 채움"""
    out = {}
    for y in YEARS:
        period = f"CY{y}Q4I" if instant else f"CY{y}"
        for c in concepts:
            for cik, v in frame(tax, c, unit, period).items():
                out.setdefault(cik, {}).setdefault(y, v)
        print("  frame", concepts[0], y, flush=True)
    return out


SIC2 = {"01": "농업", "10": "금속 광업", "12": "석탄", "13": "석유·가스", "14": "광물", "15": "건설", "16": "건설", "17": "건설",
        "20": "식품", "21": "담배", "22": "섬유", "23": "의류", "24": "목재", "25": "가구", "26": "종이·포장", "27": "인쇄·출판",
        "28": "화학·제약", "29": "정유", "30": "고무·플라스틱", "31": "가죽·신발", "32": "유리·시멘트", "33": "철강·금속",
        "34": "금속 제품", "35": "기계·컴퓨터", "36": "전자·반도체", "37": "운송 장비", "38": "계측·의료기기", "39": "기타 제조",
        "40": "철도", "42": "트럭 운송", "44": "해운", "45": "항공", "47": "운송 서비스", "48": "통신", "49": "유틸리티",
        "50": "도매", "51": "도매", "52": "소매(건자재)", "53": "소매(종합)", "54": "소매(식품)", "55": "소매(자동차)",
        "56": "소매(의류)", "57": "소매(가구)", "58": "외식", "59": "소매(기타)", "60": "은행", "61": "대출", "62": "증권·거래소",
        "63": "보험", "64": "보험 중개", "65": "부동산", "67": "지주·리츠", "70": "숙박", "72": "개인 서비스",
        "73": "소프트웨어·IT 서비스", "75": "자동차 서비스", "78": "영화·오락", "79": "오락·레저", "80": "의료 서비스",
        "82": "교육", "83": "사회 서비스", "87": "엔지니어링·연구·컨설팅", "99": "기타"}


def sic_kr(sic):
    s = str(sic or "")
    if s == "2834" or s == "2836":
        return "제약·바이오"
    if s in ("3674",):
        return "반도체"
    if s in ("7372", "7370", "7371", "7373", "7374"):
        return "소프트웨어·IT 서비스"
    return SIC2.get(s[:2], "")


def cagr(a, b, n):
    if a is None or b is None or a <= 0 or b <= 0 or n <= 0:
        return None
    return (b / a) ** (1 / n) - 1


def clip(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def main():
    nq = nasdaq_listed()
    ol = other_listed()
    r2k = russell2000()
    ndx = nasdaq100()
    in_private = {f.stem.replace("_rolling", "") for f in ROLL.glob("*_rolling.json")}

    uni = {}
    for t, nm in nq.items():
        uni[t] = {"name": nm, "sec": "", "f": "Q"}
    for t, nm in ol.items():
        uni.setdefault(t, {"name": nm, "sec": "", "f": "Y"})
    for t, (nm, sec) in r2k.items():
        u = uni.setdefault(t, {"name": nm, "sec": "", "f": ""})
        u["sec"] = sec
        u["f"] += "R"
    for t in ndx:
        u = uni.setdefault(t, {"name": t, "sec": "", "f": ""})
        u["f"] += "N"
    print("universe", len(uni), flush=True)

    tick = get("https://www.sec.gov/files/company_tickers.json").json()
    cmap = {v["ticker"].upper(): int(v["cik_str"]) for v in tick.values()}

    rev = series(["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet",
                  "RevenueFromContractWithCustomerIncludingAssessedTax"], "USD")
    ni = series(["NetIncomeLoss"], "USD")
    eps = series(["EarningsPerShareDiluted", "EarningsPerShareBasicAndDiluted"], "USD-per-shares")
    opi = series(["OperatingIncomeLoss"], "USD")
    ocf = series(["NetCashProvidedByUsedInOperatingActivities"], "USD")
    capex = series(["PaymentsToAcquirePropertyPlantAndEquipment"], "USD")
    sh = series(["WeightedAverageNumberOfDilutedSharesOutstanding"], "shares")
    eq = series(["StockholdersEquity"], "USD", instant=True)
    cash = series(["CashAndCashEquivalentsAtCarryingValue"], "USD", instant=True)
    ltd = series(["LongTermDebt", "LongTermDebtNoncurrent"], "USD", instant=True)
    ltdc = series(["LongTermDebtCurrent", "DebtCurrent"], "USD", instant=True)

    rows = {}
    for t, u in uni.items():
        cik = cmap.get(t.upper()) or cmap.get(t.upper().replace(".", "-"))
        if not cik or cik not in ni:
            continue
        yrs = sorted(y for y in ni[cik] if y in YEARS)
        if len(yrs) < 5:
            continue
        last = yrs[-1]
        if last < 2024:  # 최근 공시가 끊긴 회사 제외
            continue
        last10 = yrs[-10:]
        R, N, E, O, F, S = (rev.get(cik, {}), ni[cik], eps.get(cik, {}), opi.get(cik, {}),
                            ocf.get(cik, {}), sh.get(cik, {}))
        prof_years = sum(1 for y in last10 if N.get(y, 0) > 0)
        ry = sorted(y for y in R if y in YEARS)
        rg = cagr(R[ry[0]], R[ry[-1]], ry[-1] - ry[0]) if len(ry) >= 5 else None
        ey = sorted(y for y in E if y in YEARS)
        eg = None
        if len(ey) >= 5:
            a = statistics.mean(E[y] for y in ey[:2]); b = statistics.mean(E[y] for y in ey[-2:])
            eg = cagr(a, b, ey[-1] - ey[0] - 1) if a > 0 and b > 0 else None
        # 투하자본이익률(근사): 영업이익×(1−21%) ÷ (자기자본 + 빚 − 현금), 최근 3년 중간값
        roics = []
        for y in yrs[-3:]:
            op = O.get(y)
            ic = (eq.get(cik, {}).get(y) or 0) + (ltd.get(cik, {}).get(y) or 0) + (ltdc.get(cik, {}).get(y) or 0) - (cash.get(cik, {}).get(y) or 0)
            if op is not None and ic > 0:
                roics.append(op * 0.79 / ic)
        roic = statistics.median(roics) if roics else None
        fcf = {y: F[y] - (capex.get(cik, {}).get(y) or 0) for y in F if y in YEARS}
        fy10 = [y for y in last10 if y in fcf]
        fcf_pos = (sum(1 for y in fy10 if fcf[y] > 0) / len(fy10)) if fy10 else None
        fm = [fcf[y] / R[y] for y in yrs[-3:] if y in fcf and R.get(y)]
        fcfm = statistics.mean(fm) if fm else None
        debt = (ltd.get(cik, {}).get(last) or 0) + (ltdc.get(cik, {}).get(last) or 0)
        nd = debt - (cash.get(cik, {}).get(last) or 0)
        nd_ocf = (nd / F[last]) if F.get(last) and F[last] > 0 else None
        sy = sorted(y for y in S if y in YEARS)
        dil = (S[sy[-1]] / S[sy[-6]] - 1) if len(sy) >= 6 and S[sy[-6]] > 0 else None

        consist = prof_years / len(last10)
        score = (20 * consist
                 + 15 * (clip(rg / 0.15) if rg is not None else 0)
                 + 15 * (clip(eg / 0.15) if eg is not None else 0)
                 + 20 * (clip(roic / 0.25) if roic is not None else 0)
                 + 10 * ((0.5 * (fcf_pos or 0)) + 0.5 * (clip(fcfm / 0.15) if fcfm is not None else 0))
                 + 10 * (1.0 if nd <= 0 else (clip(1 - nd_ocf / 4) if nd_ocf is not None else 0))
                 + 10 * (clip(1 - dil / 0.2) if dil is not None else 0.5))
        rows[t] = dict(t=t, n=u["name"][:60], cik=cik, sec=u["sec"], f=u["f"] + ("S" if t in in_private else ""),
                       yrs=len(last10), py=prof_years, rg=rg, eg=eg, roic=roic, fpy=fcf_pos, fcfm=fcfm,
                       nd=nd_ocf, netcash=nd <= 0, dil=dil, sc=round(score, 1),
                       _eps=E.get(last), _sh=S.get(last), _fcf=fcf.get(last), _last=last)
    print("fundamentals ok", len(rows), flush=True)

    # ── 3. 주가 (월간, 배당 포함 수정주가) ──
    ytk = {t: t.replace(".", "-") for t in rows}
    prices = {}
    tl = list(ytk.values()) + ["SPY"]
    for i in range(0, len(tl), 150):
        chunk = tl[i:i + 150]
        try:
            df = yf.download(chunk, period="11y", interval="1mo", auto_adjust=True, progress=False, threads=True)["Close"]
            if isinstance(df, pd.Series):
                df = df.to_frame(chunk[0])
            for c in df.columns:
                s = df[c].dropna()
                if len(s) >= 24:
                    prices[c] = s
        except Exception as e:
            print("  yf err", e, flush=True)
        print("  prices", i + len(chunk), "/", len(tl), flush=True)
    spy = prices.get("SPY")

    out = []
    for t, r in rows.items():
        s = prices.get(ytk[t])
        if s is None:
            continue
        px = float(s.iloc[-1])
        mcap = px * (r["_sh"] or 0)
        if mcap < MIN_MCAP:
            continue
        span = (s.index[-1] - s.index[0]).days / 365.25
        pc = cagr(float(s.iloc[0]), px, span) if span >= 3 else None
        xs = None
        if pc is not None and spy is not None:
            sp = spy[spy.index >= s.index[0]]
            spc = cagr(float(sp.iloc[0]), float(sp.iloc[-1]), span) if len(sp) > 1 else None
            xs = pc - spc if spc is not None else None
        pe = px / r["_eps"] if r["_eps"] and r["_eps"] > 0 else None
        fyld = (r["_fcf"] / mcap) if r["_fcf"] is not None and mcap else None
        rd = lambda v, k=3: None if v is None or (isinstance(v, float) and math.isnan(v)) else round(v, k)
        out.append(dict(t=t, n=r["n"], sec=r["sec"], f=r["f"], mc=round(mcap / 1e9, 2), px=round(px, 2),
                        sc=r["sc"], yrs=r["yrs"], py=r["py"], rg=rd(r["rg"]), eg=rd(r["eg"]), roic=rd(r["roic"]),
                        fpy=rd(r["fpy"], 2), fcfm=rd(r["fcfm"]), nd=rd(r["nd"], 2), nc=r["netcash"], dil=rd(r["dil"]),
                        pe=rd(pe, 1), fy=rd(fyld), pc=rd(pc), xs=rd(xs), sp=round(span, 1), fyr=r["_last"]))
    # 러셀2000 표시(추정): 공시가 있는 미국 상장사를 시가총액 순으로 세워 1,001~3,000위
    allmc = sorted((((rows[t]["_sh"] or 0) * float(prices[ytk[t]].iloc[-1])), t) for t in rows if ytk[t] in prices)
    allmc.sort(reverse=True)
    approx = {t for _, t in allmc[1000:3000]}
    for o in out:
        if o["t"] in approx and "R" not in o["f"]:
            o["f"] += "R"
    print("russell2000 approx", len(approx), flush=True)

    # 업종: SEC 회사 정보(SIC 코드) — 시가총액 조건을 통과한 회사만 조회
    for i, o in enumerate(out):
        cik = rows[o["t"]]["cik"]
        r = get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json")
        time.sleep(0.11)
        if r:
            j = r.json()
            o["sic"] = j.get("sic") or ""
            o["sicd"] = (j.get("sicDescription") or "")[:60]
            o["ind"] = sic_kr(o["sic"])
            if not o["sec"]:
                o["sec"] = o["ind"]
        if i % 200 == 0:
            print("  sic", i, "/", len(out), flush=True)
    out.sort(key=lambda x: -x["sc"])
    (OUT / "universe.json").write_text(json.dumps({
        "asOf": time.strftime("%Y-%m-%d"),
        "minMcap": MIN_MCAP,
        "r2kSrc": "추정: 공시가 있는 미국 상장사 중 시가총액 1,001~3,000위(러셀2000의 선정 기준. 실제 목록과 일부 다를 수 있음)",
        "note": "SEC XBRL frames(달력 연도 기준) + Yahoo 월간 수정주가. 투하자본이익률은 영업이익×0.79÷(자기자본+빚−현금) 근사.",
        "rows": out}, ensure_ascii=False, separators=(",", ":")))
    print("saved", len(out), "rows", flush=True)


if __name__ == "__main__":
    main()
