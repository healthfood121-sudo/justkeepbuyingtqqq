"""
withdrawal_sp500_overfit.py

D10GK 과최적화 검증 — SP500 3x 전체 기간 테스트
────────────────────────────────────────────────────────────────
D10GK (일봉RSI<30 + 이격도<-10% + GK)는 NDX 1985~2005 코호트에서 최적화됐다.
SP500 3x에 동일한 전략을 적용하되, 1985년 이전 완전 OOS 구간까지 포함해서 검증한다.

기존 overfit_check.py Test 1은 1985~2005 코호트(252개)만 비교.
이 스크립트는 전체 가용 코호트(~900개, 1950~2005)를 시대별로 분석한다.

시대 구분:
  - pre-1985 (OOS):  NDX 최적화 기간 이전 → 완전 out-of-sample
  - 1985~2005 (IS):  NDX 최적화와 동기간 → in-sample 비교
"""

import json, time
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/mcv-nextjs/public/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_sp500_overfit.json")

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_SPXL   = 0.0091   # SPXL (SP500 3x ETF)
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


from dataclasses import dataclass

@dataclass
class Param:
    name: str
    desc: str
    rsi_thr: float = 999.0
    div_thr: float = -999.0
    use_gk: bool   = False


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
            sv = shares * etf3x[ci]; fe = sv * FEE_RATE
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
            "bankrupt": bool(final <= 0), "trades": tc}


def get_monthly_starts(dates, ema200):
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
        "n": total,
        "survival_rate": round(surv, 1),
        "med_final":  round(finals[nf // 2]    if nf else 0.0, 1),
        "avg_final":  round(sum(finals) / nf   if nf else 0.0, 1),
        "p25_final":  round(finals[nf // 4]    if nf else 0.0, 1),
        "p75_final":  round(finals[3*nf // 4]  if nf else 0.0, 1),
        "avg_cagr":   round(sum(cagrs) / len(cagrs)   if cagrs  else 0.0, 2),
        "avg_trades": round(sum(trades) / len(trades)  if trades else 0.0, 1),
    }


def main():
    t0 = time.time()
    print("=" * 65, flush=True)
    print("D10GK 과최적화 검증 — SP500 3x 전체 기간", flush=True)
    print("=" * 65, flush=True)

    with open(FED_PATH, encoding="utf-8") as f: fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    # SP500 데이터 로드 (1950 이후)
    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp5 = sp5[sp5["Date"] >= "1950-01-01"].reset_index(drop=True)

    closes = sp5["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(sp5["Date"])
    n      = len(closes)
    etf3x  = make_3x(closes, EXP_SPXL)

    a200 = 2.0 / 201; ema200 = np.full(n, np.nan); ema200[199] = np.mean(closes[:200])
    for i in range(200, n): ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)
    rsi14 = compute_rsi(closes, 14)
    sp500_voo = closes.copy()   # VOO 역할 (배당 단순화)

    all_starts = get_monthly_starts(dates, ema200)
    # 시대 구분
    starts_oos  = [i for i in all_starts if dates[i].year < 1985]          # 완전 OOS
    starts_is   = [i for i in all_starts if 1985 <= dates[i].year <= 2005] # NDX 동기간
    starts_all  = [i for i in all_starts if dates[i].year <= 2005]         # 전체

    print(f"전체 코호트: {len(starts_all)}개", flush=True)
    print(f"  pre-1985 (OOS): {len(starts_oos)}개", flush=True)
    print(f"  1985~2005 (IS): {len(starts_is)}개", flush=True)

    strategies = [
        Param("S0",    "기준선 EMA200-15일"),
        Param("D10GK", "D10GK (RSI<30+div<-10%+GK)", rsi_thr=30, div_thr=-0.10, use_gk=True),
    ]

    output_eras = {}

    for era_label, era_starts in [
        ("전체 (OOS+IS)", starts_all),
        ("pre-1985 (OOS)", starts_oos),
        ("1985~2005 (IS)", starts_is),
    ]:
        print(f"\n── {era_label} ({len(era_starts)}개 코호트) ──", flush=True)
        era_res = {}
        for p in strategies:
            res = [run_sim(etf3x, closes, ema200, rsi14, sp500_voo,
                           fed_rates, dates, si, p) for si in era_starts]
            era_res[p.name] = {"stats": cohort_stats(res), "raw": res}
            st = era_res[p.name]["stats"]
            mark = "✅" if p.name == "D10GK" and st["med_final"] > era_res.get("S0", {}).get("stats", {}).get("med_final", 0) else ""
            print(f"  {p.name:<8} 생존율 {st['survival_rate']}%  중앙 {st['med_final']:>7.1f}억  "
                  f"CAGR {st['avg_cagr']}%  거래 {st['avg_trades']:.0f}회  {mark}", flush=True)

        # D10GK vs S0 승/패 집계
        d10_wins = sum(1 for k, (r0, r1) in enumerate(
            zip(era_res["S0"]["raw"], era_res["D10GK"]["raw"]))
            if r1["final"] > r0["final"])
        total_e = len(era_starts)
        print(f"  D10GK 승: {d10_wins}/{total_e} ({d10_wins/total_e*100:.1f}%)", flush=True)

        output_eras[era_label] = {
            k: {"stats": v["stats"]} for k, v in era_res.items()
        }

    # 주요 역사적 코호트 (SP500 기준)
    key_labels = [
        "1962-06",  # 쿠바 위기 하락
        "1966-01",  # 대형 조정
        "1968-12",  # 베트남/인플레 고점
        "1973-01",  # 1차 오일쇼크
        "1980-01",  # 2차 오일쇼크/고금리
        "1987-08",  # 블랙먼데이 직전
        "1990-06",  # 걸프전 조정
        "1996-10",  # 닷컴 버블 상승 중
        "1999-03",  # 버블 정점 직전
        "2000-03",  # 버블 정점
        "2003-03",  # 버블 붕괴 이후
    ]

    all_starts_is = starts_is
    kc_map_is = {dates[si].strftime("%Y-%m"): ki for ki, si in enumerate(all_starts_is)}
    all_starts_oos_list = starts_oos
    kc_map_oos = {dates[si].strftime("%Y-%m"): ki for ki, si in enumerate(all_starts_oos_list)}

    print("\n── 주요 코호트 상세 (SP500 3x, 20년 후 억) ──", flush=True)
    print(f"  {'코호트':<10} {'구간':<12} {'S0':>8} {'D10GK':>8} {'승자'}", flush=True)
    print("  " + "-" * 48, flush=True)

    # 두 era의 raw 결과 다시 계산
    raw_oos = {p.name: [] for p in strategies}
    raw_is  = {p.name: [] for p in strategies}
    for p in strategies:
        raw_oos[p.name] = [run_sim(etf3x, closes, ema200, rsi14, sp500_voo,
                                    fed_rates, dates, si, p) for si in starts_oos]
        raw_is[p.name]  = [run_sim(etf3x, closes, ema200, rsi14, sp500_voo,
                                    fed_rates, dates, si, p) for si in starts_is]

    key_rows = []
    for lb in key_labels:
        if lb in kc_map_oos:
            ki = kc_map_oos[lb]
            r0 = raw_oos["S0"][ki]; r1 = raw_oos["D10GK"][ki]
            winner = "D10GK ✅" if r1["final"] > r0["final"] else "S0"
            print(f"  {lb:<10} {'pre-1985':<12} {r0['final']:>7.1f} {r1['final']:>7.1f}  {winner}", flush=True)
            key_rows.append({"date": lb, "era": "pre-1985", "S0": r0["final"], "D10GK": r1["final"]})
        elif lb in kc_map_is:
            ki = kc_map_is[lb]
            r0 = raw_is["S0"][ki]; r1 = raw_is["D10GK"][ki]
            winner = "D10GK ✅" if r1["final"] > r0["final"] else "S0"
            print(f"  {lb:<10} {'1985~2005':<12} {r0['final']:>7.1f} {r1['final']:>7.1f}  {winner}", flush=True)
            key_rows.append({"date": lb, "era": "1985~2005", "S0": r0["final"], "D10GK": r1["final"]})

    # 판정
    s0_all   = output_eras["전체 (OOS+IS)"]["S0"]["stats"]["med_final"]
    d10_all  = output_eras["전체 (OOS+IS)"]["D10GK"]["stats"]["med_final"]
    s0_oos   = output_eras["pre-1985 (OOS)"]["S0"]["stats"]["med_final"]
    d10_oos  = output_eras["pre-1985 (OOS)"]["D10GK"]["stats"]["med_final"]
    s0_is    = output_eras["1985~2005 (IS)"]["S0"]["stats"]["med_final"]
    d10_is   = output_eras["1985~2005 (IS)"]["D10GK"]["stats"]["med_final"]

    print(f"\n총 소요: {time.time() - t0:.1f}초", flush=True)
    print("\n" + "=" * 65, flush=True)
    print("SP500 3x 과최적화 판정", flush=True)
    print("=" * 65, flush=True)
    print(f"전체 코호트:    S0={s0_all}억  D10GK={d10_all}억  → {'✅ D10GK 우세' if d10_all > s0_all else '❌ S0 우세'}", flush=True)
    print(f"pre-1985 OOS:  S0={s0_oos}억  D10GK={d10_oos}억  → {'✅ D10GK 우세' if d10_oos > s0_oos else '❌ S0 우세'}", flush=True)
    print(f"1985~2005 IS:  S0={s0_is}억   D10GK={d10_is}억  → {'✅ D10GK 우세' if d10_is > s0_is else '❌ S0 우세'}", flush=True)

    # JSON 저장
    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.bool_,)): return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    output = {
        "meta": {"generated": str(dates[-1].date()), "desc": "SP500 3x D10GK vs S0 전체 기간 검증"},
        "eras": output_eras,
        "key_cohorts": key_rows,
        "verdict": {
            "all_pass": bool(d10_all > s0_all),
            "oos_pass": bool(d10_oos > s0_oos),
            "is_pass":  bool(d10_is  > s0_is),
        },
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)
    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size / 1024:.0f} KB)", flush=True)


if __name__ == "__main__":
    main()
