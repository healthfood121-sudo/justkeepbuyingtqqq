'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '@/components/ThemeProvider'

interface Yearly { year: number; real: number; cost: number; fee: number; partial: boolean }
interface Etf {
  start: string; end: string; years: number
  cagr: { real: number; cost: number; fee: number }
  gap_cost: number; gap_fee: number
  final: { real: number; cost: number; fee: number }
  mdd: { real: number; cost: number; fee: number }
  roll5: { n: number; min: number; median: number; max: number } | null
  yearly: Yearly[]
  monthly: { m: string; real: number; cost: number; fee: number }[]
}
interface Data { asof: string; etfs: Record<'TQQQ' | 'QLD' | 'QQQ', Etf> }

const KEYS = ['TQQQ', 'QLD', 'QQQ'] as const
const NAME: Record<(typeof KEYS)[number], string> = { TQQQ: 'TQQQ (3배)', QLD: 'QLD (2배)', QQQ: '나스닥100 (1배)' }
const SERIES = [
  { k: 'real', label: '실제 가격', light: '#111827', dark: '#f9fafb' },
  { k: 'cost', label: '합성 (사이트 기본)', light: '#2563eb', dark: '#60a5fa' },
  { k: 'fee',  label: '합성 (운용보수만)', light: '#9ca3af', dark: '#6b7280' },
] as const

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
const mult = (v: number) => `${(v / 100).toLocaleString('ko-KR', { maximumFractionDigits: v >= 1000 ? 0 : 1 })}배`

export default function RealVsSynthetic({ part }: { part: 'summary' | 'chart' | 'yearly' }) {
  const [data, setData] = useState<Data | null>(null)
  const [etf, setEtf] = useState<(typeof KEYS)[number]>('TQQQ')
  const { theme } = useTheme()
  const dark = theme === 'dark'
  useEffect(() => { fetch('/data/real_vs_synthetic.json').then(r => r.json()).then(setData) }, [])
  if (!data) return <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>

  if (part === 'summary') {
    return (
      <div className="overflow-x-auto mb-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['종목', '기간', '실제 연평균', '합성 (사이트 기본)', '차이', '최대 낙폭 (실제 / 합성)'].map(h => (
                <th key={h} className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {KEYS.map(k => {
              const e = data.etfs[k]
              return (
                <tr key={k}>
                  <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{NAME[k]}</td>
                  <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.start.slice(0, 4)}~{e.end.slice(0, 4)} ({e.years.toFixed(0)}년)</td>
                  <td className="py-2.5 px-3 font-mono text-gray-800 dark:text-gray-200">{e.cagr.real.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400">{e.cagr.cost.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-green-600 dark:text-green-400 whitespace-nowrap">실제가 {e.gap_cost.toFixed(1)}%p 높음</td>
                  <td className="py-2.5 px-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.mdd.real.toFixed(1)}% / {e.mdd.cost.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const tabs = (
    <div className="flex gap-1.5 mb-4">
      {KEYS.map(k => (
        <button key={k} onClick={() => setEtf(k)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${etf === k
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
          {NAME[k]}
        </button>
      ))}
    </div>
  )
  const e = data.etfs[etf]

  if (part === 'chart') {
    const grid = dark ? '#1f2937' : '#f3f4f6'
    const tick = dark ? '#9ca3af' : '#6b7280'
    return (
      <div className="mb-6">
        {tabs}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {e.start}에 100을 넣었다면 → 실제 <strong className="text-gray-900 dark:text-white">{mult(e.final.real)}</strong>
          {' · '}합성(사이트 기본) <strong className="text-blue-600 dark:text-blue-400">{mult(e.final.cost)}</strong>
          {' · '}합성(운용보수만) {mult(e.final.fee)}
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={e.monthly} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="m" tick={{ fill: tick, fontSize: 11 }} axisLine={{ stroke: grid }} tickLine={false}
                     tickFormatter={(v: string) => v.slice(0, 4)} minTickGap={40} />
              <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow width={52}
                     tickFormatter={(v: number) => mult(v)} tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ stroke: tick, strokeDasharray: '3 3' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-md">
                      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                      {payload.map(p => (
                        <p key={String(p.dataKey)} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                          <span className="inline-block w-2.5 h-0.5" style={{ background: p.stroke as string }} />
                          {SERIES.find(s => s.k === p.dataKey)?.label}
                          <strong className="ml-auto pl-3">{mult(p.value as number)}</strong>
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              {SERIES.map(s => (
                <Line key={s.k} dataKey={s.k} stroke={dark ? s.dark : s.light} strokeWidth={s.k === 'real' ? 2.5 : 1.75}
                      strokeDasharray={s.k === 'fee' ? '4 3' : undefined} dot={false} activeDot={{ r: 3 }} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
          {SERIES.map(s => (
            <span key={s.k} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5" style={{ background: dark ? s.dark : s.light }} />{s.label}
            </span>
          ))}
          <span>· 세로축은 로그 눈금 (같은 간격 = 같은 배수)</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {tabs}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['연도', '실제', '합성 (사이트 기본)', '차이', '합성 (운용보수만)'].map(h => (
                <th key={h} className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {e.yearly.map(y => {
              const d = y.real - y.cost
              return (
                <tr key={y.year} className={y.partial ? 'opacity-60' : ''}>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{y.year}{y.partial && <span className="text-[10px] text-gray-400"> (일부)</span>}</td>
                  <td className="py-2 px-3 font-mono text-gray-800 dark:text-gray-200">{pct(y.real)}</td>
                  <td className="py-2 px-3 font-mono text-blue-600 dark:text-blue-400">{pct(y.cost)}</td>
                  <td className={`py-2 px-3 font-mono ${d >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{d >= 0 ? '+' : ''}{d.toFixed(1)}%p</td>
                  <td className="py-2 px-3 font-mono text-gray-400 dark:text-gray-500">{pct(y.fee)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {e.roll5 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          5년씩 들고 간 {e.roll5.n}가지 경우: 실제가 합성보다 연 {e.roll5.min.toFixed(1)}~{e.roll5.max.toFixed(1)}%p 높음 (보통 {e.roll5.median.toFixed(1)}%p)
        </p>
      )}
    </div>
  )
}
