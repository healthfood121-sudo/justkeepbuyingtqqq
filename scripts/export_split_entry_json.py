"""
export_split_entry_json.py
거치금 분할 진입 방식별 코호트 결과를 JSON으로 저장

출력:
  web/public/data/split_entry_ndx3x.json
  web/public/data/split_entry_ndx2x.json
  web/public/data/split_entry_ndx1x.json
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = "D:/justkeepbuyingtqqq/data/"
OUT_DIR  = "D:/justkeepbuyingtqqq/web/public/data/"

DAILY_INV = 200_000
LUMP      = 250_000_000
TARGET    = 1_000_000_000


# ── 데이터 로드 ─────────────────────────────────────────

def load_ndx():
    df = pd.read_csv(DATA_DIR + "ndx_1971_now.csv", parse_dates=["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i - 1, "Close"] / df.loc[i, "Close"]
        df.loc[i:, "Close"] *= scale
    return df

def make_prices(df, leverage):
    ret = df["Close"].pct_change().fillna(0).values
    return 100.0 * np.cumprod(1.0 + ret * leverage)

def monthly_starts(dates_pd):
    ym = pd.Series(dates_pd.values).dt.to_period("M")
    seen = {}
    idxs = []
    for i, p in enumerate(ym):
        if p not in seen:
            seen[p] = True
            idxs.append(i)
    return idxs


# ── 거치금 스케줄 생성기 ─────────────────────────────────

def sched_instant():
    return np.array([float(LUMP)])

def sched_daily_split(n_days):
    return np.full(n_days, LUMP / n_days)

def sched_monthly_split(dates_slice, n_months):
    n = len(dates_slice)
    arr = np.zeros(n)
    per = LUMP / n_months
    ym = pd.Series(dates_slice.values).dt.to_period("M")
    seen = {}
    cnt = 0
    for i, p in enumerate(ym):
        if p not in seen:
            seen[p] = True
            arr[i] += per
            cnt += 1
            if cnt >= n_months:
                break
    return arr

def sched_dip_split(prices_slice, dip_pct, split_days=252):
    n = len(prices_slice)
    arr = np.zeros(n)
    peak = prices_slice[0]
    trigger = None
    for i in range(n):
        if prices_slice[i] > peak:
            peak = prices_slice[i]
        if (peak - prices_slice[i]) / peak >= dip_pct:
            trigger = i
            break
    if trigger is None:
        fallback = min(2520, n - 1)
        arr[fallback] = float(LUMP)
        return arr
    end_i = min(trigger + split_days, n)
    actual = end_i - trigger
    per = LUMP / split_days
    arr[trigger:end_i] = per
    if actual < split_days:
        arr[end_i - 1] += LUMP - per * actual
    return arr


# ── 단일 코호트 백테스트 ──────────────────────────────────

def backtest_one(prices, start_i, dates_pd, lump_schedule):
    n = len(prices) - start_i
    if n <= 0:
        return None
    px = prices[start_i: start_i + n]
    inv = np.full(n, float(DAILY_INV))
    m = min(len(lump_schedule), n)
    inv[:m] += lump_schedule[:m]
    cum_shares = np.cumsum(inv / px)
    port = cum_shares * px
    hit = port >= TARGET
    start_dt = dates_pd.iloc[start_i]
    if hit.any():
        hi = int(np.argmax(hit))
        end_dt = dates_pd.iloc[start_i + hi]
        years = (end_dt - start_dt).days / 365.25
        return {
            "s": start_dt.strftime("%Y-%m"),
            "y": round(years, 2),
            "e": end_dt.strftime("%Y-%m"),
        }
    else:
        return {
            "s": start_dt.strftime("%Y-%m"),
            "y": None,
            "e": None,
        }


# ── 방식별 정의 ───────────────────────────────────────────

METHODS = [
    ("instant",   "즉시 거치 (기준선)"),
    ("dip15",     "하락 −15% 후 1년 분산"),
    ("dip20",     "하락 −20% 후 1년 분산"),
    ("dip30",     "하락 −30% 후 1년 분산"),
    ("monthly3y", "월 분할 3년 (36개월)"),
    ("monthly4y", "월 분할 4년 (48개월)"),
    ("monthly5y", "월 분할 5년 (60개월)"),
    ("daily1y",   "일 분할 1년 (252일)"),
    ("daily2y",   "일 분할 2년 (504일)"),
    ("daily3y",   "일 분할 3년 (756일)"),
]

def get_schedule(key, prices_slice, dates_slice):
    if key == "instant":      return sched_instant()
    if key == "dip15":        return sched_dip_split(prices_slice, 0.15)
    if key == "dip20":        return sched_dip_split(prices_slice, 0.20)
    if key == "dip30":        return sched_dip_split(prices_slice, 0.30)
    if key == "monthly3y":    return sched_monthly_split(dates_slice, 36)
    if key == "monthly4y":    return sched_monthly_split(dates_slice, 48)
    if key == "monthly5y":    return sched_monthly_split(dates_slice, 60)
    if key == "daily1y":      return sched_daily_split(252)
    if key == "daily2y":      return sched_daily_split(504)
    if key == "daily3y":      return sched_daily_split(756)
    raise ValueError(key)


# ── 전체 실행 ──────────────────────────────────────────────

def run_instrument(leverage, inst_label):
    print(f"  {inst_label} (lev={leverage}x)...")
    df = load_ndx()
    prices = make_prices(df, leverage)
    dates_pd = df["Date"]
    starts = monthly_starts(dates_pd)

    methods_out = {}
    for key, label in METHODS:
        cohorts = []
        for ci in starts:
            ps = prices[ci:]
            ds = dates_pd[ci:]
            sched = get_schedule(key, ps, ds)
            r = backtest_one(prices, ci, dates_pd, sched)
            if r:
                cohorts.append(r)

        completed = [r for r in cohorts if r["y"] is not None]
        years = [r["y"] for r in completed]
        stats = {
            "total":     len(cohorts),
            "completed": len(completed),
            "pct":       round(100 * len(completed) / len(cohorts), 1) if cohorts else 0,
            "avg":       round(float(np.mean(years)),   2) if years else None,
            "median":    round(float(np.median(years)), 2) if years else None,
            "min":       round(float(np.min(years)),    2) if years else None,
            "max":       round(float(np.max(years)),    2) if years else None,
        }
        methods_out[key] = {"label": label, "stats": stats, "cohorts": cohorts}
        print(f"    {key}: 완료 {stats['completed']}/{stats['total']} max={stats['max']}년")

    return methods_out


def main():
    import time
    t0 = time.time()
    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)

    instruments = [
        ("ndx3x", 3, "TQQQ (NDX 3x)"),
        ("ndx2x", 2, "QLD (NDX 2x)"),
        ("ndx1x", 1, "QQQ (NDX 1x)"),
    ]

    params = {"lump": LUMP, "daily": DAILY_INV, "target": TARGET}

    for key, lev, label in instruments:
        methods = run_instrument(lev, label)
        out = {"instrument": label, "params": params, "methods": methods}
        path = OUT_DIR + f"split_entry_{key}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        size = Path(path).stat().st_size / 1024
        print(f"  → {path}  ({size:.1f} KB)")

    print(f"\n완료. 총 소요: {time.time()-t0:.1f}초")


if __name__ == "__main__":
    main()
