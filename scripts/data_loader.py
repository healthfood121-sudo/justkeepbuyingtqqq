"""
data_loader.py — 공통 가격 데이터 로더

모든 시뮬레이션 스크립트에서 import해서 사용하는 공통 모듈.

PRICE_MODE:
  'standard'   — 현재 방식
                 TQQQ: 운용보수 0.88%/년만 반영
                 QLD:  운용보수 0.95%/년만 반영
                 QQQ:  운용보수 0.20%/년만 반영
                 (스왑/파이낸싱 비용 미반영)

  'with_costs' — 정밀 버전 (현실 반영)
                 TQQQ: 운용보수 0.88% + 스왑 비용(2 × 연방기금금리)/년
                 QLD:  운용보수 0.95% + 스왑 비용(1 × 연방기금금리)/년
                 QQQ:  운용보수 0.20% (레버리지 없으므로 스왑 비용 없음)

스왑 비용 공식 근거:
  3x ETF는 2x 추가 레버리지를 스왑 계약으로 조달 → 비용 = 2 × SOFR ≈ 2 × 연방기금금리
  일별 적용: daily_swap = (leverage - 1) × fed_rate_annual / 100 / 252
  f_3x[i] = (1 + 3*ret[i] - 2*fed_daily[i]) * (1 - EXP_3X/252)
  f_2x[i] = (1 + 2*ret[i] - 1*fed_daily[i]) * (1 - EXP_2X/252)
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent   # 저장소 루트

# ── 경로 ──────────────────────────────────────────────────────
DATA_DIR = (_ROOT / "data")
FED_PATH = (_ROOT / "data/fed_funds_rate.json")

# ── 운용보수 (연율) ───────────────────────────────────────────
EXP_3X = 0.0088   # TQQQ 0.88%
EXP_2X = 0.0095   # QLD  0.95%
EXP_1X = 0.0020   # QQQ  0.20%

# ── 허용 모드 ─────────────────────────────────────────────────
PRICE_MODES = {
    'standard':   '운용보수만 반영 (스왑 비용 미반영)',
    'with_costs': '운용보수 + 스왑 금리비용 반영 (현실 반영)',
}


def load_fed_rates() -> dict:
    """월별 연방기금금리 로드. {YYYY-MM: rate(float, %)} 형태."""
    with open(FED_PATH, encoding="utf-8") as f:
        fed = json.load(f)
    return {r["date"][:7]: float(r["rate"]) for r in fed}


def build_daily_fed_rate(dates: pd.DatetimeIndex, fed_monthly: dict) -> np.ndarray:
    """날짜 배열에 맞는 일별 연방기금금리 배열 반환 (연율 → 일별 소수점)."""
    return np.array([
        fed_monthly.get(d.strftime("%Y-%m"), 3.0) / 100.0 / 252.0
        for d in dates
    ])


def make_synthetic_3x(ret: np.ndarray,
                       fed_daily: np.ndarray | None,
                       mode: str) -> np.ndarray:
    """
    TQQQ(3x) 합성가격 계산.
    ret: 일별 수익률 배열 (첫날 0)
    fed_daily: 일별 연방기금금리 (연율/252). mode='standard'이면 None 가능.
    """
    if mode == 'with_costs' and fed_daily is not None:
        f = (1.0 + ret * 3.0 - 2.0 * fed_daily) * (1.0 - EXP_3X / 252.0)
    else:
        f = (1.0 + ret * 3.0) * (1.0 - EXP_3X / 252.0)
    f[0] = 1.0
    return 100.0 * np.cumprod(f)


def make_synthetic_2x(ret: np.ndarray,
                       fed_daily: np.ndarray | None,
                       mode: str) -> np.ndarray:
    """QLD(2x) 합성가격 계산."""
    if mode == 'with_costs' and fed_daily is not None:
        f = (1.0 + ret * 2.0 - 1.0 * fed_daily) * (1.0 - EXP_2X / 252.0)
    else:
        f = (1.0 + ret * 2.0) * (1.0 - EXP_2X / 252.0)
    f[0] = 1.0
    return 100.0 * np.cumprod(f)


def make_synthetic_1x(ret: np.ndarray) -> np.ndarray:
    """QQQ(1x) 합성가격 계산. 레버리지 없으므로 스왑 비용 없음."""
    f = (1.0 + ret) * (1.0 - EXP_1X / 252.0)
    f[0] = 1.0
    return 100.0 * np.cumprod(f)


def load_ndx_prices(mode: str = 'standard') -> dict:
    """
    NDX 기반 모든 합성가격 + EMA200 + RSI 계산 후 반환.

    Returns dict:
      closes      : NDX 원가격 (numpy)
      dates       : DatetimeIndex
      ndx3x       : TQQQ 합성가격
      ndx2x       : QLD  합성가격
      ndx1x       : QQQ  합성가격
      ema200      : NDX EMA200
      rsi14       : NDX RSI(14)
      trail_peaks : 52주(252일) 고점 (트레일링 스탑용)
      fed_monthly : 월별 연방기금금리 dict
    """
    if mode not in PRICE_MODES:
        raise ValueError(f"mode는 {list(PRICE_MODES)} 중 하나여야 합니다.")

    # ── NDX 로드 ──
    ndx = pd.read_csv(DATA_DIR / "ndx_1971_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)

    # 1985-10-01 스플라이스 보정
    mask = ndx["Date"] == pd.Timestamp("1985-10-01")
    if mask.any():
        i = ndx.index[mask][0]
        ndx.loc[i:, "Close"] *= ndx.loc[i - 1, "Close"] / ndx.loc[i, "Close"]

    closes = ndx["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(ndx["Date"])
    n      = len(closes)

    ret = np.diff(closes) / closes[:-1]
    ret = np.insert(ret, 0, 0.0)

    # ── 연방기금금리 ──
    fed_monthly = load_fed_rates()

    # ── 합성가격 ──
    if mode == 'with_costs':
        fed_daily = build_daily_fed_rate(dates, fed_monthly)
    else:
        fed_daily = None

    ndx3x = make_synthetic_3x(ret.copy(), fed_daily, mode)
    ndx2x = make_synthetic_2x(ret.copy(), fed_daily, mode)
    ndx1x = make_synthetic_1x(ret.copy())

    # ── EMA200 ──
    a200   = 2.0 / 201.0
    ema200 = np.full(n, np.nan)
    ema200[199] = float(np.mean(closes[:200]))
    for i in range(200, n):
        ema200[i] = closes[i] * a200 + ema200[i - 1] * (1.0 - a200)

    # ── RSI(14) ──
    rsi14 = _compute_rsi(closes, 14)

    # ── 트레일링 스탑 52주 고점 ──
    trail_peaks = pd.Series(closes).rolling(252, min_periods=1).max().values

    return {
        "closes":      closes,
        "dates":       dates,
        "ndx3x":       ndx3x,
        "ndx2x":       ndx2x,
        "ndx1x":       ndx1x,
        "ema200":      ema200,
        "rsi14":       rsi14,
        "trail_peaks": trail_peaks,
        "fed_monthly": fed_monthly,
    }


def load_sp500_prices() -> dict:
    """SP500 가격 로드 (레버리지 없음, 비용 없음 — 비교 기준용)."""
    sp5 = pd.read_csv(DATA_DIR / "sp500_1927_now.csv",
                      parse_dates=["Date"]).sort_values("Date").reset_index(drop=True)
    closes = sp5["Close"].values.astype(float)
    dates  = pd.DatetimeIndex(sp5["Date"])
    return {"closes": closes, "dates": dates}


def get_monthly_starts(dates: pd.DatetimeIndex) -> list[int]:
    """매월 첫 거래일 인덱스 목록 반환."""
    seen, starts = set(), []
    for i, d in enumerate(dates):
        k = (d.year, d.month)
        if k not in seen:
            seen.add(k)
            starts.append(i)
    return starts


def _compute_rsi(closes: np.ndarray, period: int = 14) -> np.ndarray:
    n      = len(closes)
    rsi    = np.full(n, np.nan)
    deltas = np.diff(closes)
    gains  = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    if n <= period + 1:
        return rsi
    ag = float(np.mean(gains[:period]))
    al = float(np.mean(losses[:period]))
    for i in range(period, n - 1):
        ag = (ag * (period - 1) + gains[i]) / period
        al = (al * (period - 1) + losses[i]) / period
        rsi[i + 1] = 100.0 if al == 0 else 100.0 - 100.0 / (1.0 + ag / al)
    return rsi


# ── 빠른 테스트 ──────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    for mode in ['standard', 'with_costs']:
        d = load_ndx_prices(mode)
        tqqq = d["ndx3x"]
        dates = d["dates"]
        print(f"\n[{mode}]")
        print(f"  기간: {dates[0].date()} ~ {dates[-1].date()} ({len(dates)}거래일)")
        print(f"  TQQQ 최종값: {tqqq[-1]:.2f}")
        print(f"  TQQQ 최댓값: {tqqq.max():.2f}  ({dates[tqqq.argmax()].date()})")

    # 두 모드 차이
    d_std = load_ndx_prices('standard')
    d_v2  = load_ndx_prices('with_costs')
    ratio = d_v2["ndx3x"][-1] / d_std["ndx3x"][-1]
    print(f"\n최종 TQQQ: with_costs / standard = {ratio:.4f} ({(ratio-1)*100:+.1f}%)")

    # 연대별 누적 차이 확인
    dates = d_std["dates"]
    for year in [1980, 1990, 2000, 2010, 2020, int(dates[-1].year)]:
        mask = dates.year == year
        if mask.any():
            i = np.where(mask)[0][-1]
            r = d_v2["ndx3x"][i] / d_std["ndx3x"][i]
            print(f"  {year} 말: with_costs = {(r-1)*100:+.1f}% vs standard")
