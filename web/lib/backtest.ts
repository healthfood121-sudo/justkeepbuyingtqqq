import type { BacktestParams, CohortResult, StrategyResults, BacktestSummary, DistributionBin, CdfPoint } from './types'
import type { PriceData } from './dataLoader'

// ===== 코호트 시작일 추출 (매월 첫 거래일) =====
function getMonthlyStarts(dates: Date[]): number[] {
  const seen = new Set<string>()
  const starts: number[] = []
  for (let i = 0; i < dates.length; i++) {
    const key = `${dates[i].getFullYear()}-${dates[i].getMonth()}`
    if (!seen.has(key)) {
      seen.add(key)
      starts.push(i)
    }
  }
  return starts
}

// ===== 단일 코호트 백테스트 =====
function runCohort(
  prices: Float64Array,
  dates: Date[],
  startIdx: number,
  strategy: 'A' | 'B' | 'C',
  dailyInvest: number,
  capInvest: number,
  lumpSum: number,
  targetAmount: number
): CohortResult {
  const nInvestDays = Math.floor(capInvest / dailyInvest)
  const n = prices.length - startIdx
  const startDate = dates[startIdx]

  let cumShares = 0
  let cumInvest = 0
  let hitIdx = -1
  let hitValue = 0

  for (let j = 0; j < n; j++) {
    const px = prices[startIdx + j]
    let inv: number

    if (strategy === 'A') {
      inv = dailyInvest                          // A전략: 계속 적립, 한도 없음
    } else if (strategy === 'B') {
      inv = j < nInvestDays ? dailyInvest : 0   // B전략: 한도 후 중단
    } else {
      inv = j === 0 ? lumpSum : dailyInvest      // C전략: 거치 + 계속 적립
    }

    cumShares += inv / px
    cumInvest += inv
    const portVal = cumShares * px

    if (portVal >= targetAmount) {
      hitIdx = j
      hitValue = portVal
      break
    }
  }

  if (hitIdx >= 0) {
    const endDate = dates[startIdx + hitIdx]
    const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
    return {
      startDate,
      endDate,
      status: 'completed',
      yearsToTarget: days / 365.25,
      daysToTarget: days,
      finalValue: hitValue,
      accumulatedInvestment: cumInvest,
    }
  }

  // in_progress
  const lastPx = prices[prices.length - 1]
  return {
    startDate,
    endDate: null,
    status: 'in_progress',
    yearsToTarget: null,
    daysToTarget: null,
    finalValue: cumShares * lastPx,
    accumulatedInvestment: cumInvest,
  }
}

// ===== 전체 백테스트 실행 =====
export function runBacktest(
  priceData: PriceData,
  params: BacktestParams
): StrategyResults {
  const { instrument, strategy, dailyInvest, capInvest, lumpSum, targetAmount } = params

  let prices: Float64Array
  if (instrument === 'ndx1x') prices = priceData.lev1
  else if (instrument === 'ndx2x') prices = priceData.lev2
  else if (instrument === 'ndx3x') prices = priceData.lev3
  else prices = priceData.lev1  // sp500

  const { dates } = priceData
  const cohortStarts = getMonthlyStarts(dates)

  const runStrategy = (s: 'A' | 'B' | 'C') =>
    cohortStarts.map(si =>
      runCohort(prices, dates, si, s, dailyInvest, capInvest, lumpSum, targetAmount)
    )

  // 단일 전략 선택 시에도 A/B/C 모두 계산 (비교용)
  return {
    A: runStrategy('A'),
    B: runStrategy('B'),
    C: runStrategy('C'),
  }
}

// ===== 통계 요약 =====
export function summarize(results: CohortResult[], strategy: 'A' | 'B' | 'C'): BacktestSummary {
  const total = results.length
  const completed = results.filter(r => r.status === 'completed')
  const years = completed.map(r => r.yearsToTarget!).sort((a, b) => a - b)

  const median = (arr: number[]) => {
    if (arr.length === 0) return null
    const mid = Math.floor(arr.length / 2)
    return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid]
  }

  return {
    strategy,
    total,
    completed: completed.length,
    completionRate: total > 0 ? (completed.length / total) * 100 : 0,
    avgYears: years.length > 0 ? years.reduce((a, b) => a + b, 0) / years.length : null,
    medianYears: median(years),
    maxYears: years.length > 0 ? years[years.length - 1] : null,
    minYears: years.length > 0 ? years[0] : null,
  }
}

// ===== 분포 히스토그램 =====
export function makeDistribution(results: CohortResult[], binSize = 0.5): DistributionBin[] {
  const completed = results.filter(r => r.status === 'completed' && r.yearsToTarget !== null)
  if (completed.length === 0) return []

  const maxYears = Math.max(...completed.map(r => r.yearsToTarget!))
  const total = results.length
  const bins: DistributionBin[] = []

  for (let b = 0; b <= maxYears + binSize; b += binSize) {
    const cnt = completed.filter(r => r.yearsToTarget! >= b && r.yearsToTarget! < b + binSize).length
    bins.push({ yearsBin: Math.round(b * 10) / 10, pct: (cnt / total) * 100 })
  }

  return bins
}

// ===== CDF =====
export function makeCdf(results: CohortResult[]): CdfPoint[] {
  const completed = results.filter(r => r.status === 'completed' && r.yearsToTarget !== null)
  if (completed.length === 0) return []

  const maxYears = Math.ceil(Math.max(...completed.map(r => r.yearsToTarget!)))
  const total = results.length
  const cdf: CdfPoint[] = []

  for (let yr = 1; yr <= maxYears + 1; yr++) {
    const cnt = results.filter(r => r.yearsToTarget !== null && r.yearsToTarget <= yr).length
    cdf.push({ year: yr, pct: (cnt / total) * 100 })
  }

  return cdf
}

// ===== 인출 시뮬레이션 =====
export interface WithdrawalSimParams {
  startPortfolio: number
  monthlyWithdrawalRate: number   // 예: 0.01 = 월 1%
  leverage: number
  priceData: PriceData
  startDateStr: string           // 'YYYY-MM-DD' 인출 시작일
  years: number
}

export interface WithdrawalMonthPoint {
  month: number
  date: string
  portfolioValue: number
  monthlyWithdrawal: number
  cumWithdrawn: number
}

export function runWithdrawalSim(p: WithdrawalSimParams): WithdrawalMonthPoint[] {
  const { startPortfolio, monthlyWithdrawalRate, leverage, priceData, startDateStr, years } = p

  let prices: Float64Array
  if (leverage === 1) prices = priceData.lev1
  else if (leverage === 2) prices = priceData.lev2
  else prices = priceData.lev3

  const { dates } = priceData
  const startTime = new Date(startDateStr).getTime()

  // 시작일 인덱스 찾기
  let startIdx = 0
  for (let i = 0; i < dates.length; i++) {
    if (dates[i].getTime() >= startTime) { startIdx = i; break }
  }

  const totalMonths = years * 12
  const points: WithdrawalMonthPoint[] = []

  let shares = startPortfolio / prices[startIdx]
  let cumWithdrawn = 0
  let curIdx = startIdx

  for (let m = 0; m < totalMonths; m++) {
    // 월 첫 거래일로 이동
    const targetYear = dates[startIdx].getFullYear() + Math.floor((dates[startIdx].getMonth() + m) / 12)
    const targetMonth = (dates[startIdx].getMonth() + m) % 12
    let nextMonthIdx = curIdx
    while (nextMonthIdx < dates.length - 1) {
      const d = dates[nextMonthIdx]
      if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) break
      nextMonthIdx++
    }
    curIdx = nextMonthIdx

    const px = prices[curIdx]
    const portVal = shares * px
    const withdrawal = portVal * monthlyWithdrawalRate
    const sellShares = withdrawal / px
    shares = Math.max(0, shares - sellShares)
    cumWithdrawn += withdrawal

    points.push({
      month: m + 1,
      date: dates[curIdx].toISOString().slice(0, 7),
      portfolioValue: shares * px,
      monthlyWithdrawal: withdrawal,
      cumWithdrawn,
    })

    if (shares <= 0) break
  }

  return points
}
