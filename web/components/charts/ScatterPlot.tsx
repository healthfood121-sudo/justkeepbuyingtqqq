'use client'

import { useState, useCallback } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import type { CohortResult } from '@/lib/types'
import { useTheme } from '@/components/ThemeProvider'

interface Props {
  resultsA: CohortResult[]
  resultsB: CohortResult[]
  resultsC: CohortResult[]
  showA?: boolean
  showB?: boolean
  showC?: boolean
}

const COLORS = { A: '#10b981', B: '#f59e0b', C: '#3b82f6' }
const LABELS = { A: 'A전략(계속적립)', B: 'B전략(한도후중단)', C: 'C전략(거치+계속)' }

function toScatterData(results: CohortResult[]) {
  return results
    .filter(r => r.status === 'completed' && r.yearsToTarget !== null)
    .map(r => ({
      x: r.startDate.getFullYear() + r.startDate.getMonth() / 12,
      y: Math.round(r.yearsToTarget! * 100) / 100,
    }))
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const { x, y } = payload[0].payload
  const yr = Math.floor(x)
  const mo = Math.round((x - yr) * 12) + 1
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm shadow-md">
      <p className="text-gray-500 dark:text-gray-300">시작: {yr}년 {mo}월</p>
      <p className="text-gray-900 dark:text-white font-semibold">소요: {y}년</p>
    </div>
  )
}

export default function ScatterPlot({ resultsA, resultsB, resultsC, showA = true, showB = true, showC = true }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const tickColor = isDark ? '#9ca3af' : '#6b7280'

  const dataA = showA ? toScatterData(resultsA) : []
  const dataB = showB ? toScatterData(resultsB) : []
  const dataC = showC ? toScatterData(resultsC) : []

  const allXs = [...dataA, ...dataB, ...dataC].map(d => d.x)
  const absMin = allXs.length ? Math.floor(Math.min(...allXs)) : 1971
  const absMax = allXs.length ? Math.ceil(Math.max(...allXs)) : 2026

  const [domain, setDomain] = useState<[number, number]>([absMin, absMax])
  const isZoomed = domain[0] !== absMin || domain[1] !== absMax

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setDomain(([min, max]) => {
      const range = max - min
      const factor = e.deltaY < 0 ? 0.85 : 1.15   // 휠 업=줌인, 다운=줌아웃
      const newRange = range * factor
      const center = (min + max) / 2
      return [
        Math.max(absMin, center - newRange / 2),
        Math.min(absMax, center + newRange / 2),
      ]
    })
  }, [absMin, absMax])

  const resetZoom = () => setDomain([absMin, absMax])

  return (
    <div className="relative">
      {isZoomed && (
        <button
          onClick={resetZoom}
          className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          줌 초기화
        </button>
      )}
      <div onWheel={handleWheel} style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              dataKey="x"
              domain={domain}
              tickFormatter={v => `${Math.floor(v)}`}
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 11 }}
              label={{ value: '투자 시작 연도', position: 'insideBottom', offset: -12, fill: axisColor, fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              stroke={axisColor}
              tick={{ fill: tickColor, fontSize: 11 }}
              label={{ value: '소요기간(년)', angle: -90, position: 'insideLeft', fill: axisColor, fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-sm" style={{ color: tickColor }}>{value}</span>}
              wrapperStyle={{ paddingTop: 8 }}
            />
            {showA && dataA.length > 0 && (
              <Scatter name={LABELS.A} data={dataA} fill={COLORS.A} opacity={0.7} r={1} />
            )}
            {showB && dataB.length > 0 && (
              <Scatter name={LABELS.B} data={dataB} fill={COLORS.B} opacity={0.7} r={1} />
            )}
            {showC && dataC.length > 0 && (
              <Scatter name={LABELS.C} data={dataC} fill={COLORS.C} opacity={0.7} r={1} />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">마우스 휠로 X축 확대/축소</p>
    </div>
  )
}
