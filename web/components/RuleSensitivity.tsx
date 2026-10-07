'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts'
import { useTheme } from '@/components/ThemeProvider'

interface Sum {
  n: number; med: number; p10: number; worst: number; dd: number
  trades10: number; quick: number; cash: number; lt10: number; eras: Record<string, number>
}
interface Episode { start: string; bottom: string; dd: number; after1y: number }
interface Data {
  meta: { thrs: number[]; days: number[]; sp_thrs: number[]; eras: string[]; sp_eras: string[] }
  grid: Record<string, Sum>
  s0: Record<string, Sum>
  window: Record<string, Sum>
  sp500: Record<string, Sum>
  episodes: { ndx: Episode[]; sp500: Episode[] }
}

const DATA_URL = '/posts/rule25-sensitivity/data'

function useData() {
  const [data, setData] = useState<Data | null>(null)
  useEffect(() => { fetch('/data/withdrawal_rule_sensitivity.json').then(r => r.json()).then(setData) }, [])
  return data
}

const Loading = () => <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>

function DataLink({ m, k }: { m: 'ndx' | 'sp500'; k: string }) {
  return <Link href={`${DATA_URL}?m=${m}&k=${k}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>
}

// 매도 기준 × 재매수 연속일 표 — 칸 색은 인출 포함 연 수익률 중간값
export function SensitivityGrid() {
  const data = useData()
  if (!data) return <Loading />
  const { thrs, days } = data.meta
  const vals = Object.values(data.grid).map(g => g.med)
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const bg = (v: number) => `rgba(37, 99, 235, ${(0.08 + 0.55 * (v - lo) / (hi - lo)).toFixed(2)})`
  return (
    <div className="overflow-x-auto mb-3">
      <table className="text-xs border-collapse mx-auto">
        <thead>
          <tr className="text-gray-500 dark:text-gray-400">
            <th className="py-1.5 px-2 text-left font-medium whitespace-nowrap">매도 기준 ↓ · 재매수 →</th>
            {days.map(d => <th key={d} className="py-1.5 px-2 font-medium whitespace-nowrap">{d}일</th>)}
          </tr>
        </thead>
        <tbody>
          {thrs.map(t => (
            <tr key={t}>
              <td className={`py-1 px-2 font-mono whitespace-nowrap ${t === 25 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>−{t}%</td>
              {days.map(d => {
                const g = data.grid[`${t}_${d}`]
                const me = t === 25 && d === 15
                return (
                  <td key={d} className="p-0.5">
                    <Link href={`${DATA_URL}?m=ndx&k=R${t}_${d}`} title={`하위 10% ${g.p10}% · 최대 낙폭 중간 −${g.dd}% · 매매 10년에 ${g.trades10}번`}
                      className={`block text-center font-mono rounded px-2 py-1 text-gray-900 dark:text-white hover:ring-1 hover:ring-blue-500 ${me ? 'ring-2 ring-purple-500 font-bold' : ''}`}
                      style={{ background: bg(g.med) }}>
                      {g.med.toFixed(1)}
                    </Link>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="border-t border-gray-200 dark:border-gray-700">
            <td className="py-1 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">S0 (200일선)</td>
            {days.map(d => (
              <td key={d} className="p-0.5">
                <Link href={`${DATA_URL}?m=ndx&k=S0_${d}`} className="block text-center font-mono rounded px-2 py-1 text-gray-500 dark:text-gray-400 hover:ring-1 hover:ring-blue-500">
                  {data.s0[String(d)].med.toFixed(1)}
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
        숫자 = 인출 포함 연 수익률 중간값(%) · 색이 진할수록 높음 · 보라 테두리 = 지금 규칙 (−25%, 15일) · 칸을 누르면 시작 시점별 데이터
      </p>
    </div>
  )
}

// 재매수 15일 고정, 매도 기준에 따른 중간값·하위 10% 선 그래프
export function SensitivityChart() {
  const data = useData()
  const { theme } = useTheme()
  const dark = theme === 'dark'
  if (!data) return <Loading />
  const rows = data.meta.thrs.map(t => ({ t, med: data.grid[`${t}_15`].med, p10: data.grid[`${t}_15`].p10 }))
  const grid = dark ? '#1f2937' : '#f3f4f6'
  const tick = dark ? '#9ca3af' : '#6b7280'
  const s0 = data.s0['15']
  return (
    <div className="mb-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <ReferenceArea x1={23} x2={33} fill={dark ? '#6d28d9' : '#ede9fe'} fillOpacity={dark ? 0.15 : 0.6} stroke="none" />
            <XAxis dataKey="t" tickFormatter={(v: number) => `−${v}%`} tick={{ fill: tick, fontSize: 11 }} axisLine={{ stroke: grid }} tickLine={false} />
            <YAxis domain={[10, 'auto']} tickFormatter={(v: number) => `${v}%`} tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <ReferenceLine x={25} stroke="#8b5cf6" strokeDasharray="3 3" />
            <ReferenceLine y={s0.med} stroke={tick} strokeDasharray="4 3" label={{ value: `S0 ${s0.med}%`, fill: tick, fontSize: 10, position: 'insideBottomLeft' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const g = data.grid[`${label}_15`]
                return (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-md">
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">매도 기준 −{label}%</p>
                    <p className="text-gray-600 dark:text-gray-300">중간 {g.med}% · 하위 10% {g.p10}%</p>
                    <p className="text-gray-400">매매 10년에 {g.trades10}번 · 최대 낙폭 중간 −{g.dd}%</p>
                  </div>
                )
              }}
            />
            <Line dataKey="med" stroke={dark ? '#60a5fa' : '#2563eb'} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
            <Line dataKey="p10" stroke={dark ? '#f87171' : '#dc2626'} strokeWidth={1.5} dot={{ r: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-blue-600 dark:bg-blue-400" />중간값</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-red-600 dark:bg-red-400" />하위 10%</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2 bg-violet-100 dark:bg-violet-900/40" />결과가 비슷한 구간 (−23~−33%)</span>
        <span>· 재매수 15일 고정</span>
      </div>
    </div>
  )
}

// 시기별 중간값 (재매수 15일) — 결과를 가른 시기 확인
export function SensitivityEras() {
  const data = useData()
  if (!data) return <Loading />
  const pick = [17, 20, 22, 23, 25, 28, 30, 35, 40]
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['매도 기준', '전체 중간', '하위 10%', ...data.meta.eras.map(e => `${e} 시작`), '매매/10년', '최대 낙폭', ''].map(h => (
              <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {pick.map(t => {
            const g = data.grid[`${t}_15`]
            return (
              <tr key={t} className={t === 25 ? 'bg-purple-50/60 dark:bg-purple-500/10 font-semibold' : ''}>
                <td className="py-2 px-2 font-mono text-gray-800 dark:text-gray-200">−{t}%</td>
                <td className="py-2 px-2 font-mono text-gray-800 dark:text-gray-200">{g.med}%</td>
                <td className="py-2 px-2 font-mono text-gray-500 dark:text-gray-400">{g.p10}%</td>
                {data.meta.eras.map(e => <td key={e} className="py-2 px-2 font-mono text-gray-600 dark:text-gray-300">{g.eras[e]}%</td>)}
                <td className="py-2 px-2 font-mono text-gray-500 dark:text-gray-400">{g.trades10}</td>
                <td className="py-2 px-2 font-mono text-gray-500 dark:text-gray-400">−{g.dd}%</td>
                <td className="py-2 px-2"><DataLink m="ndx" k={`R${t}_15`} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// 나스닥100 하락 구간 — 각 기준에서 매도했는지
export function SensitivityEpisodes() {
  const data = useData()
  if (!data) return <Loading />
  const cols = [20, 23, 25, 30]
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['하락 시작', '바닥', '최대 하락', '바닥 1년 뒤', ...cols.map(c => `−${c}% 룰`)].map(h => (
              <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.episodes.ndx.map(e => {
            const near = e.dd <= -20 && e.dd > -25
            return (
              <tr key={e.start} className={near ? 'bg-yellow-50 dark:bg-yellow-500/10' : ''}>
                <td className="py-1.5 px-2 font-mono text-gray-700 dark:text-gray-300">{e.start.slice(0, 7)}</td>
                <td className="py-1.5 px-2 font-mono text-gray-500 dark:text-gray-400">{e.bottom.slice(0, 7)}</td>
                <td className="py-1.5 px-2 font-mono text-gray-800 dark:text-gray-200">{e.dd}%</td>
                <td className={`py-1.5 px-2 font-mono ${e.after1y >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{e.after1y > 0 ? '+' : ''}{e.after1y}%</td>
                {cols.map(c => (
                  <td key={c} className="py-1.5 px-2 text-xs">
                    {e.dd < -c ? <span className="text-red-600 dark:text-red-400 font-semibold">매도</span> : <span className="text-gray-300 dark:text-gray-600">보유</span>}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        1년 최고 종가보다 15% 넘게 빠진 모든 하락 · 노란 줄 = 하락폭 20~25% (기준값에 따라 팔기도 하고 안 팔기도 한 하락) · 바닥 1년 뒤 = 바닥 종가 대비 1년 뒤 나스닥100 수익률
      </p>
    </div>
  )
}

// 최고 종가를 보는 기간
export function SensitivityWindow() {
  const data = useData()
  if (!data) return <Loading />
  const lab: Record<string, string> = { '126': '6개월', '252': '1년 (지금 규칙)', '504': '2년' }
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {Object.entries(data.window).map(([w, g]) => (
        <div key={w} className={`rounded-xl px-3 py-3 text-center ${w === '252' ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-gray-50 dark:bg-gray-900'}`}>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">최근 {lab[w]} 최고 종가</p>
          <p className="text-xl font-black text-gray-900 dark:text-white">{g.med}%</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">하위 10% {g.p10}%</p>
          {w !== '252' && <div className="mt-1"><DataLink m="ndx" k={`W${w}`} /></div>}
        </div>
      ))}
    </div>
  )
}

// S&P500으로 같은 규칙
export function SensitivitySp500() {
  const data = useData()
  if (!data) return <Loading />
  const keys = [...data.meta.sp_thrs.map(String), 'S0', 'HOLD']
  const label = (k: string) => k === 'S0' ? 'S0 (200일선 15일)' : k === 'HOLD' ? '신호 없이 계속 보유' : `−${k}% 룰`
  const dataKey = (k: string) => k === 'S0' ? 'SP_S0' : k === 'HOLD' ? 'SP_HOLD' : `SP${k}`
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['규칙', '중간', '하위 10%', '최악', '남은 자산 10억 미만', ...data.meta.sp_eras.map(e => `${e} 시작`), '매매/10년', ''].map(h => (
              <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {keys.map(k => {
            const g = data.sp500[k]
            return (
              <tr key={k} className={k === '25' ? 'bg-purple-50/60 dark:bg-purple-500/10 font-semibold' : k === 'S0' || k === 'HOLD' ? 'text-gray-500' : ''}>
                <td className="py-2 px-2 whitespace-nowrap text-gray-800 dark:text-gray-200">{label(k)}</td>
                <td className="py-2 px-2 font-mono text-gray-800 dark:text-gray-200">{g.med}%</td>
                <td className="py-2 px-2 font-mono text-gray-600 dark:text-gray-300">{g.p10}%</td>
                <td className="py-2 px-2 font-mono text-gray-500 dark:text-gray-400">{g.worst}%</td>
                <td className={`py-2 px-2 font-mono ${g.lt10 > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>{g.lt10}/{g.n}</td>
                {data.meta.sp_eras.map(e => <td key={e} className="py-2 px-2 font-mono text-gray-600 dark:text-gray-300">{g.eras[e]}%</td>)}
                <td className="py-2 px-2 font-mono text-gray-500 dark:text-gray-400">{g.trades10}</td>
                <td className="py-2 px-2"><DataLink m="sp500" k={dataKey(k)} /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
