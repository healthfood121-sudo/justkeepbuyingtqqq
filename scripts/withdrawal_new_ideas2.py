"""
withdrawal_new_ideas2.py

새로운 인출 아이디어 3가지 vs 현재 최선(D10GK) 비교
──────────────────────────────────────────────────────────────
S0:     기준선 — EMA200 15일, 동적인출 0.3/0.5/0.7%
D10GK:  현재 최선 — RSI<30 + 이격도<-10% + Guyton-Klinger

T15:    트레일링 스탑 -15%: NDX 52주 고점 대비 -15% → 즉시 매도
T20:    트레일링 스탑 -20%: NDX 52주 고점 대비 -20% → 즉시 매도
T25:    트레일링 스탑 -25%: NDX 52주 고점 대비 -25% → 즉시 매도
GRAD:   단계적 현금화 — 이격도 -5%→67%, -10%→33%, -15%→0%
DLEV:   자산 연동 레버리지 하향 — 50억 미만:TQQQ, 50~200억:50/50, 200억+:QQQ
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/mcv-nextjs/public/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_new_ideas2.json")

INITIAL    = 1_000_000_000
SIM_YEARS  = 20
EXP_3X     = 0.0088
EXP_1X     = 0.0020
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

# 단계적 현금화 구간 경계 (이격도 기준)
GRAD_DIVS   = [-0.05, -0.10, -0.15]         # 구간 경계
GRAD_RATIOS = [1.0, 0.67, 0.33, 0.0]        # 구간별 TQQQ 투자 비율

# 자산 연동 레버리지 구간
DLEV_THRS   = [5_000_000_000, 20_000_000_000]  # 50억, 200억
DLEV_RATIOS = [1.0, 0.5, 0.0]                  # TQQQ 비율 (50억↓, 50~200억, 200억+)


@dataclass
class Param:
    name: str
    desc: str
    trail_thr:    float = 0.0    # >0 이면 트레일링 스탑 사용 (52주 고점 대비 하락률)
    rsi_thr:      float = 999.0  # RSI 조기재진입 임계값 (999=미사용)
    div_thr:      float = -999.0 # RSI 조기재진입 이격도 하한
    use_gk:       bool  = False  # Guyton-Klinger 인출 규칙
    grad_hedge:   bool  = False  # 단계적 현금화 사용
    wealth_delev: bool  = False  # 자산 연동 레버리지 하향 사용


STRATEGIES = [
    Param("S0",    "기준선: EMA200-15일 + 동적인출"),
    Param("D10GK", "현재 최선: RSI<30+이격도<-10%+GK",    rsi_thr=30, div_thr=-0.10, use_gk=True),
    Param("T15",   "트레일링 스탑 -15%",                   trail_thr=0.15),
    Param("T20",   "트레일링 스탑 -20%",                   trail_thr=0.20),
    Param("T25",   "트레일링 스탑 -25%",                   trail_thr=0.25),
    Param("GRAD",  "단계적 현금화: 이격도 -5/-10/-15%",    grad_hedge=True),
    Param("DLEV",  "자산 연동 레버리지 하향",              wealth_delev=True),
]


# ═══════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════

def compute_rsi(closes, period=14):
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

    # NDX 3x (TQQQ)
    f3 = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    ndx3x = 100.0 * np.cumprod(f3)

    # NDX 1x (QQQ)
    f1 = (1.0 + ret) * (1.0 - EXP_1X / 252)
    f1[0] = 1.0
    qqq = 100.0 * np.cumprod(f1)

    # SP500 (VOO)
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

    # RSI(14)
    rsi14 = compute_rsi(closes, 14)

    # 트레일링 스탑용 52주(252거래일) 고점 사전 계산
    trail_peaks = pd.Series(closes).rolling(252, min_periods=1).max().values

    return ndx3x, qqq, closes, ema200, rsi14, trail_peaks, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ═══════════════════════════════════════════════════════════
# 시뮬레이션 코어
# ═══════════════════════════════════════════════════════════

def run_sim(ndx3x, qqq, closes, ema200, rsi14, trail_peaks,
            dates, sp500, fed_rates, start_idx: int, p: Param) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기 포지션 ──
    e200_init  = ema200[start_idx]
    e200_valid = not np.isnan(e200_init) and e200_init > 0
    if e200_valid and closes[start_idx] < e200_init:
        is_invested = False
        cash        = float(INITIAL)
        tqqq_sh     = 0.0
        qqq_sh      = 0.0
    else:
        is_invested = True
        tqqq_sh     = INITIAL / ndx3x[start_idx]
        qqq_sh      = 0.0
        cash        = 0.0

    avg_cost     = ndx3x[start_idx]
    qqq_avg      = qqq[start_idx]
    cash_reserve = 0.0
    tax_reserve  = 0.0
    annual_gain  = 0.0
    last_tax_yr  = -1
    cum_tax      = 0.0
    cum_fees     = 0.0
    cum_withdrawn= 0.0
    voo_sh       = 0.0
    voo_avg      = 0.0

    # GK 상태
    gk_mult          = 1.0
    gk_initial_cap   = 0.0
    gk_initialized   = False
    gk_port_yr_start = float(INITIAL)

    # 신호 카운터
    below_days   = 0
    above_days   = 0
    days_in_cash = 0

    # 단계적 현금화 상태 (GRAD)
    grad_tier = 0

    last_mon    = None
    tday_in_mon = 0
    mon_cap     = 0.0
    mon_used    = 0.0
    trade_count = 0
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

            # 연말 세금 + GK 조정
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0

                if p.use_gk and gk_initialized:
                    pv_now   = (tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]) if is_invested else cash
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
                pv_yr = (tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]) if is_invested else cash
                gk_port_yr_start = pv_yr + cash_reserve + voo_sh * sp500[ci]

            if voo_sh > 0:
                g = voo_sh * sp500[ci] * VOO_DIV_MO
                cum_tax      += g * DIV_TAX_R
                cash_reserve += g * (1 - DIV_TAX_R)

            # 인출 캡
            pv_c    = (tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]) if is_invested else cash
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            base_rate = (DYN_RATES[0] if total_c < DYN_THRS[0]
                         else DYN_RATES[1] if total_c < DYN_THRS[1]
                         else DYN_RATES[2])
            mon_cap = total_c * base_rate
            if p.use_gk:
                mon_cap *= gk_mult
            mon_cap = min(mon_cap, float(LIV_MAX))

            # ── 자산 연동 레버리지 리밸런싱 (월초) ──
            if p.wealth_delev and is_invested:
                pv_c2 = tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]
                if pv_c2 < DLEV_THRS[0]:
                    target_tqqq_r = DLEV_RATIOS[0]
                elif pv_c2 < DLEV_THRS[1]:
                    target_tqqq_r = DLEV_RATIOS[1]
                else:
                    target_tqqq_r = DLEV_RATIOS[2]

                if pv_c2 > 0:
                    cur_tqqq_r = (tqqq_sh * ndx3x[ci]) / pv_c2
                    if abs(cur_tqqq_r - target_tqqq_r) > 0.05:
                        fee = pv_c2 * FEE_RATE
                        cum_fees += fee
                        net = pv_c2 - fee
                        tqqq_sh  = (net * target_tqqq_r) / ndx3x[ci]
                        qqq_sh   = (net * (1 - target_tqqq_r)) / qqq[ci] if target_tqqq_r < 1.0 else 0.0
                        avg_cost = ndx3x[ci]
                        qqq_avg  = qqq[ci]
                        trade_count += 1

            last_mon = cur_mon

        tday_in_mon += 1

        if not is_invested:
            days_in_cash += 1

        # ═══ EMA200 신호 계산 ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        div    = 0.0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0:
                below_days += 1; above_days  = 0
            elif div > 0:
                above_days += 1; below_days  = 0
            else:
                below_days = above_days = 0

        sell_sig = False
        buy_sig  = False

        if p.trail_thr > 0:
            # 트레일링 스탑: 52주 고점 대비 하락
            peak = trail_peaks[ci]
            if is_invested and peak > 0 and closes[ci] < peak * (1 - p.trail_thr):
                sell_sig = True
            buy_sig = e200ok and above_days >= TIME_FILTER
        else:
            sell_sig = e200ok and below_days >= TIME_FILTER
            buy_sig  = e200ok and above_days >= TIME_FILTER

        # RSI 조기 재진입 (D10GK)
        if (not is_invested and not buy_sig and p.rsi_thr < 100 and e200ok):
            rsi_v = rsi14[ci]
            if not np.isnan(rsi_v) and rsi_v < p.rsi_thr:
                div_ok = (div <= p.div_thr) if p.div_thr > -900 else True
                if div_ok:
                    buy_sig = True

        # ═══ 단계적 현금화 (GRAD) — 이격도 구간 변경 시 리밸런싱 ═══
        already_handled = False
        if p.grad_hedge and is_invested and e200ok:
            new_tier = (0 if div > GRAD_DIVS[0] else
                        1 if div > GRAD_DIVS[1] else
                        2 if div > GRAD_DIVS[2] else 3)

            if new_tier != grad_tier:
                target_ratio = GRAD_RATIOS[new_tier]
                pv_tq = tqqq_sh * ndx3x[ci]
                total_inv = pv_tq + (cash if not is_invested else 0.0)

                if target_ratio < (pv_tq / (pv_tq + cash_reserve) if (pv_tq + cash_reserve) > 0 else 1.0):
                    # 매도 (일부 또는 전량)
                    pv_total_now = pv_tq + cash_reserve
                    target_tq_val = pv_total_now * target_ratio
                    sell_val = max(0.0, pv_tq - target_tq_val)

                    if sell_val > 0:
                        fee    = sell_val * FEE_RATE
                        cum_fees += fee
                        sh_s   = sell_val / ndx3x[ci]
                        gain   = max(0.0, sell_val - sh_s * avg_cost)
                        annual_gain += gain
                        tw     = gain * TAX_RATE
                        tax_reserve += tw
                        cash_reserve += sell_val - fee - tw
                        tqqq_sh = max(0.0, tqqq_sh - sh_s)
                        trade_count += 1

                elif target_ratio > (pv_tq / (pv_tq + cash_reserve) if (pv_tq + cash_reserve) > 0 else 1.0):
                    # 재매수 (현금 → TQQQ)
                    pv_total_now = pv_tq + cash_reserve
                    target_tq_val = pv_total_now * target_ratio
                    buy_val = min(target_tq_val - pv_tq, cash_reserve)
                    if buy_val > 0:
                        fee = buy_val * FEE_RATE
                        cum_fees += fee
                        tqqq_sh += (buy_val - fee) / ndx3x[ci]
                        cash_reserve -= buy_val
                        trade_count += 1

                grad_tier = new_tier

                # tier=3 → 완전 현금화, is_invested=False 전환
                if target_ratio == 0.0 and tqqq_sh * ndx3x[ci] > 0.01:
                    sv = tqqq_sh * ndx3x[ci]
                    fee = sv * FEE_RATE
                    cum_fees += fee
                    gain = max(0.0, sv - tqqq_sh * avg_cost)
                    annual_gain += gain
                    tw = gain * TAX_RATE
                    tax_reserve += tw
                    cash = sv - fee - tw
                    tqqq_sh = 0.0
                    is_invested   = False
                    below_days    = 0
                    days_in_cash  = 0
                    already_handled = True
                    sell_sig = False

        # ═══ 일반 매도 ═══
        if is_invested and sell_sig and not already_handled:
            sell_val = tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]
            fee      = sell_val * FEE_RATE
            cum_fees += fee
            cash        = sell_val - fee
            tqqq_sh     = 0.0
            qqq_sh      = 0.0
            is_invested = False
            trade_count += 1
            below_days  = 0
            days_in_cash= 0
            grad_tier   = 0

        # ═══ 일반 매수 ═══
        elif not is_invested and buy_sig:
            invest   = cash
            fee      = invest * FEE_RATE
            cum_fees += fee
            net      = invest - fee
            # DLEV: 진입 시에도 자산 비율 적용
            if p.wealth_delev:
                pv_guess = net
                if pv_guess < DLEV_THRS[0]:
                    t_r = DLEV_RATIOS[0]
                elif pv_guess < DLEV_THRS[1]:
                    t_r = DLEV_RATIOS[1]
                else:
                    t_r = DLEV_RATIOS[2]
                tqqq_sh = (net * t_r) / ndx3x[ci]
                qqq_sh  = (net * (1 - t_r)) / qqq[ci] if t_r < 1.0 else 0.0
                avg_cost = ndx3x[ci]
                qqq_avg  = qqq[ci]
            else:
                tqqq_sh  = net / ndx3x[ci]
                qqq_sh   = 0.0
                avg_cost = ndx3x[ci]
            cash        = 0.0
            is_invested = True
            trade_count += 1
            above_days  = 0
            days_in_cash= 0
            grad_tier   = 0

        # ═══ 월초 인출 ═══
        if tday_in_mon == 1 and j > 0:
            if is_invested:
                pv      = tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]
                wd_val  = min(mon_cap, pv)
                wd_left = wd_val
                total_after_tax = 0.0

                # TQQQ 먼저 인출
                if tqqq_sh > 0 and wd_left > 0:
                    from_t = min(wd_left, tqqq_sh * ndx3x[ci])
                    sh_t   = from_t / ndx3x[ci]
                    gain_t = max(0.0, from_t - sh_t * avg_cost)
                    annual_gain += gain_t
                    tw_t   = gain_t * TAX_RATE
                    tax_reserve += tw_t
                    total_after_tax += from_t - tw_t
                    tqqq_sh -= sh_t
                    wd_left -= from_t

                # QQQ 다음
                if qqq_sh > 0 and wd_left > 0:
                    from_q = min(wd_left, qqq_sh * qqq[ci])
                    sh_q   = from_q / qqq[ci]
                    gain_q = max(0.0, from_q - sh_q * qqq_avg)
                    annual_gain += gain_q
                    tw_q   = gain_q * TAX_RATE
                    tax_reserve += tw_q
                    total_after_tax += from_q - tw_q
                    qqq_sh -= sh_q

                remaining = max(0.0, mon_cap - mon_used)
                if total_after_tax >= remaining:
                    living        = remaining
                    cash_reserve += total_after_tax - living
                else:
                    from_res      = min(remaining - total_after_tax, cash_reserve)
                    cash_reserve -= from_res
                    living        = total_after_tax + from_res
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

        # RP 이자 (비투자 기간)
        if not is_invested:
            daily_r = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            if cash > 0:
                g = cash * daily_r
                cum_tax += g * RP_TAX_R
                cash    += g * (1 - RP_TAX_R)

        # VOO 편입 (총자산 20억+, 현금 36개월치 초과)
        if is_invested and cash_reserve > 0 and sp500[ci] > 0:
            pv2 = tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]
            ta2 = pv2 + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    bs = exc / sp500[ci]
                    voo_avg = ((voo_avg * voo_sh + sp500[ci] * bs)
                               / (voo_sh + bs)) if voo_sh > 0 else sp500[ci]
                    voo_sh       += bs
                    cash_reserve -= exc

        # 총자산 추적
        pv    = (tqqq_sh * ndx3x[ci] + qqq_sh * qqq[ci]) if is_invested else cash
        total = pv + cash_reserve + voo_sh * sp500[ci]
        if total < min_val:
            min_val = total
        if total <= 0:
            break

    # ── 최종값 ──
    ci_end  = min(start_idx + sim_len - 1, n - 1)
    pv_end  = (tqqq_sh * ndx3x[ci_end] + qqq_sh * qqq[ci_end]) if is_invested else cash
    final   = pv_end + cash_reserve + voo_sh * sp500[ci_end]

    actual_yr = sim_len / 252
    cagr = ((final / INITIAL) ** (1 / actual_yr) - 1) * 100 if actual_yr > 0 and final > 0 else -100.0
    if min_val == float('inf'):
        min_val = 0.0

    ongoing = (sim_len < int(SIM_YEARS * 252)) and (final > 0)

    return {
        "final":     round(final / 1e8, 2),
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "min":       round(min_val / 1e8, 4),
        "bankrupt":  bool(final <= 0),
        "cagr":      round(cagr, 2),
        "trades":    trade_count,
        "ongoing":   bool(ongoing),
        "actual_yr": round(actual_yr, 1),
    }


# ═══════════════════════════════════════════════════════════
# 병렬 실행
# ═══════════════════════════════════════════════════════════

_SHARED = {}


def _init_worker(ndx3x, qqq, closes, ema200, rsi14, trail_peaks,
                 dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'ndx3x': ndx3x, 'qqq': qqq, 'closes': closes,
        'ema200': ema200, 'rsi14': rsi14, 'trail_peaks': trail_peaks,
        'dates': pd.DatetimeIndex(dates_list),
        'sp500': sp500, 'fed_rates': fed_rates, 'starts': starts,
    })


def _run_one(p: Param):
    d = _SHARED
    results = [
        run_sim(d['ndx3x'], d['qqq'], d['closes'],
                d['ema200'], d['rsi14'], d['trail_peaks'],
                d['dates'], d['sp500'], d['fed_rates'], si, p)
        for si in d['starts']
    ]
    return (p.name, results)


def main():
    t0 = time.time()
    print("=" * 70, flush=True)
    print("새 인출 아이디어 2차: 트레일링스탑 / 단계적현금화 / 자산레버리지", flush=True)
    print("=" * 70, flush=True)

    ndx3x, qqq, closes, ema200, rsi14, trail_peaks, \
        dates, sp500, fed_rates = load_data()

    starts = list(get_monthly_starts(dates))  # 1971-01부터 현재까지 모든 월별 시작점

    print(f"시작점: {len(starts)}개  전략: {len(STRATEGIES)}개", flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(ndx3x, qqq, closes, ema200, rsi14, trail_peaks,
                  dates.tolist(), sp500, fed_rates, starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)

    print(f"완료 ({time.time() - t0:.1f}s)\n", flush=True)

    KEY_COHORTS = ["1996-10", "1999-03", "2000-03", "2003-03", "2007-10", "2009-03"]

    summary_rows = []
    cohort_rows  = []

    for pname, results in raw:
        p     = next(x for x in STRATEGIES if x.name == pname)
        total   = len(results)
        # 20년 완료 코호트만 summary 통계에 사용 (ongoing 제외)
        done    = [r for r in results if not r["ongoing"] and not r["bankrupt"]]
        bankrupt= sum(1 for r in results if r["bankrupt"] and not r["ongoing"])
        n_done  = len(done) + bankrupt
        finals  = [r["final"]     for r in done]
        withds  = [r["withdrawn"] for r in done]
        mins    = [r["min"]       for r in done]
        cagrs   = [r["cagr"]      for r in done]
        trades  = [r["trades"]    for r in done]
        ongoing_cnt = sum(1 for r in results if r["ongoing"])

        sf   = sorted(finals)
        nf   = len(sf)
        surv = (n_done - bankrupt) / n_done * 100 if n_done > 0 else 100.0

        summary_rows.append({
            "name":          pname,
            "desc":          p.desc,
            "survival_rate": round(surv, 1),
            "med_final":     round(sf[nf // 2]        if nf else 0.0, 1),
            "avg_final":     round(sum(sf) / nf        if nf else 0.0, 1),
            "p25_final":     round(sf[nf // 4]         if nf else 0.0, 1),
            "p75_final":     round(sf[3 * nf // 4]     if nf else 0.0, 1),
            "avg_withdrawn": round(sum(withds) / len(withds) if withds else 0.0, 2),
            "min_of_min":    round(min(mins)            if mins  else 0.0, 4),
            "avg_cagr":      round(sum(cagrs) / len(cagrs) if cagrs else 0.0, 2),
            "avg_trades":    round(sum(trades) / len(trades) if trades else 0.0, 1),
            "n_completed":   n_done,
            "n_ongoing":     ongoing_cnt,
        })

    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    strategy_results = {pname: results for pname, results in raw}
    for ki, si in enumerate(starts):
        label = dates[si].strftime("%Y-%m")
        row   = {"start": label}
        for p in STRATEGIES:
            r = strategy_results[p.name][ki]
            row[p.name] = {
                "final":     r["final"],
                "cagr":      r["cagr"],
                "min":       r["min"],
                "bankrupt":  r["bankrupt"],
                "trades":    r["trades"],
                "ongoing":   r["ongoing"],
                "actual_yr": r["actual_yr"],
            }
        cohort_rows.append(row)

    # 콘솔 출력
    print(f"{'이름':<7} {'설명':<44} {'생존율':>6} {'중앙':>8} {'CAGR':>6} {'거래':>5} {'완료':>5} {'진행중':>5}", flush=True)
    print("-" * 88, flush=True)
    for row in summary_rows:
        tag = "★ " if row["name"] == summary_rows[0]["name"] else "  "
        print(f"{tag}{row['name']:<5} {row['desc']:<44} "
              f"{row['survival_rate']:>5.1f}% "
              f"{row['med_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}% "
              f"{row['avg_trades']:>4.0f}회 "
              f"{row['n_completed']:>5}개 "
              f"{row['n_ongoing']:>5}개", flush=True)

    print("\n주요 코호트 (20년 후, 억):", flush=True)
    names = [p.name for p in STRATEGIES]
    print(f"{'코호트':<10}" + "".join(f"{n:>9}" for n in names), flush=True)
    print("-" * (10 + 9 * len(names)), flush=True)
    cohort_dict = {r["start"]: r for r in cohort_rows}
    for label in KEY_COHORTS:
        if label in cohort_dict:
            row_s = f"{label:<10}" + "".join(
                f"{cohort_dict[label][n]['final']:>8.1f}억" for n in names)
            print(row_s, flush=True)

    # JSON 저장
    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, np.bool_):    return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    out = {
        "meta": {
            "generated":  str(dates[-1].date()),
            "sim_years":  SIM_YEARS,
            "n_cohorts":  len(starts),
            "strategies": [{"name": p.name, "desc": p.desc} for p in STRATEGIES],
        },
        "summary":  summary_rows,
        "cohorts":  cohort_rows,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size / 1024:.0f} KB)", flush=True)
    print(f"소요: {time.time() - t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
