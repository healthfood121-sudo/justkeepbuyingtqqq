"""
withdrawal_rsi_sweep.py

RSI 조기 재진입 파라미터 그리드 서치
────────────────────────────────────────────────────────────────
배경: S7(RSI<30 즉시재진입)이 중앙값 3,231억으로 현재최선(S0 1,176억) 대비 2.75배 우세.
      단, 장기 하락(2003-03 코호트)에서 취약함이 발견됨.

탐색 공간:
  Group A. RSI 임계값     : RSI < 20 / 25 / 30 / 35 / 40
  Group B. 이격도 필터    : RSI<30 AND div < −5% / −10% / −15%
  Group C. 현금보유일 필터: RSI<30 AND 매도 후 경과일 ≤ 30 / 60 / 90 거래일
  Group D. RSI 기간       : RSI(7) / RSI(14) / RSI(21) < 30
  Group E. 조합 (GK+RSI)  : 최선 RSI 파라미터 + Guyton-Klinger 인출 규칙

기준선 S0 (EMA200-15일, RSI 없음) 포함하여 총 17개 전략
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass, field

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR = (_ROOT / "data")
FED_PATH = (_ROOT / "data/fed_funds_rate.json")
OUT_PATH = (_ROOT / "web/public/data/withdrawal_rsi_sweep.json")

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
    rsi_period: int   = 14    # RSI 계산 기간
    rsi_thr: float    = 999.0 # RSI 임계값 (999 = RSI 미사용)
    div_thr: float    = -999. # 이격도 하한 (−0.05 = EMA200 대비 5% 이상 하락)
    cash_day_max: int = 9999  # 매도 후 최대 경과 거래일 (9999 = 무제한)
    use_gk: bool      = False  # Guyton-Klinger 인출 규칙 적용


STRATEGIES = [
    # ── 기준선 ──
    Param("S0",  "기준선: EMA200-15일 (RSI 없음)",           rsi_thr=999),

    # ── Group A: RSI 임계값 ──
    Param("R20", "RSI<20 조기재진입",                        rsi_thr=20),
    Param("R25", "RSI<25 조기재진입",                        rsi_thr=25),
    Param("R30", "RSI<30 조기재진입 (기존 S7)",              rsi_thr=30),
    Param("R35", "RSI<35 조기재진입",                        rsi_thr=35),
    Param("R40", "RSI<40 조기재진입",                        rsi_thr=40),

    # ── Group B: 이격도 필터 ──
    Param("D05", "RSI<30 AND 이격도<−5%",                   rsi_thr=30, div_thr=-0.05),
    Param("D10", "RSI<30 AND 이격도<−10%",                  rsi_thr=30, div_thr=-0.10),
    Param("D15", "RSI<30 AND 이격도<−15%",                  rsi_thr=30, div_thr=-0.15),

    # ── Group C: 현금보유일 필터 ──
    Param("C30", "RSI<30 AND 매도후≤30일",                  rsi_thr=30, cash_day_max=30),
    Param("C60", "RSI<30 AND 매도후≤60일",                  rsi_thr=30, cash_day_max=60),
    Param("C90", "RSI<30 AND 매도후≤90일",                  rsi_thr=30, cash_day_max=90),

    # ── Group D: RSI 기간 ──
    Param("P07", "RSI(7기간)<30",                            rsi_thr=30, rsi_period=7),
    Param("P14", "RSI(14기간)<30 (= R30)",                   rsi_thr=30, rsi_period=14),
    Param("P21", "RSI(21기간)<30",                            rsi_thr=30, rsi_period=21),

    # ── Group E: 최선 조합 + GK (R30 기반) ──
    Param("GK",  "RSI<30 + Guyton-Klinger",                  rsi_thr=30, use_gk=True),
]


# ═══════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════

def compute_rsi(closes, period):
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

    f3 = (1.0 + ret * 3.0) * (1.0 - EXP_RATIO / 252)
    f3[0] = 1.0
    ndx3x = 100.0 * np.cumprod(f3)

    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    # EMA200
    a200 = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    # RSI 시리즈 (기간별)
    rsi_series = {
        7:  compute_rsi(closes, 7),
        14: compute_rsi(closes, 14),
        21: compute_rsi(closes, 21),
    }

    return ndx3x, closes, ema200, rsi_series, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════
# 시뮬레이션
# ═══════════════════════════════════════════════════════════

def run_sim(ndx3x, closes, ema200, rsi_series, dates, sp500, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))
    rsi14   = rsi_series[p.rsi_period]

    ma_init  = ema200[start_idx]
    ma_valid = not np.isnan(ma_init) and ma_init > 0
    if ma_valid and closes[start_idx] < ma_init:
        is_invested = False
        cash        = float(INITIAL)
        shares      = 0.0
    else:
        is_invested = True
        shares      = INITIAL / ndx3x[start_idx]
        cash        = 0.0

    avg_cost     = ndx3x[start_idx]
    cash_reserve = 0.0
    tax_reserve  = 0.0
    annual_gain  = 0.0
    last_tax_yr  = -1
    cum_tax      = 0.0
    cum_fees     = 0.0
    cum_withdrawn= 0.0
    voo_sh       = 0.0
    voo_avg      = 0.0

    # Guyton-Klinger 상태
    gk_mult          = 1.0
    gk_initial_cap   = 0.0
    gk_initialized   = False
    gk_port_yr_start = float(INITIAL)

    last_mon    = None
    tday_in_mon = 0
    mon_cap     = 0.0
    mon_used    = 0.0
    trade_count = 0
    below_days  = 0
    above_days  = 0
    days_in_cash= 0   # 마지막 매도 이후 경과 거래일
    min_val     = float('inf')

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        cur_date = dates[ci]
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        # ═══ 월초 처리 ═══
        if cur_mon != last_mon:
            tday_in_mon = 0
            mon_used    = 0.0

            annual_rate = fed_rates.get(mon_key, 3.0)
            rp_mo = max(0.0, annual_rate / 100.0 - RP_SPREAD) / 12.0

            if cash_reserve > 0:
                g = cash_reserve * rp_mo
                cum_tax      += g * RP_TAX_R
                cash_reserve += g * (1 - RP_TAX_R)
            if tax_reserve > 0:
                g = tax_reserve * rp_mo
                cum_tax      += g * RP_TAX_R
                cash_reserve += g * (1 - RP_TAX_R)

            # 연말 처리
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0

                # GK 연간 조정
                if p.use_gk and gk_initialized:
                    pv_now   = shares * ndx3x[ci] if is_invested else cash
                    port_now = pv_now + cash_reserve + voo_sh * sp500[ci]
                    yr_ret   = ((port_now - gk_port_yr_start) / gk_port_yr_start
                                if gk_port_yr_start > 0 else 0.0)
                    if gk_initial_cap > 0:
                        ratio = mon_cap / gk_initial_cap
                        if ratio > 1.20:
                            gk_mult = max(0.50, gk_mult * 0.80)
                        elif ratio < 0.80 and yr_ret >= 0:
                            gk_mult = min(1.50, gk_mult * 1.10)
                    gk_port_yr_start = port_now

            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year
                pv_yr = shares * ndx3x[ci] if is_invested else cash
                gk_port_yr_start = pv_yr + cash_reserve + voo_sh * sp500[ci]

            if voo_sh > 0:
                g = voo_sh * sp500[ci] * VOO_DIV_MO
                cum_tax      += g * DIV_TAX_R
                cash_reserve += g * (1 - DIV_TAX_R)

            # 인출 캡
            pv_c    = shares * ndx3x[ci] if is_invested else cash
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            base_rate = (DYN_RATES[0] if total_c < DYN_THRS[0]
                         else DYN_RATES[1] if total_c < DYN_THRS[1]
                         else DYN_RATES[2])
            mon_cap = total_c * base_rate
            if p.use_gk:
                mon_cap *= gk_mult
            mon_cap = min(mon_cap, float(LIV_MAX))
            last_mon = cur_mon

        tday_in_mon += 1

        # ═══ 현금 보유 중 거래일 카운터 ═══
        if not is_invested:
            days_in_cash += 1

        # ═══ EMA200 신호 ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0:
                below_days += 1; above_days  = 0
            elif div > 0:
                above_days += 1; below_days  = 0
            else:
                below_days = above_days = 0

        sell_sig = e200ok and below_days >= TIME_FILTER
        buy_sig  = e200ok and above_days >= TIME_FILTER

        # RSI 조기 재진입 조건
        if (not is_invested and not buy_sig
                and p.rsi_thr < 100 and e200ok):
            rsi_v = rsi14[ci]
            if not np.isnan(rsi_v) and rsi_v < p.rsi_thr:
                div_ok  = (div <= p.div_thr) if p.div_thr > -900 else True
                cash_ok = (days_in_cash <= p.cash_day_max)
                if div_ok and cash_ok:
                    buy_sig = True

        # ═══ 매도 ═══
        if is_invested and sell_sig:
            sell_val = shares * ndx3x[ci]
            fee      = sell_val * FEE_RATE
            cum_fees += fee
            cash        = sell_val - fee
            shares      = 0.0
            is_invested = False
            trade_count+= 1
            below_days  = 0
            days_in_cash= 0

        # ═══ 매수 ═══
        elif not is_invested and buy_sig:
            fee      = cash * FEE_RATE
            cum_fees += fee
            shares   = (cash - fee) / ndx3x[ci]
            avg_cost = ndx3x[ci]
            cash     = 0.0
            is_invested   = True
            trade_count  += 1
            above_days    = 0
            days_in_cash  = 0

        # ═══ 월초 인출 ═══
        if tday_in_mon == 1 and j > 0:
            if is_invested:
                pv      = shares * ndx3x[ci]
                wd_val  = min(mon_cap, pv)
                sh_sold = wd_val / ndx3x[ci]
                gain    = max(0.0, wd_val - sh_sold * avg_cost)
                annual_gain  += gain
                tax_w        = gain * TAX_RATE
                tax_reserve  += tax_w
                after_tax    = wd_val - tax_w
                shares       = max(0.0, shares - sh_sold)

                remaining = max(0.0, mon_cap - mon_used)
                if after_tax >= remaining:
                    living        = remaining
                    cash_reserve += after_tax - living
                else:
                    from_res      = min(remaining - after_tax, cash_reserve)
                    cash_reserve -= from_res
                    living        = after_tax + from_res
                mon_used      += living
                cum_withdrawn += living

                if p.use_gk and not gk_initialized and living > 0:
                    gk_initial_cap = mon_cap
                    gk_initialized = True

            else:
                total_cash = cash + cash_reserve
                yearly_cap = mon_cap * 12
                lr = (1.0 if yearly_cap <= 0 or total_cash / yearly_cap >= 2 else
                      0.7 if total_cash / yearly_cap >= 1 else
                      0.5 if total_cash / yearly_cap >= 0.5 else 0.3)
                living        = max(0.0, mon_cap * lr - mon_used)
                mon_used      += living
                cum_withdrawn += living
                if cash_reserve >= living:
                    cash_reserve -= living
                else:
                    cash = max(0.0, cash - (living - cash_reserve))
                    cash_reserve = 0.0

        # ═══ RP 일별 이자 ═══
        if not is_invested:
            daily_r = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            if cash > 0:
                g    = cash * daily_r
                cum_tax += g * RP_TAX_R
                cash += g * (1 - RP_TAX_R)

        # ═══ VOO 편입 ═══
        if is_invested and cash_reserve > 0 and sp500[ci] > 0:
            pv2 = shares * ndx3x[ci]
            ta2 = pv2 + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    bs = exc / sp500[ci]
                    voo_avg = ((voo_avg * voo_sh + sp500[ci] * bs)
                               / (voo_sh + bs)) if voo_sh > 0 else sp500[ci]
                    voo_sh       += bs
                    cash_reserve -= exc

        # ═══ 총자산 ═══
        pv    = shares * ndx3x[ci] if is_invested else cash
        total = pv + cash_reserve + voo_sh * sp500[ci]
        if total < min_val:
            min_val = total
        if total <= 0:
            break

    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = shares * ndx3x[ci_end] if is_invested else cash
    final  = pv_end + cash_reserve + voo_sh * sp500[ci_end]

    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'):
        min_val = 0.0

    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
        "trades":    trade_count,
    }


# ═══════════════════════════════════════════════════════════
# 병렬 실행
# ═══════════════════════════════════════════════════════════

_SHARED = {}


def _init_worker(ndx3x, closes, ema200, rsi_series, dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'ndx3x': ndx3x, 'closes': closes, 'ema200': ema200,
        'rsi_series': rsi_series,
        'dates': pd.DatetimeIndex(dates_list),
        'sp500': sp500, 'fed_rates': fed_rates, 'starts': starts,
    })


def _run_one(p: Param):
    d = _SHARED
    results = [
        run_sim(d['ndx3x'], d['closes'], d['ema200'], d['rsi_series'],
                d['dates'], d['sp500'], d['fed_rates'], si, p)
        for si in d['starts']
    ]
    return (p.name, results)


def main():
    t0 = time.time()
    print("=" * 70, flush=True)
    print("RSI 조기재진입 파라미터 그리드 서치", flush=True)
    print("=" * 70, flush=True)

    ndx3x, closes, ema200, rsi_series, dates, sp500, fed_rates = load_data()

    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    starts      = [i for i in get_monthly_starts(dates)
                   if i >= first_valid and (len(ndx3x) - i) / 252 >= SIM_YEARS]

    print(f"코호트: {len(starts)}개  전략: {len(STRATEGIES)}개", flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(ndx3x, closes, ema200, rsi_series,
                  dates.tolist(), sp500, fed_rates, starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)

    print(f"완료 ({time.time() - t0:.1f}s)\n", flush=True)

    KEY_COHORTS = ["1996-10", "1999-03", "2000-03", "2003-03", "2007-10", "2009-03"]

    summary_rows = []
    cohort_rows  = []
    strat_results = {pname: results for pname, results in raw}

    for p in STRATEGIES:
        results  = strat_results[p.name]
        total    = len(results)
        bankrupt = sum(1 for r in results if r["bankrupt"])
        finals   = [r["final"] for r in results if not r["bankrupt"]]
        cagrs    = [r["cagr"]  for r in results if not r["bankrupt"]]
        trades   = [r["trades"] for r in results]
        withds   = [r["withdrawn"] for r in results]
        mins     = [r["min"] for r in results]

        sf = sorted(finals)
        nf = len(sf)
        surv = (total - bankrupt) / total * 100

        summary_rows.append({
            "name":          p.name,
            "desc":          p.desc,
            "rsi_period":    p.rsi_period,
            "rsi_thr":       p.rsi_thr,
            "div_thr":       p.div_thr,
            "cash_day_max":  p.cash_day_max,
            "use_gk":        p.use_gk,
            "survival_rate": round(surv, 1),
            "med_final":     round(sf[nf // 2]    if nf else 0.0, 1),
            "avg_final":     round(sum(sf) / nf   if nf else 0.0, 1),
            "p25_final":     round(sf[nf // 4]    if nf else 0.0, 1),
            "p75_final":     round(sf[3*nf//4]    if nf else 0.0, 1),
            "avg_withdrawn": round(sum(withds) / len(withds) if withds else 0.0, 2),
            "min_of_min":    round(min(mins) if mins else 0.0, 4),
            "avg_cagr":      round(sum(cagrs) / len(cagrs) if cagrs else 0.0, 2),
            "avg_trades":    round(sum(trades) / len(trades) if trades else 0.0, 1),
        })

    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    for ki, si in enumerate(starts):
        label = dates[si].strftime("%Y-%m")
        row   = {"start": label}
        for p in STRATEGIES:
            r = strat_results[p.name][ki]
            row[p.name] = {
                "final":    r["final"],
                "cagr":     r["cagr"],
                "min":      r["min"],
                "bankrupt": r["bankrupt"],
                "trades":   r["trades"],
            }
        cohort_rows.append(row)

    # ── 콘솔 출력 ──
    print(f"{'이름':<6} {'설명':<44} {'생존율':>6} {'중앙':>8} {'CAGR':>6} {'거래':>5}", flush=True)
    print("-" * 78, flush=True)
    for row in summary_rows:
        tag = "★ " if row["name"] == summary_rows[0]["name"] else "  "
        print(f"{tag}{row['name']:<4} {row['desc']:<44} "
              f"{row['survival_rate']:>5.1f}% "
              f"{row['med_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}% "
              f"{row['avg_trades']:>4.0f}회", flush=True)

    # 주요 코호트 비교
    print("\n주요 코호트 비교 (상위 5 + S0 포함, 20년 후, 억):", flush=True)
    top5 = [r["name"] for r in summary_rows[:5]]
    show_names = list(dict.fromkeys(["S0"] + top5))
    cohort_dict = {r["start"]: r for r in cohort_rows}
    print(f"{'코호트':<10}" + "".join(f"{n:>10}" for n in show_names), flush=True)
    print("-" * (10 + 10 * len(show_names)), flush=True)
    for label in KEY_COHORTS:
        if label in cohort_dict:
            vals = []
            for n in show_names:
                r = cohort_dict[label].get(n, {})
                v = r.get("final", 0) if not r.get("bankrupt", False) else 0
                vals.append(f"{v:>9.1f}억")
            print(f"{label:<10}" + "".join(vals), flush=True)

    # ── JSON 저장 ──
    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.bool_,)):   return bool(o)
            if isinstance(o, np.integer):    return int(o)
            if isinstance(o, np.floating):   return float(o)
            return super().default(o)

    out = {
        "meta": {
            "generated": str(dates[-1].date()),
            "sim_years": SIM_YEARS,
            "n_cohorts": len(starts),
            "strategies": [{"name": p.name, "desc": p.desc} for p in STRATEGIES],
        },
        "summary": summary_rows,
        "cohorts": cohort_rows,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size / 1024:.0f} KB)", flush=True)
    print(f"소요: {time.time() - t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
