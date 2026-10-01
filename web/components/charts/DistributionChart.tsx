'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { makeDistribution } from '@/lib/backtest'
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
      <p className="text-gray-400 mb-1">{label}년 구간</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value.toFixed(1)}%</p>
      ))}
    </div>
  )
}

export default function DistributionChart({ resultsA, resultsB, resultsC }: Props) {
  const distA = makeDistribution(resultsA)
  const distB = makeDistribution(resultsB)
  const distC = makeDistribution(resultsC)

  const maxBin = Math.max(
    distA.at(-1)?.yearsBin ?? 0,
    distB.at(-1)?.yearsBin ?? 0,
    distC.at(-1)?.yearsBin ?? 0,
  )

  const data: { bin: string; A: number; B: number; C: number }[] = []
  for (let b = 0; b <= maxBin + 0.5; b += 0.5) {
    const key = Math.round(b * 10) / 10
    data.push({
      bin: key.toFixed(1),
      A: distA.find(d => d.yearsBin === key)?.pct ?? 0,
      B: distB.find(d => d.yearsBin === key)?.pct ?? 0,
      C: distC.find(d => d.yearsBin === key)?.pct ?? 0,
    })
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="bin"
          tick={{ fill: '#9ca3af', fontSize: 10 }}
          stroke="#6b7280"
          label={{ value: '소요기간(년)', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          stroke="#6b7280"
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: 8 }} formatter={v => <span className="text-sm text-gray-300">{v}전략</span>} />
        <Bar dataKey="A" fill="#f59e0b" opacity={0.8} name="A" />
        <Bar dataKey="B" fill="#3b82f6" opacity={0.8} name="B" />
        <Bar dataKey="C" fill="#10b981" opacity={0.8} name="C" />
      </BarChart>
    </ResponsiveContainer>
  )
}
