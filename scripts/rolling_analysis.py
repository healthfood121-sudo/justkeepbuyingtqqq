"""
rolling_analysis.py  —  롤링 연평균 수익률 계산 공용 모듈

사용처: generate_all_sp500.py, export_rolling_json.py, analyze_*.py 등

- RollingAnalyzer(ticker, benchmark="^SP500TR")
    .rolling(years=10, freq="annual"|"monthly") → DataFrame
    .full_period()                                → dict
    .save_csv(df, path)
    .plot(df, output_dir, freq_label, years)
- summary_stats(df, label)   : 완결 구간 요약 통계
- full_period_cagr(series)   : 전체 기간 연평균 수익률

CSV 컬럼:
  buy_date, sell_date, buy_price, sell_price, years_actual, cagr, multiple,
  is_complete, bench_buy, bench_sell, bench_cagr, bench_multiple, diff_pct
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

# ^SP500TR(야후)은 1988년부터만 있으므로 1970~1987 연말 값은 고정값으로 이어 붙인다.
# (1987-12-31 = 256.02 는 야후 ^SP500TR 수준과 동일한 기준)
_SP500TR_PRE1988 = {
    1970: 45.9596,
    1971: 52.5364,
    1972: 62.5078,
    1973: 53.3442,
    1974: 39.224,
    1975: 53.8153,
    1976: 66.6449,
    1977: 61.8598,
    1978: 65.9178,
    1979: 78.073,
    1980: 103.3842,
    1981: 98.3081,
    1982: 119.3558,
    1983: 146.2228,
    1984: 155.391,
    1985: 205.3648,
    1986: 243.2956,
    1987: 256.02,
}

# 진행 중 구간은 최소 1년 이상 지난 경우만 포함
_MIN_PARTIAL_YEARS = 1.0


# ── 데이터 다운로드 / 리샘플 ────────────────────────────────────

def _dl(ticker: str, start: str = "1900-01-01") -> pd.Series:
    """야후 파이낸스 일간 수정종가 Series (tz 없음, 날짜 오름차순)."""
    import yfinance as yf

    hist = yf.download(ticker, start=start, auto_adjust=True,
                       progress=False, threads=False)
    if hist is None or hist.empty:
        raise ValueError(f"{ticker}: 가격 데이터 없음")
    close = hist["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]
    close = close.dropna()
    close.index = pd.to_datetime(close.index)
    if close.index.tz is not None:
        close.index = close.index.tz_localize(None)
    close = close[close > 0].sort_index()
    close.name = ticker
    if close.empty:
        raise ValueError(f"{ticker}: 가격 데이터 없음")
    return close


def _resample_last(s: pd.Series, rule: str, fallback: str) -> pd.Series:
    try:
        out = s.resample(rule).last()
    except ValueError:  # 구버전 pandas
        out = s.resample(fallback).last()
    return out.dropna()


def _year_end(s: pd.Series) -> pd.Series:
    """연말 종가 (인덱스 = 12-31 라벨, 진행 중인 해는 최신가)."""
    return _resample_last(s, "YE", "A")


def _month_end(s: pd.Series) -> pd.Series:
    """월말 종가 (인덱스 = 말일 라벨, 진행 중인 달은 최신가)."""
    return _resample_last(s, "ME", "M")


def _build_sp500_annual(raw: pd.Series | None) -> pd.Series:
    """S&P 500 TR 연말 값 (1970~). 1987 이전은 고정값, 이후는 야후 데이터."""
    pre = pd.Series({pd.Timestamp(f"{y}-12-31"): v for y, v in _SP500TR_PRE1988.items()},
                    dtype=float)
    if raw is None or len(raw) == 0:
        return pre.sort_index()
    ye = _year_end(raw)
    ye = ye[ye.index.year > max(_SP500TR_PRE1988)]
    out = pd.concat([pre, ye])
    out = out[~out.index.duplicated(keep="last")].sort_index()
    return out.astype(float)


# ── 롤링 계산 ──────────────────────────────────────────────────

def _cagr(buy: float, sell: float, years: float) -> float:
    return (sell / buy) ** (1 / years) - 1


def _compute_rolling(prices: pd.Series,
                     bench_annual: pd.Series | None,
                     bench_monthly: pd.Series | None,
                     years: int = 10,
                     freq: str = "annual",
                     today: pd.Timestamp | None = None,
                     bench_latest: tuple[pd.Timestamp, float] | None = None) -> pd.DataFrame:
    """
    prices: 일간 종가 Series
    freq="annual"  → 매년 연말 매수, years 년 뒤 연말 평가
    freq="monthly" → 매월 말 매수, years 년 뒤 월말 평가
    평가 시점이 아직 오지 않은 구간은 최신가로 평가 (is_complete=False)
    """
    if freq not in ("annual", "monthly"):
        raise ValueError(f"freq must be 'annual' or 'monthly': {freq}")

    prices = prices.dropna().sort_index()
    if today is None:
        today = pd.Timestamp.today().normalize()
    latest_date = prices.index[-1]
    latest_price = float(prices.iloc[-1])

    points = _year_end(prices) if freq == "annual" else _month_end(prices)
    bench = bench_annual if freq == "annual" else bench_monthly
    if bench is not None:
        bench = bench.dropna().sort_index()
        if bench.empty:
            bench = None

    # 벤치마크 최신값 (진행 중 구간 평가용)
    if bench is not None:
        if bench_latest is not None:
            b_last_date, b_last = bench_latest
        else:
            b_last_date = min(bench.index[-1], latest_date)
            b_last = float(bench.iloc[-1])

    # 라벨이 마지막 데이터 날짜 이후(진행 중 기간)인 포인트는 매수 시점에서 제외
    buy_points = points[points.index <= max(latest_date, today)]

    rows = []
    for buy_date, buy_price in buy_points.items():
        buy_price = float(buy_price)
        if not np.isfinite(buy_price) or buy_price <= 0:
            continue

        target = buy_date + pd.DateOffset(years=years)
        if freq == "monthly":
            target = target + pd.offsets.MonthEnd(0)

        if target <= today and target <= latest_date + pd.offsets.MonthEnd(0):
            future = points[points.index >= target]
            if future.empty:
                continue
            sell_date = future.index[0]
            sell_price = float(future.iloc[0])
            is_complete = True
        else:
            if (latest_date - buy_date).days / 365.25 < _MIN_PARTIAL_YEARS:
                continue
            sell_date = latest_date
            sell_price = latest_price
            is_complete = False

        years_actual = (sell_date - buy_date).days / 365.25
        if years_actual <= 0:
            continue
        cagr = _cagr(buy_price, sell_price, years_actual)

        row = {
            "buy_date": buy_date,
            "sell_date": sell_date,
            "buy_price": round(buy_price, 4),
            "sell_price": round(sell_price, 4),
            "years_actual": round(years_actual, 2),
            "cagr": round(cagr * 100, 2),
            "multiple": round(sell_price / buy_price, 2),
            "is_complete": is_complete,
            "bench_buy": np.nan,
            "bench_sell": np.nan,
            "bench_cagr": np.nan,
            "bench_multiple": np.nan,
            "diff_pct": np.nan,
        }

        if bench is not None and buy_date >= bench.index[0]:
            b_buy_opts = bench[bench.index <= buy_date]
            if not b_buy_opts.empty:
                b_buy_date = b_buy_opts.index[-1]
                b_buy = float(b_buy_opts.iloc[-1])
                b_sell = b_sell_date = None
                if is_complete:
                    b_future = bench[bench.index >= target]
                    if not b_future.empty:
                        b_sell_date, b_sell = b_future.index[0], float(b_future.iloc[0])
                else:
                    b_sell_date, b_sell = b_last_date, b_last
                if b_sell is not None and b_buy > 0:
                    b_yrs = (b_sell_date - b_buy_date).days / 365.25
                    if b_yrs > 0.5:
                        b_cagr = _cagr(b_buy, b_sell, b_yrs)
                        row["bench_buy"] = round(b_buy, 4)
                        row["bench_sell"] = round(b_sell, 4)
                        row["bench_cagr"] = round(b_cagr * 100, 2)
                        row["bench_multiple"] = round(b_sell / b_buy, 2)
                        row["diff_pct"] = round((cagr - b_cagr) * 100, 2)

        rows.append(row)

    cols = ["buy_date", "sell_date", "buy_price", "sell_price", "years_actual",
            "cagr", "multiple", "is_complete", "bench_buy", "bench_sell",
            "bench_cagr", "bench_multiple", "diff_pct"]
    df = pd.DataFrame(rows, columns=cols)
    if not df.empty:
        df = df.sort_values("buy_date").reset_index(drop=True)
        df["is_complete"] = df["is_complete"].astype(bool)
    return df


# ── 요약 통계 ──────────────────────────────────────────────────

def _r(x, nd=2):
    return None if x is None or pd.isna(x) else round(float(x), nd)


def summary_stats(df: pd.DataFrame, label: str = "") -> dict:
    """완결 구간 기준 요약 통계."""
    if df is None or df.empty:
        return {"label": label, "n_complete": 0, "n_losses": 0}
    comp = df[df["is_complete"].astype(bool)]
    out = {"label": label, "n_complete": int(len(comp))}
    if comp.empty:
        out["n_losses"] = 0
        return out

    c = comp["cagr"].astype(float)
    i_min, i_max = c.idxmin(), c.idxmax()
    out.update({
        "min_cagr": _r(c.min()),
        "min_buy": str(pd.Timestamp(comp.loc[i_min, "buy_date"]).year),
        "median_cagr": _r(c.median()),
        "mean_cagr": _r(c.mean()),
        "max_cagr": _r(c.max()),
        "max_buy": str(pd.Timestamp(comp.loc[i_max, "buy_date"]).year),
        "pct_over_10": _r((c > 10).mean() * 100, 1),
        "pct_over_15": _r((c > 15).mean() * 100, 1),
        "pct_over_20": _r((c > 20).mean() * 100, 1),
        "n_losses": int((c < 0).sum()),
    })
    if "diff_pct" in comp.columns:
        d = comp["diff_pct"].dropna()
        if len(d):
            out["n_beat_bench"] = int((d > 0).sum())
            out["n_beat_bench_total"] = int(len(d))
    return out


def full_period_cagr(prices: pd.Series) -> dict:
    """첫 거래일 ~ 마지막 거래일 연평균 수익률."""
    s = prices.dropna().sort_index()
    s = s[s > 0]
    start_date, end_date = s.index[0], s.index[-1]
    start_price, end_price = float(s.iloc[0]), float(s.iloc[-1])
    years = (end_date - start_date).days / 365.25
    multiple = end_price / start_price
    cagr = _cagr(start_price, end_price, years) * 100 if years > 0 else None
    return {
        "start_date": pd.Timestamp(start_date).strftime("%Y-%m-%d"),
        "end_date": pd.Timestamp(end_date).strftime("%Y-%m-%d"),
        "start_price": round(start_price, 4),
        "end_price": round(end_price, 4),
        "years": round(years, 1),
        "cagr": _r(cagr),
        "multiple": round(multiple, 4),
    }


# ── 차트 ──────────────────────────────────────────────────────

def plot_rolling(df: pd.DataFrame, title: str, path: Path | str) -> Path:
    """롤링 연평균 수익률 막대 차트 PNG 저장."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(12, 5))
    if df is not None and not df.empty:
        x = pd.to_datetime(df["buy_date"]).dt.strftime("%Y-%m")
        colors = ["#2b7bba" if comp else "#a6c8e6" for comp in df["is_complete"]]
        colors = [("#d9534f" if v < 0 else c) for v, c in zip(df["cagr"], colors)]
        ax.bar(x, df["cagr"], color=colors)
        if "bench_cagr" in df.columns and df["bench_cagr"].notna().any():
            ax.plot(x, df["bench_cagr"], color="#444", lw=1.2, label="S&P 500 TR")
            ax.legend()
        step = max(1, len(x) // 20)
        ax.set_xticks(range(0, len(x), step))
        ax.set_xticklabels(list(x)[::step], rotation=45, ha="right", fontsize=8)
    ax.axhline(0, color="#888", lw=0.8)
    ax.set_title(title)
    ax.set_ylabel("%")
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)
    return path


# ── 종목 분석기 ────────────────────────────────────────────────

class RollingAnalyzer:
    def __init__(self, ticker: str, benchmark: str | None = "^SP500TR",
                 start: str = "1970-01-01"):
        self.ticker = ticker
        self.benchmark = benchmark
        self.start = start
        self._prices: pd.Series | None = None
        self._bench_raw: pd.Series | None = None
        self.today = pd.Timestamp.today().normalize()

    @property
    def prices(self) -> pd.Series:
        if self._prices is None:
            self._prices = _dl(self.ticker, self.start)
        return self._prices

    @property
    def bench_raw(self) -> pd.Series | None:
        if self.benchmark and self._bench_raw is None:
            self._bench_raw = _dl(self.benchmark, "1970-01-01")
        return self._bench_raw

    def rolling(self, years: int = 10, freq: str = "annual") -> pd.DataFrame:
        braw = self.bench_raw
        ba = bm = None
        latest = None
        if braw is not None:
            latest = (braw.index[-1], float(braw.iloc[-1]))
            if freq == "annual":
                ba = _build_sp500_annual(braw) if self.benchmark == "^SP500TR" else _year_end(braw)
            else:
                bm = _month_end(braw)
        return _compute_rolling(self.prices, ba, bm, years=years, freq=freq,
                                today=self.today, bench_latest=latest)

    def full_period(self) -> dict:
        return full_period_cagr(self.prices)

    @staticmethod
    def save_csv(df: pd.DataFrame, path: Path | str) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(path, index=False, encoding="utf-8-sig")
        print(f"[CSV 저장] {path}  ({len(df)}행)")

    def plot(self, df: pd.DataFrame, output_dir: Path | str = ".",
             freq_label: str = "annual", years: int = 10) -> Path:
        name = self.ticker.replace("-", "").replace(".", "_")
        path = Path(output_dir) / f"{name}_{years}y_{freq_label}.png"
        return plot_rolling(df, f"{self.ticker} {years}년 롤링 연평균 수익률 ({freq_label})", path)
