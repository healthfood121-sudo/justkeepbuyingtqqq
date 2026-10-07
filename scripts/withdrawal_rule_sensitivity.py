"""
withdrawal_rule_sensitivity.py

25% 룰 기준값 민감도 — 25라는 숫자에서만 잘 나온 것인지 확인
──────────────────────────────────────────────────────────────────────────────
엔진: withdrawal_cash_tier.run_sim (withdrawal_full_period.py와 같은 조건 — 사이트 대표 수치 기준)
  스왑금리·운용보수 · 모든 매도 양도세 · 현금 외화RP(세후) · 신호 다음 거래일 매매 · 동적 인출 0.3/0.5/0.7% 상한 없음
  초기 10억, 매달 시작해 데이터 끝까지 보유, 지표는 10년 이상 보유한 시작 시점만

실험
  grid    : 나스닥100 — 매도 기준(1년 최고 종가 대비 하락률) 15~40% (1%p 간격) × 재매수 연속일 5/10/15/20/30
  window  : 나스닥100 — '최고 종가'를 보는 기간 6개월/1년/2년 (25%, 15일 고정)
  sp500   : S&P500으로 같은 규칙 (3배 합성, 1955년 이후 시작 — 기준금리 자료가 1954-07부터)
            매도 기준 15~40% (2.5%p 간격) × 재매수 15일 + 비교용 S0·신호 없이 보유

출력: web/public/data/withdrawal_rule_sensitivity.json       요약 + 하락 구간 목록
      web/public/data/withdrawal_rule_sensitivity_rows.json  시작 시점별 인출 포함 연 수익률·최대 낙폭 (데이터 뷰어)
  python scripts/withdrawal_rule_sensitivity.py
"""

import json, time
import multiprocessing as mp
import numpy as np
import pandas as pd

import withdrawal_cash_tier as E
from withdrawal_full_period import irr, q

OUT_PATH = E.ROOT / "web/public/data/withdrawal_rule_sensitivity.json"
MIN_YRS  = 10
P        = E.Param

THRS  = list(range(15, 41))
DAYS  = [5, 10, 15, 20, 30]
WINS  = [126, 252, 504]
SP_THRS = [15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 40]
ERAS  = [("1971~1989", 1971, 1989), ("1990~2002", 1990, 2002), ("2003~2016", 2003, 2016)]
SP_ERAS = [("1955~1970", 1955, 1970), ("1971~1989", 1971, 1989), ("1990~2002", 1990, 2002), ("2003~2016", 2003, 2016)]


def load_market(csv: str, splice: bool, win: int = 252):
    """withdrawal_cash_tier.load_data와 같은 계산을 다른 지수·최고가 기간으로."""
    df = pd.read_csv(E.DATA_DIR / csv, parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    if splice:
        m = df["Date"] == pd.Timestamp("1985-10-01")
        if m.any():
            i = df.index[m][0]
            df.loc[i:, "Close"] *= df.loc[i - 1, "Close"] / df.loc[i, "Close"]
    closes = df["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(df["Date"])
    n      = len(closes)
    ret    = np.insert(np.diff(closes) / closes[:-1], 0, 0.0)
    with open(E.DATA_DIR / "fed_funds_rate.json", encoding="utf-8") as f:
        fed = {r["date"][:7]: float(r["rate"]) for r in json.load(f)}
    ffr = np.array([fed.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 for d in dates])
    f3 = (1.0 + 3.0 * ret - 2.0 * ffr / 252) * (1.0 - E.EXP_3X / 252)
    f3[0] = 1.0
    f1 = (1.0 + ret) * (1.0 - E.EXP_1X / 252)
    f1[0] = 1.0
    a = 2.0 / 201
    ema = np.full(n, np.nan)
    ema[199] = closes[:200].mean()
    for i in range(200, n):
        ema[i] = closes[i] * a + ema[i - 1] * (1 - a)
    rp = np.array([max(0.0, fed.get(f"{d.year}-{d.month:02d}", 3.0) / 100 - E.RP_SPREAD) / 252
                   for d in dates]) * (1 - E.RP_TAX_R)
    rsi   = E.compute_rsi(closes, 14)
    peaks = pd.Series(closes).rolling(win, min_periods=1).max().values
    return [100 * np.cumprod(f3), 100 * np.cumprod(f1), closes, ema, dates, rp, rsi, peaks]


_M = {}


def _init():
    E.LIV_MAX = float("inf")
    _M["ndx"] = {w: load_market("ndx_1971_now.csv", True, w) for w in WINS}
    _M["sp"]  = load_market("sp500_1927_now.csv", False, 252)


def _job(task):
    """task = (market, win, name, Param, first_year) → 시작 시점별 결과"""
    mkt, win, name, p, y0 = task
    m = _M["ndx"][win] if mkt == "ndx" else _M["sp"]
    tq, qq, closes, ema, dates, rp, rsi, peaks = m
    rows = []
    for si in E.get_monthly_starts(dates):
        if dates[si].year < y0:
            continue
        r = E.run_sim(tq, qq, closes, ema, dates, rp, rsi, peaks, si, p, True,
                      exec_mode="loc", horizon_days=len(closes), collect_flows=True)
        if r["years"] < MIN_YRS:
            continue
        rows.append({"m": dates[si].strftime("%Y-%m"), "y": dates[si].year, "irr": irr(r["flows"], r["final"], r["years"]),
                     "dd": r["max_dd"], "t": r["trades"] / r["years"] * 10,
                     "s": r["sells"], "qr": r["quick_resells"], "cash": r["cash_days_pct"],
                     "lt10": bool(r["final"] < 10)})
    return task[:3], rows


def summarize(rows, eras):
    a = sorted(r["irr"] for r in rows)
    sells = sum(r["s"] for r in rows)
    out = {
        "n": len(rows),
        "med": round(q(a, 0.5), 1), "p10": round(q(a, 0.10), 1), "worst": round(a[0], 1),
        "dd": round(q(sorted(r["dd"] for r in rows), 0.5), 1),
        "trades10": round(sum(r["t"] for r in rows) / len(rows), 1),
        "quick": round(sum(r["qr"] for r in rows) / sells * 100, 1) if sells else 0.0,
        "cash": round(sum(r["cash"] for r in rows) / len(rows), 1),
        "lt10": int(sum(r["lt10"] for r in rows)),
        "eras": {},
    }
    for lab, y0, y1 in eras:
        e = sorted(r["irr"] for r in rows if y0 <= r["y"] <= y1)
        if e:
            out["eras"][lab] = round(q(e, 0.5), 1)
    return out


def drawdown_episodes(closes, dates, peaks, lo=0.15, reset=0.05):
    """1년 최고 종가 대비 lo 넘게 빠진 하락 구간: 시작일 · 최저일 · 최저 하락률 · 최저점 1년 뒤 수익률."""
    dd = closes / peaks - 1
    out, s, m = [], None, None
    for k in range(len(closes)):
        if s is None and dd[k] < -lo:
            s = m = k
        if s is not None:
            if dd[k] < dd[m]:
                m = k
            if dd[k] > -reset or k == len(closes) - 1:
                j = min(m + 252, len(closes) - 1)
                out.append({"start": str(dates[s].date()), "bottom": str(dates[m].date()),
                            "dd": round(float(dd[m]) * 100, 1), "after1y": round(float(closes[j] / closes[m] - 1) * 100, 1)})
                s = None
    return out


def main():
    t0 = time.time()
    tasks = []
    for thr in THRS:
        for d in DAYS:
            tasks.append(("ndx", 252, f"R{thr}_{d}", P(f"R{thr}_{d}", "", ((0, 1.0),), trail_thr=thr / 100, days=d), 1971))
    for w in WINS:
        if w != 252:
            tasks.append(("ndx", w, f"W{w}", P(f"W{w}", "", ((0, 1.0),), trail_thr=0.25), 1971))
    for thr in SP_THRS:
        tasks.append(("sp", 252, f"SP{thr}", P(f"SP{thr}", "", ((0, 1.0),), trail_thr=thr / 100), 1955))
    tasks.append(("sp", 252, "SP_S0", P("SP_S0", "", ((0, 1.0),)), 1955))
    tasks.append(("sp", 252, "SP_HOLD", P("SP_HOLD", "", ((0, 1.0),), hold=True), 1955))
    for d in DAYS:   # 같은 재매수 연속일의 S0 (200일선 매도) — 비교 기준
        tasks.append(("ndx", 252, f"S0_{d}", P(f"S0_{d}", "", ((0, 1.0),), days=d), 1971))

    with mp.Pool(mp.cpu_count(), initializer=_init) as pool:
        res = {}
        for k, (key, rows) in enumerate(pool.imap_unordered(_job, tasks), 1):
            res[key[2]] = rows
            if k % 10 == 0:
                print(f"  {k}/{len(tasks)} · {time.time() - t0:.0f}초", flush=True)

    grid = {f"{thr}_{d}": summarize(res[f"R{thr}_{d}"], ERAS) for thr in THRS for d in DAYS}
    s0   = {str(d): summarize(res[f"S0_{d}"], ERAS) for d in DAYS}
    window = {"126": summarize(res["W126"], ERAS), "252": grid["25_15"], "504": summarize(res["W504"], ERAS)}
    sp = {str(t): summarize(res[f"SP{t}"], SP_ERAS) for t in SP_THRS}
    sp["S0"]   = summarize(res["SP_S0"], SP_ERAS)
    sp["HOLD"] = summarize(res["SP_HOLD"], SP_ERAS)

    print("\n[나스닥100] 매도 기준 × 재매수 연속일 — 인출 포함 연 수익률 중간 (하위10%)")
    print("기준 " + "".join(f"{d:>14}일" for d in DAYS))
    for thr in THRS:
        print(f"{thr:>3}% " + "".join(f"{grid[f'{thr}_{d}']['med']:>9.1f} ({grid[f'{thr}_{d}']['p10']:>4.1f})" for d in DAYS))
    print("S0   " + "".join(f"{s0[str(d)]['med']:>9.1f} ({s0[str(d)]['p10']:>4.1f})" for d in DAYS))
    print("\n[나스닥100] 15일 — 시기별 중간 / 낙폭 / 매매·10년 / 재매도")
    for thr in THRS:
        g = grid[f"{thr}_15"]
        print(f"{thr:>3}% {g['med']:5.1f} {g['p10']:5.1f} {g['worst']:5.1f} | " + " ".join(f"{k} {v:5.1f}" for k, v in g["eras"].items())
              + f" | 낙폭 {g['dd']:.0f} 매매 {g['trades10']} 재매도 {g['quick']}% 현금 {g['cash']}%")
    print("\n[최고가 기간] " + " · ".join(f"{w}일 {v['med']}/{v['p10']}" for w, v in window.items()))
    print("\n[S&P500 3배, 1955~] 15일")
    for k, g in sp.items():
        print(f"{k:>5} {g['med']:5.1f} {g['p10']:5.1f} {g['worst']:5.1f} | " + " ".join(f"{a} {v:5.1f}" for a, v in g["eras"].items())
              + f" | 낙폭 {g['dd']:.0f} 매매 {g['trades10']} <10억 {g['lt10']}")

    ndx = load_market("ndx_1971_now.csv", True, 252)
    spm = load_market("sp500_1927_now.csv", False, 252)
    episodes = {"ndx": drawdown_episodes(ndx[2], ndx[4], ndx[7]),
                "sp500": [e for e in drawdown_episodes(spm[2], spm[4], spm[7]) if e["start"] >= "1955"]}

    # 시작 시점별 인출 포함 연 수익률 · 최대 낙폭 (데이터 뷰어용)
    def per_start(keys):
        return {"starts": [r["m"] for r in res[keys[0]]],
                "irr": {k: [r["irr"] for r in res[k]] for k in keys},
                "dd":  {k: [r["dd"] for r in res[k]] for k in keys}}
    rows_ndx = per_start([f"R{t}_{d}" for t in THRS for d in DAYS] + [f"S0_{d}" for d in DAYS] + ["W126", "W504"])
    rows_sp  = per_start([f"SP{t}" for t in SP_THRS] + ["SP_S0", "SP_HOLD"])

    out = {
        "meta": {
            "conditions": "초기 10억 · 스왑금리·운용보수 · 모든 매도 양도세 22% · 현금 외화RP(세후) · 신호 다음 거래일 매매 · "
                          "동적 인출 월 0.3/0.5/0.7%(상한 없음) · 오늘까지 보유 · 10년 이상 보유한 시작 시점만",
            "thrs": THRS, "days": DAYS, "sp_thrs": SP_THRS,
            "eras": [e[0] for e in ERAS], "sp_eras": [e[0] for e in SP_ERAS],
        },
        "grid": grid, "s0": s0, "window": window, "sp500": sp,
        "episodes": episodes,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    rows_path = OUT_PATH.with_name("withdrawal_rule_sensitivity_rows.json")
    rows_path.write_text(json.dumps({"ndx": rows_ndx, "sp500": rows_sp}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"저장: {rows_path} ({rows_path.stat().st_size / 1024:.0f} KB)")
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB) · {time.time() - t0:.0f}초")


if __name__ == "__main__":
    main()
