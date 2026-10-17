"""
sp500.csv → public/data/sp500_monthly.json
월별 종가(각 월의 마지막 거래일 종가)만 추출.
형식: [{d: "YYYY-MM", p: 1234.56}, ...]
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
SRC  = ROOT / 'web' / 'public' / 'sp500.csv'
OUT  = ROOT / 'web' / 'public' / 'data' / 'sp500_monthly.json'

monthly: dict[str, float] = {}  # key = "YYYY-MM"

with open(SRC, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        date  = row['Date']       # "YYYY-MM-DD"
        close = float(row['Close'])
        ym    = date[:7]          # "YYYY-MM"
        monthly[ym] = close       # 덮어쓰면 자연스럽게 마지막 거래일이 남음

result = [{'d': k, 'p': round(v, 2)} for k, v in sorted(monthly.items())]
OUT.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
print(f'저장 완료: {OUT} ({len(result)}개월)')
