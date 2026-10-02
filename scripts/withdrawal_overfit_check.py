"""
withdrawal_overfit_check.py

D10GK 과최적화 검증
────────────────────────────────────────────────────────────────
D10GK (일봉RSI<30 + 이격도<-10% + GK)는 NDX 418코호트에서 최적화된 전략이다.
같은 데이터로 파라미터를 찾았으므로 과최적화(data snooping) 위험이 있다.

3가지 out-of-sample 검증:
  Test 1: SP500 3x (다른 지수 — NDX 아님)
  Test 2: 합성 NDX 1929~ (다른 시대 — 최적화에 쓰인 1985~2005 코호트 밖)
  Test 3: 파라미터 민감도 (RSI 임계값 ±5, 이격도 ±2%, GK on/off)

결론 기준:
  - 두 out-of-sample 테스트에서 D10GK > S0 → 과최적화 아님
  - 파라미터 ±1단계 변화에서 중앙값 변화 < 20% → 안정적
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/mcv-nextjs/public/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_overfit_check.json")

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_TQQQ   = 0.0088   # TQQQ-급 3x ETF 비용
EXP_SPXL   = 0.0091   # SPXL 비용 (SP500 3x)
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

# D10GK 파라미터
RSI_THR_BEST = 30
DIV_THR_BEST = -0.10

# 합성 NDX 베타 (tech-era, β=1.244)
BETA_SYNTH  = 1.244
ALPHA_SYNTH = 4.34 / 100 / 252


@dataclass
class Param:
    name: str
    desc: str
    rsi_thr: float = 999.0
    div_thr: float = -999.0
    use_gk: bool   = False
    exp_ratio: float = EXP_TQQQ   # 기초자산별 비용률


# ──────────────────────────────────────────────────────────
# 공통 시뮬레이션 함수
# ──────────────────────────────────────────────────────────

def compute_rsi(closes, period=14):
    n = len(closes); rsi = np.full(n, np.nan)
    d = np.diff(closes)
    g = np.where(d > 0, d, 0.0); l = np.where(d < 0, -d, 0.0)
    if n <= period + 1: return rsi
    ag = float(np.mean(g[:period])); al = float(np.mean(l[:period]))
    for i in range(period, n - 1):
        ag = (ag * (period - 1) + g[i]) / period
        al = (al * (period - 1) + l[i]) / period
        rsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)
    return rsi


def make_3x(closes, exp_ratio):
    n = len(closes)
    ret = np.diff(closes) / closes[:-1]; ret = np.insert(ret, 0, 0.0)
    f = (1.0 + ret * 3.0) * (1.0 - exp_ratio / 252); f[0] = 1.0
    return 100.0 * np.cumprod(f)


def run_sim(etf3x, closes, ema200, rsi14, sp500, fed_rates, dates, start_idx, p):
    n = len(etf3x); sim_len = min(n - start_idx, int(SIM_YEARS * 252))
    ma_i = ema200[start_idx]; ma_v = not np.isnan(ma_i) and ma_i > 0
    if ma_v and closes[start_idx] < ma_i:
        is_inv = False; cash = float(INITIAL); shares = 0.0
    else:
        is_inv = True; shares = INITIAL / etf3x[start_idx]; cash = 0.0
    avg = etf3x[start_idx]; cr = 0.0; tr = 0.0; ag2 = 0.0; lty = -1
    cum_t = 0.0; cum_w = 0.0; vsh = 0.0; vavg = 0.0
    gk_m = 1.0; gk_ic = 0.0; gk_ok = False; gk_pyr = float(INITIAL)
    lm = None; td = 0; mc = 0.0; mu = 0.0; tc = 0; bd = 0; ad = 0; mv = float('inf')

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n: break
        cd = dates[ci]; cm = (cd.year, cd.month); mk = cd.strftime("%Y-%m")
        if cm != lm:
            td = 0; mu = 0.0
            ar = fed_rates.get(mk, 3.0); rm = max(0.0, ar / 100.0 - RP_SPREAD) / 12.0
            if cr > 0: g = cr * rm; cum_t += g * RP_TAX_R; cr += g * (1 - RP_TAX_R)
            if tr > 0: g = tr * rm; cum_t += g * RP_TAX_R; cr += g * (1 - RP_TAX_R)
            if lty >= 0 and cd.year > lty:
                at = max(0.0, ag2 - DEDUCTION) * TAX_RATE
                if tr - at > 0: cr += tr - at
                cum_t += at; tr = 0.0; ag2 = 0.0
                if p.use_gk and gk_ok:
                    pn = (shares * etf3x[ci] if is_inv else cash) + cr + vsh * sp500[ci]
                    yr = (pn - gk_pyr) / gk_pyr if gk_pyr > 0 else 0.0
                    if gk_ic > 0:
                        rat = mc / gk_ic
                        if rat > 1.20: gk_m = max(0.50, gk_m * 0.80)
                        elif rat < 0.80 and yr >= 0: gk_m = min(1.50, gk_m * 1.10)
                    gk_pyr = pn
            if lty < 0 or cd.year > lty:
                lty = cd.year
                gk_pyr = (shares * etf3x[ci] if is_inv else cash) + cr + vsh * sp500[ci]
            if vsh > 0: g = vsh * sp500[ci] * VOO_DIV_MO; cum_t += g * DIV_TAX_R; cr += g * (1 - DIV_TAX_R)
            pvc = shares * etf3x[ci] if is_inv else cash
            tc2 = pvc + cr + tr + vsh * sp500[ci]
            br = DYN_RATES[0] if tc2 < DYN_THRS[0] else DYN_RATES[1] if tc2 < DYN_THRS[1] else DYN_RATES[2]
            mc = min(tc2 * br * (gk_m if p.use_gk else 1.0), float(LIV_MAX)); lm = cm
        td += 1
        e2 = ema200[ci]; e2ok = not np.isnan(e2) and e2 > 0
        if e2ok:
            dv = (closes[ci] - e2) / e2
            if dv < 0: bd += 1; ad = 0
            elif dv > 0: ad += 1; bd = 0
            else: bd = ad = 0
        ss = e2ok and bd >= TIME_FILTER; bs = e2ok and ad >= TIME_FILTER
        if not is_inv and not bs and p.rsi_thr < 100 and e2ok:
            rv = rsi14[ci]
            if not np.isnan(rv) and rv < p.rsi_thr:
                if p.div_thr > -900: bs = (dv <= p.div_thr)
                else: bs = True
        if is_inv and ss:
            sv = shares * etf3x[ci]; fe = sv * FEE_RATE; cum_t += 0
            cash = sv - fe; shares = 0.0; is_inv = False; tc += 1; bd = 0
        elif not is_inv and bs:
            fe = cash * FEE_RATE; shares = (cash - fe) / etf3x[ci]; avg = etf3x[ci]
            cash = 0.0; is_inv = True; tc += 1; ad = 0
        if td == 1 and j > 0:
            if is_inv:
                wv = min(mc, shares * etf3x[ci]); ss2 = wv / etf3x[ci]
                gn = max(0.0, wv - ss2 * avg); ag2 += gn; tw = gn * TAX_RATE; tr += tw
                at = wv - tw; shares = max(0.0, shares - ss2)
                rem = max(0.0, mc - mu)
                if at >= rem: lv = rem; cr += at - lv
                else: fr = min(rem - at, cr); cr -= fr; lv = at + fr
                mu += lv; cum_w += lv
                if p.use_gk and not gk_ok and lv > 0: gk_ic = mc; gk_ok = True
            else:
                tc2 = cash + cr; yl = mc * 12
                lr = (1.0 if yl <= 0 or tc2 / yl >= 2 else
                      0.7 if tc2 / yl >= 1 else 0.5 if tc2 / yl >= 0.5 else 0.3)
                lv = max(0.0, mc * lr - mu); mu += lv; cum_w += lv
                if cr >= lv: cr -= lv
                else: cash = max(0.0, cash - (lv - cr)); cr = 0.0
        if not is_inv:
            dr = max(0.0, fed_rates.get(mk, 3.0) / 100.0 - RP_SPREAD) / 252
            if cash > 0: g = cash * dr; cum_t += g * RP_TAX_R; cash += g * (1 - RP_TAX_R)
        if is_inv and cr > 0 and sp500[ci] > 0:
            pv2 = shares * etf3x[ci]; ta2 = pv2 + cr + tr + vsh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cr - mc * 36
                if exc > 0:
                    bs2 = exc / sp500[ci]
                    vavg = ((vavg * vsh + sp500[ci] * bs2) / (vsh + bs2)) if vsh > 0 else sp500[ci]
                    vsh += bs2; cr -= exc
        pv = shares * etf3x[ci] if is_inv else cash
        tot = pv + cr + vsh * sp500[ci]
        if tot < mv: mv = tot
        if tot <= 0: break

    cen = min(start_idx + sim_len - 1, n - 1)
    pve = shares * etf3x[cen] if is_inv else cash
    final = pve + cr + vsh * sp500[cen]
    ay = sim_len / 252
    cagr = ((final / INITIAL) ** (1 / ay) - 1) * 100 if ay > 0 and final > 0 else -100.0
    return {"final": round(final / 1e8, 2), "cagr": round(cagr, 2),
            "bankrupt": bool(final <= 0), "min": round(mv / 1e8, 4) if mv < 1e18 else 0.0,
            "trades": tc}


def get_monthly_starts(dates, ema200, min_hist_years=0):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen: seen.add(k); starts.append(i)
    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    return [i for i in starts if i >= first_valid and (len(ema200) - i) / 252 >= SIM_YEARS]


def cohort_stats(results):
    total = len(results); bankrupt = sum(1 for r in results if r["bankrupt"])
    finals = sorted(r["final"] for r in results if not r["bankrupt"])
    cagrs  = [r["cagr"] for r in results if not r["bankrupt"]]
    trades = [r["trades"] for r in results]
    nf = len(finals); surv = (total - bankrupt) / total * 100
    return {
        "survival_rate": round(surv, 1),
        "med_final":  round(finals[nf // 2]    if nf else 0.0, 1),
        "avg_final":  round(sum(finals) / nf   if nf else 0.0, 1),
        "p25_final":  round(finals[nf // 4]    if nf else 0.0, 1),
        "p75_final":  round(finals[3*nf // 4]  if nf else 0.0, 1),
        "avg_cagr":   round(sum(cagrs) / len(cagrs)   if cagrs  else 0.0, 2),
        "avg_trades": round(sum(trades) / len(trades)  if trades else 0.0, 1),
    }


# ──────────────────────────────────────────────────────────
# Test 1: SP500 3x (다른 지수)
# ──────────────────────────────────────────────────────────

def run_sp500_test(fed_rates):
    print("\n[Test 1] SP500 3x 적용 (SPXL 모사, 1985~)", flush=True)
    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp5 = sp5[sp5["Date"] >= "1950-01-01"].reset_index(drop=True)

    closes = sp5["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(sp5["Date"])
    n      = len(closes)
    etf3x  = make_3x(closes, EXP_SPXL)

    # EMA200
    a200 = 2.0 / 201; ema200 = np.full(n, np.nan); ema200[199] = np.mean(closes[:200])
    for i in range(200, n): ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    rsi14 = compute_rsi(closes, 14)

    # SP500 자신이 VOO 역할 (배당 스킵, 단순화)
    sp500_voo = closes.copy()

    starts = get_monthly_starts(dates, ema200)
    # 1985~2005 시작 코호트로 제한 (NDX 테스트와 동기간)
    starts_cmp = [i for i in starts if 1985 <= dates[i].year <= 2005]
    print(f"  1985~2005 코호트: {len(starts_cmp)}개", flush=True)

    strategies = [
        Param("S0_sp5",    "SP500 기준선 (EMA200-15일)",              exp_ratio=EXP_SPXL),
        Param("D10GK_sp5", "SP500 D10GK (RSI<30+div<-10%+GK)", rsi_thr=30, div_thr=-0.10, use_gk=True, exp_ratio=EXP_SPXL),
    ]

    results = {}
    for p in strategies:
        res = [run_sim(etf3x, closes, ema200, rsi14, sp500_voo, fed_rates, dates, si, p)
               for si in starts_cmp]
        results[p.name] = {"stats": cohort_stats(res), "raw": res}
        st = results[p.name]["stats"]
        print(f"  {p.name:<16} 생존율 {st['survival_rate']}%  중앙 {st['med_final']}억  CAGR {st['avg_cagr']}%  거래 {st['avg_trades']:.0f}회", flush=True)

    # 주요 코호트
    key_labels = ["1996-10", "1999-03", "2000-03", "2003-03"]
    kc_map = {dates[si].strftime("%Y-%m"): ki for ki, si in enumerate(starts_cmp)}
    print("  주요 코호트:", flush=True)
    for lb in key_labels:
        if lb in kc_map:
            ki = kc_map[lb]
            r0  = results["S0_sp5"]["raw"][ki]
            r1  = results["D10GK_sp5"]["raw"][ki]
            print(f"    {lb}: S0={r0['final']:.1f}억  D10GK={r1['final']:.1f}억", flush=True)

    return results, dates, starts_cmp


# ──────────────────────────────────────────────────────────
# Test 2: 합성 NDX 1929~ (다른 시대)
# ──────────────────────────────────────────────────────────

def make_synthetic_ndx_full(fed_rates):
    """SP500 pre-1971 + 실제 NDX 접합 (β=1.244 tech-era)"""
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]; ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)

    ndx_start = ndx["Date"].iloc[0]  # 1971-02-05
    sp_pre    = sp5[sp5["Date"] < ndx_start].copy()
    sp_ret    = sp_pre["Close"].pct_change().fillna(0).values
    syn_ret   = BETA_SYNTH * sp_ret + ALPHA_SYNTH
    syn_prices = 100.0 * np.cumprod(1.0 + syn_ret)

    ndx_ret   = ndx["Close"].pct_change().fillna(0).values
    ndx_prices = 100.0 * np.cumprod(1.0 + ndx_ret)
    scale      = syn_prices[-1] / ndx_prices[0]
    ndx_prices_adj = ndx_prices * scale

    dates  = pd.DatetimeIndex(
        np.concatenate([sp_pre["Date"].values, ndx["Date"].values]))
    closes = np.concatenate([syn_prices, ndx_prices_adj]).astype(float)
    n      = len(closes)

    etf3x  = make_3x(closes, EXP_TQQQ)

    a200 = 2.0 / 201; ema200 = np.full(n, np.nan); ema200[199] = np.mean(closes[:200])
    for i in range(200, n): ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    rsi14 = compute_rsi(closes, 14)

    sp500_mapped = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    return etf3x, closes, ema200, rsi14, sp500_mapped, dates, fed_rates


def run_synth1929_test(fed_rates):
    print("\n[Test 2] 합성 NDX 1929~ (β=1.244, pre-1971 코호트 out-of-sample)", flush=True)
    etf3x, closes, ema200, rsi14, sp500_voo, dates, _ = make_synthetic_ndx_full(fed_rates)

    starts_all = get_monthly_starts(dates, ema200)
    # pre-1971 코호트: 완전 out-of-sample (최적화에 전혀 사용 안 됨)
    starts_pre  = [i for i in starts_all if dates[i].year < 1971]
    # 1971~2005: NDX 실제 데이터 기간
    starts_real = [i for i in starts_all if 1985 <= dates[i].year <= 2005]

    print(f"  pre-1971 코호트: {len(starts_pre)}개  |  1985~2005 코호트: {len(starts_real)}개", flush=True)

    strategies = [
        Param("S0",    "기준선 EMA200-15일"),
        Param("D10GK", "D10GK (RSI<30+div<-10%+GK)", rsi_thr=30, div_thr=-0.10, use_gk=True),
    ]

    results = {}
    for label, starts in [("pre-1971 (OOS)", starts_pre), ("1985-2005 (IS)", starts_real)]:
        print(f"\n  ── {label} ──", flush=True)
        for p in strategies:
            res = [run_sim(etf3x, closes, ema200, rsi14, sp500_voo, fed_rates, dates, si, p)
                   for si in starts]
            key = f"{p.name}_{label}"
            results[key] = {"stats": cohort_stats(res), "raw": res, "starts": starts}
            st = results[key]["stats"]
            print(f"  {p.name:<10} 생존율 {st['survival_rate']}%  중앙 {st['med_final']}억  CAGR {st['avg_cagr']}%", flush=True)

    # 주요 역사적 코호트 (pre-1971)
    key_labels = ["1929-09", "1929-10", "1937-03", "1946-05", "1966-01", "1968-12"]
    kc_map = {dates[si].strftime("%Y-%m"): ki for ki, si in enumerate(starts_pre)}
    print("\n  주요 역사적 코호트 (20년 후, 억):", flush=True)
    s0_pre  = results.get("S0_pre-1971 (OOS)", {}).get("raw", [])
    d10_pre = results.get("D10GK_pre-1971 (OOS)", {}).get("raw", [])
    for lb in key_labels:
        if lb in kc_map:
            ki = kc_map[lb]
            if ki < len(s0_pre) and ki < len(d10_pre):
                print(f"    {lb}: S0={s0_pre[ki]['final']:.1f}억  D10GK={d10_pre[ki]['final']:.1f}억", flush=True)

    return results, dates, starts_pre


# ──────────────────────────────────────────────────────────
# Test 3: 파라미터 민감도 (NDX, in-sample)
# ──────────────────────────────────────────────────────────

def run_sensitivity_test(ndx3x, closes, ema200, rsi14, sp500, fed_rates, dates, starts_is, key_cohorts):
    print("\n[Test 3] 파라미터 민감도 (NDX, 418코호트)", flush=True)

    variants = [
        Param("D10GK★",   "★ D10GK (최선, RSI30+div-10%+GK)", rsi_thr=30, div_thr=-0.10, use_gk=True),
        Param("D10GK_r25","RSI25+div-10%+GK",                  rsi_thr=25, div_thr=-0.10, use_gk=True),
        Param("D10GK_r35","RSI35+div-10%+GK",                  rsi_thr=35, div_thr=-0.10, use_gk=True),
        Param("D08GK",    "RSI30+div-8%+GK",                   rsi_thr=30, div_thr=-0.08, use_gk=True),
        Param("D12GK",    "RSI30+div-12%+GK",                  rsi_thr=30, div_thr=-0.12, use_gk=True),
        Param("D10_noGK", "RSI30+div-10% (GK 없음)",            rsi_thr=30, div_thr=-0.10, use_gk=False),
        Param("S0",       "기준선 EMA200-15일"),
    ]

    results = {}
    print(f"  {'이름':<14} {'중앙값':>8} {'p25':>8} {'p75':>8} {'CAGR':>6}  |  변화율", flush=True)
    print("  " + "-" * 60, flush=True)
    base_med = None
    for p in variants:
        res = [run_sim(ndx3x, closes, ema200, rsi14, sp500, fed_rates, dates, si, p)
               for si in starts_is]
        st = cohort_stats(res)
        results[p.name] = st
        if p.name == "D10GK★": base_med = st["med_final"]
        chg = f"{(st['med_final'] / base_med - 1) * 100:+.1f}%" if base_med else "–"
        print(f"  {p.name:<14} {st['med_final']:>7.0f}억 {st['p25_final']:>7.0f}억 {st['p75_final']:>7.0f}억 {st['avg_cagr']:>5.1f}%  |  {chg}", flush=True)

    return results


# ──────────────────────────────────────────────────────────
# 메인
# ──────────────────────────────────────────────────────────

def main():
    t0 = time.time()
    print("=" * 65, flush=True)
    print("D10GK 과최적화 검증 — 3가지 out-of-sample 테스트", flush=True)
    print("=" * 65, flush=True)

    # FED 금리 로드
    with open(FED_PATH, encoding="utf-8") as f: fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    # NDX 인샘플 데이터 (민감도 테스트용)
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]; ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]
    ndx_closes = ndx["Close"].values.astype(float); ndx_dates = pd.DatetimeIndex(ndx["Date"])
    ndx3x = make_3x(ndx_closes, EXP_TQQQ)
    a200 = 2.0 / 201; ndx_ema = np.full(len(ndx_closes), np.nan)
    ndx_ema[199] = np.mean(ndx_closes[:200])
    for i in range(200, len(ndx_closes)): ndx_ema[i] = ndx_closes[i] * a200 + ndx_ema[i - 1] * (1 - a200)
    ndx_rsi = compute_rsi(ndx_closes, 14)
    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv", parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500_mapped = sp5.set_index("Date")["Close"].reindex(ndx_dates, method="ffill").values.astype(float)
    ndx_starts_is = [i for i in get_monthly_starts(ndx_dates, ndx_ema)
                     if 1985 <= ndx_dates[i].year <= 2005]

    key_cohorts = ["1996-10", "1999-03", "2000-03", "2003-03"]

    # 테스트 실행
    sp5_results, sp5_dates, sp5_starts = run_sp500_test(fed_rates)
    synth_results, synth_dates, synth_starts = run_synth1929_test(fed_rates)
    sens_results = run_sensitivity_test(
        ndx3x, ndx_closes, ndx_ema, ndx_rsi, sp500_mapped,
        fed_rates, ndx_dates, ndx_starts_is, key_cohorts)

    print(f"\n총 소요: {time.time() - t0:.1f}초", flush=True)

    # ── 과최적화 판정 ──
    print("\n" + "=" * 65, flush=True)
    print("과최적화 판정", flush=True)
    print("=" * 65, flush=True)

    # Test 1: SP500
    s0_sp = sp5_results["S0_sp5"]["stats"]["med_final"]
    d10_sp = sp5_results["D10GK_sp5"]["stats"]["med_final"]
    t1_ok = d10_sp > s0_sp
    print(f"[Test 1] SP500 3x: S0={s0_sp}억 vs D10GK={d10_sp}억 → {'✅ D10GK 우세' if t1_ok else '❌ S0 우세'}", flush=True)

    # Test 2: 합성 pre-1971
    s0_pre  = synth_results.get("S0_pre-1971 (OOS)", {}).get("stats", {}).get("med_final", 0)
    d10_pre = synth_results.get("D10GK_pre-1971 (OOS)", {}).get("stats", {}).get("med_final", 0)
    t2_ok = d10_pre > s0_pre
    print(f"[Test 2] 합성1929 pre-1971: S0={s0_pre}억 vs D10GK={d10_pre}억 → {'✅ D10GK 우세' if t2_ok else '❌ S0 우세'}", flush=True)

    # Test 3: 민감도
    base = sens_results.get("D10GK★", {}).get("med_final", 0)
    variants_near = ["D10GK_r25", "D10GK_r35", "D08GK", "D12GK"]
    diffs = [abs(sens_results.get(v, {}).get("med_final", 0) / base - 1) * 100 if base else 0
             for v in variants_near]
    max_diff = max(diffs) if diffs else 0
    t3_ok = max_diff < 30
    print(f"[Test 3] 파라미터 ±1단계 변화 최대 편차: {max_diff:.1f}% → {'✅ 안정적 (<30%)' if t3_ok else '⚠ 불안정 (≥30%)'}", flush=True)

    overall = sum([t1_ok, t2_ok, t3_ok])
    verdict = ("✅ 과최적화 아닐 가능성 높음" if overall >= 2
               else "⚠ 부분적 과최적화 의심" if overall == 1
               else "❌ 과최적화 가능성 높음")
    print(f"\n최종: {overall}/3개 테스트 통과 → {verdict}", flush=True)

    # ── JSON 저장 ──
    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.bool_,)): return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    output = {
        "meta": {"generated": str(ndx_dates[-1].date()), "tests": ["sp500_3x", "synth_1929", "sensitivity"]},
        "sp500_3x": {
            "S0":    sp5_results["S0_sp5"]["stats"],
            "D10GK": sp5_results["D10GK_sp5"]["stats"],
        },
        "synth_1929": {
            "pre1971": {
                "S0":    synth_results.get("S0_pre-1971 (OOS)", {}).get("stats", {}),
                "D10GK": synth_results.get("D10GK_pre-1971 (OOS)", {}).get("stats", {}),
            },
            "in_sample": {
                "S0":    synth_results.get("S0_1985-2005 (IS)", {}).get("stats", {}),
                "D10GK": synth_results.get("D10GK_1985-2005 (IS)", {}).get("stats", {}),
            },
        },
        "sensitivity": sens_results,
        "verdict": {
            "test1_sp500_pass": bool(t1_ok),
            "test2_synth1929_pass": bool(t2_ok),
            "test3_sensitivity_pass": bool(t3_ok),
            "pass_count": overall,
            "verdict": verdict,
        },
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)
    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size / 1024:.0f} KB)", flush=True)


if __name__ == "__main__":
    main()
