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
| `withdrawal_daily_rule25_meta.json` | 71 KB | `export_withdrawal_tradelog.py` | RULE25 코호트 인덱스 (시작일·종료일·요약 통계) |
| `withdrawal_daily_rule25/<start>.json` | 0.9~668 KB each | `export_withdrawal_tradelog.py` | RULE25 코호트별 일별 전체 데이터 (668개, 총 226MB) |

**일별 데이터 형식 (배열 각 행):** `[date, ndx, ema200, peak52w, port, pos, act]`
- date: "YYYY-MM-DD", ndx/ema200/peak52w: float 소수점 1자리
- port: 억 원 (소수점 2자리), pos: 0=현금/1=투자, act: null/"B"/"S"

**메타 코호트 필드:** `{s, end, inv, final, wd, yrs, dd, n_trades}`

**결과:**
- 668코호트 전체 (데이터 끝인 2026-09까지), 최장 코호트 14,027 거래일 (55.66년)
- 평균 거래 15.5회 · 10년 이상 보유 최종자산 중간값 16,499억 (스왑 스프레드 50bps 반영)
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
- 668 시작 시점, 10년 이상 보유 최종자산 중간값 23,021억
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
