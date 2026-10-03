"""
withdrawal_t25_periods.py

T25 권장 근거: (1) 같은 시작 시점끼리 꺼내 쓴 돈 비교, (2) 닷컴버블 밖 구간에서도 T25가 나은가
──────────────────────────────────────────────────────────────────────────────
조건은 withdrawal_full_period.py와 동일 (상한 없는 동적 인출 월 0.3/0.5/0.7%, 스왑금리, 모든 매도 과세,
외화RP 세후, 신호 다음 거래일 매매, 조기 재매수만 LOC 당일).

비교 전략: T25 · S0 · D10GK · T25C50(T25 + 자산별 현금) · HOLD3(TQQQ 계속 보유)

구간 (인출 포함 연 수익률 = 기간 끝 자산까지 포함한 IRR):
  A 1971~1989년 시작, 10년 (2000년 전에 끝)
  D 1973~74 폭락 포함 (1971~1973년 시작, 10년)
  E 1987 블랙먼데이 포함 (1985-01~1987-09 시작, 10년)
  F 2008 금융위기 포함 (2005-01~2008-08 시작, 오늘까지)
  G 2020·2022 포함 (2016~2019년 시작, 오늘까지 — 보유 6년 이상)
  B 2003~2016년 시작, 오늘까지
  C 닷컴버블(2000~2002)을 건드리지 않는 모든 10년 구간

출력: web/public/data/withdrawal_t25_periods.json
"""

import json, time
import multiprocessing as mp
import pandas as pd

import withdrawal_cash_tier as E
import withdrawal_full_period as F

OUT_PATH = E.ROOT / "web/public/data/withdrawal_t25_periods.json"
NAMES = ["T25", "S0", "D10GK", "T25C50", "HOLD3"]
YEARS = (10, 20, 30)
K10 = 10 * 252

PERIODS = [
    ("A", "1971~1989년 시작, 10년 (2000년 전에 끝)",        True,  lambda d: d.year <= 1989),
    ("D", "1973~74 폭락 포함 (1971~1973년 시작, 10년)",     True,  lambda d: d.year <= 1973),
    ("E", "1987 블랙먼데이 포함 (1985~1987.9 시작, 10년)",  True,  lambda d: d.year in (1985, 1986) or (d.year == 1987 and d.month <= 9)),
    ("F", "2008 금융위기 포함 (2005~2008.8 시작, 오늘까지)", False, lambda d: 2005 <= d.year <= 2007 or (d.year == 2008 and d.month <= 8)),
    ("G", "2020·2022 포함 (2016~2019년 시작, 오늘까지)",    False, lambda d: 2016 <= d.year <= 2019),
    ("B", "2003~2016년 시작, 오늘까지",                    False, lambda d: 2003 <= d.year <= 2016),
    ("C", "닷컴버블(2000~02)을 건드리지 않는 모든 10년 구간", True,  lambda d: d.year + 10 < 2000 or d.year >= 2003),
]

_S = {}


def _init(*args):
    keys = ("tq", "qq", "closes", "ema", "dates", "rp", "rsi", "peaks", "starts")
    _S.update(dict(zip(keys, args)))
    _S["dates"] = pd.DatetimeIndex(_S["dates"])


def _job(name):
    p = next(x for n, *_, x in F.STRATS if n == name)
    s = _S
    n = len(s["closes"])
    out = []
    for si in s["starts"]:
        r = E.run_sim(s["tq"], s["qq"], s["closes"], s["ema"], s["dates"], s["rp"], s["rsi"], s["peaks"],
                      si, p, True, exec_mode="loc", horizon_days=n, snaps=tuple(y * 252 for y in YEARS),
                      collect_flows=True)
        fl = r.pop("flows")
        r["irr"] = F.irr(fl, r["final"], r["years"])
        r["irr10"] = F.irr([f for f in fl if f[0] < K10], r["snaps"][K10], 10) if K10 in r["snaps"] else None
        out.append(r)
    return name, out


def med(x):
    x = sorted(x)
    return x[len(x) // 2]


def p10(x):
    x = sorted(x)
    return x[len(x) // 10]


def main():
    E.LIV_MAX = float("inf")
    t0 = time.time()
    tq, qq, closes, ema, dates, rp, rsi, peaks = E.load_data()
    starts = E.get_monthly_starts(dates)
    with mp.Pool(min(mp.cpu_count(), len(NAMES)), initializer=_init,
                 initargs=(tq, qq, closes, ema, dates.tolist(), rp, rsi, peaks, starts)) as pool:
        raw = dict(pool.map(_job, NAMES))
    sd = [dates[i] for i in starts]
    base = raw["T25"]

    withdrawn = []
    for nm in NAMES:
        rs = raw[nm]
        row = {"name": nm, "by_year": {}}
        for y in YEARS:
            k = y * 252
            vals = [r["snaps_wd"][k] for r in rs if k in r["snaps_wd"]]
            pairs = [(a["snaps_wd"][k], b["snaps_wd"][k]) for a, b in zip(base, rs)
                     if k in a["snaps_wd"] and k in b["snaps_wd"] and a["snaps_wd"][k] > 0]
            row["by_year"][str(y)] = {
                "med": round(med(vals), 1), "p10": round(p10(vals), 1),
                "ratio_vs_t25": round(med([b / a * 100 for a, b in pairs])),
                "t25_more_pct": round(sum(1 for a, b in pairs if a >= b) / len(pairs) * 100),
            }
        row["today_med"] = round(med([r["withdrawn"] for r in rs if r["years"] >= 10]), 1)
        withdrawn.append(row)

    periods = []
    for key, title, use10, cond in PERIODS:
        idx = [i for i, d in enumerate(sd) if cond(d) and (base[i]["irr10"] is not None if use10 else base[i]["years"] >= 6)]
        rows = []
        tv = [base[i]["irr10"] if use10 else base[i]["irr"] for i in idx]
        for nm in NAMES:
            rs = raw[nm]
            v = [rs[i]["irr10"] if use10 else rs[i]["irr"] for i in idx]
            wd = [rs[i]["snaps_wd"].get(K10, rs[i]["withdrawn"]) if use10 else rs[i]["withdrawn"] for i in idx]
            rows.append({
                "name": nm,
                "med_irr_pct": round(med(v), 1), "p10_irr_pct": round(p10(v), 1),
                "med_withdrawn": round(med(wd), 1),
                "t25_better_pct": None if nm == "T25" else round(sum(1 for a, b in zip(tv, v) if a > b + 0.05) / len(v) * 100),
                "same_pct":       None if nm == "T25" else round(sum(1 for a, b in zip(tv, v) if abs(a - b) <= 0.05) / len(v) * 100),
            })
        periods.append({"key": key, "title": title, "n": len(idx), "years": "10년" if use10 else "오늘까지", "rows": rows})

    for w in withdrawn:
        print(w["name"], " | ".join(f"{y}년 {w['by_year'][str(y)]['med']:.0f}억 (T25 대비 {w['by_year'][str(y)]['ratio_vs_t25']})"
                                     for y in YEARS), f"| 오늘까지 {w['today_med']:.0f}억")
    for pdx in periods:
        print(f"\n{pdx['key']}. {pdx['title']} (n={pdx['n']})")
        for r in pdx["rows"]:
            print(f"  {r['name']:7}{r['med_irr_pct']:6.1f}%  하위10% {r['p10_irr_pct']:6.1f}%  꺼낸 돈 {r['med_withdrawn']:7.1f}억"
                  + ("" if r["t25_better_pct"] is None else f"  T25가 나은 경우 {r['t25_better_pct']}% (같음 {r['same_pct']}%)"))

    out = {"meta": {"generated": str(dates[-1].date()),
                    "conditions": "상한 없는 동적 인출 월 0.3/0.5/0.7% · 스왑금리 · 모든 매도 양도세 · 외화RP 세후 · 신호 다음 거래일 매매",
                    "names": NAMES},
           "withdrawn": withdrawn, "periods": periods}
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
