"""
update_rolling_current.py — 진행 중인 롤링 구간 현재가 업데이트 (주간 실행용)
- isComplete=False 행만 현재가로 재계산
- CSV는 건드리지 않음 (빠름: ^SP500TR 1회 + ticker당 ~2 API 호출)
- fullPeriod: JSON에 저장된 start_price 재활용 (히스토리 재다운로드 없음)
- current: 현재 PER·배당수익률·EPS 업데이트
"""
import sys, os, json, time, warnings
sys.path.insert(0, os.path.dirname(__file__))
warnings.filterwarnings('ignore')

import yfinance as yf
import pandas as pd
import matplotlib
matplotlib.use('Agg')
from pathlib import Path
from datetime import date

DST  = Path(__file__).parent.parent / "web" / "public" / "data" / "rolling"
BENCH = "^SP500TR"

# 파일명 티커 → Yahoo Finance 실제 티커 매핑
TICKER_MAP = {
    "BRKB": "BRK-B",
    "RMS":  "RMS.PA",
    "MMC":  "MRSH",  # 마쉬 맥레넌, 2026년 티커 변경
}


def to_close_series(hist: pd.DataFrame) -> pd.Series:
    """yfinance MultiIndex 컬럼 대응 — Close를 flat Series로 변환"""
    close = hist['Close']
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]  # 단일 ticker: 첫 번째 열
    if hasattr(close.index, 'tz') and close.index.tz is not None:
        close = close.copy()
        close.index = close.index.tz_localize(None)
    return close


def get_price_at(close: pd.Series, target: date) -> float | None:
    """Close Series에서 target 날짜 이전 가장 가까운 종가 반환"""
    before = close[close.index <= pd.Timestamp(target)]
    if before.empty:
        return None
    return float(before.iloc[-1])


def cagr_stats(buy_p: float, sell_p: float, buy_d: date, sell_d: date) -> tuple:
    years    = (sell_d - buy_d).days / 365.25
    multiple = sell_p / buy_p
    cagr     = (multiple ** (1 / years) - 1) * 100
    return round(cagr, 2), round(multiple, 4), round(years, 1)


def main():
    json_files = sorted(DST.glob("*_rolling.json"))
    total = len(json_files)
    today = date.today()

    print(f"\n{'='*60}")
    print(f"진행 중 구간 현재가 업데이트: {total}개 파일")
    print(f"기준일: {today}")
    print(f"{'='*60}\n")

    # ^SP500TR 한 번만 다운로드 (전체 ticker 공유)
    print("벤치마크(^SP500TR) 다운로드 중...")
    bench_hist    = yf.download(BENCH, period="20y", auto_adjust=True, progress=False)
    bench_close   = to_close_series(bench_hist)
    bench_current = float(bench_close.iloc[-1])
    print(f"벤치마크 현재가: {bench_current:.2f}\n")

    updated = 0
    skipped = 0
    errors  = []

    for idx, json_file in enumerate(json_files, 1):
        ticker    = json_file.stem.replace("_rolling", "")
        yf_ticker = TICKER_MAP.get(ticker, ticker)
        print(f"[{idx:3d}/{total}] {ticker}", end="", flush=True)

        try:
            with open(json_file, encoding="utf-8") as f:
                data = json.load(f)

            ongoing = [r for r in data.get("rows10y", []) if not r["isComplete"]]
            if not ongoing:
                print(" → 스킵 (진행 중 없음)")
                skipped += 1
                continue

            # 현재가 (fast_info — 빠름)
            t = yf.Ticker(yf_ticker)
            current_price = t.fast_info.last_price
            if not current_price:
                print(" → 현재가 조회 실패")
                errors.append(ticker)
                continue

            # 진행 중 행 재계산에 필요한 기간만 다운로드
            earliest_year = min(r["buyYear"] for r in ongoing)
            hist  = yf.download(
                yf_ticker,
                start=f"{earliest_year}-12-25",
                auto_adjust=True, progress=False
            )
            close = to_close_series(hist)

            for row in data["rows10y"]:
                if row["isComplete"]:
                    continue

                buy_date  = date(row["buyYear"], 12, 31)
                buy_price = get_price_at(close, buy_date)
                if not buy_price:
                    continue

                cagr, multiple, years = cagr_stats(buy_price, current_price, buy_date, today)

                # 벤치마크 재계산
                bench_buy = get_price_at(bench_close, buy_date)
                if bench_buy:
                    bench_cagr, _, _ = cagr_stats(bench_buy, bench_current, buy_date, today)
                    row["benchCagr"] = bench_cagr
                    row["diff"]      = round(cagr - bench_cagr, 2)

                row["sellDate"]    = today.strftime("%Y-%m-%d")
                row["sellYear"]    = today.year
                row["yearsActual"] = years
                row["cagr"]        = cagr
                row["multiple"]    = multiple

            # fullPeriod: 저장된 start_price 재활용 (재다운로드 없음)
            fp = data.get("fullPeriod")
            if fp and fp.get("start_price") and fp.get("start_date"):
                start_price = fp["start_price"]
                start_date  = date.fromisoformat(fp["start_date"])
                fp_cagr, fp_multiple, fp_years = cagr_stats(
                    start_price, current_price, start_date, today
                )
                fp["end_date"]  = today.strftime("%Y-%m-%d")
                fp["end_price"] = round(current_price, 4)
                fp["cagr"]      = fp_cagr
                fp["multiple"]  = fp_multiple
                fp["years"]     = fp_years

            # current 메트릭 업데이트
            try:
                info  = t.info
                pe    = info.get("trailingPE") or info.get("forwardPE")
                div   = info.get("dividendYield") or 0
                eps   = info.get("trailingEps") or info.get("forwardEps")
                price = info.get("currentPrice") or info.get("regularMarketPrice")
                data["current"] = {
                    "price":    round(price, 2) if price else None,
                    "pe":       round(pe, 1)    if pe    else None,
                    "divYield": round(div, 2),
                    "eps":      round(eps, 2)   if eps   else None,
                }
            except Exception:
                pass  # current 실패해도 나머지는 저장

            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f" → 완료 (진행 중 {len(ongoing)}개)")
            updated += 1

        except Exception as e:
            print(f" → 오류: {e}")
            errors.append(ticker)

        time.sleep(0.3)

    print(f"\n{'='*60}")
    print(f"업데이트: {updated}개 / 스킵: {skipped}개 / 오류: {len(errors)}개")
    if errors:
        print(f"오류 목록: {errors}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
