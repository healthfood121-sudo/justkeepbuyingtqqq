'use client'

import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea,
} from 'recharts'
import { useTheme } from '@/components/ThemeProvider'
import type { SignalPoint } from '@/lib/emaSignal'

// 2색 팔레트 (dataviz 검증기 통과: 라이트 #ffffff / 다크 #111827 배경 기준)
const COLORS = {
  light: { close: '#2a78d6', ema: '#eb6834' },
  dark:  { close: '#3987e5', ema: '#d95926' },
}

const RANGES = [
  { key: '6m', label: '6개월', days: 126 },
  { key: '1y', label: '1년',   days: 252 },
  { key: '3y', label: '3년',   days: 756 },
] as const
type RangeKey = typeof RANGES[number]['key']

function fmtInt(v: number) {
  return Math.round(v).toLocaleString('en-US')
}

function fmtNum(v: number) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

function Swatch({ color, dashed = false }: { color: string; dashed?: boolean }) {
  return (
    <svg width="16" height="8" className="inline-block shrink-0" aria-hidden>
      <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 2' : undefined} />
    </svg>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, colors }: any) {
  if (!active || !payload?.length) return null
  const p: SignalPoint = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-md space-y-1">
      <p className="text-gray-500 dark:text-gray-400 font-mono">{p.date}</p>
      <p className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
        <Swatch color={colors.close} />나스닥100 종가 <span className="font-mono ml-auto">{fmtNum(p.close)}</span>
      </p>
      <p className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
        <Swatch color={colors.ema} dashed />200일 지수이동평균 <span className="font-mono ml-auto">{fmtNum(p.ema)}</span>
      </p>
      <p className="text-gray-500 dark:text-gray-400">
        이동평균 대비 <span className="font-mono">{fmtPct((p.close / p.ema - 1) * 100)}</span>
        {' · '}{p.holding ? '보유 중' : '현금 대기'}
      </p>
    </div>
  )
}

export default function EmaSignalChart({ history }: { history: SignalPoint[] }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const colors = isDark ? COLORS.dark : COLORS.light
  const gridColor = isDark ? '#1f2937' : '#f3f4f6'
  const tickColor = isDark ? '#9ca3af' : '#6b7280'
  const textColor = isDark ? '#e5e7eb' : '#374151'
  const cashFill = isDark ? '#9ca3af' : '#6b7280'

  const [range, setRange] = useState<RangeKey>('1y')
  const days = RANGES.find(r => r.key === range)!.days
  const data = useMemo(() => history.slice(-days), [history, days])

  // 현금 대기 구간 (연속된 날짜 묶음)
  const cashSpans = useMemo(() => {
    const spans: { x1: string; x2: string }[] = []
    let start: string | null = null
    data.forEach((p, i) => {
      if (!p.holding && start === null) start = p.date
      if (p.holding && start !== null) { spans.push({ x1: start, x2: data[i - 1].date }); start = null }
    })
    if (start !== null) spans.push({ x1: start, x2: data[data.length - 1].date })
    return spans
  }, [data])

  const last = data[data.length - 1]
  const lastIdx = data.length - 1
  const closeAbove = last ? last.close >= last.ema : true

  // 선 끝 이름표 — 두 값이 가까워도 겹치지 않게 위/아래로 벌림
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const endLabel = (name: string, up: boolean) => (props: any) => {
    if (props.index !== lastIdx) return null
    return (
      <text x={props.x + 6} y={props.y + (up ? -4 : 12)} fill={textColor} fontSize={11} fontWeight={600}>
        {name}
      </text>
    )
  }

  const recentRows = history.slice(-20).reverse()

  return (
    <div className="mt-4">
      {/* 기간 선택 + 범례 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                range === r.key
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Swatch color={colors.close} />나스닥100 종가</span>
          <span className="flex items-center gap-1"><Swatch color={colors.ema} dashed />200일 지수이동평균</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2.5 rounded-sm bg-gray-500/20" aria-hidden />현금 대기 구간
          </span>
        </div>
      </div>

      <div role="img" aria-label="최근 나스닥100 종가와 200일 지수이동평균 추이">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 10, right: 92, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={gridColor} />
            {cashSpans.map(s => (
              <ReferenceArea key={s.x1} x1={s.x1} x2={s.x2} fill={cashFill} fillOpacity={0.15} stroke="none" ifOverflow="hidden" />
            ))}
            <XAxis
              dataKey="date"
              tick={{ fill: tickColor, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
              minTickGap={40}
              tickFormatter={(d: string) => d.slice(2, 7).replace('-', '.')}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: tickColor, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={fmtInt}
            />
            <Tooltip
              content={<ChartTooltip colors={colors} />}
              cursor={{ stroke: tickColor, strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone" dataKey="ema" name="200일 지수이동평균"
              stroke={colors.ema} strokeWidth={2} strokeDasharray="5 3" dot={false}
              activeDot={{ r: 4, stroke: isDark ? '#111827' : '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
              label={endLabel('200일 이동평균', !closeAbove)}
            />
            <Line
              type="monotone" dataKey="close" name="나스닥100 종가"
              stroke={colors.close} strokeWidth={2} dot={false}
              activeDot={{ r: 4, stroke: isDark ? '#111827' : '#ffffff', strokeWidth: 2 }}
              isAnimationActive={false}
              label={endLabel('종가', closeAbove)}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 표 보기 */}
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          최근 20거래일 표로 보기
        </summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="py-1.5 px-2 text-left font-medium">날짜</th>
                <th className="py-1.5 px-2 text-right font-medium">종가</th>
                <th className="py-1.5 px-2 text-right font-medium">200일 지수이동평균</th>
                <th className="py-1.5 px-2 text-right font-medium">이동평균 대비</th>
                <th className="py-1.5 px-2 text-left font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-gray-700 dark:text-gray-300">
              {recentRows.map(p => {
                const pct = (p.close / p.ema - 1) * 100
                return (
                  <tr key={p.date}>
                    <td className="py-1 px-2">{p.date}</td>
                    <td className="py-1 px-2 text-right">{fmtNum(p.close)}</td>
                    <td className="py-1 px-2 text-right">{fmtNum(p.ema)}</td>
                    <td className={`py-1 px-2 text-right ${pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {fmtPct(pct)}
                    </td>
                    <td className="py-1 px-2 font-sans">{p.holding ? '보유 중' : '현금 대기'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
