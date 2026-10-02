'use client'

import { useState, useEffect, useCallback, useTransition, useRef, Suspense } from 'react'
import type { BacktestParams, Instrument, StrategyResults } from '@/lib/types'
import type { PriceData } from '@/lib/dataLoader'
import { runBacktest, summarize, runCohortDetail } from '@/lib/backtest'
import type { CohortDetail } from '@/lib/backtest'
import ScatterPlot from '@/components/charts/ScatterPlot'
import DistributionChart from '@/components/charts/DistributionChart'
import CdfChart from '@/components/charts/CdfChart'
import StrategySummaryRow from '@/components/StrategySummaryRow'
import Header from '@/components/Header'
import { useSearchParams } from 'next/navigation'
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

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

// JSON 코호트 데이터 타입
interface CohortJsonRow {
  s: string          // 시작일 "YYYY-MM-DD"
  sA: string; yA: number | null; eA: string | null; iA: number | null
  sB: string; yB: number | null; eB: string | null; iB: number | null
  sC: string; yC: number | null; eC: string | null; iC: number | null
}
interface CohortJsonFile {
  meta: { params: { dailyInvest: number; lumpSum: number; target: number }; total: number }
  rows: CohortJsonRow[]
}

const JSON_MAP: Record<Instrument, string> = {
  ndx3x: '/data/cohorts_ndx3x_10b.json',
  ndx2x: '/data/cohorts_ndx2x_10b.json',
  ndx1x: '/data/cohorts_ndx1x_10b.json',
  sp500:  '/data/cohorts_sp500_10b.json',
}

// ===== 파라미터 입력 컴포넌트 =====
function NumInput({ label, value, onChange, min, max, step, unit, hint }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; unit?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min} max={max} step={step}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
        />
        {unit && <span className="text-gray-400 dark:text-gray-400 text-xs whitespace-nowrap">{unit}</span>}
      </div>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// ===== 코호트 상세 모달 =====
const STRATEGY_COLORS = { A: '#10b981', B: '#f59e0b', C: '#3b82f6' }
const STRATEGY_LABELS = { A: 'A전략 (계속적립)', B: 'B전략 (매입액한도)', C: 'C전략 (3년분할)' }

function CohortModal({
  details,
  targetAmount,
  initialVis,
  onClose,
}: {
  details: { A: CohortDetail; B: CohortDetail; C: CohortDetail }
  targetAmount: number
  initialVis: Record<'A' | 'B' | 'C', boolean>
  onClose: () => void
}) {
  const [vis, setVis] = useState<Record<'A' | 'B' | 'C', boolean>>(initialVis)
  const toggleVis = (s: 'A' | 'B' | 'C') => setVis(prev => ({ ...prev, [s]: !prev[s] }))

  const startDate = details.A.startDate
  const fmt = (v: number) => v >= 1e8 ? `${(v / 1e8).toFixed(1)}억` : `${Math.round(v / 1e4).toLocaleString()}만`
  const fmtY = (y: number | null) => y == null ? '진행중' : `${y.toFixed(1)}년`

  // 가장 긴 시리즈 기준으로 레이블 생성
  const maxLen = Math.max(details.A.snapshots.length, details.B.snapshots.length, details.C.snapshots.length)
  const labels = Array.from({ length: maxLen }, (_, i) =>
    i % 12 === 0 ? `${i / 12}년` : ''
  )

  const datasets = (['A', 'B', 'C'] as const)
    .filter(s => vis[s])
    .map(s => ({
      label: STRATEGY_LABELS[s],
      data: details[s].snapshots.map(p => p.value / 1e8),
      borderColor: STRATEGY_COLORS[s],
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.1,
    }))

  // 누적 투자금 (활성화된 전략 중 첫 번째 기준)
  const refStrategy = (['A', 'B', 'C'] as const).find(s => vis[s])
  if (refStrategy) {
    datasets.push({
      label: '누적 투자금',
      data: details[refStrategy].snapshots.map(p => p.cumInvest / 1e8),
      borderColor: '#d1d5db',
      backgroundColor: 'transparent',
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.1,
    } as any)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 0 },
        grid: { color: '#f3f4f6' },
      },
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
            const idx = items[0]?.dataIndex ?? 0
            const snap = details.A.snapshots[idx]
            if (!snap) return ''
            const d = snap.date
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')} (${(idx/12).toFixed(1)}년차)`
          },
          label: (ctx: any) => {
            if (ctx.dataset.label?.includes('누적')) return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억`
            const s = (['A','B','C'] as const).find(k => STRATEGY_LABELS[k] === ctx.dataset.label)
            const detail = s ? details[s] : null
            const snap = detail?.snapshots[ctx.dataIndex]
            if (!snap) return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억`
            return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억 (투자 ${(snap.cumInvest/1e8).toFixed(2)}억)`
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              코호트 상세 — {startDate.getFullYear()}-{String(startDate.getMonth()+1).padStart(2,'0')} 시작
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">목표: {fmt(targetAmount)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-light">✕</button>
        </div>

        {/* 통계 비교 */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(['A', 'B', 'C'] as const).map(s => {
              const d = details[s]
              const on = vis[s]
              return (
                <button
                  key={s}
                  onClick={() => toggleVis(s)}
                  className={`rounded-xl border px-3 py-3 text-center text-left transition-opacity cursor-pointer select-none ${on ? 'opacity-100' : 'opacity-35'}`}
                  style={{ borderColor: STRATEGY_COLORS[s] + '60', backgroundColor: STRATEGY_COLORS[s] + '10' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: STRATEGY_COLORS[s] }}>{STRATEGY_LABELS[s]}</p>
                    {!on && <span className="text-xs text-gray-400">숨김</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">소요기간</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtY(d.yearsToTarget)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">총 투자금</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(d.accumulatedInvestment)}</p>
                  {d.endDate && (
                    <>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">달성일</p>
                      <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {d.endDate.getFullYear()}-{String(d.endDate.getMonth()+1).padStart(2,'0')}
                      </p>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* 차트 */}
          <div style={{ height: 300 }}>
            <Line data={{ labels, datasets }} options={options} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1 mb-2">
            회색 점선: 누적 투자금 · 목표 달성 시 해당 전략 선 종료
          </p>
        </div>
      </div>
    </div>
  )
}

const instrumentOptions: { value: Instrument; label: string; sublabel: string }[] = [
  { value: 'ndx3x', label: 'TQQQ (NDX 3x)', sublabel: '나스닥100 3배 레버리지' },
  { value: 'ndx2x', label: 'QLD (NDX 2x)', sublabel: '나스닥100 2배 레버리지' },
  { value: 'ndx1x', label: 'QQQ (NDX 1x)', sublabel: '나스닥100 1배' },
  { value: 'sp500', label: 'VOO (S&P500)', sublabel: 'S&P500 1배' },
]

// ===== 메인 시뮬레이터 페이지 =====
function SimulatorInner() {
  const searchParams = useSearchParams()

  const [priceData, setPriceData] = useState<{ ndx: PriceData; sp5: PriceData } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<StrategyResults | null>(null)
  const [activeChart, setActiveChart] = useState<'scatter' | 'dist' | 'cdf' | 'table'>('scatter')
  const [tableSort, setTableSort] = useState<{ col: 'start' | 'yA' | 'yB' | 'yC'; dir: 1 | -1 }>({ col: 'start', dir: 1 })
  const [cohortJson, setCohortJson] = useState<CohortJsonFile | null>(null)
  const [jsonLoading, setJsonLoading] = useState(false)
  const [show, setShow] = useState<Record<'A' | 'B' | 'C', boolean>>({ A: true, B: true, C: true })
  const [modalDetail, setModalDetail] = useState<{ A: CohortDetail; B: CohortDetail; C: CohortDetail } | null>(null)

  const toggleShow = (s: 'A' | 'B' | 'C') =>
    setShow(prev => ({ ...prev, [s]: !prev[s] }))

  // 파라미터 상태 (URL 파라미터 우선)
  const [instrument, setInstrument] = useState<Instrument>('ndx3x')
  const [dailyInvest, setDailyInvest] = useState(() => Number(searchParams.get('daily'))  || 200_000)
  const [capInvest,   setCapInvest]   = useState(() => Number(searchParams.get('lump'))   || 250_000_000)
  const [lumpSum,     setLumpSum]     = useState(() => Number(searchParams.get('lump'))   || 250_000_000)
  const [targetAmount,setTargetAmount]= useState(() => Number(searchParams.get('target')) || 1_000_000_000)

  const openCohortDetail = useCallback((startDateStr: string) => {
    if (!priceData) return
    const data = instrument === 'sp500' ? priceData.sp5 : priceData.ndx
    const { dates } = data

    let prices: import('@/lib/dataLoader').PriceData['lev1']
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

  // 데이터 로드
  useEffect(() => {
    async function load() {
      const { loadNdx, loadSp500 } = await import('@/lib/dataLoader')
      const [ndx, sp5] = await Promise.all([loadNdx(), loadSp500()])
      setPriceData({ ndx, sp5 })
      setLoading(false)
    }
    load()
  }, [])

  // 백테스트 실행
  const runSim = useCallback(() => {
    if (!priceData) return
    const data = instrument === 'sp500' ? priceData.sp5 : priceData.ndx
    const params: BacktestParams = {
      instrument, strategy: 'A',  // strategy unused (A/B/C 전부 계산)
      dailyInvest, capInvest, lumpSum, targetAmount,
    }
    startTransition(() => {
      const res = runBacktest(data, params)
      setResults(res)
    })
  }, [priceData, instrument, dailyInvest, capInvest, lumpSum, targetAmount])

  // 데이터 로드 완료 시 자동 실행
  useEffect(() => {
    if (!loading && priceData) runSim()
  }, [loading])  // eslint-disable-line

  // 종목 변경 시 JSON 코호트 데이터 fetch
  useEffect(() => {
    setJsonLoading(true)
    setCohortJson(null)
    fetch(JSON_MAP[instrument])
      .then(r => r.json())
      .then((data: CohortJsonFile) => { setCohortJson(data); setJsonLoading(false) })
      .catch(() => setJsonLoading(false))
  }, [instrument])

  const summaries = results ? {
    A: summarize(results.A, 'A'),
    B: summarize(results.B, 'B'),
    C: summarize(results.C, 'C'),
  } : null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="simulator" />

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* ===== 왼쪽: 파라미터 패널 ===== */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-5">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">투자 설정</h2>

            {/* 종목 선택 */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">종목 (레버리지)</label>
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
              unit="원"
              hint={`월 ${(dailyInvest * 21 / 10000).toFixed(0)}만원 상당`}
            />
            <NumInput
              label="C전략 거치금 / B전략 한도"
              value={capInvest}
              onChange={v => { setCapInvest(v); setLumpSum(v) }}
              min={0} step={10_000_000}
              unit="원"
              hint={`${(capInvest / 1e8).toFixed(2)}억원`}
            />
            <NumInput
              label="목표 금액"
              value={targetAmount}
              onChange={setTargetAmount}
              min={100_000_000} step={100_000_000}
              unit="원"
              hint={`${(targetAmount / 1e8).toFixed(0)}억원`}
            />

            <button
              onClick={runSim}
              disabled={loading || isPending}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-white font-semibold transition-colors"
            >
              {loading ? '데이터 로딩 중...' : isPending ? '계산 중...' : '▶ 백테스트 실행'}
            </button>
          </div>

          {/* 전략 설명 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">전략 설명</h2>
            {[
              { s: 'A', color: 'text-emerald-600 dark:text-emerald-400', title: 'A전략 — 계속 적립', desc: `거치 없이 매일 ${(dailyInvest/10000).toFixed(0)}만원 한도 없이 계속.` },
              { s: 'B', color: 'text-yellow-500 dark:text-yellow-400', title: 'B전략 — 매입액 한도', desc: `매일 ${(dailyInvest/10000).toFixed(0)}만원 적립하다, 누적 투자액이 ${(capInvest/1e8).toFixed(2)}억 도달 시 중단 후 보유.` },
              { s: 'C', color: 'text-blue-500 dark:text-blue-400', title: 'C전략 — 3년 분할 거치', desc: `${(lumpSum/1e8).toFixed(2)}억을 36개월에 걸쳐 매월 균등 분할 거치 + 매일 ${(dailyInvest/10000).toFixed(0)}만원 계속 적립.` },
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
          {loading && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              데이터 로딩 중...
            </div>
          )}

          {!loading && !results && (
            <div className="flex items-center justify-center h-64 text-gray-400">
              파라미터를 설정하고 실행 버튼을 누르세요.
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

          {results && summaries && (
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
                  거치/한도 {(capInvest/1e8).toFixed(2)}억
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                  목표 {(targetAmount/1e8).toFixed(0)}억
                </span>
                <span className="text-gray-400 text-xs">
                  {results.A.length}가지 경우 (1971~현재)
                </span>
              </div>

              {/* 전략별 요약 (클릭으로 on/off) */}
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
                    <p className="text-xs text-gray-400 mb-4">
                      X축: 투자 시작 연도 &nbsp;|&nbsp; Y축: 목표 달성까지 소요 기간(년) &nbsp;|&nbsp; 미달성 시점은 표시 안 됨
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
                    <p className="text-xs text-gray-400 mb-4">N년 이내 목표 달성 누적 비율 &nbsp;|&nbsp; 50%·80% 기준선 표시</p>
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

                  if (jsonLoading) return (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                      데이터 로딩 중...
                    </div>
                  )
                  if (!cohortJson) return (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                      데이터를 불러올 수 없습니다.
                    </div>
                  )

                  const { params } = cohortJson.meta

                  // 활성 전략의 sort 컬럼만 허용
                  const activeSortCol: typeof tableSort.col =
                    (tableSort.col === 'yA' && !show.A) ||
                    (tableSort.col === 'yB' && !show.B) ||
                    (tableSort.col === 'yC' && !show.C)
                      ? 'start'
                      : tableSort.col

                  const sortableCols: { col: typeof tableSort.col; label: string }[] = [
                    { col: 'start', label: '시작일' },
                    ...(show.A ? [{ col: 'yA' as const, label: 'A 종료일' }] : []),
                    ...(show.B ? [{ col: 'yB' as const, label: 'B 종료일' }] : []),
                    ...(show.C ? [{ col: 'yC' as const, label: 'C 종료일' }] : []),
                  ]

                  const sorted = [...cohortJson.rows].sort((x, y) => {
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
                        기준: 일 {(params.dailyInvest/10000).toFixed(0)}만원 · 거치/한도 {(params.lumpSum/1e8).toFixed(1)}억 · 목표 {(params.target/1e8).toFixed(0)}억
                        &nbsp;—&nbsp;파라미터를 바꿔도 이 표는 기준값 고정입니다.
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
                                  {activeSortCol === col && (
                                    <span className="ml-1 text-blue-500 dark:text-blue-400">{tableSort.dir === 1 ? '↑' : '↓'}</span>
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
                <p>⚠️ <strong>비용 미반영:</strong> 운용비용(TQQQ 0.88%/년)·추적오차는 미반영입니다. 변동성 끌림은 일별 복리 계산에 자동 반영됩니다.</p>
                <p>⚠️ <strong>과거 데이터 기반:</strong> 미래 수익을 보장하지 않으며, 닷컴버블(1999-2000)이 유일하게 관측된 극단적 사례입니다.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SimulatorPage() {
  return (
    <Suspense>
      <SimulatorInner />
    </Suspense>
  )
}
