# justkeepbuyingtqqq

TQQQ·QLD·QQQ·VOO 레버리지 ETF 장기 적립식 투자 → 목표자산 달성 → 인출(FIRE) 전 과정을
과거 데이터로 백테스트하고 웹사이트로 공개하는 프로젝트.

---

## 폴더 구조

```
justkeepbuyingtqqq/
│
├── data/                        ← 원본 데이터 (절대 건드리지 말 것)
│   ├── ndx_1971_now.csv             NDX 일별 종가 (1971-02-05 ~ 2026-09-25)
│   ├── sp500_1927_now.csv           S&P500 일별 종가 (1927-12-30 ~ 2026-09-03)
│   ├── mcv_ndx_2x_monthly_10b.json  NDX 2x A전략 10억 골든셋 (검증용)
│   └── mcv_spx500_1x_monthly_10b.csv  SP500 1x C전략 10억 검증용
│
├── docs/                        ← 분석 문서 (이전 세션에서 보존된 결론)
│   ├── 00_overview.md               프로젝트 전체 개요
│   ├── 01_methodology.md            백테스트 로직 정확한 스펙
│   ├── 02_findings_accumulation.md  A/B/C 전략 분석 결과
│   ├── 03_findings_split_strategy.md  거치금 분할매수 분석
│   ├── 04_findings_withdrawal_fire.md ← 인출(파이어) 분석 (미완)
│   ├── 05_findings_patterns.md      시장 패턴 탐색
│   └── 06_data_sources.md           데이터 파일 설명
│
├── results/                     ← 백테스트 결과 Excel
│   ├── mcv_1x_compare_A_B_C_10b.xlsx    NDX 1x, A/B/C, 10억
│   ├── mcv_1x_compare_A_B_C_20b.xlsx    NDX 1x, A/B/C, 20억
│   ├── mcv_2x_compare_A_B_C_10b.xlsx    NDX 2x, A/B/C, 10억
│   ├── mcv_2x_compare_A_B_C_20b.xlsx    NDX 2x, A/B/C, 20억
│   ├── mcv_3x_compare_A_B_C_10b.xlsx    NDX 3x, A/B/C, 10억
│   ├── mcv_3x_compare_A_B_C_20b.xlsx    NDX 3x, A/B/C, 20억
│   ├── mcv_spx500_1x_compare_A_B_C_10b.xlsx  S&P500 1x, 10억
│   ├── mcv_spx500_1x_compare_A_B_C_20b.xlsx  S&P500 1x, 20억
│   └── archive/                     이전 세션에서 만들어진 파일 (참고용)
│
├── scripts/                     ← Python 분석 코드
│   └── backtest.py                  적립식 백테스트 메인 스크립트
│
└── web/                         ← Next.js 웹사이트
    ├── app/                         페이지 (/, /simulator)
    ├── components/                  차트·UI 컴포넌트
    ├── lib/                         백테스트 로직 (TypeScript)
    └── public/                      정적 파일 (ndx.csv, sp500.csv)
```

---

## 핵심 파라미터 (기본값)

| 파라미터 | 값 |
|---|---|
| 일 투자액 | 200,000원 (20만원) |
| A전략 한도 / B전략 거치금 | 250,000,000원 (2.5억) |
| 목표금액 | 1,000,000,000원 (10억) 또는 20억 |
| NDX splice 보정 기준일 | 1985-10-01 |

---

## 백테스트 다시 돌리기

```bash
cd scripts
python backtest.py
# → results/ 폴더에 Excel 8개 생성 (약 7~13초)
```

---

## 웹사이트 실행

```bash
cd web
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 프로덕션 빌드
```

---

## 다음에 할 것

### 백테스트 추가 필요
- [ ] 거치금 분할매수 F1~F16 재현 (`docs/03_findings_split_strategy.md` 참조)
- [ ] 인출(파이어) 시뮬레이션 — 아래 설계 참고

### 인출 시뮬레이션 설계 (진행 중)
`docs/04_findings_withdrawal_fire.md` 에 미결 항목 있음.
기본 베이스라인:
- 목표 달성 후 TQQQ에서 VOO/QQQ로 레버리지 낮추기
- 월 1% 인출 (10억 기준 월 1,000만원)
- 조건부 캐시 버퍼: 적립 소요기간 < 1.5년이면 `버퍼_연수 = max(0, 8 - 소요기간)` 만큼 현금 비축
- 확인이 필요한 미결 항목 3가지 (`04_findings_withdrawal_fire.md` ⚠️ 섹션)

### 웹사이트
- [ ] 디자인 개선
- [ ] 인출 시뮬레이터 페이지 추가
- [ ] GitHub 연동 → Vercel 배포
- [ ] Supabase 연동 (나중에 — 커뮤니티 기능용)

---

## 주의사항

- `data/` 의 CSV 파일은 **절대 수정 금지**. 웹용 복사본은 `web/public/` 에 있음.
- NDX 합성가격 = `100 × cumprod(1 + 일일수익률 × 레버리지)` — 운용비용 미반영.
- 닷컴버블(1999-2000)이 유일하게 관측된 극단 사례. 표본이 한정적임.
