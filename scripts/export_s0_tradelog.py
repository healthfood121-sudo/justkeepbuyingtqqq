"""
export_s0_tradelog.py

S0 전략 (EMA200 15일 연속 + 동적 인출률) 코호트별 거래 로그 생성
출력: web/public/data/s0_tradelog.json

각 코호트(시작 시점)별로 매수/매도 이벤트를 기록:
  date     - 거래 실행 날짜
  action   - BUY / SELL
  ndx      - NDX 종가 (신호 발생 당일)
  ema200   - EMA200 값
  div_pct  - 이격도 % ((NDX - EMA200) / EMA200 * 100)
  port     - 거래 직후 총 포트폴리오 가치 (억 원)
  days     - 신호 연속일 (S0는 항상 15)
"""

import json
from datetime import datetime
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/mcv-nextjs/public/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/s0_tradelog.json")

INITIAL      = 1_000_000_000   # 초기 10억
SIM_YEARS    = 20
EXP_3X       = 0.0088
LIV_MAX      = 15_000_000
TAX_RATE     = 0.22
DEDUCTION    = 2_500_000
RP_SPREAD    = 0.004
RP_TAX_R     = 0.154
FEE_RATE     = 0.0007
DYN_RATES    = (0.003, 0.005, 0.007)
DYN_THRS     = (1_000_000_000, 2_000_000_000)
TIME_FILTER  = 15


# ──────────────────────────────────────────────────────────────
# 데이터 로드
# ──────────────────────────────────────────────────────────────

def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)

    # 1985-10-01 접합 보정 (기존 스크립트와 동일)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    ret  = np.diff(closes) / closes[:-1]
    ret  = np.insert(ret, 0, 0.0)
    f3   = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    ndx3x = 100.0 * np.cumprod(f3)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    # EMA200
    a200   = 2.0 / 201
    ema200 = np.full(n, np.nan)
    ema200[199] = float(np.mean(closes[:200]))
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1 - a200)

    return ndx3x, closes, ema200, dates, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


# ──────────────────────────────────────────────────────────────
# S0 시뮬레이션 (거래 로그 포함)
# ──────────────────────────────────────────────────────────────

def run_s0(ndx3x, closes, ema200, dates, fed_rates, start_idx: int) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))
    complete = (n - start_idx) >= int(SIM_YEARS * 252)

    e200_init  = ema200[start_idx]
    e200_valid = not np.isnan(e200_init) and e200_init > 0

    if e200_valid and closes[start_idx] < e200_init:
        is_invested  = False
        cash         = float(INITIAL)
        tqqq_sh      = 0.0
        initial_state = "CASH"
    else:
        is_invested  = True
        tqqq_sh      = INITIAL / ndx3x[start_idx]
        cash         = 0.0
        initial_state = "INVESTED"

    avg_cost     = ndx3x[start_idx]
    cash_reserve = 0.0
    tax_reserve  = 0.0
    annual_gain  = 0.0
    last_tax_yr  = -1
    cum_tax      = 0.0
    cum_fees     = 0.0
    cum_withdrawn = 0.0

    below_days = 0
    above_days = 0

    last_mon    = None
    tday_in_mon = 0
    mon_cap     = 0.0
    mon_used    = 0.0

    trades = []

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        cur_date = dates[ci]
        cur_mon  = (cur_date.year, cur_date.month)
        mon_key  = cur_date.strftime("%Y-%m")

        # ── 월초 처리 ──
        if cur_mon != last_mon:
            tday_in_mon = 0
            mon_used    = 0.0

            # RP 이자 미반영 (스왑 비용과 쌍으로 제거)

            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0

            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year

            # 인출 캡 계산
            pv_c    = tqqq_sh * ndx3x[ci] if is_invested else cash
            total_c = pv_c + cash_reserve + tax_reserve
            base_rate = (DYN_RATES[0] if total_c < DYN_THRS[0]
                         else DYN_RATES[1] if total_c < DYN_THRS[1]
                         else DYN_RATES[2])
            mon_cap = min(total_c * base_rate, float(LIV_MAX))

            last_mon = cur_mon

        tday_in_mon += 1

        # ── EMA200 신호 ──
        e200   = ema200[ci]
        e200ok = not np.isnan(e200) and e200 > 0
        div    = 0.0
        if e200ok:
            div = (closes[ci] - e200) / e200
            if div < 0:
                below_days += 1
                above_days  = 0
            elif div > 0:
                above_days += 1
                below_days  = 0
            else:
                below_days = above_days = 0

        sell_sig = e200ok and below_days >= TIME_FILTER and is_invested
        buy_sig  = e200ok and above_days >= TIME_FILTER and not is_invested

        # ── 매도 ──
        if sell_sig:
            proceeds = tqqq_sh * ndx3x[ci]
            fee      = proceeds * FEE_RATE
            proceeds -= fee
            cum_fees += fee

            gain = max(0.0, proceeds - tqqq_sh * avg_cost)
            annual_gain += gain
            tax_reserve += gain * TAX_RATE

            cash        = proceeds
            tqqq_sh     = 0.0
            is_invested = False
            below_days  = 0

            port_total = cash + cash_reserve
            trades.append({
                "date":    cur_date.strftime("%Y-%m-%d"),
                "action":  "SELL",
                "ndx":     round(float(closes[ci]), 2),
                "ema200":  round(float(e200), 2),
                "div_pct": round(div * 100, 1),
                "port":    round(port_total / 1e8, 2),
                "days":    TIME_FILTER,
            })

        # ── 매수 ──
        elif buy_sig:
            total_avail = cash + cash_reserve
            fee         = total_avail * FEE_RATE
            net         = total_avail - fee
            cum_fees   += fee

            avg_cost     = ndx3x[ci]
            tqqq_sh      = net / avg_cost
            cash         = 0.0
            cash_reserve = 0.0
            tax_reserve  = 0.0
            is_invested  = True
            above_days   = 0

            port_total = tqqq_sh * ndx3x[ci]
            trades.append({
                "date":    cur_date.strftime("%Y-%m-%d"),
                "action":  "BUY",
                "ndx":     round(float(closes[ci]), 2),
                "ema200":  round(float(e200), 2),
                "div_pct": round(div * 100, 1),
                "port":    round(port_total / 1e8, 2),
                "days":    TIME_FILTER,
            })

        # ── 월 인출 (첫 거래일, 시뮬 첫날 제외) ──
        if tday_in_mon == 1 and j > 0 and mon_cap > 0:
            if is_invested:
                tqqq_val = tqqq_sh * ndx3x[ci]
                wd_val   = min(mon_cap, tqqq_val)
                wd_left  = wd_val
                total_after_tax = 0.0
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
            else:
                total_cash = cash + cash_reserve
                yearly_cap = mon_cap * 12
                lr = (1.0 if yearly_cap <= 0 or total_cash / yearly_cap >= 2 else
                      0.7 if total_cash / yearly_cap >= 1 else
                      0.5 if total_cash / yearly_cap >= 0.5 else 0.3)
                living = max(0.0, mon_cap * lr - mon_used)
                mon_used      += living
                cum_withdrawn += living
                if cash_reserve >= living:
                    cash_reserve -= living
                else:
                    cash = max(0.0, cash - (living - cash_reserve))
                    cash_reserve = 0.0

        # RP 이자 미반영 (스왑 비용과 쌍으로 제거 — 나중에 둘다 넣는 버전으로 통일 예정)

    # 최종 포트폴리오
    ci = start_idx + sim_len - 1
    if ci >= n:
        ci = n - 1
    if is_invested:
        final_val = tqqq_sh * ndx3x[ci] + cash_reserve
    else:
        final_val = cash + cash_reserve

    bankrupt = final_val < 0

    return {
        "start":     dates[start_idx].strftime("%Y-%m"),
        "complete":  bool(complete),
        "initial":   initial_state,
        "final":     round(final_val / 1e8, 2) if not bankrupt else -1,
        "withdrawn": round(cum_withdrawn / 1e8, 2),
        "bankrupt":  bool(bankrupt),
        "trades":    trades,
    }


# ──────────────────────────────────────────────────────────────
# 메인
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("데이터 로드 중...")
    ndx3x, closes, ema200, dates, fed_rates = load_data()

    starts = get_monthly_starts(dates)
    print(f"총 {len(starts)}개 시작 시점")

    cohorts = []
    for idx, si in enumerate(starts):
        result = run_s0(ndx3x, closes, ema200, dates, fed_rates, si)
        cohorts.append(result)
        if (idx + 1) % 100 == 0:
            print(f"  {idx+1}/{len(starts)} 완료")

    # 요약 통계
    finals   = [c["final"] for c in cohorts if c["complete"] and not c["bankrupt"]]
    n_comp   = sum(1 for c in cohorts if c["complete"])
    n_total  = len(cohorts)
    median   = float(np.median(finals)) if finals else 0.0
    avg_trd  = float(np.mean([len(c["trades"]) for c in cohorts]))

    out = {
        "meta": {
            "generated":  datetime.now().strftime("%Y-%m-%d"),
            "strategy":   "S0",
            "desc":       "EMA200 15일 연속 + 동적 인출률 0.3/0.5/0.7%",
            "sim_years":  SIM_YEARS,
            "n_cohorts":  n_total,
            "n_complete": n_comp,
            "median_final": round(median, 2),
            "avg_trades": round(avg_trd, 1),
        },
        "cohorts": cohorts,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"\n완료! {OUT_PATH}")
    print(f"파일 크기: {size_kb:.0f} KB")
    print(f"코호트: {n_total}개 ({n_comp}개 완료)")
    print(f"중앙값: {median:.1f}억")
    print(f"평균 거래: {avg_trd:.1f}회/20년")
