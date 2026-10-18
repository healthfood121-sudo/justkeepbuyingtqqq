'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  LogarithmicScale,
  LinearScale,
  CategoryScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  LogarithmicScale,
  LinearScale,
  CategoryScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
)

type MonthEntry = { d: string; port: number; inv: number }
type StratData = { completed: boolean; years: number | null; panic_date: string | null; monthly: MonthEntry[] }
type CohortData = Record<string, StratData>

const STRAT_CONFIG: Record<string, { label: string; color: string; dash?: number[] }> = {
  HOLD:     { label: '계속 매수',                color: '#3b82f6' },
  QUIT30:   { label: '−30% 매도 후 영구 이탈',    color: '#ef4444' },
  QUIT50:   { label: '−50% 매도 후 영구 이탈',    color: '#f97316', dash: [6, 3] },
  BACK30_12:{ label: '−30% 매도 후 12개월 재개', color: '#22c55e', dash: [4, 4] },
  BACK30_24:{ label: '−30% 매도 후 24개월 재개', color: '#a855f7', dash: [2, 4] },
}

// 6개월마다 한 점씩 (차트 밀도 조절)
function downsample(monthly: MonthEntry[], step = 3): MonthEntry[] {
  return monthly.filter((_, i) => i % step === 0 || i === monthly.length - 1)
}

export default function PanicSellChart() {
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  const [chartData, setChartData] = useState<Record<string, CohortData> | null>(null)
  const [cohort, setCohort] = useState<'2000-01' | '2007-10'>('2000-01')

  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => {
      ChartJS.register(z)
      setPluginLoaded(true)
    })
  }, [])

  useEffect(() => {
    fetch('/data/panic_sell_chart.json')
      .then((r) => r.json())
      .then((d) => setChartData(d.samples))
  }, [])

  if (!chartData) {
    return <div className="h-72 flex items-center justify-center text-gray-400 text-sm">로딩 중…</div>
  }

  const cohortData: CohortData = chartData[cohort]
  const baseMonthly = cohortData['HOLD'].monthly
  const labels = downsample(baseMonthly).map((m) => m.d)

  const datasets = Object.entries(STRAT_CONFIG).map(([key, cfg]) => {
    const stratData = cohortData[key]
    const sampled = downsample(stratData.monthly)
    return {
      label: cfg.label,
      data: sampled.map((m) => Math.max(m.port, 0.001)), // log scale 0 방지
      borderColor: cfg.color,
      backgroundColor: cfg.color + '20',
      borderWidth: key === 'HOLD' ? 2.5 : 1.8,
      borderDash: cfg.dash ?? [],
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.1,
    }
  })

  const goalPlugin = {
    id: 'goalLine',
    afterDraw(chart: ChartJS) {
      const { ctx, scales } = chart
      const yScale = scales['y']
      if (!yScale) return
      const y = yScale.getPixelForValue(10)
      if (y < yScale.top || y > yScale.bottom) return
      ctx.save()
      ctx.strokeStyle = '#facc15'
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(scales['x'].left, y)
      ctx.lineTo(scales['x'].right, y)
      ctx.stroke()
      ctx.fillStyle = '#facc15'
      ctx.font = '11px sans-serif'
      ctx.fillText('목표 10억', scales['x'].right - 60, y - 5)
      ctx.restore()
    },
  }

  return (
    <div>
      {/* 코호트 탭 */}
      <div className="flex gap-2 mb-4 text-sm">
        {(['2000-01', '2007-10'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCohort(c)}
            className={`px-3 py-1 rounded-full border transition-colors ${
              cohort === c
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
            }`}
          >
            {c === '2000-01' ? '닷컴버블 (2000-01 진입)' : 'GFC (2007-10 진입)'}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => chartRef.current?.resetZoom()}
          className="absolute top-0 right-0 z-10 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
        >
          줌 초기화
        </button>
        <div style={{ height: 340 }}>
          <Line
            ref={chartRef}
            data={{ labels, datasets }}
            plugins={[goalPlugin]}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              scales: {
                x: {
                  ticks: {
                    maxTicksLimit: 10,
                    color: '#9ca3af',
                    font: { size: 11 },
                    callback: (_, i) => labels[i]?.slice(0, 7) ?? '',
                  },
                  grid: { color: '#1f2937' },
                },
                y: {
                  type: 'logarithmic',
                  min: 0.001,
                  ticks: {
                    color: '#9ca3af',
                    font: { size: 11 },
                    callback: (v) => {
                      const n = Number(v)
                      if ([0.01, 0.1, 1, 10, 100, 1000].includes(n)) return `${n}억`
                      return ''
                    },
                  },
                  grid: { color: '#1f2937' },
                },
              },
              plugins: {
                legend: {
                  labels: { color: '#9ca3af', font: { size: 11 }, boxWidth: 20, padding: 12 },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(1)}억`,
                  },
                },
                ...(pluginLoaded
                  ? {
                      zoom: {
                        pan: { enabled: true, mode: 'x' },
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
                      },
                    }
                  : {}),
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
          로그 스케일 &nbsp;|&nbsp; 휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
        </p>
      </div>

      {/* 패닉 발생 시점 */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        {Object.entries(STRAT_CONFIG)
          .filter(([k]) => cohortData[k]?.panic_date)
          .map(([k, cfg]) => (
            <div key={k}>
              <span style={{ color: cfg.color }}>●</span>{' '}
              {cfg.label}: {cohortData[k].panic_date} 패닉 발생
              {cohortData[k].completed
                ? ` → ${cohortData[k].years?.toFixed(1)}년 후 달성`
                : ' → 미달성'}
            </div>
          ))}
        <div>
          <span className="text-blue-400">●</span> 계속 매수:{' '}
          {cohortData['HOLD'].years?.toFixed(1)}년 후 달성
        </div>
      </div>
    </div>
  )
}
