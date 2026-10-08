'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '@/components/ThemeProvider'

interface Sum {
  n: number; med: number; p10: number; worst: number; worst_start: string; dd: number; dd_max: number
  min_med: number; min_worst: number; lt10: number; w10_med: number; w10_p10: number
}
type V = 'pretech' | 'recent' | 'recent0' | 'harsh'
interface Data {
  meta: { variants: Record<V, string>; strategies: string[]; lev: string[] }
  summary: Record<V, Record<string, Sum>>
  depression: Record<V, Record<string, Sum>>
  actual_1971: Record<string, Sum>
  paths: Record<V, Record<string, Record<string, [string, number, number][]>>>
}

export const NAME: Record<string, string> = {
  RULE25: '25% 룰', S0: 'S0', D10GK: 'D10GK', RULE25C50: '25% 룰 + 자산 커지면 현금',
  HOLD3: 'TQQQ 계속 보유', HOLD1: '나스닥100(1배) 계속 보유',
  R25W67: '25% 룰 · TQQQ ⅔ + 현금 ⅓', R25W50: '25% 룰 · TQQQ ½ + 현금 ½', R25W33: '25% 룰 · TQQQ ⅓ + 현금 ⅔',
}
const VNAME: Record<V, string> = { recent: '최근 베타', pretech: '1971~1990 베타', recent0: '최근 베타 · 초과수익 없음', harsh: '가혹 (β 1.5)' }
const VARIANTS: V[] = ['recent', 'pretech', 'recent0', 'harsh']
const DATA_URL = '/posts/withdrawal-1929/data'

let cache: Promise<Data> | null = null
function useData() {
  const [d, setD] = useState<Data | null>(null)
  useEffect(() => {
    cache ??= fetch('/data/withdrawal_1929.json').then(r => r.json())
    cache.then(setD)
  }, [])
  return d
}
const Loading = () => <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>
const eok = (v: number) => v * 10000 < 1 ? '1만원 미만' : v < 1 ? `${Math.round(v * 10000).toLocaleString('ko-KR')}만원` : `${v.toFixed(1)}억`

function VariantTabs({ v, set }: { v: V; set: (v: V) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {VARIANTS.map(x => (
        <button key={x} onClick={() => set(x)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${v === x
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
          {VNAME[x]}
        </button>
      ))}
    </div>
  )
}

// 1929년 9월(등) 시작 — 총자산·월 생활비 경로
export function Path1929() {
  const data = useData()
  const [v, setV] = useState<V>('recent')
  const [start, setStart] = useState('1929-09')
  const { theme } = useTheme()
  const dark = theme === 'dark'
  if (!data) return <Loading />
  const keys = ['RULE25', 'R25W67', 'HOLD1', 'S0', 'HOLD3']
  const color: Record<string, [string, string]> = {
    RULE25: ['#7c3aed', '#a78bfa'], R25W67: ['#059669', '#34d399'], HOLD1: ['#d97706', '#fbbf24'], S0: ['#2563eb', '#60a5fa'], HOLD3: ['#9ca3af', '#6b7280'],
  }
  const base = data.paths[v].RULE25[start] ?? []
  const rows = base.map(([m], i) => {
    const r: Record<string, string | number> = { m }
    for (const k of keys) {
      const p = data.paths[v][k]?.[start]?.[i]
      if (p) { r[k] = Math.max(p[1], 0.005); r[`${k}_l`] = p[2] }
    }
    return r
  })
  const grid = dark ? '#1f2937' : '#f3f4f6'
  const tick = dark ? '#9ca3af' : '#6b7280'
  return (
    <div className="mb-6">
      <VariantTabs v={v} set={setV} />
      <div className="flex gap-1.5 mb-3 text-xs">
        {[['1929-09', '1929년 9월 (대공황 직전)'], ['1937-03', '1937년 3월 (두 번째 폭락 직전)'], ['1968-12', '1968년 12월 (1970년대 하락 직전)']].map(([s, l]) => (
          <button key={s} onClick={() => setStart(s)}
            className={`px-2.5 py-1 rounded-lg ${start === s ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{l}</button>
        ))}
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="m" tick={{ fill: tick, fontSize: 11 }} axisLine={{ stroke: grid }} tickLine={false} tickFormatter={(x: string) => x.slice(0, 4)} minTickGap={40} />
            <YAxis scale="log" domain={[0.005, 'auto']} allowDataOverflow tickFormatter={(x: number) => eok(x)} tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const r = payload[0].payload as Record<string, number>
                return (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-md">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">{label} · 총자산 / 그달 생활비</p>
                    {keys.filter(k => r[k] !== undefined).map(k => (
                      <p key={k} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <span className="inline-block w-2.5 h-0.5" style={{ background: color[k][dark ? 1 : 0] }} />
                        {NAME[k]} <strong className="ml-auto pl-3">{eok(r[k])}</strong>
                        <span className="text-gray-400">{Math.round(r[`${k}_l`]).toLocaleString('ko-KR')}만</span>
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            {keys.map(k => (
              <Line key={k} dataKey={k} stroke={color[k][dark ? 1 : 0]} strokeWidth={k === 'RULE25' ? 2.5 : 1.5}
                    strokeDasharray={k === 'HOLD3' ? '4 3' : undefined} dot={false} isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
        {keys.map(k => (
          <span key={k} className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: color[k][dark ? 1 : 0] }} />{NAME[k]}</span>
        ))}
        <span>· 처음 10억 · 30년까지 · 세로축 로그 눈금</span>
      </div>
    </div>
  )
}

// 전략별 요약 — 1929~1932 시작 / 1929~1970 전체
export function Summary1929() {
  const data = useData()
  const [v, setV] = useState<V>('recent')
  if (!data) return <Loading />
  const keys = ['RULE25', 'S0', 'D10GK', 'HOLD1', 'HOLD3']
  return (
    <div className="mb-3">
      <VariantTabs v={v} set={setV} />
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">{data.meta.variants[v]}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['전략', '1929~32 시작: 자산 최저점', '첫 10년 꺼내 쓴 돈 (중간)', '1929~70 시작: 인출 포함 연 수익률 중간', '하위 10%', '원금 아래로 끝남', ''].map(h => (
                <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {keys.map(k => {
              const g = data.summary[v][k], d = data.depression[v][k]
              return (
                <tr key={k} className={k === 'RULE25' ? 'bg-purple-50/60 dark:bg-purple-500/10' : ''}>
                  <td className="py-2 px-2 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{NAME[k]}</td>
                  <td className={`py-2 px-2 font-mono ${d.min_worst < 0.5 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-800 dark:text-gray-200'}`}>{eok(d.min_worst)}</td>
                  <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-700 dark:text-gray-300">{eok(g.w10_med)}</td>
                  <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-800 dark:text-gray-200">{g.med}%</td>
                  <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">{g.p10}%</td>
                  <td className={`py-2 px-2 font-mono ${g.lt10 > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{g.lt10}/{g.n}</td>
                  <td className="py-2 px-2"><Link href={`${DATA_URL}?v=${v}&s=${k}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// TQQQ 비중을 늘 낮춰 두기 — 평소 비용 vs 대공황 보호
export function Leverage1929() {
  const data = useData()
  if (!data) return <Loading />
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['25% 룰 + 늘 TQQQ 비중', '실제 1971~: 연 수익률 중간', '하위 10%', '1929~32 시작 자산 최저점 (최근 베타)', '(1971~1990 베타)', '(가혹)', ''].map(h => (
              <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.meta.lev.map(k => {
            const a = data.actual_1971[k]
            return (
              <tr key={k} className={k === 'R25W67' ? 'bg-green-50/60 dark:bg-green-500/10' : ''}>
                <td className="py-2 px-2 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{k === 'RULE25' ? '100% (지금 규칙)' : NAME[k].replace('25% 룰 · ', '')}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-800 dark:text-gray-200">{a.med}%</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">{a.p10}%</td>
                {(['recent', 'pretech', 'harsh'] as V[]).map(v => (
                  <td key={v} className={`py-2 px-2 font-mono ${data.depression[v][k].min_worst < 0.5 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{eok(data.depression[v][k].min_worst)}</td>
                ))}
                <td className="py-2 px-2"><Link href={`${DATA_URL}?v=recent&s=${k}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
