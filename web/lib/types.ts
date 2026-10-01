export type Instrument = 'ndx1x' | 'ndx2x' | 'ndx3x' | 'sp500'
export type Strategy = 'A' | 'B' | 'C'
export type Phase = 'accumulation' | 'withdrawal'

export interface BacktestParams {
  instrument: Instrument
  strategy: Strategy
  dailyInvest: number      // 원 (기본 200_000)
  capInvest: number        // A전략 한도 (기본 250_000_000)
  lumpSum: number          // B전략 거치금 (기본 250_000_000)
  targetAmount: number     // 목표금액 (기본 1_000_000_000)
}

export interface CohortResult {
  startDate: Date
  endDate: Date | null
  status: 'completed' | 'in_progress'
  yearsToTarget: number | null
  daysToTarget: number | null
  finalValue: number
  accumulatedInvestment: number
}

export interface StrategyResults {
  A: CohortResult[]
  B: CohortResult[]
  C: CohortResult[]
}

export interface BacktestSummary {
  strategy: Strategy
  total: number
  completed: number
  completionRate: number
  avgYears: number | null
  medianYears: number | null
  maxYears: number | null
  minYears: number | null
}

export interface DistributionBin {
  yearsBin: number
  pct: number
}

export interface CdfPoint {
  year: number
  pct: number
}

// 인출 시뮬레이션 파라미터
export interface WithdrawalParams {
  initialPortfolio: number     // 시작 자산 (목표 달성 시점 금액)
  withdrawalRate: number       // 월 인출률 (기본 0.01 = 1%)
  leverage: number             // 유지 레버리지
  years: number                // 시뮬레이션 기간 (년)
}

export interface WithdrawalResult {
  month: number
  portfolioValue: number
  withdrawn: number
  cumWithdrawn: number
}
