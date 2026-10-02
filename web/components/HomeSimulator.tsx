'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { CohortResult, Instrument } from '@/lib/types'
import type { PriceData } from '@/lib/dataLoader'
import { runCohortDetail, summarize } from '@/lib/backtest'
import type { CohortDetail } from '@/lib/backtest'
import ScatterPlot from '@/components/charts/ScatterPlot'
import DistributionChart from '@/components/charts/DistributionChart'
import CdfChart from '@/components/charts/CdfChart'
import StrategySummaryRow from '@/components/StrategySummaryRow'
import CohortModal from '@/components/simulator/CohortModal'
import Link from 'next/link'

// ─── 타입 ────────────────────────────────────────────────────

interface CohortJsonRow {
  s: string
  sA: string; yA: number | null; eA: string | null; iA: number | null
  sB: string; yB: number | null; eB: string | null; iB: number | null
  sC: string; yC: number | null; eC: string | null; iC: number | null
}
interface CohortJsonFile {
  meta: { params: { dailyInvest: number; lumpSum: number; target: number }; total: number }
  rows: CohortJsonRow[]
}

// ─── 상수 ────────────────────────────────────────────────────

const PRESET = { daily: 200_000, cap: 250_000_000, lump: 250_000_000, target: 1_000_000_000 }

const JSON_MAP: Record<Instrument, string> = {
  ndx3x: '/data/cohorts_ndx3x_10b.json',
  ndx2x: '/data/cohorts_ndx2x_10b.json',
  ndx1x: '/data/cohorts_ndx1x_10b.json',
  sp500: '/data/cohorts_sp500_10b.json',
}

const instrumentOptions: { value: Instrument; label: string; sublabel: string }[] = [
  { value: 'ndx3x', label: 'TQQQ (NDX 3x)', sublabel: '나스닥100 3배 레버리지' },
  { value: 'ndx2x', label: 'QLD (NDX 2x)', sublabel: '나스닥100 2배 레버리지' },
  { value: 'ndx1x', label: 'QQQ (NDX 1x)', sublabel: '나스닥100 1배' },
  { value: 'sp500', label: 'VOO (S&P500)', sublabel: 'S&P500 1배' },
]

// ─── JSON → CohortResult ─────────────────────────────────────

function jsonRowsToResults(rows: CohortJsonRow[], s: 'A' | 'B' | 'C'): CohortResult[] {
  return rows.map(r => {
    const eKey = `e${s}` as 'eA' | 'eB' | 'eC'
    const sKey = `s${s}` as 'sA' | 'sB' | 'sC'
    const yKey = `y${s}` as 'yA' | 'yB' | 'yC'
    const iKey = `i${s}` as 'iA' | 'iB' | 'iC'
    return {
      startDate: new Date(r.s),
      endDate: r[eKey] ? new Date(r[eKey]!) : null,
      status: r[sKey] === 'completed' ? 'completed' as const : 'in_progress' as const,
      yearsToTarget: r[yKey] ?? null,
      daysToTarget: null,
      finalValue: 0,
      accumulatedInvestment: r[iKey] ?? 0,
    }
  })
}

// ─── 컴포넌트 ─────────────────────────────────────────────────

export default function HomeSimulator() {
  const [priceData, setPriceData] = useState<{ ndx: PriceData; sp5: PriceData } | null>(null)
  const [cohortJson, setCohortJson] = useState<CohortJsonFile | null>(null)
  const [jsonLoading, setJsonLoading] = useState(true)
  const [show, setShow] = useState<Record<'A' | 'B' | 'C', boolean>>({ A: true, B: true, C: true })
  const [activeChart, setActiveChart] = useState<'scatter' | 'dist' | 'cdf' | 'table'>('scatter')
  const [tableSort, setTableSort] = useState<{ col: 'start' | 'yA' | 'yB' | 'yC'; dir: 1 | -1 }>({ col: 'start', dir: 1 })
  const [modalDetail, setModalDetail] = useState<{ A: CohortDetail; B: CohortDetail; C: CohortDetail } | null>(null)
  const [instrument, setInstrument] = useState<Instrument>('ndx3x')

  const toggleShow = (s: 'A' | 'B' | 'C') => setShow(prev => ({ ...prev, [s]: !prev[s] }))

  useEffect(() => {
    setJsonLoading(true)
    setCohortJson(null)
    fetch(JSON_MAP[instrument])
      .then(r => r.json())
      .then((data: CohortJsonFile) => { setCohortJson(data); setJsonLoading(false) })
      .catch(() => setJsonLoading(false))
  }, [instrument])

  useEffect(() => {
    import('@/lib/dataLoader').then(({ loadNdx, loadSp500 }) =>
      Promise.all([loadNdx(), loadSp500()]).then(([ndx, sp5]) => setPriceData({ ndx, sp5 }))
    )
  }, [])

  const results = useMemo(() => {
    if (!cohortJson) return null
    return {
      A: jsonRowsToResults(cohortJson.rows, 'A'),
      B: jsonRowsToResults(cohortJson.rows, 'B'),
      C: jsonRowsToResults(cohortJson.rows, 'C'),
    }
  }, [cohortJson])

  const summaries = results ? {
    A: summarize(results.A, 'A'),
    B: summarize(results.B, 'B'),
    C: summarize(results.C, 'C'),
  } : null

  const openCohortDetail = useCallback((startDateStr: string) => {
    if (!priceData) return
    const data = instrument === 'sp500' ? priceData.sp5 : priceData.ndx
    const { dates } = data
    let prices: PriceData['lev1']
    if (instrument === 'ndx1x') prices = data.lev1
    else if (instrument === 'ndx2x') prices = data.lev2
    else if (instrument === 'ndx3x') prices = data.lev3
    else prices = data.lev1

    const target = new Date(startDateStr).getTime()
    let startIdx = 0
    for (let i = 0; i < dates.length; i++) {
      if (dates[i].getTime() >= target) { startIdx = i; break }
    }
    const detail = (s: 'A' | 'B' | 'C') =>
      runCohortDetail(prices, dates, startIdx, s, PRESET.daily, PRESET.cap, PRESET.lump, PRESET.target)
    setModalDetail({ A: detail('A'), B: detail('B'), C: detail('C') })
  }, [priceData, instrument])

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-6">

      {/* ===== 왼쪽 패널 ===== */}
      <div className="w-full lg:w-72 shrink-0 space-y-4">

        {/* 내 설정 + CTA */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">내 투자 설정</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <span className="text-gray-400 dark:text-gray-500">일 투자액</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">20만원</span>
              <span className="text-gray-400 dark:text-gray-500">B전략 매입한도</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">2.5억</span>
              <span className="text-gray-400 dark:text-gray-500">C전략 거치금</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">2.5억</span>
              <span className="text-gray-400 dark:text-gray-500">목표 금액</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">10억</span>
            </div>
          </div>
          <Link
            href="/simulator/custom"
            className="flex items-center justify-center gap-1 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            내 상황에 맞게 해보기 →
          </Link>
        </div>

        {/* 종목 선택 */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">종목</h3>
          <div className="space-y-1.5">
            {instrumentOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setInstrument(opt.value)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  instrument === opt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-gray-900 dark:text-white'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-gray-400">{opt.sublabel}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 전략 설명 */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">전략 설명</h3>
          {[
            { s: 'A', color: 'text-emerald-600 dark:text-emerald-400', title: 'A전략 — 계속 적립', desc: '한도 없이 매일 20만원 계속.' },
            { s: 'B', color: 'text-yellow-500 dark:text-yellow-400', title: 'B전략 — 매입액 한도', desc: '매일 20만원, 누적 2.5억 도달 시 중단 후 보유.' },
            { s: 'C', color: 'text-blue-500 dark:text-blue-400', title: 'C전략 — 3년 분할 거치', desc: '2.5억을 36개월 균등 분할 + 매일 20만원 계속.' },
          ].map(({ s, color, title, desc }) => (
            <div key={s} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
              <p className={`text-xs font-semibold ${color}`}>{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 오른쪽: 결과 패널 ===== */}
      <div className="flex-1 space-y-5">
        {jsonLoading && (
          <div className="flex items-center justify-center h-64 text-gray-400">데이터 로딩 중...</div>
        )}

        {modalDetail && (
          <CohortModal
            details={modalDetail}
            targetAmount={PRESET.target}
            initialVis={show}
            onClose={() => setModalDetail(null)}
          />
        )}

        {!jsonLoading && results && summaries && (
          <>
            {/* 종목/조건 배지 */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30">
                {instrumentOptions.find(o => o.value === instrument)?.label}
              </span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">일 20만원</span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">B한도 2.5억 · C거치 2.5억</span>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">목표 10억</span>
              <span className="text-gray-400 text-xs">{results.A.length}가지 경우</span>
            </div>

            <StrategySummaryRow summaries={summaries} show={show} onToggle={toggleShow} />

            {/* 차트/데이터 탭 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
              <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                {([
                  { id: 'scatter', label: '산점도' },
                  { id: 'dist',    label: '분포' },
                  { id: 'cdf',     label: 'CDF' },
                  { id: 'table',   label: `데이터 (${cohortJson?.meta.total ?? results.A.length}개)` },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveChart(id)}
                    className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                      activeChart === id
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeChart === 'scatter' && (
                <div>
                  <p className="text-xs text-gray-400 mb-4">X축: 투자 시작 연도 | Y축: 목표 달성까지 소요 기간(년) | 미달성은 표시 안 됨</p>
                  <ScatterPlot resultsA={results.A} resultsB={results.B} resultsC={results.C} showA={show.A} showB={show.B} showC={show.C} />
                </div>
              )}
              {activeChart === 'dist' && (
                <div>
                  <p className="text-xs text-gray-400 mb-4">0.5년 단위 bin | 전체 경우 대비 비율(%)</p>
                  <DistributionChart resultsA={results.A} resultsB={results.B} resultsC={results.C} showA={show.A} showB={show.B} showC={show.C} />
                </div>
              )}
              {activeChart === 'cdf' && (
                <div>
                  <p className="text-xs text-gray-400 mb-4">N년 이내 목표 달성 누적 비율 | 50%·80% 기준선 표시</p>
                  <CdfChart resultsA={results.A} resultsB={results.B} resultsC={results.C} showA={show.A} showB={show.B} showC={show.C} />
                </div>
              )}
              {activeChart === 'table' && (() => {
                const rows = cohortJson!.rows
                const fmtY = (y: number | null) =>
                  y == null ? <span className="text-gray-300 dark:text-gray-600">진행중</span> : <span>{y.toFixed(2)}년</span>
                const fmtInv = (n: number | null) =>
                  n == null ? '—' : n >= 1e8 ? `${(n/1e8).toFixed(1)}억` : `${Math.round(n/1e4).toLocaleString()}만`
                const fmtD = (s: string | null) =>
                  s ? <span>{s.slice(0, 7)}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>

                const activeSortCol: typeof tableSort.col =
                  (tableSort.col === 'yA' && !show.A) ||
                  (tableSort.col === 'yB' && !show.B) ||
                  (tableSort.col === 'yC' && !show.C)
                    ? 'start' : tableSort.col

                const sortableCols: { col: typeof tableSort.col; label: string }[] = [
                  { col: 'start', label: '시작일' },
                  ...(show.A ? [{ col: 'yA' as const, label: 'A 종료일' }] : []),
                  ...(show.B ? [{ col: 'yB' as const, label: 'B 종료일' }] : []),
                  ...(show.C ? [{ col: 'yC' as const, label: 'C 종료일' }] : []),
                ]

                const sorted = [...rows].sort((x, y) => {
                  const v = (r: CohortJsonRow) => {
                    if (activeSortCol === 'start') return r.s
                    if (activeSortCol === 'yA') return r.yA ?? 9999
                    if (activeSortCol === 'yB') return r.yB ?? 9999
                    return r.yC ?? 9999
                  }
                  const a = v(x), b = v(y)
                  return (a < b ? -1 : a > b ? 1 : 0) * tableSort.dir
                })

                const toggleSort = (col: typeof tableSort.col) =>
                  setTableSort(s => ({ col, dir: s.col === col ? (-s.dir as 1 | -1) : 1 }))

                return (
                  <div>
                    <p className="text-xs text-gray-400 mb-3">
                      행 클릭 → 코호트 상세 보기
                      {!priceData && <span className="ml-2 text-gray-300">(가격 데이터 로딩 중…)</span>}
                    </p>
                    <div className="overflow-auto max-h-[500px]">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            {sortableCols.map(({ col, label }) => (
                              <th
                                key={col}
                                onClick={() => toggleSort(col)}
                                className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-900 dark:hover:text-white select-none whitespace-nowrap"
                              >
                                {label}
                                {activeSortCol === col && <span className="ml-1 text-blue-500">{tableSort.dir === 1 ? '↑' : '↓'}</span>}
                              </th>
                            ))}
                            {show.A && <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">A 소요</th>}
                            {show.B && <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">B 소요</th>}
                            {show.C && <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">C 소요</th>}
                            {show.A && <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">A 투입금</th>}
                            {show.B && <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">B 투입금</th>}
                            {show.C && <th className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">C 투입금</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {sorted.map(r => (
                            <tr
                              key={r.s}
                              onClick={() => openCohortDetail(r.s)}
                              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                            >
                              <td className="py-2 px-3 text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap underline underline-offset-2">{r.s.slice(0,7)}</td>
                              {show.A && <td className={`py-2 px-3 font-mono whitespace-nowrap ${r.sA === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'}`}>{fmtD(r.eA)}</td>}
                              {show.B && <td className={`py-2 px-3 font-mono whitespace-nowrap ${r.sB === 'completed' ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>{fmtD(r.eB)}</td>}
                              {show.C && <td className={`py-2 px-3 font-mono whitespace-nowrap ${r.sC === 'completed' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}`}>{fmtD(r.eC)}</td>}
                              {show.A && <td className={`py-2 px-3 font-mono ${r.sA === 'completed' ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-gray-300 dark:text-gray-600'}`}>{fmtY(r.yA)}</td>}
                              {show.B && <td className={`py-2 px-3 font-mono ${r.sB === 'completed' ? 'text-yellow-500/70 dark:text-yellow-400/70' : 'text-gray-300 dark:text-gray-600'}`}>{fmtY(r.yB)}</td>}
                              {show.C && <td className={`py-2 px-3 font-mono ${r.sC === 'completed' ? 'text-blue-500/70 dark:text-blue-400/70' : 'text-gray-300 dark:text-gray-600'}`}>{fmtY(r.yC)}</td>}
                              {show.A && <td className="py-2 px-3 text-gray-400 font-mono">{fmtInv(r.iA)}</td>}
                              {show.B && <td className="py-2 px-3 text-gray-400 font-mono">{fmtInv(r.iB)}</td>}
                              {show.C && <td className="py-2 px-3 text-gray-400 font-mono">{fmtInv(r.iC)}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* 캐비엇 */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 text-xs text-yellow-800 dark:text-yellow-200/70 space-y-1">
              <p>⚠️ <strong>합성 가격 사용:</strong> TQQQ/QLD의 실제 상장 역사는 짧아, NDX 일별 수익률 × 레버리지로 합성한 이론값을 사용합니다.</p>
              <p>⚠️ <strong>비용 미반영:</strong> 운용비용(TQQQ 0.88%/년)·추적오차는 미반영입니다. 변동성 끌림은 일별 복리 계산에 자동 반영됩니다.</p>
              <p>⚠️ <strong>과거 데이터 기반:</strong> 미래 수익을 보장하지 않으며, 닷컴버블(1999-2000)이 유일하게 관측된 극단적 사례입니다.</p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
