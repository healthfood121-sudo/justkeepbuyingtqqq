"""
real_vs_synthetic.py

실제 ETF 가격(TQQQ·QLD·QQQ) vs 백테스트 합성 가격 비교 — 합성 가격이 실제를 얼마나 잘 따라가는지 검증.
──────────────────────────────────────────────────────────────────────────────
실제: data/extra/{tqqq,qld,qqq}.csv 의 AdjClose (배당·분할 반영, fetch_market_extra.py로 받음)
합성: data_loader.load_ndx_prices — 'with_costs'(운용보수 + 스왑금리, 사이트 기본) / 'standard'(운용보수만)
기간: 각 ETF 상장일 ~ data/ndx_1971_now.csv 마지막 날 (백테스트와 같은 끝 날짜)

출력: web/public/data/real_vs_synthetic.json
  python scripts/real_vs_synthetic.py
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd

from data_loader import load_ndx_prices

ROOT     = Path(__file__).resolve().parent.parent
EXTRA    = ROOT / "data/extra"
OUT_PATH = ROOT / "web/public/data/real_vs_synthetic.json"

ETFS = [("tqqq", "ndx3x", "TQQQ"), ("qld", "ndx2x", "QLD"), ("qqq", "ndx1x", "QQQ")]


def cagr(a: np.ndarray, years: float) -> float:
    return (a[-1] / a[0]) ** (1 / years) - 1


def mdd(a: np.ndarray) -> float:
    return float((a / np.maximum.accumulate(a) - 1).min())


def main():
    syn = {m: load_ndx_prices(m) for m in ("with_costs", "standard")}
    dates = syn["with_costs"]["dates"]
    out = {"asof": str(dates[-1].date()), "etfs": {}}

    for fname, key, label in ETFS:
        raw  = pd.read_csv(EXTRA / f"{fname}.csv", parse_dates=["Date"]).set_index("Date")
        real = raw["AdjClose"]
        s_cost = pd.Series(syn["with_costs"][key], index=dates)
        s_fee  = pd.Series(syn["standard"][key], index=dates)
        df = pd.concat({"real": real, "cost": s_cost, "fee": s_fee}, axis=1, join="inner").dropna()
        df = df / df.iloc[0] * 100
        d0, d1 = df.index[0], df.index[-1]
        years = (d1 - d0).days / 365.25

        r = {k: df[k].values for k in df}
        c = {k: cagr(v, years) for k, v in r.items()}

        # 일별 수익률 차이 (추적 정확도)
        dr = df.pct_change().dropna()
        diff = dr["real"] - dr["cost"]
        corr = float(dr["real"].corr(dr["cost"]))

        # 연도별 수익률
        ye = df.groupby(df.index.year).last()
        prev = pd.concat([df.iloc[[0]], ye.iloc[:-1]])
        prev.index = ye.index
        yr = (ye / prev.values - 1)
        yearly = [{
            "year": int(y),
            "real": round(float(yr.loc[y, "real"]) * 100, 1),
            "cost": round(float(yr.loc[y, "cost"]) * 100, 1),
            "fee":  round(float(yr.loc[y, "fee"]) * 100, 1),
            "partial": bool(y == d0.year and d0.month > 1) or bool(y == d1.year and d1.month < 12),
        } for y in yr.index]

        # 월말 값 (차트용)
        me = df.groupby([df.index.year, df.index.month]).last()
        monthly = [{"m": f"{y}-{m:02d}", "real": round(float(v.real), 2),
                    "cost": round(float(v.cost), 2), "fee": round(float(v.fee), 2)}
                   for (y, m), v in me.iterrows()]

        # 5년 보유 구간별 연평균 수익률 차이 (매월 시작)
        roll = []
        idx = df.index
        for (y, m), _ in me.iterrows():
            st = idx[idx >= pd.Timestamp(y, m, 1)][0]
            en_t = st + pd.DateOffset(years=5)
            if en_t > d1:
                break
            en = idx[idx <= en_t][-1]
            g = {k: (df.loc[en, k] / df.loc[st, k]) ** (1 / 5) - 1 for k in ("real", "cost")}
            roll.append((g["real"] - g["cost"]) * 100)
        roll = np.array(roll)

        # 배당을 뺀 실제 가격(Close, 분할만 반영) — 배당이 차이의 얼마를 설명하나
        px = raw["Close"].loc[d0:d1]
        c_price = (px.iloc[-1] / px.iloc[0]) ** (1 / years) - 1

        out["etfs"][label] = {
            "start": str(d0.date()), "end": str(d1.date()), "years": round(years, 2),
            "cagr":  {k: round(v * 100, 2) for k, v in c.items()},
            "cagr_price_only": round(c_price * 100, 2),            # 실제, 배당 제외
            "gap_cost": round((c["real"] - c["cost"]) * 100, 2),     # 실제 − 합성(비용 반영), %p/년
            "gap_fee":  round((c["real"] - c["fee"]) * 100, 2),
            "final":   {k: round(float(v[-1]), 1) for k, v in r.items()},   # 시작 100 기준
            "mdd":     {k: round(mdd(v) * 100, 1) for k, v in r.items()},
            "daily": {
                "corr": round(corr, 5),
                "te_annual": round(float(diff.std() * np.sqrt(252)) * 100, 2),   # 일별 차이의 연환산 표준편차
                "abs_mean_bp": round(float(diff.abs().mean()) * 1e4, 2),
            },
            "roll5": {
                "n": int(len(roll)),
                "min": round(float(roll.min()), 2), "median": round(float(np.median(roll)), 2),
                "max": round(float(roll.max()), 2),
            } if len(roll) else None,
            "yearly": yearly,
            "monthly": monthly,
        }

        e = out["etfs"][label]
        print(f"\n[{label}] {e['start']} ~ {e['end']} ({e['years']}년)")
        print(f"  연평균: 실제 {e['cagr']['real']}% · 합성(비용) {e['cagr']['cost']}% · 합성(보수만) {e['cagr']['fee']}%")
        print(f"  배당 제외 실제 {e['cagr_price_only']}% → 배당 몫 {e['cagr']['real'] - e['cagr_price_only']:.2f}%p")
        print(f"  차이: 비용 반영 대비 {e['gap_cost']:+}%p/년 · 보수만 대비 {e['gap_fee']:+}%p/년")
        print(f"  100 → 실제 {e['final']['real']} · 합성 {e['final']['cost']} · 보수만 {e['final']['fee']}")
        print(f"  최대낙폭: 실제 {e['mdd']['real']}% · 합성 {e['mdd']['cost']}%")
        print(f"  일별: 상관 {e['daily']['corr']} · 차이 표준편차(연) {e['daily']['te_annual']}% · 평균 |차이| {e['daily']['abs_mean_bp']}bp")
        if e["roll5"]:
            print(f"  5년 구간 {e['roll5']['n']}개: 실제−합성 {e['roll5']['min']} ~ {e['roll5']['max']} (중간 {e['roll5']['median']})%p/년")

    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"\n→ {OUT_PATH.relative_to(ROOT)} ({OUT_PATH.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
