"""
withdrawal_2buffer.py

이중버퍼 vs 단일버퍼 (EMA200 15일) 비교
──────────────────────────────────────────
[단일버퍼 S0 - 현재 최선]
  매달 min(총자산 × rate, 1500만) 인출 → 생활비 + 세금
  EMA200 매도 → 현금(cash) → RP 이자 → 재매수
  잉여 cash_reserve가 20억+, 36개월치 초과 → VOO

[이중버퍼 S1~S5]
  Buffer1 (생활비 전용): EMA200 매도 proceeds 보관. RP 이자. 현금 기간 생활비 지출.
  Buffer2 (잉여 전용):  매달 (총자산 × rate) 캡 없이 인출 → 생활비(1500만 상한) 초과분.
                         RP 이자. N개월치 생활비 초과 → VOO 매수.
"""

import json
import time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass

DATA_DIR = Path("D:/justkeepbuyingtqqq/data")
FED_PATH = Path("D:/mcv-nextjs/public/data/fed_funds_rate.json")
OUT_PATH = Path("D:/justkeepbuyingtqqq/web/public/data/withdrawal_2buffer.json")

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
MA_N       = 200
TIME_FILTER = 15
DYN_RATES   = (0.003, 0.005, 0.007)
DYN_THRS    = (1_000_000_000, 2_000_000_000)


@dataclass
class Param:
    name: str
    desc: str
    dual_buffer: bool  = False
    buf2_voo_months: int = 24     # Buffer2가 N개월치 생활비 초과하면 → VOO
    keep_buf1_months: int = 0     # EMA200 재매수 시 Buffer1에 남겨둘 개월수


STRATEGIES = [
    Param("S0", "단일버퍼 (현재 최선: EMA200-15일, 인출캡 1500만)",
          dual_buffer=False),
    Param("S1", "이중버퍼: B2→VOO 24개월치 초과분",
          dual_buffer=True, buf2_voo_months=24),
    Param("S2", "이중버퍼: B2→VOO 12개월치 초과분",
          dual_buffer=True, buf2_voo_months=12),
    Param("S3", "이중버퍼: B2→VOO 36개월치 초과분",
          dual_buffer=True, buf2_voo_months=36),
    Param("S4", "이중버퍼 + 재매수시 B1 12개월치 유지",
          dual_buffer=True, buf2_voo_months=24, keep_buf1_months=12),
    Param("S5", "이중버퍼 + 재매수시 B1 6개월치 유지",
          dual_buffer=True, buf2_voo_months=24, keep_buf1_months=6),
]


def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i-1, "Close"] / ndx.loc[i, "Close"]
    ndx_closes = ndx["Close"].values.astype(float)
    dates      = pd.DatetimeIndex(ndx["Date"])

    ret    = np.diff(ndx_closes) / ndx_closes[:-1]
    ret    = np.insert(ret, 0, 0.0)
    factor = (1.0 + ret * 3.0) * (1.0 - EXP_RATIO / 252)
    factor[0] = 1.0
    ndx3x  = 100.0 * np.cumprod(factor)

    sp5   = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                        parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    sp500 = sp5.set_index("Date")["Close"].reindex(dates, method="ffill").values.astype(float)

    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed}

    n      = len(ndx_closes)
    ema200 = np.full(n, np.nan)
    alpha  = 2.0 / (MA_N + 1)
    ema200[MA_N - 1] = np.mean(ndx_closes[:MA_N])
    for i in range(MA_N, n):
        ema200[i] = ndx_closes[i] * alpha + ema200[i-1] * (1 - alpha)

    return ndx3x, ndx_closes, ema200, dates, sp500, fed_rates


def get_monthly_starts(dates):
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


def _total_assets(shares, ndx3x_val, cash, cash_reserve,
                  buf1, buf2, tax_reserve, voo_shares, sp500_val,
                  is_invested, dual):
    """총자산 계산 (버퍼 방식에 따라)"""
    if dual:
        tqqq = shares * ndx3x_val if is_invested else 0.0
        return tqqq + buf1 + buf2 + tax_reserve + voo_shares * sp500_val
    else:
        tqqq = shares * ndx3x_val if is_invested else cash
        return tqqq + cash_reserve + tax_reserve + voo_shares * sp500_val


def run_sim(ndx3x, ndx_closes, ema200, dates, sp500, fed_rates,
            start_idx: int, p: Param) -> dict:
    n       = len(ndx3x)
    sim_len = min(n - start_idx, int(SIM_YEARS * 252))

    ma_init = ema200[start_idx]
    below_start = not np.isnan(ma_init) and ndx_closes[start_idx] < ma_init

    # 전체 변수 선언 (mode에 따라 사용 안 하는 것도 0으로 초기화 — UnboundLocalError 방지)
    shares = 0.0
    cash = 0.0
    cash_reserve = 0.0
    buf1 = 0.0
    buf2 = 0.0

    if below_start:
        is_invested = False
        if p.dual_buffer:
            buf1 = float(INITIAL)
        else:
            cash = float(INITIAL)
    else:
        is_invested = True
        shares = INITIAL / ndx3x[start_idx]

    avg_cost = ndx3x[start_idx]

    tax_reserve   = 0.0
    annual_gain   = 0.0
    last_tax_yr   = -1
    cum_tax       = 0.0
    cum_fees      = 0.0
    cum_withdrawn = 0.0
    voo_shares    = 0.0
    voo_avg_cost  = 0.0

    last_mon_month       = None
    trading_day_in_month = 0
    monthly_living_used  = 0.0
    monthly_living_cap   = 0.0
    trade_count          = 0
    below_ma_days        = 0
    above_ma_days        = 0
    min_val              = float('inf')

    for j in range(sim_len):
        ci = start_idx + j
        if ci >= n:
            break

        cur_date  = dates[ci]
        cur_month = (cur_date.year, cur_date.month)
        month_key = cur_date.strftime("%Y-%m")

        # ── 월초 ──
        if cur_month != last_mon_month:
            trading_day_in_month = 0
            monthly_living_used  = 0.0

            annual_rate_pct = fed_rates.get(month_key, 3.0)
            rp_mo = max(0.0, annual_rate_pct / 100.0 - RP_SPREAD) / 12.0

            if p.dual_buffer:
                for pool_name in ['buf1', 'buf2']:
                    val = buf1 if pool_name == 'buf1' else buf2
                    if val > 0:
                        gross = val * rp_mo
                        cum_tax += gross * RP_TAX_R
                        net = gross * (1 - RP_TAX_R)
                        if pool_name == 'buf1': buf1 += net
                        else: buf2 += net
            else:
                if cash_reserve > 0:
                    gross = cash_reserve * rp_mo
                    cum_tax += gross * RP_TAX_R
                    cash_reserve += gross * (1 - RP_TAX_R)
                if tax_reserve > 0:
                    gross = tax_reserve * rp_mo
                    cum_tax += gross * RP_TAX_R
                    cash_reserve += gross * (1 - RP_TAX_R)

            # 연말 세금 정산
            if last_tax_yr >= 0 and cur_date.year > last_tax_yr:
                actual_tax = max(0.0, annual_gain - DEDUCTION) * TAX_RATE
                refund     = tax_reserve - actual_tax
                if refund > 0:
                    if p.dual_buffer: buf1 += refund
                    else: cash_reserve += refund
                cum_tax    += actual_tax
                tax_reserve = 0.0
                annual_gain = 0.0
            if last_tax_yr < 0 or cur_date.year > last_tax_yr:
                last_tax_yr = cur_date.year

            # VOO 배당
            if voo_shares > 0:
                gross = voo_shares * sp500[ci] * VOO_DIV_MO
                cum_tax += gross * DIV_TAX_R
                net = gross * (1 - DIV_TAX_R)
                if p.dual_buffer: buf2 += net
                else: cash_reserve += net

            # 이번 달 생활비 캡
            ta = _total_assets(shares, ndx3x[ci], cash, cash_reserve,
                               buf1 if p.dual_buffer else 0.0,
                               buf2 if p.dual_buffer else 0.0,
                               tax_reserve, voo_shares, sp500[ci], is_invested, p.dual_buffer)
            if ta < DYN_THRS[0]:
                monthly_living_cap = ta * DYN_RATES[0]
            elif ta < DYN_THRS[1]:
                monthly_living_cap = ta * DYN_RATES[1]
            else:
                monthly_living_cap = min(ta * DYN_RATES[2], LIV_MAX)

            last_mon_month = cur_month

        trading_day_in_month += 1

        # ── EMA200 신호 ──
        ma_val = ema200[ci]
        ma_ok  = not np.isnan(ma_val) and ma_val > 0
        div    = (ndx_closes[ci] - ma_val) / ma_val if ma_ok else 0.0

        if ma_ok:
            if div < 0:   below_ma_days += 1; above_ma_days = 0
            elif div > 0: above_ma_days += 1; below_ma_days = 0
            else:         below_ma_days = 0;  above_ma_days = 0

        if ma_ok:
            if is_invested and below_ma_days >= TIME_FILTER:
                sell_val = shares * ndx3x[ci]
                fee = sell_val * FEE_RATE
                cum_fees += fee
                net = sell_val - fee
                if p.dual_buffer: buf1 += net
                else: cash = net
                shares = 0.0; is_invested = False
                trade_count += 1; below_ma_days = 0

            elif not is_invested and above_ma_days >= TIME_FILTER:
                if p.dual_buffer:
                    keep = monthly_living_cap * p.keep_buf1_months
                    invest_amt = max(0.0, buf1 - keep)
                    buf1 -= invest_amt
                    buy_cash = invest_amt
                else:
                    buy_cash = cash
                    cash = 0.0

                if buy_cash > 0:
                    fee = buy_cash * FEE_RATE
                    cum_fees += fee
                    shares = (buy_cash - fee) / ndx3x[ci]
                    avg_cost = ndx3x[ci]
                is_invested = True; trade_count += 1; above_ma_days = 0

        # ── 월초 인출 ──
        if trading_day_in_month == 1 and j > 0:
            if is_invested:
                pv = shares * ndx3x[ci]

                if p.dual_buffer:
                    # 캡 없이 full rate 인출
                    ta_now = _total_assets(shares, ndx3x[ci], 0.0, 0.0,
                                           buf1, buf2, tax_reserve,
                                           voo_shares, sp500[ci], True, True)
                    if ta_now < DYN_THRS[0]:
                        withdrawal = ta_now * DYN_RATES[0]
                    elif ta_now < DYN_THRS[1]:
                        withdrawal = ta_now * DYN_RATES[1]
                    else:
                        withdrawal = ta_now * DYN_RATES[2]  # NO cap

                    shares_sold = min(withdrawal / ndx3x[ci], shares)
                    actual_w    = shares_sold * ndx3x[ci]
                    cost_basis  = shares_sold * avg_cost
                    gain        = max(0.0, actual_w - cost_basis)
                    annual_gain += gain
                    tax_w        = gain * TAX_RATE
                    tax_reserve += tax_w
                    after_tax    = actual_w - tax_w
                    shares       = max(0.0, shares - shares_sold)

                    living_expense  = min(after_tax, LIV_MAX)
                    cum_withdrawn  += living_expense
                    monthly_living_used += living_expense

                    excess = after_tax - living_expense
                    if excess > 0:
                        buf2 += excess

                else:
                    # 단일버퍼: 캡 적용
                    withdrawal  = monthly_living_cap
                    shares_sold = min(withdrawal / ndx3x[ci], shares)
                    actual_w    = shares_sold * ndx3x[ci]
                    cost_basis  = shares_sold * avg_cost
                    gain        = max(0.0, actual_w - cost_basis)
                    annual_gain += gain
                    tax_w        = gain * TAX_RATE
                    tax_reserve += tax_w
                    after_tax    = actual_w - tax_w
                    shares       = max(0.0, shares - shares_sold)

                    remaining = max(0.0, monthly_living_cap - monthly_living_used)
                    if after_tax >= remaining:
                        living_expense = remaining
                        cash_reserve  += after_tax - living_expense
                    else:
                        from_res       = min(remaining - after_tax, cash_reserve)
                        cash_reserve  -= from_res
                        living_expense = after_tax + from_res
                    monthly_living_used += living_expense
                    cum_withdrawn       += living_expense

            else:
                # 현금 기간 적응형 생활비
                if p.dual_buffer:
                    pool_val = buf1
                else:
                    pool_val = cash + cash_reserve

                yearly_liv = monthly_living_cap * 12
                lr = (1.0 if yearly_liv <= 0 or pool_val / yearly_liv >= 2 else
                      0.7 if pool_val / yearly_liv >= 1 else
                      0.5 if pool_val / yearly_liv >= 0.5 else 0.3)
                living_expense = max(0.0, monthly_living_cap * lr - monthly_living_used)
                monthly_living_used += living_expense
                cum_withdrawn       += living_expense

                if p.dual_buffer:
                    buf1 = max(0.0, buf1 - living_expense)
                else:
                    if cash_reserve >= living_expense:
                        cash_reserve -= living_expense
                    else:
                        cash = max(0.0, cash - (living_expense - cash_reserve))
                        cash_reserve = 0.0

        # ── RP 일별 이자 (현금 기간) ──
        if not is_invested:
            daily_r = max(0.0, fed_rates.get(month_key, 3.0) / 100.0 - RP_SPREAD) / 252
            if p.dual_buffer:
                if buf1 > 0:
                    gross = buf1 * daily_r
                    cum_tax += gross * RP_TAX_R
                    buf1   += gross * (1 - RP_TAX_R)
            else:
                if cash > 0:
                    gross = cash * daily_r
                    cum_tax += gross * RP_TAX_R
                    cash   += gross * (1 - RP_TAX_R)

        # ── Buffer2 → VOO ──
        if p.dual_buffer:
            thresh = monthly_living_cap * p.buf2_voo_months
            if buf2 > thresh and sp500[ci] > 0:
                buy_amt = buf2 - thresh
                bs = buy_amt / sp500[ci]
                voo_avg_cost = ((voo_avg_cost * voo_shares + sp500[ci] * bs)
                                / (voo_shares + bs)) if voo_shares > 0 else sp500[ci]
                voo_shares += bs
                buf2       -= buy_amt
        else:
            # 단일버퍼: 총자산 20억+ AND cash_reserve > 36개월치 → VOO
            if cash_reserve > 0 and monthly_living_cap > 0:
                ta2 = _total_assets(shares, ndx3x[ci], cash, cash_reserve,
                                    0.0, 0.0, tax_reserve, voo_shares, sp500[ci],
                                    is_invested, False)
                if ta2 >= 2_000_000_000 and sp500[ci] > 0:
                    exc = cash_reserve - monthly_living_cap * 36
                    if exc > 0:
                        bs = exc / sp500[ci]
                        voo_avg_cost = ((voo_avg_cost * voo_shares + sp500[ci] * bs)
                                        / (voo_shares + bs)) if voo_shares > 0 else sp500[ci]
                        voo_shares   += bs
                        cash_reserve -= exc

        # ── 총자산 및 파산 체크 ──
        ta = _total_assets(shares, ndx3x[ci], cash if not p.dual_buffer else 0.0,
                           cash_reserve if not p.dual_buffer else 0.0,
                           buf1 if p.dual_buffer else 0.0,
                           buf2 if p.dual_buffer else 0.0,
                           tax_reserve, voo_shares, sp500[ci], is_invested, p.dual_buffer)
        if ta < min_val:
            min_val = ta
        if ta <= 0:
            break

    # ── 최종값 ──
    ci_end = min(start_idx + sim_len - 1, n - 1)
    final  = _total_assets(shares, ndx3x[ci_end],
                           cash if not p.dual_buffer else 0.0,
                           cash_reserve if not p.dual_buffer else 0.0,
                           buf1 if p.dual_buffer else 0.0,
                           buf2 if p.dual_buffer else 0.0,
                           tax_reserve, voo_shares, sp500[ci_end],
                           is_invested, p.dual_buffer)
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


_SHARED = {}

def _init_worker(ndx3x, ndx_closes, ema200, dates_list, sp500, fed_rates, starts):
    _SHARED.update({
        'ndx3x': ndx3x, 'ndx_closes': ndx_closes, 'ema200': ema200,
        'dates': pd.DatetimeIndex(dates_list), 'sp500': sp500,
        'fed_rates': fed_rates, 'starts': starts,
    })

def _run_one(p: Param):
    d = _SHARED
    results = [run_sim(d['ndx3x'], d['ndx_closes'], d['ema200'],
                       d['dates'], d['sp500'], d['fed_rates'], si, p)
               for si in d['starts']]
    return (p.name, results)


def main():
    t0 = time.time()
    print("=" * 65, flush=True)
    print("이중버퍼 vs 단일버퍼 비교 (EMA200 15일)", flush=True)
    print("=" * 65, flush=True)

    ndx3x, ndx_closes, ema200, dates, sp500, fed_rates = load_data()
    first_valid    = int(np.where(~np.isnan(ema200))[0][0])
    monthly_starts = [i for i in get_monthly_starts(dates)
                      if i >= first_valid and (len(ndx3x) - i) / 252 >= SIM_YEARS]

    print(f"코호트: {len(monthly_starts)}개  전략: {len(STRATEGIES)}개", flush=True)

    with mp.Pool(
        processes=min(mp.cpu_count(), len(STRATEGIES)),
        initializer=_init_worker,
        initargs=(ndx3x, ndx_closes, ema200, dates.tolist(),
                  sp500, fed_rates, monthly_starts)
    ) as pool:
        raw = pool.map(_run_one, STRATEGIES, chunksize=1)

    print(f"완료 ({time.time()-t0:.1f}s)\n", flush=True)

    KEY_COHORTS = ["1996-10", "1999-03", "2000-03", "2003-03", "2007-10", "2009-03"]
    summary_rows = []
    cohort_detail = {}

    for pname, results in raw:
        p = next(x for x in STRATEGIES if x.name == pname)
        total    = len(results)
        bankrupt = sum(1 for r in results if r["bankrupt"])
        finals   = [r["final"]     for r in results if not r["bankrupt"]]
        withds   = [r["withdrawn"] for r in results]
        mins     = [r["min"]       for r in results]
        cagrs    = [r["cagr"]      for r in results if not r["bankrupt"]]
        trades   = [r["trades"]    for r in results]

        sf = sorted(finals)
        nf = len(sf)
        med_f = sf[nf//2]      if nf else 0.0
        avg_f = sum(sf)/nf     if nf else 0.0
        p25_f = sf[nf//4]      if nf else 0.0
        p75_f = sf[3*nf//4]    if nf else 0.0
        avg_w = sum(withds)/len(withds) if withds else 0.0
        min_m = min(mins)      if mins else 0.0
        avg_c = sum(cagrs)/len(cagrs) if cagrs else 0.0
        surv  = (total - bankrupt) / total * 100

        summary_rows.append({
            "name": pname, "desc": p.desc,
            "survival_rate": round(surv, 1),
            "med_final": round(med_f, 1), "avg_final": round(avg_f, 1),
            "p25_final": round(p25_f, 1), "p75_final": round(p75_f, 1),
            "avg_withdrawn": round(avg_w, 2),
            "min_of_min": round(min_m, 4),
            "avg_cagr": round(avg_c, 2),
            "avg_trades": round(sum(trades)/len(trades) if trades else 0, 1),
        })

        for ki, si in enumerate(monthly_starts):
            label = dates[si].strftime("%Y-%m")
            if label in KEY_COHORTS:
                cohort_detail.setdefault(label, {})[pname] = results[ki]["final"]

    summary_rows.sort(key=lambda r: r["med_final"], reverse=True)

    print(f"{'이름':<6} {'설명':<46} {'생존율':>6} {'중앙':>8} {'평균':>8} {'P25':>8} {'CAGR':>6}", flush=True)
    print("-" * 90, flush=True)
    for row in summary_rows:
        tag = "★ " if row["name"] == summary_rows[0]["name"] else "  "
        print(f"{tag}{row['name']:<4} {row['desc']:<46} "
              f"{row['survival_rate']:>5.1f}% "
              f"{row['med_final']:>7.1f}억 "
              f"{row['avg_final']:>7.1f}억 "
              f"{row['p25_final']:>7.1f}억 "
              f"{row['avg_cagr']:>5.1f}%", flush=True)

    print("\n주요 코호트 (20년 후 최종값, 억):", flush=True)
    names = [p.name for p in STRATEGIES]
    print(f"{'코호트':<10}" + "".join(f"{n:>10}" for n in names), flush=True)
    print("-" * (10 + 10 * len(names)), flush=True)
    for label in KEY_COHORTS:
        if label in cohort_detail:
            row_str = f"{label:<10}" + "".join(
                f"{cohort_detail[label].get(n, 0.0):>9.1f}억" for n in names)
            print(row_str, flush=True)

    class NpEnc(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, (np.bool_,)): return bool(o)
            if isinstance(o, np.integer):  return int(o)
            if isinstance(o, np.floating): return float(o)
            return super().default(o)

    output = {"meta": {"generated": str(dates[-1].date()), "sim_years": SIM_YEARS,
                       "n_cohorts": len(monthly_starts)},
              "summary": summary_rows, "cohort_detail": cohort_detail}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"), cls=NpEnc)

    print(f"\n저장: {OUT_PATH}  ({OUT_PATH.stat().st_size/1024:.0f} KB)", flush=True)
    print(f"소요: {time.time()-t0:.1f}초", flush=True)


if __name__ == "__main__":
    main()
