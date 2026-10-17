'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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

interface PricePoint { d: string; p: number }
interface SynthData  { synth: Record<string, PricePoint[]> }

interface CorrectionEvent {
  id: string
  name_ko: string
  peak_date: string
  trough_date: string
  recovery_date: string | null
  drawdown_pct: number
  duration_days: number
  recovery_days: number | null
  grade: string
  triggers_ko: string[]
  parent_id?: string
}

const GRADE_FILL: Record<string, { light: string; dark: string; label: string }> = {
  A: { light: 'rgba(185,28,28,0.18)',  dark: 'rgba(220,38,38,0.20)',  label: '시스템 위기 (A)' },
  B: { light: 'rgba(234,88,12,0.18)',  dark: 'rgba(251,146,60,0.20)', label: '심각한 약세장 (B)' },
  C: { light: 'rgba(245,158,11,0.16)', dark: 'rgba(251,191,36,0.18)', label: '약세장 (C)' },
  D: { light: 'rgba(107,114,128,0.12)',dark: 'rgba(156,163,175,0.14)',label: '깊은 조정 (D)' },
}

const GRADE_LINE: Record<string, { light: string; dark: string }> = {
  A: { light: 'rgba(185,28,28,0.7)',  dark: 'rgba(239,68,68,0.7)' },
  B: { light: 'rgba(234,88,12,0.6)',  dark: 'rgba(251,146,60,0.6)' },
  C: { light: 'rgba(245,158,11,0.5)', dark: 'rgba(251,191,36,0.5)' },
  D: { light: 'rgba(107,114,128,0.35)',dark: 'rgba(156,163,175,0.35)' },
}

function daysToText(days: number | null): string {
  if (days === null) return '미회복'
  if (days < 30) return `${days}일`
  const months = Math.round(days / 30.4)
  if (months < 12) return `약 ${months}개월`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}년 ${rem}개월` : `${years}년`
}

// S&P500 주요 사건(중복 제거된 최상위 이벤트)
const MAJOR_EVENTS_STATIC: Pick<CorrectionEvent, 'id' | 'name_ko' | 'peak_date' | 'trough_date' | 'drawdown_pct' | 'grade'>[] = [
  { id: 'oil_shock',    name_ko: '오일쇼크 / 워터게이트',     peak_date: '1973-01-11', trough_date: '1974-10-03', drawdown_pct: -48.2, grade: 'A' },
  { id: 'stagflation', name_ko: '볼커 쇼크 / 이중 침체',      peak_date: '1980-11-28', trough_date: '1982-08-12', drawdown_pct: -27.1, grade: 'C' },
  { id: 'blackmonday', name_ko: '블랙먼데이',                 peak_date: '1987-08-25', trough_date: '1987-12-04', drawdown_pct: -33.5, grade: 'B' },
  { id: 'gulf_war',    name_ko: '걸프전 / 경기침체',           peak_date: '1990-07-16', trough_date: '1990-10-11', drawdown_pct: -19.9, grade: 'D' },
  { id: 'ltcm',        name_ko: 'LTCM / 러시아 위기',         peak_date: '1998-07-17', trough_date: '1998-08-31', drawdown_pct: -19.3, grade: 'D' },
  { id: 'dotcom',      name_ko: '닷컴 버블 붕괴',              peak_date: '2000-03-24', trough_date: '2002-10-09', drawdown_pct: -49.1, grade: 'A' },
  { id: 'gfc',         name_ko: '글로벌 금융위기',             peak_date: '2007-10-09', trough_date: '2009-03-09', drawdown_pct: -56.8, grade: 'A' },
  { id: 'eurodbt',     name_ko: '미국 신용등급 강등 / 유로존',  peak_date: '2011-04-29', trough_date: '2011-10-03', drawdown_pct: -19.4, grade: 'D' },
  { id: 'tradewar18',  name_ko: '무역전쟁 / 연준 긴축',         peak_date: '2018-09-20', trough_date: '2018-12-24', drawdown_pct: -19.8, grade: 'D' },
  { id: 'covid',       name_ko: '코로나19 팬데믹',             peak_date: '2020-02-19', trough_date: '2020-03-23', drawdown_pct: -33.9, grade: 'B' },
  { id: 'inflation22', name_ko: '인플레이션 / 금리인상',        peak_date: '2022-01-03', trough_date: '2022-10-12', drawdown_pct: -25.4, grade: 'C' },
  { id: 'tariff25',    name_ko: '트럼프 관세전쟁',              peak_date: '2025-02-19', trough_date: '2025-04-08', drawdown_pct: -18.9, grade: 'D' },
]

export default function DrawdownMapPage() {
  const [synthData, setSynthData] = useState<PricePoint[] | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'

  useEffect(() => {
    fetch('/data/synthetic_ndx_prices.json').then(r => r.json()).then((d: SynthData) => {
      const series = d.synth.latest.filter(p => p.d >= '1971-02')
      setSynthData(series)
    })
  }, [])

  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => {
      ChartJS.register(z)
      setPluginLoaded(true)
    })
  }, [])

  const labels = useMemo(() => synthData?.map(p => p.d) ?? [], [synthData])

  // 연도별 x축 표시용 레이블 (5년마다)
  const tickLabels = useMemo(() => {
    if (!synthData) return []
    return synthData.map(p => {
      const [y, m] = p.d.split('-')
      return m === '01' && Number(y) % 5 === 0 ? y : ''
    })
  }, [synthData])

  // 주석 플러그인 (하락 구간 음영)
  const annotationPlugin = useMemo(() => {
    const events = MAJOR_EVENTS_STATIC
    return {
      id: 'drawdownRegions',
      beforeDatasetsDraw(chart: ChartJS) {
        const { ctx, chartArea, scales } = chart
        const xScale = scales.x
        if (!xScale || !chartArea) return
        ctx.save()
        events.forEach(ev => {
          const startM = ev.peak_date.slice(0, 7)
          const endM   = ev.trough_date.slice(0, 7)
          const si = labels.indexOf(startM)
          const ei = labels.indexOf(endM)
          if (si === -1) return
          const x1 = xScale.getPixelForValue(si)
          const x2 = ei !== -1 ? xScale.getPixelForValue(ei) : x1 + 4
          const fill = dark ? GRADE_FILL[ev.grade]?.dark : GRADE_FILL[ev.grade]?.light
          const line = dark ? GRADE_LINE[ev.grade]?.dark : GRADE_LINE[ev.grade]?.light
          if (!fill || !line) return
          ctx.fillStyle = fill
          ctx.fillRect(Math.min(x1, x2), chartArea.top, Math.abs(x2 - x1) + 1, chartArea.height)
          ctx.strokeStyle = line
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(Math.min(x1, x2), chartArea.top)
          ctx.lineTo(Math.min(x1, x2), chartArea.bottom)
          ctx.stroke()
        })
        ctx.restore()
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, dark])

  const gridColor  = dark ? '#1f2937' : '#f3f4f6'
  const tickColor  = dark ? '#9ca3af' : '#6b7280'
  const lineColor  = dark ? '#60a5fa' : '#2563eb'

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
            if ([0.1, 1, 10, 100, 1000, 10000].includes(n)) return n >= 1000 ? `${n/1000}k` : String(n)
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
            return `합성가격 ${v >= 1000 ? v.toFixed(0) : v.toFixed(2)}`
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
            <span className="text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">인출식</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">하락장 지도</h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            나스닥100 3배 레버리지 합성 가격(1971~2026)에 역사적 조정장을 겹쳐 봤다.
            붉은 구간마다 "이번엔 다르다"는 이야기가 있었다. 그래도 선은 우상향했다.
          </p>
        </div>

        {/* 차트 */}
        {!synthData ? (
          <div className="h-80 flex items-center justify-center text-sm text-gray-400">불러오는 중…</div>
        ) : (
          <div className="relative mb-2">
            <button
              onClick={() => chartRef.current?.resetZoom()}
              className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              줌 초기화
            </button>
            <div style={{ height: 380 }}>
              <Line
                ref={chartRef}
                plugins={[annotationPlugin]}
                data={{
                  labels: tickLabels,
                  datasets: [{
                    data: synthData.map(p => p.p),
                    borderColor: lineColor,
                    backgroundColor: lineColor,
                    borderWidth: 1.5,
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
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-10 text-xs text-gray-500 dark:text-gray-400">
          {Object.entries(GRADE_FILL).map(([g, c]) => (
            <span key={g} className="flex items-center gap-1.5">
              <span
                className="inline-block w-4 h-3 rounded-sm"
                style={{ background: dark ? c.dark : c.light, border: `1px solid ${dark ? GRADE_LINE[g].dark : GRADE_LINE[g].light}` }}
              />
              {GRADE_FILL[g].label}
            </span>
          ))}
          <span className="text-gray-400 dark:text-gray-600">· S&P500 고점→저점 기준 · 나스닥100 3배 실제 하락은 훨씬 더 심함</span>
        </div>

        {/* 주요 사건 표 */}
        <h2 className="text-lg font-bold mb-4">주요 하락장 상세</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 mb-6">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/60">
                {['등급', '사건', 'S&P500 하락', '하락 기간', '회복 기간', '고점', '저점'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {MAJOR_EVENTS_STATIC.filter(e => e.grade !== 'D').map(e => {
                const info = GRADE_FILL[e.grade]
                const bgStyle = { background: dark ? info?.dark : info?.light }
                // Find matching full event from static for recovery
                return (
                  <tr key={e.id} className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-black text-gray-900 dark:text-white"
                        style={bgStyle}
                      >
                        {e.grade}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium whitespace-nowrap">{e.name_ko}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-red-600 dark:text-red-400">{e.drawdown_pct.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {e.peak_date.slice(0,7)} ~ {e.trough_date.slice(0,7)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-gray-400 dark:text-gray-500">—</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400 dark:text-gray-600">{e.peak_date.slice(0,7)}</td>
                    <td className="py-2.5 px-3 font-mono text-gray-400 dark:text-gray-600">{e.trough_date.slice(0,7)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 콜아웃: TQQQ는 훨씬 더 심하다 */}
        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl px-5 py-4 mb-8 text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
          <strong>위 차트는 로그 스케일이다.</strong> 차트에서 작아 보이는 빨간 구간도 TQQQ는 실제로 −80~−96% 하락했다.
          2000~2002 닷컴 버블 때 나스닥100이 −78% 빠졌고 3배 레버리지는 이론적으로 −99.5%에 가까웠다.
          그래도 버텼다면 이후 역대급 반등이 왔다. <strong>버티기가 전략이다.</strong>
        </div>

        {/* 연결 링크 */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-2 text-sm">
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">더 읽어볼 것</p>
          <div className="space-y-2">
            {[
              { href: '/posts/market-history', label: '조정장 역사서', desc: '478개 사건 전체 목록, 등급·카테고리별 탐색' },
              { href: '/posts/trust-the-method', label: '뉴스를 보지 말고 방법론을 지켜라', desc: '백테스트 안에는 이미 모든 위기가 들어있다' },
              { href: '/posts/synthetic-ndx-1929', label: '1929년 대공황이 다시 오면', desc: '최악의 시나리오에서 몇 년이 걸리나' },
              { href: '/posts/withdrawal-guide', label: '인출식 방법론', desc: '하락장 구간에서 25% 룰이 어떻게 작동하는가' },
            ].map(l => (
              <a key={l.href} href={l.href} className="flex items-baseline gap-2 group">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:underline whitespace-nowrap">{l.label} →</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{l.desc}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-400 dark:text-gray-600 space-y-1">
          <p>하락 구간은 S&P500 종가 기준. TQQQ 합성 가격은 나스닥100 일별 수익률 × 3 (운용보수·스왑금리 포함). 1971-02 기준 100 → 2026-09 기준 약 340만배.</p>
          <p>조정 데이터 출처: Yardeni Research, Hartford Funds, FRED</p>
        </div>
      </main>
    </div>
  )
}
