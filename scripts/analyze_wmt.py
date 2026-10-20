"""
analyze_wmt.py  —  월마트(WMT) 롤링 CAGR 분석
NYSE 상장: 1972년 (Yahoo Finance 데이터는 더 오래됨)
분할 이력: 2:1 × 11회 (1971~1993), 3:1 × 1회 (2024-02-26)
  → 2024년 이전 주가는 현재 기준 ÷(2^11 × 3) = ÷6144 수준이나
     Yahoo Finance adj 주가는 이를 이미 반영
회계연도(FY): 2월 1일 ~ 1월 31일 (FY2025 = 2024-02-01 ~ 2025-01-31)
  → 달력연도 Y 매수 시점 기준 EPS = FY(Y+1) ending Jan 31, (Y+1)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from rolling_analysis import RollingAnalyzer, summary_stats
import pandas as pd
import requests
import json
from pathlib import Path

OUT = Path(__file__).parent / "data" / "rolling"
OUT.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────
# 1. 데이터 다운로드 & 계산
# ──────────────────────────────────
az = RollingAnalyzer("WMT", benchmark="^SP500TR")

# 10년 연말 매수
df10a = az.rolling(years=10, freq="annual")
# 5년 연말 매수 (손실 구간 확인용)
df5a  = az.rolling(years=5,  freq="annual")
# 10년 월말 매수
df10m = az.rolling(years=10, freq="monthly")

# CSV 저장
az.save_csv(df10a, OUT / "WMT_10y_annual.csv")
az.save_csv(df5a,  OUT / "WMT_5y_annual.csv")
az.save_csv(df10m, OUT / "WMT_10y_monthly.csv")

# 차트
az.plot(df10a, output_dir=OUT / "charts", freq_label="annual", years=10)
az.plot(df5a,  output_dir=OUT / "charts", freq_label="annual", years=5)

# 전체 기간
fp = az.full_period()

# ──────────────────────────────────
# 2. 요약 통계
# ──────────────────────────────────
stats10a = summary_stats(df10a, label="WMT 10년 연말")
stats5a  = summary_stats(df5a,  label="WMT 5년 연말")

print("\n" + "═" * 70)
print("■ WMT 10년 롤링 CAGR — 연말 매수 (완결 구간)")
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
if stats10a.get("n_complete", 0) > 0:
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
        print(f"벤치마크 중앙값: {stats10a['bench_median_cagr']}%")

print("\n" + "─" * 50)
print(f"전체 기간 CAGR: {fp['cagr']}%  ({fp['start_date']} ~ {fp['end_date']}, {fp['years']}년)")
print(f"전체 기간 배수: {fp['multiple']}x  ({fp['start_price']:.2f} → {fp['end_price']:.2f})")

# ──────────────────────────────────
# 3. 5년 손실 구간
# ──────────────────────────────────
print("\n" + "═" * 50)
print("■ WMT 5년 롤링 — 손실 구간")
print("─" * 50)
comp5 = df5a[df5a["is_complete"] & (df5a["cagr"] < 0)]
if len(comp5) == 0:
    print("  없음")
else:
    for _, r in comp5.iterrows():
        print(f"  {r['buy_date'].year}년 말 매수 → {r['sell_date'].year}: {r['cagr']:.1f}%")

# ──────────────────────────────────
# 4. EDGAR XBRL로 WMT EPS 조회
# ──────────────────────────────────
# WMT CIK: 0000104169
# 회계연도 FY(Y+1) ending January 31, Y+1 → 달력연도 Y에 맵핑
# 예) FY2025 ending 2025-01-31 → 달력연도 2024 EPS
# 분할: 2024-02-26 3:1 → 2024-01-31 종료 FY2024 이전은 ÷3 필요
print("\n" + "═" * 70)
print("■ WMT EPS — SEC EDGAR XBRL (CIK: 0000104169)")
print("─" * 70)
print("  회계연도 FY(Y+1) ending Jan 31 → 달력연도 Y에 매핑")
print("  2024-02-26 3:1 분할: FY2024 이전(end <= 2024-01-31) → ÷3 필요")

CIK = "0000104169"
url = f"https://data.sec.gov/api/xbrl/companyconcept/{CIK}/us-gaap/EarningsPerShareDiluted.json"
try:
    resp = requests.get(url, headers={"User-Agent": "research@example.com"}, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    entries = data["units"]["USD"]
    # 10-K만, WMT 회계연도는 1월 31일 종료 → end month이 "01"인 것
    fy_eps = {}
    for e in entries:
        if e.get("form") != "10-K":
            continue
        end_str = e.get("end", "")
        if len(end_str) < 7:
            continue
        end_month = end_str[5:7]
        if end_month != "01":
            continue
        end_yr = int(end_str[:4])
        # 달력연도 = FY 종료연도 - 1
        cal_yr = end_yr - 1
        val = e["val"]
        accn = e.get("accn", "")
        if cal_yr not in fy_eps or accn > fy_eps[cal_yr][1]:
            fy_eps[cal_yr] = (val, accn, end_str)

    print(f"\n{'달력연도':>8}  {'FY종료일':>12}  {'EPS (원본)':>12}  {'EPS (÷3조정)':>14}")
    print("-" * 55)
    for yr in sorted(fy_eps.keys()):
        val, accn, end_str = fy_eps[yr]
        # 2024-02-26 분할: FY ending 2024-01-31 이전은 ÷3
        adj = round(val / 3, 4) if end_str <= "2024-01-31" else val
        marker = "÷3" if end_str <= "2024-01-31" else ""
        print(f"{yr:>8}  {end_str:>12}  {val:>12.4f}  {adj:>12.4f}  {marker}")

    # Python 딕셔너리 형태로 출력 (export_rolling_json.py에 복붙용)
    print("\n# ── WMT EPS 하드코딩용 딕셔너리 (분할조정 완료) ──")
    print("_WMT_EPS = {")
    for yr in sorted(fy_eps.keys()):
        val, _, end_str = fy_eps[yr]
        adj = round(val / 3, 4) if end_str <= "2024-01-31" else round(val, 4)
        print(f"    {yr}: {adj},  # FY ending {end_str}")
    print("}")

except Exception as e:
    print(f"  EDGAR 조회 실패: {e}")
    print("  수동으로 EPS를 입력해야 합니다.")

# ──────────────────────────────────
# 5. 매수 주가 샘플 확인 (분할 이력 검증용)
# ──────────────────────────────────
print("\n" + "═" * 70)
print("■ WMT 매수 주가 샘플 (Yahoo Finance adj 종가)")
print("─" * 70)
early_rows = df10a[df10a["buy_date"].dt.year <= 1985]
for _, r in early_rows.iterrows():
    print(f"  {r['buy_date'].year}년 말: 매수가={r['buy_price']:.4f}, 판매가={r['sell_price']:.4f}, CAGR={r['cagr']:.1f}%")

print("\n[완료]")
