"""
C전략 인출 백테스트 + BUFFER_REF_YEARS 스윕 비교

적립: C전략 (일 20만원, 한도없이 계속)
인출: 기존 인출 룰 동일, BUFFER_REF_YEARS만 바꿔가며 비교

테스트:
  - B전략 / BUFFER_REF=13  (기존 기준, 비교용)
  - C전략 / BUFFER_REF=13  (기존 값 그대로)
  - C전략 / BUFFER_REF=14  (C전략 실측 최장 13.74 올림)
  - C전략 / BUFFER_REF=16
  - C전략 / BUFFER_REF=18
  - C전략 / BUFFER_REF=20
"""

import numpy as np
import pandas as pd
import time

from pathlib import Path
_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

DATA_DIR   = str(_ROOT / "data") + "/"
DAILY_INV  = 200_000
LUMP_SUM   = 250_000_000
TARGET     = 1_000_000_000
WITHDRAW_THRESHOLD     = DAILY_INV * 4_000   # 8억
MONTHLY_RATE           = 0.01
BUBBLE_THRESHOLD_YEARS = 1.5
BUBBLE_WAIT_YEARS      = 2.0
RESCUE_DURATION_DAYS   = 252
SIM_YEARS              = 40


# ── 데이터 로드 ────────────────────────────────────────────────────
def load_ndx():
    df = pd.read_csv(DATA_DIR + "ndx_1971_now.csv", parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i-1,"Close"] / df.loc[i,"Close"]
        df.loc[i:,"Close"] *= scale
    return df

def load_sp500():
    return pd.read_csv(DATA_DIR + "sp500_1927_now.csv", parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)

def make_synthetic(df, leverage):
    ret = df["Close"].pct_change().fillna(0).values
    return 100.0 * np.cumprod(1.0 + ret * leverage)

def align_sp500(sp5_df, target_dates):
    return sp5_df.set_index("Date")["Close"].reindex(target_dates, method="ffill").values

def monthly_starts(dates_pd):
    seen, out = set(), []
    for i, d in enumerate(dates_pd):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k); out.append(i)
    return out


# ── 적립 단계 ─────────────────────────────────────────────────────
def run_accum(prices, dates_pd, strategy):
    """strategy: 'B' or 'C'"""
    starts = monthly_starts(dates_pd)
    n_cap  = int(LUMP_SUM // DAILY_INV)   # A한도 (B/C 무관)
    results = []
    for si in starts:
        n = len(prices) - si
        cum_sh = cum_inv = 0.0
        hit_idx = hit_val = -1
        for j in range(n):
            px = prices[si + j]
            inv = (LUMP_SUM if j == 0 else DAILY_INV) if strategy == "B" else DAILY_INV
            cum_sh  += inv / px
            cum_inv += inv
            pv = cum_sh * px
            if pv >= TARGET:
                hit_idx = j; hit_val = pv; break
        if hit_idx >= 0:
            end_d = dates_pd[si + hit_idx]
            days  = (end_d - dates_pd[si]).days
            results.append({"start": dates_pd[si], "end_i": si+hit_idx,
                            "years": days/365.25, "port": hit_val, "status": "ok"})
        else:
            results.append({"start": dates_pd[si], "end_i": len(prices)-1,
                            "years": None, "port": cum_sh*prices[-1], "status": "ip"})
    return results


# ── 인출 시뮬레이션 (단일 코호트) ────────────────────────────────
def simulate_withdraw(prices, dates_pd, start_idx, portfolio_value,
                      years_to_target, sp500_ref, buffer_ref_years):
    """
    bubble case: Method A (2년 대기 후 DCA)
    """
    buf_years  = max(0.0, buffer_ref_years - years_to_target)
    buf_amount = buf_years * DAILY_INV * 252
    n_total    = len(prices)
    sim_len    = min(n_total - start_idx, int(SIM_YEARS * 252))
    if sim_len <= 0:
        return None

    bubble = years_to_target < BUBBLE_THRESHOLD_YEARS

    if bubble:
        dca_days  = max(1, int(buf_years * 252))
        wait_days = int(BUBBLE_WAIT_YEARS * 252)
        re_entry  = start_idx + wait_days
        if re_entry >= n_total:
            return None
        new_len = min(n_total - re_entry, sim_len - wait_days)
        result  = _sim_core(prices, dates_pd, re_entry, new_len, sp500_ref,
                            shares=0.0, cash=0.0,
                            dca_cash=portfolio_value, dca_days=dca_days)
    else:
        result = _sim_core(prices, dates_pd, start_idx, sim_len, sp500_ref,
                           shares=portfolio_value/prices[start_idx], cash=buf_amount,
                           dca_cash=0.0, dca_days=0)

    if result is None:
        return None
    final_val, min_val, total_out = result
    survived = final_val > 0
    return {"survived": survived, "final": final_val, "min": min_val,
            "withdrawn": total_out, "bubble": bubble,
            "buf_years": buf_years, "years": years_to_target}


def _sim_core(prices, dates_pd, start_idx, sim_len, sp500_ref,
              shares, cash, dca_cash, dca_days):
    # States: WITHDRAW, RESCUE_1Y, BUFFER_BUY, DCA_ENTRY
    state = "DCA_ENTRY" if dca_cash > 0 else "WITHDRAW"
    dca_cash_remain = float(dca_cash)
    dca_daily       = dca_cash / dca_days if dca_days > 0 else 0.0
    cash_buffer     = float(cash)

    buf_spread_days = int(40 * 252)   # BUFFER_BUY 분산: 40년치 (사실상 남은기간 전부)

    sp500_peak = sp500_ref[start_idx] if start_idx < len(sp500_ref) else 1.0
    rescue_days_left = 0
    buf_daily = 0.0

    total_withdrawn = 0.0
    min_val = shares * prices[start_idx] + cash_buffer + dca_cash_remain

    withdraw_prev_month = -1
    snap_prev_month     = -1

    for j in range(sim_len):
        idx = start_idx + j
        if idx >= len(prices):
            break
        px   = prices[idx]
        sp_px = sp500_ref[idx] if idx < len(sp500_ref) else sp_px

        # SP500 peak update
        if state == "WITHDRAW":
            if sp_px > sp500_peak:
                sp500_peak = sp_px
        sp500_dd = (sp500_peak - sp_px) / sp500_peak if sp500_peak > 0 else 0.0

        port_val = shares * px + cash_buffer + dca_cash_remain

        # ── DCA_ENTRY ──
        if state == "DCA_ENTRY":
            buy = min(dca_daily, dca_cash_remain)
            if buy > 0 and px > 0:
                shares += buy / px
                dca_cash_remain -= buy
            port_val = shares * px
            if dca_cash_remain <= 0 or port_val >= WITHDRAW_THRESHOLD:
                state = "WITHDRAW"
                sp500_peak = sp_px

        # ── WITHDRAW ──
        elif state == "WITHDRAW":
            cur_month = (dates_pd[idx].year, dates_pd[idx].month)
            if cur_month != withdraw_prev_month:
                withdraw_prev_month = cur_month
                monthly_w = shares * px * MONTHLY_RATE
                if shares > 0 and px > 0:
                    shares -= monthly_w / px
                    total_withdrawn += monthly_w
            # 트리거 체크
            if sp500_dd >= 0.50:
                state = "BUFFER_BUY"
                buf_daily = cash_buffer / buf_spread_days if buf_spread_days > 0 else 0.0
            elif sp500_dd >= 0.20:
                state = "RESCUE_1Y"
                rescue_days_left = RESCUE_DURATION_DAYS

        # ── RESCUE_1Y ──
        elif state == "RESCUE_1Y":
            if px > 0:
                shares += DAILY_INV / px
            rescue_days_left -= 1
            port_val_check = shares * px + cash_buffer
            if port_val_check >= WITHDRAW_THRESHOLD or rescue_days_left <= 0:
                state = "WITHDRAW"
                sp500_peak = sp_px

        # ── BUFFER_BUY ──
        elif state == "BUFFER_BUY":
            buy = min(buf_daily, cash_buffer)
            if buy > 0 and px > 0:
                shares += buy / px
                cash_buffer -= buy
            port_val_check = shares * px + cash_buffer
            if port_val_check >= WITHDRAW_THRESHOLD or cash_buffer <= 0:
                state = "WITHDRAW"
                sp500_peak = sp_px

        port_val = shares * px + cash_buffer + dca_cash_remain
        if port_val < min_val:
            min_val = port_val

    final_val = shares * prices[min(start_idx + sim_len - 1, len(prices)-1)]
    return final_val, min_val, total_withdrawn


# ── 전체 파이프라인 ────────────────────────────────────────────────
def run_pipeline(prices, dates_pd, sp500_ref, accum_strategy, buffer_ref_years):
    cohorts = run_accum(prices, dates_pd, accum_strategy)
    completed = [c for c in cohorts if c["status"] == "ok"]

    results = []
    for c in completed:
        r = simulate_withdraw(prices, dates_pd, c["end_i"], c["port"],
                              c["years"], sp500_ref, buffer_ref_years)
        if r:
            results.append(r)

    if not results:
        return None

    survived = sum(1 for r in results if r["survived"])
    finals   = [r["final"] for r in results]
    mins     = [r["min"]   for r in results]
    outs     = [r["withdrawn"] for r in results]
    bubbles  = [r for r in results if r["bubble"]]

    return {
        "n":           len(results),
        "accum_n":     len(completed),
        "survived":    survived,
        "pct":         100 * survived / len(results),
        "avg_final":   np.mean(finals) / 1e8,
        "avg_out":     np.mean(outs)   / 1e8,
        "min_min":     np.min(mins)    / 1e8,
        "avg_min":     np.mean(mins)   / 1e8,
        "n_bubble":    len(bubbles),
        "bub_min_min": np.min([r["min"] for r in bubbles]) / 1e8 if bubbles else None,
        "bub_survive": sum(1 for r in bubbles if r["survived"]),
    }


def print_results(label, r):
    if r is None:
        print(f"  {label}: 결과 없음")
        return
    bub_sv = f"{r['bub_survive']}/{r['n_bubble']}" if r['n_bubble'] else "—"
    bub_min = f"{r['bub_min_min']:.2f}억" if r['bub_min_min'] is not None else "—"
    print(f"  {label:<42} "
          f"생존 {r['survived']:>3}/{r['n']:>3} ({r['pct']:>5.1f}%)  "
          f"최솟값최소 {r['min_min']:>6.2f}억  "
          f"최솟값평균 {r['avg_min']:>5.1f}억  "
          f"평균인출 {r['avg_out']:>5.0f}억  "
          f"버블 {bub_sv} 생존 (최악 {bub_min})")


if __name__ == "__main__":
    t0 = time.time()
    print("=" * 100)
    print("인출 백테스트: C전략 + BUFFER_REF 스윕  (bubble = Method A)")
    print("=" * 100)

    ndx_df   = load_ndx()
    sp5_df   = load_sp500()
    ndx_dates = pd.DatetimeIndex(ndx_df["Date"])
    ndx3x     = make_synthetic(ndx_df, 3)
    sp500_ref = align_sp500(sp5_df, ndx_dates)

    print(f"\n{'전략 / BUFFER_REF':<42} {'생존율':>10}  "
          f"{'최솟값최소':>10}  {'최솟값평균':>10}  "
          f"{'평균인출':>9}  버블 생존")
    print("-" * 100)

    # 기준선: 기존 B전략 BUFFER_REF=13
    r = run_pipeline(ndx3x, ndx_dates, sp500_ref, "B", 13)
    print_results("B전략 / BUFFER_REF=13  (기존 기준선)", r)

    print()

    # C전략 + 다양한 BUFFER_REF
    for buf in [13, 14, 15, 16, 18, 20]:
        r = run_pipeline(ndx3x, ndx_dates, sp500_ref, "C", buf)
        label = f"C전략 / BUFFER_REF={buf}"
        if buf == 14: label += "  ← C전략 실측최장 기준"
        print_results(label, r)

    print(f"\n총 소요: {time.time()-t0:.1f}초")

    # ── 세부: C전략 BUFFER_REF=14 최악 코호트 ──
    print("\n" + "=" * 60)
    print("C전략 BUFFER_REF=14 — 최솟값 하위 10개 코호트")
    print("=" * 60)
    ndx_df2  = load_ndx()
    sp5_df2  = load_sp500()
    nd2      = pd.DatetimeIndex(ndx_df2["Date"])
    n3x2     = make_synthetic(ndx_df2, 3)
    sp5_ref2 = align_sp500(sp5_df2, nd2)
    cohorts  = run_accum(n3x2, nd2, "C")
    completed = [c for c in cohorts if c["status"] == "ok"]
    details = []
    for c in completed:
        r = simulate_withdraw(n3x2, nd2, c["end_i"], c["port"], c["years"], sp5_ref2, 14)
        if r:
            details.append({"start": c["start"].strftime("%Y-%m"), "years": c["years"],
                            "buf": r["buf_years"], "min": r["min"]/1e8, "final": r["final"]/1e8,
                            "out": r["withdrawn"]/1e8, "survived": r["survived"], "bubble": r["bubble"]})
    details.sort(key=lambda x: x["min"])
    print(f"  {'시작월':<10} {'소요':>6} {'버퍼':>6} {'최솟값':>8} {'최종값':>8} {'인출총액':>8} {'생존'}")
    for d in details[:10]:
        bub = " 🫧버블" if d["bubble"] else ""
        sv  = "✓" if d["survived"] else "✗"
        print(f"  {d['start']:<10} {d['years']:>5.2f}년 {d['buf']:>5.2f}년 "
              f"{d['min']:>7.2f}억 {d['final']:>7.1f}억 {d['out']:>7.1f}억 {sv}{bub}")
