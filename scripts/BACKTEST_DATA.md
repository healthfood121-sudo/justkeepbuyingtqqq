# 백테스트 데이터 목록

`web/public/data/` 에 저장된 JSON 파일 목록.
재실행 시 해당 스크립트를 `python scripts/<script>.py` 로 실행.

---

## 적립식 (Accumulation)

### A·B·C 전략 비교 — 종목별

| 파일 | 크기 | 스크립트 | 종목 | 코호트 수 |
|------|------|----------|------|-----------|
| `cohorts_ndx3x_10b.json` | 132 KB | `export_cohorts_json.py` | TQQQ (NDX 3x) | 668 |
| `cohorts_ndx2x_10b.json` | 132 KB | `export_cohorts_json.py` | QLD (NDX 2x) | 668 |
| `cohorts_ndx1x_10b.json` | 132 KB | `export_cohorts_json.py` | QQQ (NDX 1x) | 668 |
| `cohorts_sp500_10b.json` | 236 KB | `export_cohorts_json.py` | VOO (SP500) | 1,186 |

**공통 파라미터:** 일 20만원 · 거치/한도 2.5억 · 목표 10억 · 시작 1971-01 (SP500은 1928-01)

**구조:** `{ meta, rows: [{ s, sA/yA/eA/iA, sB/yB/eB/iB, sC/yC/eC/iC }] }`
- `s` = 시작일, `sX` = 완료여부(`completed`/`ongoing`), `yX` = 소요기간(년), `eX` = 달성일, `iX` = 누적투입금

**사용처:** `/app/simulator` (메인 시뮬레이터), `/posts/strategy-abc/data` (전략 비교 뷰어)

---

### 거치 진입 방식 비교

| 파일 | 크기 | 스크립트 | 종목 |
|------|------|----------|------|
| `split_entry_ndx3x.json` | 253 KB | `export_split_entry_json.py` | TQQQ |
| `split_entry_ndx2x.json` | 252 KB | `export_split_entry_json.py` | QLD |
| `split_entry_ndx1x.json` | 252 KB | `export_split_entry_json.py` | QQQ |

**파라미터:** 일 20만원 · 거치 2.5억 · 목표 10억

**비교 방식:** 즉시거치 / 1·2·3년 시간분할 / 하락대기(-10%/-20%/-30%) 등

**사용처:** `/posts/lump-sum-vs-split/data`

---

### 가상 NDX (1929년 대공황 시뮬레이션)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `synthetic_ndx_cohorts.json` | 266 KB | `export_synthetic_chart_data.py` | 베타(β) 별 코호트 소요기간 산점도 |
| `synthetic_ndx_prices.json` | 135 KB | `export_synthetic_chart_data.py` | 베타별 월별 가격 히스토리 (1927~) |

**방법:** SP500과 NDX의 베타 회귀로 pre-1971 NDX 합성. β = 0.8·1.0·1.14·1.24·1.5·2.0 비교.

**사용처:** `/posts/synthetic-ndx-1929`

---

## 인출식 (Withdrawal)

### 기본 인출 코호트

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cohorts.json` | 91 KB | `export_withdrawal_json.py` | 기본 인출 시뮬레이션 418코호트 |

**파라미터:** 버퍼 13개월 · 일 20만 · 거치 2.5억 · 목표 10억

**사용처:** `/posts/withdrawal-strategy` (인출 전략 기초 포스트)

---

### 전략 비교: SP500 드로다운 vs NDX MA200

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_comparison.json` | 195 KB | `compare_withdrawal_strategies.py` | A안 vs B안 418코호트 요약 |
| `withdrawal_monthly.json` | 2,347 KB | `compare_withdrawal_strategies.py` | 월별 상세 (코호트별 자산 추이) |

**A안:** SP500 -20% → 인출 중단 (계속 TQQQ 보유), 월 1% 인출
**B안:** NDX EMA200 이탈 → 전량 현금 전환, 이자로 생활 (세금 22%)

**결과:** 중앙값 B안 203억 vs A안 12.7억

**사용처:** `/posts/withdrawal-comparison`, `/posts/withdrawal-comparison/data/cohort`

---

### 전략 스윕: MA200 신호 + 인출률 조합

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_sweep.json` | 1,089 KB | `withdrawal_strategy_sweep.py` | 13가지 전략 조합 418코호트 |

**비교 전략 목록:**
- B0: 기준 MA200 (threshold=0%)
- B1: 이격도 버퍼 ±3%
- B2: 이격도 버퍼 ±5%
- B3: 연속일 필터 10일 ← 최종 채택
- B4: 월말 단일 체크
- B5: 이격도 ±3% + 월말 체크
- C0: 고정 생활비 500만/월
- C1: 동적 인출률 0.3/0.5/0.7% ← 최종 채택
- C2: 현금 버퍼 24개월
- D0: SP500 OR MA200
- D1: SP500 AND MA200 (보수적)
- D2: SP500 -15% AND MA200 -5% 이중 확인
- **B3C1: ★ 연속10일 + 동적인출률 → 중앙값 619억**

**후속:** EMA200 연속15일 전략이 B3C1보다 우세 (→ `withdrawal_param_sweep.json`)

**사용처:** `/posts/withdrawal-guide` (간접 참조)

---

### 파라미터 스윕: EMA 기간·연속일 조합

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_param_sweep.json` | 35 KB | `withdrawal_param_sweep.py` | 95가지 파라미터 조합 요약 |

**스윕 범위:** EMA 기간(50·100·150·200·250) × 연속일(1~20) 조합

**결과:** EMA200 + 연속15일이 중앙값 1,176억으로 최선 → 현재 최종 채택

**사용처:** 포스트 없음 (withdrawal-guide 근거 데이터)

---

### 이중 버퍼 실험

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_2buffer.json` | 1 KB | `withdrawal_2buffer.py` | 현금 + 채권 이중 버퍼 실험 |

**결과:** 유의미한 개선 없음, 폐기

**사용처:** 없음

---

### 새 아이디어 8가지

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_new_ideas.json` | 294 KB | `withdrawal_new_ideas.py` | 8가지 아이디어 418코호트 |

**비교 전략:**
- S0: 현재 최선 (EMA200-15일 + 동적인출 0.3/0.5/0.7%)
- S1: 골든/데스크로스 (EMA50×EMA200 교차)
- S2: 분할재진입 3개월
- S3: 분할재진입 6개월
- S4: Guyton-Klinger (120%/80% 인출률 규칙)
- S5: 변동성 조정 인출 (30일 실현변동성)
- S6: 동적 레버리지 (EMA200±5%로 TQQQ↔QQQ)
- **S7: RSI 조기재진입 (RSI<30 즉시 매수) → 중앙값 3,231억으로 최선 2.75배**
- S8: Floor 보장형 (최소 500만/월)

**사용처:** `/posts/withdrawal-new-ideas` (포스트 아직 없음)

---

### RSI 조기재진입 세부 스윕

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_rsi_sweep.json` | 524 KB | `withdrawal_rsi_sweep.py` | RSI 임계값·기간·조건 16가지 변형 |
| `withdrawal_rsi_weekly.json` | 236 KB | `withdrawal_rsi_weekly.py` | 주간 RSI 변형 |

**스윕 항목 (rsi_sweep):**
- RSI 임계값: R20/R25/R30/R35/R40
- 이격도 조건 추가: D05/D10/D15
- 매도 후 경과일 조건: C30/C60/C90
- RSI 기간: P07/P14/P21
- G-K 결합: GK

**사용처:** 포스트 없음 (RSI 전략 세부 검증용)

---

### D10GK 과최적화 검증

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_overfit_check.json` | 2 KB | `withdrawal_overfit_check.py` | 3가지 OOS 테스트 (NDX 합성+SP500 1985~+민감도) |
| `withdrawal_sp500_overfit.json` | 2 KB | `withdrawal_sp500_overfit.py` | SP500 3x 전체기간 (1950~2005, 662코호트) |

**withdrawal_sp500_overfit.json 결과 (재검증):**
- 전체 662코호트: D10GK 88억 > S0 48억, 개별 83.1% 승률 → ✅
- pre-1985 OOS 410코호트: D10GK 81억 > S0 44억, 82.9% 승률 → ✅
- 1985~2005: 중앙값은 S0 우세(133 vs 111)이나 개별 승률 83.3% — 1987-08(블랙먼데이) 특수케이스

**사용처:** `/posts/withdrawal-new-ideas` 11번 섹션

---

### 새 아이디어 2차 실험 (트레일링스탑 / 단계적현금화 / 자산레버리지하향)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_new_ideas2.json` | 234 KB | `withdrawal_new_ideas2.py` | 7가지 전략 418코호트 비교 |

**비교 전략:**
- S0: 기준선 (EMA200 15일 + 동적인출)
- D10GK: 현재 최선 (RSI<30+이격도<-10%+GK)
- T15/T20/T25: 트레일링 스탑 (-15%/-20%/-25%)
- GRAD: 단계적 현금화 (이격도 -5/-10/-15% 구간별 33%/67%/100%)
- DLEV: 자산 연동 레버리지 하향 (50억↓TQQQ, 50~200억 50/50, 200억↑QQQ)

**결과 (668 시작점, 20년 완료 428개 기준 중앙값):**
- D10GK 3,741억 > S0 1,109억 > T25 1,064억 > T20 610억 > T15 572억 > DLEV 474억 > GRAD 131억
- 핵심 발견: 단계적 현금화가 예상과 달리 최하위 (고점 매도·저점 재매수 패턴 악화)
- T20가 2003-03에서 322억으로 D10GK(231억) 초과 — 장기 하락 이후 구간 특수성
- T25가 2009-03(금융위기 바닥 진입)에서 2,675억으로 D10GK(1,588억)보다 68% 우세 — 장기 상승장 보유 강점

**사용처:** `/posts/withdrawal-new-ideas2` + `/posts/withdrawal-new-ideas2/data`

---

### VR 인출식 파라미터 스윕

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `vr_sweep.json` | 28 KB | `export_vr_sweep_json.py` | VR 216가지 조합 요약 통계 |

**스윕 변수:**
- G: 20, 30, 40, 50, 60, 70, 80, 90, 100 (9가지)
- 초기 P 비율: 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80% (8가지)
- 월 인출률: 0.5%, 1.0%, 1.5% (3가지)
= 216가지 VR 조합 + S0 기준선

**결과 요약:**
- 생존율 100% 조합 없음 (최고 23.6%)
- 최고 생존율: G=100, P=80%, 월 0.5% → 23.6%
- 최선 인출 총액: G=70, P=10%, 월 1.5% → 21억 (S0=557억 대비 4%)
- 구조적 원인: V 상단 메커니즘이 상승장 매도를 제한 → Pool 보충 어려움

**사용처:** `/posts/vr-strategy`

---

### 추가 아이디어 6가지 (ATH 드로다운 / QLD 헤지 / 의무보유 / 인출중단)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_more_ideas.json` | 230 KB | `withdrawal_more_ideas.py` | 6가지 아이디어 418코호트 비교 |

**비교 전략:**
- M0: D10GK 기준선 (EMA200-15일 + RSI<30 & 이격도<-10% + GK)
- M1: ATH -30% 단독 매도 (EMA200 대신)
- M2: ATH -25% OR EMA200-15일 (더 빠른 트리거)
- M3: ATH -30% AND EMA200-15일 (둘 다 충족해야 매도 — 보수적)
- M4: QLD 헤지 (매도 시 현금 대신 QLD 2배 보유)
- M5: 의무 보유 63일 (RSI 재진입 후 3개월 매도 금지)
- **M6: ATH -50% 이하면 인출 중단 → 중앙값 3,951억 (+1%)**

**결과 요약 (418 시작 시점, 중앙값):**
- M6=3,951억 > M0=3,912억 > M2=2,629억 > M4=422억 > M5=338억 > M3=314억 > M1=245억
- **핵심 발견:** D10GK는 이미 거의 최적. ATH 기반 매도 신호 전부 열등. QLD 헤지는 하락장 2배 손실로 대참사.
- M6만 소폭 개선(+1%) — 대공황급(-50%) 구간 인출 중단이 미약하게 도움
- 2003-03 저점 진입 시 M1/M3(423억)이 M0(231억) 2배 우세 — ATH 드로다운 미도달로 매도 없이 보유

**사용처:** 없음 (브레인스토밍 검증용)

---

## 미사용 / 탐색용 스크립트

| 스크립트 | 출력 | 상태 |
|----------|------|------|
| `withdrawal_adaptive_test.py` | 없음 (터미널 출력) | 적응형 생활비 vs 고정 생활비 비교 (S0/T25/D10GK × 668 시작점) — 결론: 세 전략 모두 완전 동일, 적응형 규칙 미발동 확인 |
| `vr_withdrawal_backtest.py` | 없음 (터미널 출력) | 라오어 VR 인출식 탐색용 (G값 스윕)
| `backtest.py` | 없음 (터미널 출력) | 초기 탐색용 |
| `split_entry_backtest.py` | 없음 | 초기 탐색용 |
| `synthetic_ndx_beta_sweep.py` | 없음 | 초기 탐색용 |
| `withdrawal_backtest.py` | 없음 | 초기 탐색용 |
| `withdrawal_buffer_sweep.py` | 없음 | 초기 탐색용 |
| `withdrawal_overfit_check.py` | `withdrawal_overfit_check.json` (미생성) | 과적합 검증용 |
| `update_nasdaq100_holdings.py` | `web/app/nasdaq100-holdings/descriptions.json` | 나스닥100 종목 설명 업데이트 |

---

## 연구 진행 순서 (인출식)

```
withdrawal_backtest.py          ← 초기 아이디어
    ↓
withdrawal_buffer_sweep.py      ← 버퍼 크기 탐색
    ↓
compare_withdrawal_strategies.py → withdrawal_comparison.json
    (A안 12.7억 vs B안 203억 확인 → MA200 전략으로 방향 전환)
    ↓
withdrawal_strategy_sweep.py    → withdrawal_sweep.json
    (13가지 전략 비교 → B3C1 최선, 619억)
    ↓
withdrawal_param_sweep.py       → withdrawal_param_sweep.json
    (EMA 기간·연속일 최적화 → EMA200+15일, 1,176억)
    ↓
withdrawal_new_ideas.py         → withdrawal_new_ideas.json
    (8가지 아이디어 → RSI<30 재진입이 3,231억으로 최선)
    ↓
withdrawal_rsi_sweep.py         → withdrawal_rsi_sweep.json
withdrawal_rsi_weekly.py        → withdrawal_rsi_weekly.json
    (RSI 조건 세부 검증 → D10GK 최종 채택, 3,918억)
    ↓
withdrawal_more_ideas.py        → withdrawal_more_ideas.json
    (ATH 드로다운·QLD 헤지·의무보유·인출중단 6가지 추가 검증)
    (M6 인출중단 +1% 개선 외 전부 열등 → D10GK 최종 확정)
```

**권장 전략 (2026-10):** S0 — EMA200-15일 연속 + 동적인출률 0.3/0.5/0.7%
- 668 시작 시점 생존율 100%, 중앙값 1,109억
- 구조적으로 매수 후 최소 15거래일 보유 보장 → 장기 하락 시에도 심리적 유지 가능

**수익 극대화 옵션:** D10GK — EMA200-15일 + RSI<30 & 이격도<-10% + GK인출
- 668 시작 시점 생존율 100%, 중앙값 3,741억
- 닷컴버블(2000-2002) 등 장기 하락에서 매수 다음날 재매도 사이클 반복 위험
- 브레인스토밍 6가지 추가 아이디어 모두 검증 완료 → 추가 개선 여지 없음

**라오어 VR 인출식 탐색 결과 (2026-10):**
- `vr_withdrawal_backtest.py`: G값 20~100 스윕, 생존율 최고 23.6% (G=100, P=80%, 0.5%)
- `export_vr_sweep_json.py`: 216가지 조합 스윕, 생존율 100% 조합 없음
- 결론: VR 인출식은 TQQQ 고변동성 환경에서 구조적 한계 → 채택 불가
