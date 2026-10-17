'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Header from '@/components/Header'
import {
  Chart as ChartJS,
  CategoryScale,
  LogarithmicScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useTheme } from '@/components/ThemeProvider'

ChartJS.register(CategoryScale, LogarithmicScale, LineElement, PointElement, Tooltip, Legend)

/* ─── 타입 ───────────────────────────────────────────────────────────── */
interface PricePoint { d: string; p: number }

interface CorrectionEvent {
  id: string
  name_ko: string
  peak_date: string
  trough_date: string
  recovery_date: string | null
  drawdown_pct: number
  duration_days: number
  recovery_days: number | null
  category: string
  triggers_ko: string[]
  characteristics_ko: string[]
  fed_rate: number
  inflation_rate: number
  grade: string
  note?: string
  parent_id?: string
}

interface CorrectionData {
  metadata: { total_events: number }
  corrections: CorrectionEvent[]
}

/* ─── 상수 ───────────────────────────────────────────────────────────── */
const GRADES_ORDER = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
const SERIOUS_GRADES = new Set(['S', 'A', 'B', 'C', 'D'])
const DEFAULT_CHART_GRADES = new Set(['A', 'B', 'C', 'D'])

const GRADE_INFO: Record<string, { label: string; range: string; bg: string; text: string; border: string }> = {
  S: { label: '대공황급',      range: '-80% 이상',  bg: 'bg-red-900',    text: 'text-red-100',    border: 'border-red-700' },
  A: { label: '시스템 위기',   range: '-45~-80%',   bg: 'bg-red-700',    text: 'text-red-100',    border: 'border-red-500' },
  B: { label: '심각한 약세장', range: '-30~-45%',   bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-400' },
  C: { label: '약세장',        range: '-20~-30%',   bg: 'bg-amber-500',  text: 'text-amber-100',  border: 'border-amber-400' },
  D: { label: '깊은 조정',     range: '-15~-20%',   bg: 'bg-yellow-500', text: 'text-yellow-900', border: 'border-yellow-400' },
  E: { label: '중간 조정',     range: '-10~-15%',   bg: 'bg-blue-500',   text: 'text-blue-100',   border: 'border-blue-400' },
  F: { label: '소규모 조정',   range: '-5~-10%',    bg: 'bg-green-600',  text: 'text-green-100',  border: 'border-green-500' },
  G: { label: '소규모 조정',   range: '0~-5%',      bg: 'bg-gray-500',   text: 'text-gray-100',   border: 'border-gray-400' },
}

// 차트 오버레이 색상
const GRADE_FILL: Record<string, { light: string; dark: string }> = {
  S: { light: 'rgba(127,29,29,0.30)',  dark: 'rgba(185,28,28,0.40)' },
  A: { light: 'rgba(185,28,28,0.22)',  dark: 'rgba(220,38,38,0.28)' },
  B: { light: 'rgba(234,88,12,0.18)',  dark: 'rgba(251,146,60,0.22)' },
  C: { light: 'rgba(245,158,11,0.15)', dark: 'rgba(251,191,36,0.18)' },
  D: { light: 'rgba(107,114,128,0.12)',dark: 'rgba(156,163,175,0.15)' },
  E: { light: 'rgba(59,130,246,0.10)', dark: 'rgba(96,165,250,0.12)' },
  F: { light: 'rgba(34,197,94,0.08)',  dark: 'rgba(74,222,128,0.10)' },
  G: { light: 'rgba(156,163,175,0.06)',dark: 'rgba(156,163,175,0.08)' },
}

const GRADE_LINE: Record<string, { light: string; dark: string }> = {
  S: { light: 'rgba(127,29,29,0.80)',  dark: 'rgba(239,68,68,0.90)' },
  A: { light: 'rgba(185,28,28,0.70)',  dark: 'rgba(239,68,68,0.70)' },
  B: { light: 'rgba(234,88,12,0.60)',  dark: 'rgba(251,146,60,0.60)' },
  C: { light: 'rgba(245,158,11,0.50)', dark: 'rgba(251,191,36,0.50)' },
  D: { light: 'rgba(107,114,128,0.35)',dark: 'rgba(156,163,175,0.35)' },
  E: { light: 'rgba(59,130,246,0.30)', dark: 'rgba(96,165,250,0.30)' },
  F: { light: 'rgba(34,197,94,0.25)',  dark: 'rgba(74,222,128,0.25)' },
  G: { light: 'rgba(156,163,175,0.20)',dark: 'rgba(156,163,175,0.20)' },
}

const CAT_GROUPS = [
  { key: 'all',      label: '전체' },
  { key: 'war',      label: '전쟁·지정학',  subs: ['war', 'terrorism', 'geopolitical'] },
  { key: 'economy',  label: '경제·금융',    subs: ['financial_crisis', 'financial_stress', 'recession', 'inflation', 'trade_war'] },
  { key: 'policy',   label: '통화정책',     subs: ['monetary_policy'] },
  { key: 'politics', label: '정치·사회',    subs: ['election', 'political_scandal', 'social', 'legislation'] },
  { key: 'disaster', label: '재해·팬데믹',  subs: ['natural_disaster', 'pandemic'] },
  { key: 'tech',     label: '기술·버블',    subs: ['technology', 'bubble', 'corporate_scandal', 'technical'] },
] as const

/* ─── 헬퍼 ───────────────────────────────────────────────────────────── */
function daysToText(days: number | null): string {
  if (days === null) return '미회복'
  if (days < 30) return `${days}일`
  const months = Math.round(days / 30.4)
  if (months < 12) return `${months}개월`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}년 ${rem}개월` : `${years}년`
}

function yearOf(d: string) { return d.slice(0, 4) }

/* ─── 페이지 ─────────────────────────────────────────────────────────── */
export default function MarketHistoryPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const chartRef = useRef<ChartJS<'line'> | null>(null)

  /* 데이터 */
  const [sp500, setSp500] = useState<PricePoint[] | null>(null)
  const [allCorrections, setAllCorrections] = useState<CorrectionEvent[]>([])
  const [pluginLoaded, setPluginLoaded] = useState(false)

  /* 차트 UI 상태 */
  const [chartGrades, setChartGrades] = useState<Set<string>>(new Set(DEFAULT_CHART_GRADES))
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  /* 이벤트 목록 상태 */
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set(GRADES_ORDER))
  const [catFilter, setCatFilter] = useState('all')
  const [sort, setSort] = useState<'date' | 'drawdown' | 'duration' | 'recovery'>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showMinor, setShowMinor] = useState(false)

  /* 로드 */
  useEffect(() => {
    fetch('/data/sp500_monthly.json').then(r => r.json()).then(setSp500)
  }, [])

  useEffect(() => {
    fetch('/data/sp500_corrections_history.json')
      .then(r => r.json())
      .then((d: CorrectionData) => {
        setAllCorrections(d.corrections.filter(e => !e.parent_id))
      })
  }, [])

  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => {
      ChartJS.register(z)
      setPluginLoaded(true)
    })
  }, [])

  /* 레이블 (YYYY-MM) */
  const labels = useMemo(() => sp500?.map(p => p.d) ?? [], [sp500])

  /* X축 눈금 (10년마다) */
  const tickLabels = useMemo(() => {
    if (!sp500) return []
    return sp500.map(p => {
      const [y, m] = p.d.split('-')
      return m === '01' && Number(y) % 10 === 0 ? y : ''
    })
  }, [sp500])

  /* 선택된 이벤트로 차트 줌 (X + Y 동시 조정) */
  useEffect(() => {
    if (!selectedEventId || !sp500 || !chartRef.current || !pluginLoaded) return
    const ev = allCorrections.find(e => e.id === selectedEventId)
    if (!ev) return
    const startM = ev.peak_date.slice(0, 7)
    const endM = ev.trough_date.slice(0, 7)
    const si = labels.indexOf(startM)
    const ei = labels.indexOf(endM)
    if (si === -1) return
    const span = Math.max((ei !== -1 ? ei : si) - si, 3)
    const padding = Math.max(span * 4, 30)
    const xMin = Math.max(0, si - padding)
    const xMax = Math.min(labels.length - 1, (ei !== -1 ? ei : si) + padding)

    // 가시 범위 내 Y 범위 계산
    const visiblePrices = sp500.slice(xMin, xMax + 1).map(p => p.p)
    const priceMin = Math.min(...visiblePrices)
    const priceMax = Math.max(...visiblePrices)

    try {
      const chart = chartRef.current as any
      chart.zoomScale('x', { min: xMin, max: xMax }, 'none')
      chart.options.scales.y.min = priceMin * 0.75
      chart.options.scales.y.max = priceMax * 1.35
      chart.update('none')
    } catch { /* zoom plugin이 초기화되지 않은 경우 무시 */ }
  }, [selectedEventId, allCorrections, labels, sp500, pluginLoaded])

  /* 오버레이 인라인 플러그인 */
  const annotationPlugin = useMemo(() => {
    const evts = allCorrections.filter(e =>
      chartGrades.has(e.grade) && e.peak_date >= '1927-12'
    )
    const selId = selectedEventId

    return {
      id: 'drawdownRegions',
      beforeDatasetsDraw(chart: ChartJS) {
        const { ctx, chartArea, scales } = chart
        const xScale = scales.x
        if (!xScale || !chartArea) return
        ctx.save()

        evts.forEach(ev => {
          const si = labels.indexOf(ev.peak_date.slice(0, 7))
          const ei = labels.indexOf(ev.trough_date.slice(0, 7))
          if (si === -1) return

          const x1 = xScale.getPixelForValue(si)
          const x2 = ei !== -1 ? xScale.getPixelForValue(ei) : x1 + 4
          const left = Math.min(x1, x2)
          const width = Math.max(Math.abs(x2 - x1), 2)
          const isSelected = ev.id === selId

          const fill = isSelected
            ? (dark ? 'rgba(239,68,68,0.50)' : 'rgba(220,38,38,0.40)')
            : (dark ? GRADE_FILL[ev.grade]?.dark : GRADE_FILL[ev.grade]?.light)
          const stroke = isSelected
            ? (dark ? 'rgba(239,68,68,1.00)' : 'rgba(185,28,28,1.00)')
            : (dark ? GRADE_LINE[ev.grade]?.dark : GRADE_LINE[ev.grade]?.light)

          if (!fill || !stroke) return

          ctx.fillStyle = fill
          ctx.fillRect(left, chartArea.top, width, chartArea.height)

          if (isSelected) {
            ctx.strokeStyle = stroke
            ctx.lineWidth = 2
            ctx.setLineDash([])
            ctx.strokeRect(left, chartArea.top, width, chartArea.height)
          } else {
            ctx.strokeStyle = stroke
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(left, chartArea.top)
            ctx.lineTo(left, chartArea.bottom)
            ctx.stroke()
          }
        })
        ctx.restore()
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCorrections, labels, dark, selectedEventId, chartGrades])

  /* 차트 옵션 */
  const gridColor = dark ? '#1f2937' : '#f3f4f6'
  const tickColor = dark ? '#9ca3af' : '#6b7280'
  const lineColor = dark ? '#60a5fa' : '#2563eb'

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      x: {
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: (_: unknown, i: number) => tickLabels[i] ?? '',
          maxRotation: 0,
          autoSkip: false,
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        type: 'logarithmic' as const,
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: (v: number | string) => {
            const n = Number(v)
            if ([10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000].includes(n))
              return n >= 1000 ? `${n / 1000}k` : String(n)
            return ''
          },
        },
        grid: { color: gridColor },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dark ? '#111827' : '#ffffff',
        borderColor: dark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleColor: tickColor,
        bodyColor: dark ? '#f9fafb' : '#111827',
        padding: 8,
        callbacks: {
          title: (items: Array<{ label: string }>) => items[0]?.label ?? '',
          label: (ctx: { parsed: { y: number | null } }) => {
            const v = ctx.parsed.y
            if (v == null) return ''
            return `S&P500 ${v.toFixed(2)}`
          },
        },
      },
      ...(pluginLoaded ? {
        zoom: {
          pan:  { enabled: true, mode: 'x' as const },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const },
        },
      } : {}),
    },
  }), [tickColor, gridColor, tickLabels, dark, pluginLoaded])

  /* 이벤트 목록 필터링 */
  const stats = useMemo(() => {
    const gc: Record<string, number> = {}
    allCorrections.forEach(e => { gc[e.grade] = (gc[e.grade] ?? 0) + 1 })
    return gc
  }, [allCorrections])

  const filtered = useMemo(() => {
    const catSubs = CAT_GROUPS.find(g => g.key === catFilter) as any
    const subs: string[] = catSubs?.subs ?? []
    const q = search.trim().toLowerCase()

    return allCorrections
      .filter(e => {
        if (!showMinor && !SERIOUS_GRADES.has(e.grade)) return false
        if (!selectedGrades.has(e.grade)) return false
        if (catFilter !== 'all' && !subs.includes(e.category)) return false
        if (q && !e.name_ko.toLowerCase().includes(q) && !e.triggers_ko.join(' ').toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        let diff = 0
        if (sort === 'date')     diff = a.peak_date.localeCompare(b.peak_date)
        if (sort === 'drawdown') diff = a.drawdown_pct - b.drawdown_pct
        if (sort === 'duration') diff = a.duration_days - b.duration_days
        if (sort === 'recovery') diff = (a.recovery_days ?? 99999) - (b.recovery_days ?? 99999)
        return sortAsc ? diff : -diff
      })
  }, [allCorrections, selectedGrades, catFilter, sort, sortAsc, search, showMinor])

  /* 핸들러 */
  const toggleGrade = useCallback((g: string) => {
    setSelectedGrades(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g); else next.add(g)
      return next
    })
  }, [])

  const toggleChartGrade = useCallback((g: string) => {
    setChartGrades(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g); else next.add(g)
      return next
    })
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  function resetChartZoom() {
    const chart = chartRef.current as any
    if (!chart) return
    chart.resetZoom()
    chart.options.scales.y.min = undefined
    chart.options.scales.y.max = undefined
    chart.update('none')
  }

  function toggleSort(key: typeof sort) {
    if (sort === key) setSortAsc(v => !v)
    else { setSort(key); setSortAsc(false) }
  }

  function handleSelectEvent(id: string) {
    if (selectedEventId === id) {
      setSelectedEventId(null)
      resetChartZoom()
    } else {
      setSelectedEventId(id)
      if (!expanded.has(id)) toggleExpand(id)
    }
  }

  /* 정렬 버튼 */
  const SortBtn = ({ k, label }: { k: typeof sort; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        sort === k
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
          : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-500'
      }`}
    >
      {label} {sort === k ? (sortAsc ? '↑' : '↓') : ''}
    </button>
  )

  /* ─── 렌더 ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* 제목 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">장기투자</span>
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">인출식</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">조정장 역사서</h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            S&P500이 하락한 사건 481건 — 1871년부터 2026년까지.
            전쟁, 금리 충격, 팬데믹, 스캔들, 버블 붕괴... 이 모든 것을 겪고도 시장은 우상향했다.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            S&P500 기준 (1957년 이전은 S&P Composite 지수) · 종가 기준 · 출처: Yardeni Research, Hartford Funds, FRED
          </p>
        </div>

        {/* ── S&P500 차트 ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300">
              S&P500 장기 가격 (1927–현재, 로그 스케일)
            </h2>
            <div className="flex gap-1">
              {selectedEventId && (
                <button
                  onClick={() => { setSelectedEventId(null); resetChartZoom() }}
                  className="text-[10px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  전체 보기
                </button>
              )}
              <button
                onClick={() => { resetChartZoom(); setSelectedEventId(null) }}
                className="text-[10px] px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
              >
                줌 초기화
              </button>
            </div>
          </div>

          {/* 차트 오버레이 등급 토글 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs text-gray-400 dark:text-gray-500 self-center mr-1">차트 표시:</span>
            {(['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map(g => {
              const on = chartGrades.has(g)
              return (
                <button
                  key={g}
                  onClick={() => toggleChartGrade(g)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    on
                      ? `${GRADE_INFO[g].bg} ${GRADE_INFO[g].text} border-transparent`
                      : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {g}
                </button>
              )
            })}
          </div>

          {!sp500 || allCorrections.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-sm text-gray-400">불러오는 중…</div>
          ) : (
            <div className="relative">
              <div style={{ height: 380 }}>
                <Line
                  ref={chartRef}
                  plugins={[annotationPlugin]}
                  data={{
                    labels: tickLabels,
                    datasets: [{
                      data: sp500.map(p => p.p),
                      borderColor: lineColor,
                      backgroundColor: 'transparent',
                      borderWidth: 1.2,
                      pointRadius: 0,
                      tension: 0,
                    }],
                  }}
                  options={chartOptions}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
                휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
              </p>
            </div>
          )}

          {/* 범례 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {(['S', 'A', 'B', 'C', 'D'] as const).map(g => (
              <span key={g} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm border"
                  style={{
                    background: dark ? GRADE_FILL[g].dark : GRADE_FILL[g].light,
                    borderColor: dark ? GRADE_LINE[g].dark : GRADE_LINE[g].light,
                  }}
                />
                {GRADE_INFO[g].label} ({g})
              </span>
            ))}
            {selectedEventId && (
              <span className="text-red-500 dark:text-red-400 font-medium">
                · 선택된 사건은 빨간 테두리로 강조
              </span>
            )}
          </div>
        </div>

        {/* ── 등급 범례 & 필터 ── */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-5">
          {GRADES_ORDER.map(g => {
            const info = GRADE_INFO[g]
            const count = stats[g] ?? 0
            const active = selectedGrades.has(g)
            const isMinorGrade = g === 'F' || g === 'G'
            return (
              <button
                key={g}
                onClick={() => {
                  if (isMinorGrade && !showMinor) {
                    setShowMinor(true)
                    setSelectedGrades(prev => { const n = new Set(prev); n.add(g); return n })
                  } else {
                    toggleGrade(g)
                  }
                }}
                className={`rounded-xl px-2 py-2 text-center transition-all border ${
                  active && (showMinor || !isMinorGrade)
                    ? `${info.bg} ${info.text} ${info.border}`
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800'
                }`}
              >
                <p className="text-sm font-black">{g}</p>
                <p className="text-[10px] leading-tight mt-0.5">{info.range}</p>
                <p className="text-xs font-bold mt-1">{count}건</p>
              </button>
            )
          })}
        </div>

        {/* F·G 숨김 토글 */}
        {!showMinor ? (
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              F·G등급 (소규모 조정 {(stats['F'] ?? 0) + (stats['G'] ?? 0)}건) 숨김 중
            </span>
            <button onClick={() => setShowMinor(true)} className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
              전부 보기
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={() => { setShowMinor(false); setSelectedGrades(new Set(GRADES_ORDER)) }}
              className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
            >
              소규모 조정 숨기기
            </button>
          </div>
        )}

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CAT_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setCatFilter(g.key)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                catFilter === g.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white font-medium'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* 정렬 + 검색 */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex gap-1.5 flex-wrap">
            <SortBtn k="date"     label="날짜순" />
            <SortBtn k="drawdown" label="하락폭순" />
            <SortBtn k="duration" label="기간순" />
            <SortBtn k="recovery" label="회복기간순" />
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름·원인 검색"
            className="ml-auto text-sm px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 w-44"
          />
        </div>

        {/* 결과 수 */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          {filtered.length}건 표시 · 전체 {allCorrections.length}건
          {selectedEventId && (
            <span className="ml-3 text-red-500 dark:text-red-400">
              · 선택됨 — 차트에서 해당 구간 강조 중
            </span>
          )}
        </p>

        {/* 이벤트 목록 */}
        {allCorrections.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">조건에 맞는 사건이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(e => {
              const info = GRADE_INFO[e.grade]
              const isOpen = expanded.has(e.id)
              const isSelected = e.id === selectedEventId
              return (
                <div
                  key={e.id}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    isSelected
                      ? 'border-red-400 dark:border-red-500 shadow-sm shadow-red-100 dark:shadow-red-900/20'
                      : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <button
                    onClick={() => handleSelectEvent(e.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${info.bg} ${info.text}`}>
                        {e.grade}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{e.name_ko}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{yearOf(e.peak_date)}</span>
                          {isSelected && (
                            <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">차트 표시 중</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-mono font-semibold text-red-600 dark:text-red-400">{e.drawdown_pct.toFixed(1)}%</span>
                          <span>하락 {daysToText(e.duration_days)}</span>
                          <span>회복 {daysToText(e.recovery_days)}</span>
                        </div>
                      </div>
                      <span className="text-gray-400 dark:text-gray-600 text-sm shrink-0 mt-0.5">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-300">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1.5">원인</p>
                          <ul className="space-y-1">
                            {e.triggers_ko.map((t, i) => (
                              <li key={i} className="flex gap-1.5"><span className="text-gray-400 shrink-0">·</span>{t}</li>
                            ))}
                          </ul>
                        </div>
                        {e.characteristics_ko.length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1.5">특징</p>
                            <ul className="space-y-1">
                              {e.characteristics_ko.map((c, i) => (
                                <li key={i} className="flex gap-1.5"><span className="text-gray-400 shrink-0">·</span>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                        <span>고점 {e.peak_date.slice(0, 7)}</span>
                        <span>저점 {e.trough_date.slice(0, 7)}</span>
                        {e.recovery_date && <span>회복 {e.recovery_date.slice(0, 7)}</span>}
                        {e.fed_rate > 0 && <span>기준금리 {e.fed_rate}%</span>}
                        {e.inflation_rate !== 0 && <span>물가상승률 {e.inflation_rate}%</span>}
                        {e.note && <span className="italic">{e.note}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 푸터 */}
        <div className="mt-12 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800 pt-6 space-y-1">
          <p>S&P500 기준. 1957년 이전은 S&P Composite 지수(S&P500의 전신). 날짜·수치는 종가 기준이며 일부 초기 데이터는 월별 종가 추정치.</p>
          <p>등급: S(-80%+) A(-45~-80%) B(-30~-45%) C(-20~-30%) D(-15~-20%) E(-10~-15%) F(-5~-10%) G(0~-5%)</p>
          <p>출처: Yardeni Research, Hartford Funds, Wall Street Courier, Wikipedia, FRED</p>
        </div>
      </main>
    </div>
  )
}
