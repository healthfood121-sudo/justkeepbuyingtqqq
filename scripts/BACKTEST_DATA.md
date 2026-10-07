# 백테스트 데이터 목록

`web/public/data/` 에 저장된 JSON 파일 목록.
재실행 시 해당 스크립트를 `python scripts/<script>.py` 로 실행.
전략 코드: 고점 대비 하락 매도 전략은 `RULE15`·`RULE20`·`RULE25`(권장, 화면 이름 '25% 룰')·`RULE30` (2026-10-07 `T15`~`T30`에서 이름 변경 — 예전 주소 `?s=T25`, `?st=t25`는 웹에서 자동 변환).
모든 스크립트는 저장소 기준 경로(`data/`, `web/public/data/`)를 쓴다 — 어느 PC·클라우드에서든 그대로 실행된다 (2026-10-06 `D:/` 경로 일괄 정리).

---

## 적립식 (Accumulation)

### A·B·C 전략 비교 — 종목별

| 파일 | 크기 | 스크립트 | 종목 | 코호트 수 |
|------|------|----------|------|-----------|
| `cohorts_ndx3x_10b.json` | 133 KB | `export_cohorts_json.py` | TQQQ (NDX 3x) | 668 |
| `cohorts_ndx2x_10b.json` | 132 KB | `export_cohorts_json.py` | QLD (NDX 2x) | 668 |
| `cohorts_ndx1x_10b.json` | 132 KB | `export_cohorts_json.py` | QQQ (NDX 1x) | 668 |
| `cohorts_sp500_10b.json` | 237 KB | `export_cohorts_json.py` | VOO (SP500) | 1,186 |
| `cohorts_ndx3x_10b_v2.json` | 133 KB | `export_cohorts_json.py --mode v2` | TQQQ with_costs | 668 |
| `cohorts_ndx2x_10b_v2.json` | 132 KB | `export_cohorts_json.py --mode v2` | QLD with_costs | 668 |
| `cohorts_ndx1x_10b_v2.json` | 132 KB | `export_cohorts_json.py --mode v2` | QQQ (1x — v1과 동일) | 668 |

**공통 파라미터:** 일 20만원 · 거치/한도 2.5억 · 목표 10억 · 시작 1971-01 (SP500은 1928-01)
**C전략 = 거치금 5년(60개월) 월 분할** (2026-10-03 3년 → 5년, `backtest.py C_SPLIT_MONTHS`, 웹 `lib/backtest.ts C_SPLIT_MONTHS`)
- 재생성: `python scripts/backtest.py --mode both` → `python scripts/export_cohorts_json.py --mode both` (경로는 저장소 기준)
- TQQQ C (스왑 반영 v2): 중간 4.28년 · 최악 8.99년 · A 6.33/13.90 · B 6.69/19.46 (운용보수만: C 3.84/8.69)

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

### 거치금 분할 기간 재검증 (스왑금리 반영 + 꼬리 지표)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `accumulation_split_recheck.json` | 11 KB | `accumulation_split_recheck.py` | 월 분할 0~7년 × 3종목 × 운용보수만/스왑 반영 + 추가 비용 민감도 |

**배경:** 기존 "3년 분할 → TQQQ 최악 12.24년 → 8.82년"은 운용보수 반영 전 수치. 운용보수만 넣어도 3년 분할 최악 13.15년
(1999-01 시작이 2008년 금융위기 직전 10억을 넘느냐에 따라 4년 이상 달라지는 절벽). 2011년까지 시작한 경우만 비교.

**TQQQ (스왑금리 반영) — 분할 N년: 중간 / 상위10% / 상위5% / 10년+ 개수 / 최악**
- 0년 3.38 / 7.86 / 10.20 / 27 / 12.32 · 3년 3.87 / 7.32 / 8.33 / 14 / 13.32 · 4년 4.19 / 7.10 / 7.93 / 5 / 13.36
- **5년 4.44 / 7.11 / 8.00 / 0 / 8.99** · 6년 4.68 / 7.19 / 8.09 / 0 / 9.12 · 7년 4.84 / 7.25 / 8.10 / 0 / 9.02
- 운용보수만: 4년부터 10년+ 0개 (최악 8.83), 3년은 절벽(13.15)
- 추가 비용 +0.25/+0.5%p에도 5~7년은 최악 9.0~9.2로 안정, 3·4년은 13년대
- QLD(스왑 반영): 7년 분할도 10년+ 3개, 최악 12.7 — 분할로 해결 안 됨 · 나스닥100(1배): 분할할수록 오히려 나빠짐

**사용처:** C전략을 5년 분할로 변경한 근거 — `/posts/lump-sum-vs-split`, `/posts/strategy-abc`, 적립식 방법론

---

## 인출식 (Withdrawal)

### 기본 인출 코호트

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cohorts.json` | 91 KB | `export_withdrawal_json.py` | 기본 인출 시뮬레이션 628 진입 시점 (운용보수 포함) |
| `withdrawal_cohorts_v2.json` | 90 KB | `export_withdrawal_json.py --v2` | 동일 + 스왑금리 2× 반영 (626 진입 시점) |

**설정값:** 적립 = C전략(일 20만 + 거치 2.5억을 60개월 월 분할) · 목표 10억 · 버퍼 기준 BUFFER_REF_YEARS=9 (C전략 비용 반영 최악 8.99년) · 인출 Method A/B 비교
- 2026-10 재생성 (이전: 거치금 즉시 투입, BUFFER_REF 13 → 버블 케이스 112건). 재생성 후 버블 케이스(1.5년 미만 달성) 2건(1998-09, 1998-10)
- v2 결과: 평균 최종자산 A 93.5억 / B 93.6억, 평균 누적 인출 89.2억, 버블 케이스 평균 최종자산 A 135억 / B 137억

**사용처:** `/posts/withdrawal-strategy` (인출 전략 기초 포스트)

---

### 전략 비교: SP500 드로다운 vs NDX MA200

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_comparison.json` | 195 KB | `compare_withdrawal_strategies.py` | A안 vs B안 418코호트 요약 (운용보수 포함) |
| `withdrawal_monthly.json` | 2,347 KB | `compare_withdrawal_strategies.py` | 월별 상세 (코호트별 자산 추이) |
| `withdrawal_comparison_v2.json` | 215 KB | `compare_withdrawal_strategies.py --v2` | 동일 + 스왑금리 2× 반영 |
| `withdrawal_monthly_v2.json` | 2,279 KB | `compare_withdrawal_strategies.py --v2` | 월별 상세 v2 |

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
| `withdrawal_new_ideas.json` | 294 KB | `withdrawal_new_ideas.py` | 8가지 아이디어 418코호트 (운용보수 포함) |
| `withdrawal_new_ideas_v2.json` | 291 KB | `withdrawal_new_ideas.py --v2` | 동일 + 스왑금리 2× 반영 |

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
- 2026-10-05 저장소 경로로 재실행: 중앙값·승률 동일 (평균·상위 25%만 0.1~1억 차이 — 최신 가격 데이터 반영)

**사용처:** `/posts/withdrawal-new-ideas` 11번 섹션

---

### 인출 전략 거래 로그 (날짜별 매수/매도 기록)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_tradelog_rule25.json` | 554 KB | `export_withdrawal_tradelog.py` | RULE25 668 시작 시점 거래 로그 (스왑금리 반영) |
| `withdrawal_tradelog_s0.json` | 909 KB | `export_withdrawal_tradelog.py` | S0 동일 |
| `withdrawal_tradelog_rule25_fee.json` | 561 KB | `export_withdrawal_tradelog.py --fee-only` | RULE25 (운용보수만) |
| `withdrawal_tradelog_s0_fee.json` | 917 KB | `export_withdrawal_tradelog.py --fee-only` | S0 (운용보수만) |

**조건:** `withdrawal_full_period.json`과 동일 (엔진 `withdrawal_cash_tier.run_sim`, 신호 다음 거래일 매매, 모든 매도 과세, 외화RP 세후, 상한 없는 동적 인출, 오늘까지 보유)
- 거래 1건 = [실행일, S/B, 나스닥100 종가, 200일 지수이동평균, 1년 최고 종가, 거래 직후 총자산(억)]
- 2026-10-04 이전 `s0_tradelog(_v2).json`(S0, 20년, RP 이자 미반영)은 삭제하고 이것으로 대체

**사용처:** `/posts/withdrawal-guide/tradelog` (RULE25/S0 탭 + 비용 토글)

---

### 새 아이디어 2차 실험 (트레일링스탑 / 단계적현금화 / 자산레버리지하향)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_new_ideas2.json` | 234 KB | `withdrawal_new_ideas2.py` | 7가지 전략 418코호트 비교 (운용보수 포함) |
| `withdrawal_new_ideas2_v2.json` | 517 KB | `withdrawal_new_ideas2.py --v2` | 동일 + 스왑금리 2× 반영 |

**비교 전략:**
- S0: 기준선 (EMA200 15일 + 동적인출)
- D10GK: 현재 최선 (RSI<30+이격도<-10%+GK)
- RULE15/RULE20/RULE25: 트레일링 스탑 (-15%/-20%/-25%)
- GRAD: 단계적 현금화 (이격도 -5/-10/-15% 구간별 33%/67%/100%)
- DLEV: 자산 연동 레버리지 하향 (50억↓TQQQ, 50~200억 50/50, 200억↑QQQ)

**결과 (668 시작점, 20년 완료 428개 기준 중앙값):**
- D10GK 3,741억 > S0 1,109억 > RULE25 1,064억 > RULE20 610억 > RULE15 572억 > DLEV 474억 > GRAD 131억
- 핵심 발견: 단계적 현금화가 예상과 달리 최하위 (고점 매도·저점 재매수 패턴 악화)
- RULE20가 2003-03에서 322억으로 D10GK(231억) 초과 — 장기 하락 이후 구간 특수성
- RULE25가 2009-03(금융위기 바닥 진입)에서 2,675억으로 D10GK(1,588억)보다 68% 우세 — 장기 상승장 보유 강점

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

### 신호 변형 테스트 (TQQQ EMA200 신호 / 인출 시작 지연)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_signal_test.json` | 122 KB | `withdrawal_signal_test.py` | 4가지 변형 418코호트 비교 (운용보수 포함) |
| `withdrawal_signal_test_v2.json` | 121 KB | `withdrawal_signal_test.py --v2` | 동일 + 스왑금리 2× 반영 |

**비교 전략:**
- S0: 기준선 (NDX EMA200-15일 + 동적인출)
- TQQQ_EMA: TQQQ 합성가격 자체 EMA200-15일 신호 (NDX 원지수 대신)
- DELAY12: S0 + 12개월 인출 지연 (달성 후 1년 복리)
- DELAY24: S0 + 24개월 인출 지연 (달성 후 2년 복리)

**결과 요약 (418 시작 시점, 중앙값):**
- DELAY24=1,333억 > DELAY12=1,261억 > S0=1,176억 >> TQQQ_EMA=276억
- **TQQQ_EMA 열등 이유:** 3배 레버리지 가격에서 EMA200 교차가 너무 잦음 → 잡음을 신호로 오인 → 과매매
- **DELAY 개선 이유:** 동적 인출률로 초기 복리 시 인출 한도 자체가 커짐 → 지연 기간 희생 대비 큰 수익
- 인출 지연은 다른 수입원이 있는 경우에만 현실적

**사용처:** `/posts/withdrawal-signal-test`

---

### 금리 연동 레버리지 (스왑금리 반영 전용)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_rate_lev_v2.json` | 639 KB | `withdrawal_rate_lev.py` | 8가지 변형 668시작점 (스왑금리 2×/1× 반영) |

**비교 전략:** S0 신호(EMA200 15일 + 동적인출) 고정, 투자 중 보유 종목만 변경
- S0: 항상 TQQQ(3x) — withdrawal_new_ideas2_v2 S0와 동일 수치(265.9억) 재현 확인
- QLD: 항상 QLD(2x)
- R4/R5/R6/R7/R8/R10: 월초 기준금리 ≥ X% 이면 QLD, 미만이면 TQQQ
- 전환 시 전량 매도 → 양도세 22% (연말 정산, 250만 공제) + 수수료 0.07%×2 반영

**결과 (20년 완료 428개, 중앙값 / 하위10% / 10억 미만 개수):**
- R7 401억 / 17.7 / 0 · R6 354억 / 15.0 / 1 · R8 321억 / 14.3 / 5 · R10 279억 / 15.7 / 1
- **S0 266억 / 12.5 / 15** · QLD 193억 / 17.2 / 0 · R4 174억 / 14.8 / 4 · R5 172억 / 17.0 / 0
- 결론: 기준값에 따라 중앙값이 172~401억으로 들쭉날쭉, 단조 관계 없음 → 우연 성분 큼, **채택 안 함**
- 현재 기준금리 3.75%에서는 R4 이상 모든 규칙이 TQQQ 유지 → 당장 행동 변화 없음
- `--tax-sells` 옵션: 신호 매도에도 양도세 부과 (터미널 출력만). S0 266억 → 152억, 10억 미만 15 → 50개

**사용처:** `/posts/withdrawal-guide` 연구 흐름 '현재' 단계

---

### ★★★★ RULE25 권장 근거: 꺼내 쓴 돈 비교 + 닷컴버블 밖 구간 검증 (현재 권장 전략)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_rule25_periods.json` | 6 KB | `withdrawal_rule25_periods.py` | RULE25·S0·D10GK·RULE25C50·HOLD3 — 시점별 누적 인출 + 7개 구간 IRR |
| `withdrawal_rule25_periods_fee.json` | 6 KB | `withdrawal_rule25_periods.py --fee-only` | 동일, 운용보수만 (스왑금리 미반영 — 비용 토글용) |

**누적 인출 중간값 (10/20/30년 · 오늘까지):** RULE25 12/74/194억·773억 · S0 10/44/133·334 (20년 RULE25의 76%) · D10GK 9/46/350·687 (10년 68%, 30년 135%)
**구간 (인출 포함 연 수익률 중간값, RULE25 vs S0):**
- 1971~89 시작 10년 9.8 vs 9.9 · 1973~74 12.3 vs 11.2 · 1987 7.8 vs −0.5 · 2008 23.3 vs 17.2 · 2020·22 34.6 vs 24.9 · 2003~16 시작 33.1 vs 20.1
- 닷컴버블을 건드리지 않는 모든 10년 구간: RULE25 16.1 > D10GK 14.2 > S0 13.7 (RULE25가 S0보다 나은 경우 80%)
- TQQQ 계속 보유는 빨리 회복한 폭락(1987·2020)에서 최고지만 1973~74 −4.7%, 전체 42%가 10억 미만

**사용처:** `/posts/withdrawal-guide` (권장 전략 근거), `/posts/withdrawal-full-period` (RULE25 선택 근거 섹션) — `RULE25PeriodTable` 컴포넌트

---

### 권장 전략 설계: RULE25 + 자산별 현금 비중 (단계·버퍼·생활비 규칙 비교)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_recommend.json` | 1.2 MB | `withdrawal_recommend.py` | RULE25 기반 21가지 설계 × 668시작점 (상한 없는 인출, 오늘까지) |

**엔진 추가 옵션 (`withdrawal_cash_tier.Param`):** `liv_rule`(monthly/annual/floor75) · `rebal_sell_only`(오를 때만 현금으로) · `rebal_annual`(1년 1회 리밸) · 생활비 안정성 지표(`liv_half_pct`, `liv_worst_cut`)

**결과 (IRR 중간 / 하위10% / 낙폭 중간 / 최저자산 하위10% / 생활비 반토막 달 비율):**
- RULE25 22.4/17.1/96/3.0억/59% · A5_20(=RULE25C50) 20.9/15.8/80/3.0억/28% · A10_30 22.0/16.6/80 · A3_10 19.8/14.5/80
- 생활비 1년 고정(annual): 반토막 달 28→18%, IRR −0.5%p · 최고의 75% 하한(floor75): 최저자산 악화(2.1억) → 폐기
- 1년에 한 번 점검(R: annual 생활비 + 연 1회 파는 쪽만 리밸 + 기본 현금 b%):
  R0 20.8/15.5/87/2.9억 · R10 20.6 · R15 20.5/15.7/84/3.7억 · **R20 20.3/15.4/82/4.0억/22%** · R25 19.8/15.3/81/4.4억 · R30 19.1
- 단계 기준(3·5·10배)은 낮출수록 안전↑ 수익↓로 한 방향 — 우연한 최적점 아님
- 최저 자산이 낮은 시작 시점은 2000-01~04, 1987-08~10 (초반 폭락은 현금 비중 단계로 못 막음 → 기본 현금 버퍼로 일부 완화)

**사용처:** 없음 — 검토 결과 단순함을 우선해 기본 권장은 RULE25 단독 (현금 비중은 '다른 선택지'로만 안내)

---

### ★★★ 모든 인출 전략 — 전체 기간(오늘까지) + 10·20·30·40·50년 시점 (현재 사이트 기준)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_full_period.json` | 1.4 MB | `withdrawal_full_period.py` | 16전략 × 668시작점, 오늘까지 보유 + 10~50년 스냅샷, **인출 상한 없음** |
| `withdrawal_full_period_cap.json` | 1.4 MB | `withdrawal_full_period.py --cap` | 동일, 기존 연구의 월 1,500만원 상한 적용 (비교용) |
| `withdrawal_full_period_fee.json` | 1.4 MB | `withdrawal_full_period.py --fee-only` | 동일, 운용보수만 (TQQQ·QLD 스왑금리 미반영 — 비용 토글용) |

**조건:** 엔진 `withdrawal_cash_tier.run_sim`, 실행 loc(다음 거래일, 조기 재매수만 당일 LOC), 스왑금리·모든 매도 과세·외화RP 세후,
동적 인출 월 0.3/0.5/0.7% (상한 없음 — 2026-10-03 사용자 결정: 꺼내 쓴 돈과 남은 자산을 함께 본다)
**전략:** HOLD3/2/1(신호 없이 보유) · E1(200일선 1일) · S0 · S4(S0+GK) · S7(RSI 조기) · D10GK · RULE15/20/25/30 · DLEV · C50 · D10C50 · RULE25C50
**지표:**
- 인출 포함 연 수익률(IRR): −10억 · 매달 생활비 · 마지막 남은 자산 현금흐름의 내부수익률 (10년 이상 보유 548개)
- 시점별: 꺼내 쓴 돈 + 남은 자산, 꺼내 쓴 돈, 남은 자산, 그 시점 월 생활비(중간·하위 10%)
- 최대 낙폭 · 현금 기간 · 매매/10년 · 매수 후 5일 내 재매도 · 주요 시작 시점 7곳
- 시작 시점별 행: f(남은 자산) i(IRR) dd w(누적 인출) t(매매) y/yw(시점별 자산/누적 인출)

**결과 (상한 없음, IRR 중간 / 하위10% / 10억 미만 / 낙폭 중간):**
- RULE30 23.7/17.4/0/96 · HOLD3 23.0/8.8/**232**/100 · RULE25 22.4/17.1/0/96 · RULE25C50 20.9/15.8/0/80 · D10GK 20.7/14.7/0/87
- S7 20.4 · RULE20 20.0 · HOLD2 19.6 · RULE15 19.4 · D10C50 19.0 · E1 18.6 · DLEV 18.0 · C50 17.9/14.2/0/74 · S4 17.8 · S0 17.5/14.1/0/94 · HOLD1 14.1
- 20년 시점 월 생활비 하위 10%: RULE25C50 910만 · HOLD1 763만 · RULE25 588만 · D10GK 330만 · S0 203만 · HOLD3 7만
- 낙폭은 닷컴버블(2000~02)을 거친 시작 시점이 결정 (RULE25: 2000년 이전 시작 −96%, 2003년 이후 −75%)
- 상한(월 1,500만)은 `withdrawal_strategy_sweep.py` 시절 설계. 상한이 있으면 자산이 커져도 인출이 안 늘어 남은 자산만 비현실적으로 커짐

**사용처:** `/posts/withdrawal-full-period` (+ `/data` 뷰어), 가이드·홈 수치

---

### ★★ 실행 시점 × 보유 기간 재검증 (현재 사이트 대표 수치)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_exec_horizon_v2.json` | 10 KB | `withdrawal_exec_horizon.py` | 6전략 × 실행 3방식 × 기간 3종 요약 + 실행 지연 민감도 (요약만, 시작 시점별 행 없음) |
| `withdrawal_exec_horizon_fee.json` | 10 KB | `withdrawal_exec_horizon.py --fee-only` | 동일, 운용보수만 (비용 토글용) |

**엔진:** `withdrawal_cash_tier.run_sim` (스왑금리 + 모든 매도 과세) + `exec_mode`·`exec_delay`·`snaps` 인자
- `same`: 신호 당일 종가 (기존 가정 — 종가 확정 전에는 신호를 알 수 없어 실제로는 불가능)
- `next`: 신호 다음 거래일 종가
- `loc`: D10GK의 RSI 조기 재매수만 당일 종가(LOC 매수 주문으로 구현 가능), 나머지는 다음 거래일
- 기간: 20년 · 30년 · 오늘까지(10년 이상 보유한 548개 시작 시점, 연평균 수익률)

**재생성 (2026-10-03, 인출 상한 없음 + 인출 포함 연 수익률 IRR, `--cap`으로 기존 상한 버전):**
- loc · 오늘까지 IRR 중간/하위10%: **RULE25 22.4/17.1** · D10GK 20.7/14.7 · D10C50 19.0 · Q50 18.0 · C50 17.9 · S0 17.5/14.1
- next(LOC 없이): D10GK 18.5 · 지연 1·2·3일: RULE25 22.4/25.1/23.1 · D10GK(loc) 20.7/20.5/20.0 · S0 17.5/18.7/18.3
- y20·y30 지표는 꺼내 쓴 돈 + 남은 자산(`med_total`)

**(이전, 상한 1,500만 · 남은 자산만의 연평균):**
- RULE25 22.1% / 18.3% · D10GK 18.5% / 12.6% · S0 15.1% / 11.9% · D10C50 13.9% · Q50 12.8% · C50 12.6%
- 30년·오늘까지: 모든 전략·실행 방식에서 원금(10억) 미만 0개 → 20년 '원금 미만'은 1970년대 시작분을 고금리기 직후에 자른 영향
- 실행 1·2·3일 지연: RULE25 22.1/22.7/21.8 · D10GK(loc) 18.5/17.5/16.9 · S0 15.1/16.1/15.5 → 순위 안정
- 20년 중간값은 지연 하루 이틀에 크게 흔들림 (RULE25 223/356/261억, D10GK 295/164/182억) → 비교 지표로 부적합
- D10GK를 LOC 없이 다음날 매수하면 15.9% (S0와 비슷) — 수익 대부분이 신호 당일 종가 매수에서 나옴
- 트레일링 기준 민감도 (탐색, 다음날 실행): −15% 16.5~17.6 · −20% 17.2~17.4 · −25% 21.8~22.7 · −30% 22.5~22.7 · −35% 19.6~19.7

**사용처:** `/posts/withdrawal-guide` (`WithdrawalExecTable` 컴포넌트), 홈 인출식 카드 수치

---

### ★ 25% 룰 기준값 민감도 (2026-10-07)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_rule_sensitivity.json` | SIZE1 | `withdrawal_rule_sensitivity.py` | 요약: 매도 기준 15~40%(1%p) × 재매수 5/10/15/20/30일 130개 + 같은 연속일 S0 5개 + 최고가 기간 6개월/2년 + S&P500 3배 12개, 시기별 중간값, 나스닥100·S&P500 하락 구간 목록 |
| `withdrawal_rule_sensitivity_rows.json` | SIZE2 | 같은 스크립트 | 설정값별 시작 시점별 인출 포함 연 수익률·최대 낙폭 (데이터 뷰어) |

**조건:** `withdrawal_full_period.py`와 동일 (엔진 `withdrawal_cash_tier.run_sim`, loc 실행, 스왑·모든 매도 과세·외화RP, 동적 인출 상한 없음, 오늘까지 보유, 10년 이상 보유 548개). RULE25 15일 = 22.4/17.1 재현 확인
**S&P500:** `sp500_1927_now.csv` 3배 합성(운용보수 0.88% + 스왑 2×기준금리), 1955년 이후 시작 (기준금리 1954-07부터), 같은 엔진·조건

**결과 (재매수 15일, 인출 포함 연 수익률 중간 / 하위10%):**
- 15~22%: 19.0~22.0 / 12.7~15.3 · **23~33%: 22.4~24.0 / 16.0~17.6 (평탄 구간)** · 34~40%: 21.7~25.3 / 16.5~19.4 (매매 10년에 1~2번, 낙폭 97~98%)
- 22→23% 계단: 1998-08(−22.2) · 1998-10(−23.0) · 2018-12(−23.0) · 2025-04(−22.9) 하락이 기준 바로 위에서 멈춤. 1990~2002 시작분 26.1→40.1
- 25%에서 재매수 5/10/15/20/30일: 26.3/23.5/22.4/22.9/22.1 (5일 열은 기준값에 따라 20.8~28.1로 출렁임)
- 최고가 기간 6개월/1년/2년: 22.4/22.4/21.2
- S&P500 3배 1955~: 20% 10.3 · 22.5% 10.0 · **25% 9.8/2.6** · 27.5% 8.9(10억 미만 14) · 30% 7.1(193) · S0 7.3/4.1 · 보유 7.5/0.6(224)
- 결론: 25% 유지 — 나스닥100 평탄 구간 안 + S&P500에서도 무난. 30%는 S&P500에서 무너짐

**사용처:** `/posts/rule25-sensitivity` (+ `/data` 뷰어, `RuleSensitivity` 컴포넌트), 인출 가이드 '감수해야 할 것'

---

### 인출식 매매 신호 (매일 자동 갱신)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_signal.json` | 3 KB | `export_withdrawal_signal.py` | S0·RULE25·D10GK 현재 상태, 다음 거래일 할 일, D10GK LOC 매수 가격 |

- GitHub Actions `update-withdrawal-signal.yml`: 평일 UTC 22:30(KST 07:30) 실행, 변경 시 커밋
- 데이터: `data/ndx_1971_now.csv` + Yahoo 차트 API(^NDX, TQQQ 최근 3개월). 실패 시 CSV만
- `--selftest`: LOC 환산식(내일 종가 ≤ X ⇔ RSI<30 & 200일선 −10%)을 전 구간 13,626일 검증 — 불일치 0일
- 신호·실행 규칙은 백테스트 엔진과 동일 (상태 머신을 1971년부터 돌려 현재 상태 결정)

**사용처:** 홈 인출식 카드 (`WithdrawalSignal` 컴포넌트)

---

### ★ 현실 기준 재검증 엔진: 스왑금리 + 모든 매도 과세 (자산별 현금 비중 · D10GK · RULE25)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cash_tier_v2.json` | 655 KB | `withdrawal_cash_tier.py` | 9가지 전략 668시작점, summary는 과세 2모드 (`tax_all` / `no_signal_tax`) |

**(이전) 사이트 대표 수치:** `summary.tax_all` — S0 150억, D10GK 393억 (신호 당일 매매 가정). 현재는 `withdrawal_exec_horizon_v2.json`으로 대체

**엔진 재현 확인 (`no_signal_tax` 모드 vs 원본 new_ideas2_v2):** S0 248 vs 266 · D10GK 809 vs 841 · RULE25 174 vs 195
(차이: VOO 편입 규칙 없음, 세금을 원천 적립 대신 다음 해 1월 납부)

**규칙:** S0 신호 고정. 투자 중 총자산(현금 포함) 기준 TQQQ 목표 비중, 나머지 현금(외화RP). 생활비는 현금 먼저.
월초 목표 비중과 5%p 넘게 벌어지면 리밸런싱. 재매수 신호 때도 목표 비중만큼만 TQQQ 매수.
- S0: TQQQ 100% · C50: 50억↑ ⅔, 200억↑ ⅓ · C30: 30억/100억 · C100: 100억/300억 · C50S: 50억↑ ⅔ 한 단계
- Q50: DLEV와 같은 노출(50억↑ TQQQ½+나스닥100½, 200억↑ 나스닥100) — 같은 엔진·세금으로 비교용
- D10GK: RSI(14)<30 & EMA200 대비 -10% 이하 즉시 재매수 + Guyton-Klinger (new_ideas2와 동일 규칙)
- RULE25: NDX 52주 고점 대비 -25% 매도, 재매수는 S0와 동일
- D10C50: D10GK + C50 현금 비중 규칙
- **모든 매도 과세**(하락 신호 매도 포함, 다음 해 1월 납부). `summary.no_signal_tax`는 기존 가정 비교용
- VOO 편입 규칙 없음 (현금 비중 자체가 실험 대상)

**결과 (모든 매도 과세, 20년 완료 428개 — 중앙값 / 하위10% / 10억 미만 / S0 대비 승률):**
- **D10GK 393억 / 23.5 / 14 / 88%** · D10C50 309억 / **34.7** / 13 / 73%
- C100 198억 / 8.8 / 50 / 43% · Q50 197억 / 9.4 / 47 / 48% · C50 189억 / 9.4 / 46 / 44%
- **S0 150억 / 8.8 / 50** · RULE25 146억 / 14.7 / 23 / 55% · C50S 143억 · C30 125억 / 14.2 / **3** / 35%
- 매도세를 넣어도 D10GK > S0 순위 유지, 격차는 3.2배 → 2.6배
- 현금(C50)과 나스닥100(Q50)은 거의 같은 결과 → 남는 돈을 현금으로 들고 가도 손해 없음
- 자산 기준 현금화는 중앙값을 +26~32% 올리지만 원금 미만 경우(1970년대 고금리기 시작)는 못 막음 —
  그 경우들은 애초에 50억에 도달하지 못하기 때문. 기준을 30억으로 낮추면 3개로 줄지만 중앙값 125억
- 기준값을 낮출수록 안전↑·수익↓로 한 방향으로 움직임 (금리 연동 규칙처럼 들쭉날쭉하지 않음)

**사용처:** `/posts/withdrawal-guide` 대표 수치 · 전체 비교표 · 연구 흐름 '현재' 단계

---

## 검증 (Validation)

### 실제 ETF 가격 vs 합성 가격 (2026-10-07)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `real_vs_synthetic.json` | 49 KB | `real_vs_synthetic.py` | TQQQ·QLD·QQQ 실제(배당 재투자) vs 합성(운용보수+스왑 / 운용보수만): 연평균 수익률·최대 낙폭·연도별·월말 값·5년 구간 차이 |

- 원천: `data/extra/{tqqq,qld,qqq}.csv` (Yahoo 수정종가 AdjClose + 종가 Close). `fetch_market_extra.py`로 받음 — 작업 환경에서 금융 사이트 접속이 막혀 GitHub Actions `fetch-market-extra.yml`에서 실행 (스크립트·워크플로 변경 push 시 자동, 또는 수동 실행)
- 기간: 각 ETF 상장일 ~ `ndx_1971_now.csv` 마지막 날(2026-09-25)
- 결과 (실제 / 합성 기본 / 합성 운용보수만, 연평균): TQQQ 43.1 / 40.9 / 45.3 · QLD 25.4 / 24.0 / 26.2 · QQQ 10.9 / 10.1 / 10.1
- 최대 낙폭 동일 (TQQQ −81.7 / −81.7, QLD −83.1 / −83.2, QQQ −83.0 / −83.0)
- 차이 원인 = 배당: QQQ 배당 제외 실제 10.2% ≈ 합성 10.1%. 레버리지 상품은 스왑이 배당 포함 수익을 주는 것으로 보여 차이가 약 레버리지배
- TQQQ 연도별 차이: 2010~2021 +1~7%p, 2022~2026 −0.8~+2.0%p (고금리기에 거의 사라짐)
- 결론: 사이트 합성 가격(운용보수+스왑, 배당 없음)은 실제보다 보수적 → 계산 방식 유지

**사용처:** `/posts/real-vs-synthetic` (`RealVsSynthetic` 컴포넌트), 적립식 방법론 2장 링크, 각 페이지 비용 안내 문구

---

## 미사용 / 탐색용 스크립트

| 스크립트 | 출력 | 상태 |
|----------|------|------|
| `withdrawal_adaptive_test.py` | 없음 (터미널 출력) | 적응형 생활비 vs 고정 생활비 비교 (S0/RULE25/D10GK × 668 시작점) — 결론: 세 전략 모두 완전 동일, 적응형 규칙 미발동 확인 |
| `vr_withdrawal_backtest.py` | 없음 (터미널 출력) | 라오어 VR 인출식 탐색용 (G값 스윕)
| `backtest.py` | 없음 (터미널 출력) | 초기 탐색용 |
| `split_entry_backtest.py` | 없음 | 초기 탐색용 |
| `synthetic_ndx_beta_sweep.py` | 없음 | 초기 탐색용 |
| `withdrawal_backtest.py` | 없음 | 초기 탐색용 |
| `withdrawal_buffer_sweep.py` | 없음 | 초기 탐색용 |
| `withdrawal_overfit_check.py` | `withdrawal_overfit_check.json` (미생성) | 과적합 검증용 |
| `check_withdrawal_engine.mjs` | 없음 (터미널 출력) | 웹 인출 시뮬레이터 엔진(`web/lib/withdrawalEngine.ts`) 검증: 10억 × 668 시작 시점 × RULE25·S0·HOLD3 × 비용 2종이 `withdrawal_full_period(_fee).json`과 반올림 단위 안에서 일치, 거래 날짜도 거래 로그와 일치. 실행 `node --experimental-strip-types scripts/check_withdrawal_engine.mjs` |
| `withdrawal_div_sweep_check.py` | 없음 (터미널 출력) | 200일선 대비 하락폭 −5~−15% 중간값 (2026-10-06): D05 3,312 · D06 3,630 · D07 3,546 · D08 3,094 · D10 3,689 · D12 3,028 · D15 3,102억 (GK 포함: 3,462/3,784/3,615/3,228/3,918/3,044/3,167). new-ideas 포스트 수치 근거 |
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
    ↓
withdrawal_rate_lev.py          → withdrawal_rate_lev_v2.json
    (스왑금리 반영 상태에서 기준금리 연동 TQQQ↔QLD 전환 → 결과 불안정, 채택 안 함)
    ↓
withdrawal_cash_tier.py         → withdrawal_cash_tier_v2.json
    (자산 규모별 TQQQ+현금 비중, 모든 매도 과세 → 현금 = 나스닥100 대체 가능, 중앙값 +26~32%)
```

### ⚠️ 알려진 한계: 신호 매도 양도세 미반영 (주요 전략은 `withdrawal_cash_tier.py`로 재계산 완료)

`withdrawal_new_ideas.py`, `withdrawal_new_ideas2.py`, `withdrawal_param_sweep.py`, `withdrawal_signal_test.py`,
`withdrawal_rsi_sweep.py` 등 인출식 연구 스크립트는 **EMA200 신호로 전량 현금 전환할 때 양도세를 매기지 않는다**
(생활비 인출분만 과세). 실제 한국 세법상 해외 ETF 매도는 목적과 무관하게 과세 대상.
- `withdrawal_rate_lev.py --tax-sells`로 S0만 확인: 중앙값 266억 → 152억 (스왑금리 반영 기준)
- S0·D10GK·RULE25·DLEV는 `withdrawal_cash_tier.py`(모든 매도 과세)로 재계산 → 순위 유지, D10GK/S0 격차 3.2배 → 2.6배
- RSI 스윕·설정값 스윕·GRAD 등 나머지 실험은 미재계산 (순위 비교용으로만 사용)
- `export_s0_tradelog.py`(2026-10-06 삭제)는 신호 매도에 과세했지만 현금 RP 이자 미반영 → `export_withdrawal_tradelog.py`로 대체

**대표 수치 기준 (2026-10-03~):** 인출 상한 없음 · 인출 포함 연 수익률(IRR) · 실제로 가능한 실행(loc) · 오늘까지 보유
(`withdrawal_full_period.json`, 실행 방식 비교는 `withdrawal_exec_horizon_v2.json`)
· 스왑금리 + 모든 매도 양도세. 그 이전 수치(신호 당일 매매 가정, 20년 중간값)는 초기 연구 기록으로만 병기한다.

**선택 안내 (사이트):** 주 1회 확인 → RULE25 22.4% · 현금일 때 매일 밤 LOC 주문 → D10GK 20.7% · 재매도 없는 단순함 → S0 17.5%

**권장 전략 (2026-10-03 확정): RULE25 + 상한 없는 동적 인출**
- 매도: 나스닥100 종가 < 최근 252거래일 최고 종가 × 0.75 → 다음 거래일 전량 매도 (현금은 외화RP)
- 매수: 200일 지수이동평균 위 15거래일 연속 → 다음 거래일 전액 매수
- 생활비: 매달 총자산의 0.3/0.5/0.7% (10억/20억 기준), 상한 없음
- 인출 포함 연 22.4% (하위 10% 17.1%), 남은 자산 10억 미만 0개, 20년간 꺼내 쓴 돈 74억 (`withdrawal_full_period.json`, `withdrawal_rule25_periods.json`)
- 감수: 자산 최대 낙폭 중간 −96%(닷컴버블+금융위기 연속), 매도 4번 중 1번 매수 직후 재매도, 1970~80년대엔 S0와 비슷

**(이전) S0 — EMA200-15일 연속 + 동적인출률 0.3/0.5/0.7%**
- 인출 상한 없음 기준 인출 포함 연 17.5% — 비교용으로 유지

**수익 극대화 옵션:** D10GK — EMA200-15일 + RSI<30 & 이격도<-10% + GK인출
- 668 시작 시점 생존율 100%, 중앙값 **393억** (스왑금리·양도세 반영) · 매도세 미반영 841억 · 운용보수만 3,741억
- S0 대비 승률 88%, 10억 미만 14개 (S0 50개)
- 닷컴버블(2000-2002) 등 장기 하락에서 매수 다음날 재매도 사이클 반복 위험
- 브레인스토밍 6가지 추가 아이디어 모두 검증 완료 → 추가 개선 여지 없음

**라오어 VR 인출식 탐색 결과 (2026-10):**
- `vr_withdrawal_backtest.py`: G값 20~100 스윕, 생존율 최고 23.6% (G=100, P=80%, 0.5%)
- `export_vr_sweep_json.py`: 216가지 조합 스윕, 생존율 100% 조합 없음
- 결론: VR 인출식은 TQQQ 고변동성 환경에서 구조적 한계 → 채택 불가
