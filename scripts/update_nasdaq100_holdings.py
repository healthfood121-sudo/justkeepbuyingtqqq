"""
나스닥100 (QQQ) 보유 종목 자동 업데이트 스크립트

Invesco 공식 CSV(primary) → NASDAQ API(fallback) 순서로 데이터 취득.
최신 비율·종목 편입/편출을 반영하여 web/app/nasdaq100-holdings/data.ts 를 재생성합니다.

수동 관리 파일: web/app/nasdaq100-holdings/descriptions.json
  - 한글 종목명, 섹터, 주요 제품/사업 설명, 종목 유형(type)
  - 신규 편입 종목만 이 파일에 추가하면 됨

실행:
  python scripts/update_nasdaq100_holdings.py          # 일반 업데이트
  python scripts/update_nasdaq100_holdings.py --init   # descriptions.json 초기화 (최초 1회)
"""

import argparse
import csv
import io
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── 경로 ──────────────────────────────────────────────
ROOT         = Path(__file__).parent.parent
DESCRIPTIONS = ROOT / "web/app/nasdaq100-holdings/descriptions.json"
DATA_TS      = ROOT / "web/app/nasdaq100-holdings/data.ts"

# ── Invesco 공식 CSV URL ──────────────────────────────
INVESCO_URL = (
    "https://www.invesco.com/us/financial-products/etfs/holdings/main/holdings/0"
    "?audienceType=Investor&action=download&ticker=QQQ"
)
# 브라우저 흉내 헤더는 봇 차단에 걸려 406이 날 수 있으므로,
# 단순한 헤더부터 순서대로 시도한다.
_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
INVESCO_HEADER_SETS = [
    {},                                              # requests 기본 헤더
    {"User-Agent": "curl/8.5.0", "Accept": "*/*"},
    {"User-Agent": _BROWSER_UA, "Accept": "*/*"},
]

# ── NASDAQ API (fallback) ─────────────────────────────
NASDAQ_URL = "https://api.nasdaq.com/api/quote/QQQ/holdings"
NASDAQ_PARAMS = {"assetclass": "etf", "limit": 300}
NASDAQ_HEADERS = {
    "User-Agent": _BROWSER_UA,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.nasdaq.com",
    "Referer": "https://www.nasdaq.com/",
}

# 비정상 데이터로 data.ts를 덮어쓰지 않기 위한 최소 종목 수
MIN_HOLDINGS = 90

# ── TypeScript → descriptions.json 초기화용 regex ────
# products 필드에 \' 이스케이프가 있을 수 있으므로 (?:[^'\\]|\\.)* 패턴 사용
_HOLDING_RE = re.compile(
    r"""\{\s*rank:\s*(\d+),\s*ticker:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',\s*"""
    r"""weight:\s*(-?[\d.]+),\s*sector:\s*'((?:[^'\\]|\\.)*)',\s*"""
    r"""products:\s*'((?:[^'\\]|\\.)*)',\s*type:\s*'([^']+)'\s*\}""",
    re.DOTALL,
)


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
# 데이터 취득: Invesco 공식 CSV (primary) → NASDAQ API (fallback)
# ─────────────────────────────────────────────────────
def fetch_via_invesco() -> tuple[str, list[dict]]:
    """Invesco 공식 QQQ holdings CSV"""
    last_err: Exception | None = None
    for i, headers in enumerate(INVESCO_HEADER_SETS, 1):
        print(f"Invesco CSV 다운로드 시도 {i}/{len(INVESCO_HEADER_SETS)}...")
        try:
            resp = requests.get(INVESCO_URL, headers=headers, timeout=30)
            resp.raise_for_status()
            content = resp.content.decode("utf-8-sig")
            print(f"다운로드 완료 ({len(content):,} bytes, {resp.headers.get('Content-Type')})")
            as_of_kr, holdings = _parse_invesco_csv(content)
            if not holdings:
                print("  파싱된 종목 없음 — 응답 앞부분:")
                print("\n".join("    " + l[:200] for l in content.splitlines()[:15]))
            return as_of_kr, holdings
        except Exception as e:  # noqa: BLE001
            print(f"  실패: {e}")
            last_err = e
    raise RuntimeError(f"Invesco 다운로드 실패: {last_err}")


def _parse_invesco_csv(content: str) -> tuple[str, list[dict]]:
    """Invesco CSV 파싱 → (기준일 한국어, 비중 내림차순 종목 리스트)

    포맷: Fund Ticker,Security Identifier,Holding Ticker,Shares/Par Value,
          MarketValue,Weight,Name,Class of Shares,Sector,Date
    """
    lines = content.splitlines()
    header_idx = next(
        (i for i, line in enumerate(lines) if re.search(r"ticker", line, re.I) and "," in line),
        None,
    )
    if header_idx is None:
        raise ValueError(f"CSV 헤더 행 미감지. 앞부분: {content[:300]!r}")

    reader = csv.DictReader(io.StringIO("\n".join(lines[header_idx:])))
    as_of_raw = ""
    rows = []
    for row in reader:
        norm = {re.sub(r"[\s%()#/_]", "", k).lower(): (v or "").strip() for k, v in row.items() if k}
        ticker = (norm.get("holdingticker") or norm.get("ticker") or norm.get("symbol") or "").upper()
        weight_raw = (norm.get("weight") or norm.get("percentageoffund") or "").replace("%", "").replace(",", "")
        if not ticker or ticker in ("-", "NAN"):
            continue
        try:
            weight = float(weight_raw)
        except ValueError:
            continue
        as_of_raw = as_of_raw or norm.get("date") or norm.get("positiondate") or ""
        rows.append((ticker, weight))

    return _to_holdings(as_of_raw, rows)


def fetch_via_nasdaq_api() -> tuple[str, list[dict]]:
    """NASDAQ 공개 API (fallback)"""
    print("NASDAQ API로 QQQ holdings 조회 중...")
    resp = requests.get(NASDAQ_URL, params=NASDAQ_PARAMS, headers=NASDAQ_HEADERS, timeout=30)
    resp.raise_for_status()
    data = resp.json().get("data") or {}
    table = data.get("holdings") or data.get("holdingTable") or {}
    rows_raw = table.get("rows") or (table.get("table") or {}).get("rows") or []
    if not rows_raw:
        raise ValueError(f"NASDAQ API: rows 없음. data 키: {list(data.keys())}")

    rows = []
    for r in rows_raw:
        ticker = (r.get("symbol") or r.get("ticker") or "").strip().upper()
        pct = str(r.get("percentHeld") or r.get("weight") or "").replace("%", "").replace(",", "").strip()
        if not ticker:
            continue
        try:
            rows.append((ticker, float(pct)))
        except ValueError:
            continue
    as_of_raw = str(data.get("asOfDate") or table.get("asOf") or "").replace("As of", "").strip()
    return _to_holdings(as_of_raw, rows)


def _to_holdings(as_of_raw: str, rows: list[tuple[str, float]]) -> tuple[str, list[dict]]:
    """(ticker, weight) 목록 → 비중 내림차순으로 rank 부여"""
    rows.sort(key=lambda r: r[1], reverse=True)
    holdings = [{"rank": i, "ticker": t, "weight": round(w, 4)} for i, (t, w) in enumerate(rows, 1)]
    as_of_kr = _format_date_kr(as_of_raw) if as_of_raw else _today_kr()
    return as_of_kr, holdings


def _today_kr() -> str:
    dt = datetime.now(timezone.utc)
    return f"{dt.year}년 {dt.month}월 {dt.day}일"


def _format_date_kr(s: str) -> str:
    """날짜 문자열 → 한국어 형식 (2026년 7월 3일)"""
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%B %d, %Y", "%b %d, %Y", "%B %d %Y"):
        try:
            dt = datetime.strptime(s.strip(), fmt)
            return f"{dt.year}년 {dt.month}월 {dt.day}일"
        except ValueError:
            continue
    return s  # 파싱 실패 시 원본 반환


# ─────────────────────────────────────────────────────
# 편입/편출 감지
# ─────────────────────────────────────────────────────
def detect_changes(holdings: list[dict], descs: dict) -> dict[str, list[str]]:
    new_set  = {h["ticker"] for h in holdings}
    prev_set = set(descs.keys())
    return {
        "added":   sorted(new_set - prev_set),
        "removed": sorted(prev_set - new_set),
    }


def apply_additions(descs: dict, added: list[str]) -> dict:
    """신규 편입 종목을 descriptions에 빈 항목으로 추가"""
    for ticker in added:
        descs[ticker] = {"name": ticker, "sector": "", "products": "", "type": "stock"}
    return descs


# ─────────────────────────────────────────────────────
# data.ts 생성
# ─────────────────────────────────────────────────────
def _ts_str(s: str) -> str:
    """문자열을 TypeScript 단따옴표 안에 안전하게 넣기"""
    return s.replace("\\", "\\\\").replace("'", "\\'")


def _infer_type(ticker: str, descs: dict) -> str:
    if ticker in descs:
        return descs[ticker].get("type", "stock")
    if ticker in ("CASH", "COLL"):
        return "cash"
    if ticker in ("FUT",):
        return "futures"
    if ticker in ("ADJ",):
        return "other"
    return "stock"


def generate_data_ts(as_of_kr: str, holdings: list[dict], descs: dict) -> str:
    today = datetime.utcnow().strftime("%Y-%m-%d")

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
// ⚠️  자동 생성 파일 — scripts/update_nasdaq100_holdings.py
// 마지막 업데이트: {today}  |  기준일: {as_of_kr}
// 직접 수정 금지. 한글명·섹터·설명은 descriptions.json 에서 관리.

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
  source: 'Invesco',
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

    # 1. 데이터 취득 (Invesco → NASDAQ 순)
    as_of_kr, holdings = "", []
    for fetch in (fetch_via_invesco, fetch_via_nasdaq_api):
        try:
            as_of_kr, holdings = fetch()
        except Exception as e:  # noqa: BLE001
            print(f"{fetch.__name__} 실패: {e}")
            holdings = []
            continue
        if len(holdings) >= MIN_HOLDINGS:
            print(f"{fetch.__name__} 성공")
            break
        print(f"{fetch.__name__}: 종목 수 {len(holdings)}개 — 비정상 데이터로 판단, 다음 소스 시도")
        holdings = []

    if not holdings:
        print("오류: 모든 데이터 소스 실패 — data.ts 를 변경하지 않습니다.")
        sys.exit(1)

    total = sum(h["weight"] for h in holdings)
    print(f"기준일: {as_of_kr}  |  종목 수: {len(holdings)}  |  비중 합계: {total:.2f}%")

    # 2. descriptions 로드
    if not DESCRIPTIONS.exists():
        print("⚠️  descriptions.json 없음 — --init 으로 먼저 초기화하세요.")
        sys.exit(1)
    descs = json.loads(DESCRIPTIONS.read_text(encoding="utf-8"))

    # 3. 편입/편출 감지
    changes = detect_changes(holdings, descs)
    if changes["added"]:
        print(f"🆕 신규 편입 ({len(changes['added'])}): {', '.join(changes['added'])}")
        descs = apply_additions(descs, changes["added"])
        DESCRIPTIONS.write_text(json.dumps(descs, ensure_ascii=False, indent=2), encoding="utf-8")
        print("   → descriptions.json 에 빈 항목 추가됨 (섹터/설명 수동 입력 필요)")
    if changes["removed"]:
        print(f"🗑️  편출 ({len(changes['removed'])}): {', '.join(changes['removed'])}")

    # 4. data.ts 재생성
    ts = generate_data_ts(as_of_kr, holdings, descs)
    DATA_TS.write_text(ts, encoding="utf-8")
    print(f"✅ data.ts 업데이트 완료 → {DATA_TS}")

    # GitHub Actions summary 출력
    summary = {
        "as_of":   as_of_kr,
        "count":   len(holdings),
        "added":   changes["added"],
        "removed": changes["removed"],
    }
    print("SUMMARY:", json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
