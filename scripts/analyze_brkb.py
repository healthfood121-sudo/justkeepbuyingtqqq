"""
analyze_brkb.py  —  버크셔 해서웨이(BRK-B) 롤링 CAGR 분석
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from rolling_analysis import RollingAnalyzer, summary_stats
import pandas as pd
from pathlib import Path

OUT = Path(__file__).parent / "data" / "rolling"
OUT.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────
# 1. 데이터 다운로드 & 계산
# BRK-B: 1996년 5월 9일 상장
# 2010년 1월 21일 50:1 주식 분할 (BRK-A 1주 = BRK-B 1500주)
# 배당 없음
# ──────────────────────────────────
az = RollingAnalyzer("BRK-B", benchmark="^SP500TR")

# 10년 연말 매수
df10a = az.rolling(years=10, freq="annual")
# 5년 연말 매수 (손실 구간 확인용)
df5a  = az.rolling(years=5,  freq="annual")
# 10년 월말 매수
df10m = az.rolling(years=10, freq="monthly")

# CSV 저장
az.save_csv(df10a, OUT / "BRKB_10y_annual.csv")
az.save_csv(df5a,  OUT / "BRKB_5y_annual.csv")
az.save_csv(df10m, OUT / "BRKB_10y_monthly.csv")

# 전체 기간
fp = az.full_period()

# ──────────────────────────────────
# 2. 요약 통계
# ──────────────────────────────────
stats10a = summary_stats(df10a, label="BRK-B 10년 연말")
stats5a  = summary_stats(df5a,  label="BRK-B 5년 연말")

print("\n" + "═" * 70)
print("■ BRK-B 10년 롤링 CAGR — 연말 매수 (완결 구간)")
print("═" * 70)

comp = df10a[df10a["is_complete"]].copy()
prog = df10a[~df10a["is_complete"]].copy()

print(f"\n{'매수연도':>6}  {'평가연도':>6}  {'CAGR':>8}  {'배수':>6}  {'S&P500':>8}  {'차이(pp)':>8}  {'이겼나':>5}")
print("-" * 68)
for _, r in comp.iterrows():
    buy_yr  = r["buy_date"].year
    sell_yr = r["sell_date"].year
    cagr    = r["cagr"]
    mult    = r["multiple"]
    bc      = r.get("bench_cagr", float("nan"))
    diff    = r.get("diff_pct", float("nan"))
    win     = "✓" if (not pd.isna(diff) and diff > 0) else "✗"
    bc_str  = f"{bc:7.1f}%" if not pd.isna(bc) else "   —  "
    diff_str = f"{diff:+7.1f}" if not pd.isna(diff) else "      "
    print(f"{buy_yr:>6}  {sell_yr:>6}  {cagr:>7.1f}%  {mult:>5.1f}x  {bc_str}  {diff_str}  {win:>5}")

if len(prog) > 0:
    print("\n▲ 진행 중 (아직 10년 미완료):")
    for _, r in prog.iterrows():
        buy_yr = r["buy_date"].year
        sell_dt = r["sell_date"].strftime("%Y-%m-%d")
        cagr = r["cagr"]
        mult = r["multiple"]
        yrs = r["years_actual"]
        bc = r.get("bench_cagr", float("nan"))
        diff = r.get("diff_pct", float("nan"))
        bc_str = f"{bc:7.1f}%" if not pd.isna(bc) else "   —  "
        diff_str = f"{diff:+7.1f}" if not pd.isna(diff) else "      "
        print(f"  {buy_yr}년 말 → {sell_dt} ({yrs:.1f}년): {cagr:.1f}%  {mult:.2f}x  벤치마크={bc_str}  차이={diff_str}")

print("\n" + "─" * 50)
print(f"완결 구간 수  : {stats10a['n_complete']}개")
print(f"최저 CAGR    : {stats10a['min_cagr']}%  ({stats10a['min_buy']}년 말 매수)")
print(f"중앙값 CAGR  : {stats10a['median_cagr']}%")
print(f"평균 CAGR    : {stats10a['mean_cagr']}%")
print(f"최고 CAGR    : {stats10a['max_cagr']}%  ({stats10a['max_buy']}년 말 매수)")
print(f"연 10% 초과  : {stats10a['pct_over_10']}%")
print(f"연 15% 초과  : {stats10a['pct_over_15']}%")
print(f"연 20% 초과  : {stats10a['pct_over_20']}%")
print(f"손실 구간    : {stats10a['n_losses']}개")
if "n_beat_bench" in stats10a:
    print(f"시장 이긴 구간: {stats10a['n_beat_bench']} / {stats10a['n_beat_bench_total']}개")

print("\n" + "─" * 50)
print(f"전체 기간 CAGR: {fp['cagr']}%  ({fp['start_date']} ~ {fp['end_date']}, {fp['years']}년)")
print(f"전체 기간 배수: {fp['multiple']}x  ({fp['start_price']:.4f} → {fp['end_price']:.2f})")

# ──────────────────────────────────
# 3. 5년 손실 구간
# ──────────────────────────────────
print("\n" + "═" * 50)
print("■ BRK-B 5년 롤링 — 손실 구간")
print("─" * 50)
comp5 = df5a[df5a["is_complete"] & (df5a["cagr"] < 0)]
if len(comp5) == 0:
    print("  없음")
else:
    for _, r in comp5.iterrows():
        print(f"  {r['buy_date'].year}년 말 매수 → {r['sell_date'].year}: {r['cagr']:.1f}%")

print("\n[완료]")
