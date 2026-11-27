"""
export_ndx_rolling.py — 나스닥100 지수 자체의 10년 보유 성적 + EPS·PER 분해 (1990년~)

데이터:
- 지수: data/ndx_1971_now.csv (일별 종가) → 월말 종가. 배당은 빠진 가격 지수(나스닥100 배당은 연 약 0.5~1%, 추정)
- PER: data/ndx_pe_monthly_worldperatio.csv — worldperatio.com 나스닥100 차트(detailPE_data)의 월별 최근 12개월 PER(제3자 추정치)
  → EPS = 월말 지수 ÷ 그 달 PER (지수 단위 EPS, 추정)
- 매년 12월 말 매수 → 10년 뒤 12월 말(완결) / 진행 중은 마지막 달까지
- 분해: (1+가격 수익률) = (1+EPS 성장)(1+PER 변화). 배당 몫 없음
- 물가: data/extra 의 CPI가 없어 SPX_rolling.json 의 쉴러 CPI 대신 → 물가 비교 생략

결과: web/public/data/rolling/NDX_rolling.json  (로컬 실행: python3 scripts/export_ndx_rolling.py)
"""
import csv, json, statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "data" / "rolling" / "NDX_rolling.json"


def main():
    close = {}
    for r in csv.DictReader(open(ROOT / "data" / "ndx_1971_now.csv")):
        close[r["Date"][:7]] = float(r["Close"])          # 그달 마지막 거래일 값이 남는다
    pe = {r["month"]: float(r["pe"]) for r in csv.DictReader(open(ROOT / "data" / "ndx_pe_monthly_worldperatio.csv"))}
    months = sorted(close)
    last_m = months[-1]
    pe_m = sorted(k for k in pe if k in close and pe[k] > 0)
    eps = {k: close[k] / pe[k] for k in pe_m}
    last_e = pe_m[-1]
    print("price", months[0], "→", last_m, "PE", pe_m[0], "→", last_e, flush=True)

    idx = {m: i for i, m in enumerate(months)}
    rows10y, decomp = [], []
    for y in range(1990, int(last_m[:4]) + 1):
        b = f"{y}-12"
        if b not in close: continue
        s = f"{y+10}-12"
        complete = s in close
        if not complete: s = last_m
        yrs = (idx[s] - idx[b]) / 12
        if yrs < 1: continue
        tot = (close[s] / close[b]) ** (1 / yrs) - 1
        row = {"buyYear": y, "sellYear": int(s[:4]), "sellDate": f"{s}-28" if not complete else f"{s[:4]}-12-31",
               "yearsActual": round(yrs, 1), "cagr": round(tot * 100, 2), "multiple": round(close[s] / close[b], 4),
               "isComplete": complete, "priceCagr": round(tot * 100, 2), "inflCagr": None, "realCagr": None}
        if b in eps:
            row["peBuyActual"] = round(pe[b], 1); row["peBuy"] = round(pe[b], 1)
        rows10y.append(row)
        es_m = s if complete else last_e
        if b in eps and es_m in eps and (complete or yrs >= 9):
            pes = pe[es_m] if complete else close[last_m] / eps[last_e]
            eg = (eps[es_m] / eps[b]) ** (1 / yrs) - 1
            pg = (pes / pe[b]) ** (1 / yrs) - 1
            decomp.append({"buyYear": y, "sellYear": int(s[:4]), "epsBuy": round(eps[b], 2), "epsSell": round(eps[es_m], 2),
                           "epsMultiple": round(eps[es_m] / eps[b], 2), "peBuy": round(pe[b], 1), "peSell": round(pes, 1),
                           "peMultiple": round(pes / pe[b], 2), "epsGrowthCagr": round(eg * 100, 2), "peCagr": round(pg * 100, 2),
                           "divCagr": 0.0, "priceCagr": round(tot * 100, 2), "totalCagr": round(tot * 100, 2), "inflCagr": None,
                           "note": None, "inProgress": not complete, "years": round(yrs, 1)})
    done = [r for r in rows10y if r["isComplete"]]
    cs = [r["cagr"] for r in done]
    mn = min(done, key=lambda r: r["cagr"]); mx = max(done, key=lambda r: r["cagr"])
    pct = lambda k: round(100 * sum(1 for c in cs if c > k) / len(cs), 1)
    stats = {"n": len(done), "min": mn["cagr"], "minBuy": str(mn["buyYear"]), "median": round(statistics.median(cs), 2),
             "mean": round(statistics.mean(cs), 2), "max": mx["cagr"], "maxBuy": str(mx["buyYear"]),
             "over10": pct(10), "over15": pct(15), "over20": pct(20), "losses": sum(1 for c in cs if c < 0),
             "realLosses": None, "realMedian": None, "beatInfl": None, "beatBench": None, "beatTotal": None}
    f0 = "1990-12"; yrs_all = (idx[last_m] - idx[f0]) / 12
    out = {
        "ticker": "NDX", "name": "나스닥100 지수", "currency": "USD", "benchmark": "없음", "type": "index",
        "note": "지수 월말 종가(배당 제외). PER은 worldperatio.com 월별 추정치, EPS = 지수 ÷ PER.",
        "dataThrough": last_m, "epsThrough": last_e,
        "current": {"price": round(close[last_m], 2), "pe": round(close[last_m] / eps[last_e], 1), "divYield": 0, "eps": round(eps[last_e], 2)},
        "fullPeriod": {"start_date": "1990-12-31", "end_date": f"{last_m}-28", "start_price": round(close[f0], 2),
                       "end_price": round(close[last_m], 2), "years": round(yrs_all, 1),
                       "cagr": round(((close[last_m] / close[f0]) ** (1 / yrs_all) - 1) * 100, 2), "multiple": round(close[last_m] / close[f0], 1)},
        "stats": stats, "rows10y": rows10y, "loss5y": [], "epsDecomp": decomp,
        "monthlyClose": [{"d": m, "p": round(close[m], 2)} for m in months if m >= "1985-10"],
        "epsNote": "PER: worldperatio.com 나스닥100 월별 최근 12개월 PER(제3자 추정치 — 다른 출처와 수 배까지는 아니지만 몇 배 포인트 차이가 난다). 배당 제외.",
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("saved", OUT, len(rows10y), len(decomp), stats, out["current"], flush=True)


if __name__ == "__main__":
    main()
