'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useTheme } from '@/components/ThemeProvider'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface DataPoint {
  m: string
  stock: number
  cashRp: number
  voo: number
  living: number
}

interface Props {
  data: DataPoint[]
}

export default function AssetStackChart({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const chartRef = useRef<ChartJS<'bar'> | null>(null)
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

  const fmtEok = (v: number) => {
    if (v >= 10000) return `${(v / 10000).toFixed(0)}조`
    if (v >= 1) return `${v.toFixed(v >= 100 ? 0 : 1)}억`
    return `${(v * 10000).toFixed(0)}만`
  }

  const chartData = {
    labels: data.map(d => d.m),
    datasets: [
      {
        label: '주식',
        data: data.map(d => d.stock),
        backgroundColor: '#2563ebcc',
        stack: 'a',
        borderWidth: 0,
      },
      {
        label: '현금(RP)',
        data: data.map(d => d.cashRp),
        backgroundColor: '#059669cc',
        stack: 'a',
        borderWidth: 0,
      },
      {
        label: 'S&P500',
        data: data.map(d => d.voo),
        backgroundColor: '#9333eacc',
        stack: 'a',
        borderWidth: 0,
      },
      {
        label: '생활비',
        data: data.map(d => d.living),
        backgroundColor: '#f97316cc',
        stack: 'a',
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: tickColor,
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 12,
          callback: (_: unknown, i: number) => data[i]?.m.slice(0, 4) ?? '',
        },
        grid: { color: gridColor },
        border: { color: gridColor },
      },
      y: {
        stacked: true,
        ticks: {
          color: tickColor,
          font: { size: 11 },
          callback: (v: number | string) => fmtEok(Number(v)),
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
          filter: (item: { text: string }, chartData: { datasets: Array<{ data: number[] }> }) => {
            const ds = chartData.datasets.find(d => (d as { label?: string }).label === item.text)
            return ds ? ds.data.some(v => v > 0) : true
          },
        },
      },
      tooltip: {
        callbacks: {
          title: (items: Array<{ label: string }>) => items[0]?.label ?? '',
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${fmtEok(ctx.parsed.y)}억`,
        },
        backgroundColor: dark ? '#111827' : '#ffffff',
        borderColor: dark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleColor: tickColor,
        bodyColor: dark ? '#f9fafb' : '#111827',
        padding: 8,
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

  const resetZoom = () => chartRef.current?.resetZoom()

  return (
    <div className="relative">
      <button
        onClick={resetZoom}
        className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        줌 초기화
      </button>
      <div style={{ height: 260 }}>
        <Bar ref={chartRef} data={chartData} options={options as Parameters<typeof Bar>[0]['options']} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}
