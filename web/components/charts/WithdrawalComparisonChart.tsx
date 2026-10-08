'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { useTheme } from '@/components/ThemeProvider'

interface CohortStat { final: number; withdrawn: number; min: number; bankrupt: boolean; cagr: number }
interface CohortPoint { start: string; a: CohortStat; b: CohortStat }
interface MonthPoint { date: string; value: number; state?: string; is_invested?: boolean }
interface ComparisonData {
  cohorts: CohortPoint[]
  monthly_detail: Record<string, { a: MonthPoint[]; b: MonthPoint[] }>
}

const COHORT_LABELS: Record<string, string> = {
  '2000-03': '닷컴버블 정점 (2000-03)',
  '1996-10': '닷컴버블 직전 (1996-10)',
  '1999-03': '버블 상승 중 (1999-03)',
  '2003-03': '버블 바닥 이후 (2003-03)',
  '1989-05': '일본버블 직전 (1989-05)',
}

type TipProps = { active?: boolean; payload?: { name?: string; dataKey?: string | number; value?: number; stroke?: string }[]; label?: string | number }

const CustomTooltip = ({ active, payload, label }: TipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs shadow-md">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) + '억' : '–'}
        </p>
      ))}
    </div>
  )
}

const AllTooltip = ({ active, payload, label }: TipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-xs shadow-md">
      <p className="text-gray-400 mb-1">{label} 진입</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.stroke }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) + '억' : '파산'}
        </p>
      ))}
    </div>
  )
}

export default function WithdrawalComparisonChart({ data }: { data: ComparisonData }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const gridColor = isDark ? '#374151' : '#e5e7eb'
  const axisColor = isDark ? '#6b7280' : '#9ca3af'
  const tickColor = isDark ? '#9ca3af' : '#6b7280'

  const [tab, setTab] = useState<'monthly' | 'all'>('monthly')
  const availableCohorts = Object.keys(data.monthly_detail).sort()
  const [selectedCohort, setSelectedCohort] = useState(availableCohorts[3] ?? availableCohorts[0])

  // ── 월별 추이 ──
  const monthlyA = data.monthly_detail[selectedCohort]?.a ?? []
  const monthlyB = data.monthly_detail[selectedCohort]?.b ?? []
  const dateSet = new Set([...monthlyA.map(d => d.date), ...monthlyB.map(d => d.date)])
  const aMap = Object.fromEntries(monthlyA.map(d => [d.date, d.value]))
  const bMap = Object.fromEntries(monthlyB.map(d => [d.date, d.value]))
  const monthlyData = Array.from(dateSet).sort().map(date => ({
    date,
    'A안': aMap[date] ?? null,
    'B안': bMap[date] ?? null,
  }))

  // ── 전체 코호트 최종값 추이 ──
  const allData = data.cohorts.map(c => ({
    start: c.start,
    'A안': c.a.bankrupt ? null : c.a.final,
    'B안': c.b.bankrupt ? null : c.b.final,
  }))
  // 극단적 초기 코호트(1970년대)는 값이 너무 커 차트 왜곡 → 40억 캡
  const allDataCapped = allData.map(d => ({
    ...d,
    'A안': d['A안'] !== null ? Math.min(d['A안']!, 400) : null,
    'B안': d['B안'] !== null ? Math.min(d['B안']!, 400) : null,
  }))

  const tabClass = (t: string) =>
    `px-4 py-1.5 text-sm rounded-full transition-colors ${
      tab === t
        ? 'bg-blue-500 text-white'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-2 mb-5">
        <button className={tabClass('monthly')} onClick={() => setTab('monthly')}>주요 시작 시점 월별 추이</button>
        <button className={tabClass('all')} onClick={() => setTab('all')}>전체 시작 시점 최종값</button>
      </div>

      {/* ── 탭 1: 월별 추이 ── */}
      {tab === 'monthly' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableCohorts.map(k => (
              <button
                key={k}
                onClick={() => setSelectedCohort(k)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedCohort === k
                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-500'
                }`}
              >
                {COHORT_LABELS[k] ?? k}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            초기 10억에서 인출 시작. 세로 기준선 = 초기 투자액.
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="date"
                tick={{ fill: tickColor, fontSize: 10 }}
                stroke={axisColor}
                interval={23}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 10 }}
                stroke={axisColor}
                tickFormatter={v => `${v}억`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 6 }}
                formatter={v => <span style={{ color: tickColor, fontSize: 12 }}>{v}</span>}
              />
              <ReferenceLine
                y={10}
                stroke={isDark ? '#4b5563' : '#d1d5db'}
                strokeDasharray="4 2"
                label={{ value: '10억', fill: axisColor, fontSize: 9 }}
              />
              <Line type="monotone" dataKey="A안" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls name="A안 (SP500기반)" />
              <Line type="monotone" dataKey="B안" stroke="#10b981" strokeWidth={2} dot={false} connectNulls name="B안 (MA200기반)" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* ── 탭 2: 전체 코호트 최종값 ── */}
      {tab === 'all' && (
        <>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            각 진입 시점별 20년 후 잔여 자산(억). 400억 초과값은 400억으로 캡 처리.
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={allDataCapped} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="start"
                tick={{ fill: tickColor, fontSize: 10 }}
                stroke={axisColor}
                interval={47}
                tickFormatter={v => v.slice(0, 4)}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 10 }}
                stroke={axisColor}
                tickFormatter={v => `${v}억`}
              />
              <Tooltip content={<AllTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 6 }}
                formatter={v => <span style={{ color: tickColor, fontSize: 12 }}>{v}</span>}
              />
              <ReferenceLine
                y={10}
                stroke={isDark ? '#4b5563' : '#d1d5db'}
                strokeDasharray="4 2"
                label={{ value: '원금 10억', fill: axisColor, fontSize: 9 }}
              />
              <Line type="monotone" dataKey="A안" stroke="#3b82f6" strokeWidth={1.5} dot={false} connectNulls name="A안 (SP500기반)" />
              <Line type="monotone" dataKey="B안" stroke="#10b981" strokeWidth={1.5} dot={false} connectNulls name="B안 (MA200기반)" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
