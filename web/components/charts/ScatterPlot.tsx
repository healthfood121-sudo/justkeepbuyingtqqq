'use client'

import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip,
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

function linearRegression(data: { x: number; y: number }[]) {
  const n = data.length
  if (n < 2) return null
  const sumX = data.reduce((s, d) => s + d.x, 0)
  const sumY = data.reduce((s, d) => s + d.y, 0)
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0)
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const pt = payload[0]?.payload
  // 추세선 hover는 툴팁 숨김 (y값 없는 경우)
  if (pt?.y == null) return null
  const yr = Math.floor(pt.x)
  const mo = Math.round((pt.x - yr) * 12) + 1
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm shadow-md">
      <p className="text-gray-500 dark:text-gray-300">시작: {yr}년 {mo}월</p>
      <p className="text-gray-900 dark:text-white font-semibold">소요: {pt.y}년</p>
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

  const regA = dataA.length >= 2 ? linearRegression(dataA) : null
  const regB = dataB.length >= 2 ? linearRegression(dataB) : null
  const regC = dataC.length >= 2 ? linearRegression(dataC) : null

  // 추세선용 x 범위 (전체 데이터 기준)
  const allXs = [...dataA, ...dataB, ...dataC].map(d => d.x)
  const minX = allXs.length ? Math.min(...allXs) : 1971
  const maxX = allXs.length ? Math.max(...allXs) : 2026

  // 추세선 포인트 (50개로 부드럽게)
  const trendData = Array.from({ length: 50 }, (_, i) => {
    const x = minX + (maxX - minX) * (i / 49)
    return {
      x,
      ...(regA ? { trendA: Math.max(0, regA.slope * x + regA.intercept) } : {}),
      ...(regB ? { trendB: Math.max(0, regB.slope * x + regB.intercept) } : {}),
      ...(regC ? { trendC: Math.max(0, regC.slope * x + regC.intercept) } : {}),
    }
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={trendData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[minX - 0.5, maxX + 0.5]}
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

        {/* 산점도 */}
        {showA && dataA.length > 0 && (
          <Scatter name={LABELS.A} data={dataA} fill={COLORS.A} opacity={0.6} r={2} />
        )}
        {showB && dataB.length > 0 && (
          <Scatter name={LABELS.B} data={dataB} fill={COLORS.B} opacity={0.6} r={2} />
        )}
        {showC && dataC.length > 0 && (
          <Scatter name={LABELS.C} data={dataC} fill={COLORS.C} opacity={0.6} r={2} />
        )}

        {/* 추세선 (범례 제외) */}
        {regA && (
          <Line dataKey="trendA" stroke={COLORS.A} strokeWidth={2} strokeDasharray="6 3" dot={false} legendType="none" />
        )}
        {regB && (
          <Line dataKey="trendB" stroke={COLORS.B} strokeWidth={2} strokeDasharray="6 3" dot={false} legendType="none" />
        )}
        {regC && (
          <Line dataKey="trendC" stroke={COLORS.C} strokeWidth={2} strokeDasharray="6 3" dot={false} legendType="none" />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
