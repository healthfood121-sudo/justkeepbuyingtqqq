"""
export_split_entry_json.py
거치금 분할 진입 방식별 코호트 결과를 JSON으로 저장

출력:
  web/public/data/split_entry_ndx3x.json      (standard: 운용보수만)
  web/public/data/split_entry_ndx2x.json
  web/public/data/split_entry_ndx1x.json
  web/public/data/split_entry_ndx3x_v2.json   (with_costs: 운용보수+스왑금리)
  web/public/data/split_entry_ndx2x_v2.json
  web/public/data/split_entry_ndx1x_v2.json

실행:
  python scripts/export_split_entry_json.py           # standard만
  python scripts/export_split_entry_json.py --mode v2 # with_costs만
  python scripts/export_split_entry_json.py --mode both
"""

import argparse
import json
import sys
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices, get_monthly_starts

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

OUT_DIR = (_ROOT / "web/public/data")

DAILY_INV = 200_000
LUMP      = 250_000_000
TARGET    = 1_000_000_000


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
    start_dt = dates_pd[start_i]
    if hit.any():
        hi = int(np.argmax(hit))
        end_dt = dates_pd[start_i + hi]
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

def run_and_save(price_mode: str):
    """price_mode: 'standard' | 'with_costs'"""
    suffix = "_v2" if price_mode == "with_costs" else ""
    print(f"\n[mode={price_mode}]")

    d = load_ndx_prices(price_mode)
    dates = d["dates"]
    starts = get_monthly_starts(dates)
    prices_map = {
        "ndx3x": d["ndx3x"],
        "ndx2x": d["ndx2x"],
        "ndx1x": d["ndx1x"],
    }
    labels_map = {
        "ndx3x": "TQQQ (NDX 3x)",
        "ndx2x": "QLD (NDX 2x)",
        "ndx1x": "QQQ (NDX 1x)",
    }

    params = {"lump": LUMP, "daily": DAILY_INV, "target": TARGET}
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for inst_key, prices in prices_map.items():
        label = labels_map[inst_key]
        print(f"  {label}...")

        methods_out = {}
        for key, method_label in METHODS:
            cohorts = []
            for ci in starts:
                ps = prices[ci:]
                ds = dates[ci:]
                sched = get_schedule(key, ps, ds)
                r = backtest_one(prices, ci, dates, sched)
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
            methods_out[key] = {"label": method_label, "stats": stats, "cohorts": cohorts}
            print(f"    {key}: 완료 {stats['completed']}/{stats['total']} max={stats['max']}년")

        out = {"instrument": label, "params": params, "methods": methods_out}
        path = OUT_DIR / f"split_entry_{inst_key}{suffix}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        size = path.stat().st_size / 1024
        print(f"  → {path.name}  ({size:.1f} KB)")


if __name__ == "__main__":
    import time
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["standard", "v2", "both"],
                        default="standard",
                        help="가격 모드 (default: standard)")
    args = parser.parse_args()

    t0 = time.time()
    if args.mode == "both":
        run_and_save("standard")
        run_and_save("with_costs")
    elif args.mode == "v2":
        run_and_save("with_costs")
    else:
        run_and_save("standard")
    print(f"\n완료. 총 소요: {time.time()-t0:.1f}초")
