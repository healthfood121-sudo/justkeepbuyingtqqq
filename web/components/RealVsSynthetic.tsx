'use client'

import { useEffect, useRef, useState } from 'react'
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

interface Yearly { year: number; real: number; cost: number; fee: number; partial: boolean }
interface Etf {
  start: string; end: string; years: number
  cagr: { real: number; cost: number; fee: number }
  gap_cost: number; gap_fee: number
  final: { real: number; cost: number; fee: number }
  mdd: { real: number; cost: number; fee: number }
  roll5: { n: number; min: number; median: number; max: number } | null
  yearly: Yearly[]
  monthly: { m: string; real: number; cost: number; fee: number }[]
}
interface Data { asof: string; etfs: Record<'TQQQ' | 'QLD' | 'QQQ', Etf> }

const KEYS = ['TQQQ', 'QLD', 'QQQ'] as const
const NAME: Record<(typeof KEYS)[number], string> = { TQQQ: 'TQQQ (3배)', QLD: 'QLD (2배)', QQQ: '나스닥100 (1배)' }
const SERIES = [
  { k: 'real', label: '실제 가격', light: '#111827', dark: '#f9fafb' },
  { k: 'cost', label: '합성 (사이트 기본)', light: '#2563eb', dark: '#60a5fa' },
  { k: 'fee',  label: '합성 (운용보수만)', light: '#9ca3af', dark: '#6b7280' },
] as const

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
const mult = (v: number) => `${(v / 100).toLocaleString('ko-KR', { maximumFractionDigits: v >= 1000 ? 0 : 1 })}배`

export default function RealVsSynthetic({ part }: { part: 'summary' | 'chart' | 'yearly' }) {
  const [data, setData] = useState<Data | null>(null)
  const [etf, setEtf] = useState<(typeof KEYS)[number]>('TQQQ')
  const { theme } = useTheme()
  const dark = theme === 'dark'
  useEffect(() => { fetch('/data/real_vs_synthetic.json').then(r => r.json()).then(setData) }, [])
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      ChartJS.register(zoomPlugin)
      setPluginLoaded(true)
    })
  }, [])
  if (!data) return <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>

  if (part === 'summary') {
    return (
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['종목', '기간', '실제 연평균', '합성 (사이트 기본)', '차이', '최대 낙폭 (실제 / 합성)'].map(h => (
                <th key={h} className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {KEYS.map(k => {
              const e = data.etfs[k]
              return (
                <tr key={k}>
                  <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{NAME[k]}</td>
                  <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.start.slice(0, 4)}~{e.end.slice(0, 4)} ({e.years.toFixed(0)}년)</td>
                  <td className="py-2.5 px-3 font-mono text-gray-800 dark:text-gray-200">{e.cagr.real.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400">{e.cagr.cost.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-green-600 dark:text-green-400 whitespace-nowrap">실제가 {e.gap_cost.toFixed(1)}%p 높음</td>
                  <td className="py-2.5 px-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.mdd.real.toFixed(1)}% / {e.mdd.cost.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const tabs = (
    <div className="flex gap-1.5 mb-4">
      {KEYS.map(k => (
        <button key={k} onClick={() => setEtf(k)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${etf === k
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
          {NAME[k]}
        </button>
      ))}
    </div>
  )
  const e = data.etfs[etf]

  if (part === 'chart') {
    const grid = dark ? '#1f2937' : '#f3f4f6'
    const tick = dark ? '#9ca3af' : '#6b7280'
    return (
      <div className="mb-6">
        {tabs}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {e.start}에 100을 넣었다면 → 실제 <strong className="text-gray-900 dark:text-white">{mult(e.final.real)}</strong>
          {' · '}합성(사이트 기본) <strong className="text-blue-600 dark:text-blue-400">{mult(e.final.cost)}</strong>
          {' · '}합성(운용보수만) {mult(e.final.fee)}
        </p>
        <div className="relative">
          <button
            onClick={() => chartRef.current?.resetZoom()}
            className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            줌 초기화
          </button>
          <div style={{ height: 288 }}>
            <Line
              ref={chartRef}
              data={{
                labels: e.monthly.map(m => m.m),
                datasets: SERIES.map(s => ({
                  label: s.label,
                  data: e.monthly.map(m => m[s.k]),
                  borderColor: dark ? s.dark : s.light,
                  backgroundColor: dark ? s.dark : s.light,
                  borderWidth: s.k === 'real' ? 2.5 : 1.75,
                  borderDash: s.k === 'fee' ? [4, 3] : [],
                  pointRadius: 0,
                  tension: 0,
                })),
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false as const,
                scales: {
                  x: {
                    ticks: {
                      color: tick,
                      font: { size: 11 },
                      callback: (_: unknown, i: number) => e.monthly[i]?.m.slice(0, 4) ?? '',
                      maxTicksLimit: 12,
                      autoSkip: true,
                    },
                    grid: { color: grid },
                    border: { color: grid },
                  },
                  y: {
                    type: 'logarithmic' as const,
                    ticks: {
                      color: tick,
                      font: { size: 11 },
                      callback: (v: number | string) => mult(Number(v)),
                      maxTicksLimit: 6,
                    },
                    grid: { color: grid },
                    border: { display: false },
                  },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: dark ? '#111827' : '#ffffff',
                    borderColor: dark ? '#374151' : '#e5e7eb',
                    borderWidth: 1,
                    titleColor: tick,
                    bodyColor: dark ? '#f9fafb' : '#111827',
                    padding: 8,
                    callbacks: {
                      title: (items: Array<{ label: string }>) => items[0]?.label ?? '',
                      label: (ctx: { datasetIndex: number; parsed: { y: number } }) => {
                        const s = SERIES[ctx.datasetIndex]
                        return `${s?.label}: ${mult(ctx.parsed.y)}`
                      },
                    },
                  },
                  ...(pluginLoaded ? {
                    zoom: {
                      pan: { enabled: true, mode: 'x' as const },
                      zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const },
                    },
                  } : {}),
                },
              } as Parameters<typeof Line>[0]['options']}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
            휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          {SERIES.map(s => (
            <span key={s.k} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5" style={{ background: dark ? s.dark : s.light }} />{s.label}
            </span>
          ))}
          <span>· 세로축은 로그 눈금 (같은 간격 = 같은 배수)</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {tabs}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['연도', '실제', '합성 (사이트 기본)', '차이', '합성 (운용보수만)'].map(h => (
                <th key={h} className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {e.yearly.map(y => {
              const d = y.real - y.cost
              return (
                <tr key={y.year} className={y.partial ? 'opacity-60' : ''}>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{y.year}{y.partial && <span className="text-[10px] text-gray-400"> (일부)</span>}</td>
                  <td className="py-2 px-3 font-mono text-gray-800 dark:text-gray-200">{pct(y.real)}</td>
                  <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">{pct(y.cost)}</td>
                  <td className={`py-2 px-3 font-mono ${d >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{d >= 0 ? '+' : ''}{d.toFixed(1)}%p</td>
                  <td className="py-2 px-3 font-mono text-gray-400 dark:text-gray-500">{pct(y.fee)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {e.roll5 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          5년씩 들고 간 {e.roll5.n}가지 경우: 실제가 합성보다 연 {e.roll5.min.toFixed(1)}~{e.roll5.max.toFixed(1)}%p 높음 (보통 {e.roll5.median.toFixed(1)}%p)
        </p>
      )}
    </div>
  )
}
