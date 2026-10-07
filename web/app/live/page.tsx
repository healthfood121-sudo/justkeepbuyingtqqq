'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Header from '@/components/Header'
import { useTheme } from '@/components/ThemeProvider'

type Key = 'RULE25' | 'S0' | 'HOLD3' | 'HOLD1'
interface Row { d: string; ndx: number; tqqq: number | null; state: Record<'RULE25' | 'S0', '보유' | '현금'>; v: Record<Key, number>; est?: boolean }
interface Record_ { start: string; asof: string; days: number; now: Record<Key, number>; events: { d: string; k: string; from: string; to: string }[]; rows: Row[] }

const SERIES: { k: Key; label: string; light: string; dark: string }[] = [
  { k: 'RULE25', label: '25% 룰', light: '#7c3aed', dark: '#a78bfa' },
  { k: 'S0', label: 'S0', light: '#2563eb', dark: '#60a5fa' },
  { k: 'HOLD3', label: 'TQQQ 계속 보유', light: '#6b7280', dark: '#9ca3af' },
  { k: 'HOLD1', label: '나스닥100 보유', light: '#d97706', dark: '#fbbf24' },
]
const pct = (v: number) => `${v >= 100 ? '+' : ''}${(v - 100).toFixed(2)}%`

export default function LivePage() {
  const [rec, setRec] = useState<Record_ | null>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  useEffect(() => { fetch('/data/live_record.json').then(r => r.json()).then(setRec) }, [])
  const grid = dark ? '#1f2937' : '#f3f4f6'
  const tick = dark ? '#9ca3af' : '#6b7280'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black leading-tight mb-4">실제 운용 성적표</h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          홈 화면의 &lsquo;오늘의 신호&rsquo;를 그대로 따랐다면 실제 TQQQ 가격으로 얼마가 됐는지 매일 하나씩 쌓는다.
          사이트가 신호를 공개하기 시작한 2026년 10월 2일 종가를 100으로 놓았다.
        </p>
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-5 py-4 mb-8 text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
          <strong>왜 이 기록이 중요한가.</strong> 사이트의 모든 백테스트는 과거 데이터로 규칙을 고르고 같은 데이터로 성적을 낸 것이다.
          이 표는 규칙을 고른 뒤의 데이터, 즉 최적화에 쓰지 않은 데이터로 하는 독립 검증이다. 며칠·몇 달로는 아무것도 말할 수 없고, 몇 년이 쌓여야 의미가 생긴다.
          좋든 나쁘든 지우지 않고 그대로 남긴다.
        </div>

        {!rec ? <p className="text-xs text-gray-400 py-6 text-center">불러오는 중…</p> : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
              {SERIES.map(s => (
                <div key={s.k} className={`rounded-xl px-3 py-3 text-center ${s.k === 'RULE25' ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-gray-50 dark:bg-gray-900'}`}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{pct(rec.now[s.k])}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
              {rec.start} 종가 ~ {rec.asof} 종가 · {rec.days}거래일 · 세금·생활비 인출 제외 · 현금일 때 외화RP 이자(세후) · 신호 다음 거래일 종가에 매매
            </p>

            {rec.rows.length > 2 && (
              <div className="h-64 w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rec.rows.map(r => ({ d: r.d, ...r.v }))} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={grid} vertical={false} />
                    <XAxis dataKey="d" tick={{ fill: tick, fontSize: 11 }} axisLine={{ stroke: grid }} tickLine={false} minTickGap={40} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v) => (Number(v) - 100).toFixed(2) + '%'} />
                    {SERIES.map(s => (
                      <Line key={s.k} dataKey={s.k} name={s.label} stroke={dark ? s.dark : s.light} strokeWidth={s.k === 'RULE25' ? 2.5 : 1.5} dot={false} isAnimationActive={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <h2 className="text-lg font-bold mb-3">매매 기록</h2>
            {rec.events.length === 0
              ? <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">아직 매매가 없다. 공개 이후 25% 룰과 S0 모두 TQQQ를 계속 들고 있다.</p>
              : (
                <ul className="text-sm text-gray-700 dark:text-gray-300 mb-8 space-y-1">
                  {rec.events.map(e => (
                    <li key={e.d + e.k}><span className="font-mono">{e.d}</span> · {e.k === 'RULE25' ? '25% 룰' : e.k} {e.to === '현금' ? '전량 매도 → 현금' : '전액 매수'}</li>
                  ))}
                </ul>
              )}

            <h2 className="text-lg font-bold mb-3">날짜별 기록</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    {['날짜 (종가)', '나스닥100', 'TQQQ', '25% 룰 상태', '25% 룰', 'S0', 'TQQQ 보유', '나스닥100 보유'].map(h => (
                      <th key={h} className="py-2 px-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[...rec.rows].reverse().map(r => (
                    <tr key={r.d} className="text-gray-700 dark:text-gray-300">
                      <td className="py-1.5 px-2 font-mono">{r.d}</td>
                      <td className="py-1.5 px-2 font-mono">{r.ndx.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="py-1.5 px-2 font-mono">{r.tqqq ? `$${r.tqqq.toFixed(2)}` : '—'}{r.est && <span className="text-gray-400"> (추정)</span>}</td>
                      <td className="py-1.5 px-2">{r.state.RULE25}</td>
                      {SERIES.map(s => <td key={s.k} className="py-1.5 px-2 font-mono">{pct(r.v[s.k])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              매일 아침 신호와 함께 자동으로 한 줄씩 추가된다. TQQQ 종가를 받지 못한 날은 나스닥100 수익률 × 3으로 추정한다.
              백테스트 결과는 <Link href="/posts/withdrawal-guide" className="underline">인출식 방법론</Link>에 있다.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
