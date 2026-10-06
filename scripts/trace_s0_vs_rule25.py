"""
trace_s0_vs_rule25.py — S0 vs RULE25 매매 패턴 비교
닷컴버블 상세 추적 + 전체 668 시작점 whipsaw 통계
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR = (_ROOT / "data")
FED_PATH = (_ROOT / "data/fed_funds_rate.json")

INITIAL     = 1_000_000_000
SIM_YEARS   = 20
TQQQ_EXP    = 0.0088
RP_SPREAD   = 0.004
RP_TAX_R    = 0.154
FEE_RATE    = 0.0007
TAX_RATE    = 0.22
DEDUCTION   = 2_500_000
DYN_RATES   = (0.003, 0.005, 0.007)
DYN_THRS    = (1_000_000_000, 2_000_000_000)
LIV_MAX     = 15_000_000
TIME_FILTER = 15

ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                  parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
mask = ndx["Date"] == pd.Timestamp("1985-10-01")
if mask.any():
    i = ndx.index[mask][0]
    ndx.loc[i:, "Close"] *= ndx.loc[i-1, "Close"] / ndx.loc[i, "Close"]

closes = ndx["Close"].values.astype(float)
dates  = pd.DatetimeIndex(ndx["Date"])
n      = len(closes)
ret    = np.diff(closes) / closes[:-1]
ret    = np.insert(ret, 0, 0.0)
f3     = (1.0 + ret * 3.0) * (1.0 - TQQQ_EXP / 252); f3[0] = 1.0
tqqq   = 100.0 * np.cumprod(f3)

a200 = 2.0 / 201
ema200 = np.full(n, np.nan)
ema200[199] = np.mean(closes[:200])
for i in range(200, n):
    ema200[i] = closes[i] * a200 + ema200[i-1] * (1 - a200)

trail_peaks = pd.Series(closes).rolling(252, min_periods=1).max().values

with open(FED_PATH, encoding="utf-8") as f:
    fed = json.load(f)
fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}


def get_monthly_starts():
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k); starts.append(i)
    return starts


def run_sim(start_idx, strategy='s0'):
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))
    e200_init  = ema200[start_idx]
    e200_valid = not np.isnan(e200_init) and e200_init > 0
    is_invested = not (e200_valid and closes[start_idx] < e200_init)
    tqqq_sh = (INITIAL / tqqq[start_idx]) if is_invested else 0.0
    cash    = 0.0 if is_invested else float(INITIAL)
    cash_res = 0.0; tax_res = 0.0; annual_g = 0.0
    last_tax_yr = -1; avg_cost = tqqq[start_idx]

    below_days = 0; above_days = 0
    last_mon = None; tday_in_mon = 0; mon_cap = 0.0
    trade_count = 0; events = []; last_buy_date = None

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n: break
        cur_date = dates[ci]
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        if cur_mon != last_mon:
            tday_in_mon = 0
            rp_mo = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 12.0
            if cash_res > 0: cash_res += cash_res * rp_mo * (1 - RP_TAX_R)
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_g - DEDUCTION) * TAX_RATE
                refund = tax_res - actual_tax
                if refund > 0: cash_res += refund
                tax_res = 0.0; annual_g = 0.0
            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year
            pv_c = tqqq_sh * tqqq[ci] if is_invested else cash
            total_c = pv_c + cash_res + tax_res
            base_r = (DYN_RATES[0] if total_c < DYN_THRS[0]
                      else DYN_RATES[1] if total_c < DYN_THRS[1]
                      else DYN_RATES[2])
            mon_cap = min(total_c * base_r, float(LIV_MAX))
            last_mon = cur_mon

        tday_in_mon += 1
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        div = (closes[ci] - e200) / e200 if e200ok else 0.0

        sell_sig = False; buy_sig = False

        if strategy == 's0':
            if e200ok:
                if div < 0: below_days += 1; above_days = 0
                elif div > 0: above_days += 1; below_days = 0
                else: below_days = above_days = 0
            sell_sig = e200ok and below_days >= TIME_FILTER
            buy_sig  = e200ok and above_days >= TIME_FILTER

        elif strategy == 'rule25':
            if e200ok:
                if div > 0: above_days += 1
                else:        above_days  = 0
            peak = trail_peaks[ci]
            sell_sig = is_invested and peak > 0 and closes[ci] < peak * 0.75
            buy_sig  = not is_invested and e200ok and above_days >= TIME_FILTER

        # 매도
        if is_invested and sell_sig:
            sv = tqqq_sh * tqqq[ci]; fee = sv * FEE_RATE
            cash = sv - fee; tqqq_sh = 0.0; is_invested = False
            trade_count += 1
            if strategy == 's0': below_days = 0
            elif strategy == 'rule25': above_days = 0
            days_held = (cur_date - last_buy_date).days if last_buy_date else None
            drop_str = (f"고점대비{(closes[ci]/trail_peaks[ci]-1)*100:.1f}%"
                        if strategy == 'rule25' else
                        f"이격도{div*100:.1f}%")
            events.append({'type': '매도', 'date': str(cur_date.date()),
                           'ndx': closes[ci], 'days_held': days_held,
                           'detail': drop_str})
            last_buy_date = None

        # 매수
        elif not is_invested and buy_sig:
            invest = cash; fee = invest * FEE_RATE; net = invest - fee
            tqqq_sh = net / tqqq[ci]; avg_cost = tqqq[ci]; cash = 0.0
            is_invested = True; trade_count += 1
            if strategy == 's0': above_days = 0
            elif strategy == 'rule25': above_days = 0
            events.append({'type': '매수', 'date': str(cur_date.date()),
                           'ndx': closes[ci],
                           'detail': f"이격도{div*100:+.1f}%"})
            last_buy_date = cur_date

        # 인출
        if tday_in_mon == 1 and j > 0:
            if is_invested:
                wd = min(mon_cap, tqqq_sh * tqqq[ci])
                if wd > 0:
                    tqqq_sh -= wd / tqqq[ci]
                    g = max(0.0, wd * (1 - avg_cost / tqqq[ci]))
                    annual_g += g; tax_res += g * TAX_RATE
                    cash_res += wd - g * TAX_RATE
                    cash_res -= min(mon_cap, cash_res)
            else:
                wd = min(mon_cap, cash + cash_res)
                if cash >= wd: cash -= wd
                else: cash = 0.0; cash_res -= max(0, wd - cash)

    pv_end = tqqq_sh * tqqq[start_idx + sim_len - 1] if is_invested else cash
    return events, trade_count, pv_end + cash_res


# ─────────────────────────────────────────────────────────
# 1. 닷컴버블 상세 비교
# ─────────────────────────────────────────────────────────
start_date = pd.Timestamp("2000-03-01")
start_idx  = next(i for i, d in enumerate(dates) if d >= start_date)

for strat, label in [('s0', 'S0 (EMA200 15일)'), ('rule25', 'RULE25 (트레일링 스탑 25%)')]:
    evs, tc, total_e = run_sim(start_idx, strat)
    print(f"\n【{label} — 닷컴버블 2000-03】")
    print(f"{'='*60}")
    print(f"{'유형':<5} {'날짜':<12} {'NDX':>7}  {'상세':>18}  {'보유기간':>8}")
    print(f"{'='*60}")
    for e in evs:
        if e['type'] == '매도':
            days_str = f"{e['days_held']}일 후" if e['days_held'] else "—"
            flag = " ★단기" if e['days_held'] and e['days_held'] < 30 else ""
            print(f"매도  {e['date']:<12} {e['ndx']:>7.0f}  {e['detail']:>18}  {days_str:>8}{flag}")
        else:
            print(f"매수  {e['date']:<12} {e['ndx']:>7.0f}  {e['detail']:>18}")
    print(f"총 거래: {tc}회 / 최종: {total_e/1e8:.1f}억")


# ─────────────────────────────────────────────────────────
# 2. 전체 668 시작점 — whipsaw 통계 비교
# ─────────────────────────────────────────────────────────
print(f"\n\n{'='*60}")
print(f"【전체 668 시작점 whipsaw 통계 비교】")
print(f"{'='*60}")

monthly_starts = get_monthly_starts()

for strat, label in [('s0', 'S0'), ('rule25', 'RULE25')]:
    all_hold = []; trade_cnts = []
    for s_idx in monthly_starts:
        evs, tc2, _ = run_sim(s_idx, strat)
        trade_cnts.append(tc2)
        sells = [e for e in evs if e['type'] == '매도' and e['days_held']]
        for s in sells:
            all_hold.append(s['days_held'])

    arr = np.array(all_hold) if all_hold else np.array([0])
    print(f"\n  [{label}]  전체 매도 {len(arr)}건 / 평균 {np.mean(trade_cnts):.1f}회/20년")
    print(f"    1일 이내 재매도 : {(arr<=1).sum():4d}건  ({(arr<=1).mean()*100:.1f}%)")
    print(f"    7일 이내 재매도 : {(arr<=7).sum():4d}건  ({(arr<=7).mean()*100:.1f}%)")
    print(f"   30일 이내 재매도 : {(arr<=30).sum():4d}건  ({(arr<=30).mean()*100:.1f}%)")
    print(f"  100일 이내 재매도 : {(arr<=100).sum():4d}건  ({(arr<=100).mean()*100:.1f}%)")
    print(f"   중앙값 보유기간  : {np.median(arr):.0f}일")


# ─────────────────────────────────────────────────────────
# 3. S0 — 왜 1일 재매도가 없는지 구조 설명
# ─────────────────────────────────────────────────────────
print(f"\n\n【S0 구조: 1일 재매도가 불가능한 이유】")
print(f"  매수 조건: EMA200 위 15일 연속 → 매수 시 above_days=0 리셋")
print(f"  매도 조건: EMA200 아래 15일 연속 → 매수 직후 NDX가 EMA200 위에 있으므로")
print(f"             below_days=0 상태, 최소 15거래일은 팔 수 없음")
print(f"  → 구조적으로 매수 후 최소 15거래일 보유 보장")
