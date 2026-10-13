"""
krw_withdrawal.py

인출식 — 달러 기준 vs 원화 기준 비교 (공정한 비교 버전)
──────────────────────────────────────────────────────────────────────
공통: RULE25 전략, 원화 10억 시작, with_costs (스왑금리 0.5%/yr + 운용보수 0.88%)

두 버전 모두 동일한 달러 투자금으로 시작:
  시작 달러 = 원화 10억 / 시작 환율

차이는 오직 생활비 결정 기준:
  달러 기준: 달러 포트폴리오 × 동적 인출률 → 달러 금액 (원화로는 ×환율)
    → 환율 강세 시 원화 생활비 자동 증가
  원화 기준: (달러 포트폴리오 × 당일환율) × 동적 인출률 → 원화 금액
    → 실제 한국 투자자의 원화 생활비 기준

결과는 모두 원화 단위로 통일:
  달러 기준 최종자산: 달러 잔여 × 최종 환율
  원화 기준 최종자산: 원화 잔여 그대로

코호트: 1990-01 이후 (441개), 데이터 끝까지
세금: 양도세 22% (연 250만 공제, 원화 차익 기준), RP 이자세 15.4%
신호: NDX 달러 기준 (RULE25: 52주 고점 -25% 매도, EMA200 위 15일 재매수)

출력: web/public/data/krw_withdrawal.json
"""

import json, sys, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import withdrawal_cash_tier as E

ROOT     = Path(__file__).resolve().parent.parent
OUT      = ROOT / "web/public/data/krw_withdrawal.json"
START_DATE = "1990-01-01"

INITIAL_KRW = 1_000_000_000   # 원화 10억
EOK         = 100_000_000

DYN_RATES = (0.003, 0.005, 0.007)
DYN_THRS  = (INITIAL_KRW, INITIAL_KRW * 2)   # 원화 10억 / 20억 기준

TAX_RATE   = 0.22
DEDUCTION  = 2_500_000   # 원화 연 250만 공제
RP_SPREAD  = 0.004
RP_TAX_R   = 0.154
FEE_RATE   = 0.0007
TRAIL_THR  = 0.25
TIME_ABOVE = 15


def load_fx(dates: pd.DatetimeIndex) -> np.ndarray:
    fx = pd.read_csv(ROOT / "data/extra/usdkrw.csv", parse_dates=["Date"])
    fx = fx.sort_values("Date").set_index("Date")
    return fx.reindex(dates).ffill().bfill()["Value"].values.astype(float)


def dyn_rate_krw(total_krw: float) -> float:
    """원화 총자산 기준 동적 인출률."""
    if total_krw < DYN_THRS[0]:
        return DYN_RATES[0]
    elif total_krw < DYN_THRS[1]:
        return DYN_RATES[1]
    return DYN_RATES[2]


def _irr_bisect(flows_krw, final_eok, years):
    """이분탐색 IRR. 시작 -10억(억단위), 생활비(억단위), 최종(억단위). 반환 %."""
    t  = np.array([0.0] + [j / 252.0 for j, _ in flows_krw] + [years])
    cf = np.array([-10.0] + [v / EOK for _, v in flows_krw] + [final_eok])
    lo, hi = -0.99, 5.0
    for _ in range(100):
        mid = (lo + hi) / 2.0
        if (cf / (1.0 + mid) ** t).sum() > 0:
            lo = mid
        else:
            hi = mid
    return round(mid * 100, 2)


def run_one(tq, closes, ema, dates, rp_daily, peaks, fx, start, mode):
    """
    mode='usd': 생활비를 달러 기준으로 결정 → 원화 환산
    mode='krw': 생활비를 원화 기준으로 결정
    공통: 시작 달러 = 원화 10억 / 시작 환율
    결과: 모두 원화 단위
    """
    n       = len(closes)
    sim_len = n - start
    fx0     = fx[start]

    # ── 초기화 ────────────────────────────────────────────────────
    shares       = 0.0
    avg_cost_krw = 0.0   # 평균 취득 원화 단가 (주당)
    cash_usd     = INITIAL_KRW / fx0
    withdrawn_krw = 0.0
    year_gain_krw = 0.0
    tax_due_usd   = 0.0
    cur_year      = dates[start].year
    above         = 0
    pend          = None
    pend_at       = 0
    invested      = True
    peak_krw      = float(INITIAL_KRW)
    max_dd        = 0.0
    flows_krw     = []

    def port_krw(ci):
        return shares * tq[ci] * fx[ci] + cash_usd * fx[ci]

    def buy(amount_usd, ci):
        nonlocal shares, avg_cost_krw, cash_usd
        amount_usd = min(amount_usd, cash_usd)
        if amount_usd <= 0:
            return
        net_usd = amount_usd * (1 - FEE_RATE)
        new_sh  = net_usd / tq[ci]
        cost_krw_per_sh = tq[ci] * fx[ci]
        old_cost = shares * avg_cost_krw
        shares += new_sh
        avg_cost_krw = (old_cost + new_sh * cost_krw_per_sh) / shares if shares > 0 else 0.0
        cash_usd -= amount_usd

    def sell(amount_usd, ci):
        nonlocal shares, cash_usd, year_gain_krw
        amount_usd = min(amount_usd, shares * tq[ci])
        if amount_usd <= 0:
            return
        sold_sh      = amount_usd / tq[ci]
        proceeds_krw = sold_sh * tq[ci] * fx[ci]
        cost_krw     = sold_sh * avg_cost_krw
        year_gain_krw += max(0.0, proceeds_krw - cost_krw)
        shares   -= sold_sh
        if shares < 1e-12:
            shares = 0.0
        cash_usd += amount_usd * (1 - FEE_RATE)

    def sell_all(ci):
        nonlocal shares, cash_usd, year_gain_krw
        if shares <= 0:
            return
        proceeds_krw  = shares * tq[ci] * fx[ci]
        cost_krw      = shares * avg_cost_krw
        year_gain_krw += max(0.0, proceeds_krw - cost_krw)
        cash_usd += shares * tq[ci] * (1 - FEE_RATE)
        shares = 0.0

    # 초기 매수
    buy(cash_usd, start)

    last_mon = None
    for j in range(sim_len):
        ci = start + j
        d  = dates[ci]

        # RP 이자 (세후, 달러 현금)
        rp_net = rp_daily[ci] * (1 - RP_TAX_R)
        cash_usd += cash_usd * rp_net / (1 - RP_TAX_R) * (1 - RP_TAX_R)   # 이미 세후 적용

        # ── 월초 ──────────────────────────────────────────────────
        if (d.year, d.month) != last_mon:
            last_mon = (d.year, d.month)

            # 연초: 전년 양도세 납부 (원화 세액 → 달러 환산)
            if d.year != cur_year:
                tax_krw    = max(0.0, year_gain_krw - DEDUCTION) * TAX_RATE
                tax_due_usd += tax_krw / fx[ci]
                year_gain_krw = 0.0
                cur_year   = d.year
            if tax_due_usd > 0:
                need_usd = min(tax_due_usd, cash_usd + shares * tq[ci])
                if cash_usd < need_usd:
                    sell((need_usd - cash_usd) / (1 - FEE_RATE), ci)
                pay = min(tax_due_usd, cash_usd)
                cash_usd -= pay
                tax_due_usd -= pay

            # 생활비 인출 (첫날 제외)
            if j > 0:
                tot_krw  = port_krw(ci)
                if mode == "usd":
                    # 달러 기준: 달러 포트 × 인출률 → 달러 생활비
                    tot_usd  = shares * tq[ci] + cash_usd
                    rate     = dyn_rate_krw(tot_usd * fx[ci])   # 비교 공정성: 원화 환산 포트로 기준
                    living_usd = tot_usd * rate
                    living_krw = living_usd * fx[ci]
                else:
                    # 원화 기준: 원화 포트 × 인출률 → 원화 생활비
                    rate     = dyn_rate_krw(tot_krw)
                    living_krw = tot_krw * rate
                    living_usd = living_krw / fx[ci]

                if cash_usd < living_usd:
                    sell((living_usd - cash_usd) / (1 - FEE_RATE), ci)
                actual_usd  = min(living_usd, cash_usd)
                actual_krw  = actual_usd * fx[ci]
                cash_usd   -= actual_usd
                withdrawn_krw += actual_krw
                flows_krw.append((j, actual_krw))

        # ── 신호 ────────────────────────────────────────────────
        e = ema[ci]
        if not np.isnan(e) and e > 0:
            sell_sig = closes[ci] < peaks[ci] * (1 - TRAIL_THR)
            if pend is None and invested and sell_sig:
                pend, pend_at = "sell", j + 1
            if not invested:
                above = (above + 1) if closes[ci] > e else 0
                if above >= TIME_ABOVE:
                    pend, pend_at = "buy", j + 1
                    above = 0
            if pend is not None and j >= pend_at:
                if pend == "sell" and invested:
                    sell_all(ci);  invested = False
                elif pend == "buy" and not invested:
                    buy(cash_usd, ci);  invested = True
                pend = None

        # ── 낙폭 추적 ─────────────────────────────────────────
        v = port_krw(ci)
        peak_krw = max(peak_krw, v)
        if peak_krw > 0:
            max_dd = max(max_dd, (peak_krw - v) / peak_krw)

    # ── 결과 ─────────────────────────────────────────────────────
    final_krw = port_krw(start + sim_len - 1)
    final_eok = final_krw / EOK
    wd_eok    = withdrawn_krw / EOK
    yrs       = sim_len / 252.0
    irr       = _irr_bisect(flows_krw, final_eok, yrs)

    return {
        "final_eok": round(final_eok, 2),
        "wd_eok":    round(wd_eok, 2),
        "dd":        round(max_dd * 100, 1),
        "yrs":       round(yrs, 2),
        "irr":       irr,
        "fx_start":  round(float(fx0), 1),
    }


def _job(args):
    tq, closes, ema, dates, rp_daily, peaks, fx, start = args
    try:
        u = run_one(tq, closes, ema, dates, rp_daily, peaks, fx, start, mode="usd")
        k = run_one(tq, closes, ema, dates, rp_daily, peaks, fx, start, mode="krw")
        return u, k
    except Exception as e:
        return {"error": str(e)}, {"error": str(e)}


def main():
    t0 = time.time()
    print("데이터 로드 중...", flush=True)

    tq, qq, closes, ema, dates, rp_daily, rsi, peaks = E.load_data()
    fx = load_fx(dates)

    monthly = E.get_monthly_starts(dates)
    cohort_starts = [i for i in monthly if dates[i] >= pd.Timestamp(START_DATE)]
    print(f"코호트: {len(cohort_starts)}개  ({dates[cohort_starts[0]].date()} ~ {dates[cohort_starts[-1]].date()})")

    args_list = [(tq, closes, ema, dates, rp_daily, peaks, fx, s) for s in cohort_starts]

    print("시뮬 중 (달러·원화 병렬)...", flush=True)
    with mp.Pool(min(mp.cpu_count(), 8)) as pool:
        results = pool.map(_job, args_list)

    rows = []
    for i, s in enumerate(cohort_starts):
        u, k = results[i]
        if "error" in u or "error" in k:
            continue
        rows.append({
            "s":       dates[s].strftime("%Y-%m-%d"),
            "usd":     u,
            "krw":     k,
            "fx_start": u["fx_start"],
        })

    # ── 통계 ────────────────────────────────────────────────────
    def pct(lst, p):
        return round(float(np.percentile(lst, p)), 2) if lst else None

    valid = [r for r in rows if r["usd"]["irr"] is not None and r["krw"]["irr"] is not None]
    u_irr = [r["usd"]["irr"] for r in valid]
    k_irr = [r["krw"]["irr"] for r in valid]
    u_fin = [r["usd"]["final_eok"] for r in valid]
    k_fin = [r["krw"]["final_eok"] for r in valid]
    u_dd  = [r["usd"]["dd"] for r in valid]
    k_dd  = [r["krw"]["dd"] for r in valid]

    stats = {
        "usd": {
            "irr_median":       pct(u_irr, 50), "irr_p10": pct(u_irr, 10), "irr_p90": pct(u_irr, 90),
            "final_median_eok": pct(u_fin, 50),
            "dd_median":        pct(u_dd, 50),
        },
        "krw": {
            "irr_median":       pct(k_irr, 50), "irr_p10": pct(k_irr, 10), "irr_p90": pct(k_irr, 90),
            "final_median_eok": pct(k_fin, 50),
            "dd_median":        pct(k_dd, 50),
        },
    }

    result = {
        "meta": {
            "period":      f"{START_DATE[:7]} ~ {dates[-1].strftime('%Y-%m')}",
            "n_cohorts":   len(rows),
            "initial_krw": INITIAL_KRW,
            "strategy":    "RULE25 (52주 고점 -25% 매도, EMA200 위 15일 재매수, 동적인출률 0.3/0.5/0.7%)",
            "price_mode":  "with_costs (스왑금리 0.5%/yr + 운용보수 0.88%/yr)",
            "note_usd":    "달러 기준: 원화 10억→시작환율 달러 변환, 생활비=달러 포트 × 인출률",
            "note_krw":    "원화 기준: 동일 달러 시작, 생활비=원화 포트(달러×환율) × 인출률",
            "note_1997":   "1997년 이전 시작 코호트는 관리변동환율 구간 포함",
        },
        "stats": stats,
        "rows":  rows,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\n=== 완료: {len(rows)}개 ({time.time()-t0:.0f}초) ===")
    print(f"달러기준  IRR중간:{stats['usd']['irr_median']}%  하위10%:{stats['usd']['irr_p10']}%  최종중간:{stats['usd']['final_median_eok']}억  최대낙폭중간:{stats['usd']['dd_median']}%")
    print(f"원화기준  IRR중간:{stats['krw']['irr_median']}%  하위10%:{stats['krw']['irr_p10']}%  최종중간:{stats['krw']['final_median_eok']}억  최대낙폭중간:{stats['krw']['dd_median']}%")
    print(f"저장: {OUT}")


if __name__ == "__main__":
    main()
