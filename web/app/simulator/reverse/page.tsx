'use client'

import { useState, useEffect, useTransition, Suspense } from 'react'
import type { CohortResult, Instrument } from '@/lib/types'
import type { PriceData } from '@/lib/dataLoader'
import { runBacktest } from '@/lib/backtest'
import Header from '@/components/Header'
import Link from 'next/link'
import { costLabel } from '@/lib/costText'

// 성공률 계산: results 중 targetYears 이내 달성한 비율
function successRate(results: CohortResult[], targetYears: number): number {
  if (!results.length) return 0
  const ok = results.filter(r => r.status === 'completed' && r.yearsToTarget !== null && r.yearsToTarget <= targetYears)
  return ok.length / results.length
}

// 달성 기간 분포: p번째 백분위수 (전체 코호트 기준, 미달성 = Infinity)
function percentileYears(results: CohortResult[], p: number): number {
  const all = results.map(r =>
    r.status === 'completed' && r.yearsToTarget !== null ? r.yearsToTarget : Infinity
  ).sort((a, b) => a - b)
  const idx = Math.ceil(p * all.length) - 1
  return all[Math.max(0, idx)]
}

// Binary search: desiredRate 이상 달성하는 최소 dailyInvest 찾기
function findMinDaily(
  data: PriceData,
  params: { instrument: Instrument; capInvest: number; lumpSum: number; targetAmount: number },
  targetYears: number,
  desiredRate: number,
  strategy: 'A' | 'C'
): number {
  let lo = 10_000, hi = 10_000_000
  for (let i = 0; i < 20; i++) {
    const mid = Math.round((lo + hi) / 2 / 10_000) * 10_000
    const res = runBacktest(data, { ...params, strategy: 'A', dailyInvest: mid })
    const r = successRate(strategy === 'A' ? res.A : res.C, targetYears)
    if (r >= desiredRate) hi = mid
    else lo = mid + 10_000
    if (hi - lo <= 10_000) break
  }
  return hi
}

const instrumentOptions: { value: Instrument; label: string }[] = [
  { value: 'ndx3x', label: 'TQQQ (나스닥100 3배)' },
  { value: 'ndx2x', label: 'QLD (나스닥100 2배)' },
  { value: 'ndx1x', label: '나스닥100 (1배)' },
  { value: 'sp500', label: 'VOO (S&P500)' },
]

const RATES = [
  { label: '절반(50%)', p: 0.5, desc: '절반의 시작 시점에서 달성', color: 'text-blue-600 dark:text-blue-400' },
  { label: '80%',       p: 0.8, desc: '80%의 시작 시점에서 달성', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: '90%',       p: 0.9, desc: '90%의 시작 시점에서 달성', color: 'text-orange-600 dark:text-orange-400' },
]

function fmt(n: number): string {
  if (n >= 1e8) return `월 ${(n / 1e8).toFixed(2)}억`
  return `월 ${Math.round(n / 1e4).toLocaleString()}만원`
}
function fmtTarget(n: number): string {
  return n >= 1e8 ? `${(n / 1e8).toFixed(0)}억원` : `${(n / 1e4).toFixed(0)}만원`
}

interface CalcResult {
  strategy: 'A' | 'C'
  rate50: number; rate80: number; rate90: number
  p50years: number; p80years: number
  cohortCount: number
}

function ReverseSimulatorInner() {
  const [priceData, setPriceData] = useState<{ ndx: PriceData; sp5: PriceData } | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [instrument, setInstrument] = useState<Instrument>('ndx3x')
  const [targetAmount, setTargetAmount] = useState(1_000_000_000)
  const [targetYears, setTargetYears] = useState(10)
  const [lumpSum, setLumpSum] = useState(0)
  const [withCosts, setWithCosts] = useState(true)

  const [result, setResult] = useState<{
    A: { d50: number; d80: number; d90: number }
    C: { d50: number; d80: number; d90: number }
    cohortCount: number
    yr50_A: number; yr80_A: number
    yr50_C: number; yr80_C: number
  } | null>(null)

  useEffect(() => {
    import('@/lib/dataLoader').then(({ loadNdx, loadSp500 }) =>
      Promise.all([loadNdx(), loadSp500()]).then(([ndx, sp5]) => {
        setPriceData({ ndx, sp5 })
        setDataLoading(false)
      })
    )
  }, [])

  function runCalc() {
    if (!priceData) return
    startTransition(() => {
      const base = instrument === 'sp500' ? priceData.sp5 : priceData.ndx
      const data = (withCosts && instrument !== 'sp500')
        ? { ...base, lev1: base.lev1c, lev2: base.lev2c, lev3: base.lev3c }
        : base

      const params = { instrument, capInvest: 999_999_999, lumpSum, targetAmount }

      // A전략: binary search × 3 percentiles
      const d50_A = findMinDaily(data, params, targetYears, 0.5,  'A')
      const d80_A = findMinDaily(data, params, targetYears, 0.8,  'A')
      const d90_A = findMinDaily(data, params, targetYears, 0.9,  'A')

      // C전략 (거치금이 있을 때만 의미있음)
      const d50_C = lumpSum > 0 ? findMinDaily(data, { ...params, lumpSum }, targetYears, 0.5,  'C') : d50_A
      const d80_C = lumpSum > 0 ? findMinDaily(data, { ...params, lumpSum }, targetYears, 0.8,  'C') : d80_A
      const d90_C = lumpSum > 0 ? findMinDaily(data, { ...params, lumpSum }, targetYears, 0.9,  'C') : d90_A

      // 중앙값·하위20% 기준 소요기간 (d80으로 실행 시)
      const res_A = runBacktest(data, { ...params, strategy: 'A', dailyInvest: d80_A })
      const yr50_A = percentileYears(res_A.A, 0.5)
      const yr80_A = percentileYears(res_A.A, 0.8)

      let yr50_C = yr50_A, yr80_C = yr80_A
      if (lumpSum > 0) {
        const res_C = runBacktest(data, { ...params, strategy: 'A', dailyInvest: d80_C, lumpSum })
        yr50_C = percentileYears(res_C.C, 0.5)
        yr80_C = percentileYears(res_C.C, 0.8)
      }

      setResult({
        A: { d50: d50_A, d80: d80_A, d90: d90_A },
        C: { d50: d50_C, d80: d80_C, d90: d90_C },
        cohortCount: res_A.A.length,
        yr50_A, yr80_A, yr50_C, yr80_C,
      })
    })
  }

  const showC = lumpSum > 0

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="simulator" />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/simulator" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          ← 시뮬레이터
        </Link>

        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-bold mb-2">역방향 계산기</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            "N년 안에 목표 달성하려면 매달 얼마씩 넣어야 하나?" — 1971년 이후 모든 시작 시점 기준
          </p>
        </div>

        {/* 입력 패널 */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">

          {/* 종목 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">종목</p>
            <div className="space-y-2">
              {instrumentOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setInstrument(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    instrument === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-gray-900 dark:text-white font-medium'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 수치 입력 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">목표 설정</p>

            {/* 목표 금액 */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">목표 금액</label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {[5e8, 1e9, 3e9, 5e9, 10e9].map(v => (
                  <button key={v} onClick={() => setTargetAmount(v)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${targetAmount === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {fmtTarget(v)}
                  </button>
                ))}
              </div>
              <input type="number" value={targetAmount} step={1e8} min={1e8}
                onChange={e => setTargetAmount(Number(e.target.value))}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <p className="text-xs text-gray-400 mt-0.5">{fmtTarget(targetAmount)}</p>
            </div>

            {/* 목표 기간 */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">목표 기간</label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {[5, 7, 10, 15, 20].map(v => (
                  <button key={v} onClick={() => setTargetYears(v)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${targetYears === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {v}년
                  </button>
                ))}
              </div>
              <input type="number" value={targetYears} step={1} min={1} max={30}
                onChange={e => setTargetYears(Number(e.target.value))}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <p className="text-xs text-gray-400 mt-0.5">{targetYears}년 이내 달성</p>
            </div>

            {/* 거치금 */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">거치금 (없으면 0)</label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {[0, 5e7, 1e8, 2.5e8, 5e8].map(v => (
                  <button key={v} onClick={() => setLumpSum(v)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${lumpSum === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {v === 0 ? '없음' : fmtTarget(v)}
                  </button>
                ))}
              </div>
              <input type="number" value={lumpSum} step={1e7} min={0}
                onChange={e => setLumpSum(Number(e.target.value))}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              {lumpSum > 0 && <p className="text-xs text-gray-400 mt-0.5">5년 균등 분할 투입 — 월 {Math.round(lumpSum / 60 / 1e4).toLocaleString()}만원 추가</p>}
            </div>

            {/* 비용 토글 */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">비용 반영</p>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs w-full">
                <button onClick={() => setWithCosts(false)}
                  className={`flex-1 py-2 transition-colors ${!withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  운용보수만
                </button>
                <button onClick={() => setWithCosts(true)}
                  className={`flex-1 py-2 transition-colors ${withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  + 스왑금리
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{costLabel(instrument, withCosts)}</p>
            </div>
          </div>
        </div>

        {/* 실행 버튼 */}
        <button
          onClick={runCalc}
          disabled={dataLoading || isPending}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold text-sm transition-colors mb-8"
        >
          {dataLoading ? '데이터 로딩 중...' : isPending ? '계산 중... (약 1~2초)' : '▶ 계산하기'}
        </button>

        {/* 결과 */}
        {!isPending && result && (
          <div className="space-y-6">

            {/* 요약 배지 */}
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30">
                {instrumentOptions.find(o => o.value === instrument)?.label}
              </span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                목표 {fmtTarget(targetAmount)}
              </span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                {targetYears}년 이내
              </span>
              {lumpSum > 0 && (
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  거치 {fmtTarget(lumpSum)}
                </span>
              )}
              <span className="text-xs text-gray-400 self-center">{result.cohortCount}가지 시작 시점 기준</span>
            </div>

            {/* 결과 표 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/60">
                    <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400 text-xs">달성 기준</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400 text-xs">A전략 (계속 적립)</th>
                    {showC && <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400 text-xs">C전략 (거치금 포함)</th>}
                    <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400 text-xs">의미</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {RATES.map(({ label, p, desc, color }) => {
                    const keyMap: Record<number, keyof typeof result.A> = { 0.5: 'd50', 0.8: 'd80', 0.9: 'd90' }
                    const k = keyMap[p]
                    return (
                      <tr key={label} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold ${color}`}>{label}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">확률로</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                          {result.A[k] >= 10_000_000
                            ? <span className="text-gray-400 text-xs">금액이 너무 많음</span>
                            : fmt(result.A[k])}
                        </td>
                        {showC && (
                          <td className="py-3.5 px-4 font-bold text-blue-700 dark:text-blue-300">
                            {result.C[k] >= 10_000_000
                              ? <span className="text-gray-400 text-xs">금액이 너무 많음</span>
                              : fmt(result.C[k])}
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-xs text-gray-400 dark:text-gray-500">{desc}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 80% 기준 소요기간 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30 rounded-xl p-4">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">A전략 — 80% 달성 금액 기준 소요기간</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">중간값 (50%)</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {result.yr50_A === Infinity ? '미달성' : `${result.yr50_A.toFixed(1)}년`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">하위 20% (어려운 경우)</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {result.yr80_A === Infinity ? '미달성 있음' : `${result.yr80_A.toFixed(1)}년`}
                    </span>
                  </div>
                </div>
              </div>
              {showC && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/30 rounded-xl p-4">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">C전략 — 80% 달성 금액 기준 소요기간</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">중간값 (50%)</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {result.yr50_C === Infinity ? '미달성' : `${result.yr50_C.toFixed(1)}년`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">하위 20% (어려운 경우)</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {result.yr80_C === Infinity ? '미달성 있음' : `${result.yr80_C.toFixed(1)}년`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 주의 */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 text-xs text-yellow-800 dark:text-yellow-200/80 space-y-1">
              <p><strong>읽는 법:</strong> "50% 확률로 → A전략 월 X만원"은 이 금액을 매일 적립하면 1971년 이후 어느 달에 시작하든 절반의 경우에서 {targetYears}년 이내 {fmtTarget(targetAmount)}을 달성한다는 뜻이다.</p>
              <p>합성 가격(과거 데이터) 기반이며 미래 수익을 보장하지 않는다. TQQQ/QLD는 운용보수·스왑금리 반영. 배당은 제외(실제보다 보수적).</p>
            </div>

            {/* 정방향 시뮬레이터 링크 */}
            <div className="text-sm text-center">
              <Link href="/simulator/custom" className="text-blue-500 dark:text-blue-400 hover:underline">
                정방향 시뮬레이터 — "매달 X만원 넣으면 몇 년?" →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReverseSimulatorPage() {
  return (
    <Suspense>
      <ReverseSimulatorInner />
    </Suspense>
  )
}
