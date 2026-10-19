# 새 종목 롤링 분석 추가 가이드

새 종목을 `/private` 페이지에 추가할 때 이 파일을 읽고 순서대로 진행한다.

---

## 1. 사전 확인

| 항목 | 확인 방법 | 비고 |
|------|-----------|------|
| Yahoo Finance 티커 | `yfinance.Ticker("XXX").history(period="max")` | 데이터가 언제부터 있는지 확인 |
| 초기 구간 주가 신뢰성 | 1990년 이전이면 분할 이력 누락 의심 | TradingView adj-on 가격과 비교 |
| EPS 데이터 | 미국주식 → EDGAR XBRL, 외국주식 → AI 추정 | 아래 §3 참고 |
| 상장 통화 | USD / EUR / JPY 등 | JSON `currency` 필드에 기록 |

---

## 2. 분석 스크립트 생성

`scripts/analyze_nke.py` 또는 `scripts/analyze_rms.py`를 복사해서 `analyze_XXX.py`를 만든다.

### 주요 수정 포인트

```python
# 1) 티커 변경
az = RollingAnalyzer("XXX", benchmark="^SP500TR")

# 2) 초기 구간 주가 보정 (필요한 경우만)
# Yahoo Finance가 1990년 이전 분할을 누락하면 TradingView adj-on 가격으로 대체
_TV_BUY_PRICE = {1980: 0.0871, ...}  # TradingView에서 직접 확인한 값

# 3) 검증값 (기존에 macrotrends 등에서 확인한 CAGR이 있으면 REFERENCE 딕셔너리에 넣기)
REFERENCE = {1990: 15.2, 1995: 18.5, ...}
```

스크립트 실행 후 검증 섹션에서 ±0.5pp 이내면 통과.

---

## 3. EPS 데이터 수집

### 미국 상장 주식 (EDGAR XBRL)

```python
import requests, json

CIK = "0000320187"  # SEC EDGAR에서 회사 검색 후 CIK 확인
url = f"https://data.sec.gov/api/xbrl/companyconcept/{CIK}/us-gaap/EarningsPerShareDiluted.json"
data = requests.get(url, headers={"User-Agent": "me@example.com"}).json()

# units.USD 중 form=10-K, accn이 가장 최근인 값만 추출
entries = data["units"]["USD"]
fy_eps = {}
for e in entries:
    if e.get("form") != "10-K":
        continue
    fy = e.get("fy") or e.get("end", "")[:4]
    fy_eps[int(fy)] = e["val"]
```

**분할 조정 주의**: EDGAR는 해당 10-K 제출 시점 분할만 반영한다.  
예) NKE FY2008-2010 → 2012·2015 분할 미적용 → ÷4 필요  
→ 어느 10-K에서 마지막으로 보고됐는지 확인 후 조정 배수 결정.

### 외국 상장 주식 (EDGAR 없음)

AI(Claude, GPT 등)로 역산 추정:
- 현재 주가 / 현재 EPS로 PER 확인 → 과거 연도 역산
- 반드시 분할 이력 완전 반영 기준인지 확인 (split-adjusted)
- `epsNote`에 "AI 역산 추정치" 명시

---

## 4. export_rolling_json.py 수정

`scripts/export_rolling_json.py` 하단에 새 종목 블록 추가:

```python
# ── XXX EPS 데이터 ────────────────────────────────────────
_XXX_EPS = {
    2010: 1.23, 2011: 1.45, ...
}
_XXX_ONE_TIME = {
    2020: "COVID-19",  # EPS 일회성 왜곡 연도
}

# ── XXX ──────────────────────────────────────────────────
print("[XXX] 데이터 로드...")
az_xxx = RollingAnalyzer("XXX", benchmark="^SP500TR")
df10a_xxx = pd.read_csv(SRC / "XXX_10y_annual.csv", parse_dates=["buy_date","sell_date"])
fp_xxx = az_xxx.full_period()
st_xxx = summary_stats(df10a_xxx, label="XXX")

xxx_metrics = get_metrics("XXX")

xxx_out = {
    "ticker":    "XXX",
    "name":      "회사명",
    "currency":  "USD",
    "benchmark": "S&P 500",
    "note":      "",  # 데이터 특이사항
    "current":   xxx_metrics,
    "fullPeriod": fp_xxx,
    "stats": { ... },   # st_xxx에서 채우기
    "rows10y": df_to_rows(df10a_xxx, _XXX_EPS),
    "loss5y":  [],
    "epsDecomp": compute_eps_decomp(df10a_xxx, _XXX_EPS, _XXX_ONE_TIME),
    "epsNote": "EPS 출처: ...",
}

out_path = DST / "XXX_rolling.json"
out_path.write_text(json.dumps(xxx_out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"  저장 → {out_path}")
```

---

## 5. 웹 페이지 연결

`web/app/private/page.tsx` 상단에 import 추가:

```tsx
import xxxData from '@/public/data/rolling/XXX_rolling.json'
```

`STOCKS` 배열에 추가:

```tsx
const STOCKS = [
  { key: 'NKE', data: nkeData as StockData },
  { key: 'RMS', data: rmsData as StockData },
  { key: 'XXX', data: xxxData as StockData },  // 추가
]
```

→ 나머지 UI(탭, 차트, 테이블, EPS 분해)는 `StockData` 타입 기반으로 자동 렌더링됨.

---

## 6. 실행 순서 요약

```bash
# 1. 분석 스크립트 실행 (CSV 생성)
python scripts/analyze_XXX.py

# 2. JSON export
python scripts/export_rolling_json.py

# 3. 커밋·푸시
git add scripts/ web/public/data/rolling/
git commit -m "feat: XXX 롤링 분석 추가"
git push origin master
```

---

## 7. 체크리스트

- [ ] `analyze_XXX.py` 검증 섹션 ±0.5pp 통과
- [ ] EPS 데이터 연도 범위가 매수연도를 커버하는지 확인
- [ ] `epsNote`에 EPS 출처 및 분할 조정 방법 기재
- [ ] `BACKTEST_DATA.md`에 생성된 CSV/JSON 항목 추가
- [ ] private 페이지에서 탭 전환, 차트, EPS 분해 테이블 정상 표시 확인
