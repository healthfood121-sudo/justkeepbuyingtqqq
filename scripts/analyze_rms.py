"""
analyze_rms.py  —  에르메스(RMS.PA) 롤링 CAGR 분석
1993~1999 연간 수익률(TradingView)과 2000+ Yahoo Finance를 이어 붙여 계산.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from rolling_analysis import _dl, _year_end, _month_end, _compute_rolling, summary_stats, full_period_cagr, plot_rolling
import pandas as pd
import numpy as np
from pathlib import Path

OUT = Path(__file__).parent / "data" / "rolling"
OUT.mkdir(parents=True, exist_ok=True)

TODAY = pd.Timestamp.today().normalize()

# ──────────────────────────────────────────────────────────────
# 1. 1993~1999 연간 수익률 (TradingView, EUR 기준)
# ──────────────────────────────────────────────────────────────
PRE2000_RETURNS = {
    1994: 0.2341,
    1995: 0.5864,
    1996: 0.5653,
    1997: -0.1250,
    1998: 0.0786,
    1999: 1.1691,
    2000: 0.0073,
}

# ──────────────────────────────────────────────────────────────
# 2. Yahoo Finance: RMS.PA 일간 adjusted close (2000~)
# ──────────────────────────────────────────────────────────────
print("[다운로드] RMS.PA ...")
rms_raw = _dl("RMS.PA", start="1999-01-01")
print(f"  {rms_raw.index[0].date()} ~ {rms_raw.index[-1].date()}")

# Yahoo 연말 종가 (2000~)
rms_ye_yahoo = _year_end(rms_raw)  # 2000-12-31, 2001-12-31, ...

# 2000 연말 종가 (앵커)
yahoo_2000 = float(rms_ye_yahoo.loc[pd.Timestamp("2000-12-31")])
print(f"  Yahoo 2000 연말 종가: {yahoo_2000:.2f} EUR")

# ──────────────────────────────────────────────────────────────
# 3. 1993~1999 연말 지수 재구성 (2000 연말 = yahoo_2000 에 맞게 역산)
# ──────────────────────────────────────────────────────────────
# 2000 연말 = yahoo_2000 → 역산으로 1993 연말 계산
# 2000 = val_1993 × (1+r94) × (1+r95) × ... × (1+r00)
cumulative = 1.0
for yr in [1994, 1995, 1996, 1997, 1998, 1999, 2000]:
    cumulative *= (1 + PRE2000_RETURNS[yr])

val_1993 = yahoo_2000 / cumulative  # 1993 연말 가격 (EUR 기준)

# 1993~1999 연말 지수 딕셔너리
pre2000_ye = {}
val = val_1993
pre2000_ye[pd.Timestamp("1993-12-31")] = val
for yr in [1994, 1995, 1996, 1997, 1998, 1999]:
    val = val * (1 + PRE2000_RETURNS[yr])
    pre2000_ye[pd.Timestamp(f"{yr}-12-31")] = val

print(f"\n  재구성된 연말 종가 (1993~1999, EUR):")
for dt, v in sorted(pre2000_ye.items()):
    print(f"    {dt.year}: {v:.2f}")
print(f"  2000 연말 연결값:   {val * (1 + PRE2000_RETURNS[2000]):.2f}  (Yahoo 실제: {yahoo_2000:.2f})")

# ──────────────────────────────────────────────────────────────
# 4. 이어 붙인 연말 종가 Series 생성
# ──────────────────────────────────────────────────────────────
pre_series = pd.Series(pre2000_ye).sort_index()
combined_ye = pd.concat([pre_series, rms_ye_yahoo])
combined_ye = combined_ye[~combined_ye.index.duplicated(keep="last")].sort_index()

# ──────────────────────────────────────────────────────────────
# 5. S&P 500 벤치마크 (2000+ 만 비교, pre-2000 구간은 생략)
# ──────────────────────────────────────────────────────────────
from rolling_analysis import _build_sp500_annual, _dl as dl2
print("\n[다운로드] ^SP500TR ...")
sp500_raw = dl2("^SP500TR", start="1987-01-01")
sp500_ye = _build_sp500_annual(sp500_raw)  # 1970~2026 연말 재구성

# ──────────────────────────────────────────────────────────────
# 6. 10년 롤링 CAGR 계산 (연말 매수)
# ──────────────────────────────────────────────────────────────
years = 10
latest_rms   = float(rms_raw.iloc[-1])
latest_date  = rms_raw.index[-1]
latest_sp    = float(sp500_ye.iloc[-1])

rows = []
for buy_date, buy_price in combined_ye.items():
    if pd.isna(buy_price) or buy_price <= 0:
        continue

    target = buy_date + pd.DateOffset(years=years)

    if target <= TODAY:
        # 완결 구간: 목표일 이후 첫 번째 combined_ye 값
        future = combined_ye[combined_ye.index >= target]
        if future.empty:
            continue
        sell_date  = future.index[0]
        sell_price = float(future.iloc[0])
        is_complete = True
    else:
        yrs_so_far = (TODAY - buy_date).days / 365.25
        if yrs_so_far < 1.0:
            continue
        sell_date  = latest_date
        sell_price = latest_rms
        is_complete = False

    years_actual = (sell_date - buy_date).days / 365.25
    cagr     = (sell_price / buy_price) ** (1 / years_actual) - 1
    multiple = sell_price / buy_price

    row = {
        "buy_date":    buy_date,
        "sell_date":   sell_date,
        "buy_price":   round(buy_price, 4),
        "sell_price":  round(sell_price, 4),
        "years_actual": round(years_actual, 2),
        "cagr":        round(cagr * 100, 2),
        "multiple":    round(multiple, 2),
        "is_complete": is_complete,
    }

    # S&P 500 비교 (sp500_ye에 데이터 있으면 모두 비교)
    if True:
        b_buy_opts = sp500_ye[sp500_ye.index <= buy_date]
        if not b_buy_opts.empty:
            b_buy = float(b_buy_opts.iloc[-1])
            if is_complete:
                b_future = sp500_ye[sp500_ye.index >= target]
                if not b_future.empty:
                    b_sell = float(b_future.iloc[0])
                    b_yrs  = (b_future.index[0] - b_buy_opts.index[-1]).days / 365.25
                    if b_yrs > 0.5:
                        b_cagr = (b_sell / b_buy) ** (1 / b_yrs) - 1
                        row["bench_cagr"]     = round(b_cagr * 100, 2)
                        row["bench_multiple"] = round(b_sell / b_buy, 2)
                        row["diff_pct"]       = round((cagr - b_cagr) * 100, 2)
            else:
                b_sell = latest_sp
                b_yrs  = (latest_date - b_buy_opts.index[-1]).days / 365.25
                if b_yrs > 0.5:
                    b_cagr = (b_sell / b_buy) ** (1 / b_yrs) - 1
                    row["bench_cagr"]     = round(b_cagr * 100, 2)
                    row["bench_multiple"] = round(b_sell / b_buy, 2)
                    row["diff_pct"]       = round((cagr - b_cagr) * 100, 2)

    rows.append(row)

df10a = pd.DataFrame(rows).sort_values("buy_date").reset_index(drop=True)

# CSV 저장
df10a.to_csv(OUT / "RMS_10y_annual_full.csv", index=False, encoding="utf-8-sig")
print(f"\n[CSV 저장] RMS_10y_annual_full.csv  ({len(df10a)}행)")

# ──────────────────────────────────────────────────────────────
# 7. 월별 롤링 (2000년 이후, Yahoo 데이터)
# ──────────────────────────────────────────────────────────────
rms_me = _month_end(rms_raw)
sp500_me = _month_end(sp500_raw)

# monthly rolling 계산 (기존 _compute_rolling 재사용)
df10m = _compute_rolling(rms_raw, None, sp500_me, years=10, freq="monthly", today=TODAY)
df10m.to_csv(OUT / "RMS_10y_monthly.csv", index=False, encoding="utf-8-sig")
print(f"[CSV 저장] RMS_10y_monthly.csv  ({len(df10m)}행)")

# ──────────────────────────────────────────────────────────────
# 8. 결과 출력
# ──────────────────────────────────────────────────────────────
comp  = df10a[df10a["is_complete"]].copy()
prog  = df10a[~df10a["is_complete"]].copy()
stats = summary_stats(df10a, label="RMS.PA 10년 연말")

print("\n" + "═" * 65)
print("■ RMS.PA 10년 롤링 CAGR (연말 매수, 1993~2024)")
print("═" * 65)
print(f"\n{'매수연도':>6}  {'평가연도':>6}  {'CAGR':>8}  {'배수':>6}  {'S&P500':>8}  {'차이':>8}")
print("-" * 65)
for _, r in comp.iterrows():
    bc   = r.get("bench_cagr", float("nan"))
    diff = r.get("diff_pct",   float("nan"))
    bc_s   = f"{bc:7.1f}%" if pd.notna(bc) else "   —   "
    diff_s = f"{diff:+7.1f}" if pd.notna(diff) else "      "
    print(f"{r['buy_date'].year:>6}  {r['sell_date'].year:>6}  {r['cagr']:>7.1f}%  {r['multiple']:>5.2f}x  {bc_s}  {diff_s}")

if len(prog) > 0:
    print("\n▲ 진행 중:")
    for _, r in prog.iterrows():
        bc   = r.get("bench_cagr", float("nan"))
        diff = r.get("diff_pct",   float("nan"))
        bc_s   = f"{bc:7.1f}%" if pd.notna(bc) else "   —   "
        diff_s = f"{diff:+7.1f}" if pd.notna(diff) else "      "
        print(f"  {r['buy_date'].year}년 말 → {r['sell_date'].strftime('%Y-%m-%d')} ({r['years_actual']:.1f}년): "
              f"{r['cagr']:.1f}%  {r['multiple']:.2f}x  벤치마크={bc_s}  차이={diff_s}")

print("\n" + "─" * 50)
print(f"완결 구간 수  : {stats['n_complete']}개")
print(f"최저 CAGR    : {stats['min_cagr']}%  ({stats['min_buy']}년 말 매수)")
print(f"중앙값 CAGR  : {stats['median_cagr']}%")
print(f"평균 CAGR    : {stats['mean_cagr']}%")
print(f"최고 CAGR    : {stats['max_cagr']}%  ({stats['max_buy']}년 말 매수)")
print(f"연 10% 초과  : {stats['pct_over_10']}%")
print(f"연 15% 초과  : {stats['pct_over_15']}%")
print(f"연 20% 초과  : {stats['pct_over_20']}%")
print(f"손실 구간    : {stats['n_losses']}개")
if "n_beat_bench" in stats:
    print(f"S&P500 이긴 구간: {stats['n_beat_bench']} / {stats['n_beat_bench_total']}개")

# 연말 + 월별 합산 통계
comp_m_2000 = df10m[df10m["is_complete"] & (df10m["buy_date"].dt.year >= 2000)].copy()
all_comp = pd.concat([comp[["cagr"]], comp_m_2000[["cagr"]]], ignore_index=True)
print(f"\n▶ 연말(1993~) + 월별(2000~) 완결 구간 합산: {len(all_comp)}개")
print(f"  최저: {all_comp['cagr'].min():.1f}%  중앙값: {all_comp['cagr'].median():.1f}%  "
      f"평균: {all_comp['cagr'].mean():.1f}%  최고: {all_comp['cagr'].max():.1f}%")
print(f"  10% 초과: {(all_comp['cagr'] > 10).mean()*100:.0f}%  "
      f"15% 초과: {(all_comp['cagr'] > 15).mean()*100:.0f}%  "
      f"20% 초과: {(all_comp['cagr'] > 20).mean()*100:.0f}%  "
      f"손실: {(all_comp['cagr'] < 0).sum()}개")

# ──────────────────────────────────────────────────────────────
# 9. 검증: 기준값과 비교
# ──────────────────────────────────────────────────────────────
REF = {
    1993: 20.9, 1994: 18.0, 1995: 17.0,
    1996: 15.4, 1997: 16.0, 1998: 17.3,
    1999:  7.8,
}
print("\n" + "═" * 55)
print("■ 검증: 기준값(이전 분석)과 비교")
print("─" * 55)
comp_dict = {r["buy_date"].year: r for _, r in comp.iterrows()}
for yr, ref in sorted(REF.items()):
    if yr not in comp_dict:
        print(f"  {yr}: 기준={ref}%  계산=—")
        continue
    calc = comp_dict[yr]["cagr"]
    diff = calc - ref
    ok   = "✓" if abs(diff) <= 0.5 else f"★ 차이 {diff:+.1f}pp"
    print(f"  {yr}: 기준={ref:5.1f}%  계산={calc:5.1f}%  차이={diff:+.1f}pp  {ok}")

print("\n[완료]")
