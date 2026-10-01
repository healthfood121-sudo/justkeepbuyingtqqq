"""
나스닥100 (QQQ) 보유 종목 자동 업데이트 스크립트

etf-scraper 패키지(primary) → Invesco 직접 CSV(fallback) 순서로 데이터 취득.
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
from datetime import datetime
from pathlib import Path

import requests

# ── 경로 ──────────────────────────────────────────────
ROOT         = Path(__file__).parent.parent
DESCRIPTIONS = ROOT / "web/app/nasdaq100-holdings/descriptions.json"
DATA_TS      = ROOT / "web/app/nasdaq100-holdings/data.ts"

# ── Invesco 직접 CSV URL (fallback) ───────────────────
INVESCO_URL = (
    "https://www.invesco.com/us/financial-products/etfs/holdings/main/holdings/0"
    "?audienceType=Investor&action=download&ticker=QQQ"
)
INVESCO_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/csv,application/octet-stream,*/*;q=0.8",
    "Referer": "https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Investor&ticker=QQQ",
    "Accept-Language": "en-US,en;q=0.9",
}

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
# 데이터 취득: etf-scraper (primary) → Invesco 직접 (fallback)
# ─────────────────────────────────────────────────────
def fetch_via_etf_scraper() -> tuple[str, list[dict]]:
    """etf-scraper 패키지로 QQQ holdings 취득"""
    from etf_scraper import ETFScraper  # noqa: PLC0415

    print("etf-scraper로 QQQ holdings 조회 중...")
    scraper = ETFScraper()
    df = scraper.query_holdings("QQQ", None)  # None = 최신 날짜

    if df is None or df.empty:
        raise ValueError("etf-scraper: 빈 DataFrame 반환")

    print(f"취득 완료 — {len(df)}개 행, 컬럼: {list(df.columns)}")

    # ── 기준일 추출 ──────────────────────────────────
    date_col = next((c for c in df.columns if "date" in c.lower()), None)
    if date_col and not df[date_col].isnull().all():
        raw_date = str(df[date_col].iloc[0])
        as_of_kr = _format_date_kr(raw_date)
    else:
        as_of_kr = datetime.utcnow().strftime("%Y년 %-m월 %-d일")

    # ── ticker 컬럼 ───────────────────────────────────
    ticker_col = next(
        (c for c in df.columns if c.lower() in ("ticker", "symbol")), None
    )
    if not ticker_col:
        raise ValueError(f"ticker 컬럼 없음: {list(df.columns)}")

    # ── weight 컬럼 ───────────────────────────────────
    weight_col = next(
        (c for c in df.columns
         if any(k in c.lower() for k in ("pct_assets", "weight", "% of", "%weight"))),
        None,
    )
    if not weight_col:
        raise ValueError(f"weight 컬럼 없음: {list(df.columns)}")

    holdings = []
    rank = 1
    for _, row in df.iterrows():
        ticker = str(row[ticker_col]).strip().upper()
        if not ticker or ticker in ("-", "NAN", ""):
            continue
        try:
            w = float(str(row[weight_col]).replace("%", "").replace(",", ""))
            # etf-scraper는 0~1 범위로 반환하는 경우가 있음 → 100 곱하기
            if w < 1.5:
                w = round(w * 100, 4)
            else:
                w = round(w, 4)
        except (ValueError, TypeError):
            continue
        holdings.append({"rank": rank, "ticker": ticker, "weight": w})
        rank += 1

    return as_of_kr, holdings


def fetch_via_direct_download() -> tuple[str, list[dict]]:
    """Invesco 직접 CSV 다운로드 (fallback)"""
    print("Invesco 직접 CSV 다운로드 중 (fallback)...")
    resp = requests.get(INVESCO_URL, headers=INVESCO_HEADERS, timeout=30)
    resp.raise_for_status()
    content = resp.content.decode("utf-8-sig")
    print(f"다운로드 완료 ({len(content):,} bytes)")
    return _parse_invesco_csv(content)


def _parse_invesco_csv(content: str) -> tuple[str, list[dict]]:
    """Invesco CSV 파싱 → (기준일 한국어, 종목 리스트)"""
    lines = content.splitlines()
    as_of_raw = ""
    header_idx = None

    for i, line in enumerate(lines):
        low = line.lower()
        if not as_of_raw and ("as of" in low or "holdings as of" in low):
            m = re.search(
                r'"?([A-Za-z]+ \d{1,2},?\s*\d{4}|\d{2}/\d{2}/\d{4})"?', line
            )
            if m:
                as_of_raw = m.group(1).strip()
        if header_idx is None and re.search(r"ticker|%weight|weight\s*\(", low) and "," in line:
            header_idx = i
            break

    if header_idx is None:
        print("경고: CSV 헤더 행 미감지 → 첫 번째 행 사용")
        header_idx = 0

    as_of_kr = _format_date_kr(as_of_raw) if as_of_raw else datetime.utcnow().strftime("%Y년 %-m월 %-d일")
    reader = csv.DictReader(io.StringIO("\n".join(lines[header_idx:])))
    holdings = []
    rank = 1

    for row in reader:
        norm = {re.sub(r'[\s%()#]', '', k).lower(): v.strip() for k, v in row.items() if k}
        ticker = (norm.get("ticker") or norm.get("symbol") or "").strip().upper()
        weight_raw = (
            norm.get("weight") or norm.get("weightpct") or
            norm.get("weight(%") or norm.get("%weight") or ""
        ).replace("%", "").replace(",", "").strip()
        if not ticker or ticker in ("-", ""):
            continue
        try:
            weight = round(float(weight_raw), 4)
        except ValueError:
            continue
        holdings.append({"rank": rank, "ticker": ticker, "weight": weight})
        rank += 1

    return as_of_kr, holdings


def _format_date_kr(s: str) -> str:
    """날짜 문자열 → 한국어 형식 (2026년 7월 3일)"""
    for fmt in ("%B %d, %Y", "%B %d %Y", "%B  %d, %Y", "%m/%d/%Y"):
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
  source: 'Invesco / ETF.com',
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

    # 1. 데이터 취득 (etf-scraper → 직접 다운로드 순)
    as_of_kr, holdings = None, None
    try:
        as_of_kr, holdings = fetch_via_etf_scraper()
    except Exception as e:
        print(f"etf-scraper 실패: {e}")
        print("직접 다운로드로 재시도...")
        try:
            as_of_kr, holdings = fetch_via_direct_download()
        except Exception as e2:
            print(f"직접 다운로드도 실패: {e2}")
            sys.exit(1)

    print(f"기준일: {as_of_kr}  |  종목 수: {len(holdings)}")

    if not holdings:
        print("오류: 파싱된 종목이 없습니다. CSV 포맷을 확인하세요.")
        sys.exit(1)

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
