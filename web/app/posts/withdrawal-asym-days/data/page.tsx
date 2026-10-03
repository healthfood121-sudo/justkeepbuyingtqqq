'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface SummaryRow {
  key: string
  sell: number
  buy: number
  med: number
  p10: number
  p25: number
  worst: number
  wd: number
  trades: number
  min_med: number
  min_worst: number
  below5: number
  below3: number
  whip_avg: number
  whip_max: number
  regret_avg: number
  live_lo_worst: number
}

// fields: final, mdd, uw, cut, live_lo, min, trades, whip, regret
type CohortTuple = [number, number, number, number, number, number, number, number, number]

interface ModeBlock {
  starts: string[]
  summary: SummaryRow[]
  cohorts: Record<string, CohortTuple[]>
}

interface AsymDetail {
  meta: { generated: string; sim_years: number; whip_window: number }
  modes: Record<string, ModeBlock>
}

const MODES: { key: string; label: string }[] = [
  { key: 'v2_same',       label: '스왑금리 반영 · 당일 체결' },
  { key: 'v2_next',       label: '스왑금리 반영 · 다음날 체결' },
  { key: 'standard_same', label: '스왑금리 미반영 · 당일 체결' },
  { key: 'standard_next', label: '스왑금리 미반영 · 다음날 체결' },
]

function stratLabel(s: SummaryRow) {
  return `매도 ${s.sell}일 · 매수 ${s.buy}일${s.sell === 15 && s.buy === 15 ? ' (S0)' : ''}`
}

type SortKey = 'start' | 'final' | 'min' | 'trades' | 'whip'

function DataViewerContent() {
  const searchParams = useSearchParams()
  const initMode = searchParams.get('mode') ?? 'v2_same'
  const initM = searchParams.get('m') ?? 'S15B15'

  const [data, setData] = useState<AsymDetail | null>(null)
  const [mode, setMode] = useState(MODES.some(m => m.key === initMode) ? initMode : 'v2_same')
  const [selected, setSelected] = useState(initM)
  const [sortKey, setSortKey] = useState<SortKey>('start')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    fetch('/data/withdrawal_asym_detail.json')
      .then(r => r.json())
      .then(setData)
  }, [])

  const block = data?.modes[mode]
  const summary = useMemo(() => block?.summary.find(s => s.key === selected), [block, selected])
  const base = useMemo(() => block?.summary.find(s => s.key === 'S15B15'), [block])

  const rows = useMemo(() => {
    if (!block || !block.cohorts[selected]) return []
    const list = block.starts.map((start, i) => ({
      start,
      r: block.cohorts[selected][i],
      s0: block.cohorts['S15B15'][i],
    }))
    const val = (x: typeof list[number]) =>
      sortKey === 'final' ? x.r[0] : sortKey === 'min' ? x.r[5] : sortKey === 'trades' ? x.r[6] : x.r[7]
    return list.sort((a, b) => {
      if (sortKey === 'start') return sortAsc ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start)
      return sortAsc ? val(a) - val(b) : val(b) - val(a)
    })
  }, [block, selected, sortKey, sortAsc])

  const worstStart = useMemo(() => {
    if (!rows.length) return null
    return rows.reduce((w, x) => (x.r[0] < w.r[0] ? x : w)).start
  }, [rows])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(key === 'start') }
  }
  const sortIcon = (key: SortKey) => (sortKey !== key ? ' ↕' : sortAsc ? ' ↑' : ' ↓')

  if (!data || !block) return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">데이터 로딩 중…</p>
    </div>
  )

  const thSort = 'py-2 px-2 text-right text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none whitespace-nowrap'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">

        <div className="mb-2">
          <Link href="/posts/withdrawal-asym-days" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
            ← 포스트로 돌아가기
          </Link>
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">데이터 뷰어: 매도·매수 기준일 조합</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
          {block.starts.length}개 진입 시점 · {data.meta.sim_years}년 시뮬레이션 · 시작 자산 10억 · 생성: {data.meta.generated}
        </p>

        {/* 조건 선택 */}
        <div className="flex gap-2 flex-wrap mb-3">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                mode === m.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 조합 선택 */}
        <div className="flex gap-2 flex-wrap mb-6">
          {block.summary.map(s => (
            <button
              key={s.key}
              onClick={() => setSelected(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selected === s.key
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-transparent'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              {s.sell}/{s.buy}{s.key === 'S15B15' ? ' S0' : ''}
              <span className="ml-1.5 opacity-60">{s.med.toFixed(0)}억</span>
            </button>
          ))}
        </div>

        {/* 요약 카드 */}
        {summary && base && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-500/10 px-5 py-4 mb-6 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-3">{stratLabel(summary)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                ['20년 후 중앙값', `${summary.med.toFixed(0)}억`, `S0 ${base.med.toFixed(0)}억`],
                ['하위 10%', `${summary.p10.toFixed(1)}억`, `S0 ${base.p10.toFixed(1)}억`],
                ['최악 진입 시점', `${summary.worst.toFixed(1)}억`, `S0 ${base.worst.toFixed(1)}억`],
                ['평균 총 인출', `${summary.wd.toFixed(1)}억`, `S0 ${base.wd.toFixed(1)}억`],
                ['최저 자산 (중앙값)', `${summary.min_med.toFixed(1)}억`, `S0 ${base.min_med.toFixed(1)}억`],
                ['5억 아래로 떨어진 비율', `${summary.below5.toFixed(0)}%`, `S0 ${base.below5.toFixed(0)}%`],
                ['3억 아래로 떨어진 비율', `${summary.below3.toFixed(0)}%`, `S0 ${base.below3.toFixed(0)}%`],
                ['최저 자산 (최악)', `${summary.min_worst.toFixed(2)}억`, `S0 ${base.min_worst.toFixed(2)}억`],
                ['20년 매매 횟수', `${summary.trades.toFixed(1)}회`, `S0 ${base.trades.toFixed(1)}회`],
                ['산 지 3개월 안에 매도', `평균 ${summary.whip_avg.toFixed(1)}회`, `최대 ${summary.whip_max}회`],
                ['판 가격보다 비싸게 재매수', `평균 ${summary.regret_avg.toFixed(1)}회`, `S0 ${base.regret_avg.toFixed(1)}회`],
                ['가장 적었던 월 생활비', `${summary.live_lo_worst.toFixed(0)}만원`, `S0 ${base.live_lo_worst.toFixed(0)}만원`],
              ].map(([k, v, sub]) => (
                <div key={k}>
                  <p className="opacity-60 mb-0.5">{k}</p>
                  <p className="font-bold text-base">{v}</p>
                  <p className="opacity-50">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
          최저 자산이 5억 아래인 행은 노란색, 20년 후 자산이 가장 적은 행은 빨간색으로 표시. 괄호는 같은 진입 시점의 S0 값.
        </p>

        {/* 진입 시점별 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th
                  className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                  onClick={() => toggleSort('start')}
                >
                  진입 시점{sortIcon('start')}
                </th>
                <th className={thSort} onClick={() => toggleSort('final')}>20년 후 자산{sortIcon('final')}</th>
                <th className={thSort} onClick={() => toggleSort('min')}>최저 자산{sortIcon('min')}</th>
                <th className="py-2 px-2 text-right text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">최저 월 생활비</th>
                <th className={thSort} onClick={() => toggleSort('trades')}>매매{sortIcon('trades')}</th>
                <th className={thSort} onClick={() => toggleSort('whip')}>3개월 내 재매도{sortIcon('whip')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map(({ start, r, s0 }) => {
                const isWorst = start === worstStart
                const lowMin = r[5] < 5
                return (
                  <tr
                    key={start}
                    className={`transition-colors ${
                      isWorst
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : lowMin
                          ? 'bg-yellow-50/70 dark:bg-yellow-500/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <td className="py-1.5 px-2 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {start}
                      {isWorst && <span className="ml-1.5 text-xs text-red-500 dark:text-red-400">최악</span>}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {r[0].toFixed(1)}억
                      {selected !== 'S15B15' && <span className="ml-1 text-xs font-normal text-gray-400">({s0[0].toFixed(0)})</span>}
                    </td>
                    <td className={`py-1.5 px-2 text-right font-mono whitespace-nowrap ${lowMin ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {r[5].toFixed(2)}억
                      {selected !== 'S15B15' && <span className="ml-1 text-xs font-normal text-gray-400">({s0[5].toFixed(1)})</span>}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{r[4]}만원</td>
                    <td className="py-1.5 px-2 text-right font-mono text-gray-500 dark:text-gray-400 text-xs">{r[6]}회</td>
                    <td className="py-1.5 px-2 text-right font-mono text-gray-500 dark:text-gray-400 text-xs">{r[7]}회</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  )
}

export default function WithdrawalAsymDaysDataPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">로딩 중…</p>
      </div>
    }>
      <DataViewerContent />
    </Suspense>
  )
}
