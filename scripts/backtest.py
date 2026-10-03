"""
justkeepbuyingtqqq — 백테스트 스크립트
NDX 1x/2x/3x + SPX500 1x, A/B/C 전략, 10억/20억 목표

모드:
  standard   — 운용보수만 반영 (기존 방식)
  with_costs — 운용보수 + 스왑금리비용 반영
"""

import sys
import numpy as np
import pandas as pd
import openpyxl
import time
import os
from pathlib import Path

# data_loader 경로 추가
sys.path.insert(0, str(Path(__file__).parent))
import data_loader
from data_loader import load_ndx_prices, load_sp500_prices, get_monthly_starts

# ===== 파라미터 =====
DAILY_INVEST  = 200_000          # 일 20만원
CAP_INVEST    = 250_000_000      # A전략 한도: 2.5억
LUMP_SUM      = 250_000_000      # B전략 거치금: 2.5억
N_INVEST_DAYS = CAP_INVEST // DAILY_INVEST  # 1250일
# C전략 거치금 분할 기간 — 2026-10 스왑금리 반영 재검증으로 3년(36) → 5년(60)
# (accumulation_split_recheck.py: 5년부터 10년 넘게 걸리는 경우 0, 최악 9.0년, 비용 변화에도 안정)
C_SPLIT_MONTHS = 60

ROOT     = Path(__file__).resolve().parent.parent
DATA_DIR = str(ROOT / "data") + "/"
OUT_DIR  = str(ROOT / "results") + "/"
data_loader.DATA_DIR = ROOT / "data"
data_loader.FED_PATH = ROOT / "data/fed_funds_rate.json"


# ===== SP500 합성가격 (비용 없음 — 비교용) =====

def make_synthetic_sp500(df):
    """SP500 단순 비용 없는 합성가격 (비교 기준용)"""
    ret = df["Close"].pct_change().fillna(0).values
    return 100.0 * np.cumprod(1.0 + ret)


# ===== 2. 단일 코호트 백테스트 =====

def backtest_cohort(prices, start_i, strategy, target, dates_pd):
    """
    prices: 전체 합성가격 numpy array
    start_i: 코호트 시작 인덱스
    strategy: 'A', 'B', 'C'
      A — 매일 20만원, 한도 없이 계속 (JUST KEEP BUYING)
      B — 매일 20만원, 누적 투자액 2.5억 도달 시 중단
      C — 매일 20만원 + 거치금 2.5억을 C_SPLIT_MONTHS개월(5년) 월 분할 (매월 첫 거래일에 LUMP_SUM/C_SPLIT_MONTHS 추가)
    target: 목표 금액 (예: 1_000_000_000)
    returns: dict
    """
    n = len(prices) - start_i
    if n <= 0:
        return None

    px = prices[start_i : start_i + n]

    if strategy == "A":
        # 매일 20만원, 한도 없음 (JUST KEEP BUYING)
        inv = np.full(n, float(DAILY_INVEST))

    elif strategy == "B":
        # 매일 20만원, 누적 투자액 2.5억 도달 시 중단
        k = min(n, N_INVEST_DAYS)
        inv = np.zeros(n)
        inv[:k] = DAILY_INVEST

    else:  # C
        # 5년 월 분할 거치: 매월 첫 거래일에 LUMP_SUM/C_SPLIT_MONTHS 추가
        inv = np.full(n, float(DAILY_INVEST))
        monthly_chunk = LUMP_SUM / C_SPLIT_MONTHS
        month_starts = get_monthly_starts(dates_pd[start_i : start_i + n])
        for ms in month_starts[:C_SPLIT_MONTHS]:
            inv[ms] += monthly_chunk

    shares_per_day = inv / px
    cum_shares     = np.cumsum(shares_per_day)
    port_value     = cum_shares * px

    hit = port_value >= target
    if hit.any():
        hi = int(np.argmax(hit))
        end_dt = dates_pd[start_i + hi]
        days   = (end_dt - dates_pd[start_i]).days
        return {
            "status":               "completed",
            "end_date":             end_dt,
            "days_to_target":       days,
            "years_to_target":      days / 365.25,
            "final_value":          float(port_value[hi]),
            "accumulated_investment": float(inv[:hi + 1].sum()),
        }
    else:
        return {
            "status":               "in_progress",
            "end_date":             dates_pd[-1],
            "days_to_target":       None,
            "years_to_target":      None,
            "final_value":          float(port_value[-1]),
            "accumulated_investment": float(inv.sum()),
        }


# ===== 3. 전체 코호트 루프 =====

def run_all_cohorts(prices, dates_pd, target):
    cohort_idxs = get_monthly_starts(dates_pd)
    rows = []
    for ci in cohort_idxs:
        row = {"start_date": dates_pd[ci]}
        for s in ["A", "B", "C"]:
            r = backtest_cohort(prices, ci, s, target, dates_pd)
            if r:
                row[f"status_{s}"]   = r["status"]
                row[f"years_{s}"]    = r["years_to_target"]
                row[f"final_{s}"]    = int(r["final_value"]) if r["final_value"] is not None else None
                row[f"invested_{s}"] = int(r["accumulated_investment"])
        rows.append(row)
    return pd.DataFrame(rows)


# ===== 4. distribution / cdf 생성 =====

def make_distribution(df):
    total = len(df)
    all_years = []
    for s in ["A", "B", "C"]:
        col = df[df[f"status_{s}"] == "completed"][f"years_{s}"].dropna()
        if len(col):
            all_years.append(col.max())
    if not all_years:
        return pd.DataFrame(columns=["years_bin", "A_%", "B_%", "C_%"])
    max_y = max(all_years)

    bins = np.arange(0.0, max_y + 0.5, 0.5)
    rows = []
    for b in bins:
        row = {"years_bin": round(float(b), 1)}
        for s in ["A", "B", "C"]:
            col = df[df[f"status_{s}"] == "completed"][f"years_{s}"].dropna()
            cnt = ((col >= b) & (col < b + 0.5)).sum()
            row[f"{s}_%"] = round(cnt / total * 100, 2)
        rows.append(row)
    return pd.DataFrame(rows)

def make_cdf(df):
    total = len(df)
    all_years = []
    for s in ["A", "B", "C"]:
        col = df[df[f"status_{s}"] == "completed"][f"years_{s}"].dropna()
        if len(col):
            all_years.append(col.max())
    if not all_years:
        return pd.DataFrame(columns=["elapsed_years", "A_%", "B_%", "C_%"])
    max_y = int(max(all_years)) + 1

    rows = []
    for yr in range(1, max_y + 1):
        row = {"elapsed_years": f"{yr}년"}
        for s in ["A", "B", "C"]:
            col = df[f"years_{s}"].dropna()
            cnt = (col <= yr).sum()
            row[f"{s}_%"] = round(cnt / total * 100, 1)
        rows.append(row)
    return pd.DataFrame(rows)


# ===== 5. 엑셀 저장 =====

DATA_COLS = [
    "start_date",
    "status_A", "years_A", "final_A", "invested_A",
    "status_B", "years_B", "final_B", "invested_B",
    "status_C", "years_C", "final_C", "invested_C",
]

def save_excel(df_data, df_dist, df_cdf, filepath):
    wb = openpyxl.Workbook()

    # --- data 시트 ---
    ws = wb.active
    ws.title = "data"
    ws.append(DATA_COLS)
    for _, r in df_data.iterrows():
        ws.append([r.get(c) for c in DATA_COLS])

    # --- distribution 시트 ---
    ws2 = wb.create_sheet("distribution")
    ws2.append(["years_bin", "A_%", "B_%", "C_%"])
    for _, r in df_dist.iterrows():
        ws2.append([r["years_bin"], r["A_%"], r["B_%"], r["C_%"]])

    # --- cdf 시트 ---
    ws3 = wb.create_sheet("cdf")
    ws3.append(["elapsed_years", "A_%", "B_%", "C_%"])
    for _, r in df_cdf.iterrows():
        ws3.append([r["elapsed_years"], r["A_%"], r["B_%"], r["C_%"]])

    wb.save(filepath)


# ===== 6. 메인 =====

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["standard", "with_costs", "both"],
                        default="standard",
                        help="가격 계산 모드 (default: standard)")
    args = parser.parse_args()

    modes = ["standard", "with_costs"] if args.mode == "both" else [args.mode]

    t0 = time.time()
    print("=" * 55)
    print("justkeepbuyingtqqq 백테스트")
    print("=" * 55)

    # SP500은 모드 무관
    sp5 = load_sp500_prices()
    sp51x = make_synthetic_sp500(
        pd.DataFrame({"Close": sp5["closes"]})
    )
    sp5_dates = sp5["dates"]

    for mode in modes:
        suffix = "_v2" if mode == "with_costs" else ""
        print(f"\n{'='*20} mode={mode} {'='*20}")

        # NDX 데이터 로드 (모드별 합성가격)
        d = load_ndx_prices(mode)
        ndx_dates = d["dates"]
        ndx1x = d["ndx1x"]
        ndx2x = d["ndx2x"]
        ndx3x = d["ndx3x"]

        print(f"  NDX:   {len(ndx_dates)}거래일, {ndx_dates[0].date()} ~ {ndx_dates[-1].date()}")
        print(f"  TQQQ 최종값: {ndx3x[-1]:.1f}  ({mode})")

        # 백테스트 실행 목록
        jobs = [
            (ndx1x, ndx_dates, f"NDX 1x 10억",  1_000_000_000, OUT_DIR + f"mcv_1x_compare_A_B_C_10b{suffix}.xlsx"),
            (ndx1x, ndx_dates, f"NDX 1x 20억",  2_000_000_000, OUT_DIR + f"mcv_1x_compare_A_B_C_20b{suffix}.xlsx"),
            (ndx2x, ndx_dates, f"NDX 2x 10억",  1_000_000_000, OUT_DIR + f"mcv_2x_compare_A_B_C_10b{suffix}.xlsx"),
            (ndx2x, ndx_dates, f"NDX 2x 20억",  2_000_000_000, OUT_DIR + f"mcv_2x_compare_A_B_C_20b{suffix}.xlsx"),
            (ndx3x, ndx_dates, f"NDX 3x 10억",  1_000_000_000, OUT_DIR + f"mcv_3x_compare_A_B_C_10b{suffix}.xlsx"),
            (ndx3x, ndx_dates, f"NDX 3x 20억",  2_000_000_000, OUT_DIR + f"mcv_3x_compare_A_B_C_20b{suffix}.xlsx"),
        ]
        # SP500은 suffix 무관하게 한 번만
        if mode == modes[0]:
            jobs += [
                (sp51x, sp5_dates, "SP500 1x 10억", 1_000_000_000, OUT_DIR + "mcv_spx500_1x_compare_A_B_C_10b.xlsx"),
                (sp51x, sp5_dates, "SP500 1x 20억", 2_000_000_000, OUT_DIR + "mcv_spx500_1x_compare_A_B_C_20b.xlsx"),
            ]

        for prices, dates, label, target, outfile in jobs:
            t1 = time.time()
            print(f"\n  [{label}]")
            df_data = run_all_cohorts(prices, dates, target)
            df_dist = make_distribution(df_data)
            df_cdf  = make_cdf(df_data)
            save_excel(df_data, df_dist, df_cdf, outfile)

            n = len(df_data)
            for s in ["A", "B", "C"]:
                comp = (df_data[f"status_{s}"] == "completed").sum()
                vals = df_data[df_data[f"status_{s}"] == "completed"][f"years_{s}"].dropna()
                if comp > 0:
                    print(f"    {s}: {comp}/{n} 완료  "
                          f"평균 {vals.mean():.2f}년  "
                          f"중간값 {vals.median():.2f}년  "
                          f"최장 {vals.max():.2f}년")
                else:
                    print(f"    {s}: 0/{n} 완료")
            print(f"    → {outfile.split('/')[-1]}  ({time.time()-t1:.1f}초)")

    print(f"\n=== 전체 완료 ({time.time()-t0:.1f}초) ===")


if __name__ == "__main__":
    main()
