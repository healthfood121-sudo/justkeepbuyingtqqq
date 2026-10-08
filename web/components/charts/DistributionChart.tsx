'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { makeDistribution } from '@/lib/backtest'
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

type TipProps = { active?: boolean; payload?: { name?: string; dataKey?: string | number; value?: number; stroke?: string; fill?: string }[]; label?: string | number }

const CustomTooltip = ({ active, payload, label }: TipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm shadow-md">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}년 구간</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value?.toFixed(1)}%</p>
      ))}
    </div>
  )
}

export default function DistributionChart({ resultsA, resultsB, resultsC, showA = true, showB = true, showC = true }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const tickColor = isDark ? '#9ca3af' : '#6b7280'

  const distA = makeDistribution(resultsA)
  const distB = makeDistribution(resultsB)
  const distC = makeDistribution(resultsC)

  const maxBin = Math.max(
    distA.at(-1)?.yearsBin ?? 0,
    distB.at(-1)?.yearsBin ?? 0,
    distC.at(-1)?.yearsBin ?? 0,
  )

  const data: { bin: string; A?: number; B?: number; C?: number }[] = []
  for (let b = 0; b <= maxBin + 0.5; b += 0.5) {
    const key = Math.round(b * 10) / 10
    data.push({
      bin: key.toFixed(1),
      ...(showA ? { A: distA.find(d => d.yearsBin === key)?.pct ?? 0 } : {}),
      ...(showB ? { B: distB.find(d => d.yearsBin === key)?.pct ?? 0 } : {}),
      ...(showC ? { C: distC.find(d => d.yearsBin === key)?.pct ?? 0 } : {}),
    })
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="bin"
          tick={{ fill: tickColor, fontSize: 10 }}
          stroke={axisColor}
          label={{ value: '소요기간(년)', position: 'insideBottom', offset: -12, fill: axisColor, fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: tickColor, fontSize: 11 }}
          stroke={axisColor}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 8 }}
          formatter={v => <span className="text-sm" style={{ color: tickColor }}>{v}전략</span>}
        />
        {showA && <Bar dataKey="A" fill="#10b981" opacity={0.8} name="A" />}
        {showB && <Bar dataKey="B" fill="#f59e0b" opacity={0.8} name="B" />}
        {showC && <Bar dataKey="C" fill="#3b82f6" opacity={0.8} name="C" />}
      </BarChart>
    </ResponsiveContainer>
  )
}
