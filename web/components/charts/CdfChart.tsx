'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { makeCdf } from '@/lib/backtest'
import type { CohortResult } from '@/lib/types'

interface Props {
  resultsA: CohortResult[]
  resultsB: CohortResult[]
  resultsC: CohortResult[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm">
      <p className="text-gray-400 mb-1">{label}년 이내</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.stroke }}>{p.name}전략: {p.value.toFixed(1)}%</p>
      ))}
    </div>
  )
}

export default function CdfChart({ resultsA, resultsB, resultsC }: Props) {
  const cdfA = makeCdf(resultsA)
  const cdfB = makeCdf(resultsB)
  const cdfC = makeCdf(resultsC)

  const maxYr = Math.max(
    cdfA.at(-1)?.year ?? 0,
    cdfB.at(-1)?.year ?? 0,
    cdfC.at(-1)?.year ?? 0,
  )

  const data = Array.from({ length: maxYr }, (_, i) => ({
    year: i + 1,
    A: cdfA.find(p => p.year === i + 1)?.pct ?? 0,
    B: cdfB.find(p => p.year === i + 1)?.pct ?? 0,
    C: cdfC.find(p => p.year === i + 1)?.pct ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="year"
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          stroke="#6b7280"
          label={{ value: '경과 년수', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          stroke="#6b7280"
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 8 }} formatter={v => <span className="text-sm text-gray-300">{v}전략</span>} />
        <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="4 2" label={{ value: '50%', fill: '#6b7280', fontSize: 10 }} />
        <ReferenceLine y={80} stroke="#4b5563" strokeDasharray="4 2" label={{ value: '80%', fill: '#6b7280', fontSize: 10 }} />
        <Line type="monotone" dataKey="A" stroke="#f59e0b" strokeWidth={2} dot={false} name="A" />
        <Line type="monotone" dataKey="B" stroke="#3b82f6" strokeWidth={2} dot={false} name="B" />
        <Line type="monotone" dataKey="C" stroke="#10b981" strokeWidth={2} dot={false} name="C" />
      </LineChart>
    </ResponsiveContainer>
  )
}
