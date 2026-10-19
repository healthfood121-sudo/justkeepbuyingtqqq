"""
analyze_nke.py  —  나이키(NKE) 롤링 CAGR 분석
검증값과 차이가 있으면 표로 보고.
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
# ──────────────────────────────────
az = RollingAnalyzer("NKE", benchmark="^SP500TR")

# 10년 연말 매수
df10a = az.rolling(years=10, freq="annual")
# 5년 연말 매수 (손실 구간 확인용)
df5a  = az.rolling(years=5,  freq="annual")
# 10년 월말 매수 (2000년 이후)
df10m = az.rolling(years=10, freq="monthly")

# ── 1980~1982 매수 주가 보정 ─────────────────────────────────
# Yahoo Finance는 1990년 이전 분할 이력 누락 → 매수 주가가 실제보다 높게 잡혀 CAGR 과소 계산
# TradingView adj-on 기준 보정값 (2026-10-19 확인): Yahoo 대비 일관되게 ÷1.262
# 보정 후 CAGR: 1980→+2.95pp, 1981→+2.9pp, 1982→+2.83pp
_TV_BUY_PRICE = {1980: 0.0871, 1981: 0.1172, 1982: 0.1871}

for df in (df10a, df5a):
    for i, row in df.iterrows():
        yr = row["buy_date"].year
        if yr not in _TV_BUY_PRICE:
            continue
        new_buy = _TV_BUY_PRICE[yr]
        sell_p  = float(row["sell_price"])
        yrs     = float(row["years_actual"])
        new_cagr = ((sell_p / new_buy) ** (1 / yrs) - 1) * 100
        df.at[i, "buy_price"] = round(new_buy, 4)
        df.at[i, "multiple"]  = round(sell_p / new_buy, 2)
        df.at[i, "cagr"]      = round(new_cagr, 2)
        if "bench_cagr" in df.columns and pd.notna(row.get("bench_cagr")):
            df.at[i, "diff_pct"] = round(new_cagr - float(row["bench_cagr"]), 2)

# CSV 저장
az.save_csv(df10a, OUT / "NKE_10y_annual.csv")
az.save_csv(df5a,  OUT / "NKE_5y_annual.csv")
az.save_csv(df10m, OUT / "NKE_10y_monthly.csv")

# 차트
az.plot(df10a, output_dir=OUT / "charts", freq_label="annual",  years=10)
az.plot(df5a,  output_dir=OUT / "charts", freq_label="annual",  years=5)

# 전체 기간
fp = az.full_period()

# ──────────────────────────────────
# 2. 요약 통계
# ──────────────────────────────────
stats10a = summary_stats(df10a, label="NKE 10년 연말")
stats5a  = summary_stats(df5a,  label="NKE 5년 연말")

print("\n" + "═" * 70)
print("■ NKE 10년 롤링 CAGR — 연말 매수 (완결 구간)")
print("═" * 70)

comp = df10a[df10a["is_complete"]].copy()
prog = df10a[~df10a["is_complete"]].copy()

# 완결 구간 표
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

# 진행 중 구간
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

# 요약 통계
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
print("■ NKE 5년 롤링 — 손실 구간")
print("─" * 50)
comp5 = df5a[df5a["is_complete"] & (df5a["cagr"] < 0)]
if len(comp5) == 0:
    print("  없음")
else:
    for _, r in comp5.iterrows():
        print(f"  {r['buy_date'].year}년 말 매수 → {r['sell_date'].year}: {r['cagr']:.1f}%")

# ──────────────────────────────────
# 4. 검증값 비교
# ──────────────────────────────────
REFERENCE = {
    # (buy_year): (ref_cagr, ref_multiple_or_None)
    1980: (31.7, 15.7),
    1981: (36.1, None),
    1982: (31.8, None),
    1983: (21.4, None),
    1984: (35.6, None),
    1985: (36.2, None),
    1986: (46.6, 46.0),
    1987: (33.6, None),
    1988: (29.9, None),
    1989: (23.6, None),
    1990: (20.0, None),
    1991: (13.3, None),
    1992: (9.1, None),
    1993: (20.7, None),
    1994: (18.3, None),
    1995: (10.7, None),
    1996: (6.3, None),
    1997: (14.0, None),
    1998: (11.0, None),
    1999: (11.8, None),
    2000: (13.4, None),
    2001: (14.7, None),
    2002: (18.3, None),
    2003: (18.2, None),
    2004: (17.2, None),
    2005: (20.9, None),
    2006: (16.8, None),
    2007: (16.2, None),
    2008: (20.9, None),
    2009: (21.4, None),
    2010: (22.3, None),
    2011: (22.7, None),
    2012: (17.6, None),
    2013: (11.9, None),
    2014: (5.8, None),
    2015: (1.5, None),   # 완결
    2016: (-1.7, 0.84),  # 진행 중
}

print("\n" + "═" * 70)
print("■ 검증값 비교  (기준값 vs 계산값, 차이 ±0.5%p 이내면 OK)")
print("─" * 70)
print(f"{'매수':>6}  {'기준CAGR':>9}  {'계산CAGR':>9}  {'차이':>7}  {'상태':>12}")
print("-" * 70)

comp_dict = {r["buy_date"].year: r for _, r in df10a.iterrows()}

mismatches = []
for yr, (ref_cagr, ref_mult) in sorted(REFERENCE.items()):
    if yr not in comp_dict:
        print(f"{yr:>6}  {ref_cagr:>8.1f}%  {'—':>9}  {'데이터없음':>16}")
        continue
    r = comp_dict[yr]
    calc_cagr = r["cagr"]
    diff = calc_cagr - ref_cagr
    status = "✓" if abs(diff) <= 0.5 else f"★ 차이 {diff:+.1f}pp"
    prog_mark = "*" if not r["is_complete"] else ""
    print(f"{yr:>6}{prog_mark}  {ref_cagr:>8.1f}%  {calc_cagr:>8.1f}%  {diff:>+6.1f}pp  {status}")
    if abs(diff) > 0.5:
        mismatches.append((yr, ref_cagr, calc_cagr, diff))

if mismatches:
    print(f"\n★ 차이 큰 구간 ({len(mismatches)}개):")
    for yr, ref, calc, diff in mismatches:
        print(f"  {yr}년: 기준={ref}%, 계산={calc}%, 차이={diff:+.1f}pp")
else:
    print("\n모든 구간 ±0.5pp 이내 — 검증 통과")

print("\n[완료]")
