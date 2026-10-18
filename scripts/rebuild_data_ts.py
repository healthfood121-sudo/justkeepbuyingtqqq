"""descriptions.json을 기반으로 data.ts 재생성 (네트워크 패치 없이)"""
import json, re
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).parent.parent
DESCRIPTIONS = ROOT / "web/app/sp500-holdings/descriptions.json"
DATA_TS = ROOT / "web/app/sp500-holdings/data.ts"

with open(DESCRIPTIONS, encoding="utf-8") as f:
    desc = json.load(f)

src = DATA_TS.read_text(encoding="utf-8")

# 기존 META 정보 추출
asof_m = re.search(r"asOf: '([^']+)'", src)
source_m = re.search(r"source: '([^']+)'", src)
as_of_kr = asof_m.group(1) if asof_m else "2026년 10월 16일"
source = source_m.group(1) if source_m else "Slickcharts"

# holdings 파싱: { rank: N, ticker: '...', name: '...', weight: N.NN, ... }
holding_re = re.compile(
    r"\{\s*rank:\s*(\d+),\s*ticker:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)',"
    r"\s*weight:\s*(-?[\d.]+),\s*sector:\s*'((?:[^'\\]|\\.)*)',"
    r"\s*products:\s*'((?:[^'\\]|\\.)*)',\s*type:\s*'([^']+)'\s*\}"
)
matches = holding_re.findall(src)
print(f"파싱된 항목 수: {len(matches)}")

def ts_str(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")

rows = []
for rank, ticker, old_name, weight, old_sector, old_products, old_type in matches:
    d = desc.get(ticker, {})
    name     = ts_str(d.get("name", old_name))
    sector   = ts_str(d.get("sector", old_sector))
    products = ts_str(d.get("products", old_products))
    htype    = d.get("type", old_type)
    rows.append(
        f"  {{ rank: {int(rank):3d}, ticker: '{ticker}', name: '{name}', "
        f"weight: {float(weight):.2f}, sector: '{sector}', "
        f"products: '{products}', type: '{htype}' }},"
    )

today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
body = "\n".join(rows)

content = f"""\
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
  source: '{source}',
  price: '',
  priceDate: '',
}}

export const HOLDINGS: Holding[] = [
{body}
]
"""

DATA_TS.write_text(content, encoding="utf-8")
print(f"data.ts 재생성 완료 → {DATA_TS}")

# 검증
empty_count = sum(1 for line in content.split("\n") if "sector: ''" in line)
print(f"빈 sector 항목: {empty_count}개")
