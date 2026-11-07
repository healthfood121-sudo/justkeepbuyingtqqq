"""
screen_universe.py — 나스닥 상장·러셀2000·나스닥100 종목에서 '숨은 알짜'를 숫자로 1차 선별

데이터 (모두 무료·공개, 샌드박스에서 접속 불가 → GitHub Actions 'screen-universe'에서 실행)
  - 종목 목록: nasdaqtrader.com 나스닥 상장 목록, iShares IWM(러셀2000) 보유 종목, Invesco QQQ(나스닥100) 보유 종목
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
WEB_UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
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


def russell2000():
    url = ("https://www.ishares.com/us/products/239710/ishares-russell-2000-etf/1467271812596.ajax"
           "?fileType=csv&fileName=IWM_holdings&dataType=fund")
    r = get(url, WEB_UA)
    out = {}
    if not r:
        return out
    lines = r.text.splitlines()
    hdr = next((i for i, l in enumerate(lines) if l.startswith("Ticker,")), None)
    if hdr is None:
        print("IWM header not found", lines[:5], flush=True)
        return out
    df = pd.read_csv(io.StringIO("\n".join(lines[hdr:])), on_bad_lines="skip")
    df = df[df.get("Asset Class", "Equity") == "Equity"] if "Asset Class" in df.columns else df
    for _, row in df.iterrows():
        t = str(row.get("Ticker", "")).strip()
        if t and t != "nan" and t != "-":
            out[t] = (str(row.get("Name", "")).strip(), str(row.get("Sector", "")).strip())
    print("russell2000", len(out), flush=True)
    return out


def nasdaq100():
    r = get("https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/QQQ/holdings/fund", WEB_UA)
    out = set()
    try:
        for h in r.json().get("holdings", []):
            t = (h.get("ticker") or "").strip()
            if t:
                out.add(t)
    except Exception as e:
        print("ndx err", e, flush=True)
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


def cagr(a, b, n):
    if a is None or b is None or a <= 0 or b <= 0 or n <= 0:
        return None
    return (b / a) ** (1 / n) - 1


def clip(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def main():
    nq = nasdaq_listed()
    r2k = russell2000()
    ndx = nasdaq100()
    in_private = {f.stem.replace("_rolling", "") for f in ROLL.glob("*_rolling.json")}

    uni = {}
    for t, nm in nq.items():
        uni[t] = {"name": nm, "sec": "", "f": "Q"}
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
    out.sort(key=lambda x: -x["sc"])
    (OUT / "universe.json").write_text(json.dumps({
        "asOf": time.strftime("%Y-%m-%d"),
        "minMcap": MIN_MCAP,
        "note": "SEC XBRL frames(달력 연도 기준) + Yahoo 월간 수정주가. 투하자본이익률은 영업이익×0.79÷(자기자본+빚−현금) 근사.",
        "rows": out}, ensure_ascii=False, separators=(",", ":")))
    print("saved", len(out), "rows", flush=True)


if __name__ == "__main__":
    main()
