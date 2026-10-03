"""
withdrawal_exec_horizon.py

실행 시점 × 보유 기간 재검증 (스왑금리 + 모든 매도 과세, 엔진: withdrawal_cash_tier.run_sim)
──────────────────────────────────────────────────────────────────────────────
왜: 기존 백테스트는 "신호가 뜬 그날 종가에 매매"를 가정했다.
    신호는 종가가 확정돼야 알 수 있으므로(한국 시간 새벽 5~6시) 실제로는 불가능한 매매다.

실행 시점 (exec_mode)
  same : 신호 당일 종가 (기존 가정, 비교용)
  next : 아침에 확인 → 다음 거래일 종가
  loc  : RSI 조기 재매수만 당일 종가 — RSI<30 · 200일선 -10% 조건을 "오늘 종가 ≤ X"로 환산해
         TQQQ LOC 매수 주문을 미리 걸어두는 방식. 나머지(200일선 15일 신호 매수·매도)는 next.
         LOC 매수는 "종가 ≤ 지정가"일 때만 체결되므로 "종가 > X" 조건(200일선 위 매수)이나
         "종가 < X" 매도는 LOC로 만들 수 없다.

보유 기간
  20년 · 30년 : 해당 기간을 다 채운 시작 시점만
  오늘까지    : 각 시작 시점에서 데이터 끝(2026-09)까지 보유, 10년 이상 보유한 시작 시점만.
                기간이 제각각이므로 연평균 수익률(최종자산/10억 기준)로 비교

실행 지연 민감도 (robust)
  next/loc에서 "다음날" 대신 2·3거래일 뒤 실행해도 결론이 유지되는지 확인.
  20년 중간값은 실행일이 하루 이틀만 달라도 크게 흔들리므로(같은 큰 폭락을 여러 시작 시점이 공유),
  비교의 주 지표는 '오늘까지 연평균 수익률'로 삼는다.

출력: web/public/data/withdrawal_exec_horizon_v2.json
"""

import json, time
import multiprocessing as mp
import pandas as pd
from pathlib import Path

import withdrawal_cash_tier as E
from withdrawal_full_period import irr

OUT_PATH = E.ROOT / "web/public/data/withdrawal_exec_horizon_v2.json"
NAMES    = ["S0", "C50", "D10GK", "D10C50", "T25", "Q50"]
MODES    = ["same", "next", "loc"]
Y20, Y30 = 20 * 252, 30 * 252
MIN_YRS_TODAY = 10
ROBUST   = [("S0", "next"), ("T25", "next"), ("D10GK", "loc"), ("C50", "next"), ("D10C50", "loc")]
DELAYS   = (2, 3)

_S = {}


def _init(*args):
    keys = ("tq", "qq", "closes", "ema", "dates", "rp", "rsi", "peaks", "starts")
    _S.update(dict(zip(keys, args)))
    _S["dates"] = pd.DatetimeIndex(_S["dates"])


def _job(arg):
    name, mode, delay = arg
    s = _S
    p = next(x for x in E.STRATEGIES if x.name == name)
    n = len(s["closes"])
    out = []
    for si in s["starts"]:
        r = E.run_sim(s["tq"], s["qq"], s["closes"], s["ema"], s["dates"], s["rp"], s["rsi"], s["peaks"],
                      si, p, True, exec_mode=mode, horizon_days=n, snaps=(Y20, Y30),
                      exec_delay=delay, collect_flows=True)
        r["irr"] = irr(r.pop("flows"), r["final"], r["years"])
        out.append(r)
    return arg, out


def q(xs, f):
    return xs[int(len(xs) * f)]


def horizon_stats(rs, base, key):
    pairs = [(r["snaps"][key] + r["snaps_wd"][key], b["snaps"][key] + b["snaps_wd"][key], r["snaps"][key])
             for r, b in zip(rs, base) if key in r["snaps"]]
    tot = sorted(a for a, _, _ in pairs)
    fin = sorted(f for _, _, f in pairs)
    return {
        "n":            len(fin),
        "med_total":    round(q(tot, 0.5), 1),     # 꺼내 쓴 돈 + 남은 자산
        "p10_total":    round(q(tot, 0.10), 1),
        "med_final":    round(q(fin, 0.5), 1),
        "n_below_init": sum(1 for x in fin if x < 10),
        "win_vs_s0":    round(sum(1 for a, b, _ in pairs if a > b) / len(pairs) * 100, 1),
    }


def today_stats(rs, labels):
    rows = [(lab, r) for lab, r in zip(labels, rs) if r["years"] >= MIN_YRS_TODAY]
    ann = sorted(r["irr"] for _, r in rows)     # 인출 포함 연 수익률
    eras = {}
    for key, a, b in (("1970s", 1971, 1980), ("1980s", 1980, 1990), ("1990s", 1990, 2000),
                      ("2000s", 2000, 2010), ("2010s", 2010, 2017)):
        xs = sorted(r["final"] for lab, r in rows if a <= int(lab[:4]) < b)
        if xs:
            eras[key] = round(q(xs, 0.5), 1)
    return {
        "n":              len(rows),
        "med_irr_pct":    round(q(ann, 0.5), 1),
        "p10_irr_pct":    round(q(ann, 0.10), 1),
        "n_below_init":   sum(1 for _, r in rows if r["final"] < 10),
        "era_med_final":  eras,
        "cash_days_pct":  round(sum(r["cash_days_pct"] for _, r in rows) / len(rows), 1),
        "trades_per_10y": round(sum(r["trades"] / r["years"] * 10 for _, r in rows) / len(rows), 1),
    }


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--cap", action="store_true", help="기존 연구의 월 1,500만원 인출 상한 적용 (기본: 상한 없음)")
    if not ap.parse_args().cap:
        E.LIV_MAX = float("inf")
    t0 = time.time()
    tq, qq, closes, ema, dates, rp, rsi, peaks = E.load_data()
    starts = E.get_monthly_starts(dates)
    labels = [dates[i].strftime("%Y-%m") for i in starts]
    jobs = [(n, m, 1) for m in MODES for n in NAMES] + [(n, m, d) for n, m in ROBUST for d in DELAYS]
    with mp.Pool(min(mp.cpu_count(), len(jobs)), initializer=_init,
                 initargs=(tq, qq, closes, ema, dates.tolist(), rp, rsi, peaks, starts)) as pool:
        raw = dict(pool.map(_job, jobs, chunksize=1))

    summary = {}
    for m in MODES:
        base = raw[("S0", m, 1)]
        summary[m] = []
        for n in NAMES:
            rs = raw[(n, m, 1)]
            p = next(x for x in E.STRATEGIES if x.name == n)
            summary[m].append({
                "name": n, "desc": p.desc,
                "y20": horizon_stats(rs, base, Y20),
                "y30": horizon_stats(rs, base, Y30),
                "today": today_stats(rs, labels),
            })

    for m in MODES:
        print(f"\n[실행: {m}]")
        print(f"{'이름':<7}{'20년 중앙':>9}{'p10':>7}{'<10억':>6}{'S0대비':>7} |{'30년 중앙':>9}{'<10억':>6}"
              f" |{'오늘까지 연평균':>13}{'p10':>7}{'<10억':>6}{'현금기간':>8}{'매매/10년':>9}")
        for r in summary[m]:
            a, b, c = r["y20"], r["y30"], r["today"]
            print(f"{r['name']:<7}{a['med_total']:9.1f}{a['p10_total']:7.1f}{a['n_below_init']:6}{a['win_vs_s0']:6.1f}% |"
                  f"{b['med_total']:9.1f}{b['n_below_init']:6} |{c['med_irr_pct']:12.1f}%{c['p10_irr_pct']:6.1f}%"
                  f"{c['n_below_init']:6}{c['cash_days_pct']:7.1f}%{c['trades_per_10y']:9.1f}")

    robust = []
    print("\n[실행 지연 민감도 — 오늘까지 연평균 중간값]")
    for n, m in ROBUST:
        row = {"name": n, "mode": m}
        for d in (1,) + DELAYS:
            t = today_stats(raw[(n, m, d)], labels)
            row[f"d{d}"] = {"med_irr_pct": t["med_irr_pct"], "p10_irr_pct": t["p10_irr_pct"]}
        row["y20_med_by_delay"] = [horizon_stats(raw[(n, m, d)], raw[(n, m, d)], Y20)["med_total"] for d in (1,) + DELAYS]
        robust.append(row)
        print(f"{n:<7}{m:<5}" + "".join(f"  {d}일 {row[f'd{d}']['med_irr_pct']:5.1f}%" for d in (1,) + DELAYS)
              + "   20년 중간값 " + "/".join(f"{v:.0f}" for v in row["y20_med_by_delay"]))

    out = {
        "meta": {
            "generated":  str(dates[-1].date()),
            "price_mode": "with_costs",
            "tax":        "모든 매도 과세 (하락 신호 매도 포함)",
            "withdrawal": "동적 인출 월 0.3/0.5/0.7%, " + ("월 최대 1,500만" if E.LIV_MAX != float("inf") else "상한 없음"),
            "y_metrics":  "y20·y30의 med_total = 꺼내 쓴 돈 + 남은 자산 (억)",
            "n_starts":   len(starts),
            "modes": {
                "same": "신호 당일 종가 매매 (기존 가정, 실제로는 불가능)",
                "next": "아침 확인 → 다음 거래일 종가 매매",
                "loc":  "RSI 조기 재매수만 LOC 주문으로 당일 종가, 나머지는 다음 거래일",
            },
            "horizons": {
                "y20":   "20년을 다 채운 시작 시점",
                "y30":   "30년을 다 채운 시작 시점",
                "today": f"데이터 끝까지 보유, {MIN_YRS_TODAY}년 이상 보유한 시작 시점 (인출 포함 연 수익률 비교)",
            },
            "strategies": [{"name": p.name, "desc": p.desc} for p in E.STRATEGIES if p.name in NAMES],
        },
        "summary": summary,
        "robust":  robust,
    }
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
