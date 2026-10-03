'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { useTheme } from '@/components/ThemeProvider'

export type YearStat = Record<string, number>
export interface SeriesInput { name: string; label: string; byYear: Record<string, YearStat> }

// 전략별 고정 색 (검증된 범주형 팔레트, 선택 순서와 무관하게 전략마다 고정)
export const SERIES_COLORS: Record<string, { light: string; dark: string }> = {
  T25:   { light: '#2a78d6', dark: '#3987e5' },
  S0:    { light: '#eb6834', dark: '#d95926' },
  D10GK: { light: '#1baf7a', dark: '#199e70' },
  HOLD3: { light: '#eda100', dark: '#c98500' },
  DLEV:  { light: '#e87ba4', dark: '#d55181' },
  HOLD1: { light: '#008300', dark: '#008300' },
  C50:   { light: '#4a3aa7', dark: '#9085e9' },
  T30:   { light: '#e34948', dark: '#e66767' },
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
  const grid = dark ? '#1f2937' : '#f3f4f6'
  const tick = dark ? '#9ca3af' : '#6b7280'

  const data = years.map(y => {
    const row: Record<string, number | string> = { year: `${y}년` }
    for (const s of series) {
      const v = s.byYear[String(y)]
      if (v) row[s.name] = Math.max(v[metric], 0.1)
    }
    return row
  })
  const lastIdx = data.length - 1

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 70, bottom: 0, left: 10 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="year" tick={{ fill: tick, fontSize: 12 }} axisLine={{ stroke: grid }} tickLine={false} />
          <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow tickFormatter={fmt}
                 tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
          <Tooltip
            cursor={{ stroke: tick, strokeDasharray: '3 3' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const items = [...payload].sort((a, b) => (b.value as number) - (a.value as number))
              return (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-md">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">시작 후 {label}</p>
                  {items.map(p => (
                    <p key={p.dataKey as string} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      <span className="inline-block w-2.5 h-0.5" style={{ background: p.stroke as string }} />
                      {series.find(s => s.name === p.dataKey)?.label} <strong className="ml-auto pl-3">{fmt(p.value as number)}</strong>
                    </p>
                  ))}
                </div>
              )
            }}
          />
          {series.map(s => {
            const c = SERIES_COLORS[s.name]?.[dark ? 'dark' : 'light'] ?? tick
            return (
              <Line key={s.name} dataKey={s.name} stroke={c} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: dark ? '#030712' : '#ffffff', fill: c }}
                    activeDot={{ r: 5 }} isAnimationActive={false} connectNulls>
                {series.length <= 4 && (
                  <LabelList dataKey={s.name} content={(props) => {
                    const { x, y, index } = props as { x: number; y: number; index: number }
                    if (index !== lastIdx) return null
                    return <text x={x + 8} y={y + 4} fontSize={11} fill={tick}>{s.name}</text>
                  }} />
                )}
              </Line>
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
