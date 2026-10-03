import type { PriceData } from './dataLoader'

// S0 인출식 전략 신호 — scripts/export_s0_tradelog.py 와 동일한 규칙
//   200일 지수이동평균 (TradingView ta.ema 와 동일): α = 2/(N+1), 첫 값 = 처음 N일 단순평균
//   보유 중 + 종가 < 이동평균 15거래일 연속 → 전량 매도
//   현금   + 종가 > 이동평균 15거래일 연속 → 전액 매수
//   신호 발생 시 연속일 카운터 리셋, 종가 = 이동평균이면 양쪽 카운터 모두 리셋
export const EMA_PERIOD = 200
export const SIGNAL_DAYS = 15

export interface SignalEvent {
  date: string
  action: 'BUY' | 'SELL'
}

export interface EmaSignal {
  date: string             // 최신 데이터 날짜 (YYYY-MM-DD)
  close: number            // 나스닥100 종가 (실제 지수값)
  ema: number              // 200일 지수이동평균 (실제 지수값 기준)
  divPct: number           // 이동평균 대비 % ((종가 − 이동평균) / 이동평균 × 100)
  side: 'above' | 'below' | 'equal'
  streak: number           // 현재 쪽(위/아래)에 머문 연속 거래일 수
  crossDate: string | null // 현재 쪽으로 넘어온 첫날
  holding: boolean         // S0 상태: 보유 중 / 현금 대기
  counter: number          // 다음 신호까지 쌓인 연속일 (보유 중이면 아래 연속일, 현금이면 위 연속일)
  lastSignal: SignalEvent | null
  signalToday: boolean     // 최신 데이터 날짜에 신호가 발생했는지
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function computeEma(prices: Float64Array, period = EMA_PERIOD): Float64Array {
  const n = prices.length
  const ema = new Float64Array(n).fill(NaN)
  if (n < period) return ema
  const alpha = 2 / (period + 1)
  let sum = 0
  for (let i = 0; i < period; i++) sum += prices[i]
  ema[period - 1] = sum / period
  for (let i = period; i < n; i++) {
    ema[i] = prices[i] * alpha + ema[i - 1] * (1 - alpha)
  }
  return ema
}

export function computeEmaSignal(data: PriceData): EmaSignal | null {
  // splice 보정된 가격으로 계산 → 화면 표시는 원본 지수값 단위로 환산 (비율은 동일)
  const px = data.rawPrices
  const n = px.length
  if (n < EMA_PERIOD) return null
  const ema = computeEma(px)

  let holding = true
  let below = 0
  let above = 0
  let streak = 0
  let side: 'above' | 'below' | 'equal' = 'equal'
  let crossIdx = -1
  let lastSignal: SignalEvent | null = null
  let lastSignalIdx = -1

  for (let i = EMA_PERIOD - 1; i < n; i++) {
    const div = px[i] - ema[i]
    const cur = div < 0 ? 'below' : div > 0 ? 'above' : 'equal'

    if (cur === side) {
      streak++
    } else {
      side = cur
      streak = 1
      crossIdx = i
    }

    if (div < 0) { below++; above = 0 }
    else if (div > 0) { above++; below = 0 }
    else { below = 0; above = 0 }

    if (holding && below >= SIGNAL_DAYS) {
      holding = false
      below = 0
      lastSignal = { date: ymd(data.dates[i]), action: 'SELL' }
      lastSignalIdx = i
    } else if (!holding && above >= SIGNAL_DAYS) {
      holding = true
      above = 0
      lastSignal = { date: ymd(data.dates[i]), action: 'BUY' }
      lastSignalIdx = i
    }
  }

  const last = n - 1
  const toReal = data.closes[last] / px[last]

  return {
    date: ymd(data.dates[last]),
    close: data.closes[last],
    ema: ema[last] * toReal,
    divPct: (px[last] / ema[last] - 1) * 100,
    side,
    streak,
    crossDate: crossIdx >= 0 ? ymd(data.dates[crossIdx]) : null,
    holding,
    counter: holding ? below : above,
    lastSignal,
    signalToday: lastSignalIdx === last,
  }
}
