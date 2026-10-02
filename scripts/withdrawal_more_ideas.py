"""
withdrawal_more_ideas.py

추가 아이디어 6가지 vs D10GK(현재 최선) 비교
──────────────────────────────────────────────────────────────
M0: D10GK 기준선  — EMA200-15일 + RSI<30 & 이격도<-10% + GK인출
M1: ATH -30% 단독 — 전고점 대비 30% 이상 하락 시 매도 (EMA200 대신)
M2: ATH -25% OR  — ATH -25% 또는 EMA200-15일 중 하나라도 해당
M3: ATH -30% AND — ATH -30% AND EMA200-15일 둘 다 충족 (보수적)
M4: QLD 헤지     — 매도 시 현금 대신 QLD(2배 레버리지) 보유
M5: 의무보유 63일 — RSI 재진입 후 63거래일 동안 매도 신호 무시
M6: -50% 인출중단 — NDX 전고점 -50% 이하면 생활비 인출 0
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/mcv-nextjs/public/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_more_ideas.json")

INITIAL     = 1_000_000_000
SIM_YEARS   = 20
EXP_TQQQ    = 0.0088
EXP_QLD     = 0.0086
LIV_MAX     = 15_000_000
TAX_RATE    = 0.22
DEDUCTION   = 2_500_000
RP_SPREAD   = 0.004
RP_TAX_R    = 0.154
FEE_RATE    = 0.0007
VOO_DIV_MO  = 0.013 / 12
DIV_TAX_R   = 0.154
DYN_RATES   = (0.003, 0.005, 0.007)
DYN_THRS    = (1_000_000_000, 2_000_000_000)
TIME_FILTER = 15    # EMA200 연속일 필터
RSI_THR     = 30    # RSI 조기 재진입 임계값
DIV_THR     = -0.10 # 이격도 필터 (EMA200 대비 -10%)


@dataclass
class Param:
    name:      str
    desc:      str
    sell_mode: str   = 'ema200'   # 'ema200' | 'ath_only' | 'ath_or_ema' | 'ath_and_ema'
    ath_thr:   float = -0.30      # ATH 드로다운 임계값 (음수)
    qld_hedge: bool  = False      # True: 매도 시 현금 대신 QLD(2배) 보유
    lock_days: int   = 0          # RSI 재진입 후 매도 금지 기간 (거래일)
    stop_ath:  float = -999.0     # 이 ATH 드로다운 이하면 인출 0 (-999=미사용)


STRATEGIES = [
    Param("M0", "D10GK 기준선: EMA200-15일 + RSI<30 & 이격도<-10% + GK"),
    Param("M1", "ATH -30% 단독 매도 신호",               sell_mode='ath_only',    ath_thr=-0.30),
    Param("M2", "ATH -25% OR EMA200-15일 매도",          sell_mode='ath_or_ema',  ath_thr=-0.25),
    Param("M3", "ATH -30% AND EMA200-15일 매도 (보수적)", sell_mode='ath_and_ema', ath_thr=-0.30),
    Param("M4", "QLD 헤지: 매도 시 현금 대신 QLD(2배)",  qld_hedge=True),
    Param("M5", "의무 보유 63일: RSI 재진입 후 매도 금지", lock_days=63),
    Param("M6", "ATH -50% 이하면 인출 중단",              stop_ath=-0.50),
]


# ═══════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════

def compute_rsi14(closes):
    n      = len(closes)
    rsi    = np.full(n, np.nan)
    deltas = np.diff(closes)
    gains  = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    if n <= 15:
        return rsi
    ag = float(np.mean(gains[:14]))
    al = float(np.mean(losses[:14]))
    for i in range(14, n - 1):
        ag = (ag * 13 + gains[i]) / 14
        al = (al * 13 + losses[i]) / 14
        rsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)
    return rsi


def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    # 1985-10-01 스플라이스 보정
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    ret = np.diff(closes) / closes[:-1]
    ret = np.insert(ret, 0, 0.0)

    # TQQQ (3x NDX)
    f3       = (1.0 + ret * 3.0) * (1.0 - EXP_TQQQ / 252)
    f3[0]    = 1.0
    ndx3x    = 100.0 * np.cumprod(f3)

    # QLD (2x NDX)
    f2       = (1.0 + ret * 2.0) * (1.0 - EXP_QLD / 252)
    f2[0]    = 1.0
    ndx2x    = 100.0 * np.cumprod(f2)

    # SP500
    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    # Fed funds rate
    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    # EMA200
    a200     = 2.0 / 201
    ema200   = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    # RSI14
    rsi14 = compute_rsi14(closes)

    return ndx3x, ndx2x, closes, ema200, rsi14, dates, sp500, fed_rates


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

def run_sim(ndx3x, ndx2x, closes, ema200, rsi14, dates, sp500, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기 포지션 ──
    ma_init  = ema200[start_idx]
    ma_valid = not np.isnan(ma_init) and ma_init > 0

    if ma_valid and closes[start_idx] < ma_init:
        shares  = 0.0
        qld_sh  = 0.0
        cash    = float(INITIAL)
    else:
        shares  = INITIAL / ndx3x[start_idx]
        qld_sh  = 0.0
        cash    = 0.0

    avg_cost     = ndx3x[start_idx]
    qld_avg      = ndx2x[start_idx]
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
    below_days  = 0
    above_days  = 0
    days_in_cash= 0

    # ATH 추적 (NDX 기준)
    ath = closes[start_idx]

    # 의무 보유 잠금 (M5): j < lock_until 이면 매도 금지
    lock_until = -1

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

        # 상태 플래그
        is_tqqq = shares > 0
        is_qld  = qld_sh > 0
        is_cash = not is_tqqq and not is_qld

        # ATH 업데이트
        if closes[ci] > ath:
            ath = closes[ci]
        ath_dd = (closes[ci] - ath) / ath   # 항상 <= 0

        # ═══ 월초 처리 ═══
        if cur_mon != last_mon:
            tday_in_mon = 0
            mon_used    = 0.0

            annual_rate = fed_rates.get(mon_key, 3.0)
            rp_mo = max(0.0, annual_rate / 100.0 - RP_SPREAD) / 12.0

            # 예비 현금 RP 이자
            if cash_reserve > 0:
                g = cash_reserve * rp_mo
                cum_tax      += g * RP_TAX_R
                cash_reserve += g * (1 - RP_TAX_R)
            if tax_reserve > 0:
                g = tax_reserve * rp_mo
                cum_tax      += g * RP_TAX_R
                cash_reserve += g * (1 - RP_TAX_R)

            # 연말 세금 정산 + GK 연간 조정
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0

                if gk_initialized:
                    pv_now = (shares * ndx3x[ci] if is_tqqq else
                              qld_sh * ndx2x[ci] if is_qld else cash)
                    port_now = pv_now + cash_reserve + voo_sh * sp500[ci]
                    if gk_initial_cap > 0:
                        ratio  = mon_cap / gk_initial_cap
                        yr_ret = ((port_now - gk_port_yr_start) / gk_port_yr_start
                                  if gk_port_yr_start > 0 else 0.0)
                        if ratio > 1.20:
                            gk_mult = max(0.50, gk_mult * 0.80)
                        elif ratio < 0.80 and yr_ret >= 0:
                            gk_mult = min(1.50, gk_mult * 1.10)
                    gk_port_yr_start = port_now

            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year
                pv_yr = (shares * ndx3x[ci] if is_tqqq else
                         qld_sh * ndx2x[ci] if is_qld else cash)
                gk_port_yr_start = pv_yr + cash_reserve + voo_sh * sp500[ci]

            # VOO 배당
            if voo_sh > 0:
                g = voo_sh * sp500[ci] * VOO_DIV_MO
                cum_tax      += g * DIV_TAX_R
                cash_reserve += g * (1 - DIV_TAX_R)

            # 이달 인출 캡
            pv_c    = (shares * ndx3x[ci] if is_tqqq else
                       qld_sh * ndx2x[ci] if is_qld else cash)
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            base_r  = (DYN_RATES[0] if total_c < DYN_THRS[0] else
                       DYN_RATES[1] if total_c < DYN_THRS[1] else DYN_RATES[2])
            mon_cap = min(total_c * base_r * gk_mult, float(LIV_MAX))
            last_mon = cur_mon

        tday_in_mon += 1

        # 현금 보유일 카운터
        if is_cash:
            days_in_cash += 1

        # ═══ EMA200 신호 ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        div    = (closes[ci] - e200) / e200 if e200ok else 0.0

        if e200ok:
            if div < 0:
                below_days += 1; above_days  = 0
            elif div > 0:
                above_days += 1; below_days  = 0
            else:
                below_days = above_days = 0

        ema200_sell = e200ok and below_days >= TIME_FILTER
        ema200_buy  = e200ok and above_days >= TIME_FILTER

        # ═══ 복합 매도 신호 ═══
        ath_sell = ath_dd <= p.ath_thr

        if p.sell_mode == 'ema200':
            sell_sig = ema200_sell
        elif p.sell_mode == 'ath_only':
            sell_sig = ath_sell
        elif p.sell_mode == 'ath_or_ema':
            sell_sig = ema200_sell or ath_sell
        elif p.sell_mode == 'ath_and_ema':
            sell_sig = ema200_sell and ath_sell
        else:
            sell_sig = ema200_sell

        # M5: 의무 보유 기간 중이면 매도 금지
        if p.lock_days > 0 and j < lock_until:
            sell_sig = False

        # ═══ 매수 신호 ═══
        buy_sig = ema200_buy
        # RSI 조기 재진입: 현금(또는 QLD) 상태 + RSI<30 + 이격도<-10%
        if (is_cash or is_qld) and not buy_sig and e200ok:
            rsi_v = rsi14[ci]
            if not np.isnan(rsi_v) and rsi_v < RSI_THR and div <= DIV_THR:
                buy_sig = True

        # ═══ 매도 실행: TQQQ → 현금 or QLD ═══
        if is_tqqq and sell_sig:
            sell_val = shares * ndx3x[ci]
            fee      = sell_val * FEE_RATE
            cum_fees += fee
            net      = sell_val - fee

            if p.qld_hedge:
                # 현금 대신 QLD로
                qld_sh  = net / ndx2x[ci]
                qld_avg = ndx2x[ci]
                cash    = 0.0
            else:
                cash   = net
                qld_sh = 0.0

            shares      = 0.0
            avg_cost    = 0.0
            trade_count += 1
            below_days  = 0
            days_in_cash = 0

        # ═══ 매도 실행: QLD 추가 약세 시 → 그대로 유지 (이미 헤지됨) ═══
        # (M4: QLD는 장기 보유 → 추가 매도 신호에서 행동 없음)

        # ═══ 매수 실행: 현금 or QLD → TQQQ ═══
        elif (is_cash or is_qld) and buy_sig:
            if is_qld:
                buy_capital = qld_sh * ndx2x[ci]
                fee         = buy_capital * FEE_RATE
                cum_fees   += fee
                net_capital = buy_capital - fee
                qld_sh      = 0.0
            else:
                fee         = cash * FEE_RATE
                cum_fees   += fee
                net_capital = cash - fee
                cash        = 0.0

            shares      = net_capital / ndx3x[ci]
            avg_cost    = ndx3x[ci]
            trade_count += 1
            above_days  = 0
            days_in_cash = 0

            # ATH 기반 전략: 재진입 시 ATH 리셋 (재진입가 기준으로 새로운 드로다운 추적)
            if p.sell_mode in ('ath_only', 'ath_or_ema', 'ath_and_ema'):
                ath = closes[ci]

            # M5: RSI 조기 재진입일 경우 의무 보유 잠금 설정
            if p.lock_days > 0 and not ema200_buy:
                lock_until = j + p.lock_days

        # ═══ 월초 인출 ═══
        if tday_in_mon == 1 and j > 0:
            # M6: ATH -50% 이하면 인출 0
            do_withdraw = (p.stop_ath <= -0.99) or (ath_dd > p.stop_ath)

            if do_withdraw:
                # 상태 재확인 (위에서 매수/매도가 바꿨을 수 있음)
                is_tqqq2 = shares > 0
                is_qld2  = qld_sh > 0
                is_cash2 = not is_tqqq2 and not is_qld2

                if is_tqqq2:
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

                    if not gk_initialized and living > 0:
                        gk_initial_cap = mon_cap
                        gk_initialized = True

                elif is_qld2:
                    # QLD 보유 중 인출: QLD 일부 매도
                    pv      = qld_sh * ndx2x[ci]
                    wd_val  = min(mon_cap, pv)
                    sh_sold = wd_val / ndx2x[ci]
                    gain    = max(0.0, wd_val - sh_sold * qld_avg)
                    annual_gain  += gain
                    tax_w        = gain * TAX_RATE
                    tax_reserve  += tax_w
                    after_tax    = wd_val - tax_w
                    qld_sh       = max(0.0, qld_sh - sh_sold)

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

                    if not gk_initialized and living > 0:
                        gk_initial_cap = mon_cap
                        gk_initialized = True

                else:
                    # 현금 보유 중: 현금 잔고 대비 적응형 인출
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

        # ═══ RP 일별 이자 (현금 보유 시에만) ═══
        if is_cash and cash > 0:
            daily_r = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            g = cash * daily_r
            cum_tax += g * RP_TAX_R
            cash    += g * (1 - RP_TAX_R)

        # ═══ VOO 편입 (TQQQ 보유 + 총자산 20억 이상 + 여유 현금) ═══
        if shares > 0 and cash_reserve > 0 and sp500[ci] > 0:
            pv2 = shares * ndx3x[ci]
            ta2 = pv2 + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    bs      = exc / sp500[ci]
                    voo_avg = ((voo_avg * voo_sh + sp500[ci] * bs)
                               / (voo_sh + bs)) if voo_sh > 0 else sp500[ci]
                    voo_sh       += bs
                    cash_reserve -= exc

        # ═══ 총자산 추적 ═══
        pv = (shares * ndx3x[ci] if shares > 0 else
              qld_sh * ndx2x[ci] if qld_sh > 0 else cash)
        total = pv + cash_reserve + voo_sh * sp500[ci]
        if total < min_val:
            min_val = total
        if total <= 0:
            break

    # ── 최종값 ──
    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = (shares * ndx3x[ci_end] if shares > 0 else
              qld_sh * ndx2x[ci_end] if qld_sh > 0 else cash)
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


def _init_worker(ndx3x, ndx2x, closes, ema200, rsi14,
                 dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'ndx3x': ndx3x, 'ndx2x': ndx2x, 'closes': closes,
        'ema200': ema200, 'rsi14': rsi14,
        'dates': pd.DatetimeIndex(dates_list),
        'sp500': sp500, 'fed_rates': fed_rates, 'starts': starts,
    })


def _run_one(p: Param):
    d = _SHARED
    results = [
        run_sim(d['ndx3x'], d['ndx2x'], d['closes'],
                d['ema200'], d['rsi14'],
                d['dates'], d['sp500'], d['fed_rates'], si, p)
        for si in d['starts']
    ]
    return (p.name, results)


def main():
    t0 = time.time()
    print("=" * 70, flush=True)
    print("추가 아이디어 6가지 vs D10GK 비교", flush=True)
    print("=" * 70, flush=True)

    ndx3x, ndx2x, closes, ema200, rsi14, dates, sp500, fed_rates = load_data()

    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    starts      = [i for i in get_monthly_starts(dates)
                   if i >= first_valid and (len(ndx3x) - i) / 252 >= SIM_YEARS]

    print(f"시작 시점: {len(starts)}개  전략: {len(STRATEGIES)}개", flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(ndx3x, ndx2x, closes, ema200, rsi14,
                  dates.tolist(), sp500, fed_rates, starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)

    print(f"완료 ({time.time() - t0:.1f}초)\n", flush=True)

    KEY_COHORTS = ["1996-10", "1999-03", "2000-03", "2003-03", "2007-10", "2009-03"]

    summary_rows = []
    cohort_rows  = []
    strat_results = {pname: results for pname, results in raw}

    for p in STRATEGIES:
        results  = strat_results[p.name]
        total    = len(results)
        bankrupt = sum(1 for r in results if r["bankrupt"])
        finals   = [r["final"]     for r in results if not r["bankrupt"]]
        cagrs    = [r["cagr"]      for r in results if not r["bankrupt"]]
        trades   = [r["trades"]    for r in results]
        withds   = [r["withdrawn"] for r in results]
        mins     = [r["min"]       for r in results]

        sf   = sorted(finals)
        nf   = len(sf)
        surv = (total - bankrupt) / total * 100

        summary_rows.append({
            "name":          p.name,
            "desc":          p.desc,
            "survival_rate": round(surv, 1),
            "med_final":     round(sf[nf // 2]    if nf else 0.0, 1),
            "avg_final":     round(sum(sf) / nf   if nf else 0.0, 1),
            "p25_final":     round(sf[nf // 4]    if nf else 0.0, 1),
            "p75_final":     round(sf[3*nf//4]    if nf else 0.0, 1),
            "avg_withdrawn": round(sum(withds) / len(withds) if withds else 0.0, 2),
            "min_of_min":    round(min(mins)       if mins  else 0.0, 4),
            "avg_cagr":      round(sum(cagrs) / len(cagrs)  if cagrs else 0.0, 2),
            "avg_trades":    round(sum(trades) / len(trades) if trades else 0.0, 1),
        })

    # 중앙값 기준 정렬
    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    # 코호트별 상세
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

    # ─── 콘솔 출력 ───
    print(f"{'이름':<4} {'설명':<50} {'생존율':>6} {'중앙':>8} {'연수익':>6} {'거래':>5}", flush=True)
    print("-" * 82, flush=True)
    for row in summary_rows:
        tag = "★ " if row["name"] == summary_rows[0]["name"] else "  "
        print(f"{tag}{row['name']:<2} {row['desc']:<50} "
              f"{row['survival_rate']:>5.1f}% "
              f"{row['med_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}% "
              f"{row['avg_trades']:>4.0f}회", flush=True)

    print("\n주요 시작 시점별 결과 (20년 후, 억):", flush=True)
    names = [p.name for p in STRATEGIES]
    print(f"{'시작':>10}" + "".join(f"{n:>9}" for n in names), flush=True)
    print("-" * (10 + 9 * len(names)), flush=True)
    cohort_dict = {r["start"]: r for r in cohort_rows}
    for label in KEY_COHORTS:
        if label in cohort_dict:
            row_s = f"{label:>10}" + "".join(
                f"{cohort_dict[label][n]['final']:>8.1f}억" for n in names)
            print(row_s, flush=True)

    # ─── JSON 저장 ───
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
        "summary": summary_rows,
        "cohorts": cohort_rows,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size / 1024:.0f} KB)", flush=True)
    print(f"총 소요: {time.time() - t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
