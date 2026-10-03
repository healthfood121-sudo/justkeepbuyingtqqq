"""
withdrawal_recommend.py

권장 전략 설계: T25 + 자산별 현금 비중 — 단계 기준·비중·생활비 규칙 비교
──────────────────────────────────────────────────────────────────────────────
조건은 withdrawal_full_period.py와 동일 (상한 없는 동적 인출, 스왑금리, 모든 매도 과세, 외화RP 세후,
신호 다음 거래일 매매, 1971-02~2026-09 매달 시작해 오늘까지 보유).

A. 현금 비중 단계 (생활비는 매달 자산 × 0.3/0.5/0.7%)
   T25      : 현금 비중 없음
   A3_10    : 시작 자산의 3배↑ TQQQ⅔, 10배↑ TQQQ⅓
   A5_20    : 5배↑ ⅔, 20배↑ ⅓      (= T25C50)
   A10_30   : 10배↑ ⅔, 30배↑ ⅓
   A5       : 5배↑ ⅔ 한 단계만
   A5_20D   : 5배↑ ½, 20배↑ ¼      (더 깊게)
B. 생활비 규칙 (A5_20 및 T25에 적용)
   monthly  : 매달 자산 × 비율 (기본)
   annual   : 12개월마다 그때 자산 × 비율로 정하고 1년 고정 (한 달 총자산의 1% 상한)
   floor75  : 직전 12개월 최고 생활비의 75% 아래로는 안 내림 (한 달 총자산의 1% 상한)

생활비 안정성 지표:
   liv_half_pct  — 생활비가 그때까지 최고 생활비의 절반 아래였던 달의 비율
   liv_worst_cut — 생활비가 최고 대비 가장 많이 줄어든 비율
   min_vs_init   — 보유 중 총자산 최저값 (시작 10억 대비)

출력: web/public/data/withdrawal_recommend.json
"""

import json, time
import multiprocessing as mp
import numpy as np
import pandas as pd

import withdrawal_cash_tier as E
from withdrawal_full_period import irr, q

OUT_PATH = E.ROOT / "web/public/data/withdrawal_recommend.json"
EOK = E.EOK
P = E.Param
YEARS = (10, 20, 30)
SNAPS = tuple(y * 252 for y in YEARS)


def t25(name, tiers=((0, 1.0),), liv="monthly"):
    return P(name, "", tiers, trail_thr=0.25, liv_rule=liv)


TIER = {
    "A3_10":  ((0, 1.0), (30 * EOK, 2 / 3), (100 * EOK, 1 / 3)),
    "A5_20":  ((0, 1.0), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)),
    "A10_30": ((0, 1.0), (100 * EOK, 2 / 3), (300 * EOK, 1 / 3)),
    "A5":     ((0, 1.0), (50 * EOK, 2 / 3)),
    "A5_20D": ((0, 1.0), (50 * EOK, 1 / 2), (200 * EOK, 1 / 4)),
}

STRATS = [
    ("T25",            "T25 · 현금 비중 없음 · 매달",          t25("T25")),
    ("A3_10",          "3배↑ ⅔ · 10배↑ ⅓ · 매달",            t25("A3_10", TIER["A3_10"])),
    ("A5_20",          "5배↑ ⅔ · 20배↑ ⅓ · 매달",            t25("A5_20", TIER["A5_20"])),
    ("A10_30",         "10배↑ ⅔ · 30배↑ ⅓ · 매달",           t25("A10_30", TIER["A10_30"])),
    ("A5",             "5배↑ ⅔ 한 단계 · 매달",               t25("A5", TIER["A5"])),
    ("A5_20D",         "5배↑ ½ · 20배↑ ¼ · 매달",            t25("A5_20D", TIER["A5_20D"])),
    ("A5_20_annual",   "5배↑ ⅔ · 20배↑ ⅓ · 1년 고정",         t25("A5_20_annual", TIER["A5_20"], "annual")),
    ("A5_20_floor75",  "5배↑ ⅔ · 20배↑ ⅓ · 최고의 75% 하한",  t25("A5_20_floor75", TIER["A5_20"], "floor75")),
    ("T25_annual",     "T25 · 1년 고정",                     t25("T25_annual", liv="annual")),
    ("T25_floor75",    "T25 · 최고의 75% 하한",               t25("T25_floor75", liv="floor75")),
    # 초반 보호: 기본 현금 버퍼 / 오를 때만 현금으로 옮기기
    ("B15_5_20",       "기본 현금 15% + 5배↑ ⅔ · 20배↑ ⅓",      t25("B15_5_20", ((0, 0.85), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)))),
    ("B15_5_20_sell",  "기본 현금 15% + 5·20배 · 파는 쪽만 리밸",  P("B15_5_20_sell", "", ((0, 0.85), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)),
                                                                   trail_thr=0.25, rebal_sell_only=True)),
    ("A5_20_sell",     "5배↑ ⅔ · 20배↑ ⅓ · 파는 쪽만 리밸",      P("A5_20_sell", "", TIER["A5_20"], trail_thr=0.25, rebal_sell_only=True)),
    ("B25_5_20",       "기본 현금 25% + 5배↑ ⅔ · 20배↑ ⅓",      t25("B25_5_20", ((0, 0.75), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)))),
    ("B15_5_20_annual", "기본 현금 15% + 5·20배 · 1년 고정",       t25("B15_5_20_annual", ((0, 0.85), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)), "annual")),
    # 최종 후보: 1년에 한 번 점검 (생활비 결정 + 오를 때만 현금으로 옮기기)
    *[(f"R{b}", f"기본 현금 {b}% + 5배↑ ⅔ · 20배↑ ⅓ · 1년에 한 번 점검",
       P(f"R{b}", "", ((0, 1 - b / 100), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)), trail_thr=0.25,
         liv_rule="annual", rebal_annual=True, rebal_sell_only=True)) for b in (0, 10, 15, 20, 25, 30)],
]

_S = {}


def _init(*args):
    keys = ("tq", "qq", "closes", "ema", "dates", "rp", "rsi", "peaks", "starts")
    _S.update(dict(zip(keys, args)))
    _S["dates"] = pd.DatetimeIndex(_S["dates"])


def _job(idx):
    name, _, p = STRATS[idx]
    s = _S
    n = len(s["closes"])
    out = []
    for si in s["starts"]:
        r = E.run_sim(s["tq"], s["qq"], s["closes"], s["ema"], s["dates"], s["rp"], s["rsi"], s["peaks"],
                      si, p, True, exec_mode="loc", horizon_days=n, snaps=SNAPS, collect_flows=True)
        r["irr"] = irr(r.pop("flows"), r["final"], r["years"])
        out.append(r)
    return name, out


def main():
    E.LIV_MAX = float("inf")
    t0 = time.time()
    tq, qq, closes, ema, dates, rp, rsi, peaks = E.load_data()
    starts = E.get_monthly_starts(dates)
    labels = [dates[i].strftime("%Y-%m") for i in starts]
    with mp.Pool(min(mp.cpu_count(), len(STRATS)), initializer=_init,
                 initargs=(tq, qq, closes, ema, dates.tolist(), rp, rsi, peaks, starts)) as pool:
        raw = dict(pool.map(_job, range(len(STRATS)), chunksize=1))

    summary = []
    for name, desc, _ in STRATS:
        full = [r for r in raw[name] if r["years"] >= 10]
        ir = sorted(r["irr"] for r in full)
        mins = sorted(r["min"] for r in full)
        row = {
            "name": name, "desc": desc,
            "med_irr_pct":   round(q(ir, 0.5), 1),
            "p10_irr_pct":   round(q(ir, 0.10), 1),
            "worst_irr_pct": round(ir[0], 1),
            "n_below_init":  sum(1 for r in full if r["final"] < 10),
            "med_max_dd":    round(q(sorted(r["max_dd"] for r in full), 0.5), 1),
            "p10_min_eok":   round(q(mins, 0.10), 2),
            "med_min_eok":   round(q(mins, 0.5), 2),
            "liv_half_pct":  round(q(sorted(r["liv_half_pct"] for r in full), 0.5), 1),
            "p90_liv_half_pct": round(q(sorted(r["liv_half_pct"] for r in full), 0.9), 1),
            "med_liv_worst_cut": round(q(sorted(r["liv_worst_cut"] for r in full), 0.5), 1),
            "rebals_per_10y": round(sum(r["rebals"] / r["years"] * 10 for r in full) / len(full), 1),
            "by_year": {},
        }
        for y, k in zip(YEARS, SNAPS):
            rs = [r for r in raw[name] if k in r["snaps"]]
            tot = sorted(r["snaps"][k] + r["snaps_wd"][k] for r in rs)
            liv = sorted(r["snaps_liv"][k] for r in rs)
            row["by_year"][str(y)] = {
                "med_total": round(q(tot, 0.5), 1), "p10_total": round(q(tot, 0.10), 1),
                "med_living_man": q(liv, 0.5), "p10_living_man": q(liv, 0.10),
            }
        summary.append(row)

    print(f"{'설계':<15}{'IRR':>6}{'하위10%':>8}{'최악':>6}{'<10억':>5}{'낙폭':>5}{'최저자산p10':>10}"
          f"{'생활비반토막':>11}{'(90%)':>7}{'최대삭감':>8}{'리밸/10y':>8} | 10/20/30년 월생활비 중간 (하위10%)")
    for r in summary:
        yy = " | ".join(f"{r['by_year'][str(y)]['med_living_man']:,}({r['by_year'][str(y)]['p10_living_man']:,})" for y in YEARS)
        print(f"{r['name']:<15}{r['med_irr_pct']:5.1f}%{r['p10_irr_pct']:7.1f}%{r['worst_irr_pct']:5.1f}%{r['n_below_init']:5}"
              f"{r['med_max_dd']:4.0f}%{r['p10_min_eok']:9.1f}억{r['liv_half_pct']:9.1f}%{r['p90_liv_half_pct']:6.1f}%"
              f"{r['med_liv_worst_cut']:7.0f}%{r['rebals_per_10y']:7.1f} | {yy}")

    cohorts = []
    for k, lab in enumerate(labels):
        row = {"s": lab, "y": round(raw["T25"][k]["years"], 1)}
        for name, *_ in STRATS:
            r = raw[name][k]
            row[name] = {"i": r["irr"] if r["years"] >= 1 else None, "f": r["final"], "w": r["withdrawn"],
                         "dd": r["max_dd"], "mn": r["min"], "lh": r["liv_half_pct"], "lc": r["liv_worst_cut"]}
        cohorts.append(row)
    out = {"meta": {"generated": str(dates[-1].date()),
                    "conditions": "T25 신호 · 상한 없는 동적 인출 · 스왑금리 · 모든 매도 과세 · 외화RP 세후 · 신호 다음 거래일 매매",
                    "strategies": [{"name": n, "desc": d} for n, d, _ in STRATS]},
           "summary": summary, "cohorts": cohorts}
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
