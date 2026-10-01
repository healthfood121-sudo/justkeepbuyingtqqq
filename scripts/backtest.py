"""
justkeepbuyingtqqq — 백테스트 스크립트
NDX 1x/2x/3x + SPX500 1x, A/B/C 전략, 10억/20억 목표
"""

import numpy as np
import pandas as pd
import openpyxl
import time
import os

# ===== 파라미터 =====
DAILY_INVEST  = 200_000          # 일 20만원
CAP_INVEST    = 250_000_000      # A전략 한도: 2.5억
LUMP_SUM      = 250_000_000      # B전략 거치금: 2.5억
N_INVEST_DAYS = CAP_INVEST // DAILY_INVEST  # 1250일

DATA_DIR = "D:/justkeepbuyingtqqq/data/"
OUT_DIR  = "D:/justkeepbuyingtqqq/results/"


# ===== 1. 데이터 로드 =====

def load_ndx(filepath):
    """NDX 일별 종가 로드 + 1985-10-01 스플라이스 보정"""
    df = pd.read_csv(filepath, parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    # 스플라이스 보정: 1985-10-01에 가짜 -60% 급락 존재
    mask = df["Date"] == "1985-10-01"
    if mask.any():
        i = df.index[mask][0]
        scale = df.loc[i - 1, "Close"] / df.loc[i, "Close"]
        df.loc[i:, "Close"] *= scale
        print(f"  NDX splice 보정: index={i}, scale={scale:.4f}")
    return df

def load_sp500(filepath):
    df = pd.read_csv(filepath, parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    return df

def make_synthetic(df, leverage):
    """일별 수익률 × leverage → 합성가격 (누적곱)"""
    ret = df["Close"].pct_change().fillna(0).values
    return 100.0 * np.cumprod(1.0 + ret * leverage)

def get_monthly_starts(dates_pd):
    """매월 첫 거래일 인덱스 목록 반환"""
    ym = dates_pd.to_period("M")
    seen = {}
    idxs = []
    for i, p in enumerate(ym):
        if p not in seen:
            seen[p] = True
            idxs.append(i)
    return idxs


# ===== 2. 단일 코호트 백테스트 =====

def backtest_cohort(prices, start_i, strategy, target, dates_pd):
    """
    prices: 전체 합성가격 numpy array
    start_i: 코호트 시작 인덱스
    strategy: 'A', 'B', 'C'
      A — 매일 20만원, 한도 없이 계속 (JUST KEEP BUYING)
      B — 매일 20만원, 누적 투자액 2.5억 도달 시 중단
      C — 거치 2.5억 + 이후 매일 20만원 계속
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
        # 거치 2.5억 (day 0) + 이후 매일 20만원 계속
        inv = np.full(n, float(DAILY_INVEST))
        inv[0] = LUMP_SUM  # 첫날은 거치금만

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


# ===== 6. 검증: golden dataset 대조 =====

def validate_golden(prices_ndx2x, dates_pd):
    """
    mcv_ndx_2x_monthly_10b.json (A전략, NDX 2x, 10억)과 대조
    years_to_target 절대 오차 평균이 0.1년 미만이면 통과
    """
    import json
    golden_path = DATA_DIR + "mcv_ndx_2x_monthly_10b.json"
    if not os.path.exists(golden_path):
        print("  [검증 SKIP] golden JSON 없음")
        return

    with open(golden_path, encoding="utf-8") as f:
        golden = json.load(f)

    golden_df = pd.DataFrame(golden)
    golden_df["start_date"] = pd.to_datetime(golden_df["start_date"]).dt.normalize()
    golden_df = golden_df[golden_df["status"] == "completed"].copy()

    # 내 결과 재계산 (A전략, 10억)
    TARGET = 1_000_000_000
    cohort_idxs = get_monthly_starts(dates_pd)
    my_rows = []
    for ci in cohort_idxs:
        r = backtest_cohort(prices_ndx2x, ci, "A", TARGET, dates_pd)
        if r and r["status"] == "completed":
            my_rows.append({
                "start_date": dates_pd[ci].normalize(),
                "years_my":   r["years_to_target"],
            })
    my_df = pd.DataFrame(my_rows)

    merged = pd.merge(golden_df, my_df, on="start_date", how="inner")
    if len(merged) == 0:
        print("  [검증 FAIL] 매칭 코호트 없음")
        return

    merged["err"] = (merged["years_to_target"] - merged["years_my"]).abs()
    mean_err = merged["err"].mean()
    max_err  = merged["err"].max()
    print(f"  [검증] {len(merged)}개 코호트 대조 → 평균 오차 {mean_err:.4f}년, 최대 오차 {max_err:.4f}년")
    if mean_err < 0.1:
        print("  [검증 PASS] ✓")
    else:
        print("  [검증 WARN] 오차 큼 — 스플라이스 보정 또는 전략 파라미터 확인 필요")


# ===== 7. 메인 =====

def main():
    t0 = time.time()
    print("=" * 50)
    print("justkeepbuyingtqqq 백테스트")
    print("=" * 50)

    # 데이터 로드
    print("\n[데이터 로드]")
    ndx_df   = load_ndx(DATA_DIR + "ndx_1971_now.csv")
    sp5_df   = load_sp500(DATA_DIR + "sp500_1927_now.csv")
    ndx_dates = pd.DatetimeIndex(ndx_df["Date"])
    sp5_dates = pd.DatetimeIndex(sp5_df["Date"])
    print(f"  NDX:   {len(ndx_df)}행, {ndx_dates[0].date()} ~ {ndx_dates[-1].date()}")
    print(f"  SP500: {len(sp5_df)}행, {sp5_dates[0].date()} ~ {sp5_dates[-1].date()}")

    # NDX 합성가격
    ndx1x = make_synthetic(ndx_df, 1)
    ndx2x = make_synthetic(ndx_df, 2)
    ndx3x = make_synthetic(ndx_df, 3)
    sp51x = make_synthetic(sp5_df, 1)

    # Golden dataset 검증
    print("\n[Golden 검증 — NDX 2x A전략 10억]")
    validate_golden(ndx2x, ndx_dates)

    # 백테스트 실행 목록
    jobs = [
        # (prices, dates, label,          target,        outfile)
        (ndx1x, ndx_dates, "NDX 1x 10억",  1_000_000_000, OUT_DIR + "mcv_1x_compare_A_B_C_10b.xlsx"),
        (ndx1x, ndx_dates, "NDX 1x 20억",  2_000_000_000, OUT_DIR + "mcv_1x_compare_A_B_C_20b.xlsx"),
        (ndx2x, ndx_dates, "NDX 2x 10억",  1_000_000_000, OUT_DIR + "mcv_2x_compare_A_B_C_10b.xlsx"),
        (ndx2x, ndx_dates, "NDX 2x 20억",  2_000_000_000, OUT_DIR + "mcv_2x_compare_A_B_C_20b.xlsx"),
        (ndx3x, ndx_dates, "NDX 3x 10억",  1_000_000_000, OUT_DIR + "mcv_3x_compare_A_B_C_10b.xlsx"),
        (ndx3x, ndx_dates, "NDX 3x 20억",  2_000_000_000, OUT_DIR + "mcv_3x_compare_A_B_C_20b.xlsx"),
        (sp51x, sp5_dates, "SP500 1x 10억", 1_000_000_000, OUT_DIR + "mcv_spx500_1x_compare_A_B_C_10b.xlsx"),
        (sp51x, sp5_dates, "SP500 1x 20억", 2_000_000_000, OUT_DIR + "mcv_spx500_1x_compare_A_B_C_20b.xlsx"),
    ]

    for prices, dates, label, target, outfile in jobs:
        t1 = time.time()
        print(f"\n[{label}]")
        df_data = run_all_cohorts(prices, dates, target)
        df_dist = make_distribution(df_data)
        df_cdf  = make_cdf(df_data)
        save_excel(df_data, df_dist, df_cdf, outfile)

        # 통계 출력
        n = len(df_data)
        for s in ["A", "B", "C"]:
            comp = (df_data[f"status_{s}"] == "completed").sum()
            vals = df_data[df_data[f"status_{s}"] == "completed"][f"years_{s}"].dropna()
            if comp > 0:
                print(f"  {s}: {comp}/{n} 완료  "
                      f"평균 {vals.mean():.2f}년  "
                      f"중간값 {vals.median():.2f}년  "
                      f"최장 {vals.max():.2f}년")
            else:
                print(f"  {s}: 0/{n} 완료")
        print(f"  → {outfile.split('/')[-1]}  ({time.time()-t1:.1f}초)")

    print(f"\n=== 전체 완료 ({time.time()-t0:.1f}초) ===")


if __name__ == "__main__":
    main()
