"""
export_withdrawal_json.py
B전략 인출 백테스트 코호트별 결과를 JSON으로 저장
(withdrawal_backtest.py 의 Method A / B 비교)

출력: web/public/data/withdrawal_cohorts.json
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path

DATA_DIR = "D:/justkeepbuyingtqqq/data/"
OUT_DIR  = "D:/justkeepbuyingtqqq/web/public/data/"

DAILY_INVEST           = 200_000
CAP_INVEST             = 250_000_000
LUMP_SUM               = 250_000_000
ACCUM_TARGET           = 1_000_000_000
WITHDRAW_THRESHOLD     = DAILY_INVEST * 4_000   # 8억
MONTHLY_WITHDRAW_RATE  = 0.01
BUFFER_REF_YEARS       = 13          # B전략 기준 (withdrawal_backtest.py 와 동일)
BUBBLE_THRESHOLD_YEARS = 1.5
BUBBLE_WAIT_YEARS      = 2.0
RESCUE_DURATION_DAYS   = 252
SIM_YEARS              = 40


# ── 데이터 로드 ─────────────────────────────────────────

def load_ndx():
    df = pd.read_csv(DATA_DIR + "ndx_1971_now.csv", parse_dates=["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i - 1, "Close"] / df.loc[i, "Close"]
        df.loc[i:, "Close"] *= scale
    return df

def load_sp500():
    return pd.read_csv(DATA_DIR + "sp500_1927_now.csv", parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)

def make_prices(df, lev):
    ret = df["Close"].pct_change().fillna(0).values
    return 100.0 * np.cumprod(1.0 + ret * lev)

def align_sp500(sp5_df, target_dates):
    return sp5_df.set_index("Date")["Close"].reindex(target_dates, method="ffill").values

def monthly_starts(dates_pd):
    seen, idxs = set(), []
    for i, d in enumerate(dates_pd):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            idxs.append(i)
    return idxs


# ── 적립 단계 ─────────────────────────────────────────

def run_accum_B(prices, dates_pd):
    n_invest = int(CAP_INVEST // DAILY_INVEST)
    starts = monthly_starts(dates_pd)
    results = []
    for si in starts:
        n = len(prices) - si
        cum_shares = 0.0
        hit_idx = -1
        hit_val = 0.0
        for j in range(n):
            px = prices[si + j]
            inv = LUMP_SUM if j == 0 else DAILY_INVEST
            cum_shares += inv / px
            port = cum_shares * px
            if port >= ACCUM_TARGET:
                hit_idx = j
                hit_val = port
                break
        sd = dates_pd[si]
        if hit_idx >= 0:
            ed = dates_pd[si + hit_idx]
            years = (ed - sd).days / 365.25
            results.append({"start": sd, "end": ed, "y": years,
                             "val": hit_val, "end_idx": si + hit_idx, "done": True})
        else:
            results.append({"start": sd, "end": None, "y": None,
                             "val": cum_shares * prices[-1], "end_idx": len(prices) - 1, "done": False})
    return results


# ── 인출 단계 ─────────────────────────────────────────

def simulate_withdraw(prices, dates_pd, start_i, sim_len,
                      shares, cash_buffer, sp500_ref,
                      dca_cash=0.0, dca_days=0):
    n_total = len(prices)
    threshold = WITHDRAW_THRESHOLD
    spread_days = int(BUFFER_REF_YEARS * 252)

    dca_mode = (dca_cash > 0 and dca_days > 0)
    state = "DCA_ENTRY" if dca_mode else "WITHDRAW"

    dca_remain = dca_cash
    dca_daily  = dca_cash / dca_days if dca_days > 0 else 0.0

    local_peak   = shares * prices[start_i] if shares > 0 else threshold
    sp500_peak   = sp500_ref[start_i]
    rescue_left  = 0
    buf_used     = 0
    cash_remain  = cash_buffer
    total_out    = 0.0
    min_val      = float("inf")
    prev_month   = -1
    snap_month   = -1

    for j in range(sim_len):
        ci = start_i + j
        if ci >= n_total:
            break
        px   = prices[ci]
        sp_px = sp500_ref[ci]
        port  = shares * px

        if port < min_val:
            min_val = port
        if port > local_peak:
            local_peak = port
        if sp_px > sp500_peak:
            sp500_peak = sp_px
        sp_dd = (sp_px / sp500_peak - 1.0) if sp500_peak > 0 else 0.0

        # 상태 전이
        if state == "DCA_ENTRY":
            if dca_remain <= 0 or port >= threshold:
                state = "WITHDRAW"
                local_peak = max(port, threshold)
                sp500_peak = sp_px
        elif state == "WITHDRAW":
            if sp_dd <= -0.50:
                state = "BUFFER_BUY"; buf_used = 0
            elif sp_dd <= -0.20:
                state = "RESCUE_1Y"; rescue_left = RESCUE_DURATION_DAYS
        elif state == "RESCUE_1Y":
            if sp_dd <= -0.50:
                state = "BUFFER_BUY"; buf_used = 0
            elif port > threshold or rescue_left <= 0:
                state = "WITHDRAW"
                local_peak = port; sp500_peak = sp_px
        elif state == "BUFFER_BUY":
            if port > threshold:
                state = "WITHDRAW"
                local_peak = port; sp500_peak = sp_px

        # 액션
        cur_month = (dates_pd[ci].year, dates_pd[ci].month)
        if state == "DCA_ENTRY":
            buy = min(dca_daily, dca_remain)
            shares += buy / px; dca_remain -= buy
        elif state == "WITHDRAW":
            if cur_month != prev_month and j > 0:
                w = shares * px * MONTHLY_WITHDRAW_RATE
                shares = max(0.0, shares - w / px)
                total_out += w
            prev_month = cur_month
        elif state == "RESCUE_1Y":
            shares += DAILY_INVEST / px; rescue_left -= 1
        elif state == "BUFFER_BUY":
            if cash_remain > 0 and buf_used < spread_days:
                remaining = spread_days - buf_used
                buy = cash_remain / remaining
                shares += buy / px; cash_remain -= buy; buf_used += 1

        if shares <= 0:
            break

    final_val = shares * prices[min(start_i + sim_len - 1, n_total - 1)]
    if min_val == float("inf"):
        min_val = final_val
    return int(final_val), int(min_val), int(total_out)


def run_withdrawal_one(prices, dates_pd, start_idx, port_val, years, sp500_ref, bubble_mode):
    buf_years  = max(0.0, BUFFER_REF_YEARS - years)
    buf_amount = buf_years * DAILY_INVEST * 252
    sim_len    = min(len(prices) - start_idx, int(SIM_YEARS * 252))
    if sim_len <= 0:
        return None

    is_bubble = years < BUBBLE_THRESHOLD_YEARS

    if is_bubble:
        dca_days = max(1, int(buf_years * 252))
        if bubble_mode == "A":
            wait = int(BUBBLE_WAIT_YEARS * 252)
            re_i = start_idx + wait
            if re_i >= len(prices):
                return (0, 0, 0)
            new_len = min(len(prices) - re_i, sim_len - wait)
            return simulate_withdraw(prices, dates_pd, re_i, new_len,
                                     shares=0.0, cash_buffer=0.0, sp500_ref=sp500_ref,
                                     dca_cash=port_val, dca_days=dca_days)
        else:
            return simulate_withdraw(prices, dates_pd, start_idx, sim_len,
                                     shares=0.0, cash_buffer=0.0, sp500_ref=sp500_ref,
                                     dca_cash=port_val, dca_days=dca_days)
    else:
        shares = port_val / prices[start_idx]
        return simulate_withdraw(prices, dates_pd, start_idx, sim_len,
                                 shares=shares, cash_buffer=buf_amount, sp500_ref=sp500_ref)


# ── 메인 ───────────────────────────────────────────────

def main():
    import time
    t0 = time.time()

    print("데이터 로드...")
    ndx_df = load_ndx()
    sp5_df = load_sp500()
    dates  = pd.DatetimeIndex(ndx_df["Date"])
    prices = make_prices(ndx_df, 3)
    sp500  = align_sp500(sp5_df, dates)

    print("적립 단계 (B전략)...")
    accum = run_accum_B(prices, dates)
    completed = [r for r in accum if r["done"]]
    print(f"  완료: {len(completed)}/{len(accum)}")

    print("인출 단계 (Method A + B)...")
    cohorts = []
    for i, r in enumerate(completed):
        if i % 100 == 0:
            print(f"  {i}/{len(completed)}...")
        y = r["y"]
        si = r["end_idx"]
        is_bubble = y < BUBBLE_THRESHOLD_YEARS

        rA = run_withdrawal_one(prices, dates, si, r["val"], y, sp500, "A")
        rB = run_withdrawal_one(prices, dates, si, r["val"], y, sp500, "B")

        if rA and rB:
            cohorts.append({
                "s":      r["start"].strftime("%Y-%m"),
                "y":      round(y, 2),
                "bubble": is_bubble,
                "aFin":   rA[0],
                "aMin":   rA[1],
                "aOut":   rA[2],
                "bFin":   rB[0],
                "bMin":   rB[1],
                "bOut":   rB[2],
            })

    n_bubble = sum(1 for c in cohorts if c["bubble"])
    print(f"  버블 케이스: {n_bubble}/{len(cohorts)}")

    out = {
        "params": {
            "buffer_ref": BUFFER_REF_YEARS,
            "daily": DAILY_INVEST,
            "lump":  LUMP_SUM,
            "target": ACCUM_TARGET,
        },
        "total":       len(cohorts),
        "bubble_total": n_bubble,
        "cohorts":     cohorts,
    }

    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)
    path = OUT_DIR + "withdrawal_cohorts.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size = Path(path).stat().st_size / 1024
    print(f"\n→ {path}  ({size:.1f} KB)")
    print(f"완료: {time.time()-t0:.1f}초")


if __name__ == "__main__":
    main()
