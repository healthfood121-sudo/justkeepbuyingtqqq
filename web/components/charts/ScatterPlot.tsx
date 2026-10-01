'use client'

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import type { CohortResult } from '@/lib/types'

interface Props {
  resultsA: CohortResult[]
  resultsB: CohortResult[]
  resultsC: CohortResult[]
  showA?: boolean
  showB?: boolean
  showC?: boolean
}

const COLORS = { A: '#f59e0b', B: '#3b82f6', C: '#10b981' }
const LABELS = { A: 'A전략(한도후중단)', B: 'B전략(거치+계속)', C: 'C전략(계속적립)' }

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
    <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm">
      <p className="text-gray-300">시작: {yr}년 {mo}월</p>
      <p className="text-white font-semibold">소요: {y}년</p>
    </div>
  )
}

export default function ScatterPlot({ resultsA, resultsB, resultsC, showA = true, showB = true, showC = true }: Props) {
  const dataA = showA ? toScatterData(resultsA) : []
  const dataB = showB ? toScatterData(resultsB) : []
  const dataC = showC ? toScatterData(resultsC) : []

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          type="number"
          dataKey="x"
          domain={['auto', 'auto']}
          name="시작년도"
          tickFormatter={v => `${Math.floor(v)}`}
          stroke="#6b7280"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          label={{ value: '투자 시작 연도', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="소요기간"
          stroke="#6b7280"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          label={{ value: '소요기간(년)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-sm text-gray-300">{value}</span>}
          wrapperStyle={{ paddingTop: 8 }}
        />
        {showA && dataA.length > 0 && (
          <Scatter name={LABELS.A} data={dataA} fill={COLORS.A} opacity={0.7} r={2} />
        )}
        {showB && dataB.length > 0 && (
          <Scatter name={LABELS.B} data={dataB} fill={COLORS.B} opacity={0.7} r={2} />
        )}
        {showC && dataC.length > 0 && (
          <Scatter name={LABELS.C} data={dataC} fill={COLORS.C} opacity={0.7} r={2} />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  )
}
