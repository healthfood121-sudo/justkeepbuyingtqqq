# 백테스트 데이터 목록

`web/public/data/` 에 저장된 JSON 파일 목록.
재실행 시 해당 스크립트를 `python scripts/<script>.py` 로 실행.

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
| `withdrawal_cohorts.json` | 91 KB | `export_withdrawal_json.py` | 기본 인출 시뮬레이션 418코호트 (운용보수 포함) |
| `withdrawal_cohorts_v2.json` | 90 KB | `export_withdrawal_json.py --v2` | 동일 + 스왑금리 2× 반영 |

**파라미터:** 버퍼 13개월 · 일 20만 · 거치 2.5억 · 목표 10억

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

**사용처:** `/posts/withdrawal-new-ideas` 11번 섹션

---

### S0 날짜별 전체 데이터 (코호트별 일별 분리 파일)

| 파일/폴더 | 크기 | 스크립트 | 내용 |
|-----------|------|----------|------|
| `s0_daily_meta.json` | 69 KB | `export_s0_tradelog.py` | standard 인덱스 (코호트 목록 + 요약) |
| `s0_daily_meta_v2.json` | 69 KB | `export_s0_tradelog.py --mode v2` | with_costs 인덱스 |
| `s0_daily_meta_v3.json` | 69 KB | `export_s0_tradelog.py --mode v3` | with_costs + RP이자 인덱스 |
| `s0_daily/<start>.json` | ~217 KB each | `export_s0_tradelog.py` | standard 코호트별 일별 전체 데이터 |
| `s0_daily_v2/<start>.json` | ~217 KB each | `export_s0_tradelog.py --mode v2` | with_costs 코호트별 일별 데이터 |
| `s0_daily_v3/<start>.json` | ~217 KB each | `export_s0_tradelog.py --mode v3` | with_costs + RP이자 코호트별 일별 데이터 |

**일별 데이터 형식 (daily 배열 각 행):** `[date, ndx, ema200, div_pct, port, pos, act]`
- date: "YYYY-MM-DD", ndx/ema200: float 소수점 1자리, div_pct: float 소수점 1자리
- port: 억 원 (소수점 2자리), pos: 0=현금/1=투자, act: null/"B"/"S"
- 코호트 파일 추가 필드: `end`(종료월), `actual_years`(실제 시뮬 기간)

**20년 모드 결과:**
- standard 중앙값 928.5억, with_costs 중앙값 229.2억, with_rp 중앙값 269.4억
- 668코호트 중 428개 완료 (20년), 각 코호트 5,040 거래일

**전체 기간 모드 결과 (데이터 끝까지, 최대 ~55년):**
- standard 중앙값 6,044억, with_costs 중앙값 1,781억, with_rp 중앙값 2,125억
- 668코호트 전체 (데이터 끝인 2026-09까지), 최장 코호트 13,798 거래일 (54.8년)
- 재실행: `python scripts/export_s0_tradelog.py --mode open_all`

**사용처:** `/posts/withdrawal-guide/tradelog` (구버전, 현재는 RULE25 데이터로 교체됨)

---

### RULE25 날짜별 전체 데이터 (코호트별 일별 분리 파일) ← 현재 사용 중

| 파일/폴더 | 크기 | 스크립트 | 내용 |
|-----------|------|----------|------|
| `withdrawal_tradelog_rule25.json` | 567 KB | `export_withdrawal_tradelog.py` | RULE25 코호트 요약 (IRR·최종자산·인출액) |
| `withdrawal_tradelog_s0.json` | 920 KB | `export_withdrawal_tradelog.py` | S0 코호트 요약 (IRR·최종자산·인출액) |
| `withdrawal_daily_rule25_meta.json` | 71 KB | `export_withdrawal_tradelog.py` | RULE25 코호트 인덱스 (시작일·종료일·요약 통계) |
| `withdrawal_daily_rule25/<start>.json` | 0.9~668 KB each | `export_withdrawal_tradelog.py` | RULE25 코호트별 일별 전체 데이터 (668개, 총 226MB) |

**일별 데이터 형식 (배열 각 행):** `[date, ndx, ema200, peak52w, port, pos, act]`
- date: "YYYY-MM-DD", ndx/ema200/peak52w: float 소수점 1자리
- port: 억 원 (소수점 2자리), pos: 0=현금/1=투자, act: null/"B"/"S"

**메타 코호트 필드:** `{s, end, inv, final, wd, yrs, dd, n_trades}`

**결과:**
- 668코호트 전체 (데이터 끝인 2026-09까지), 최장 코호트 14,027 거래일 (55.66년)
- RULE25: 평균 거래 15.5회 · 10년 이상 보유 최종자산 중간값 1,358.66억 (스왑 스프레드 50bps 반영)
- S0: 평균 거래 26.8회 · 10년 이상 보유 최종자산 중간값 309.32억
- 재실행: `python scripts/export_withdrawal_tradelog.py`

**사용처:** `/posts/withdrawal-guide/tradelog` (25% 룰 날짜별 전체 데이터 공개 페이지)

---

### 새 아이디어 2차 실험 (트레일링스탑 / 단계적현금화 / 자산레버리지하향)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_new_ideas2.json` | 234 KB | `withdrawal_new_ideas2.py` | 7가지 전략 418코호트 비교 (운용보수 포함) |
| `withdrawal_new_ideas2_v2.json` | 517 KB | `withdrawal_new_ideas2.py --v2` | 동일 + 스왑금리 2× 반영 |

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

### 초기 현금 버퍼 실험 (RULE25 기반)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cashbuffer.json` | ~300 KB | `withdrawal_cashbuffer.py` | 버퍼 비율 변형 5가지 418코호트 비교 (스왑금리 포함) |
| `withdrawal_cashbuffer2.json` | ~500 KB | `withdrawal_cashbuffer2.py` | 버킷 전략 13가지 418코호트 비교 (스왑금리 포함) |

**cashbuffer.py 비교 전략:**
- B0: 기준선 (RULE25, 매달 TQQQ 소량 매도)
- B20: 20% 초기 현금 버퍼 (재시드 없음) — 인출액 크게 감소 (생활비 가뭄)
- R20/R25/R30: 재진입 시 20%/25%/30% 현금 유지 (버퍼 재시드)

**cashbuffer.py 결과 (스왑 포함, 418코호트):**
- R20: 중앙값 **184억** (B0 68억 대비 2.7배) — 버퍼 재시드 효과 검증
- R25: 180억, R30: 178억 (버퍼 클수록 약간 감소)

**cashbuffer2.py 비교 전략 (버킷 전략):**
- B0: 기준선 (RULE25, 매달 TQQQ 소량 매도)
- T12/T24/T36 × free/ema/cost/floor: 버퍼 개월수 × 보충 조건 12가지 조합

**cashbuffer2.py 결과 (스왑 포함, 418코호트):**
- **T12_floor**: 중앙값 72억, 평균 84억, 최악 6.2억 ← B0(68억/81억/4.0억) 대비 전 지표 개선
- T12_free/ema/cost: 중앙값 71억, 최악 5.5억 (floor보다 소폭 열등)
- T24_floor: 중앙값 67억, 최악 7.9억 (최악 개선되나 중앙값 B0보다 낮음)
- T36 계열: 중앙값 60억 (현금 과다 보유로 복리 감소)
- 핵심: 12개월 + 총자산 10억 이상일 때만 보충 → 중앙값·최악 케이스 모두 B0 초과

**사용처:** 없음 (연구용 — UI 미구현)

---

### 초기 집중형 버퍼 phase-out 실험

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cashbuffer3.json` | ~400 KB | `withdrawal_cashbuffer3.py` | phase-out 버퍼 6가지 전략 418코호트 (스왑금리 포함) |

**비교 전략:**
- B0: 기준선 (RULE25)
- T12_floor: 12개월 고정 + floor (cashbuffer2 최선, 비교용)
- EARLY12: 처음 5년 12개월 버퍼 → 이후 B0
- EARLY24: 처음 5년 24개월 버퍼 → 이후 B0
- TAPER_free: 포트 <10억:24개월 / 10~20억:12개월 / ≥20억:0 (조건없이)
- TAPER_floor: 동일 + floor 조건

**추가 출력:**
- `drought_y1_5`: 초기 5년 생활비 공백 달수 (목표의 90% 미달)
- `drought_y6_20`: 후기(6~20년) 공백 달수

**결과 (418코호트, 중앙값 기준):**
- **EARLY24**: 총재산 134.7억 ← 전 전략 최선 (B0 126억 대비 +8.7억, +7%)
  - 인출합계 63.6억 (B0 58.3억보다 +5.3억)
  - 공백 초기/후기 모두 0 (5년 후 B0 전환으로 자연 해소)
- T12_floor: 총재산 128.7억, 단 후기 공백 **1개월** 발생 (과도한 버퍼 유지 부작용)
- TAPER 실패: 포트 10억 경계 진동 시 과도한 TQQQ 매도로 복리 손해

**핵심 발견:**
- 버퍼의 효과는 "생활비 공백 방지"(drought)가 아닌 **"TQQQ 나쁜 타이밍 매도 방지"**
- B0도 drought=0 (항상 TQQQ 소량 매도로 충당) — 하지만 그 매도가 복리를 갉아먹음
- **초기 5년만 버퍼(EARLY24)** = 핵심 구간 TQQQ 보호 + 후기 B0 복리 극대화

**사용처:** 없음 (연구용 — UI 미구현)

---

### 초기 집중형 버퍼 — 전체기간 + IRR (cashbuffer4)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cashbuffer4.json` | ~800 KB | `withdrawal_cashbuffer4.py` | phase-out 버퍼 6가지 전략 658코호트 전체기간 (스왑금리 포함) |

**cashbuffer3.py와 차이:**
- 20년 제한 제거 → 데이터 끝(2026-09)까지 전체 기간
- IRR(내부수익률)을 주 비교지표로 추가 (기간 다른 코호트 공정 비교)
- 시점별 스냅샷: 10·20·30·40·50년 총자산 중앙값

**IRR 비교 결과 (538개 코호트, 10년 이상, 중앙값):**
- **EARLY24: IRR 21.9%** ← 최선 (B0 21.1% 대비 +0.8%p)
  - 최종자산 778억, 인출합계 368억
- EARLY12: 21.5%
- B0: 21.1% (기준)
- TAPER_floor: 21.1%
- TAPER_free: 20.7%
- **T12_floor: 20.4%** ← IRR 기준 최하위 (후기에도 버퍼 유지 비용 누적)
  - 단 IRR 하위10%는 15.7%로 최선 → 하방 보호는 T12_floor가 가장 강함

**역설:**
- 30/40년 스냅샷 자산은 T12_floor가 최고 (123/282억) → 인출을 아끼고 자산 쌓음
- IRR은 EARLY24가 최고 → 초기 복리 보호 + 인출도 많이 함 → 현금흐름 효율 최선
- 20년 제한 실험에서 최선이었던 T12_floor가 전체기간에서는 B0보다 열등

**사용처:** 없음 (연구용 — UI 미구현)

---

### 버퍼1 + 버퍼2 (생활비 상한 1,500만원) 실험

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cashbuffer5.json` | ~900 KB | `withdrawal_cashbuffer5.py` | 버퍼2(생활비 상한) 6가지 전략 658코호트 전체기간 (스왑금리 포함) |

**버퍼2 개념:**
- 동적 인출률 상한을 월 1,500만원으로 제한
- 초과분은 포트폴리오 내 현금으로 자연 잔류 → RP이자 + TQQQ 재투자 복리
- 포트 > 약 21.4억 (0.7% × 21.4억 = 1,500만원)부터 버퍼2 축적 시작

**비교 전략:**
- B0: 기준선 (상한 없음)
- EARLY24: 버퍼1만 (상한 없음)
- CAP_ONLY / B0_CAP: 상한만 (버퍼1 없음) ← 결과 동일
- EARLY24_CAP: 버퍼1(초기5년 24개월) + 버퍼2(1,500만원 상한)
- EARLY12_CAP: 버퍼1(초기5년 12개월) + 버퍼2(1,500만원 상한)

**결과 (538코호트, IRR 중앙값):**
- **EARLY24_CAP: IRR 22.9%**, 하위10% 17.5%, 최종자산 **8,103억**, 인출합계 56억
- EARLY12_CAP: 22.7%, 하위10% 17.5%, 최종자산 7,377억
- CAP_ONLY = B0_CAP: 22.3%, 최종자산 7,083억 (버퍼1 유무가 동일 결과 → 상한이 지배적)
- EARLY24 (상한 없음): 21.9%, 최종자산 778억, 인출합계 368억
- B0: 21.1%, 최종자산 693억, 인출합계 335억

**주의: 해석 필요**
- 상한 있으면 인출합계 335억 → 56억으로 급감 (실제 생활비로 쓴 돈이 적음)
- 최종자산이 큰 이유: 쓰지 않은 돈이 포트폴리오 안에 복리로 잔류
- 생전 지출이 목적이면 EARLY24 (상한 없음), 상속/장기 자산 목적이면 EARLY24_CAP
- 버퍼2 누적 (포트에 남은 잉여): EARLY24_CAP 기준 중앙값 2,115억

**사용처:** 없음 (연구용 — UI 미구현)

---

### 이중 버퍼 — 버퍼2 별도 RP 계좌 (cashbuffer_dual)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cashbuffer_dual.json` | ~900 KB | `withdrawal_cashbuffer_dual.py` | 버퍼2(별도 RP 계좌) 5가지 전략 658코호트 전체기간 (스왑금리 포함) |

**버퍼2 개념 (cashbuffer5와 차이):**
- 동적 인출률 상한을 월 1,500만원으로 제한
- 초과분은 **포트폴리오 외부 별도 RP 계좌**로 이전 (cashbuffer5는 포트폴리오 내 현금)
- 하락장에서 rp_buf에서 먼저 생활비 지출, 신호 매도 현금은 재진입용 보존
- 매수 신호 시 rp_buf는 재투자하지 않고 그대로 유지

**비교 전략:**
- B0: 기준선 (상한 없음, 버퍼 없음)
- EARLY24: 버퍼1만 (상한 없음)
- RPBUF: 별도 RP 버퍼2만 (버퍼1 없음)
- EARLY24_RPBUF: 버퍼1(초기5년 24개월) + 버퍼2
- EARLY12_RPBUF: 버퍼1(초기5년 12개월) + 버퍼2

**결과 (538코호트, IRR 중앙값):**
- B0: 21.1%, 최종 692억, 인출 335억
- EARLY24: 21.6%, 최종 756억, 인출 364억
- **RPBUF: 16.6%**, 최종 220억 (TQQQ 0억, RP 139억), 인출 36억 ← 가장 나쁨
- EARLY24_RPBUF: 16.5%, 최종 216억, 인출 36억
- EARLY12_RPBUF: 16.6%, 최종 214억, 인출 36억

**핵심 발견: 별도 RP 버퍼는 B0보다 훨씬 나쁨**
- TQQQ 40년 스냅샷에서 TQQQ 부분이 0억 → 초과분이 지속 이전되면서 TQQQ 포트가 고갈
- RP 금리(연 2~3%)가 TQQQ 복리(연 25%+)에 비교 불가 → 전체 성장 급감
- 인출합계 36억 vs B0 335억 → 정작 쓰는 돈도 적어짐
- **결론:** 초과분은 포트폴리오 밖으로 이전하면 안 됨. cashbuffer5(포트 내 현금, 매수신호 재투자)가 압도적 우세

**cashbuffer5 EARLY24_CAP (최선) vs cashbuffer_dual RPBUF 비교:**
- cashbuffer5: IRR 22.9%, 최종 8,103억, 인출 56억 (단 상속/장기 목적)
- cashbuffer_dual: IRR 16.6%, 최종 220억, 인출 36억

**사용처:** 없음 (연구용 — 별도 RP 버퍼 전략이 열등함을 확인하는 실험)

---

### 생활비 상한 스윕 (withdrawal_cap_sweep)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_cap_sweep.json` | ~1 MB | `withdrawal_cap_sweep.py` | 상한 300만~5000만원 10가지 스윕 658코호트 전체기간 (EARLY24 버퍼 고정) |

**결과 (538코호트, IRR 중앙값):**
| 상한 | IRR | 최종자산 | 실제소비 |
|------|-----|---------|---------|
| 없음 | 21.9% | 778억 | 368억 |
| 300만원 | **23.6%** | 12,736억 | 12억 |
| 750만원 | 23.1% | 11,251억 | 29억 |
| 1,500만원 | 22.9% | 8,103억 | 56억 |
| 3,000만원 | 22.4% | 3,709억 | 106억 |
| 5,000만원 | 21.9% | 2,114억 | 148억 |

**핵심 발견:**
- 상한이 낮을수록 IRR 높아짐 (돈이 포트폴리오 안에 쌓여 TQQQ 복리)
- IRR 최대화 순수 목적: CAP_300만원 (23.6%) — 단 실제 소비 12억으로 매우 적음
- 실생활 합리적 지점: CAP_1500만원 (22.9%, 56억 소비) ~ CAP_3000만원 (22.4%, 106억 소비)
- 5000만원 상한도 무제한(21.9%)과 IRR 같음 — 큰 포트에서 5000만원도 충분히 제약됨

---

### 인출 지연 전략 (withdrawal_delay)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_delay.json` | ~700 KB | `withdrawal_delay.py` | 인출 지연 0/6/12/24/36개월 5가지 전략 658코호트 전체기간 |

**결과 (538코호트, IRR 중앙값):**
| 지연 | IRR | 최종자산 | 인출합계 |
|------|-----|---------|---------|
| 없음(D0) | 21.9% | 778억 | 368억 |
| **6개월(D6)** | **22.1%** | 815억 | 382억 |
| 12개월(D12) | 21.9% | 839억 | 398억 |
| 24개월(D24) | 21.5% | 899억 | 435억 |
| 36개월(D36) | 20.8% | 913억 | 436억 |

**핵심 발견:**
- 6개월 지연이 미미하게 유리 (22.1% vs 21.9%)
- 지연이 길수록 최종자산은 커지지만 IRR은 떨어짐 (초반 소득 포기 = IRR 패널티)
- 다른 소득이 있어서 6개월 버틸 수 있으면 약간 유리
- 24개월 이상은 IRR 손실이 최종자산 이득보다 큼

---

### TQQQ + VOO 분산 전략 (withdrawal_voo)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_voo.json` | ~700 KB | `withdrawal_voo.py` | 4가지 전략 658코호트 전체기간 (스왑금리+세금 포함, VOO=SPX 1x) |

**결과 (538코호트, IRR 중앙값):**
| 전략 | IRR | 최종(TQQQ/VOO) | 인출합계 |
|------|-----|--------------|---------|
| B0 | 21.9% | 778억/0억 | 368억 |
| VOO_20 | 15.6% | 0억/242억 | 39억 |
| VOO_30 | 17.1% | 0억/317억 | 51억 |
| VOO_50 | 18.5% | 0억/507억 | 74억 |

**핵심 발견: VOO 분산도 B0보다 훨씬 나쁨**
- 40년 후 TQQQ 0억 → RP 버퍼(cashbuffer_dual)와 동일한 구조적 문제
- VOO 연 ~10%도 TQQQ 연 25%+에 비할 수 없음 → 초과분이 계속 이전되며 TQQQ 고갈
- **결론:** 초과분을 포트 밖으로 보내면(VOO, RP, 어떤 자산이든) 항상 B0보다 나쁨
- **공통 원리:** 좋은 전략은 초과분을 포트폴리오 안에 유지(CAP 전략)하는 것

---

### 동적 생활비 상한 스윕 (1억당 N만원)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_dynamic_cap.json` | ~700 KB | `withdrawal_dynamic_cap.py` | 동적 상한(1억당 N만원) + 고정 상한 5가지 전략 658코호트 전체기간 |

**상한 계산식:** `cap = (총자산 / 1억) × per_eok만원`

**결과 (538코호트, IRR 중앙값):**
| 전략 | IRR | 최종자산 | 실제소비 |
|------|-----|---------|---------|
| NO_CAP | 21.9% | 778억 | 368억 |
| PER_10 (1억당 10만원) | **23.8%** | 7,621억 | 13억 |
| PER_30 (1억당 30만원) | 23.0% | 5,226억 | 574억 |
| PER_50 (1억당 50만원) | 22.4% | 3,393억 | 339억 |
| FIXED_1500 | 22.9% | 8,103억 | 56억 |

**역설 발견:**
- PER_30은 실제 소비가 574억으로 NO_CAP(368억)보다 많음 — 초반 절약이 복리 → 후반 폭발
- PER_10은 IRR 최고(23.8%)이나 실제 소비 13억으로 극단적으로 적음
- 동적 상한(1억당 N만원)은 자산 커지면 상한도 커지지만 동적인출률이 더 빠르게 증가 → 초반 절약이 관건

**사용처:** 없음 (연구용)

---

### 기존 동적인출률 + 추가 인출 (withdrawal_bonus)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `withdrawal_bonus.json` | ~700 KB | `withdrawal_bonus.py` | 추가 인출(1억당 N만원) 5가지 전략 658코호트 전체기간 |

**개념:** 기존 동적인출률 + 특정 자산 초과 시 "1억당 N만원" 추가 인출

**결과 (538코호트, IRR 중앙값):**
| 전략 | IRR | 최종자산 | 인출합계 |
|------|-----|---------|---------|
| NO_CAP | 21.9% | 778억 | 368억 |
| ADD_10_10억 | 21.7% | 697억 | 336억 |
| ADD_10_20억 | 21.8% | 718억 | 346억 |
| ADD_30_10억 | 21.8% | 641억 | 231억 |
| ADD_30_20억 | 21.9% | 708억 | 301억 |

**핵심 발견: 추가 인출은 모두 NO_CAP보다 나쁘거나 동일**
- 추가 인출로 TQQQ를 더 팔면 복리 손실 → IRR 및 인출합계 모두 감소
- CAP 전략(상한으로 포트 내 현금 유지)과 반대 효과 — 추가 인출은 포트 밖으로 이전
- **결론:** FIRE 목적(최대 소비)은 NO_CAP(EARLY24) 유지가 최선

**사용처:** 없음 (연구용)

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

## 원화 기준 환율 반영 비교

### 적립식: 달러 기준 vs 원화 기준

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `krw_accumulation.json` | ~430 KB | `krw_accumulation.py` | 달러·원화 기준 441개 진입 시점 10억 달성 기간 비교 |

**파라미터:** 일 20만원 · 목표 원화 10억 · 시작 1990-01 · with_costs (스왑금리 + 운용보수)

**달러 기준:** 환율 무시, 원화 20만원 / 달러 가격으로 매수, 포트 = 주수 × 달러가격 vs 10억  
**원화 기준:** 원화 20만원 / (달러가격 × 환율)로 매수, 포트 = 주수 × 달러가격 × 환율 vs 10억  

**결과:** 달러 중간 5.62년 / 원화 중간 5.56년 / 98.7%에서 1년 이내 차이  
**예외:** 1998-03 시작(환율 1,553원) — 달러 2.02년 vs 원화 15.17년 (+13.15년)  

**구조:** `{ meta, stats: { usd, krw }, rows: [{ s, usd: { completed, y, e, i }, krw: { ... }, fx_start }] }`

**사용처:** `/posts/krw-exchange-rate`

---

### 인출식: 달러 기준 vs 원화 기준 (RULE25)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `krw_withdrawal.json` | ~200 KB | `krw_withdrawal.py` | 달러·원화 기준 441개 진입 시점 인출식 IRR/낙폭 비교 |

**파라미터:** 초기 원화 10억 → 시작 환율로 달러 환산 · 시작 1990-01 · RULE25 전략 · with_costs  
**두 버전 모두 동일 달러 투자금으로 시작, 인출률 = 포트 비율이라 수학적으로 완전 동일**  

**결과:** IRR·최종자산 두 버전 동일 (수학적 증명). 낙폭만 차이 (금융위기 달러 -95.2% vs 원화 -91.8%).

**구조:** `{ meta, stats: { usd, krw }, rows: [{ s, usd: { final_eok, wd_eok, dd, yrs, irr }, krw: {...}, fx_start }] }`

**사용처:** `/posts/krw-exchange-rate` (낙폭 완충 근거)

---

## 합성 가격 원본 데이터

### 일별 합성 가격 (전체 기간)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `synthetic_daily.json` | 731 KB | `export_synthetic_daily.py` | NDX 보정 지수 + TQQQ/QLD/나스닥100 합성가격(with_costs) + 기준금리 · 14,027행 |

**파라미터:** with_costs 모드 (운용보수 + 스왑 차입 이자 전부 반영)
- TQQQ: 운용보수 0.88% + 스왑 (기준금리+0.50%) × 2
- QLD: 운용보수 0.95% + 스왑 (기준금리+0.50%) × 1
- 나스닥100: 운용보수 0.20% (차입 이자 없음)

**구조:** `{ note, meta, d[], ndx[], tqqq[], qld[], qqq[], fed[] }` (컬럼 배열 형식, 합성가격 초기=100)

**사용처:** `/posts/synthetic-methodology/data` (일별 원본 데이터 뷰어 + CSV 다운로드)

---

## S&P500 가격 데이터

### 월별 S&P500 종가 (차트용)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `sp500_monthly.json` | ~20 KB | `export_sp500_monthly.py` | S&P500 월별 종가 1,187개월 (1927-12~2026-10) |

**소스:** `web/public/sp500.csv` (일별 종가) → 각 월의 마지막 거래일 종가만 추출

**구조:** `[{ d: "YYYY-MM", p: 1234.56 }, ...]`

**사용처:** `/posts/market-history` (S&P500 장기 차트 + 조정장 오버레이)

---

### 패닉매도 시나리오 백테스트 (panic_sell_backtest)

| 파일 | 크기 | 스크립트 | 내용 |
|------|------|----------|------|
| `panic_sell_backtest.json` | 749 KB | `panic_sell_backtest.py` | 7가지 전략 669코호트 전체 결과 + 5개 주요 코호트 월별 스냅샷 |
| `panic_sell_chart.json` | 113 KB | (위 스크립트에서 추출) | 2000-01·2007-10 코호트 월별 스냅샷만 (포스트 차트용) |

**전략 비교:**
- HOLD: 계속 DCA (기준선)
- QUIT30/50: NDX 진입 후 최고점 대비 −30%/−50% 하락 시 전량 매도 → 영구 이탈
- BACK30_12/24: −30% 매도 후 12/24개월 뒤 전액 재투자 + DCA 재개
- BACK50_12/24: −50% 매도 후 12/24개월 뒤 재개

**패닉 트리거 정의:** 진입 시점부터의 NDX 최고점 대비 하락률 (진입 후 rolling max)

**결과 요약 (669코호트, 중앙값 기준):**
| 전략 | 달성률 | 트리거 발생률 | 중앙 소요 | 중앙 최종 자산 |
|------|--------|------------|---------|--------------|
| HOLD | 89.5% | — | 6.45년 | 34억 |
| QUIT30 | 35.9% | 55.6% | — | 1.5억 |
| QUIT50 | 67.3% | 22.3% | — | 11.5억 |
| BACK30_12 | 85.1% | 55.6% | 9.03년 | 15.5억 |
| BACK30_24 | 83.6% | 55.6% | 8.70년 | 17.9억 |
| BACK50_12 | 89.5% | 22.3% | 6.52년 | 26.6억 |
| BACK50_24 | 89.5% | 22.3% | 6.52년 | 34억 |

**파라미터:** 일 20만원 DCA · 거치 없음 · 목표 10억 · TQQQ with_costs (스왑금리+운용보수) · 최대 35년

**사용처:** `/posts/panic-sell`

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

**권장 전략 (2026-10):** RULE25 — 52주 고점 -25% 매도 + EMA200-15일 연속 재매수 + 동적인출률 0.3/0.5/0.7%
- 668 시작 시점, 10년 이상 보유 최종자산 중간값 1,358.66억
- S0(EMA200-15일) 대비 매도 타이밍이 더 명확(가격 기준)하여 투자자 이해도 높음
- tradelog 페이지에서 날짜별 전체 데이터 공개

**수익 극대화 옵션:** D10GK — EMA200-15일 + RSI<30 & 이격도<-10% + GK인출
- 668 시작 시점 생존율 100%, 중앙값 3,741억
- 닷컴버블(2000-2002) 등 장기 하락에서 매수 다음날 재매도 사이클 반복 위험
- 브레인스토밍 6가지 추가 아이디어 모두 검증 완료 → 추가 개선 여지 없음

**라오어 VR 인출식 탐색 결과 (2026-10):**
- `vr_withdrawal_backtest.py`: G값 20~100 스윕, 생존율 최고 23.6% (G=100, P=80%, 0.5%)
- `export_vr_sweep_json.py`: 216가지 조합 스윕, 생존율 100% 조합 없음
- 결론: VR 인출식은 TQQQ 고변동성 환경에서 구조적 한계 → 채택 불가

---

## 개별 종목 롤링 분석 (/private 페이지)

### 롤링 CSV (분석 스크립트 출력)

| 파일 | 스크립트 | 종목 | 내용 |
|------|----------|------|------|
| `data/rolling/NKE_10y_annual.csv` | `analyze_nke.py` | NKE (나이키) | 10년 연말 매수 롤링 |
| `data/rolling/NKE_5y_annual.csv` | `analyze_nke.py` | NKE | 5년 연말 매수 롤링 |
| `data/rolling/NKE_10y_monthly.csv` | `analyze_nke.py` | NKE | 10년 월말 매수 롤링 |
| `data/rolling/RMS_10y_annual_full.csv` | (별도) | RMS.PA (에르메스) | 10년 연말 매수 롤링 (1993~포함) |
| `data/rolling/RMS_10y_monthly.csv` | (별도) | RMS.PA | 10년 월말 매수 롤링 |
| `data/rolling/KO_10y_annual.csv` | `analyze_ko.py` | KO (코카콜라) | 10년 연말 매수 롤링 (1972년부터) |
| `data/rolling/KO_5y_annual.csv` | `analyze_ko.py` | KO | 5년 연말 매수 롤링 |
| `data/rolling/KO_10y_monthly.csv` | `analyze_ko.py` | KO | 10년 월말 매수 롤링 |
| `data/rolling/AMZN_10y_annual.csv` | `analyze_amzn.py` | AMZN (아마존) | 10년 연말 매수 롤링 (1997년부터) |
| `data/rolling/AMZN_5y_annual.csv` | `analyze_amzn.py` | AMZN | 5년 연말 매수 롤링 |
| `data/rolling/AMZN_10y_monthly.csv` | `analyze_amzn.py` | AMZN | 10년 월말 매수 롤링 |
| `data/rolling/NVDA_10y_annual.csv` | `analyze_nvda.py` | NVDA (엔비디아) | 10년 연말 매수 롤링 (1999년부터) |
| `data/rolling/NVDA_5y_annual.csv` | `analyze_nvda.py` | NVDA | 5년 연말 매수 롤링 |
| `data/rolling/NVDA_10y_monthly.csv` | `analyze_nvda.py` | NVDA | 10년 월말 매수 롤링 |
| `data/rolling/MSFT_10y_annual.csv` | `analyze_msft.py` | MSFT (마이크로소프트) | 10년 연말 매수 롤링 (1986년부터) |
| `data/rolling/MSFT_5y_annual.csv` | `analyze_msft.py` | MSFT | 5년 연말 매수 롤링 |
| `data/rolling/MSFT_10y_monthly.csv` | `analyze_msft.py` | MSFT | 10년 월말 매수 롤링 |
| `data/rolling/JNJ_10y_annual.csv` | `analyze_jnj.py` | JNJ (존슨앤존슨) | 10년 연말 매수 롤링 (1970년부터) |
| `data/rolling/JNJ_5y_annual.csv` | `analyze_jnj.py` | JNJ | 5년 연말 매수 롤링 |
| `data/rolling/JNJ_10y_monthly.csv` | `analyze_jnj.py` | JNJ | 10년 월말 매수 롤링 |
| `data/rolling/JPM_10y_annual.csv` | `analyze_jpm.py` | JPM (JP모건 체이스) | 10년 연말 매수 롤링 (1980년부터) |
| `data/rolling/JPM_5y_annual.csv` | `analyze_jpm.py` | JPM | 5년 연말 매수 롤링 |
| `data/rolling/JPM_10y_monthly.csv` | `analyze_jpm.py` | JPM | 10년 월말 매수 롤링 |
| `data/rolling/V_10y_annual.csv` | `analyze_V.py` | V (비자) | 10년 연말 매수 롤링 (2008년부터) |
| `data/rolling/V_5y_annual.csv` | `analyze_V.py` | V | 5년 연말 매수 롤링 |
| `data/rolling/V_10y_monthly.csv` | `analyze_V.py` | V | 10년 월말 매수 롤링 |
| `data/rolling/ORCL_10y_annual.csv` | `analyze_orcl.py` | ORCL (오라클) | 10년 연말 매수 롤링 (1986년부터) |
| `data/rolling/ORCL_5y_annual.csv` | `analyze_orcl.py` | ORCL | 5년 연말 매수 롤링 |
| `data/rolling/ORCL_10y_monthly.csv` | `analyze_orcl.py` | ORCL | 10년 월말 매수 롤링 |

### 롤링 JSON (export 스크립트 출력)

재실행: `python scripts/export_rolling_json.py` (전 종목 재생성)

| 파일 | 크기 | 종목 | EPS 출처 |
|------|------|------|---------|
| `web/public/data/rolling/NKE_rolling.json` | ~60 KB | NKE (나이키) | EDGAR XBRL, 분할조정 적용 |
| `web/public/data/rolling/RMS_rolling.json` | ~50 KB | RMS.PA (에르메스) | AI 역산 추정치 (EUR) |
| `web/public/data/rolling/AAPL_rolling.json` | ~50 KB | AAPL (애플) | EDGAR XBRL |
| `web/public/data/rolling/COST_rolling.json` | ~50 KB | COST (코스트코) | EDGAR XBRL |
| `web/public/data/rolling/KO_rolling.json` | ~50 KB | KO (코카콜라) | EDGAR XBRL (2007~2025) + macrotrends 역산 (1988~2006) |
| `web/public/data/rolling/META_rolling.json` | ~20 KB | META (메타 플랫폼스) | EDGAR XBRL CIK 0001326801 (2012~2025, 분할 없음) |
| `web/public/data/rolling/AMZN_rolling.json` | ~30 KB | AMZN (아마존) | EDGAR XBRL CIK 0001018724, FY2007~2019÷20, FY2020~2025 소급 반영 |
| `web/public/data/rolling/NVDA_rolling.json` | ~50 KB | NVDA (엔비디아) | EDGAR XBRL CIK 0001045810, FY2008~2019÷40, FY2020~2022÷10, FY2023~조정없음 |
| `web/public/data/rolling/MSFT_rolling.json` | ~60 KB | MSFT (마이크로소프트) | EDGAR XBRL (FY2008~2026), FY1993~2007 AI 역산 추정 (384:1 분할 반영) |
| `web/public/data/rolling/JNJ_rolling.json` | ~60 KB | JNJ (존슨앤존슨) | EDGAR XBRL CIK 0000200406 (FY2007~2025), 2001년까지 128:1 분할 반영 완료 |
| `web/public/data/rolling/JPM_rolling.json` | ~60 KB | JPM (JP모건 체이스) | EDGAR XBRL CIK 0000019617 (2007~2025) + AI 역산 추정 (2001~2006), 분할 없음 |
| `web/public/data/rolling/V_rolling.json` | ~30 KB | V (비자) | EDGAR 10-K (FY2009~FY2014 분할 전 ÷4; FY2015~FY2025 분할 후), 2015-03-19 4:1 분할 |
| `web/public/data/rolling/ORCL_rolling.json` | ~60 KB | ORCL (오라클) | EDGAR XBRL CIK 0001341439 (FY2008~FY2026) + 10-K 직접 파싱 (FY1997~FY2007); 분할 누적 48:1 (2000-01 마지막) |

**JPM 파라미터:**
- 매수 시작: 1980년 말 (Yahoo Finance 시작 시점)
- 벤치마크: S&P 500 (^SP500TR)
- 통화: USD
- 완결 구간: 36개 (1980~2015 연말 매수), 중앙값 연평균 수익률 10.6%
- 손실 구간: 2개 (1980년 말 매수 -0.3%, 1998년 말 매수 -0.6%)
- S&P500 초과: 26/36개 (72%)
- EPS 일회성 왜곡: 2002(WorldCom 손실), 2008(금융위기), 2013(London Whale + DOJ), 2020(COVID-19)
- 현 법인(JPMorgan Chase) 완성: 2001년 Chemical Banking + J.P. Morgan 합병, 2004년 Bank One 합병. 주식 분할 없음.

**JNJ 파라미터:**
- 매수 시작: 1970년 말 (Yahoo Finance 시작 시점)
- 벤치마크: S&P 500 (^SP500TR)
- 통화: USD
- 완결 구간: 46개 (1970~2015 연말 매수), 중앙값 연평균 수익률 12.3%
- 손실 구간: 0개 (10년 기준)
- S&P500 초과: 30/46개 (65%)
- EPS 일회성 왜곡: 2011(리콜·법적 비용), 2017(TCJA), 2020(COVID-19), 2023(Kenvue 분사 이익)
- 분할 이력: 2:1×7회(1970·1981·1989·1992·1996·1999·2001) → 누적 128:1, 2001-06-04 이후 분할 없음

**KO 파라미터:**
- 매수 시작: 1972년 말 (Yahoo Finance KO 1970년부터 분할조정 완비, 10년 롤링 첫 완결 구간 1972→1982)
- 벤치마크: S&P 500 (^SP500TR)
- 통화: USD
- 완결 구간: 44개 (1972~2015 연말 매수), 중앙값 연평균 수익률 (전체 포함)
- EPS 데이터: 1988년부터만 존재 (1972~1987 구간은 peBuy/epsDecomp 없음)
- EPS 일회성 왜곡: 1999(구조조정), 2000(병입업체 구조조정), 2017(TCJA), 2020(COVID-19)

**AMZN 파라미터:**
- 매수 시작: 1997년 말 (상장 첫 해)
- 벤치마크: S&P 500 (^SP500TR)
- 통화: USD
- 완결 구간: 19개 (1997~2015 연말 매수), 중앙값 연평균 수익률 29.5%
- 손실 구간: 1개 (1998년 말 매수, -0.4%)
- S&P500 초과: 19/19개 (전 구간 시장 초과)
- EPS 일회성 왜곡: 2012(적극 투자로 소폭 음수), 2014(파이어폰 + 인프라 투자, EPS 음수), 2022(Rivian 평가손실 ~$12.7B)
- 분할 이력: 1998 2:1, 1999-01 3:1, 1999-09 2:1, 2022-06 20:1

**V 파라미터:**
- 매수 시작: 2008년 말 (IPO 2008-03-19)
- 벤치마크: S&P 500 (^SP500TR)
- 통화: USD
- 완결 구간: 8개 (2008~2015 연말 매수), 중앙값 연평균 수익률 22.1%
- 손실 구간: 0개
- S&P500 초과: 8/8개 (전 구간 시장 초과)
- EPS 일회성 왜곡: FY2012(소송 충당금 $4.1B), FY2018(TCJA 세금 혜택), FY2020(COVID-19)
- 분할 이력: 2015-03-19 4:1 (yfinance 자동 소급 조정)

**ORCL 파라미터:**
- 매수 시작: 1986년 말 (상장 첫 해)
- 벤치마크: S&P 500 (^SP500TR)
- 통화: USD
- 완결 구간: 30개 (1986~2015 연말 매수), 중앙값 연평균 수익률 13.6%
- 손실 구간: 1개 (1999년 말 매수, -1.2%)
- S&P500 초과: 23/30개 (77%)
- EPS 일회성 왜곡: FY2000(닷컴 버블 정점 EPS 급등), FY2001~2002(닷컴 붕괴), FY2018(TCJA), FY2022(Cerner 인수 PPA 상각)
- 분할 이력: 1987·1989(×2)·1993·1996·2000 → 누적 48:1 (2000-01-18 이후 분할 없음)
- 회계연도: 5월 31일 종료 (달력 연도 Y = FY(Y) EPS 기준)

**사용처:** `/app/private` (개별 종목 10년 롤링 분석 페이지)

### S&P500 전 종목 배치 롤링 JSON

재실행: `python scripts/generate_all_sp500.py`  
(이미 존재하는 파일은 건너뜀 — 강제 재생성 시 `ALREADY_DONE` 집합 비우거나 해당 JSON 삭제 후 실행)

| 파일 패턴 | 스크립트 | 종목 수 | 내용 |
|-----------|----------|---------|------|
| `web/public/data/rolling/{TICKER}_rolling.json` | `generate_all_sp500.py` | 448개 | S&P500 전 종목 10년 롤링 연평균 수익률 (연말 매수, ^SP500TR 벤치마크) |

**1차 배치 (2026-10):** 233개 신규 생성, 7개 건너뜀(기존), 3개 오류 (MMC·DVN·EBAY)  
**2차 배치 (2026-10):** 186개 신규 생성, 240개 건너뜀(기존), 7개 오류 (MMC·VST·HWM·BE·EXE·FTV·TWLO)  

**오류 원인:**
- `MMC`: yfinance 데이터 없음 (sp500-holdings data.ts에 잘못된 티커 `MRSH` 등록 — 실제 티커는 `MMC`인데 yfinance 조회 실패)
- `VST·HWM·BE·EXE·FTV·TWLO`: `'n_complete'` KeyError — 완결된 10년 롤링 구간이 0개 (상장·분사 시점이 너무 최근)

**제외 종목 (~55개):** ABNB, CARR, CEG, GEV, GEHC 등 2019년 이후 상장/분사된 종목은 10년 롤링 분석 불가로 처음부터 제외

**JSON 구조:** `{ ticker, name, rows10y, stats, fullPeriod, epsDecomp }` (epsDecomp는 배치 생성 시 빈 배열)

**사용처:** `/app/private` (드롭다운에서 448개 종목 선택 → 10년 롤링 차트 + 분포 바 표시)

### 배당 분해 JSON (데이터 생성)

| 파일 | 스크립트 | 종목 | 내용 | 사용처 |
|------|---------|------|------|--------|
| `web/public/data/rolling/RMS_dividend.json` | `export_dividend_decomp.py RMS:RMS.PA` | 에르메스 | 매수 연도별 10년 배당 미포함 상승률·배당 포함 수익률·배당 효과 (2000~2015년 매수) | `/private` 에르메스 인사이트 |
| `web/public/data/rolling/NKE_dividend.json` | `export_dividend_decomp.py NKE:NKE` | 나이키 | 동일 (1980~2015년 매수) | `/private` 나이키 인사이트 |

실행: GitHub Actions `배당 분해 데이터 생성` (workflow_dispatch, 입력 `tickers` 예: `RMS:RMS.PA NKE:NKE`). 이 세션 환경은 Yahoo 접속이 막혀 있어 Actions로 생성했다.

### 전 종목 펀더멘털 JSON (데이터 생성)

| 파일 | 크기 | 스크립트 | 내용 | 사용처 |
|------|------|---------|------|--------|
| `web/public/data/fundamentals/{KEY}.json` | 종목당 ~3 KB × 444개 | `export_fundamentals.py` | 연도별 EPS(SEC 10-K, 분할 보정)·연말 PER, 10년 수익률 분해(EPS·배당·PER, 완결+진행 중), 지표 | `/private` 자동 인사이트 |
| `web/public/data/fundamentals/_summary.json` | ~200 KB | `export_fundamentals.py` | 전 종목 지표 요약(PER vs 10년 중간값, EPS 성장, 이익/고점, 3년 고점 대비, 단순 기대수익률) | `/private/ideas` |
| `web/public/data/fundamentals/_fair.json` | ~36 KB | `export_fair_value.py` (fundamentals 생성 Actions 마지막 단계에서도 실행) | 전 종목 이익 시계 적정가 재료: 적정 PER(마지막 실적 전 20년 월말 PER 중간값), 마지막 EPS·시점, 주가. 화면에서 성장률·오늘 날짜로 '적정가 대비 %' 계산(이익 시계와 같은 값, 2026-10-24 AAPL·NKE·KO·NVDA·RMS 대조 일치). 이익이 적자이거나 그때까지 최고 EPS의 20% 미만인 달은 PER 계산에서 제외(2026-10-24, 121개 종목 적정 PER 변경, 예: UDR 60→28, AMD 73→64). `oneOff`: 최근 1년 EPS가 직전 3.5년 연간 EPS 최고치의 절반 미만이면 'drop', 1.8배 초과면 'spike'(일회성 손익 의심, 2026-10-24 기준 drop 68개·spike 12개) — 표에 ⚠ 회색. 잉여현금흐름 기준(2026-10-24 추가): `fcfMult`(20년 월말 주가 ÷ 주당 잉여현금 중간값, 같은 제외 규칙), `fcf`·`fcfT`(최근 주당 잉여현금·시점), `fcfOneOff` — 표 '적정가 대비 · 잉여' 열. 영업현금흐름 기준(같은 날 추가): `ocfMult`·`ocf`·`ocfT`·`ocfOneOff`(주당 영업현금 = EPS × 영업현금 ÷ 순이익, 최근 1년 = 영업현금 ÷ 유통 주식 수) — '영업' 열. 화면에서 세 기준의 일치 정도로 '신뢰'(높음·보통·낮음) 판정. 은행·보험 등 현금흐름 자료가 없는 종목은 빈칸. 에르메스는 화면에서 따로 계산 | `/private` 종목 비교 표 '지금 가격 · 적정가 대비' 열·필터 |
| `web/public/data/fundamentals/_quality.json` | ~80 KB | `build_quality_json.py` (원본 `scripts/data/quality/quality.tsv`) | 기업별 정성 평가: 해자·가격결정력·수익성·성장성·지속가능성(1~5), 등급, 강점·위험 | `/private`, `/private/ideas` |

- 실행: GitHub Actions `전 종목 펀더멘털 데이터 생성` (workflow_dispatch, 입력 `tickers` 비우면 전 종목). 이 세션 환경은 SEC·Yahoo 접속이 막혀 있어 Actions로 생성.
- 2026-10 추가 필드(이익 시계용): `epsEnd`(회계연도 마감일), `ttmAsOf`(최근 1년 EPS 기준 분기말 추정), `monthly`(월말 종가, 배당 미반영), `lastPrice`, `shares`(SEC dei 유통 주식 수, 2년 넘게 오래됐거나 없으면 최근 희석 가중평균 주식 수). 주식 수만 다시 채우기: 워크플로 입력 `--shares-only`.
- EPS 없음(6개: ARES, ERIE, KKR, STZ, V, XOM), 공시 EPS가 오래된 종목(12개)은 숫자 비교에서 제외(`stale`).
- 1~3월 결산 회사는 회계연도를 전년도로 매김. 버크셔는 A주 EPS ÷ 1500.

#### RMS_rolling.json EPS 정정 (2026-10)
- 2009~2025년 EPS를 회사 발표 기준으로 정정(주당이익: 2019·2021~2025년, 그 외 순이익(그룹 몫)÷주식 수). 2025년 46.50→43.15, 2024년 43.00→43.93, 2023년 42.12→41.19, 2020년 14.29→13.21, 2014년 6.76→8.19 등.
- 가격 데이터(CSV)는 그대로 두고 `epsDecomp`와 `rows10y.peBuy`만 다시 계산. `export_rolling_json.py`의 `_RMS_EUR_EPS`도 같이 수정.

#### 월별 주가 (2026-10)
| 파일 | 스크립트 | 내용 | 사용처 |
|---|---|---|---|
| `web/public/data/rolling/RMS_monthly_price.json`, `NKE_monthly_price.json` | `export_monthly_price.py RMS:RMS.PA NKE:NKE` | 월말 종가(배당 미반영, 분할 반영) 2000-01~, 최근 종가 | `/private` 에르메스 8번 '이익 시계 — 적정가 선 vs 주가' |

- 실행: GitHub Actions `월별 주가 데이터 생성` (workflow_dispatch, 입력 `tickers`). 이 세션 환경은 Yahoo 접속이 막혀 있어 Actions로 생성.
- PER 비교는 실제 종가로 해야 해서 배당 조정 전 Close를 쓴다. 최신 주가로 갱신하려면 같은 워크플로를 다시 실행.

#### 2008년 이전 EPS (2026-10)
| 파일 | 스크립트 | 내용 | 사용처 |
|---|---|---|---|
| `web/public/data/fundamentals/{KEY}.json`의 `epsOld` | `export_eps_pre2008.py` | SEC 전자 데이터(XBRL) 이전 연도별 희석 EPS (1995년~). 432개 대상 중 366개 채움(1995년까지 176개) | `/private` 이익 시계(적정가 선) |

- 방법: 매년 나온 10-K(또는 첨부 EX-13)의 요약 표·손익계산서에서 희석 EPS 행을 읽음(3년·5년·10년 표, 두 줄 연도 머리줄, 다음 줄로 넘어간 숫자, 앞에 증가율 칸이 붙은 표 처리).
- 검증: Yahoo 분할 이력으로 보정 → 이미 확정된 해와 겹치는 해의 2/3 이상이 12% 안(최소 한 해 4% 안)일 때만 그 보고서를 인정. 같은 해 값은 보고서 2개 이상이 7% 안에서 일치해야 채택(다수결). 앞뒤 해보다 4배 넘게 혼자 튀는 값은 제외.
- 지주사 전환·본사 이전으로 등록번호가 바뀐 회사는 예전 회사 번호(XBRL+10-K)로 이어 붙임: GOOGL, DIS, MDT, BG, APA, BLK, TPL, AVGO, STE, ETN, CI, MRVL, BKR, ICE, CHTR, MRK(지금 번호의 2009년 이전은 셰링플라우라 제외).
- 실행: GitHub Actions `SEC 이전 EPS 채우기` (입력 `tickers` 비우면 전 종목, `--debug`로 표 진단 출력, `commit` yes/no). 4개로 나눠 동시 실행(약 1시간).
- 교차 검증(2026-10-23): 서로 다른 두 번의 전 종목 실행 결과를 비교해, 값이 다른 해(겹친 3,437개 연도 중 141개)는 제외. 절반 가까이 어긋난 19개 종목(PCG, AXP, GE, MDT 등)은 두 실행이 일치한 해만 남김.
- 실적을 재작성한 회사(예: 애플 2007~2009년)는 SEC의 '처음 발표값'과도 대조하고, 대조 기준은 최근 보고서 값·시점이 가까운 보고서 값 중 하나라도 맞으면 인정.
- 못 채운 65개: 대부분 2008년 이후 상장·분사(META, ABBV, PYPL, TSLA 등). 오래된 회사 중 포드, 클로록스 등은 비어 있음.

#### RMS_rolling.json PER 실제 종가 기준 전환 (2026-10-23)
- `scripts/rms_actual_pe.py`: `epsDecomp`의 peBuy·peSell·peMultiple·peCagr를 실제 종가(배당 미반영) ÷ EPS로 다시 계산, `rows10y`에 `peBuyActual` 추가, `peNote`·`peBasis` 기록. `export_rolling_json.py`의 RMS 단계에서도 자동 적용.
- 2000년 이후는 `RMS_monthly_price.json` 연말 종가, 1993~1999년은 2000~2009년 '실제÷배당조정' 비율 추세(연 약 −1.5%)로 추정(`peBasis: actual-estimated`).
- 이유: 배당 조정 종가로 계산한 PER은 오래된 해일수록 낮게 나와(2000년 약 27%) 이익 시계(실제 종가)와 어긋났다. 수익률(totalCagr)·EPS는 그대로이고, PER 효과는 이제 배당을 뺀 순수 PER 변화.
- 1993~1999년 실제 종가 반영(2026-10-23): 트레이딩뷰 RMS 월봉 종가(EUR, 분할 반영, 사용자가 화면에서 읽어 준 값, 1993년 12월은 1994년 1월 시가 7.96)를 받아 추정치를 대체. 연말 값은 `rms_actual_pe.py`의 `MANUAL_YE`, 월별 전체는 page.tsx `RMS_PRE2000_MONTHLY`(이익 시계 1993년 말부터 표시). 1993~1999년 매수 PER이 4~11% 낮아짐(1993 30.8→27.4, 1999 47.3→46.2배). 이제 전 구간 `peBasis: actual`.

#### 에르메스 2002~2008년 EPS 정정 (2026-10-23)
- 2006 연차보고서 5년 표(순이익 그룹 몫: 2002 215.5 / 2003 216.8 / 2004 213.9 / 2005 247.0 / 2006 268.4 백만 유로, 주당이익 2004 1.94 / 2005 2.27 / 2006 2.51)와 2008 결과 발표(2008 순이익 290.2, 주당이익 +1.8%)로 대조.
- 정정: 2002 2.30→1.96, 2003 1.88→1.97, 2005 2.16→2.27, 2006 2.77→2.51, 2008 2.64→2.75 (2002·2003·2008은 순이익 비율로 환산). 2001년(1.81)은 미확인.
- `_RMS_EUR_EPS`(export_rolling_json.py), `RMS_EPS_HIST`(page.tsx), RMS_rolling.json의 epsDecomp·rows10y PER을 함께 갱신.

#### 에르메스 2001·2007·2008년 EPS 확인 (2026-10-23)
- 2005 연차보고서(분할 전 주당이익: 2001 5.51 / 2002 5.88 / 2003 5.92 / 2004 5.83 / 2005 6.80 유로, ÷3)와 2009 연차보고서(주당이익 2007 2.71 / 2008 2.76 / 2009 2.75)로 대조. 문서는 `fetch-doc-text.yml`(Actions)로 PDF에서 추출.
- 정정: 2001 1.81→1.84, 2007 2.70→2.71, 2008 2.75→2.76. 2002~2005는 기존 값과 일치.
- `scripts/rms_patch_eps.py 2001=1.84 2007=2.71 2008=2.76`: RMS_rolling.json의 EPS만 바꾸고 PER·EPS 배수·연평균 성장률을 다시 계산(가격은 기존 PER×EPS로 되살림). 탐색용 아님, 데이터 수정 스크립트.

#### 에르메스 1993~2000년 EPS: 추정치 → 순이익 환산 (2026-10-23)
- 1996~2000 순이익(그룹 몫): 2005 연차보고서 '순이익 추이' 차트 70 / 81 / 89 / 119 / 175 M€. 1994: WWD 보도 2억 9100만 프랑(44.4 M€, 전년 +38.5%) → 1993 32.0 M€ 역산. 1995는 1994·1996 기하평균(55.7 M€) 추정.
- EPS = 순이익 ÷ 2001년 주식 수(201.7 M€ ÷ 1.837 = 약 1억 980만 주, 1:9 분할 반영): 1993 0.29 / 1994 0.40 / 1995 0.51 / 1996 0.64 / 1997 0.74 / 1998 0.81 / 1999 1.08 / 2000 1.59 (이전 AI 추정 0.44 / 0.50 / 0.51 / 0.58 / 0.70 / 0.81 / 0.95 / 1.20).
- `scripts/rms_patch_eps.py`로 RMS_rolling.json 갱신. 2000년 매수 PER 42→32배, 1999년 54→47배로 바뀌어 page.tsx 부록·연말 PER 문장도 수정.

#### 에르메스 2009~2018년 EPS 연차보고서 값으로 정정 (2026-10-23)
- 기존 값은 순이익÷전체 주식 수라 회사 발표(자사주 제외 주식 수 기준)보다 약 0.5% 낮았음.
- 2011·2012 보고서(xavierpaper), 2015 영문·2017 보고서(assets-finance.hermes.com), 2018 보고서(bnains)에서 확인: 2009 2.75 / 2010 4.01 / 2011 5.68 / 2012 7.11 / 2013 7.59 / 2014 8.24 / 2015 9.32 / 2016 10.53 / 2017 11.70 / 2018 13.48.
- `scripts/rms_patch_eps.py`로 RMS_rolling.json 갱신, `RMS_EPS_HIST`·`_RMS_EUR_EPS` 동시 수정.
- 추가(같은 날): 2019·2021 연차보고서로 2019 14.66 / 2020 13.27 / 2021 23.37 확인. 2020은 13.21→13.27 정정(2020 EPS 감소 −9.9%→−9.5%). page.tsx `HERMES_EPS`(EPS 증가율 분해)의 2018도 13.43→13.48.
- 1990년대 회사 발표 EPS: AMF(BDIF) 공시 검색은 2006년 이후 문서만 있고, bnains 아카이브도 2006년 이후라 찾지 못함. 1993~2000은 순이익 환산 유지.

#### 전 종목 잉여현금흐름·이익 수익률·ROE·ROIC (2026-10-23)
| 파일 | 스크립트 | 내용 | 사용처 |
|---|---|---|---|
| `web/public/data/fundamentals/{KEY}.json`의 `cash` + `metrics`(earnYield·fcfPs·fcfYield·roe·roic·roe5·roic5·conv5), `_summary.json` 같은 지표 | `scripts/export_cashflow.py` (Actions '전 종목 현금흐름·자본 수익률') | SEC companyfacts: 연도별 영업현금흐름·설비투자·잉여현금흐름·순이익·배당·자사주·자기자본·차입금·현금, ROE·ROIC·현금 전환율·주당 잉여현금·연말 잉여현금 수익률, 최근 1년(10-K + 10-Q 누적) | `/private` 이익 시계 '내 몫 잉여현금', '1달러당 얼마를 버나' 섹션 |
- 금액 단위 백만 달러. 금융사(SEC 업종 코드 6000~6399, 건강보험 6324 제외)는 잉여현금흐름·ROIC 없음(`bank: true`), 버크셔는 잉여현금흐름 유지.
- 설비투자: 일반(유형자산 취득)·석유(탐사·개발)·전력(건설 중 자산)·리츠(개발)·소프트웨어 항목과 회사 고유 이름(CapitalExpenditure…)을 차례로 찾음. 못 찾은 해는 잉여현금흐름을 비움.
- 주당 잉여현금(최근 1년) = 잉여현금흐름 ÷ 공시 유통 주식 수. 연도별은 EPS × 잉여현금 ÷ 순이익(|EPS| ≥ 0.1).
- ROE 300% 초과(자기자본이 너무 작음), 투하자본이 (자기자본+차입금)의 10% 미만이거나 ROIC 300% 초과면 비움. 현금 전환율 ±5배 초과는 비움.
- 영업이익 항목이 없으면 세전이익 + 이자비용으로 근사(나이키 등). 세율은 실효세율(0~40%), 없으면 21%(2018~)·35%.
- `export_fundamentals.py`는 다시 돌려도 `cash`·`epsOld`와 위 지표를 지우지 않음.
- 에르메스는 SEC 대상이 아니라 page.tsx `RMS_FIN`(회사 발표 2014~2025: 순이익·영업이익·자기자본·재작성 순현금·조정 잉여현금흐름 2017~)으로 계산.
