"""
analyze_lev_etfs.py  —  QQQ / QLD(2x) / TQQQ(3x) 합성가격 10년 롤링 분석

합성 방식 (data_loader.py 'with_costs' 모드):
  QQQ  (1x): NDX 일별수익률 × 1  − 운용보수 0.20%/년
  QLD  (2x): NDX 일별수익률 × 2  − (SOFR + 0.50%) × 1  − 운용보수 0.95%/년
  TQQQ (3x): NDX 일별수익률 × 3  − (SOFR + 0.50%) × 2  − 운용보수 0.88%/년

스왑 근거: JPMorgan 424B2 — SOFR + 0.50%/년 (스프레드 포함)
SOFR 프록시: 연방기금금리 (fed_funds_rate.json)
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
import numpy as np
from pathlib import Path
from data_loader import load_ndx_prices
from rolling_analysis import (
    _compute_rolling, _build_sp500_annual, _year_end, _month_end,
    summary_stats, full_period_cagr, _dl
)

OUT = Path(__file__).parent / "data" / "rolling"
OUT.mkdir(parents=True, exist_ok=True)

# ── 합성가격 로드 ──────────────────────────────────────────────
print("[합성가격 로드] with_costs 모드 (스왑금리 + 운용보수 반영)...")
d = load_ndx_prices('with_costs')
dates  = d['dates']
ndx1x  = d['ndx1x']   # QQQ  (1x)
ndx2x  = d['ndx2x']   # QLD  (2x)
ndx3x  = d['ndx3x']   # TQQQ (3x)

qqq_s  = pd.Series(ndx1x, index=dates, name='QQQ')
qld_s  = pd.Series(ndx2x, index=dates, name='QLD')
tqqq_s = pd.Series(ndx3x, index=dates, name='TQQQ')

print(f"  기간: {dates[0].date()} ~ {dates[-1].date()} ({len(dates)}거래일)")

# ── 벤치마크: S&P 500TR (rolling_analysis와 동일 방식) ──────────
print("[다운로드] ^SP500TR ...")
sp500tr_raw = _dl("^SP500TR", "1970-01-01")
bench_annual  = _build_sp500_annual(sp500tr_raw)
bench_monthly = _month_end(sp500tr_raw)

today = pd.Timestamp.today().normalize()

def run_rolling(prices: pd.Series, label: str, years: int = 10, freq: str = "annual"):
    ba = bench_annual  if freq == "annual"  else None
    bm = bench_monthly if freq == "monthly" else None
    return _compute_rolling(prices, ba, bm, years=years, freq=freq, today=today)

def save_csv(df: pd.DataFrame, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False, encoding="utf-8-sig")
    print(f"[CSV 저장] {path}  ({len(df)}행)")

# ── QQQ 롤링 ──────────────────────────────────────────────────
print("\n[QQQ] 롤링 계산...")
df10a_qqq = run_rolling(qqq_s, "QQQ", years=10, freq="annual")
df5a_qqq  = run_rolling(qqq_s, "QQQ", years=5,  freq="annual")
df10m_qqq = run_rolling(qqq_s, "QQQ", years=10, freq="monthly")
save_csv(df10a_qqq, OUT / "QQQ_10y_annual.csv")
save_csv(df5a_qqq,  OUT / "QQQ_5y_annual.csv")
save_csv(df10m_qqq, OUT / "QQQ_10y_monthly.csv")
fp_qqq   = full_period_cagr(qqq_s)
st_qqq   = summary_stats(df10a_qqq, "QQQ")

# ── QLD 롤링 ──────────────────────────────────────────────────
print("[QLD] 롤링 계산...")
df10a_qld = run_rolling(qld_s, "QLD", years=10, freq="annual")
df5a_qld  = run_rolling(qld_s, "QLD", years=5,  freq="annual")
df10m_qld = run_rolling(qld_s, "QLD", years=10, freq="monthly")
save_csv(df10a_qld, OUT / "QLD_10y_annual.csv")
save_csv(df5a_qld,  OUT / "QLD_5y_annual.csv")
save_csv(df10m_qld, OUT / "QLD_10y_monthly.csv")
fp_qld   = full_period_cagr(qld_s)
st_qld   = summary_stats(df10a_qld, "QLD")

# ── TQQQ 롤링 ─────────────────────────────────────────────────
print("[TQQQ] 롤링 계산...")
df10a_tqqq = run_rolling(tqqq_s, "TQQQ", years=10, freq="annual")
df5a_tqqq  = run_rolling(tqqq_s, "TQQQ", years=5,  freq="annual")
df10m_tqqq = run_rolling(tqqq_s, "TQQQ", years=10, freq="monthly")
save_csv(df10a_tqqq, OUT / "TQQQ_10y_annual.csv")
save_csv(df5a_tqqq,  OUT / "TQQQ_5y_annual.csv")
save_csv(df10m_tqqq, OUT / "TQQQ_10y_monthly.csv")
fp_tqqq   = full_period_cagr(tqqq_s)
st_tqqq   = summary_stats(df10a_tqqq, "TQQQ")

# ── 결과 출력 ─────────────────────────────────────────────────
for label, df, st, fp in [
    ("QQQ (1x)", df10a_qqq, st_qqq, fp_qqq),
    ("QLD (2x)", df10a_qld, st_qld, fp_qld),
    ("TQQQ(3x)", df10a_tqqq, st_tqqq, fp_tqqq),
]:
    print(f"\n{'═'*70}")
    print(f"■ {label} 10년 롤링 CAGR — 연말 매수")
    print(f"{'═'*70}")
    comp = df[df["is_complete"]].copy()
    prog = df[~df["is_complete"]].copy()
    print(f"\n{'매수':>6}  {'평가':>6}  {'CAGR':>8}  {'배수':>6}  {'S&P500':>8}  {'차이':>7}")
    print("-"*52)
    for _, r in comp.iterrows():
        bc   = r.get("bench_cagr", float("nan"))
        diff = r.get("diff_pct", float("nan"))
        win  = "✓" if (not pd.isna(diff) and diff > 0) else "✗"
        bc_str   = f"{bc:7.1f}%" if not pd.isna(bc) else "   —  "
        diff_str = f"{diff:+6.1f}pp" if not pd.isna(diff) else "      "
        print(f"{r['buy_date'].year:>6}  {r['sell_date'].year:>6}  {r['cagr']:>7.1f}%  {r['multiple']:>5.1f}x  {bc_str}  {diff_str} {win}")
    if len(prog) > 0:
        print(f"\n▲ 진행 중 ({len(prog)}개):")
        for _, r in prog.iterrows():
            bc   = r.get("bench_cagr", float("nan"))
            diff = r.get("diff_pct", float("nan"))
            bc_s = f"{bc:.1f}%" if not pd.isna(bc) else "—"
            print(f"  {r['buy_date'].year}→{r['sell_date'].strftime('%Y-%m-%d')} ({r['years_actual']:.1f}년): {r['cagr']:.1f}% x{r['multiple']:.1f}  벤치={bc_s}")
    print(f"\n  완결 구간 : {st['n_complete']}개")
    print(f"  손실 구간 : {st['n_losses']}개")
    print(f"  최저 CAGR : {st['min_cagr']}% ({st['min_buy']}년)")
    print(f"  중앙값    : {st['median_cagr']}%")
    print(f"  최고 CAGR : {st['max_cagr']}% ({st['max_buy']}년)")
    print(f"  연 20%+   : {st['pct_over_20']}%")
    beat = st.get('n_beat_bench')
    if beat is not None:
        print(f"  S&P500 승 : {beat} / {st['n_beat_bench_total']}개")
    print(f"  전체기간  : {fp['cagr']}% CAGR  {fp['multiple']}x  ({fp['start_date']}~{fp['end_date']})")

print("\n[완료]")
