"""
accumulation_split_recheck.py

적립식 거치금 분할 기간 재검증 — 스왑금리 반영 + '최악 1건'이 아닌 꼬리 지표로
──────────────────────────────────────────────────────────────────────────────
배경: 기존 결론 "3년 월 분할이 TQQQ 최악 소요기간을 12.24년 → 8.82년으로 단축"은 운용보수 반영 전 수치.
      운용보수(0.88%)만 넣어도 3년 분할 최악이 13.15년으로 뒤집힌다 — 1999-01 시작 경우가
      2008년 금융위기 직전에 10억을 넘느냐 못 넘느냐에 따라 4년 넘게 달라지는 '절벽' 때문.

조건: export_split_entry_json.py와 동일 (매일 20만원 적립 + 거치금 2.5억, 목표 10억, 1971-02~ 매달 시작)
비교: 거치금 월 분할 0(즉시)·1·2·3·4·5·6·7년
지표: 완료 비율 · 중간값 · 상위 25/10/5% 소요기간 · 10년 이상 걸린 경우 수 · 최악(시작 시점)
      — 비교 대상은 2011년까지 시작한 경우(15년 이상 데이터가 있어 완료 여부가 의미 있는 경우)
민감도: 스왑금리 반영 가격에 연 비용을 +0.25%p, +0.5%p 더 얹었을 때 최악·상위 5%가 얼마나 흔들리는가

출력: web/public/data/accumulation_split_recheck.json
"""

import json, sys, time
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import data_loader
from data_loader import load_ndx_prices, get_monthly_starts
import export_split_entry_json as S

ROOT     = Path(__file__).resolve().parent.parent
# data_loader의 기본 경로(D:/...) 대신 저장소 기준 경로 사용
data_loader.DATA_DIR = ROOT / "data"
data_loader.FED_PATH = ROOT / "data/fed_funds_rate.json"
OUT_PATH = ROOT / "web/public/data/accumulation_split_recheck.json"
YEARS    = (0, 1, 2, 3, 4, 5, 6, 7)
LAST_START_YEAR = 2011
EXTRA_COSTS = (0.0, 0.0025, 0.005)


def run(prices, dates, starts, n_years):
    out = []
    for ci in starts:
        sched = S.sched_instant() if n_years == 0 else S.sched_monthly_split(dates[ci:], n_years * 12)
        r = S.backtest_one(prices, ci, dates, sched)
        if r:
            out.append(r)
    return out


def stats(cohorts):
    cs = [c for c in cohorts if int(c["s"][:4]) <= LAST_START_YEAR]
    done = [c for c in cs if c["y"] is not None]
    ys = sorted(c["y"] for c in done)
    n = len(ys)
    worst = max(done, key=lambda c: c["y"])
    q = lambda f: round(ys[min(n - 1, int(n * f))], 2)
    return {
        "n": len(cs), "completed_pct": round(len(done) / len(cs) * 100, 1),
        "median": q(0.5), "p75": q(0.75), "p90": q(0.90), "p95": q(0.95),
        "n_10y_plus": sum(1 for y in ys if y >= 10) + (len(cs) - len(done)),
        "worst": worst["y"], "worst_start": worst["s"], "worst_end": worst["e"],
    }


def with_extra_cost(prices, extra):
    if extra == 0:
        return prices
    f = np.r_[1.0, prices[1:] / prices[:-1]] * (1 - extra / 252)
    f[0] = 1.0
    return prices[0] * np.cumprod(f)


def main():
    t0 = time.time()
    result = {"meta": {
        "conditions": "매일 20만원 적립 + 거치금 2.5억(월 분할 N년), 목표 10억, 1971-02~2011-12 시작 경우 비교",
        "years": list(YEARS), "last_start_year": LAST_START_YEAR}, "modes": {}, "sensitivity": {}}
    for mode in ("standard", "with_costs"):
        d = load_ndx_prices(mode)
        dates, starts = d["dates"], get_monthly_starts(d["dates"])
        result["modes"][mode] = {}
        for inst in ("ndx3x", "ndx2x", "ndx1x"):
            rows = {str(y): stats(run(d[inst], dates, starts, y)) for y in YEARS}
            result["modes"][mode][inst] = rows
            print(f"\n[{mode} · {inst}]  분할  완료%  중간  상위25%  상위10%  상위5%  10년+  최악(시작→달성)")
            for y in YEARS:
                r = rows[str(y)]
                print(f"   {y}년  {r['completed_pct']:5.1f}  {r['median']:5.2f}  {r['p75']:6.2f}  {r['p90']:6.2f}  {r['p95']:6.2f}"
                      f"  {r['n_10y_plus']:4}  {r['worst']:5.2f} ({r['worst_start']}→{r['worst_end']})")
        if mode == "with_costs":
            print("\n[민감도 · TQQQ · 스왑금리 반영 + 추가 연 비용]")
            for extra in EXTRA_COSTS:
                px = with_extra_cost(d["ndx3x"], extra)
                rows = {str(y): stats(run(px, dates, starts, y)) for y in YEARS}
                result["sensitivity"][f"{extra:.4f}"] = rows
                print(f"  +{extra*100:.2f}%p: " + " | ".join(
                    f"{y}년 최악 {rows[str(y)]['worst']:.1f} 상위5% {rows[str(y)]['p95']:.1f}" for y in YEARS))
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
