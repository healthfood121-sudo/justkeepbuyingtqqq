"""
trace_d10gk_dotcom.py — 닷컴버블 구간(2000-03) D10GK 매매 추적
매도/매수가 몇 번 일어났는지, 각 타이밍에 자산은 얼마였는지 출력
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
TAX_RATE    = 0.22
DEDUCTION   = 2_500_000
RP_SPREAD   = 0.004
RP_TAX_R    = 0.154
FEE_RATE    = 0.0007
DYN_RATES   = (0.003, 0.005, 0.007)
DYN_THRS    = (1_000_000_000, 2_000_000_000)
LIV_MAX     = 15_000_000
TIME_FILTER = 15
RSI_THR     = 30
DIV_THR     = -0.10   # D10GK 이격도 조건

# ── 데이터 로드 ──────────────────────────────────
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

f3   = (1.0 + ret * 3.0) * (1.0 - TQQQ_EXP / 252)
f3[0] = 1.0
tqqq = 100.0 * np.cumprod(f3)

a200   = 2.0 / 201
ema200 = np.full(n, np.nan)
ema200[199] = np.mean(closes[:200])
for i in range(200, n):
    ema200[i] = closes[i] * a200 + ema200[i-1] * (1 - a200)

rsi14  = np.full(n, np.nan)
deltas = np.diff(closes)
gains  = np.where(deltas > 0, deltas, 0.0)
losses = np.where(deltas < 0, -deltas, 0.0)
ag = float(np.mean(gains[:14]))
al = float(np.mean(losses[:14]))
for i in range(14, n - 1):
    ag = (ag * 13 + gains[i]) / 14
    al = (al * 13 + losses[i]) / 14
    rsi14[i+1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)

with open(FED_PATH, encoding="utf-8") as f:
    fed = json.load(f)
fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

# ── 시작점 찾기 (2000-03) ──────────────────────────
start_date = pd.Timestamp("2000-03-01")
start_idx  = None
for i, d in enumerate(dates):
    if d >= start_date:
        start_idx = i
        break

print(f"시작일: {dates[start_idx].date()} / NDX={closes[start_idx]:.1f} / EMA200={ema200[start_idx]:.1f}\n")

# ── 시뮬레이션 ────────────────────────────────────
sim_len = min(n - start_idx, int(SIM_YEARS * 252))

is_invested = True  # 2000-03은 EMA200 위에서 시작
tqqq_sh     = INITIAL / tqqq[start_idx]
cash        = 0.0
cash_reserve = 0.0
tax_reserve  = 0.0
annual_gain  = 0.0
last_tax_yr  = -1
cum_withdrawn = 0.0
gk_mult      = 1.0
gk_initial_cap = 0.0
gk_initialized = False
gk_port_yr_start = float(INITIAL)

below_days = 0
above_days = 0
last_mon   = None
tday_in_mon = 0
mon_cap    = 0.0
mon_used   = 0.0
trade_count = 0

events = []  # 매매 이벤트 기록

for j in range(sim_len):
    ci = start_idx + j
    if ci >= n:
        break

    cur_date = dates[ci]
    cur_mon  = (cur_date.year, cur_date.month)
    mon_key  = cur_date.strftime("%Y-%m")

    # 월초 처리
    if cur_mon != last_mon:
        tday_in_mon = 0
        mon_used    = 0.0
        annual_rate = fed_rates.get(mon_key, 3.0)
        rp_mo = max(0.0, annual_rate / 100.0 - RP_SPREAD) / 12.0
        if cash_reserve > 0:
            g = cash_reserve * rp_mo
            cash_reserve += g * (1 - RP_TAX_R)
        if tax_reserve > 0:
            g = tax_reserve * rp_mo
            cash_reserve += g * (1 - RP_TAX_R)

        if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
            actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
            refund = tax_reserve - actual_tax
            if refund > 0:
                cash_reserve += refund
            tax_reserve = 0.0
            annual_gain = 0.0

            if gk_initialized:
                pv_now   = tqqq_sh * tqqq[ci] if is_invested else cash
                port_now = pv_now + cash_reserve
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

        pv_c    = tqqq_sh * tqqq[ci] if is_invested else cash
        total_c = pv_c + cash_reserve + tax_reserve
        base_rate = (DYN_RATES[0] if total_c < DYN_THRS[0]
                     else DYN_RATES[1] if total_c < DYN_THRS[1]
                     else DYN_RATES[2])
        mon_cap = min(total_c * base_rate * gk_mult, float(LIV_MAX))

        if not gk_initialized:
            gk_initial_cap = mon_cap
            gk_initialized = True

        last_mon = cur_mon

    tday_in_mon += 1

    # 신호 생성
    e200   = ema200[ci]
    e200ok = not np.isnan(e200) and e200 > 0
    sell_sig = False
    buy_sig  = False

    if e200ok:
        div = (closes[ci] - e200) / e200
        if div < 0:
            below_days += 1; above_days = 0
        elif div > 0:
            above_days += 1; below_days = 0
        else:
            below_days = above_days = 0

    sell_sig = e200ok and below_days >= TIME_FILTER
    buy_sig  = e200ok and above_days >= TIME_FILTER

    # D10GK 조기 재진입: RSI<30 AND 이격도<-10%
    if not is_invested:
        rsi_v = rsi14[ci]
        e200v = ema200[ci]
        if (not np.isnan(rsi_v) and rsi_v < RSI_THR
                and e200ok and (closes[ci] - e200v) / e200v < DIV_THR):
            buy_sig = True

    # 자산 계산
    pv    = tqqq_sh * tqqq[ci] if is_invested else cash
    total = pv + cash_reserve + tax_reserve

    # 매도
    if is_invested and sell_sig:
        sell_val = tqqq_sh * tqqq[ci]
        fee      = sell_val * FEE_RATE
        cash     = sell_val - fee
        tqqq_sh  = 0.0
        is_invested  = False
        trade_count += 1
        below_days   = 0
        e200v        = ema200[ci]
        div_pct      = (closes[ci] - e200v) / e200v * 100 if e200ok else 0
        events.append({
            'no': trade_count,
            'type': '매도',
            'date': str(cur_date.date()),
            'ndx': closes[ci],
            'ema200': e200v,
            'div_pct': div_pct,
            'rsi': rsi14[ci],
            'total_before': total / 1e8,
            'cash_after': cash / 1e8,
        })

    # 매수
    elif not is_invested and buy_sig:
        invest  = cash
        fee     = invest * FEE_RATE
        net     = invest - fee
        tqqq_sh = net / tqqq[ci]
        cash    = 0.0
        is_invested  = True
        trade_count += 1
        above_days   = 0
        e200v        = ema200[ci]
        div_pct      = (closes[ci] - e200v) / e200v * 100 if e200ok else 0
        rsi_v        = rsi14[ci]
        trigger      = 'RSI조기' if (not np.isnan(rsi_v) and rsi_v < RSI_THR
                                      and div_pct / 100 < DIV_THR) else 'EMA200복귀'
        events.append({
            'no': trade_count,
            'type': f'매수({trigger})',
            'date': str(cur_date.date()),
            'ndx': closes[ci],
            'ema200': e200v,
            'div_pct': div_pct,
            'rsi': rsi_v,
            'total_before': (net + cash_reserve) / 1e8,
            'cash_after': 0,
        })

    # 월 인출
    if tday_in_mon == 1 and mon_used < mon_cap:
        withdraw = min(mon_cap - mon_used, mon_cap)
        withdraw = min(withdraw, total * 0.95)
        if withdraw > 0:
            if is_invested:
                sell_w   = withdraw
                gain_w   = sell_w * max(0.0, 1.0 - tqqq[start_idx] / tqqq[ci])
                tax_w    = gain_w * TAX_RATE * 0.5
                tax_reserve += tax_w
                annual_gain += gain_w
                tqqq_sh  -= sell_w / tqqq[ci]
                if tqqq_sh < 0: tqqq_sh = 0
            else:
                if cash >= withdraw:
                    cash -= withdraw
                    cash_reserve -= max(0, withdraw - cash_reserve)
                else:
                    withdraw = cash
                    cash = 0.0
            mon_used     += withdraw
            cum_withdrawn += withdraw

# ── 결과 출력 ─────────────────────────────────────
print(f"{'='*70}")
print(f"{'번호':>4} {'유형':<16} {'날짜':<12} {'NDX':>8} {'이격도':>7} {'RSI':>6} {'자산(억)':>10}")
print(f"{'='*70}")
for e in events:
    rsi_str = f"{e['rsi']:.1f}" if not (isinstance(e['rsi'], float) and np.isnan(e['rsi'])) else "N/A"
    print(f"{e['no']:>4} {e['type']:<16} {e['date']:<12} {e['ndx']:>8.1f} {e['div_pct']:>6.1f}% {rsi_str:>6} {e['total_before']:>9.1f}억")

print(f"\n총 매매 횟수: {trade_count}회")
pv_end = tqqq_sh * tqqq[start_idx + sim_len - 1] if is_invested else cash
total_end = pv_end + cash_reserve
print(f"최종 자산: {total_end / 1e8:.1f}억")
print(f"총 인출: {cum_withdrawn / 1e8:.1f}억")

# 매도-매수 사이클 분석
sell_events = [e for e in events if e['type'] == '매도']
buy_events  = [e for e in events if '매수' in e['type']]
print(f"\n매도 {len(sell_events)}회, 매수 {len(buy_events)}회")

# 재진입 후 빠른 재매도 탐지
pairs = list(zip(buy_events, sell_events[1:] if len(sell_events) > 1 else []))
for b, s in pairs:
    from datetime import datetime
    bd = datetime.strptime(b['date'], "%Y-%m-%d")
    sd = datetime.strptime(s['date'], "%Y-%m-%d")
    days = (sd - bd).days
    print(f"  매수 {b['date']} → 재매도 {s['date']} ({days}일 후) | 매수유형: {b['type']}")
