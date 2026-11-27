"""
export_sp500_rolling.py — S&P 500 지수 자체의 10년 보유 성적 + EPS·배당·PER 분해 (1871년~)

데이터: 로버트 쉴러 ie_data.xls (월별: 주가 P = 월평균 종가, 배당 D·이익 E = 최근 12개월 합, CPI)
- 총수익 지수: 매달 (P_t + D_t/12) / P_{t-1} 로 배당 재투자
- 매년 12월에 사서 10년 뒤 12월에 판다(완결). 10년이 안 찬 구간은 마지막 달까지(진행 중)
- 분해: (1+총수익) = (1+EPS 성장)(1+배당 몫)(1+PER 변화)
    EPS 성장 = (E_매도/E_매수)^(1/년) - 1
    PER 변화 = ((P/E)_매도 / (P/E)_매수)^(1/년) - 1   ← 실제 주가 기준(배당 섞이지 않음)
    배당 몫 = (1+총수익)/(1+주가 상승률) - 1
- 비교 기준: 같은 기간 물가(CPI) 상승률 → "물가를 이겼나"

결과: web/public/data/rolling/SPX_rolling.json  (GitHub Actions export-sp500-rolling.yml 에서 실행)
"""
import io, json, math, statistics, sys
from pathlib import Path
import requests
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "data" / "rolling" / "SPX_rolling.json"
URL = "http://www.econ.yale.edu/~shiller/data/ie_data.xls"


def load():
    r = requests.get(URL, timeout=180, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    raw = pd.read_excel(io.BytesIO(r.content), sheet_name="Data", header=None)
    hdr = next(i for i in range(30) if str(raw.iat[i, 0]).strip() == "Date")
    cols = [str(c).strip() for c in raw.iloc[hdr]]
    df = raw.iloc[hdr + 1:].copy()
    df.columns = cols
    out = []
    for _, row in df.iterrows():
        try:
            d = float(row["Date"]); p = float(row["P"])
        except (TypeError, ValueError):
            continue
        if p != p:
            continue
        y = int(d); m = int(round((d - y) * 100)) or 1
        def f(k):
            try:
                v = float(row[k]); return None if v != v else v
            except (TypeError, ValueError, KeyError):
                return None
        out.append({"ym": f"{y:04d}-{m:02d}", "y": y, "m": m, "P": p, "D": f("D"), "E": f("E"), "CPI": f("CPI")})
    return out


def r2(x): return None if x is None else round(x, 2)


def main():
    rows = load()
    print("months", len(rows), rows[0]["ym"], "→", rows[-1]["ym"], flush=True)
    # 배당·CPI 앞값 채우기 (최근 몇 달은 비어 있다)
    lastD = lastC = None
    for r in rows:
        lastD = r["D"] if r["D"] is not None else lastD; r["Df"] = lastD
        lastC = r["CPI"] if r["CPI"] is not None else lastC; r["Cf"] = lastC
    tr = 1.0; rows[0]["TR"] = tr
    for a, b in zip(rows, rows[1:]):
        d = b["Df"] or 0.0
        tr *= (b["P"] + d / 12) / a["P"]; b["TR"] = tr
    last = rows[-1]
    lastE = next(r for r in reversed(rows) if r["E"] is not None)
    print("last P", last["ym"], last["P"], "last E", lastE["ym"], lastE["E"], flush=True)

    dec = {r["y"]: i for i, r in enumerate(rows) if r["m"] == 12}
    years = sorted(dec)
    rows10y, decomp = [], []
    for y in years:
        i = dec[y]
        j = dec.get(y + 10)
        complete = j is not None
        if not complete:
            j = len(rows) - 1
        b, s = rows[i], rows[j]
        yrs = (j - i) / 12
        if yrs < 1:
            continue
        tot = (s["TR"] / b["TR"]) ** (1 / yrs) - 1
        pr = (s["P"] / b["P"]) ** (1 / yrs) - 1
        infl = (s["Cf"] / b["Cf"]) ** (1 / yrs) - 1 if b["Cf"] and s["Cf"] else None
        real = (1 + tot) / (1 + infl) - 1 if infl is not None else None
        row = {
            "buyYear": y, "sellYear": s["y"], "sellDate": f"{s['ym']}-28" if not complete else f"{s['y']}-12-31",
            "yearsActual": round(yrs, 1), "cagr": r2(tot * 100), "multiple": round(s["TR"] / b["TR"], 4),
            "isComplete": complete, "priceCagr": r2(pr * 100),
            "inflCagr": r2(infl * 100) if infl is not None else None,
            "realCagr": r2(real * 100) if real is not None else None,
        }
        eb = b["E"]
        if eb and eb > 0:
            row["peBuyActual"] = round(b["P"] / eb, 1)
            row["peBuy"] = round(b["P"] / eb, 1)
        rows10y.append(row)
        # 분해: 완결 구간 + 9년 이상 진행 구간(매도 EPS = 최신 E)
        es_row = s if complete else lastE
        es = es_row["E"]
        if eb and es and eb > 0 and es > 0 and (complete or yrs >= 9):
            peb = b["P"] / eb
            pes = (s["P"] if complete else last["P"]) / es
            eg = (es / eb) ** (1 / yrs) - 1
            pg = (pes / peb) ** (1 / yrs) - 1
            dv = (1 + tot) / (1 + pr) - 1
            note = []
            if eb / b["P"] < 0.02 or (pes > 40):
                pass
            decomp.append({
                "buyYear": y, "sellYear": s["y"], "epsBuy": round(eb, 2), "epsSell": round(es, 2),
                "epsMultiple": round(es / eb, 2), "peBuy": round(peb, 1), "peSell": round(pes, 1),
                "peMultiple": round(pes / peb, 2), "epsGrowthCagr": r2(eg * 100), "peCagr": r2(pg * 100),
                "divCagr": r2(dv * 100), "priceCagr": r2(pr * 100), "totalCagr": r2(tot * 100),
                "inflCagr": row["inflCagr"], "note": None,
                "inProgress": not complete, "years": round(yrs, 1),
            })

    done = [r for r in rows10y if r["isComplete"]]
    cs = [r["cagr"] for r in done]
    mn = min(done, key=lambda r: r["cagr"]); mx = max(done, key=lambda r: r["cagr"])
    pct = lambda k: round(100 * sum(1 for c in cs if c > k) / len(cs), 1)
    stats = {
        "n": len(done), "min": mn["cagr"], "minBuy": str(mn["buyYear"]), "median": round(statistics.median(cs), 2),
        "mean": round(statistics.mean(cs), 2), "max": mx["cagr"], "maxBuy": str(mx["buyYear"]),
        "over10": pct(10), "over15": pct(15), "over20": pct(20),
        "losses": sum(1 for c in cs if c < 0),
        "realLosses": sum(1 for r in done if r["realCagr"] is not None and r["realCagr"] < 0),
        "realMedian": round(statistics.median([r["realCagr"] for r in done if r["realCagr"] is not None]), 2),
        "beatInfl": sum(1 for r in done if r["realCagr"] is not None and r["realCagr"] > 0),
        "beatBench": None, "beatTotal": None,
    }
    first = rows[0]
    yrs_all = (len(rows) - 1) / 12
    out = {
        "ticker": "SPX", "name": "S&P 500 지수", "currency": "USD", "benchmark": "물가(CPI)", "type": "index",
        "note": "로버트 쉴러 데이터(월평균 주가, 최근 12개월 배당·이익). 1957년 이전은 S&P 90·카울스 지수로 이어 붙인 값.",
        "dataThrough": last["ym"], "epsThrough": lastE["ym"],
        "current": {"price": round(last["P"], 2), "pe": round(last["P"] / lastE["E"], 1),
                    "divYield": round(100 * (last["Df"] or 0) / last["P"], 2), "eps": round(lastE["E"], 2)},
        "fullPeriod": {"start_date": f"{first['ym']}-01", "end_date": f"{last['ym']}-28", "start_price": first["P"],
                       "end_price": round(last["P"], 2), "years": round(yrs_all, 1),
                       "cagr": round(((last["TR"]) ** (1 / yrs_all) - 1) * 100, 2), "multiple": round(last["TR"], 1)},
        "stats": stats, "rows10y": rows10y, "loss5y": [], "epsDecomp": decomp,
        "epsNote": f"EPS·배당: 쉴러 ie_data.xls(최근 12개월 합). EPS는 {lastE['ym']}까지. 주가는 월평균이라 연말 종가와 조금 다르다.",
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("saved", OUT, "rows", len(rows10y), "decomp", len(decomp), "stats", stats, flush=True)


if __name__ == "__main__":
    main()
