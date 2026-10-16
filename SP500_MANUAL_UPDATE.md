# S&P 500 신규 편입 종목 수동 입력 가이드

## 언제 필요한가

매주 월요일 GitHub Actions가 자동으로 돌면서 신규 편입 종목을 감지하면
`web/app/sp500-holdings/descriptions.json` 에 아래처럼 빈 항목을 추가한다.

```json
"TICKER": {
  "name": "Company Name (영문, Slickcharts 기준)",
  "sector": "",
  "products": "",
  "type": "stock"
}
```

`sector` 와 `products` 가 비어 있으면 사이트 테이블에 해당 칸이 공백으로 표시된다.
아래 절차대로 직접 채우면 된다.

---

## 수정할 파일

```
web/app/sp500-holdings/descriptions.json
```

---

## 수정 방법

1. `web/app/sp500-holdings/descriptions.json` 파일을 텍스트 에디터로 열기
2. `Ctrl+F` 로 빈 항목 찾기: `"sector": ""`
3. 해당 종목의 `sector` 와 `products` 채우기

### 입력 예시

**채우기 전:**
```json
"VST": {
  "name": "Vistra Corp",
  "sector": "",
  "products": "",
  "type": "stock"
}
```

**채운 후:**
```json
"VST": {
  "name": "Vistra Corp",
  "sector": "유틸리티",
  "products": "전력 생산·판매 (원자력·천연가스·태양광), 텍사스 최대 전력사",
  "type": "stock"
}
```

---

## 섹터 목록 (기존 종목과 통일)

| 섹터 표기 | 해당 업종 |
|---|---|
| 정보기술 | 반도체, 소프트웨어, 하드웨어 |
| 헬스케어 | 제약, 바이오, 의료기기 |
| 금융 | 은행, 보험, 자산운용 |
| 임의소비재 | 자동차, 유통, 호텔, 외식 |
| 필수소비재 | 식음료, 생활용품 |
| 산업재 | 방산, 항공우주, 기계, 물류 |
| 에너지 | 석유, 천연가스, 정유 |
| 유틸리티 | 전력, 가스, 수도 |
| 소재 | 화학, 광업, 금속 |
| 부동산 | 리츠(REIT) |
| 통신 | 통신사, 미디어 |

---

## 수정 후 반영 방법

파일 저장 후 git 커밋·푸시하면 Vercel이 자동 배포한다.

```bash
git add web/app/sp500-holdings/descriptions.json
git commit -m "S&P 500 신규 편입 종목 설명 추가: TICKER"
git push
```

---

## 편출 종목 처리 (선택)

GitHub Actions 로그에서 `편출` 로 표시된 종목은 `descriptions.json` 에서
자동으로 삭제되지 않는다. 깔끔하게 정리하려면 해당 티커 항목을 직접 삭제하면 된다.
(삭제 안 해도 사이트 동작에는 영향 없음)
