"""
withdrawal_new_ideas.py

새로운 인출 아이디어 8가지 vs 현재 최선(EMA200 15일 + 동적인출) 비교
──────────────────────────────────────────────────────────────
S0: 현재 최선 — EMA200 15일, 동적인출 0.3/0.5/0.7%, 캡 1500만
S1: 골든/데스크로스 — EMA50×EMA200 교차로 매도/매수 신호
S2: 분할재진입 3개월 — EMA200 15일 신호 후 3개월에 걸쳐 DCA 재매수
S3: 분할재진입 6개월 — EMA200 15일 신호 후 6개월에 걸쳐 DCA 재매수
S4: Guyton-Klinger — 초기 인출액 대비 120%↑ 시 20% 감액, 80%↓ 시 10% 증액
S5: 변동성 조정 인출 — 30일 실현변동성이 역사 평균 대비 높으면 인출률 30% 감소
S6: 동적 레버리지 — EMA200 5% 이상 위→TQQQ, 미만→QQQ, 아래→현금
S7: RSI 조기 재진입 — RSI<30 이면 EMA200 15일 조건 전에 조기 매수
S8: Floor 보장형 — 최소 500만/월 인출 보장 (자산 소진 리스크 수용)
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR = (_ROOT / "data")
FED_PATH = (_ROOT / "data/fed_funds_rate.json")
OUT_PATH = (_ROOT / "web/public/data/withdrawal_new_ideas.json")

INITIAL       = 1_000_000_000
SIM_YEARS     = 20
TQQQ_EXP      = 0.0088
QQQ_EXP       = 0.0020
LIV_MAX       = 15_000_000
LIV_MIN       = 5_000_000
TAX_RATE      = 0.22
DEDUCTION     = 2_500_000
RP_SPREAD     = 0.004
RP_TAX_R      = 0.154
FEE_RATE      = 0.0007
VOO_DIV_MO    = 0.013 / 12
DIV_TAX_R     = 0.154
DYN_RATES     = (0.003, 0.005, 0.007)
DYN_THRS      = (1_000_000_000, 2_000_000_000)
TIME_FILTER   = 15
EMA_LEVER_THR = 0.05   # S6: EMA200 이상 5% 이상이면 TQQQ


@dataclass
class Param:
    name: str
    desc: str
    signal: str     = 'ema200_consec'  # 'ema200_consec' | 'death_golden' | 'rsi_early'
    dca_months: int = 0                # 0=즉시 | 3 | 6
    withdrawal: str = 'dynamic'        # 'dynamic' | 'guyton_klinger' | 'volatility' | 'floor'
    dyn_lever: bool = False            # True=TQQQ↔QQQ 동적 레버리지


STRATEGIES = [
    Param("S0", "현재 최선: EMA200-15일 + 동적인출 0.3/0.5/0.7%"),
    Param("S1", "골든/데스크로스: EMA50×EMA200 교차 신호",       signal='death_golden'),
    Param("S2", "분할재진입 3개월: 매수 후 3개월 DCA",            dca_months=3),
    Param("S3", "분할재진입 6개월: 매수 후 6개월 DCA",            dca_months=6),
    Param("S4", "Guyton-Klinger: 120%/80% 인출률 규칙",          withdrawal='guyton_klinger'),
    Param("S5", "변동성 조정 인출: 30일 실현변동성 반영",          withdrawal='volatility'),
    Param("S6", "동적 레버리지: EMA200±5%로 TQQQ↔QQQ",          dyn_lever=True),
    Param("S7", "RSI 조기 재진입: RSI<30 즉시 매수",              signal='rsi_early'),
    Param("S8", "Floor 보장형: 최소 500만/월 보장",               withdrawal='floor'),
]


# ═══════════════════════════════════════════════════════════
# 데이터 로드
# ═══════════════════════════════════════════════════════════

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

    # TQQQ (3x NDX)
    f3 = (1.0 + ret * 3.0) * (1.0 - TQQQ_EXP / 252)
    f3[0] = 1.0
    tqqq = 100.0 * np.cumprod(f3)

    # QQQ (1x NDX)
    f1 = (1.0 + ret) * (1.0 - QQQ_EXP / 252)
    f1[0] = 1.0
    qqq = 100.0 * np.cumprod(f1)

    # SP500
    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    # FED rates
    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    # TQQQ v2 (스왑금리 2× 포함)
    fed_daily_arr = np.array([
        fed_rates.get(f"{d.year}-{d.month:02d}", 0.0) / 100.0 / 252
        for d in dates
    ])
    fv2 = (1.0 + ret * 3.0 - 2.0 * fed_daily_arr) * (1.0 - TQQQ_EXP / 252)
    fv2[0] = 1.0
    tqqq_v2 = 100.0 * np.cumprod(fv2)

    # EMA200
    a200    = 2.0 / 201
    ema200  = np.full(n, np.nan)
    ema200[199] = np.mean(closes[:200])
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    # EMA50
    a50    = 2.0 / 51
    ema50  = np.full(n, np.nan)
    ema50[49] = np.mean(closes[:50])
    for i in range(50, n):
        ema50[i] = closes[i] * a50 + ema50[i - 1] * (1 - a50)

    # RSI 14
    rsi14  = np.full(n, np.nan)
    deltas = np.diff(closes)
    gains  = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    if n > 15:
        ag = float(np.mean(gains[:14]))
        al = float(np.mean(losses[:14]))
        for i in range(14, n - 1):
            ag = (ag * 13 + gains[i]) / 14
            al = (al * 13 + losses[i]) / 14
            rsi14[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)

    # 30일 실현 변동성 (연율화)
    vol30     = np.full(n, np.nan)
    for i in range(30, n):
        vol30[i] = float(np.std(ret[i - 30:i])) * np.sqrt(252)
    hist_vol  = float(np.nanmean(vol30))

    return tqqq, tqqq_v2, qqq, closes, ema200, ema50, rsi14, vol30, hist_vol, dates, sp500, fed_rates


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

def calc_dyn_cap(total, withdrawal_type, gk_mult, vol_ci, hist_vol, vol30):
    base_rate = (DYN_RATES[0] if total < DYN_THRS[0]
                 else DYN_RATES[1] if total < DYN_THRS[1]
                 else DYN_RATES[2])
    base_cap = total * base_rate

    if withdrawal_type == 'volatility':
        v = vol30[vol_ci] if vol_ci < len(vol30) else np.nan
        if not np.isnan(v) and hist_vol > 0:
            r = v / hist_vol
            if r > 1.5:
                base_cap *= 0.70
            elif r < 0.70:
                base_cap *= 1.20
    elif withdrawal_type == 'guyton_klinger':
        base_cap *= gk_mult
    elif withdrawal_type == 'floor':
        base_cap = max(base_cap, float(LIV_MIN))

    return min(base_cap, float(LIV_MAX))


def run_sim(tqqq, qqq, closes, ema200, ema50, rsi14, vol30, hist_vol,
            dates, sp500, fed_rates, start_idx: int, p: Param) -> dict:
    n       = len(tqqq)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    # ── 초기 포지션 ──
    ma_init = ema200[start_idx]
    ma_valid = not np.isnan(ma_init) and ma_init > 0
    if ma_valid and closes[start_idx] < ma_init:
        is_invested  = False
        cash         = float(INITIAL)
        tqqq_sh      = 0.0
        qqq_sh       = 0.0
    else:
        is_invested = True
        if p.dyn_lever and ma_valid:
            div0 = (closes[start_idx] - ma_init) / ma_init
            if div0 >= EMA_LEVER_THR:
                tqqq_sh = INITIAL / tqqq[start_idx]; qqq_sh = 0.0
            else:
                tqqq_sh = 0.0; qqq_sh = INITIAL / qqq[start_idx]
        else:
            tqqq_sh = INITIAL / tqqq[start_idx]; qqq_sh = 0.0
        cash = 0.0

    tqqq_avg = tqqq[start_idx]
    qqq_avg  = qqq[start_idx]

    cash_reserve  = 0.0
    tax_reserve   = 0.0
    annual_gain   = 0.0
    last_tax_yr   = -1
    cum_tax       = 0.0
    cum_fees      = 0.0
    cum_withdrawn = 0.0
    voo_sh        = 0.0
    voo_avg       = 0.0

    # DCA 상태
    dca_cash       = 0.0
    dca_left       = 0
    dca_start_mon  = None   # DCA 시작 월 (중복 실행 방지)

    # Guyton-Klinger 상태
    gk_mult         = 1.0
    gk_initial_cap  = 0.0
    gk_initialized  = False
    gk_port_yr_start = float(INITIAL)

    # 신호 카운터
    below_days = 0
    above_days = 0
    e50_prev_above = None   # death/golden cross용

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

            # RP 이자
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

                if p.withdrawal == 'guyton_klinger' and gk_initialized:
                    pv_now = ((tqqq_sh * tqqq[ci] + qqq_sh * qqq[ci])
                              if is_invested else cash)
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
                pv_yr = ((tqqq_sh * tqqq[ci] + qqq_sh * qqq[ci])
                         if is_invested else cash)
                gk_port_yr_start = pv_yr + cash_reserve + voo_sh * sp500[ci]

            # VOO 배당
            if voo_sh > 0:
                g = voo_sh * sp500[ci] * VOO_DIV_MO
                cum_tax      += g * DIV_TAX_R
                cash_reserve += g * (1 - DIV_TAX_R)

            # 이번 달 인출 캡
            pv_c    = (tqqq_sh * tqqq[ci] + qqq_sh * qqq[ci]) if is_invested else cash
            total_c = pv_c + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            mon_cap = calc_dyn_cap(total_c, p.withdrawal, gk_mult, ci, hist_vol, vol30)
            last_mon = cur_mon

        tday_in_mon += 1

        # ═══ 신호 생성 ═══
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        sell_sig = False
        buy_sig  = False

        if p.signal in ('ema200_consec', 'rsi_early'):
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
            # RSI 조기 재진입: 현금 보유 중 + RSI<30
            if p.signal == 'rsi_early' and not is_invested and dca_left == 0:
                rsi_v = rsi14[ci]
                if not np.isnan(rsi_v) and rsi_v < 30:
                    buy_sig = True

        elif p.signal == 'death_golden':
            e50 = ema50[ci]
            if not np.isnan(e50) and e200ok:
                cur_above = bool(e50 > e200)
                if e50_prev_above is not None:
                    if e50_prev_above and not cur_above:
                        sell_sig = True   # death cross
                    elif not e50_prev_above and cur_above:
                        buy_sig  = True   # golden cross
                e50_prev_above = cur_above

        # ═══ 매도 실행 ═══
        if is_invested and sell_sig:
            sell_val = tqqq_sh * tqqq[ci] + qqq_sh * qqq[ci]
            fee      = sell_val * FEE_RATE
            cum_fees += fee
            cash       = sell_val - fee + dca_cash
            tqqq_sh    = 0.0
            qqq_sh     = 0.0
            dca_cash   = 0.0
            dca_left   = 0
            dca_start_mon = None
            is_invested   = False
            trade_count  += 1
            below_days    = 0

        # ═══ 매수 실행 (즉시 or DCA 첫 트랑슈) ═══
        elif not is_invested and buy_sig and dca_left == 0:
            invest = cash
            if p.dca_months > 0:
                dca_cash      = invest
                dca_left      = p.dca_months
                dca_start_mon = cur_mon
                per           = dca_cash / dca_left
                fee           = per * FEE_RATE
                cum_fees     += fee
                net           = per - fee
                if p.dyn_lever and e200ok:
                    if (closes[ci] - e200) / e200 >= EMA_LEVER_THR:
                        tqqq_sh += net / tqqq[ci]; tqqq_avg = tqqq[ci]
                    else:
                        qqq_sh  += net / qqq[ci];  qqq_avg  = qqq[ci]
                else:
                    tqqq_sh += net / tqqq[ci]; tqqq_avg = tqqq[ci]
                dca_cash -= per
                dca_left -= 1
                cash      = dca_cash
            else:
                fee      = invest * FEE_RATE
                cum_fees += fee
                net      = invest - fee
                if p.dyn_lever and e200ok:
                    if (closes[ci] - e200) / e200 >= EMA_LEVER_THR:
                        tqqq_sh = net / tqqq[ci]; tqqq_avg = tqqq[ci]; qqq_sh = 0.0
                    else:
                        qqq_sh  = net / qqq[ci];  qqq_avg  = qqq[ci];  tqqq_sh = 0.0
                else:
                    tqqq_sh = net / tqqq[ci]; tqqq_avg = tqqq[ci]; qqq_sh = 0.0
                cash = 0.0
            is_invested   = True
            trade_count  += 1
            above_days    = 0

        # ═══ DCA 이월 트랑슈 (월 첫날, DCA 시작월 제외) ═══
        if (is_invested and dca_left > 0
                and tday_in_mon == 1 and j > 0
                and cur_mon != dca_start_mon):
            per      = dca_cash / dca_left
            fee      = per * FEE_RATE
            cum_fees += fee
            net      = per - fee
            if p.dyn_lever and e200ok:
                if (closes[ci] - e200) / e200 >= EMA_LEVER_THR:
                    tqqq_sh += net / tqqq[ci]; tqqq_avg = tqqq[ci]
                else:
                    qqq_sh  += net / qqq[ci];  qqq_avg  = qqq[ci]
            else:
                tqqq_sh += net / tqqq[ci]
            dca_cash -= per
            dca_left -= 1
            cash      = dca_cash if dca_left > 0 else 0.0
            if dca_left == 0:
                dca_cash = 0.0
            trade_count += 1

        # ═══ 동적 레버리지: 매일 TQQQ↔QQQ 점검 ═══
        if is_invested and p.dyn_lever and e200ok and dca_left == 0:
            div3        = (closes[ci] - e200) / e200
            want_tqqq   = div3 >= EMA_LEVER_THR
            have_tqqq   = tqqq_sh > 0
            have_qqq    = qqq_sh  > 0
            if want_tqqq and have_qqq and not have_tqqq:
                val = qqq_sh * qqq[ci]
                fee = val * FEE_RATE; cum_fees += fee
                tqqq_sh = (val - fee) / tqqq[ci]; tqqq_avg = tqqq[ci]
                qqq_sh  = 0.0; trade_count += 1
            elif not want_tqqq and have_tqqq and not have_qqq:
                val = tqqq_sh * tqqq[ci]
                fee = val * FEE_RATE; cum_fees += fee
                qqq_sh  = (val - fee) / qqq[ci]; qqq_avg = qqq[ci]
                tqqq_sh = 0.0; trade_count += 1

        # ═══ 월초 인출 ═══
        if tday_in_mon == 1 and j > 0:
            withdrawal = mon_cap
            if is_invested:
                # TQQQ 우선, 없으면 QQQ에서 인출
                if tqqq_sh > 0:
                    pv_tq     = tqqq_sh * tqqq[ci]
                    wd_val    = min(withdrawal, pv_tq)
                    sh_sold   = wd_val / tqqq[ci]
                    gain      = max(0.0, wd_val - sh_sold * tqqq_avg)
                    annual_gain += gain
                    tax_w     = gain * TAX_RATE
                    tax_reserve += tax_w
                    after_tax = wd_val - tax_w
                    tqqq_sh   = max(0.0, tqqq_sh - sh_sold)
                else:
                    pv_qq     = qqq_sh * qqq[ci]
                    wd_val    = min(withdrawal, pv_qq)
                    sh_sold   = wd_val / qqq[ci]
                    gain      = max(0.0, wd_val - sh_sold * qqq_avg)
                    annual_gain += gain
                    tax_w     = gain * TAX_RATE
                    tax_reserve += tax_w
                    after_tax = wd_val - tax_w
                    qqq_sh    = max(0.0, qqq_sh - sh_sold)

                remaining = max(0.0, withdrawal - mon_used)
                if after_tax >= remaining:
                    living   = remaining
                    cash_reserve += after_tax - living
                else:
                    from_res = min(remaining - after_tax, cash_reserve)
                    cash_reserve -= from_res
                    living   = after_tax + from_res
                mon_used      += living
                cum_withdrawn += living

                if p.withdrawal == 'guyton_klinger' and not gk_initialized and living > 0:
                    gk_initial_cap = mon_cap
                    gk_initialized = True

            else:
                # 현금 보유 중 적응형 인출
                total_cash = cash + cash_reserve
                yearly_cap = mon_cap * 12
                lr = (1.0 if yearly_cap <= 0 or total_cash / yearly_cap >= 2 else
                      0.7 if total_cash / yearly_cap >= 1 else
                      0.5 if total_cash / yearly_cap >= 0.5 else 0.3)
                living = max(0.0, mon_cap * lr - mon_used)
                if p.withdrawal == 'floor':
                    living = max(living, min(float(LIV_MIN), total_cash))
                mon_used      += living
                cum_withdrawn += living
                if cash_reserve >= living:
                    cash_reserve -= living
                else:
                    cash = max(0.0, cash - (living - cash_reserve))
                    cash_reserve = 0.0

        # ═══ RP 일별 이자 (비투자 기간) ═══
        if not is_invested:
            daily_r = max(0.0, fed_rates.get(mon_key, 3.0) / 100.0 - RP_SPREAD) / 252
            if cash > 0:
                g = cash * daily_r
                cum_tax += g * RP_TAX_R
                cash    += g * (1 - RP_TAX_R)

        # ═══ VOO 편입 (총자산 20억+, 여유 현금 36개월치 초과) ═══
        if is_invested and cash_reserve > 0 and sp500[ci] > 0:
            pv2 = tqqq_sh * tqqq[ci] + qqq_sh * qqq[ci]
            ta2 = pv2 + cash_reserve + tax_reserve + voo_sh * sp500[ci]
            if ta2 >= 2_000_000_000:
                exc = cash_reserve - mon_cap * 36
                if exc > 0:
                    bs = exc / sp500[ci]
                    voo_avg = ((voo_avg * voo_sh + sp500[ci] * bs)
                               / (voo_sh + bs)) if voo_sh > 0 else sp500[ci]
                    voo_sh       += bs
                    cash_reserve -= exc

        # ═══ 총자산 추적 ═══
        pv    = (tqqq_sh * tqqq[ci] + qqq_sh * qqq[ci]) if is_invested else cash
        total = pv + cash_reserve + voo_sh * sp500[ci]
        if total < min_val:
            min_val = total
        if total <= 0:
            break

    # ── 최종값 ──
    ci_end = min(start_idx + sim_len - 1, n - 1)
    pv_end = ((tqqq_sh * tqqq[ci_end] + qqq_sh * qqq[ci_end])
              if is_invested else cash)
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


def _init_worker(tqqq, qqq, closes, ema200, ema50, rsi14, vol30, hist_vol,
                 dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'tqqq': tqqq, 'qqq': qqq, 'closes': closes,
        'ema200': ema200, 'ema50': ema50, 'rsi14': rsi14,
        'vol30': vol30, 'hist_vol': hist_vol,
        'dates': pd.DatetimeIndex(dates_list),
        'sp500': sp500, 'fed_rates': fed_rates, 'starts': starts,
    })


def _run_one(p: Param):
    d = _SHARED
    results = [
        run_sim(d['tqqq'], d['qqq'], d['closes'],
                d['ema200'], d['ema50'], d['rsi14'],
                d['vol30'], d['hist_vol'],
                d['dates'], d['sp500'], d['fed_rates'], si, p)
        for si in d['starts']
    ]
    return (p.name, results)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--v2", action="store_true", help="스왑금리 포함 버전 생성")
    args = parser.parse_args()
    suffix = "_v2" if args.v2 else ""
    out_path = OUT_PATH.parent / f"withdrawal_new_ideas{suffix}.json"

    t0 = time.time()
    print("=" * 70, flush=True)
    print("새로운 인출 아이디어 vs 현재 최선 비교", flush=True)
    print(f"{'스왑금리 포함 (v2)' if args.v2 else '운용보수만 (standard)'}", flush=True)
    print("=" * 70, flush=True)

    tqqq, tqqq_v2, qqq, closes, ema200, ema50, rsi14, vol30, hist_vol, \
        dates, sp500, fed_rates = load_data()
    tqqq_use = tqqq_v2 if args.v2 else tqqq

    first_valid = int(np.where(~np.isnan(ema200))[0][0])
    starts      = [i for i in get_monthly_starts(dates)
                   if i >= first_valid and (len(tqqq) - i) / 252 >= SIM_YEARS]

    print(f"코호트: {len(starts)}개  전략: {len(STRATEGIES)}개  hist_vol: {hist_vol:.3f}", flush=True)

    n_workers = min(mp.cpu_count(), len(STRATEGIES))
    with mp.Pool(
        processes=n_workers,
        initializer=_init_worker,
        initargs=(tqqq_use, qqq, closes, ema200, ema50, rsi14, vol30, hist_vol,
                  dates.tolist(), sp500, fed_rates, starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)

    print(f"완료 ({time.time() - t0:.1f}s)\n", flush=True)

    KEY_COHORTS = ["1996-10", "1999-03", "2000-03", "2003-03", "2007-10", "2009-03"]

    summary_rows = []
    cohort_rows  = []

    for pname, results in raw:
        p = next(x for x in STRATEGIES if x.name == pname)
        total    = len(results)
        bankrupt = sum(1 for r in results if r["bankrupt"])
        finals   = [r["final"]     for r in results if not r["bankrupt"]]
        withds   = [r["withdrawn"] for r in results]
        mins     = [r["min"]       for r in results]
        cagrs    = [r["cagr"]      for r in results if not r["bankrupt"]]
        trades   = [r["trades"]    for r in results]

        sf  = sorted(finals)
        nf  = len(sf)
        surv = (total - bankrupt) / total * 100

        summary_rows.append({
            "name":         pname,
            "desc":         p.desc,
            "survival_rate": round(surv, 1),
            "med_final":    round(sf[nf // 2]     if nf else 0.0, 1),
            "avg_final":    round(sum(sf) / nf    if nf else 0.0, 1),
            "p25_final":    round(sf[nf // 4]     if nf else 0.0, 1),
            "p75_final":    round(sf[3*nf//4]     if nf else 0.0, 1),
            "avg_withdrawn": round(sum(withds) / len(withds) if withds else 0.0, 2),
            "min_of_min":   round(min(mins)        if mins  else 0.0, 4),
            "avg_cagr":     round(sum(cagrs) / len(cagrs) if cagrs else 0.0, 2),
            "avg_trades":   round(sum(trades) / len(trades) if trades else 0.0, 1),
        })

    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    # 코호트별 데이터
    strategy_results = {pname: results for pname, results in raw}
    for ki, si in enumerate(starts):
        label = dates[si].strftime("%Y-%m")
        row   = {"start": label}
        for p in STRATEGIES:
            r = strategy_results[p.name][ki]
            row[p.name] = {
                "final":    r["final"],
                "cagr":     r["cagr"],
                "min":      r["min"],
                "bankrupt": r["bankrupt"],
                "trades":   r["trades"],
            }
        cohort_rows.append(row)

    # 콘솔 출력
    print(f"{'이름':<6} {'설명':<46} {'생존율':>6} {'중앙':>8} {'CAGR':>6} {'거래':>5}", flush=True)
    print("-" * 80, flush=True)
    for row in summary_rows:
        tag = "★ " if row["name"] == summary_rows[0]["name"] else "  "
        print(f"{tag}{row['name']:<4} {row['desc']:<46} "
              f"{row['survival_rate']:>5.1f}% "
              f"{row['med_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}% "
              f"{row['avg_trades']:>4.0f}회", flush=True)

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
            if isinstance(o, (np.bool_,)):    return bool(o)
            if isinstance(o, np.integer):     return int(o)
            if isinstance(o, np.floating):    return float(o)
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
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    print(f"\n저장: {out_path}  ({out_path.stat().st_size / 1024:.0f} KB)", flush=True)
    print(f"소요: {time.time() - t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
