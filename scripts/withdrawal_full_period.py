"""
withdrawal_full_period.py

모든 인출 전략 — 전체 기간(시작 시점부터 2026-09까지) 재검증 + 10·20·30·40·50년 시점별 변화
──────────────────────────────────────────────────────────────────────────────
엔진: withdrawal_cash_tier.run_sim (같은 규칙·비용)
  - TQQQ 스왑금리(기준금리 2배)·QLD 스왑금리(1배)·운용보수
  - 모든 매도에 양도세 22% (연 250만 공제, 다음 해 1월 납부) — 하락 신호 매도 포함
  - 현금은 외화RP: (기준금리 − 0.4%) 이자, 이자소득세 15.4%
  - 실행: 신호 다음 거래일 종가 (D10GK·S7 조기 재매수만 LOC 주문으로 당일 종가)
  - 인출: 동적 인출률 — 매달 총자산의 0.3/0.5/0.7% (10억/20억 기준). 기본은 상한 없음
          (--cap: 기존 연구의 월 1,500만원 상한 적용 → withdrawal_full_period_cap.json)
  - 초기 10억, 1971-02 ~ 2026-09 매달 시작 (668개), 각자 데이터 끝까지 보유

시점별 스냅샷: 시작 후 10·20·30·40·50년 총자산·누적 인출액·그 시점 월 생활비 (그 기간을 채운 시작 시점만)
전체 기간 지표 (10년 이상 보유한 시작 시점만):
  인출 포함 연 수익률(IRR) — 10억을 넣고, 매달 꺼낸 생활비와 마지막 남은 자산을 돌려받은 현금흐름의 내부수익률.
  전략마다 꺼내 쓴 돈이 다르므로 남은 자산만의 연평균보다 공정한 비교 지표.

출력: web/public/data/withdrawal_full_period.json
"""

import json, time
import multiprocessing as mp
import numpy as np
import pandas as pd

import withdrawal_cash_tier as E

OUT_PATH = E.ROOT / "web/public/data/withdrawal_full_period.json"
YEARS    = (10, 20, 30, 40, 50)
SNAPS    = tuple(y * 252 for y in YEARS)
MIN_YRS  = 10
EOK      = E.EOK
P        = E.Param

# (이름, 설명, 그룹, 보유 자산, Param)
STRATS = [
    ("HOLD3", "TQQQ 계속 보유 (신호 없음)",                     "기준", "tq",  P("HOLD3", "", ((0, 1.0),), hold=True)),
    ("HOLD2", "QLD(2배) 계속 보유 (신호 없음)",                 "기준", "qld", P("HOLD2", "", ((0, 1.0),), hold=True)),
    ("HOLD1", "나스닥100(1배) 계속 보유 (신호 없음)",           "기준", "qqq", P("HOLD1", "", ((0, 1.0),), hold=True)),
    ("E1",    "200일선 아래 1일이면 매도, 위 1일이면 매수",      "200일선", "tq", P("E1", "", ((0, 1.0),), days=1)),
    ("S0",    "200일선 아래 15일 연속 매도, 위 15일 연속 매수",  "200일선", "tq", P("S0", "", ((0, 1.0),))),
    ("S4",    "S0 + Guyton-Klinger 인출 조절",                  "200일선", "tq", P("S4", "", ((0, 1.0),), use_gk=True)),
    ("S7",    "S0 + RSI<30이면 LOC 조기 재매수",                "조기 재매수", "tq", P("S7", "", ((0, 1.0),), rsi_thr=30, div_thr=9.9)),
    ("D10GK", "S0 + RSI<30 & 200일선 −10%면 LOC 조기 재매수 + GK", "조기 재매수", "tq", P("D10GK", "", ((0, 1.0),), rsi_thr=30, use_gk=True)),
    ("T15",   "1년 최고 종가 −15% 매도, 200일선 위 15일 매수",  "고점 대비", "tq", P("T15", "", ((0, 1.0),), trail_thr=0.15)),
    ("T20",   "1년 최고 종가 −20% 매도",                         "고점 대비", "tq", P("T20", "", ((0, 1.0),), trail_thr=0.20)),
    ("T25",   "1년 최고 종가 −25% 매도",                         "고점 대비", "tq", P("T25", "", ((0, 1.0),), trail_thr=0.25)),
    ("T30",   "1년 최고 종가 −30% 매도",                         "고점 대비", "tq", P("T30", "", ((0, 1.0),), trail_thr=0.30)),
    ("DLEV",  "S0 + 50억↑ TQQQ½·나스닥100½, 200억↑ 나스닥100",  "자산 커지면 낮춤", "tq",
     P("DLEV", "", ((0, 1.0), (50 * EOK, 0.5), (200 * EOK, 0.0)), side="qqq")),
    ("C50",   "S0 + 50억↑ TQQQ⅔·현금⅓, 200억↑ TQQQ⅓·현금⅔",    "자산 커지면 낮춤", "tq",
     P("C50", "", ((0, 1.0), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)))),
    ("D10C50", "D10GK + 자산별 현금 비중(C50)",                  "자산 커지면 낮춤", "tq",
     P("D10C50", "", ((0, 1.0), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)), rsi_thr=30, use_gk=True)),
    ("T25C50", "T25 + 자산별 현금 비중(C50)",                    "자산 커지면 낮춤", "tq",
     P("T25C50", "", ((0, 1.0), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)), trail_thr=0.25)),
]

EPISODES = [  # 특징을 보여줄 시작 시점
    ("1972-12", "1973~74 폭락 직전"),
    ("1987-08", "블랙먼데이 직전"),
    ("2000-03", "닷컴버블 정점"),
    ("2007-10", "금융위기 직전"),
    ("2009-03", "금융위기 바닥"),
    ("2020-02", "코로나 폭락 직전"),
    ("2021-11", "2022 하락장 직전"),
]

_S = {}


def _init(*args):
    keys = ("series", "closes", "ema", "dates", "rp", "rsi", "peaks", "starts")
    _S.update(dict(zip(keys, args)))
    _S["dates"] = pd.DatetimeIndex(_S["dates"])


def irr(flows, final_eok, years):
    """-10억(시작) · 매달 생활비 · 마지막 남은 자산 현금흐름의 연 내부수익률 (%)."""
    t = np.array([0.0] + [j / 252 for j, _ in flows] + [years])
    cf = np.array([-10.0] + [v / EOK for _, v in flows] + [final_eok])
    lo, hi = -0.99, 3.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if (cf / (1 + mid) ** t).sum() > 0:
            lo = mid
        else:
            hi = mid
    return round(mid * 100, 2)


def _job(idx):
    name, _, _, asset, p = STRATS[idx]
    s = _S
    n = len(s["closes"])
    tq = s["series"][asset]
    out = []
    for si in s["starts"]:
        r = E.run_sim(tq, s["series"]["qqq"], s["closes"], s["ema"], s["dates"], s["rp"], s["rsi"], s["peaks"],
                      si, p, True, exec_mode="loc", horizon_days=n, snaps=SNAPS, collect_flows=True)
        r["irr"] = irr(r.pop("flows"), r["final"], r["years"])
        out.append(r)
    return name, out


def q(xs, f):
    return xs[min(len(xs) - 1, int(len(xs) * f))]


def ann(r):
    return ((max(r["final"], 1e-6) / 10) ** (1 / r["years"]) - 1) * 100


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--cap", action="store_true", help="기존 연구의 월 1,500만원 인출 상한 적용")
    args = ap.parse_args()
    out_path = OUT_PATH.with_name("withdrawal_full_period_cap.json") if args.cap else OUT_PATH
    if not args.cap:
        E.LIV_MAX = float("inf")   # 상한 없음 — fork된 워커가 그대로 물려받음
    t0 = time.time()
    tq, qq, closes, ema, dates, rp, rsi, peaks = E.load_data()

    # QLD(2배) — 운용보수 0.95% + 스왑금리 1배 (data_loader with_costs와 동일)
    ret = np.insert(np.diff(closes) / closes[:-1], 0, 0.0)
    with open(E.DATA_DIR / "fed_funds_rate.json", encoding="utf-8") as f:
        fed = {r["date"][:7]: float(r["rate"]) for r in json.load(f)}
    ffr = np.array([fed.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 for d in dates])
    f2 = (1.0 + 2.0 * ret - ffr / 252) * (1.0 - 0.0095 / 252)
    f2[0] = 1.0
    series = {"tq": tq, "qq": qq, "qqq": qq, "qld": 100 * np.cumprod(f2)}

    starts = E.get_monthly_starts(dates)
    labels = [dates[i].strftime("%Y-%m") for i in starts]
    with mp.Pool(min(mp.cpu_count(), len(STRATS)), initializer=_init,
                 initargs=(series, closes, ema, dates.tolist(), rp, rsi, peaks, starts)) as pool:
        raw = dict(pool.map(_job, range(len(STRATS)), chunksize=1))

    base = raw["S0"]
    summary = []
    for name, desc, group, asset, p in STRATS:
        rs = raw[name]
        by_year = {}
        for y, k in zip(YEARS, SNAPS):
            pairs = [(r["snaps"][k], r["snaps_wd"][k], b["snaps"][k] + b["snaps_wd"][k]) for r, b in zip(rs, base) if k in r["snaps"]]
            if not pairs:
                continue
            fin = sorted(a for a, _, _ in pairs)
            wd  = sorted(w for _, w, _ in pairs)
            tot = sorted(a + w for a, w, _ in pairs)
            liv = sorted(r["snaps_liv"][k] for r in rs if k in r["snaps_liv"])
            by_year[str(y)] = {
                "n":             len(fin),
                "med_final":     round(q(fin, 0.5), 1),
                "p10_final":     round(q(fin, 0.10), 1),
                "p90_final":     round(q(fin, 0.90), 1),
                "worst_final":   round(fin[0], 2),
                "n_below_init":  sum(1 for x in fin if x < 10),
                "med_withdrawn": round(q(wd, 0.5), 1),
                "p10_withdrawn": round(q(wd, 0.10), 1),
                "med_total":     round(q(tot, 0.5), 1),
                "p10_total":     round(q(tot, 0.10), 1),
                "med_living_man": q(liv, 0.5),
                "p10_living_man": q(liv, 0.10),
                # 꺼내 쓴 돈 + 남은 자산 기준
                "win_vs_s0":     round(sum(1 for a, w, b in pairs if a + w > b) / len(pairs) * 100, 1),
            }
        full = [r for r in rs if r["years"] >= MIN_YRS]
        a = sorted(r["irr"] for r in full)
        wds = sorted(r["withdrawn"] for r in full)
        avg_liv = sorted(r["withdrawn"] * EOK / (r["years"] * 12) / 10_000 for r in full)
        dd = sorted(r["max_dd"] for r in full)
        sells = sum(r["sells"] for r in full)
        summary.append({
            "name": name, "desc": desc, "group": group,
            "by_year": by_year,
            "full": {
                "n":              len(full),
                "med_irr_pct":    round(q(a, 0.5), 1),
                "p10_irr_pct":    round(q(a, 0.10), 1),
                "worst_irr_pct":  round(a[0], 1),
                "med_withdrawn":  round(q(wds, 0.5), 1),
                "med_avg_living_man": round(q(avg_liv, 0.5)),
                "p10_avg_living_man": round(q(avg_liv, 0.10)),
                "med_ann_pct":    round(q(sorted(ann(r) for r in full), 0.5), 1),
                "n_below_init":   sum(1 for r in full if r["final"] < 10),
                "med_max_dd":     round(q(dd, 0.5), 1),
                "worst_max_dd":   round(dd[-1], 1),
                "cash_days_pct":  round(sum(r["cash_days_pct"] for r in full) / len(full), 1),
                "trades_per_10y": round(sum(r["trades"] / r["years"] * 10 for r in full) / len(full), 1),
                "quick_resell_pct": round(sum(r["quick_resells"] for r in full) / sells * 100, 1) if sells else 0.0,
            },
        })

    cohorts = []
    for k, lab in enumerate(labels):
        row = {"s": lab, "y": round(raw["S0"][k]["years"], 1)}
        for name, *_ in STRATS:
            r = raw[name][k]
            row[name] = {
                "f":  r["final"],
                "a":  round(ann(r), 1) if r["years"] >= 1 else None,
                "i":  r["irr"] if r["years"] >= 1 else None,
                "dd": r["max_dd"],
                "w":  r["withdrawn"],
                "t":  r["trades"],
                "y":  {str(y): r["snaps"][s] for y, s in zip(YEARS, SNAPS) if s in r["snaps"]},
                "yw": {str(y): r["snaps_wd"][s] for y, s in zip(YEARS, SNAPS) if s in r["snaps_wd"]},
            }
        cohorts.append(row)

    print(f"{'전략':<7}{'IRR':>6}{'하위10%':>8}{'최악':>7}{'월생활비':>8}{'하위10%':>8}{'<10억':>6}{'낙폭':>6} | "
          + " | ".join(f"{y}년 인출+자산 / 월생활비" for y in YEARS))
    for r in summary:
        f = r["full"]
        yrs = " | ".join(f"{r['by_year'][str(y)]['med_total']:>7,.0f} / {r['by_year'][str(y)]['med_living_man']:>6,}만"
                         if str(y) in r["by_year"] else "" for y in YEARS)
        print(f"{r['name']:<7}{f['med_irr_pct']:5.1f}%{f['p10_irr_pct']:7.1f}%{f['worst_irr_pct']:6.1f}%"
              f"{f['med_avg_living_man']:>7,}만{f['p10_avg_living_man']:>7,}만{f['n_below_init']:6}{f['med_max_dd']:5.0f}% | {yrs}")

    print("\n주요 시작 시점 — 오늘까지 연평균 (최종 자산)")
    lab_idx = {lab: k for k, lab in enumerate(labels)}
    for lab, note in EPISODES:
        k = lab_idx[lab]
        print(f"{lab} {note:<14}" + " ".join(f"{n}:{raw[n][k]['irr']:5.1f}%" for n, *_ in STRATS))

    out = {
        "meta": {
            "generated":  str(dates[-1].date()),
            "conditions": "초기 10억 · 스왑금리·운용보수 · 모든 매도 양도세 22% · 현금 외화RP(기준금리−0.4%, 세후) · "
                          "신호 다음 거래일 매매(조기 재매수만 LOC 당일) · 동적 인출 월 0.3/0.5/0.7%"
                          + ("(월 최대 1,500만)" if args.cap else "(상한 없음)"),
            "years":      list(YEARS),
            "min_years_full": MIN_YRS,
            "strategies": [{"name": n, "desc": d, "group": g} for n, d, g, *_ in STRATS],
            "episodes":   [{"start": s, "note": n} for s, n in EPISODES],
        },
        "summary": summary,
        "cohorts": cohorts,
    }
    out["meta"]["withdrawal_cap"] = E.LIV_MAX if args.cap else None
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {out_path} ({out_path.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
