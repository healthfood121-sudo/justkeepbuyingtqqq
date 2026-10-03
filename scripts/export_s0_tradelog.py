"""
export_s0_tradelog.py

S0 전략 (EMA200 15일 연속 + 동적 인출률) 코호트별 거래 로그 생성
출력:
  web/public/data/s0_tradelog.json      — standard (운용보수만)
  web/public/data/s0_tradelog_v2.json   — with_costs (운용보수 + 스왑금리비용)

실행:
  python scripts/export_s0_tradelog.py               # standard만
  python scripts/export_s0_tradelog.py --mode v2     # with_costs만
  python scripts/export_s0_tradelog.py --mode both

각 코호트(시작 시점)별로 매수/매도 이벤트를 기록:
  date     - 거래 실행 날짜
  action   - BUY / SELL
  ndx      - NDX 종가 (신호 발생 당일)
  ema200   - EMA200 값
  div_pct  - 이격도 % ((NDX - EMA200) / EMA200 * 100)
  port     - 거래 직후 총 포트폴리오 가치 (억 원)
  days     - 신호 연속일 (S0는 항상 15)
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))
from data_loader import load_ndx_prices, get_monthly_starts

OUT_DIR = Path("D:/justkeepbuyingtqqq/web/public/data")

INITIAL      = 1_000_000_000   # 초기 10억
SIM_YEARS    = 20
LIV_MAX      = 15_000_000
TAX_RATE     = 0.22
DEDUCTION    = 2_500_000
FEE_RATE     = 0.0007
DYN_RATES    = (0.003, 0.005, 0.007)
DYN_THRS     = (1_000_000_000, 2_000_000_000)
TIME_FILTER  = 15


# ──────────────────────────────────────────────────────────────
# S0 시뮬레이션 (거래 로그 포함)
# ──────────────────────────────────────────────────────────────

def run_s0(ndx3x, closes, ema200, dates, start_idx: int) -> dict:
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

def run_and_save(price_mode: str):
    """price_mode: 'standard' | 'with_costs'"""
    suffix   = "_v2" if price_mode == "with_costs" else ""
    out_path = OUT_DIR / f"s0_tradelog{suffix}.json"

    print(f"\n[mode={price_mode}] 데이터 로드 중...")
    d      = load_ndx_prices(price_mode)
    ndx3x  = d["ndx3x"]
    closes = d["closes"]
    ema200 = d["ema200"]
    dates  = d["dates"]

    starts = get_monthly_starts(dates)
    print(f"총 {len(starts)}개 시작 시점")

    cohorts = []
    for idx, si in enumerate(starts):
        result = run_s0(ndx3x, closes, ema200, dates, si)
        cohorts.append(result)
        if (idx + 1) % 100 == 0:
            print(f"  {idx+1}/{len(starts)} 완료")

    finals   = [c["final"] for c in cohorts if c["complete"] and not c["bankrupt"]]
    n_comp   = sum(1 for c in cohorts if c["complete"])
    n_total  = len(cohorts)
    median   = float(np.median(finals)) if finals else 0.0
    avg_trd  = float(np.mean([len(c["trades"]) for c in cohorts]))

    out = {
        "meta": {
            "generated":   datetime.now().strftime("%Y-%m-%d"),
            "strategy":    "S0",
            "price_mode":  price_mode,
            "desc":        "EMA200 15일 연속 + 동적 인출률 0.3/0.5/0.7%",
            "sim_years":   SIM_YEARS,
            "n_cohorts":   n_total,
            "n_complete":  n_comp,
            "median_final": round(median, 2),
            "avg_trades":  round(avg_trd, 1),
        },
        "cohorts": cohorts,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = out_path.stat().st_size / 1024
    print(f"\n완료! {out_path}")
    print(f"파일 크기: {size_kb:.0f} KB")
    print(f"코호트: {n_total}개 ({n_comp}개 완료)")
    print(f"중앙값: {median:.1f}억")
    print(f"평균 거래: {avg_trd:.1f}회/20년")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["standard", "v2", "both"],
                        default="standard",
                        help="가격 모드 (default: standard)")
    args = parser.parse_args()

    if args.mode == "both":
        run_and_save("standard")
        run_and_save("with_costs")
    elif args.mode == "v2":
        run_and_save("with_costs")
    else:
        run_and_save("standard")
