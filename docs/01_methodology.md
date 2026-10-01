# 방법론 (코딩 에이전트가 재현 백테스트를 돌리기 위한 정확한 스펙)

## 1. 원천 데이터
| 파일 | 내용 | 기간 | 용도 |
|---|---|---|---|
| `ndx 1971_now.csv` | 나스닥종합지수 → NDX(나스닥100)로 전환된 일별 종가 (`Date,Close`) | 1971-02-05 ~ 2026-09-25 | NDX 1x/2x/3x 전부 이 파일에서 합성 |
| `sp500_1927_now.csv` | S&P500 일별 종가 (`Date,Close`) | 1927-12-30 ~ 2026-09-03 | SPX500/VOO 1x 백테스트용 원시 가격 데이터 |
| `mcv_spx500_1x_monthly_10b.csv` | SPX500 1x, C전략 사전계산 **결과** (원시가격 아님) | - | 로직 검증/대조용 |
| `mcv_ndx_2x_monthly_10b.json` | NDX 2x, A전략(일 20만원, 2.5억 cap), 10억 목표 사전계산 **결과** | 627 코호트 | 로직 검증/대조용 |


## 2. 알려진 데이터 결함과 수정법
`ndx 1971_now.csv`는 1985-10-01 부근에서 지수 소스가 나스닥종합 → NDX로 바뀌면서 **가짜 -60% 급락**이 생깁니다
(실제 시장 사건 아님). 반드시 아래처럼 비율보정해야 합니다:

```python
import pandas as pd
raw = pd.read_csv('ndx 1971_now.csv', parse_dates=['Date']).sort_values('Date').reset_index(drop=True)
splice_i = raw.index[raw['Date'] == '1985-10-01'][0]  # 실제 스플라이스 지점은 데이터 확인 후 인덱스 특정
scale = raw.loc[splice_i - 1, 'Close'] / raw.loc[splice_i, 'Close']
raw.loc[splice_i:, 'Close'] *= scale
```
> 주의: 정확한 `splice_i` 인덱스는 재실행 시 데이터를 직접 눈으로 확인해서 재특정해야 합니다
> (이전 세션에서는 전후 가격 비율을 비교해 1985-10-01 시점을 찾았습니다).

## 3. 레버리지 합성 공식
실제 TQQQ/QLD 가격이 아니라, 1x 지수의 일별 수익률에 레버리지를 곱해 매일 재투자(compounding)한
**이론적 가격**을 사용합니다:

```python
daily_ret = raw['Close'].pct_change()
synthetic_price = 100 * (1 + daily_ret * leverage).cumprod()
# leverage = 1 (QQQ), 2 (QLD), 3 (TQQQ)
```
**캐비엇**: 실제 운용비용, 일일 리밸런싱 추적오차, 변동성 끌림(decay)은 반영되지 않음. 실제 상품 수익률과는
차이가 날 수 있음 — 이 캐비엇은 사이트 어디든 레버리지 수치가 나올 때마다 노출되어야 합니다.

## 4. 세 가지 적립 전략 (A/B/C) — 반드시 이 정의를 그대로 써야 함
- **A전략**: 매일 고정금액(기본값 20만원)을 적립하다가, 누적 납입액이 특정 **한도(cap, 기본 2.5억)**에 도달하면
  **적립을 멈추고** 기존 포지션을 그대로 들고 간다.
- **B전략**: 처음에 한도만큼(기본 2.5억)을 **거치(lump-sum)로 즉시 투자**하고, 그 이후로도 매일 고정금액(20만원)을
  **한도 없이 계속** 적립한다.
- **C전략**: 거치 없이, 매일 고정금액(20만원)을 **한도 없이 계속** 적립한다. (가장 보수적/단순)

## 5. 코호트(cohort) 기반 백테스트 방식
- 가격 데이터의 **매월 첫 거래일**을 시작일로 하는 코호트를 만든다 (NDX 계열: 1971년부터 약 668개 코호트).
- 각 코호트마다 시작일부터 전략(A/B/C)에 따라 매일 매수를 시뮬레이션하고, **포트폴리오 가치가 목표금액
  (10억 또는 20억)에 처음 도달하는 날**을 찾는다.
- 데이터 종료일까지 목표에 도달하지 못하면 `status = in_progress`로 표기.

### 표준 출력 스키마 (모든 백테스트 결과 CSV/JSON이 따라야 하는 형식)
```
start_date, end_date, days_to_target, status, final_value,
accumulated_investment, accumulated_shares, years_to_target
```
- `status`: `completed` 또는 `in_progress`
- `years_to_target = days_to_target / 365.25`
- `final_value`: 목표 도달 시점(또는 데이터 종료 시점) 포트폴리오 가치
- `accumulated_investment`: 그 시점까지 실제로 납입한 총 원금

## 6. 성능 구현 주의사항 (재현 시 반드시 벡터화할 것)
668개 코호트 × 코호트당 최대 ~13,000+ 일 단위 중첩 for-loop는 타임아웃이 날 정도로 느립니다.
반드시 아래처럼 numpy 벡터화할 것:
- 매수 주식수의 **cumulative sum(prefix-sum)** 배열을 미리 계산
- 날짜 오프셋 룩업은 `np.searchsorted` 사용
- "목표가 처음 초과되는 지점" 탐색은 `np.argmax(조건배열)` 사용

## 7. 표준 엑셀 출력 포맷 (산출물 공개 시 참고용 — 지금 당장 웹사이트에 필수는 아님)
과거 세션에서는 openpyxl로 3-시트 구조를 썼습니다:
- `data` 시트: 코호트별 원시 결과 + 산점도(ScatterChart, x축=시작일/DateAxis, y축=years_to_target)
- `distribution` 시트: years_to_target을 0.5년 단위로 bin한 히스토그램 (완료 코호트 비율 %)
- `cdf` 시트: N년 이내 목표 도달 누적비율(%) 꺾은선그래프

웹사이트에서는 이 구조를 그대로 차트 라이브러리(d3, recharts 등)로 재구현하면 됩니다.
