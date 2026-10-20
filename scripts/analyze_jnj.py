"""
analyze_jnj.py  —  존슨앤존슨(JNJ) 롤링 CAGR 분석
검증값과 차이가 있으면 표로 보고.
EDGAR XBRL에서 EPS 데이터도 조회해서 출력.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from rolling_analysis import RollingAnalyzer, summary_stats
import pandas as pd
from pathlib import Path
import requests

OUT = Path(__file__).parent / "data" / "rolling"
OUT.mkdir(parents=True, exist_ok=True)

# ──────────────────────────────────
# 0. EDGAR XBRL에서 EPS 데이터 조회 (참고용)
# ──────────────────────────────────
print("[JNJ] EDGAR XBRL에서 EPS 데이터 조회...")
# JNJ CIK: 0000200406
CIK = "0000200406"
url = f"https://data.sec.gov/api/xbrl/companyconcept/{CIK}/us-gaap/EarningsPerShareDiluted.json"
try:
    resp = requests.get(url, headers={"User-Agent": "research@example.com"}, timeout=20)
    edgar_data = resp.json()
    entries = edgar_data["units"]["USD"]
    # 10-K만, end 기준 연도별 최신 filed 값
    fy_eps_raw = {}
    for e in entries:
        if e.get("form") != "10-K":
            continue
        end_year = int(e.get("end", "9999")[:4])
        filed = e.get("filed", "")
        if end_year < 1985:
            continue
        if end_year not in fy_eps_raw or filed > fy_eps_raw[end_year]["filed"]:
            fy_eps_raw[end_year] = {"val": e["val"], "filed": filed, "accn": e.get("accn", "")}

    print(f"\n  EDGAR 10-K EPS (FY1985~): 총 {len(fy_eps_raw)}개 연도")
    print("  ── 연도별 EPS ──")
    for yr in sorted(fy_eps_raw.keys()):
        print(f"    {yr}: {fy_eps_raw[yr]['val']:.4f}  (filed: {fy_eps_raw[yr]['filed']})")
except Exception as ex:
    print(f"  EDGAR 조회 실패: {ex}")
    fy_eps_raw = {}

# ──────────────────────────────────
# 1. 데이터 다운로드 & 계산
# ──────────────────────────────────
# JNJ 분할 이력: 1970·1981·1989·1992·1996·1999·2001 (각 2:1) → 누적 128:1
# 2001-06-04 이후 추가 분할 없음
# → Yahoo Finance는 2001년 분할까지 소급 반영 → 별도 보정 불필요

az = RollingAnalyzer("JNJ", benchmark="^SP500TR")

# 10년 연말 매수
df10a = az.rolling(years=10, freq="annual")
# 5년 연말 매수 (손실 구간 확인용)
df5a  = az.rolling(years=5,  freq="annual")
# 10년 월말 매수 (분포 확인용)
df10m = az.rolling(years=10, freq="monthly")

# CSV 저장
az.save_csv(df10a, OUT / "JNJ_10y_annual.csv")
az.save_csv(df5a,  OUT / "JNJ_5y_annual.csv")
az.save_csv(df10m, OUT / "JNJ_10y_monthly.csv")

# 전체 기간
fp = az.full_period()

# ──────────────────────────────────
# 2. 요약 통계
# ──────────────────────────────────
stats10a = summary_stats(df10a, label="JNJ 10년 연말")
stats5a  = summary_stats(df5a,  label="JNJ 5년 연말")

print("\n" + "═" * 70)
print("■ JNJ 10년 롤링 CAGR — 연말 매수 (완결 구간)")
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
        buy_yr  = r["buy_date"].year
        sell_dt = r["sell_date"].strftime("%Y-%m-%d")
        cagr    = r["cagr"]
        mult    = r["multiple"]
        yrs     = r["years_actual"]
        bc      = r.get("bench_cagr", float("nan"))
        diff    = r.get("diff_pct", float("nan"))
        bc_str  = f"{bc:7.1f}%" if not pd.isna(bc) else "   —  "
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
    print(f"벤치마크 중앙값: {stats10a['bench_median_cagr']}%")
    print(f"벤치마크 평균  : {stats10a['bench_mean_cagr']}%")

print("\n" + "─" * 50)
print(f"전체 기간 CAGR: {fp['cagr']}%  ({fp['start_date']} ~ {fp['end_date']}, {fp['years']}년)")
print(f"전체 기간 배수: {fp['multiple']}x  ({fp['start_price']:.2f} → {fp['end_price']:.2f})")

# ──────────────────────────────────
# 3. 5년 손실 구간
# ──────────────────────────────────
print("\n" + "═" * 50)
print("■ JNJ 5년 롤링 — 손실 구간")
print("─" * 50)
comp5 = df5a[df5a["is_complete"] & (df5a["cagr"] < 0)]
if len(comp5) == 0:
    print("  없음")
else:
    for _, r in comp5.iterrows():
        print(f"  {r['buy_date'].year}년 말 매수 → {r['sell_date'].year}: {r['cagr']:.1f}%")

print("\n[완료]")
