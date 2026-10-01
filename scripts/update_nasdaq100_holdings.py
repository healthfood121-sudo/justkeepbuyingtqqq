"""
나스닥100 (QQQ) 보유 종목 자동 업데이트 스크립트

Invesco 공식 JSON API(primary) → Slickcharts(fallback) 순서로 데이터 취득.
최신 비율·종목 편입/편출을 반영하여 web/app/nasdaq100-holdings/data.ts 를 재생성합니다.

수동 관리 파일: web/app/nasdaq100-holdings/descriptions.json
  - 한글 종목명, 섹터, 주요 제품/사업 설명, 종목 유형(type)
  - 신규 편입 종목만 이 파일에 추가하면 됨

실행:
  python scripts/update_nasdaq100_holdings.py          # 일반 업데이트
  python scripts/update_nasdaq100_holdings.py --init   # descriptions.json 초기화 (최초 1회)
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
DESCRIPTIONS = ROOT / "web/app/nasdaq100-holdings/descriptions.json"
DATA_TS      = ROOT / "web/app/nasdaq100-holdings/data.ts"

_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# ── Invesco 공식 JSON API (primary) ───────────────────
# 예전 CSV 다운로드 URL은 이제 웹사이트 HTML을 반환하므로 사용하지 않음.
INVESCO_API_URLS = [
    "https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/QQQ/holdings/fund"
    "?idType=ticker&interval=monthly&productType=ETF",
    "https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/QQQ/holdings/fund"
    "?idType=ticker&productType=ETF",
]
INVESCO_API_HEADERS = {
    "User-Agent": _BROWSER_UA,
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.invesco.com",
    "Referer": "https://www.invesco.com/",
}

# ── Slickcharts 나스닥100 지수 비중 (fallback) ─────────
SLICKCHARTS_URL = "https://www.slickcharts.com/nasdaq100"
SLICKCHARTS_HEADERS = {
    "User-Agent": _BROWSER_UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# 데이터 소스에서 얻은 영문 종목명 (신규 편입 종목의 임시 이름으로 사용)
SOURCE_NAMES: dict[str, str] = {}

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
# 데이터 취득: Invesco JSON API (primary) → Slickcharts (fallback)
# ─────────────────────────────────────────────────────
def fetch_via_invesco_api() -> tuple[str, list[dict]]:
    """Invesco 공식 holdings JSON API"""
    last_err: Exception | None = None
    for url in INVESCO_API_URLS:
        print(f"Invesco API 조회: {url}")
        try:
            resp = requests.get(url, headers=INVESCO_API_HEADERS, timeout=30)
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
    raise RuntimeError(f"Invesco API 실패: {last_err}")


def _extract_json_holdings(data) -> tuple[list[tuple[str, float]], str]:
    """JSON 구조를 몰라도 (ticker, weight) 목록을 찾아낸다.

    dict 리스트 중 ticker/symbol 키와 weight/percent 키를 가진 항목이
    가장 많은 리스트를 holdings 로 간주.
    """
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
                k = pick(node, ("asofdate", "effectivedate", "holdingsdate", "asof"))
                if k and isinstance(node[k], str):
                    as_of = node[k]
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            dicts = [x for x in node if isinstance(x, dict)]
            if dicts:
                tk = pick(dicts[0], ("ticker", "symbol"), ("fund",))
                wk = pick(dicts[0], ("weight", "percent"))
                if tk and wk:
                    rows = []
                    for d in dicts:
                        t = str(d.get(tk) or "").strip().upper()
                        try:
                            w = float(str(d.get(wk)).replace("%", "").replace(",", ""))
                        except ValueError:
                            continue
                        if t and t not in ("-", "NAN", "NONE"):
                            rows.append((t, w))
                    if len(rows) > len(best):
                        best = rows
            for v in node:
                walk(v)

    walk(data)
    # 0~1 비율로 오는 경우 % 로 환산
    if best and sum(w for _, w in best) < 2:
        best = [(t, w * 100) for t, w in best]
    return best, as_of


def fetch_via_slickcharts() -> tuple[str, list[dict]]:
    """Slickcharts 나스닥100 지수 구성/비중 (QQQ와 사실상 동일)"""
    print(f"Slickcharts 조회: {SLICKCHARTS_URL}")
    resp = requests.get(SLICKCHARTS_URL, headers=SLICKCHARTS_HEADERS, timeout=30)
    resp.raise_for_status()
    html = resp.text
    # 페이지에 사이드바 시세 표(SPY/QQQ/DIA 등)도 있으므로 'Weight' 헤더가 있는 표만 사용
    tables = re.findall(r"<table[^>]*>.*?</table>", html, re.S | re.I)
    main_table = next((t for t in tables if re.search(r">\s*Weight\s*<", t, re.I)), "")
    # 헤더에서 Company / Symbol / Weight 열 위치를 찾아 셀 단위로 읽는다
    def cells(tr: str, tag: str) -> list[str]:
        raw = re.findall(rf"<{tag}[^>]*>(.*?)</{tag}>", tr, re.S | re.I)
        return [re.sub(r"<[^>]+>", "", c).replace("&amp;", "&").strip() for c in raw]

    trs = re.findall(r"<tr[^>]*>(.*?)</tr>", main_table, re.S | re.I)
    header = next((cells(tr, "th") for tr in trs if "<th" in tr.lower()), [])
    col = {h.lower(): i for i, h in enumerate(header)}
    i_sym, i_wt, i_name = col.get("symbol"), col.get("weight"), col.get("company")
    if i_sym is None or i_wt is None:
        raise ValueError(f"Slickcharts 표 헤더 인식 실패: {header}")

    rows = []
    for tr in trs:
        tds = cells(tr, "td")
        if len(tds) <= max(i_sym, i_wt):
            continue
        ticker = tds[i_sym].upper().replace(".", "-")
        try:
            weight = float(tds[i_wt].replace("%", "").replace(",", ""))
        except ValueError:
            continue
        if ticker:
            rows.append((ticker, weight))
            if i_name is not None and i_name < len(tds):
                SOURCE_NAMES[ticker] = tds[i_name]
    # 같은 종목이 중복 등장하면 첫 행만
    seen, uniq = set(), []
    for t, w in rows:
        if t not in seen:
            seen.add(t)
            uniq.append((t, w))
    if not uniq:
        print(f"  파싱 실패 — 응답 앞부분: {html[:500]!r}")
    return _to_holdings("", uniq)


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
        descs[ticker] = {"name": SOURCE_NAMES.get(ticker, ticker), "sector": "", "products": "", "type": "stock"}
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

    # 1. 데이터 취득 (Invesco API → Slickcharts 순)
    as_of_kr, holdings = "", []
    source = ""
    for fetch, label in ((fetch_via_invesco_api, "Invesco"), (fetch_via_slickcharts, "Slickcharts (NDX)")):
        try:
            as_of_kr, holdings = fetch()
        except Exception as e:  # noqa: BLE001
            print(f"{fetch.__name__} 실패: {e}")
            holdings = []
            continue
        if len(holdings) >= MIN_HOLDINGS:
            print(f"{fetch.__name__} 성공")
            source = label
            break
        print(f"{fetch.__name__}: 종목 수 {len(holdings)}개 — 비정상 데이터로 판단, 다음 소스 시도")
        holdings = []

    if not holdings:
        print("오류: 모든 데이터 소스 실패 — data.ts 를 변경하지 않습니다.")
        sys.exit(1)

    total = sum(h["weight"] for h in holdings)
    print(f"기준일: {as_of_kr}  |  종목 수: {len(holdings)}  |  비중 합계: {total:.2f}%")
    if not 95 <= total <= 105:
        print(f"오류: 비중 합계 {total:.2f}% 가 비정상 — data.ts 를 변경하지 않습니다.")
        sys.exit(1)

    # 2. descriptions 로드
    if not DESCRIPTIONS.exists():
        print("⚠️  descriptions.json 없음 — --init 으로 먼저 초기화하세요.")
        sys.exit(1)
    descs = json.loads(DESCRIPTIONS.read_text(encoding="utf-8"))

    # 3. 편입/편출 감지
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

    # 4. data.ts 재생성
    ts = generate_data_ts(as_of_kr, holdings, descs, source)
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
