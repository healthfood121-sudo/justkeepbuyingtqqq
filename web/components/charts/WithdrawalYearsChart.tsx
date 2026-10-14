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
import { stratName } from '@/lib/strategyNames'

ChartJS.register(CategoryScale, LogarithmicScale, LineElement, PointElement, Tooltip, Legend)

// 시점별 통계 객체 (필드 이름은 metric으로 지정)
export type YearStat = object
export interface SeriesInput { name: string; label: string; byYear: Record<string, YearStat> }

// 전략별 고정 색 (검증된 범주형 팔레트, 선택 순서와 무관하게 전략마다 고정)
export const SERIES_COLORS: Record<string, { light: string; dark: string }> = {
  RULE25:   { light: '#2a78d6', dark: '#3987e5' },
  S0:    { light: '#eb6834', dark: '#d95926' },
  D10GK: { light: '#1baf7a', dark: '#199e70' },
  HOLD3: { light: '#a23ea3', dark: '#c25fc4' },
  DLEV:  { light: '#e87ba4', dark: '#d55181' },
  HOLD1: { light: '#008300', dark: '#008300' },
  C50:   { light: '#4a3aa7', dark: '#9085e9' },
  RULE30:   { light: '#e34948', dark: '#e66767' },
  QLD:   { light: '#0891b2', dark: '#06b6d4' },
}

const fmtEok = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${Math.round(v).toLocaleString('ko-KR')}억`
// 만원 단위 → 월 생활비 표기
export const fmtMan = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}억` : `${Math.round(v).toLocaleString('ko-KR')}만`

export default function WithdrawalYearsChart({
  series, years, metric, unit = 'eok',
}: { series: SeriesInput[]; years: number[]; metric: string; unit?: 'eok' | 'man' }) {
  const fmt = unit === 'man' ? fmtMan : fmtEok
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      ChartJS.register(zoomPlugin)
      setPluginLoaded(true)
    })
  }, [])

  const gridColor = dark ? '#1f2937' : '#f3f4f6'
  const tickColor = dark ? '#9ca3af' : '#6b7280'

  const labels = years.map(y => `${y}년`)

  const datasets = series.map(s => {
    const c = SERIES_COLORS[s.name]?.[dark ? 'dark' : 'light'] ?? tickColor
    return {
      label: s.label,
      data: years.map(y => {
        const v = s.byYear[String(y)]
        return v ? Math.max((v as Record<string, number>)[metric], 0.1) : null
      }),
      borderColor: c,
      backgroundColor: c,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 5,
      pointBackgroundColor: c,
      pointBorderColor: dark ? '#030712' : '#ffffff',
      pointBorderWidth: 2,
      spanGaps: true,
      tension: 0,
    }
  })

  // 마지막 데이터 포인트 오른쪽에 전략명 표시 (series ≤ 4인 경우)
  const lastLabelPlugin = {
    id: 'lastLabel',
    afterDraw(chart: ChartJS) {
      if (series.length > 4) return
      const ctx = chart.ctx
      ctx.save()
      ctx.font = '11px sans-serif'
      series.forEach((s, i) => {
        const meta = chart.getDatasetMeta(i)
        if (!meta.visible) return
        const lastPoint = meta.data[meta.data.length - 1]
        if (!lastPoint) return
        const c = SERIES_COLORS[s.name]?.[dark ? 'dark' : 'light'] ?? tickColor
        ctx.fillStyle = c
        ctx.fillText(stratName(s.name), lastPoint.x + 8, lastPoint.y + 4)
      })
      ctx.restore()
    },
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    layout: {
      padding: { right: series.length <= 4 ? 70 : 20 },
    },
    scales: {
      x: {
        ticks: {
          color: tickColor,
          font: { size: 12 },
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        type: 'logarithmic' as const,
        ticks: {
          color: tickColor,
          font: { size: 11 },
          maxTicksLimit: 7,
          callback: (v: number | string) => fmt(Number(v)),
        },
        grid: { color: gridColor },
        border: { display: false },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          font: { size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        backgroundColor: dark ? '#111827' : '#ffffff',
        borderColor: dark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleColor: tickColor,
        bodyColor: dark ? '#f9fafb' : '#111827',
        padding: 8,
        itemSort: (a: { parsed: { y: number } }, b: { parsed: { y: number } }) => b.parsed.y - a.parsed.y,
        callbacks: {
          title: (items: Array<{ label: string }>) => `시작 후 ${items[0]?.label ?? ''}`,
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
        },
      },
      ...(pluginLoaded ? {
        zoom: {
          pan: { enabled: true, mode: 'x' as const },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x' as const,
          },
        },
      } : {}),
    },
  }

  return (
    <div className="relative">
      <button
        onClick={() => chartRef.current?.resetZoom()}
        className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        줌 초기화
      </button>
      <div style={{ height: 320 }}>
        <Line
          ref={chartRef}
          data={{ labels, datasets }}
          options={options as Parameters<typeof Line>[0]['options']}
          plugins={[lastLabelPlugin]}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}
