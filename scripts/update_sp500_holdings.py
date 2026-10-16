"""
S&P 500 (VOO) 보유 종목 자동 업데이트 스크립트

비중: Vanguard 공식 VOO 보유내역 API.
Vanguard 가 응답하지 않으면 그 회차는 건너뛰고 다음 날 실행 때 재시도.
최신 비율·종목 편입/편출을 반영하여 web/app/sp500-holdings/data.ts 를 재생성합니다.

수동 관리 파일: web/app/sp500-holdings/descriptions.json
  - 한글 종목명, 섹터, 주요 제품/사업 설명, 종목 유형(type)
  - 신규 편입 종목만 이 파일에 추가하면 됨

실행:
  python scripts/update_sp500_holdings.py          # 일반 업데이트
  python scripts/update_sp500_holdings.py --init   # descriptions.json 초기화 (최초 1회)
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── 경로 ──────────────────────────────────────────────
ROOT         = Path(__file__).parent.parent
DESCRIPTIONS = ROOT / "web/app/sp500-holdings/descriptions.json"
DATA_TS      = ROOT / "web/app/sp500-holdings/data.ts"

_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# ── Vanguard 공식 JSON API (primary) ──────────────────
VANGUARD_API_URLS = [
    "https://investor.vanguard.com/investment-products/etfs/profile/api/VOO/portfolio-holding/stock",
    "https://investor.vanguard.com/investment-products/etfs/profile/api/VOO/portfolio-holding/all",
]
VANGUARD_API_HEADER_SETS = [
    {"User-Agent": _BROWSER_UA, "Accept": "application/json, text/plain, */*",
     "Origin": "https://investor.vanguard.com", "Referer": "https://investor.vanguard.com/"},
]
VANGUARD_ROUNDS = 1

# ── Slickcharts S&P 500 fallback (Vanguard 차단 시) ────
SLICKCHARTS_URL = "https://www.slickcharts.com/sp500"

# Vanguard 실패가 이 기간 이상 이어지면 워크플로를 실패시켜 알림
STALE_DAYS = 7

# 비정상 데이터로 data.ts를 덮어쓰지 않기 위한 최소 종목 수
MIN_HOLDINGS = 400

# 데이터 소스에서 얻은 영문 종목명
SOURCE_NAMES: dict[str, str] = {}

# ── TypeScript → descriptions.json 초기화용 regex ────
_HOLDING_RE = re.compile(
    r"""\{\s*rank:\s*(\d+),\s*ticker:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*"""
    r"""weight:\s*(-?[\d.]+),\s*sector:\s*'((?:[^'\\]|\\.)*)',\s*"""
    r"""products:\s*'((?:[^'\\]|\\.)*)',\s*type:\s*'([^']+)'\s*\}""",
    re.DOTALL,
)

# BRK/B, BRK.B 등 슬래시/점 포함 티커 정규화
def normalize_ticker(t: str) -> str:
    return t.strip().upper().replace("/", "-").replace(".", "-")


# ─────────────────────────────────────────────────────
# 초기화: 현재 data.ts → descriptions.json
# ─────────────────────────────────────────────────────
def init_descriptions():
    if not DATA_TS.exists():
        print(f"오류: {DATA_TS} 파일이 없습니다.")
        sys.exit(1)

    src = DATA_TS.read_text(encoding="utf-8")
    matches = _HOLDING_RE.findall(src)
    if not matches:
        print("오류: data.ts에서 종목 데이터를 파싱할 수 없습니다.")
        sys.exit(1)

    descs = {}
    for _rank, ticker, name, _weight, sector, products, htype in matches:
        descs[ticker] = {
            "name":     name.replace("\\'", "'"),
            "sector":   sector.replace("\\'", "'"),
            "products": products.replace("\\'", "'"),
            "type":     htype,
        }

    DESCRIPTIONS.write_text(
        json.dumps(descs, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"descriptions.json 초기화 완료 — {len(descs)}개 종목 ({DESCRIPTIONS})")


# ─────────────────────────────────────────────────────
# 데이터 취득: Vanguard API
# ─────────────────────────────────────────────────────
def fetch_via_vanguard_api() -> tuple[str, list[dict]]:
    """Vanguard 공식 holdings JSON API"""
    last_err: Exception | None = None
    attempts = [
        (url, h)
        for url in VANGUARD_API_URLS
        for h in VANGUARD_API_HEADER_SETS
    ]
    for url, headers in attempts:
        print(f"Vanguard API 조회: {url}")
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:  # noqa: BLE001
            print(f"  실패: {e}")
            last_err = e
            continue
        rows, as_of_raw = _extract_json_holdings(data)
        if rows:
            return _to_holdings(as_of_raw, rows)
        print(f"  종목 목록을 찾지 못함 — 응답 앞부분: {resp.text[:500]!r}")
        last_err = ValueError("holdings 목록 없음")
    raise RuntimeError(f"Vanguard API 실패: {last_err}")


def fetch_via_slickcharts() -> tuple[str, list[dict]]:
    """Slickcharts S&P 500 비중 스크레이핑 (Vanguard 차단 시 fallback)"""
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        raise RuntimeError("beautifulsoup4 패키지가 필요합니다: pip install beautifulsoup4")

    print(f"Slickcharts 조회: {SLICKCHARTS_URL}")
    resp = requests.get(
        SLICKCHARTS_URL,
        headers={"User-Agent": _BROWSER_UA, "Accept-Language": "en-US,en;q=0.9"},
        timeout=30,
    )
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table")
    if not table:
        raise RuntimeError("테이블을 찾지 못함")
    rows = []
    SOURCE_NAMES.clear()
    for row in table.find_all("tr")[1:]:
        cols = [c.text.strip() for c in row.find_all(["th", "td"])]
        if len(cols) < 4:
            continue
        try:
            w = float(cols[3].replace("%", ""))
            t = normalize_ticker(cols[2])
            rows.append((t, w))
            SOURCE_NAMES[t] = cols[1]
        except ValueError:
            continue
    if not rows:
        raise RuntimeError("종목 데이터 없음")
    today = _today_kr()
    print(f"  → {len(rows)}개 종목 (기준일: {today}, 출처: Slickcharts)")
    return _to_holdings(today, rows)


def _extract_json_holdings(data) -> tuple[list[tuple[str, float]], str]:
    """JSON 구조를 자동 탐색하여 (ticker, weight) 목록을 추출."""
    best: list[tuple[str, float]] = []
    as_of = ""

    def pick(d: dict, words: tuple[str, ...], exclude: tuple[str, ...] = ()) -> str | None:
        for k in d:
            lk = k.lower()
            if any(w in lk for w in words) and not any(x in lk for x in exclude):
                return k
        return None

    def walk(node):
        nonlocal best, as_of
        if isinstance(node, dict):
            if not as_of:
                k = pick(node, ("asofdate", "effectivedate", "holdingsdate", "asof", "date"))
                if k and isinstance(node[k], str):
                    as_of = node[k]
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            dicts = [x for x in node if isinstance(x, dict)]
            if dicts:
                tk = pick(dicts[0], ("ticker", "symbol", "sedol"), ("fund",))
                wk = pick(dicts[0], ("weight", "percent", "marketvalue", "percentweight"))
                nk = pick(dicts[0], ("name", "description", "longname"), ("fund", "class"))
                if tk and wk:
                    rows = []
                    names = {}
                    for d in dicts:
                        t = normalize_ticker(str(d.get(tk) or ""))
                        try:
                            raw = str(d.get(wk) or "0").replace("%", "").replace(",", "")
                            w = float(raw)
                        except ValueError:
                            continue
                        if t and t not in ("-", "NAN", "NONE", ""):
                            rows.append((t, w))
                            if nk and d.get(nk):
                                names[t] = str(d[nk]).strip()
                    if len(rows) > len(best):
                        best = rows
                        SOURCE_NAMES.update(names)
            for v in node:
                walk(v)

    walk(data)
    # 0~1 비율로 오는 경우 % 로 환산
    if best and sum(w for _, w in best) < 2:
        best = [(t, w * 100) for t, w in best]
    return best, as_of


def _days_since_last_update() -> int | None:
    if not DATA_TS.exists():
        return None
    m = re.search(r"마지막 업데이트: (\d{4}-\d{2}-\d{2})", DATA_TS.read_text(encoding="utf-8"))
    if not m:
        return None
    last = datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - last).days


def _to_holdings(as_of_raw: str, rows: list[tuple[str, float]]) -> tuple[str, list[dict]]:
    rows.sort(key=lambda r: r[1], reverse=True)
    holdings = [{"rank": i, "ticker": t, "weight": round(w, 4)} for i, (t, w) in enumerate(rows, 1)]
    as_of_kr = _format_date_kr(as_of_raw) if as_of_raw else _today_kr()
    return as_of_kr, holdings


def _today_kr() -> str:
    dt = datetime.now(timezone.utc)
    return f"{dt.year}년 {dt.month}월 {dt.day}일"


def _format_date_kr(s: str) -> str:
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%B %d, %Y", "%b %d, %Y", "%B %d %Y"):
        try:
            dt = datetime.strptime(s.strip(), fmt)
            return f"{dt.year}년 {dt.month}월 {dt.day}일"
        except ValueError:
            continue
    return s


# ─────────────────────────────────────────────────────
# 편입/편출 감지
# ─────────────────────────────────────────────────────
def detect_changes(holdings: list[dict], descs: dict) -> dict[str, list[str]]:
    new_set = {h["ticker"] for h in holdings}
    prev_set = set(re.findall(r"ticker:\s*'([^']+)'", DATA_TS.read_text(encoding="utf-8"))) if DATA_TS.exists() else set()
    return {
        "added":   sorted(t for t in new_set if t not in descs),
        "removed": sorted(prev_set - new_set),
    }


def apply_additions(descs: dict, added: list[str]) -> dict:
    for ticker in added:
        descs[ticker] = {"name": SOURCE_NAMES.get(ticker, ticker), "sector": "", "products": "", "type": "stock"}
    return descs


# ─────────────────────────────────────────────────────
# data.ts 생성
# ─────────────────────────────────────────────────────
def _ts_str(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


_CASH_TICKERS = {"USD", "CASH", "COLL"}
_FUTURES_RE   = re.compile(r"^(ES|SP)[A-Z]\d{1,2}$")


def _infer_type(ticker: str, descs: dict) -> str:
    if ticker in descs:
        return descs[ticker].get("type", "stock")
    if ticker in _CASH_TICKERS:
        return "cash"
    if _FUTURES_RE.match(ticker):
        return "futures"
    return "stock"


def generate_data_ts(as_of_kr: str, holdings: list[dict], descs: dict, source: str) -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    rows = []
    for h in holdings:
        t = h["ticker"]
        d = descs.get(t, {})
        name     = _ts_str(d.get("name", t))
        sector   = _ts_str(d.get("sector", ""))
        products = _ts_str(d.get("products", ""))
        htype    = _infer_type(t, descs)
        rows.append(
            f"  {{ rank: {h['rank']:3d}, ticker: '{t}', name: '{name}', "
            f"weight: {h['weight']:.2f}, sector: '{sector}', "
            f"products: '{products}', type: '{htype}' }},"
        )

    body = "\n".join(rows)

    return f"""\
// ⚠️  자동 생성 파일 — scripts/update_sp500_holdings.py
// 마지막 업데이트: {today}  |  기준일: {as_of_kr}
// 직접 수정 금지. 한글명·섹터·설명은 descriptions.json 에서 관리.
// 공식 사이트 링크는 websites.ts 에서 별도 관리.

export type HoldingType = 'stock' | 'cash' | 'futures' | 'other'

export interface Holding {{
  rank: number
  ticker: string
  name: string
  weight: number
  sector: string
  products: string
  type: HoldingType
}}

export const META = {{
  asOf: '{as_of_kr}',
  source: '{_ts_str(source)}',
  price: '',
  priceDate: '',
}}

export const HOLDINGS: Holding[] = [
{body}
]
"""


# ─────────────────────────────────────────────────────
# main
# ─────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--init", action="store_true", help="descriptions.json 초기화 (최초 1회)")
    args = parser.parse_args()

    if args.init:
        init_descriptions()
        return

    # 보유내역 (Vanguard 공식 → Slickcharts fallback)
    source = "Vanguard"
    try:
        as_of_kr, holdings = fetch_via_vanguard_api()
    except Exception as e:  # noqa: BLE001
        print(f"Vanguard 실패: {e}")
        holdings = []

    if len(holdings) < MIN_HOLDINGS:
        print("Slickcharts fallback 시도...")
        source = "Slickcharts"
        try:
            as_of_kr, holdings = fetch_via_slickcharts()
        except Exception as e:  # noqa: BLE001
            print(f"Slickcharts 실패: {e}")

    if len(holdings) < MIN_HOLDINGS:
        days = _days_since_last_update()
        print(f"⏭️  Vanguard 비중 데이터를 받지 못해 이번 실행은 건너뜁니다 (마지막 업데이트 {days}일 전).")
        if days is not None and days >= STALE_DAYS:
            print(f"오류: {STALE_DAYS}일 이상 업데이트 실패 — 확인 필요")
            sys.exit(1)
        return

    total = sum(h["weight"] for h in holdings)
    print(f"기준일: {as_of_kr}  |  종목 수: {len(holdings)}  |  비중 합계: {total:.2f}%")
    if not 95 <= total <= 105:
        print(f"오류: 비중 합계 {total:.2f}% 가 비정상 — data.ts 를 변경하지 않습니다.")
        sys.exit(1)

    if not DESCRIPTIONS.exists():
        print("⚠️  descriptions.json 없음 — --init 으로 먼저 초기화하세요.")
        sys.exit(1)
    descs = json.loads(DESCRIPTIONS.read_text(encoding="utf-8"))

    changes = detect_changes(holdings, descs)
    if changes["added"]:
        print(f"🆕 신규 편입 ({len(changes['added'])}):")
        for t in changes["added"]:
            print(f"   - {t}: {SOURCE_NAMES.get(t, '?')}")
        descs = apply_additions(descs, changes["added"])
        DESCRIPTIONS.write_text(json.dumps(descs, ensure_ascii=False, indent=2), encoding="utf-8")
        print("   → descriptions.json 에 빈 항목 추가됨 (섹터/설명 수동 입력 필요)")
    if changes["removed"]:
        print(f"🗑️  편출 ({len(changes['removed'])}): {', '.join(changes['removed'])}")

    ts = generate_data_ts(as_of_kr, holdings, descs, source)
    DATA_TS.write_text(ts, encoding="utf-8")
    print(f"✅ data.ts 업데이트 완료 → {DATA_TS}")

    summary = {
        "as_of":   as_of_kr,
        "count":   len(holdings),
        "added":   changes["added"],
        "removed": changes["removed"],
    }
    print("SUMMARY:", json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
