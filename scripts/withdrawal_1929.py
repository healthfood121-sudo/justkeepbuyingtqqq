"""
withdrawal_1929.py

1929년 대공황 인출 시나리오 — 1971년 이전을 가상 나스닥100으로 채워 인출 전략을 돌린다.
──────────────────────────────────────────────────────────────────────────────
가상 나스닥100: S&P500 일별 수익률 × β + α (synthetic_ndx_beta_sweep.py와 같은 방식), 1971-02-05부터 실제 나스닥100 접합
  (비교) ndx — 실제 나스닥100 1971~, 25% 룰의 TQQQ 비중별 평소 비용 확인용 (10년 이상 보유한 시작 시점)
  pretech  β=0.767, α=0          (1971~1990 실측 — 기술주 비중이 낮던 시절)
  recent   β=1.138, α=연 4.45%   (2011~2026 실측 — /posts/synthetic-ndx-1929의 기준)
  recent0  β=1.138, α=0          (최근 베타, 초과수익 없음 — 보수적)
  harsh    β=1.5,   α=0          (가혹 — 지금보다 더 크게 출렁이는 지수)

엔진: withdrawal_cash_tier.run_sim (withdrawal_full_period.py와 같은 조건)
  스왑금리 · 모든 매도 양도세 · 현금 외화RP(세후) · 신호 다음 거래일 매매(D10GK 조기 재매수만 LOC)
  동적 인출 월 0.3/0.5/0.7% 상한 없음 · 초기 10억 · 오늘까지 보유
금리: 1954-07 이후 기준금리(fed_funds_rate.json). 그 이전은 미국 3개월 국채 금리 연평균 근사값(T_BILL)
시작: 1929-01 ~ 1970-12 매달 (1971년 이후 시작은 withdrawal_full_period.json에 이미 있음)

출력: web/public/data/withdrawal_1929.json        요약 + 주요 시작 시점 월별 경로 + 지수 경로 (포스트)
      web/public/data/withdrawal_1929_rows.json   시작 시점별 행 (데이터 뷰어)
  python scripts/withdrawal_1929.py
"""

import json, time
import multiprocessing as mp
import numpy as np
import pandas as pd

import withdrawal_cash_tier as E
from withdrawal_full_period import irr, q

OUT_PATH = E.ROOT / "web/public/data/withdrawal_1929.json"
EOK = E.EOK
P   = E.Param

VARIANTS = {
    "pretech": (0.767, 0.0,    "β 0.767 · 1971~1990 실측"),
    "recent":  (1.138, 0.0445, "β 1.138 + 초과수익 연 4.45% · 2011~2026 실측"),
    "recent0": (1.138, 0.0,    "β 1.138 · 초과수익 없음"),
    "harsh":   (1.5,   0.0,    "β 1.5 · 가혹"),
}
STRATS = [
    ("RULE25", P("RULE25", "", ((0, 1.0),), trail_thr=0.25)),
    ("S0",     P("S0", "", ((0, 1.0),))),
    ("D10GK",  P("D10GK", "", ((0, 1.0),), rsi_thr=30, use_gk=True)),
    ("RULE25C50", P("RULE25C50", "", ((0, 1.0), (50 * EOK, 2 / 3), (200 * EOK, 1 / 3)), trail_thr=0.25)),
    ("HOLD3",  P("HOLD3", "", ((0, 1.0),), hold=True)),
    ("HOLD1",  P("HOLD1", "", ((0, 1.0),), hold=True)),     # 나스닥100(1배) 계속 보유 — tq 자리에 1배를 넣어 돌림
    # 25% 룰 + 늘 TQQQ 비중을 낮춰 두기 (나머지 현금, 월초 5%p 넘게 벌어지면 리밸런싱)
    ("R25W67", P("R25W67", "", ((0, 2 / 3),), trail_thr=0.25)),
    ("R25W50", P("R25W50", "", ((0, 0.5),), trail_thr=0.25)),
    ("R25W33", P("R25W33", "", ((0, 1 / 3),), trail_thr=0.25)),
]
LEV = ["RULE25", "R25W67", "R25W50", "R25W33"]   # 실제 나스닥100(1971~)으로도 돌려 평소 비용을 비교
FOCUS = ["1929-01", "1929-09", "1929-10", "1930-04", "1937-03", "1946-06", "1968-12"]
# 1954-07 이전 단기 금리 (미국 3개월 국채 연평균, %, 근사값)
T_BILL = {1927: 3.1, 1928: 3.9, 1929: 4.4, 1930: 2.2, 1931: 1.4, 1932: 0.9, 1933: 0.5, 1934: 0.3, 1935: 0.2,
          1936: 0.2, 1937: 0.3, 1938: 0.1, 1939: 0.0, 1940: 0.0, 1941: 0.1, 1942: 0.3, 1943: 0.4, 1944: 0.4,
          1945: 0.4, 1946: 0.4, 1947: 0.6, 1948: 1.0, 1949: 1.1, 1950: 1.2, 1951: 1.5, 1952: 1.7, 1953: 1.9,
          1954: 1.0}
MONTH = 21   # 월별 경로 기록 간격 (거래일)


def build(beta: float, alpha: float):
    sp = pd.read_csv(E.DATA_DIR / "sp500_1927_now.csv", parse_dates=["Date"]).sort_values("Date")
    nd = pd.read_csv(E.DATA_DIR / "ndx_1971_now.csv", parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    m = nd["Date"] == pd.Timestamp("1985-10-01")
    i = nd.index[m][0]
    nd.loc[i:, "Close"] *= nd.loc[i - 1, "Close"] / nd.loc[i, "Close"]
    t0 = nd["Date"].iloc[0]
    pre = sp[sp["Date"] < t0]
    r_pre = beta * pre["Close"].pct_change().fillna(0).values + alpha / 252
    r_nd = nd["Close"].pct_change().fillna(0).values
    ret = np.concatenate([r_pre, r_nd])
    ret[0] = 0.0
    dates = pd.DatetimeIndex(np.concatenate([pre["Date"].values, nd["Date"].values]))
    closes = 100 * np.cumprod(1 + ret)
    n = len(closes)

    with open(E.DATA_DIR / "fed_funds_rate.json", encoding="utf-8") as f:
        fed = {r["date"][:7]: float(r["rate"]) for r in json.load(f)}
    rate = np.array([fed.get(f"{d.year}-{d.month:02d}", T_BILL.get(d.year, 3.0)) / 100.0 for d in dates])
    f3 = (1.0 + 3.0 * ret - 2.0 * rate / 252) * (1.0 - E.EXP_3X / 252)
    f3[0] = 1.0
    f1 = (1.0 + ret) * (1.0 - E.EXP_1X / 252)
    f1[0] = 1.0
    a = 2.0 / 201
    ema = np.full(n, np.nan)
    ema[199] = closes[:200].mean()
    for k in range(200, n):
        ema[k] = closes[k] * a + ema[k - 1] * (1 - a)
    rp = np.maximum(0.0, rate - E.RP_SPREAD) / 252 * (1 - E.RP_TAX_R)
    rsi = E.compute_rsi(closes, 14)
    peaks = pd.Series(closes).rolling(252, min_periods=1).max().values
    return [100 * np.cumprod(f3), 100 * np.cumprod(f1), closes, ema, dates, rp, rsi, peaks]


_M = {}


def _init():
    E.LIV_MAX = float("inf")
    for v, (b, al, _) in VARIANTS.items():
        _M[v] = build(b, al)
    _M["ndx"] = E.load_data()


def _job(task):
    v, name = task
    p = dict(STRATS)[name]
    tq, qq, closes, ema, dates, rp, rsi, peaks = _M[v]
    if name == "HOLD1":
        tq = qq
    n = len(closes)
    rows = []
    for si in E.get_monthly_starts(dates):
        lab = dates[si].strftime("%Y-%m")
        if v == "ndx":
            if (n - si) / 252 < 10:       # 실제 데이터: 10년 이상 보유한 시작 시점만 (전체 기간 비교와 같은 기준)
                continue
        elif not ("1929-01" <= lab <= "1970-12"):
            continue
        path = lab in FOCUS
        snaps = set(range(MONTH, n - si + 1, MONTH)) if path else {20 * 252}
        r = E.run_sim(tq, qq, closes, ema, dates, rp, rsi, peaks, si, p, True,
                      exec_mode="loc", horizon_days=n, snaps=snaps, collect_flows=True)
        flows = r.pop("flows")
        row = {"s": lab, "i": irr(flows, r["final"], r["years"]), "f": r["final"], "w": r["withdrawn"],
               "dd": r["max_dd"], "min": r["min"], "t": r["trades"],
               "y20": r["snaps"].get(20 * 252), "w20": r["snaps_wd"].get(20 * 252),
               "cut": r["liv_worst_cut"], "half": r["liv_half_pct"]}
        # 10년 동안 꺼내 쓴 돈 (생활비 흐름으로 직접 합산)
        row["w10"] = round(sum(x for j, x in flows if j < 10 * 252) / EOK, 2)
        if path:
            ks = sorted(r["snaps"])
            row["path"] = [[dates[si + k - 1].strftime("%Y-%m"), r["snaps"][k], r["snaps_liv"][k]] for k in ks
                           if k <= 30 * 252]
        rows.append(row)
    return v, name, rows


def summ(rows):
    a = sorted(r["i"] for r in rows)
    dd = sorted(r["dd"] for r in rows)
    mins = sorted(r["min"] for r in rows)
    w10 = sorted(r["w10"] for r in rows)
    return {
        "n": len(rows),
        "med": round(q(a, 0.5), 1), "p10": round(q(a, 0.1), 1), "worst": round(a[0], 1),
        "worst_start": min(rows, key=lambda r: r["i"])["s"],
        "dd": round(q(dd, 0.5), 1), "dd_max": round(dd[-1], 1),
        "min_med": round(q(mins, 0.5), 4), "min_worst": round(mins[0], 4),
        "lt10": sum(1 for r in rows if r["f"] < 10),
        "w10_med": round(q(w10, 0.5), 1), "w10_p10": round(q(w10, 0.1), 1),
    }


def main():
    t0 = time.time()
    tasks = [(v, s) for v in VARIANTS for s, _ in STRATS] + [("ndx", s) for s in LEV]
    with mp.Pool(mp.cpu_count(), initializer=_init) as pool:
        raw = {}
        for v, s, rows in pool.imap_unordered(_job, tasks):
            raw[(v, s)] = rows
            print(f"  {v} {s} · {time.time() - t0:.0f}초", flush=True)

    summary = {v: {s: summ(raw[(v, s)]) for s, _ in STRATS} for v in VARIANTS}
    actual = {s: summ(raw[("ndx", s)]) for s in LEV}
    dep = {v: {s: summ([r for r in raw[(v, s)] if r["s"] <= "1932-12"]) for s, _ in STRATS} for v in VARIANTS}

    for v in VARIANTS:
        print(f"\n[{v}] {VARIANTS[v][2]} — 1929~1970 시작 / (1929~1932 시작)")
        print(f"{'전략':<10}{'중간':>6}{'하위10':>7}{'최악':>7}{'최악시점':>9}{'낙폭':>6}{'최저자산':>9}{'<10억':>6}{'10년인출':>9} | 대공황 시작: 중간 최악 최저자산")
        for s, _ in STRATS:
            g, d = summary[v][s], dep[v][s]
            print(f"{s:<10}{g['med']:6.1f}{g['p10']:7.1f}{g['worst']:7.1f}{g['worst_start']:>9}{g['dd']:6.0f}{g['min_worst']:9.2f}{g['lt10']:6}{g['w10_med']:9.1f} | "
                  f"{d['med']:6.1f}{d['worst']:7.1f}{d['min_worst']:7.2f}")
        for lab in FOCUS:
            print(f"  {lab}: " + " ".join(f"{s} {next(r for r in raw[(v, s)] if r['s'] == lab)['i']:5.1f}%/"
                                         f"최저 {next(r for r in raw[(v, s)] if r['s'] == lab)['min']:.1f}억" for s, _ in STRATS))

    print("\n[실제 나스닥100, 1971~ 시작 · 10년 이상 보유] TQQQ 비중별")
    for s in LEV:
        g = actual[s]
        print(f"{s:<8} 중간 {g['med']} 하위10 {g['p10']} 최저자산 {g['min_worst']}억 10년인출 {g['w10_med']}억")

    # 대표 변형(recent)의 지수 월말 값 (차트용, 1927~1975)
    tq, qq, closes, ema, dates, *_ = build(*VARIANTS["recent"][:2])
    idx = pd.Series(closes, index=dates)
    idx = idx[idx.index < "1976-01-01"].groupby([idx.index[idx.index < "1976-01-01"].year, idx.index[idx.index < "1976-01-01"].month]).last()
    index_path = [[f"{y}-{m:02d}", round(float(v), 2)] for (y, m), v in idx.items()]

    out = {
        "meta": {
            "conditions": "초기 10억 · 스왑금리·운용보수 · 모든 매도 양도세 22% · 현금 외화RP(세후) · 신호 다음 거래일 매매(조기 재매수만 LOC) · "
                          "동적 인출 월 0.3/0.5/0.7%(상한 없음) · 오늘까지 보유 · 1954-07 이전 금리는 미국 3개월 국채 연평균 근사값",
            "variants": {v: d for v, (_, _, d) in VARIANTS.items()},
            "strategies": [s for s, _ in STRATS],
            "focus": FOCUS,
            "lev": LEV,
        },
        "summary": summary,
        "actual_1971": actual,
        "depression": dep,
        "rows": {v: {s: raw[(v, s)] for s, _ in STRATS} for v in VARIANTS},
        "index_recent": index_path,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    split_output()
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


def split_output():
    """포스트용 요약(경로 포함)과 데이터 뷰어용 시작 시점별 행을 나눈다 — 한 파일이면 너무 커서 화면이 느리다."""
    out = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    if "rows" not in out:
        print("이미 나눠진 파일 — main()을 다시 돌려야 함"); return
    rows = out.pop("rows")
    keep_s = ("RULE25", "S0", "HOLD1", "HOLD3", "R25W67")        # 포스트 차트에 쓰는 것만 남긴다
    keep_m = ("1929-09", "1937-03", "1968-12")
    out["paths"] = {v: {s: {r["s"]: r["path"] for r in rs if "path" in r and r["s"] in keep_m}
                        for s, rs in by.items() if s in keep_s} for v, by in rows.items() if v != "ndx"}
    cols = ["s", "i", "min", "w10", "dd", "f", "t"]
    compact = {v: {s: [[r[c] for c in cols] for r in rs] for s, rs in by.items()} for v, by in rows.items()}
    rows_path = OUT_PATH.with_name("withdrawal_1929_rows.json")
    rows_path.write_text(json.dumps({"cols": cols, "rows": compact}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"저장: {rows_path} ({rows_path.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    import sys
    split_output() if "--split" in sys.argv else main()
