"""
update_web_prices.py

시뮬레이터용 가격 데이터를 최신까지 늘린다 (GitHub Actions update-web-prices.yml에서 매달 실행).
──────────────────────────────────────────────────────────────────────────────
시뮬레이터(적립·인출)는 web/public의 사본을 읽어 브라우저에서 바로 계산하므로, 사본만 늘리면 최신 날짜까지 반영된다.
분석 글의 숫자는 'data/' 원본(2026-09 기준)으로 계산한 고정값이라 이 스크립트는 'data/'를 건드리지 않는다.

  web/public/ndx.csv                 ← Yahoo ^NDX 종가 (마지막 날 이후만 덧붙임)
  web/public/sp500.csv               ← Yahoo ^GSPC 종가 (같음)
  web/public/data/fed_funds_rate.json ← 원본(FRED 기준금리) 마지막 달 이후는 Yahoo ^IRX(미국 13주 국채 금리) 월평균으로 채움
                                        (기준금리와 보통 0.1~0.3%p 차이. "src": "IRX" 표시, 매번 다시 계산)
기준금리가 없는 달은 시뮬레이터가 스왑금리를 0으로 계산해 결과가 좋게 나오므로, 지수와 함께 반드시 늘린다.

  python scripts/update_web_prices.py
"""

import csv, json, sys, time
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "web/public"
FED_SRC = ROOT / "data/fed_funds_rate.json"        # FRED 원본 (읽기만)
NY = ZoneInfo("America/New_York")


def fetch(symbol: str, rng: str = "1y") -> dict:
    """Yahoo 일별 종가 {YYYY-MM-DD: close}. 오늘 장 마감 전 값은 뺀다."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{requests.utils.quote(symbol)}?range={rng}&interval=1d"
    for i in range(4):
        try:
            r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
            r.raise_for_status()
            res = r.json()["chart"]["result"][0]
            break
        except Exception as e:
            if i == 3:
                raise
            print(f"  재시도 {i + 1}: {e}", file=sys.stderr)
            time.sleep(2 ** (i + 1))
    now = datetime.now(NY)
    out = {}
    for ts, c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]):
        if c is None:
            continue
        d = datetime.fromtimestamp(ts, NY).date()
        if d == now.date() and (now.hour, now.minute) < (16, 15):
            continue
        out[d.isoformat()] = float(c)
    return out


def extend_csv(path: Path, symbol: str) -> None:
    rows = list(csv.reader(path.open(encoding="utf-8")))
    last = rows[-1][0]
    new = {d: c for d, c in fetch(symbol).items() if d > last}
    if new:
        with path.open("a", encoding="utf-8", newline="") as f:
            w = csv.writer(f, lineterminator="\n")
            for d in sorted(new):
                w.writerow([d, repr(new[d])])
    print(f"{path.relative_to(ROOT)}: {last} 이후 {len(new)}일 추가" + (f" → {max(new)}" if new else ""))


def extend_fed() -> None:
    base = json.loads(FED_SRC.read_text(encoding="utf-8"))
    last = base[-1]["date"][:7]
    irx = fetch("^IRX", "2y")
    by_month: dict[str, list[float]] = {}
    for d, v in irx.items():
        if d[:7] > last:
            by_month.setdefault(d[:7], []).append(v)
    extra = [{"date": m, "rate": round(sum(v) / len(v), 2), "src": "IRX"} for m, v in sorted(by_month.items())]
    out = PUB / "data/fed_funds_rate.json"
    out.write_text(json.dumps(base + extra, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{out.relative_to(ROOT)}: 원본 {last}까지 + 13주 국채 금리 {len(extra)}개월"
          + (f" ({extra[0]['date']}~{extra[-1]['date']}, 마지막 {extra[-1]['rate']}%)" if extra else ""))


def main():
    extend_csv(PUB / "ndx.csv", "^NDX")
    extend_csv(PUB / "sp500.csv", "^GSPC")
    extend_fed()
    print(f"완료 {datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC")


if __name__ == "__main__":
    main()
