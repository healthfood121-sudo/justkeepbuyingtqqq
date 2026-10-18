"""
panic_sell_backtest.py

적립 중 패닉셀 시나리오 백테스트

DCA 적립 중 큰 하락이 오면 어떻게 되나?
  HOLD      : 계속 매수 (기준선)
  QUIT30    : NDX 진입 후 최고점 대비 -30% → 전량 매도 + 영구 이탈
  QUIT50    : NDX 진입 후 최고점 대비 -50% → 전량 매도 + 영구 이탈
  BACK30_12 : -30% 매도 → 12개월 후 전액 재투자 + DCA 재개
  BACK30_24 : -30% 매도 → 24개월 후 전액 재투자 + DCA 재개
  BACK50_12 : -50% 매도 → 12개월 후 전액 재투자 + DCA 재개
  BACK50_24 : -50% 매도 → 24개월 후 전액 재투자 + DCA 재개

패닉 트리거: 진입 시점부터의 NDX 최고점 대비 하락률
재개 방식: 보유 현금(매도금 + 대기 중 적립분) 전액 TQQQ 일시 매수 + DCA 재개
목표: 10억 달성 여부 + 달성 시 소요 기간

결과 파일: web/public/data/panic_sell_backtest.json
"""

import json, time
import numpy as np
import pandas as pd
import multiprocessing as mp
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

_ROOT    = Path(__file__).resolve().parent.parent
DATA_DIR = _ROOT / "data"
OUT_PATH = _ROOT / "web/public/data/panic_sell_backtest.json"

DAILY_BUY   = 200_000          # 일 20만원 DCA
GOAL        = 1_000_000_000    # 목표 10억
EXP_3X      = 0.0088           # TQQQ 운용보수
SWAP_SPREAD = 0.005            # JPMorgan 424B2: SOFR+0.50%/년
MAX_YEARS   = 35               # 최대 시뮬레이션 기간

# 월별 스냅샷을 저장할 주요 코호트
SAMPLE_COHORTS = [
    "2000-01",   # 닷컴버블 정점 직전 진입
    "1999-01",   # 닷컴버블 상승기 진입
    "2007-10",   # GFC 직전 진입
    "2002-10",   # 닷컴 바닥 이후 진입
    "2008-11",   # GFC 바닥 이후 진입
]

@dataclass
class Strategy:
    name:           str
    desc:           str
    quit_threshold: float      # NDX 진입후 최고 대비 하락률 트리거 (0 = 적용 안 함)
    wait_months:    int        # 0 = 영구 이탈, 12/24 = 재개 대기 개월
    trigger:        bool = field(init=False)

    def __post_init__(self):
        self.trigger = self.quit_threshold > 0.0


STRATEGIES = [
    Strategy("HOLD",      "계속 매수",                           0.0,  0),
    Strategy("QUIT30",    "−30% 매도 후 영구 이탈",              0.30, 0),
    Strategy("QUIT50",    "−50% 매도 후 영구 이탈",              0.50, 0),
    Strategy("BACK30_12", "−30% 매도 후 12개월 뒤 재개",         0.30, 12),
    Strategy("BACK30_24", "−30% 매도 후 24개월 뒤 재개",         0.30, 24),
    Strategy("BACK50_12", "−50% 매도 후 12개월 뒤 재개",         0.50, 12),
    Strategy("BACK50_24", "−50% 매도 후 24개월 뒤 재개",         0.50, 24),
]


# ══════════════════════════════════════════════════════════
# 데이터 로드
# ══════════════════════════════════════════════════════════

def load_data():
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    # 1985-10-01 소스 전환 이상치 보정
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    ret = np.diff(closes) / closes[:-1]
    ret = np.insert(ret, 0, 0.0)

    with open(DATA_DIR / "fed_funds_rate.json", encoding="utf-8") as fh:
        fed_raw = json.load(fh)
    fed_rates = {r["date"][:7]: float(r["rate"]) for r in fed_raw}

    fed_daily = np.array([
        fed_rates.get(f"{d.year}-{d.month:02d}", 3.0) / 100.0 / 252
        for d in dates
    ])

    # TQQQ with_costs (스왑금리 포함)
    f3 = (1.0 + ret * 3.0 - 2.0 * (fed_daily + SWAP_SPREAD / 252.0)) * (1.0 - EXP_3X / 252)
    f3[0] = 1.0
    tqqq = 100.0 * np.cumprod(f3)

    return tqqq, closes, dates


def get_monthly_starts(dates):
    seen, out = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            out.append(i)
    return out


# ══════════════════════════════════════════════════════════
# 단일 코호트 × 단일 전략 시뮬레이션
# ══════════════════════════════════════════════════════════

def run_one(tqqq, closes, dates, start_idx: int, strat: Strategy,
            save_monthly: bool = False):
    """
    Returns:
        completed  : bool
        years      : float (달성 소요 연수, None if not completed)
        final_eok  : float (시뮬 종료 시점 총자산 억)
        invested_eok : float (누적 투입금 억)
        panic_date : str | None (패닉매도 발생일)
        monthly    : list[dict] (save_monthly=True 시)
    """
    n         = len(tqqq)
    max_days  = min(n - start_idx, int(MAX_YEARS * 252))
    start_date = dates[start_idx]

    shares       = 0.0          # 보유 TQQQ 주수
    cash         = 0.0          # 매도 후 보유 현금 (또는 대기 중 적립금)
    invested     = 0.0          # 누적 투입금
    ndx_peak     = closes[start_idx]  # 진입 후 최고점 (NDX)

    panic_done   = False        # 패닉매도 발생 여부
    panic_date   = None
    waiting      = False        # 재개 대기 중
    wait_end_idx = -1           # 재개할 일자 인덱스

    completed    = False
    goal_years   = None

    monthly: list = []
    prev_month   = -1

    for day in range(max_days):
        idx   = start_idx + day
        price = tqqq[idx]       # 오늘의 TQQQ 합성가격
        ndx   = closes[idx]

        # NDX 최고점 업데이트
        if ndx > ndx_peak:
            ndx_peak = ndx

        # ── 재개 체크 ──
        if waiting and idx >= wait_end_idx:
            # 보유 현금 전액 TQQQ 매수
            if cash > 0 and price > 0:
                shares += cash / price
            cash    = 0.0
            waiting = False

        # ── 일일 DCA 매수 ──
        if not panic_done and not waiting:
            invested += DAILY_BUY
            shares   += DAILY_BUY / price
        elif waiting:
            # 대기 중에도 적립은 계속 (현금으로 쌓임)
            cash     += DAILY_BUY
            invested += DAILY_BUY

        # ── 패닉 트리거 체크 ──
        if strat.trigger and not panic_done and not waiting and shares > 0:
            drawdown = (ndx - ndx_peak) / ndx_peak   # 음수
            if drawdown <= -strat.quit_threshold:
                # 전량 매도
                sell_proceeds = shares * price
                shares    = 0.0
                cash      = sell_proceeds
                panic_done = True
                panic_date = dates[idx].strftime("%Y-%m-%d")

                if strat.wait_months > 0:
                    # 재개 대기 모드
                    waiting    = True
                    wait_end_idx = idx + int(strat.wait_months * 21)  # ~21 거래일/월
                # else: 영구 이탈 (cash만 보유)

        # ── 포트폴리오 가치 ──
        port = shares * price + cash
        eok  = port / 1e8   # 억 단위

        # ── 월별 스냅샷 ──
        if save_monthly:
            d = dates[idx]
            if d.month != prev_month:
                prev_month = d.month
                monthly.append({
                    "d":   d.strftime("%Y-%m"),
                    "port": round(eok, 3),
                    "inv":  round(invested / 1e8, 3),
                })

        # ── 목표 달성 체크 ──
        if not completed and shares * price >= GOAL:
            completed  = True
            goal_years = day / 252.0
            if not save_monthly:
                break

    final_port_eok = (shares * tqqq[min(start_idx + max_days - 1, n - 1)] + cash) / 1e8
    inv_eok        = invested / 1e8

    return {
        "completed":   completed,
        "years":       round(goal_years, 3) if goal_years is not None else None,
        "final_eok":   round(final_port_eok, 2),
        "invested_eok": round(inv_eok, 2),
        "panic_date":  panic_date,
        "monthly":     monthly,
    }


# ══════════════════════════════════════════════════════════
# 전체 코호트 처리
# ══════════════════════════════════════════════════════════

def process_batch(args):
    tqqq, closes, dates_list, month_idxs, strat = args
    dates = pd.DatetimeIndex(dates_list)
    results = []
    for mi in month_idxs:
        r = run_one(tqqq, closes, dates, mi, strat, save_monthly=False)
        r["start"] = dates[mi].strftime("%Y-%m")
        results.append(r)
    return results


def run_all(tqqq, closes, dates):
    month_idxs = get_monthly_starts(dates)
    dates_list = [str(d) for d in dates]

    all_results = {}   # strategy_name → list of cohort results

    for strat in STRATEGIES:
        t0 = time.time()
        print(f"  {strat.name} ...", end=" ", flush=True)

        # 병렬 처리 (청크 분할)
        chunk = max(1, len(month_idxs) // mp.cpu_count())
        chunks = [month_idxs[i:i+chunk] for i in range(0, len(month_idxs), chunk)]
        args = [(tqqq, closes, dates_list, ch, strat) for ch in chunks]

        with mp.Pool() as pool:
            batches = pool.map(process_batch, args)

        rows = [r for batch in batches for r in batch]
        all_results[strat.name] = rows
        print(f"{len(rows)}코호트 완료 ({time.time()-t0:.1f}s)")

    return all_results, month_idxs


def compute_summary(all_results):
    summary = {}
    for sname, rows in all_results.items():
        n_total = len(rows)
        completed = [r for r in rows if r["completed"]]
        triggered = [r for r in rows if r["panic_date"] is not None]

        years_arr = np.array([r["years"] for r in completed])
        final_arr = np.array([r["final_eok"] for r in rows])

        summary[sname] = {
            "n_total":       n_total,
            "n_completed":   len(completed),
            "completion_pct": round(len(completed) / n_total * 100, 1),
            "n_triggered":   len(triggered),
            "trigger_pct":   round(len(triggered) / n_total * 100, 1),
            "med_years":     round(float(np.median(years_arr)), 2) if len(years_arr) else None,
            "p10_years":     round(float(np.percentile(years_arr, 90)), 2) if len(years_arr) else None,
            "med_final_eok": round(float(np.median(final_arr)), 1),
            "p10_final_eok": round(float(np.percentile(final_arr, 10)), 1),
        }
    return summary


def collect_samples(tqqq, closes, dates):
    """주요 코호트 월별 스냅샷 수집"""
    samples = {}
    for cohort_key in SAMPLE_COHORTS:
        yr, mo = int(cohort_key[:4]), int(cohort_key[5:7])
        # 해당 연월의 첫 거래일 찾기
        start_idx = None
        for i, d in enumerate(dates):
            if d.year == yr and d.month == mo:
                start_idx = i
                break
        if start_idx is None:
            continue

        cohort_data = {}
        for strat in STRATEGIES:
            r = run_one(tqqq, closes, dates, start_idx, strat, save_monthly=True)
            cohort_data[strat.name] = {
                "completed":   r["completed"],
                "years":       r["years"],
                "panic_date":  r["panic_date"],
                "monthly":     r["monthly"],
            }
        samples[cohort_key] = cohort_data
        print(f"  샘플 {cohort_key} 완료")
    return samples


# ══════════════════════════════════════════════════════════
# 메인
# ══════════════════════════════════════════════════════════

def main():
    print("데이터 로드 중...")
    tqqq, closes, dates = load_data()
    print(f"  NDX 데이터: {len(dates)}일 ({dates[0].date()} ~ {dates[-1].date()})")

    print("\n전체 코호트 실행 중...")
    all_results, month_idxs = run_all(tqqq, closes, dates)

    print("\n요약 통계 계산 중...")
    summary = compute_summary(all_results)

    print("\n주요 코호트 월별 스냅샷 수집 중...")
    samples = collect_samples(tqqq, closes, dates)

    # 전략별 코호트 요약 (스냅샷 제외한 숫자만)
    rows_export = {}
    for sname, rows in all_results.items():
        rows_export[sname] = [
            {
                "s":     r["start"],
                "done":  r["completed"],
                "years": r["years"],
                "fin":   r["final_eok"],
                "inv":   r["invested_eok"],
                "pd":    r["panic_date"],
            }
            for r in rows
        ]

    out = {
        "meta": {
            "generated":    pd.Timestamp.now().strftime("%Y-%m-%d"),
            "daily_buy":    DAILY_BUY,
            "goal":         GOAL,
            "max_years":    MAX_YEARS,
            "with_costs":   True,
            "swap_spread":  SWAP_SPREAD,
            "exp_3x":       EXP_3X,
            "strategies": {s.name: s.desc for s in STRATEGIES},
        },
        "summary":  summary,
        "rows":     rows_export,
        "samples":  samples,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"\n저장 완료: {OUT_PATH} ({size_kb:.0f} KB)")

    print("\n=== 요약 ===")
    for sname, s in summary.items():
        print(f"  {sname:12s}  완료율 {s['completion_pct']:5.1f}%  "
              f"패닉발생 {s['trigger_pct']:5.1f}%  "
              f"중앙소요 {str(s['med_years'])+'년':8s}  "
              f"중앙최종 {s['med_final_eok']:.0f}억")


if __name__ == "__main__":
    main()
