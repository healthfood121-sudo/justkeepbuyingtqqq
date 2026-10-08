'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { makeCdf } from '@/lib/backtest'
import type { CohortResult, CdfPoint } from '@/lib/types'
import { useTheme } from '@/components/ThemeProvider'

interface Props {
  resultsA: CohortResult[]
  resultsB: CohortResult[]
  resultsC: CohortResult[]
  showA?: boolean
  showB?: boolean
  showC?: boolean
}

type TipProps = { active?: boolean; payload?: { name?: string; dataKey?: string | number; value?: number; stroke?: string }[]; label?: string | number }

const CustomTooltip = ({ active, payload, label }: TipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm shadow-md">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}년 이내</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.stroke }}>{p.name}전략: {p.value?.toFixed(1)}%</p>
      ))}
    </div>
  )
}

export default function CdfChart({ resultsA, resultsB, resultsC, showA = true, showB = true, showC = true }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const tickColor = isDark ? '#9ca3af' : '#6b7280'
  const refLineColor = isDark ? '#4b5563' : '#d1d5db'

  const cdfA = makeCdf(resultsA)
  const cdfB = makeCdf(resultsB)
  const cdfC = makeCdf(resultsC)

  const maxYr = Math.max(
    cdfA.at(-1)?.year ?? 0,
    cdfB.at(-1)?.year ?? 0,
    cdfC.at(-1)?.year ?? 0,
  )

  // 특정 년도의 CDF 값: 범위 초과 시 마지막 값 유지 (0으로 떨어지지 않도록)
  const getVal = (cdf: CdfPoint[], yr: number) => {
    const p = cdf.find(p => p.year === yr)
    if (p) return p.pct
    const last = cdf.at(-1)
    if (last && yr > last.year) return last.pct
    return 0
  }

  const data = Array.from({ length: maxYr }, (_, i) => ({
    year: i + 1,
    ...(showA ? { A: getVal(cdfA, i + 1) } : {}),
    ...(showB ? { B: getVal(cdfB, i + 1) } : {}),
    ...(showC ? { C: getVal(cdfC, i + 1) } : {}),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="year"
          tick={{ fill: tickColor, fontSize: 11 }}
          stroke={axisColor}
          label={{ value: '경과 년수', position: 'insideBottom', offset: -12, fill: axisColor, fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: tickColor, fontSize: 11 }}
          stroke={axisColor}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 8 }}
          formatter={v => <span className="text-sm" style={{ color: tickColor }}>{v}전략</span>}
        />
        <ReferenceLine y={50} stroke={refLineColor} strokeDasharray="4 2" label={{ value: '50%', fill: axisColor, fontSize: 10 }} />
        <ReferenceLine y={80} stroke={refLineColor} strokeDasharray="4 2" label={{ value: '80%', fill: axisColor, fontSize: 10 }} />
        {showA && <Line type="monotone" dataKey="A" stroke="#10b981" strokeWidth={2} dot={false} name="A" />}
        {showB && <Line type="monotone" dataKey="B" stroke="#f59e0b" strokeWidth={2} dot={false} name="B" />}
        {showC && <Line type="monotone" dataKey="C" stroke="#3b82f6" strokeWidth={2} dot={false} name="C" />}
      </LineChart>
    </ResponsiveContainer>
  )
}
