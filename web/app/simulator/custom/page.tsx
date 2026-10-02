'use client'

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react'
import type { CohortResult, Instrument } from '@/lib/types'
import type { PriceData } from '@/lib/dataLoader'
import { runBacktest, runCohortDetail, summarize } from '@/lib/backtest'
import type { CohortDetail } from '@/lib/backtest'
import ScatterPlot from '@/components/charts/ScatterPlot'
import DistributionChart from '@/components/charts/DistributionChart'
import CdfChart from '@/components/charts/CdfChart'
import StrategySummaryRow from '@/components/StrategySummaryRow'
import Header from '@/components/Header'
import CohortModal from '@/components/simulator/CohortModal'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// ─── 타입 ────────────────────────────────────────────────────

interface CohortRow {
  s: string
  sA: string; yA: number | null; eA: string | null; iA: number | null
  sB: string; yB: number | null; eB: string | null; iB: number | null
  sC: string; yC: number | null; eC: string | null; iC: number | null
}

// ─── 유틸 ────────────────────────────────────────────────────

function toTableRows(
  rA: CohortResult[],
  rB: CohortResult[],
  rC: CohortResult[]
): CohortRow[] {
  const fmtDate = (d: Date | null) => d ? d.toISOString().slice(0, 10) : null
  const sts = (r: CohortResult) => r.status === 'completed' ? 'completed' : 'ongoing'
  return rA.map((a, i) => {
    const b = rB[i], c = rC[i]
    return {
      s: a.startDate.toISOString().slice(0, 10),
      sA: sts(a), yA: a.yearsToTarget, eA: fmtDate(a.endDate),
      iA: a.accumulatedInvestment ? Math.round(a.accumulatedInvestment) : null,
      sB: sts(b), yB: b.yearsToTarget, eB: fmtDate(b.endDate),
      iB: b.accumulatedInvestment ? Math.round(b.accumulatedInvestment) : null,
      sC: sts(c), yC: c.yearsToTarget, eC: fmtDate(c.endDate),
      iC: c.accumulatedInvestment ? Math.round(c.accumulatedInvestment) : null,
    }
  })
}

// ─── 입력 컴포넌트 ────────────────────────────────────────────

function NumInput({ label, value, onChange, min, step, hint, sublabel }: {
  label: string
  sublabel?: string
  value: number
  onChange: (v: number) => void
  min?: number
  step?: number
  hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-0.5">{label}</label>
      {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{sublabel}</p>}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min} step={step}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
        />
        <span className="text-gray-400 text-xs whitespace-nowrap">원</span>
      </div>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
    </div>
  )
}

// ─── 상수 ────────────────────────────────────────────────────

const instrumentOptions: { value: Instrument; label: string; sublabel: string }[] = [
  { value: 'ndx3x', label: 'TQQQ (NDX 3x)', sublabel: '나스닥100 3배 레버리지' },
  { value: 'ndx2x', label: 'QLD (NDX 2x)', sublabel: '나스닥100 2배 레버리지' },
  { value: 'ndx1x', label: 'QQQ (NDX 1x)', sublabel: '나스닥100 1배' },
  { value: 'sp500', label: 'VOO (S&P500)', sublabel: 'S&P500 1배' },
]

// ─── 메인 ────────────────────────────────────────────────────

function CustomSimulatorInner() {
  const searchParams = useSearchParams()

  const [priceData, setPriceData] = useState<{ ndx: PriceData; sp5: PriceData } | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [instrument, setInstrument]   = useState<Instrument>('ndx3x')
  const [dailyInvest, setDailyInvest] = useState(() => Number(searchParams.get('daily'))  || 200_000)
  const [capInvest,   setCapInvest]   = useState(() => Number(searchParams.get('cap'))    || 250_000_000)
  const [lumpSum,     setLumpSum]     = useState(() => Number(searchParams.get('lump'))   || 250_000_000)
  const [targetAmount,setTargetAmount]= useState(() => Number(searchParams.get('target')) || 1_000_000_000)

  const [results, setResults] = useState<{ A: CohortResult[]; B: CohortResult[]; C: CohortResult[] } | null>(null)
  const [show, setShow] = useState<Record<'A' | 'B' | 'C', boolean>>({ A: true, B: true, C: true })
  const [activeChart, setActiveChart] = useState<'scatter' | 'dist' | 'cdf' | 'table'>('scatter')
  const [tableSort, setTableSort] = useState<{ col: 'start' | 'yA' | 'yB' | 'yC'; dir: 1 | -1 }>({ col: 'start', dir: 1 })
  const [modalDetail, setModalDetail] = useState<{ A: CohortDetail; B: CohortDetail; C: CohortDetail } | null>(null)

  const toggleShow = (s: 'A' | 'B' | 'C') =>
    setShow(prev => ({ ...prev, [s]: !prev[s] }))

  // 가격 데이터 로드
  useEffect(() => {
    import('@/lib/dataLoader').then(({ loadNdx, loadSp500 }) =>
      Promise.all([loadNdx(), loadSp500()]).then(([ndx, sp5]) => {
        setPriceData({ ndx, sp5 })
        setDataLoading(false)
      })
    )
  }, [])

  // 백테스트 실행
  const runSim = useCallback(() => {
    if (!priceData) return
    const data = instrument === 'sp500' ? priceData.sp5 : priceData.ndx
    startTransition(() => {
      const res = runBacktest(data, {
        instrument, strategy: 'A',
        dailyInvest, capInvest, lumpSum, targetAmount,
      })
      setResults({ A: res.A, B: res.B, C: res.C })
    })
  }, [priceData, instrument, dailyInvest, capInvest, lumpSum, targetAmount])

  // 코호트 상세 모달
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
      runCohortDetail(prices, dates, startIdx, s, dailyInvest, capInvest, lumpSum, targetAmount)
    setModalDetail({ A: detail('A'), B: detail('B'), C: detail('C') })
  }, [priceData, instrument, dailyInvest, capInvest, lumpSum, targetAmount])

  const summaries = results ? {
    A: summarize(results.A, 'A'),
    B: summarize(results.B, 'B'),
    C: summarize(results.C, 'C'),
  } : null

  const tableRows = results ? toTableRows(results.A, results.B, results.C) : null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="simulator" />

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* ===== 왼쪽 패널 ===== */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">

          {/* 뒤로가기 */}
          <Link
            href="/simulator"
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← 기본 설정 결과 보기
          </Link>

          {/* 설정 패널 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">직접 설정</h2>

            {/* 종목 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">종목</label>
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

            {/* 수치 입력 */}
            <NumInput
              label="일 투자액"
              value={dailyInvest}
              onChange={setDailyInvest}
              min={10000} step={10000}
              hint={`월 ${(dailyInvest * 21 / 10000).toFixed(0)}만원 상당`}
            />
            <NumInput
              label="B전략 매입한도"
              sublabel="누적 투자액이 이 금액에 도달하면 매수 중단"
              value={capInvest}
              onChange={setCapInvest}
              min={0} step={10_000_000}
              hint={`${(capInvest / 1e8).toFixed(2)}억원`}
            />
            <NumInput
              label="C전략 거치금"
              sublabel="36개월에 걸쳐 균등 분할 투입할 목돈"
              value={lumpSum}
              onChange={setLumpSum}
              min={0} step={10_000_000}
              hint={`${(lumpSum / 1e8).toFixed(2)}억원 (월 ${(lumpSum / 36 / 1e4).toFixed(0)}만)`}
            />
            <NumInput
              label="목표 금액"
              value={targetAmount}
              onChange={setTargetAmount}
              min={100_000_000} step={100_000_000}
              hint={`${(targetAmount / 1e8).toFixed(0)}억원`}
            />

            <button
              onClick={runSim}
              disabled={dataLoading || isPending}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-white font-semibold transition-colors"
            >
              {dataLoading ? '데이터 로딩 중...' : isPending ? '계산 중...' : '▶ 백테스트 실행'}
            </button>
          </div>

          {/* 전략 설명 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">전략 설명</h2>
            {[
              {
                s: 'A', color: 'text-emerald-600 dark:text-emerald-400',
                title: 'A전략 — 계속 적립',
                desc: `매일 ${(dailyInvest/10000).toFixed(0)}만원, 한도 없이 계속.`,
              },
              {
                s: 'B', color: 'text-yellow-500 dark:text-yellow-400',
                title: 'B전략 — 매입액 한도',
                desc: `매일 ${(dailyInvest/10000).toFixed(0)}만원 적립, 누적 ${(capInvest/1e8).toFixed(2)}억 도달 시 매수 중단.`,
              },
              {
                s: 'C', color: 'text-blue-500 dark:text-blue-400',
                title: 'C전략 — 3년 분할 거치',
                desc: `${(lumpSum/1e8).toFixed(2)}억을 36개월 균등 분할 + 매일 ${(dailyInvest/10000).toFixed(0)}만원 계속.`,
              },
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

          {!results && !isPending && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
              {dataLoading
                ? <p>가격 데이터 로딩 중...</p>
                : <><p className="text-base">파라미터를 설정하고</p><p className="text-base font-semibold text-blue-500">▶ 백테스트 실행을 누르세요</p></>
              }
            </div>
          )}

          {isPending && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              계산 중...
            </div>
          )}

          {modalDetail && (
            <CohortModal
              details={modalDetail}
              targetAmount={targetAmount}
              initialVis={show}
              onClose={() => setModalDetail(null)}
            />
          )}

          {!isPending && results && summaries && tableRows && (
            <>
              {/* 종목/조건 요약 */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30">
                  {instrumentOptions.find(o => o.value === instrument)?.label}
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  일 {(dailyInvest/10000).toFixed(0)}만원
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  B한도 {(capInvest/1e8).toFixed(2)}억
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  C거치 {(lumpSum/1e8).toFixed(2)}억
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  목표 {(targetAmount/1e8).toFixed(0)}억
                </span>
                <span className="text-gray-400 text-xs">{results.A.length}가지 경우</span>
              </div>

              {/* 전략별 요약 */}
              <StrategySummaryRow summaries={summaries} show={show} onToggle={toggleShow} />

              {/* 차트/데이터 탭 */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5">
                <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                  {([
                    { id: 'scatter', label: '산점도' },
                    { id: 'dist',    label: '분포' },
                    { id: 'cdf',     label: 'CDF' },
                    { id: 'table',   label: `데이터 (${results.A.length}개)` },
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
                    <p className="text-xs text-gray-400 mb-4">
                      X축: 투자 시작 연도 &nbsp;|&nbsp; Y축: 소요 기간(년) &nbsp;|&nbsp; 미달성은 표시 안 됨
                    </p>
                    <ScatterPlot resultsA={results.A} resultsB={results.B} resultsC={results.C} showA={show.A} showB={show.B} showC={show.C} />
                  </div>
                )}
                {activeChart === 'dist' && (
                  <div>
                    <p className="text-xs text-gray-400 mb-4">0.5년 단위 bin &nbsp;|&nbsp; 전체 경우 대비 비율(%)</p>
                    <DistributionChart resultsA={results.A} resultsB={results.B} resultsC={results.C} showA={show.A} showB={show.B} showC={show.C} />
                  </div>
                )}
                {activeChart === 'cdf' && (
                  <div>
                    <p className="text-xs text-gray-400 mb-4">N년 이내 목표 달성 누적 비율 &nbsp;|&nbsp; 50%·80% 기준선</p>
                    <CdfChart resultsA={results.A} resultsB={results.B} resultsC={results.C} showA={show.A} showB={show.B} showC={show.C} />
                  </div>
                )}
                {activeChart === 'table' && (() => {
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

                  const sorted = [...tableRows].sort((x, y) => {
                    const v = (r: CohortRow) => {
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
                      <p className="text-xs text-gray-400 mb-3">행 클릭 → 코호트 상세 보기</p>
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
                                  {activeSortCol === col && (
                                    <span className="ml-1 text-blue-500">{tableSort.dir === 1 ? '↑' : '↓'}</span>
                                  )}
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
                            {sorted.map((r) => (
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
                <p>⚠️ <strong>비용 미반영:</strong> 운용비용(TQQQ 0.88%/년)·추적오차는 미반영입니다.</p>
                <p>⚠️ <strong>과거 데이터 기반:</strong> 미래 수익을 보장하지 않으며, 닷컴버블(1999-2000)이 유일하게 관측된 극단적 사례입니다.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CustomSimulatorPage() {
  return (
    <Suspense>
      <CustomSimulatorInner />
    </Suspense>
  )
}
