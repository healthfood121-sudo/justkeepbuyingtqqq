'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Header from '@/components/Header'
import { runCohortDetail } from '@/lib/backtest'
import type { CohortDetail } from '@/lib/backtest'
import type { Instrument } from '@/lib/types'
import { costLabel } from '@/lib/costText'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

// ─── 상수 ────────────────────────────────────────────────────

const PRESET = { daily: 200_000, cap: 250_000_000, lump: 250_000_000, target: 1_000_000_000 }

const INST_LABELS: Record<string, string> = {
  ndx3x: 'TQQQ (NDX 3x)',
  ndx2x: 'QLD (NDX 2x)',
  ndx1x: '나스닥100 (NDX 1x)',
  sp500:  'VOO (S&P500)',
}

const S_COLORS = { A: '#10b981', B: '#f59e0b', C: '#3b82f6' }
const S_LABEL  = { A: 'A전략 (계속 적립)', B: 'B전략 (매입한도)', C: 'C전략 (5년 분할)' }

// ─── 유틸 ────────────────────────────────────────────────────

// 테이블용: 원 단위 전체 표시
function fmtKrw(v: number) {
  return `${Math.round(v).toLocaleString()}원`
}


function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtElapsed(days: number) {
  const y = Math.floor(days / 365)
  const m = Math.floor((days % 365) / 30)
  if (y === 0) return `${m}개월`
  if (m === 0) return `${y}년`
  return `${y}년 ${m}개월`
}

// ─── 내용 컴포넌트 ────────────────────────────────────────────

function CohortDetailContent() {
  const params   = useSearchParams()
  const startYm  = params.get('start') ?? '1971-02'
  const inst     = (params.get('inst') ?? 'ndx3x') as Instrument
  const initM    = (params.get('m') ?? 'A') as 'A' | 'B' | 'C'

  const [activeM,    setActiveM]    = useState<'A' | 'B' | 'C'>(initM)
  const [vis,        setVis]        = useState<Record<'A'|'B'|'C', boolean>>({ A: true, B: true, C: true })
  const [details,    setDetails]    = useState<Record<'A'|'B'|'C', CohortDetail> | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [ytUrl,      setYtUrl]      = useState<string | null>(null)
  const [withCosts,  setWithCosts]  = useState(true)

  useEffect(() => {
    setLoading(true)
    setDetails(null)

    import('@/lib/dataLoader').then(({ loadNdx, loadSp500 }) => {
      const loader = inst === 'sp500' ? loadSp500() : loadNdx()
      loader.then(data => {
        let prices: Float64Array
        if (inst === 'sp500') {
          prices = data.lev1
        } else if (withCosts) {
          if (inst === 'ndx1x')      prices = data.lev1c
          else if (inst === 'ndx2x') prices = data.lev2c
          else                       prices = data.lev3c
        } else {
          if (inst === 'ndx1x')      prices = data.lev1
          else if (inst === 'ndx2x') prices = data.lev2
          else                       prices = data.lev3
        }

        const { dates } = data
        const target = new Date(startYm + '-01').getTime()
        let startIdx = 0
        for (let i = 0; i < dates.length; i++) {
          if (dates[i].getTime() >= target) { startIdx = i; break }
        }

        const run = (s: 'A' | 'B' | 'C') =>
          runCohortDetail(prices, dates, startIdx, s, PRESET.daily, PRESET.cap, PRESET.lump, PRESET.target)

        setDetails({ A: run('A'), B: run('B'), C: run('C') })
        setLoading(false)
      })
    })

    fetch('/data/youtube_shorts.json')
      .then(r => r.json())
      .then((d: Record<string, string>) => setYtUrl(d[startYm] ?? null))
      .catch(() => {})
  }, [startYm, inst, withCosts])

  // ── 차트 데이터 ─────────────────────────────────────────────

  const chartData = (() => {
    if (!details) return null
    const ref = (['A', 'B', 'C'] as const).reduce((m, s) =>
      details[s].snapshots.length > details[m].snapshots.length ? s : m, 'A' as const)
    const refSnaps = details[ref].snapshots
    const startDate = details.A.startDate

    const labels = refSnaps.map((snap, i) => {
      const days = (snap.date.getTime() - startDate.getTime()) / 86400000
      const year = Math.floor(days / 365.25)
      if (i === 0) return '0년'
      const prevDays = (refSnaps[i-1].date.getTime() - startDate.getTime()) / 86400000
      return Math.floor(prevDays / 365.25) !== year ? `${year}년` : ''
    })

    const datasets = (['A', 'B', 'C'] as const)
      .filter(s => vis[s])
      .map(s => ({
        label: S_LABEL[s],
        data: details[s].snapshots.map(p => p.value / 1e8),
        borderColor: S_COLORS[s],
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
      }))

    const refS = (['A', 'B', 'C'] as const).find(s => vis[s])
    if (refS) {
      datasets.push({
        label: '누적 투자금',
        data: details[refS].snapshots.map(p => p.cumInvest / 1e8),
        borderColor: '#d1d5db',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.1,
      } as any)
    }

    return { labels, datasets }
  })()

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: { ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 0 }, grid: { color: '#f3f4f6' } },
      y: {
        title: { display: true, text: '억원', color: '#9ca3af', font: { size: 11 } },
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { color: '#f3f4f6' },
      },
    },
    plugins: {
      legend: { labels: { color: '#6b7280', font: { size: 11 }, usePointStyle: true } },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            if (!details) return ''
            const idx = items[0]?.dataIndex ?? 0
            const snap = details.A.snapshots[idx] ?? details.B.snapshots[idx] ?? details.C.snapshots[idx]
            if (!snap) return ''
            const d = snap.date
            const days = Math.round((d.getTime() - details.A.startDate.getTime()) / 86400000)
            return `${fmtDate(d)} (${(days/365.25).toFixed(1)}년차)`
          },
          label: (ctx: any) => {
            if (ctx.dataset.label?.includes('누적')) return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억`
            const s = (['A','B','C'] as const).find(k => S_LABEL[k] === ctx.dataset.label)
            const det = s ? details?.[s] : null
            const snap = det?.snapshots[ctx.dataIndex]
            if (!snap) return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억`
            const ret = snap.cumInvest > 0 ? (snap.value - snap.cumInvest) / snap.cumInvest * 100 : 0
            return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억 (투자 ${(snap.cumInvest/1e8).toFixed(2)}억 · ${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%)`
          },
        },
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        titleColor: '#374151',
        bodyColor: '#374151',
        padding: 10,
      },
    },
  }

  const detail = details?.[activeM]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* 브레드크럼 */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <Link href="/" className="hover:text-blue-500">홈</Link>
          <span>/</span>
          <span className="text-gray-600 dark:text-gray-300">
            {startYm} 진입 · {INST_LABELS[inst] ?? inst}
          </span>
        </div>

        {/* 제목 + 유튜브 버튼 */}
        <div className="flex items-start justify-between mb-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {startYm} 진입 시점 상세
          </h1>
          {ytUrl && (
            <a
              href={ytUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            >
              유튜브 쇼츠 보기
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {INST_LABELS[inst]} · 일 {(PRESET.daily / 1e4).toLocaleString()}만원 적립 · 목표 {PRESET.target / 1e8}억원
          </p>
        </div>
        <div className="flex items-center gap-3 mb-4">
          {/* 비용 세그먼트 버튼 */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setWithCosts(false)}
              className={`px-3 py-1.5 transition-colors ${!withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              운용보수만
            </button>
            <button
              onClick={() => setWithCosts(true)}
              className={`px-3 py-1.5 transition-colors ${withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              + 스왑금리
            </button>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {costLabel(inst, withCosts)}
          </span>
        </div>
        {loading && (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            데이터 계산 중…
          </div>
        )}

        {!loading && details && (
          <>
            {/* 전략 요약 카드 3개 */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(['A', 'B', 'C'] as const).map(s => {
                const d = details[s]
                const on = vis[s]
                const fmtY = (y: number | null) => y == null ? '진행중' : `${y.toFixed(1)}년`
                return (
                  <button
                    key={s}
                    onClick={() => { setVis(v => ({ ...v, [s]: !v[s] })); setActiveM(s) }}
                    className={`rounded-xl border px-3 py-3 text-left transition-opacity cursor-pointer select-none ${on ? 'opacity-100' : 'opacity-40'}`}
                    style={{ borderColor: S_COLORS[s] + '60', backgroundColor: S_COLORS[s] + '10' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold" style={{ color: S_COLORS[s] }}>{S_LABEL[s]}</p>
                      {!on && <span className="text-xs text-gray-400">숨김</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">소요기간</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtY(d.yearsToTarget)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">총 투자금</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtKrw(d.accumulatedInvestment)}</p>
                    {d.endDate && (
                      <>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">달성일</p>
                        <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{fmtDate(d.endDate).slice(0,7)}</p>
                      </>
                    )}
                  </button>
                )
              })}
            </div>

            {/* 10억 달성 → 인출 시뮬레이터로 이어보기 */}
            {(['A', 'C'] as const).some(s => details[s].endDate) && (
              <div className="flex flex-wrap gap-2 mb-5 text-xs">
                {(['A', 'C'] as const).filter(s => details[s].endDate).map(s => {
                  const d = details[s]
                  const amt = (d.finalValue ?? 0) / 1e8
                  const href = `/simulator/withdrawal?start=${fmtDate(d.endDate!)}&amt=${amt.toFixed(2)}&cmp=S0${withCosts ? '' : '&fee=1'}`
                  return (
                    <Link key={s} href={href}
                      className="px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-700/40 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:border-purple-400">
                      {S_LABEL[s]} {fmtDate(d.endDate!).slice(0, 7)} 달성({amt.toFixed(1)}억) → 이때부터 인출 보기
                    </Link>
                  )
                })}
              </div>
            )}

            {/* 차트 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-6">
              <div style={{ height: 320 }}>
                {chartData && <Line data={chartData} options={chartOptions} />}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
                회색 점선: 누적 투자금 · 목표 달성 시 해당 전략 선 종료
              </p>
            </div>

            {/* 전략 탭 (일별 테이블용) */}
            <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
              {(['A', 'B', 'C'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveM(s)}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeM === s
                      ? 'border-current'
                      : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  style={activeM === s ? { color: S_COLORS[s], borderColor: S_COLORS[s] } : {}}
                >
                  {S_LABEL[s]}
                </button>
              ))}
            </div>

            {/* 일별 데이터 테이블 */}
            {detail && (
              <>
                <div className="text-xs text-gray-400 mb-2">
                  총 {detail.snapshots.length.toLocaleString()}거래일 · 스크롤해서 전체 확인
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="overflow-auto max-h-[70vh]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-2.5 px-3 text-left text-gray-500 font-medium">#</th>
                          <th className="py-2.5 px-3 text-left text-gray-500 font-medium whitespace-nowrap">날짜</th>
                          <th className="py-2.5 px-3 text-left text-gray-500 font-medium whitespace-nowrap">경과</th>
                          <th className="py-2.5 px-3 text-right text-gray-500 font-medium whitespace-nowrap">누적 투자금</th>
                          <th className="py-2.5 px-3 text-right text-gray-500 font-medium whitespace-nowrap">평가금액</th>
                          <th className="py-2.5 px-3 text-right text-gray-500 font-medium whitespace-nowrap">평가손익</th>
                          <th className="py-2.5 px-3 text-right text-gray-500 font-medium whitespace-nowrap">수익률</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {detail.snapshots.map((snap, i) => {
                          const pnl    = snap.value - snap.cumInvest
                          const pct    = snap.cumInvest > 0 ? pnl / snap.cumInvest * 100 : 0
                          const isPos  = pnl >= 0
                          const color  = isPos ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                          const elapsed = Math.round((snap.date.getTime() - detail.startDate.getTime()) / 86400000)
                          const isLast = detail.status === 'completed' && i === detail.snapshots.length - 1
                          return (
                            <tr
                              key={i}
                              className={isLast ? 'bg-yellow-50 dark:bg-yellow-900/10 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'}
                            >
                              <td className="py-1.5 px-3 text-gray-300 dark:text-gray-600 tabular-nums">{i + 1}</td>
                              <td className="py-1.5 px-3 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">{fmtDate(snap.date)}</td>
                              <td className="py-1.5 px-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">{fmtElapsed(elapsed)}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap tabular-nums">{fmtKrw(snap.cumInvest)}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-gray-800 dark:text-gray-200 whitespace-nowrap tabular-nums">{fmtKrw(snap.value)}</td>
                              <td className={`py-1.5 px-3 text-right font-mono whitespace-nowrap tabular-nums ${color}`}>
                                {isPos ? '+' : ''}{fmtKrw(pnl)}
                              </td>
                              <td className={`py-1.5 px-3 text-right font-mono whitespace-nowrap tabular-nums ${color}`}>
                                {isPos ? '+' : ''}{pct.toFixed(2)}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  빨강 = 수익, 파랑 = 손실 · 마지막 행(노란 강조) = 목표 달성일
                </p>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// ─── 페이지 래퍼 ──────────────────────────────────────────────

export default function CohortDetailPage() {
  return (
    <Suspense>
      <CohortDetailContent />
    </Suspense>
  )
}
