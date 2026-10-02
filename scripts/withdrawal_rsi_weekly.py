"""
withdrawal_rsi_weekly.py

주봉 RSI vs 일봉 RSI 비교
────────────────────────────────────────────────────────────────
질문: 일봉 RSI(14일)이 최선인가? 주봉 RSI는 어떤가?

비교 대상:
  S0    기준선 (EMA200-15일, RSI 없음)
  D10   일봉 RSI(14일)<30 + 이격도<-10%  ← 현재 최선
  W30   주봉 RSI(14주)<30
  W20   주봉 RSI(14주)<20
  W30D  주봉 RSI(14주)<30 + 이격도<-10%
  W30D2 주봉 RSI(14주)<30 + 이격도<-5%
  D10GK 일봉 RSI(14일)<30 + 이격도<-10% + Guyton-Klinger (현재까지 조합 미검증)
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/mcv-nextjs/public/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_rsi_weekly.json")

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_RATIO  = 0.0088
LIV_MAX    = 15_000_000
TAX_RATE   = 0.22
DEDUCTION  = 2_500_000
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
VOO_DIV_MO = 0.013 / 12
DIV_TAX_R  = 0.154
DYN_RATES  = (0.003, 0.005, 0.007)
DYN_THRS   = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15


@dataclass
class Param:
    name: str
    desc: str
    rsi_key: str   = 'none'    # 'none' | 'd14' | 'w14'
    rsi_thr: float = 999.0
    div_thr: float = -999.0
    use_gk: bool   = False


STRATEGIES = [
    Param("S0",    "기준선: EMA200-15일 (RSI 없음)"),
    Param("D10",   "일봉 RSI(14일)<30 + 이격도<-10%",           rsi_key='d14', rsi_thr=30,  div_thr=-0.10),
    Param("D10GK", "일봉 RSI(14일)<30 + 이격도<-10% + GK",      rsi_key='d14', rsi_thr=30,  div_thr=-0.10, use_gk=True),
    Param("W30",   "주봉 RSI(14주)<30",                          rsi_key='w14', rsi_thr=30),
    Param("W20",   "주봉 RSI(14주)<20",                          rsi_key='w14', rsi_thr=20),
    Param("W30D10","주봉 RSI(14주)<30 + 이격도<-10%",            rsi_key='w14', rsi_thr=30,  div_thr=-0.10),
    Param("W30D05","주봉 RSI(14주)<30 + 이격도<-5%",             rsi_key='w14', rsi_thr=30,  div_thr=-0.05),
]


def compute_rsi_daily(closes, period=14):
    n      = len(closes)
    rsi    = np.full(n, np.nan)
    deltas = np.diff(closes)
    gains  = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    if n <= period + 1:
        return rsi
    ag = float(np.mean(gains[:period]))
    al = float(np.mean(losses[:period]))
    for i in range(period, n - 1):
        ag = (ag * (period - 1) + gains[i]) / period
        al = (al * (period - 1) + losses[i]) / period
        rsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)
    return rsi


def compute_rsi_weekly_mapped(ndx_df, dates, period=14):
    """주봉 RSI를 계산한 뒤 일봉 인덱스에 forward-fill로 매핑"""
    weekly = ndx_df.set_index("Date")["Close"].resample("W").last().dropna()
    wc     = weekly.values.astype(float)
    nw     = len(wc)

    if nw <= period + 1:
        return np.full(len(dates), np.nan)

    # 주봉 RSI 계산
    wd = np.diff(wc)
    wg = np.where(wd > 0, wd, 0.0)
    wl = np.where(wd < 0, -wd, 0.0)
    wrsi = np.full(nw, np.nan)
    ag = float(np.mean(wg[:period]))
    al = float(np.mean(wl[:period]))
    for i in range(period, nw - 1):
        ag = (ag * (period - 1) + wg[i]) / period
        al = (al * (period - 1) + wl[i]) / period
        wrsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)

    # 주봉 날짜를 일봉 인덱스에 매핑 (forward-fill)
    n_daily = len(dates)
    rsi_daily = np.full(n_daily, np.nan)
    weekly_dates = weekly.index

    di = 0
    wi = 0
    while di < n_daily and wi < nw:
        # 현재 주봉 날짜 이하의 마지막 일봉 인덱스를 찾아 fill
        wd_date = weekly_dates[wi]
        while di < n_daily and dates[di] <= wd_date:
            rsi_daily[di] = wrsi[wi]
            di += 1
        wi += 1

    return rsi_daily


def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    ret = np.diff(closes) / closes[:-1]
    ret = np.insert(ret, 0, 0.0)
    f3  = (1.0 + ret * 3.0) * (1.0 - EXP_RATIO / 252); f3[0] = 1.0
    ndx3x = 100.0 * np.cumprod(f3)

    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    a200 = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    rsi_d14 = compute_rsi_daily(closes, 14)
    rsi_w14 = compute_rsi_weekly_mapped(ndx, dates, 14)

    rsi_map = {'none': np.full(n, np.nan), 'd14': rsi_d14, 'w14': rsi_w14}

    print(f"주봉RSI 비NaN 갯수: {np.sum(~np.isnan(rsi_w14))} / {n}")
    print(f"주봉RSI<30 발생 횟수(전체 기간): {np.sum(rsi_w14 < 30)}")
    print(f"일봉RSI<30 발생 횟수(전체 기간): {np.sum(rsi_d14 < 30)}")

    return ndx3x, closes, ema200, rsi_map, dates, sp500, fed_rates


def get_monthly_starts(dates, ema200):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    return [i for i in starts if i >= first_valid and (len(ema200) - i) / 252 >= SIM_YEARS]


def run_sim(ndx3x, closes, ema200, rsi_map, dates, sp500, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))
    rsi_arr = rsi_map[p.rsi_key]

    ma_init  = ema200[start_idx]
    ma_valid = not np.isnan(ma_init) and ma_init > 0
    if ma_valid and closes[start_idx] < ma_init:
        is_invested = False; cash = float(INITIAL); shares = 0.0
    else:
        is_invested = True; shares = INITIAL / ndx3x[start_idx]; cash = 0.0

    avg_cost     = ndx3x[start_idx]
    cash_reserve = 0.0; tax_reserve = 0.0; annual_gain = 0.0; last_tax_yr = -1
    cum_tax = 0.0; cum_fees = 0.0; cum_withdrawn = 0.0
    voo_sh = 0.0; voo_avg = 0.0

    gk_mult = 1.0; gk_ic = 0.0; gk_ok = False; gk_pyr = float(INITIAL)

    last_mon = None; tday = 0; mon_cap = 0.0; mon_used = 0.0
    trade_count = 0; below_days = 0; above_days = 0; min_val = float('inf')

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n: break

        cur_date = dates[ci]
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        if cur_mon != last_mon:
            tday = 0; mon_used = 0.0
            ar = fed_rates.get(mon_key, 3.0)
            rm = max(0.0, ar / 100.0 - RP_SPREAD) / 12.0
            if cash_reserve > 0:
                g = cash_reserve * rm; cum_tax += g * RP_TAX_R; cash_reserve += g * (1 - RP_TAX_R)
            if tax_reserve > 0:
                g = tax_reserve * rm; cum_tax += g * RP_TAX_R; cash_reserve += g * (1 - RP_TAX_R)
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                at = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                if tax_reserve - at > 0: cash_reserve += tax_reserve - at
                cum_tax += at; tax_reserve = 0.0; annual_gain = 0.0
                if p.use_gk and gk_ok:
                    pn = (shares * ndx3x[ci] if is_invested else cash) + cash_reserve + voo_sh * sp500[ci]
                    yr = (pn - gk_pyr) / gk_pyr if gk_pyr > 0 else 0.0
                    if gk_ic > 0:
                        ratio = mon_cap / gk_ic
                        if ratio > 1.20: gk_mult = max(0.50, gk_mult * 0.80)
                        elif ratio < 0.80 and yr >= 0: gk_mult = min(1.50, gk_mult * 1.10)
                    gk_pyr = pn
            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year
                gk_pyr = (shares * ndx3x[ci] if is_invested else cash) + cash_reserve + voo_sh * sp500[ci]
            if voo_sh > 0:
                g = voo_sh * sp500[ci] * VOO_DIV_MO
                cum_tax += g * DIV_TAX_R; cash_reserve += g * (1 - DIV_TAX_R)
            pvc = shares * ndx3x[ci] if is_invested else cash
            total_c = pvc + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            br = (DYN_RATES[0] if total_c < DYN_THRS[0]
                  else DYN_RATES[1] if total_c < DYN_THRS[1] else DYN_RATES[2])
            mon_cap = min(total_c * br * (gk_mult if p.use_gk else 1.0), float(LIV_MAX))
            last_mon = cur_mon

        tday += 1

        e200 = ema200[ci]; e200ok = not np.isnan(e200) and e200 > 0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0: below_days += 1; above_days = 0
            elif div > 0: above_days += 1; below_days = 0
            else: below_days = above_days = 0

        sell_sig = e200ok and below_days >= TIME_FILTER
        buy_sig  = e200ok and above_days >= TIME_FILTER

        if not is_invested and not buy_sig and p.rsi_thr < 100 and e200ok:
            rv = rsi_arr[ci]
            if not np.isnan(rv) and rv < p.rsi_thr:
                div_ok = div <= p.div_thr if p.div_thr > -900 else True
                if div_ok:
                    buy_sig = True

        if is_invested and sell_sig:
            sv = shares * ndx3x[ci]; fee = sv * FEE_RATE; cum_fees += fee
            cash = sv - fee; shares = 0.0; is_invested = False; trade_count += 1; below_days = 0
        elif not is_invested and buy_sig:
            fee = cash * FEE_RATE; cum_fees += fee
            shares = (cash - fee) / ndx3x[ci]; avg_cost = ndx3x[ci]
            cash = 0.0; is_invested = True; trade_count += 1; above_days = 0

        if tday == 1 and j > 0:
            if is_invested:
                pv = shares * ndx3x[ci]
                wv = min(mon_cap, pv); ss = wv / ndx3x[ci]
                gn = max(0.0, wv - ss * avg_cost)
                annual_gain += gn; tw = gn * TAX_RATE; tax_reserve += tw
                at = wv - tw; shares = max(0.0, shares - ss)
                rem = max(0.0, mon_cap - mon_used)
                if at >= rem: living = rem; cash_reserve += at - living
                else:
                    fr = min(rem - at, cash_reserve); cash_reserve -= fr; living = at + fr
                mon_used += living; cum_withdrawn += living
                if p.use_gk and not gk_ok and living > 0: gk_ic = mon_cap; gk_ok = True
            else:
                tc2 = cash + cash_reserve; yl = mon_cap * 12
                lr = (1.0 if yl <= 0 or tc2 / yl >= 2 else
                      0.7 if tc2 / yl >= 1 else 0.5 if tc2 / yl >= 0.5 else 0.3)
                living = max(0.0, mon_cap * lr - mon_used); mon_used += living; cum_withdrawn += living
                if cash_reserve >= living: cash_reserve -= living
                else: cash = max(0.0, cash - (living - cash_reserve)); cash_reserve = 0.0

        if not is_invested:
            dr = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            if cash > 0: g = cash * dr; cum_tax += g * RP_TAX_R; cash += g * (1 - RP_TAX_R)

        if is_invested and cash_reserve > 0 and sp500[ci] > 0:
            pv2 = shares * ndx3x[ci]
            ta2 = pv2 + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    bs2 = exc / sp500[ci]
                    voo_avg = ((voo_avg * voo_sh + sp500[ci] * bs2) / (voo_sh + bs2)
                               if voo_sh > 0 else sp500[ci])
                    voo_sh += bs2; cash_reserve -= exc

        pv    = shares * ndx3x[ci] if is_invested else cash
        total = pv + cash_reserve + voo_sh * sp500[ci]
        if total < min_val: min_val = total
        if total <= 0: break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = shares * ndx3x[ci_end] if is_invested else cash
    final  = pv_end + cash_reserve + voo_sh * sp500[ci_end]
    ay     = sim_len / 252
    cagr   = ((final / INITIAL) ** (1 / ay) - 1) * 100 if ay > 0 and final > 0 else -100.0
    if min_val == float('inf'): min_val = 0.0

    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
        "trades":    trade_count,
    }


_SHARED = {}

def _init_worker(ndx3x, closes, ema200, rsi_map, dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'ndx3x': ndx3x, 'closes': closes, 'ema200': ema200,
        'rsi_map': rsi_map, 'dates': pd.DatetimeIndex(dates_list),
        'sp500': sp500, 'fed_rates': fed_rates, 'starts': starts,
    })

def _run_one(p: Param):
    d = _SHARED
    return (p.name, [
        run_sim(d['ndx3x'], d['closes'], d['ema200'], d['rsi_map'],
                d['dates'], d['sp500'], d['fed_rates'], si, p)
        for si in d['starts']
    ])


def main():
    t0 = time.time()
    print("=" * 65, flush=True)
    print("주봉 RSI vs 일봉 RSI 비교", flush=True)
    print("=" * 65, flush=True)

    ndx3x, closes, ema200, rsi_map, dates, sp500, fed_rates = load_data()
    starts = get_monthly_starts(dates, ema200)
    print(f"코호트: {len(starts)}개  전략: {len(STRATEGIES)}개\n", flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(ndx3x, closes, ema200, rsi_map,
                  dates.tolist(), sp500, fed_rates, starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)
    print(f"완료 ({time.time() - t0:.1f}s)\n", flush=True)

    KEY = ["1996-10", "1999-03", "2000-03", "2003-03", "2007-10", "2009-03"]
    strat_res = {pname: results for pname, results in raw}
    summary_rows = []; cohort_rows = []

    for p in STRATEGIES:
        results  = strat_res[p.name]
        total    = len(results)
        bankrupt = sum(1 for r in results if r["bankrupt"])
        finals   = [r["final"] for r in results if not r["bankrupt"]]
        cagrs    = [r["cagr"]  for r in results if not r["bankrupt"]]
        trades   = [r["trades"] for r in results]
        sf = sorted(finals); nf = len(sf); surv = (total - bankrupt) / total * 100
        summary_rows.append({
            "name": p.name, "desc": p.desc,
            "survival_rate": round(surv, 1),
            "med_final":  round(sf[nf // 2]   if nf else 0.0, 1),
            "avg_final":  round(sum(sf) / nf  if nf else 0.0, 1),
            "p25_final":  round(sf[nf // 4]   if nf else 0.0, 1),
            "p75_final":  round(sf[3*nf//4]   if nf else 0.0, 1),
            "avg_cagr":   round(sum(cagrs) / len(cagrs) if cagrs else 0.0, 2),
            "avg_trades": round(sum(trades) / len(trades) if trades else 0.0, 1),
        })

    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    for ki, si in enumerate(starts):
        label = dates[si].strftime("%Y-%m")
        row   = {"start": label}
        for p in STRATEGIES:
            r = strat_res[p.name][ki]
            row[p.name] = {"final": r["final"], "cagr": r["cagr"],
                           "min": r["min"], "bankrupt": r["bankrupt"], "trades": r["trades"]}
        cohort_rows.append(row)

    print(f"{'이름':<8} {'설명':<42} {'생존율':>6} {'중앙':>8} {'CAGR':>6} {'거래':>5}", flush=True)
    print("-" * 76, flush=True)
    for row in summary_rows:
        tag = "★ " if row["name"] == summary_rows[0]["name"] else "  "
        print(f"{tag}{row['name']:<6} {row['desc']:<42} "
              f"{row['survival_rate']:>5.1f}% {row['med_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}% {row['avg_trades']:>4.0f}회", flush=True)

    print("\n주요 코호트 (20년 후, 억):", flush=True)
    names = [p.name for p in STRATEGIES]
    print(f"{'코호트':<10}" + "".join(f"{n:>10}" for n in names), flush=True)
    print("-" * (10 + 10 * len(names)), flush=True)
    cd = {r["start"]: r for r in cohort_rows}
    for label in KEY:
        if label in cd:
            print(f"{label:<10}" + "".join(
                f"{cd[label][n]['final']:>9.1f}억" for n in names), flush=True)

    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.bool_,)): return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    out = {
        "meta": {
            "generated": str(dates[-1].date()), "sim_years": SIM_YEARS,
            "n_cohorts": len(starts),
            "strategies": [{"name": p.name, "desc": p.desc} for p in STRATEGIES],
        },
        "summary": summary_rows, "cohorts": cohort_rows,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)
    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size / 1024:.0f} KB)", flush=True)
    print(f"소요: {time.time() - t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
