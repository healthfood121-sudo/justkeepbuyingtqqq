"""
withdrawal_asym_days.py

S0 매수/매도 연속일 비대칭 스윕
──────────────────────────────────────────────────────────────
S0 (NDX EMA200 + 연속 15일 + 동적인출 0.3/0.5/0.7%)는 매도·매수 모두
"연속 15일" 같은 기준을 쓴다. 기존 withdrawal_param_sweep.py는 매도=매수
같은 일수만 바꿔봤으므로, 여기서는 매도 확인일(sell_days)과 매수 확인일
(buy_days)을 따로 움직여 본다.

  sell_days : NDX가 EMA200 아래로 N일 연속 → TQQQ 전량 매도
  buy_days  : NDX가 EMA200 위로   M일 연속 → 현금 전량 TQQQ 매수

시뮬레이션 규칙은 withdrawal_signal_test.py 의 S0와 동일
(RP 이자·세금·VOO 편입·동적인출 포함). (15,15)가 S0 결과를 재현해야 한다.

모드:
  standard : TQQQ 운용보수만
  v2       : + 스왑금리 2× (연방기금금리 × 2 일할 차감)

검증용:
  ndx 시작 시점을 1985년 이전 / 이후로 나눠 따로 집계
  SP500 3x (1955~) 에도 같은 그리드를 돌려 독립 검증

실행:
  python scripts/withdrawal_asym_days.py
  → web/public/data/withdrawal_asym_days.json
"""

import json, time
import numpy as np
import pandas as pd
from pathlib import Path
from numba import njit

ROOT     = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
FED_PATH = DATA_DIR / "fed_funds_rate.json"
OUT_PATH = ROOT / "web/public/data/withdrawal_asym_days.json"

INITIAL    = 1_000_000_000.0
SIM_YEARS  = 20
EXP_TQQQ   = 0.0088
EXP_SPXL   = 0.0091
LIV_MAX    = 15_000_000.0
TAX_RATE   = 0.22
DEDUCTION  = 2_500_000.0
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
VOO_DIV_MO = 0.013 / 12
DIV_TAX_R  = 0.154
DYN_R0, DYN_R1, DYN_R2 = 0.003, 0.005, 0.007
DYN_T0, DYN_T1 = 1_000_000_000.0, 2_000_000_000.0
VOO_THR    = 2_000_000_000.0

DAYS_GRID = [1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30, 40]
SPLIT_YEAR = 1985


# ═══════════════════════════════════════════════════════════
# 데이터
# ═══════════════════════════════════════════════════════════

def ema(arr, n=200):
    out = np.full(len(arr), np.nan)
    a = 2.0 / (n + 1)
    out[n - 1] = np.mean(arr[:n])
    for i in range(n, len(arr)):
        out[i] = arr[i] * a + out[i - 1] * (1 - a)
    return out


def lev3(closes, dates, fed_rates, exp_ratio, swap):
    ret = np.diff(closes) / closes[:-1]
    ret = np.insert(ret, 0, 0.0)
    if swap:
        fed_daily = np.array([fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 / 252
                              for d in dates])
        f = (1.0 + ret * 3.0 - 2.0 * fed_daily) * (1.0 - exp_ratio / 252)
    else:
        f = (1.0 + ret * 3.0) * (1.0 - exp_ratio / 252)
    f[0] = 1.0
    return 100.0 * np.cumprod(f)


def load():
    with open(FED_PATH, encoding="utf-8") as fp:
        fed_rates = {r["date"][:7]: float(r["rate"]) for r in json.load(fp)}

    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    return ndx, sp5, fed_rates


def build_market(dates, sig_closes, sp500, fed_rates, exp_ratio, swap):
    dates = pd.DatetimeIndex(dates)
    n = len(dates)
    lev = lev3(sig_closes, dates, fed_rates, exp_ratio, swap)
    mon_id = (dates.year * 12 + dates.month).values.astype(np.int64)
    year   = dates.year.values.astype(np.int64)
    rate   = np.array([fed_rates.get(f"{d.year}-{d.month:02d}", 3.0) for d in dates])
    return dict(lev=lev, closes=sig_closes.astype(float), ema=ema(sig_closes),
                sp500=sp500.astype(float), mon_id=mon_id, year=year, rate=rate,
                dates=dates, n=n)


def monthly_starts(m, min_year=None):
    dates, e = m["dates"], m["ema"]
    first_valid = int(np.where(~np.isnan(e))[0][0])
    seen, out = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k in seen:
            continue
        seen.add(k)
        if i < first_valid or (m["n"] - i) / 252 < SIM_YEARS:
            continue
        if min_year and d.year < min_year:
            continue
        out.append(i)
    return np.array(out, dtype=np.int64)


# ═══════════════════════════════════════════════════════════
# 시뮬레이션 코어 (withdrawal_signal_test.py S0와 동일 규칙)
# ═══════════════════════════════════════════════════════════

@njit(cache=True)
def run_sim(lev, closes, ema200, sp500, mon_id, year, rate,
            start_idx, sell_days, buy_days):
    n = len(lev)
    sim_len = min(n - start_idx, SIM_YEARS * 252)

    e0 = ema200[start_idx]
    if (not np.isnan(e0)) and e0 > 0 and closes[start_idx] < e0:
        cash = INITIAL; sh = 0.0
    else:
        sh = INITIAL / lev[start_idx]; cash = 0.0

    avg_cost = lev[start_idx]
    cash_reserve = 0.0; tax_reserve = 0.0; annual_gain = 0.0
    last_tax_yr = -1; cum_wd = 0.0; voo_sh = 0.0
    below = 0; above = 0
    last_mon = -1; tday = 0; mon_cap = 0.0
    trades = 0

    for j in range(sim_len):
        ci = start_idx + j
        is_tqqq = sh > 0

        if mon_id[ci] != last_mon:
            tday = 0
            rp_mo = max(0.0, rate[ci] / 100.0 - RP_SPREAD) / 12.0
            if cash_reserve > 0:
                cash_reserve += cash_reserve * rp_mo * (1 - RP_TAX_R)
            if last_tax_yr >= 0 and year[ci] > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                tax_reserve = 0.0; annual_gain = 0.0
            if last_tax_yr < 0 or year[ci] > last_tax_yr:
                last_tax_yr = year[ci]
            if voo_sh > 0:
                cash_reserve += voo_sh * sp500[ci] * VOO_DIV_MO * (1 - DIV_TAX_R)
            pv_c = sh * lev[ci] if is_tqqq else cash
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if total_c < DYN_T0:
                br = DYN_R0
            elif total_c < DYN_T1:
                br = DYN_R1
            else:
                br = DYN_R2
            mon_cap = min(total_c * br, LIV_MAX)
            last_mon = mon_id[ci]
        tday += 1

        e = ema200[ci]
        eok = (not np.isnan(e)) and e > 0
        if eok:
            d = (closes[ci] - e) / e
            if d < 0:
                below += 1; above = 0
            elif d > 0:
                above += 1; below = 0
            else:
                below = 0; above = 0

        if is_tqqq and eok and below >= sell_days:
            sv = sh * lev[ci]
            cash = sv - sv * FEE_RATE
            sh = 0.0; below = 0; trades += 1
        elif (not is_tqqq) and eok and above >= buy_days:
            sh = (cash - cash * FEE_RATE) / lev[ci]
            avg_cost = lev[ci]; cash = 0.0; above = 0; trades += 1

        if tday == 1 and j > 0 and mon_cap > 0:
            if sh > 0:
                pv = sh * lev[ci]
                wd = min(mon_cap, pv)
                sold = wd / lev[ci]
                gain = max(0.0, wd - sold * avg_cost)
                annual_gain += gain
                tw = gain * TAX_RATE
                tax_reserve += tw
                after = wd - tw
                sh = max(0.0, sh - sold)
                if after >= mon_cap:
                    cash_reserve += after - mon_cap
                    cum_wd += mon_cap
                else:
                    fr = min(mon_cap - after, cash_reserve)
                    cash_reserve -= fr
                    cum_wd += after + fr
            else:
                living = min(mon_cap, cash + cash_reserve)
                cum_wd += living
                if cash_reserve >= living:
                    cash_reserve -= living
                else:
                    cash = max(0.0, cash - (living - cash_reserve))
                    cash_reserve = 0.0

        if sh == 0 and cash > 0:
            daily_r = max(0.0, rate[ci] / 100.0 - RP_SPREAD) / 252
            cash += cash * daily_r * (1 - RP_TAX_R)

        if sh > 0 and cash_reserve > 0 and sp500[ci] > 0:
            ta2 = sh * lev[ci] + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= VOO_THR:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    voo_sh += exc / sp500[ci]
                    cash_reserve -= exc

        pv = sh * lev[ci] if sh > 0 else cash
        if pv + cash_reserve + voo_sh * sp500[ci] <= 0:
            break

    ce = min(start_idx + sim_len - 1, n - 1)
    pv_end = sh * lev[ce] if sh > 0 else cash
    final = pv_end + cash_reserve + voo_sh * sp500[ce]
    return final, cum_wd, trades


@njit(cache=True)
def run_grid(lev, closes, ema200, sp500, mon_id, year, rate, starts, days):
    k = len(days)
    out_f = np.zeros((k, k, len(starts)))
    out_w = np.zeros((k, k, len(starts)))
    out_t = np.zeros((k, k, len(starts)))
    for a in range(k):
        for b in range(k):
            for s in range(len(starts)):
                f, w, t = run_sim(lev, closes, ema200, sp500, mon_id, year, rate,
                                  starts[s], days[a], days[b])
                out_f[a, b, s] = f; out_w[a, b, s] = w; out_t[a, b, s] = t
    return out_f, out_w, out_t


# ═══════════════════════════════════════════════════════════
# 집계
# ═══════════════════════════════════════════════════════════

def med(x):
    # 기존 스크립트와 같은 방식: sorted[n//2]
    s = np.sort(x)
    return float(s[len(s) // 2]) if len(s) else 0.0


def summarize(m, starts, days):
    f, w, t = run_grid(m["lev"], m["closes"], m["ema"], m["sp500"],
                       m["mon_id"], m["year"], m["rate"], starts, np.array(days, dtype=np.int64))
    f /= 1e8; w /= 1e8
    i15 = days.index(15)
    base = f[i15, i15]
    yrs = m["dates"][starts].year.values
    early = yrs < SPLIT_YEAR
    rows = []
    for a, sd in enumerate(days):
        for b, bd in enumerate(days):
            ff = f[a, b]
            rows.append({
                "sell": sd, "buy": bd,
                "surv": round(float(np.mean(ff > 0)) * 100, 1),
                "med": round(med(ff), 1),
                "p25": round(float(np.sort(ff)[len(ff) // 4]), 1),
                "p10": round(float(np.sort(ff)[len(ff) // 10]), 1),
                "worst": round(float(ff.min()), 2),
                "wd": round(float(w[a, b].mean()), 2),
                "trades": round(float(t[a, b].mean()), 1),
                "win": round(float(np.mean(ff > base)) * 100, 1),
                "med_early": round(med(ff[early]), 1) if early.any() else None,
                "med_late": round(med(ff[~early]), 1) if (~early).any() else None,
            })
    return rows, f


def print_heat(title, rows, days, key="med"):
    print(f"\n{title}  [{key}]  행=매도일, 열=매수일", flush=True)
    print("sell\\buy" + "".join(f"{d:>8}" for d in days), flush=True)
    lut = {(r["sell"], r["buy"]): r[key] for r in rows}
    for sd in days:
        print(f"{sd:>8}" + "".join(f"{lut[(sd, bd)]:>8.0f}" if lut[(sd, bd)] is not None else f"{'-':>8}"
                                    for bd in days), flush=True)


def top(rows, n=10):
    base = next(r for r in rows if r["sell"] == 15 and r["buy"] == 15)
    print(f"  기준 S0(15/15): 중앙 {base['med']}억  하위25% {base['p25']}억  "
          f"최악 {base['worst']}억  인출 {base['wd']}억  거래 {base['trades']}회", flush=True)
    for r in sorted(rows, key=lambda r: -r["med"])[:n]:
        print(f"  매도{r['sell']:>3} 매수{r['buy']:>3}  중앙 {r['med']:>8.1f}  P25 {r['p25']:>7.1f}  "
              f"P10 {r['p10']:>7.1f}  최악 {r['worst']:>6.2f}  인출 {r['wd']:>6.2f}  "
              f"거래 {r['trades']:>5.1f}  S0대비승률 {r['win']:>5.1f}%  "
              f"전기 {r['med_early']}  후기 {r['med_late']}", flush=True)


def main():
    t0 = time.time()
    ndx, sp5, fed = load()
    ndx_dates = pd.DatetimeIndex(ndx["Date"])
    ndx_close = ndx["Close"].values.astype(float)
    sp_on_ndx = sp5.set_index("Date")["Close"].reindex(ndx_dates, method="ffill").values

    sp_dates = pd.DatetimeIndex(sp5["Date"])
    sp_close = sp5["Close"].values.astype(float)

    out = {"meta": {"generated": str(ndx_dates[-1].date()), "sim_years": SIM_YEARS,
                    "days_grid": DAYS_GRID, "split_year": SPLIT_YEAR},
           "results": {}}

    for label, swap in [("standard", False), ("v2", True)]:
        m = build_market(ndx_dates, ndx_close, sp_on_ndx, fed, EXP_TQQQ, swap)
        starts = monthly_starts(m)
        rows, _ = summarize(m, starts, DAYS_GRID)
        out["results"][f"ndx_{label}"] = {"n_cohorts": int(len(starts)), "rows": rows}
        print(f"\n===== NDX 3x / {label}  시작 시점 {len(starts)}개 =====", flush=True)
        print_heat("NDX " + label, rows, DAYS_GRID)
        print_heat("NDX " + label, rows, DAYS_GRID, "p25")
        print_heat("NDX " + label, rows, DAYS_GRID, "trades")
        top(rows)

        ms = build_market(sp_dates, sp_close, sp_close, fed, EXP_SPXL, swap)
        s_starts = monthly_starts(ms, min_year=1955)
        s_rows, _ = summarize(ms, s_starts, DAYS_GRID)
        out["results"][f"sp500_{label}"] = {"n_cohorts": int(len(s_starts)), "rows": s_rows}
        print(f"\n===== SP500 3x / {label}  시작 시점 {len(s_starts)}개 =====", flush=True)
        print_heat("SP500 " + label, s_rows, DAYS_GRID)
        top(s_rows)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as fp:
        json.dump(out, fp, ensure_ascii=False, separators=(",", ":"))
    print(f"\n저장: {OUT_PATH} ({OUT_PATH.stat().st_size / 1024:.0f} KB)  {time.time() - t0:.1f}초",
          flush=True)


if __name__ == "__main__":
    main()
