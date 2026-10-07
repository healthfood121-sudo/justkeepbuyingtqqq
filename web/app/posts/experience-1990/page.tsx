'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'
import Header from '@/components/Header'
import { useTheme } from '@/components/ThemeProvider'

interface Row { m: string; total: number; low: number; living: number; state: '보유' | '현금'; ndx: number; vs_peak: number; trades: { d: string; a: string }[]; note: string }
interface Data { start: string; rows: Row[]; max_dd: number; withdrawn: number; final: number }

const STOPS: [string, string][] = [
  ['1990-01', '시작'], ['1990-08', '첫 폭락'], ['1998-08', '1998년'], ['2000-03', '닷컴 정점'], ['2002-10', '닷컴 바닥'],
  ['2008-09', '리먼'], ['2009-03', '금융위기 바닥'], ['2020-03', '코로나'], ['2022-12', '2022년'],
]

const eok = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString('ko-KR', { maximumFractionDigits: v >= 100 ? 0 : 1 })}억`
const man = (v: number) => v >= 10000 ? `${(v / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억` : `${v.toLocaleString('ko-KR')}만`

export default function Experience1990Page() {
  const [data, setData] = useState<Data | null>(null)
  const [i, setI] = useState(0)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  useEffect(() => { fetch('/data/experience_1990.json').then(r => r.json()).then(setData) }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const rows = data.rows.slice(0, i + 1)
    const peak = rows.reduce((a, b) => (b.total > a.total ? b : a))
    const peakLiv = Math.max(...rows.map(r => r.living))
    const withdrawn = rows.reduce((s, r) => s + r.living, 0)
    let since = 0
    for (let k = i; k >= 0 && data.rows[k].total < peak.total; k--) since++
    return { peak, peakLiv, withdrawn, since }
  }, [data, i])

  const grid = dark ? '#1f2937' : '#f3f4f6'
  const tick = dark ? '#9ca3af' : '#6b7280'
  const line = dark ? '#a78bfa' : '#7c3aed'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">← 목록으로</Link>
        <h1 className="text-3xl font-black leading-tight mb-4">−96%를 견딜 수 있나 — 1990년 은퇴자의 36년을 한 달씩</h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          1990년 1월, 10억으로 은퇴해 25% 룰로 꺼내 쓰기 시작했다고 하자. 숫자로 보면 &lsquo;연 22.4%&rsquo;지만, 그 안에서 사는 사람은 매달 통장을 본다.
          아래 버튼으로 한 달씩 넘기며 그때 총자산과 생활비가 어땠는지, 그리고 그때 규칙을 계속 지킬 수 있었을지 생각해 보자.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
          <Link href="/posts/withdrawal-guide" className="underline">인출식 방법론</Link>의 예시와 같은 경우 · 스왑금리·모든 매도 양도세·현금 이자 반영 · 신호 다음 거래일 매매 · 생활비는 매달 총자산의 0.3/0.5/0.7% · 물가 상승을 빼지 않은 금액
        </p>

        {!data || !stats ? <p className="text-xs text-gray-400 py-6 text-center">불러오는 중…</p> : (() => {
          const r = data.rows[i]
          const chart = data.rows.map((x, k) => ({ m: x.m, v: x.total, f: k <= i ? x.total : null }))
          return (
            <>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {STOPS.map(([m, l]) => {
                  const k = data.rows.findIndex(x => x.m === m)
                  return k < 0 ? null : (
                    <button key={m} onClick={() => setI(k)}
                      className={`text-xs px-2.5 py-1 rounded-full border ${i === k ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
                      {l}
                    </button>
                  )
                })}
                <button onClick={() => setI(data.rows.length - 1)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${i === data.rows.length - 1 ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
                  오늘
                </button>
              </div>

              <div className="rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/5 p-5 mb-4">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-2xl font-black font-mono">{r.m.replace('-', '년 ')}월</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.state === '보유' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                    {r.state === '보유' ? 'TQQQ 보유 중' : '현금 보유 중'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <div><p className="text-[11px] text-gray-500 dark:text-gray-400">총자산</p><p className="text-xl font-black">{eok(r.total)}</p></div>
                  <div><p className="text-[11px] text-gray-500 dark:text-gray-400">최고점 대비</p><p className={`text-xl font-black ${r.vs_peak < -50 ? 'text-red-600 dark:text-red-400' : ''}`}>{r.vs_peak.toFixed(0)}%</p></div>
                  <div><p className="text-[11px] text-gray-500 dark:text-gray-400">이번 달 생활비</p><p className="text-xl font-black">{man(r.living)}원</p></div>
                  <div><p className="text-[11px] text-gray-500 dark:text-gray-400">지금까지 꺼내 쓴 돈</p><p className="text-xl font-black">{man(stats.withdrawn)}원</p></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  지금까지 최고 {eok(stats.peak.total)} ({stats.peak.m}) · 가장 많이 받던 생활비 월 {man(stats.peakLiv)}원
                  {stats.since > 0 && <> · 최고점 아래에서 {stats.since}개월째</>}
                </p>
                {r.trades.length > 0 && (
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mt-2">
                    이번 달 매매: {r.trades.map(t => `${t.d.slice(5)} ${t.a}`).join(' · ')}
                  </p>
                )}
                {r.note && <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">📰 {r.note}</p>}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setI(Math.max(0, i - 12))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">−1년</button>
                <button onClick={() => setI(Math.max(0, i - 1))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">← 한 달</button>
                <input type="range" min={0} max={data.rows.length - 1} value={i} onChange={e => setI(Number(e.target.value))} className="flex-1 accent-purple-600" aria-label="달 선택" />
                <button onClick={() => setI(Math.min(data.rows.length - 1, i + 1))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">한 달 →</button>
                <button onClick={() => setI(Math.min(data.rows.length - 1, i + 12))} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700">+1년</button>
              </div>

              <div className="h-56 w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={grid} vertical={false} />
                    <XAxis dataKey="m" tick={{ fill: tick, fontSize: 10 }} tickFormatter={(x: string) => x.slice(0, 4)} minTickGap={40} axisLine={{ stroke: grid }} tickLine={false} />
                    <YAxis scale="log" domain={['auto', 'auto']} tickFormatter={(x: number) => eok(x)} tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                    <ReferenceLine x={r.m} stroke={line} strokeDasharray="3 3" />
                    <Line dataKey="v" stroke={dark ? '#374151' : '#e5e7eb'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line dataKey="f" stroke={line} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-10">월말 총자산 · 세로축 로그 눈금</p>
            </>
          )
        })()}

        <h2 className="text-xl font-bold mt-6 mb-4">이 36년에서 봐야 할 것</h2>
        <ul className="space-y-3 mb-8 text-sm text-gray-600 dark:text-gray-300 leading-relaxed list-disc pl-5">
          <li><strong>시작 7개월 만에 10억이 4억대가 됐다(1990년 8월).</strong> 은퇴 첫해에 자산이 절반 넘게 사라지는 경험을 먼저 한다.</li>
          <li><strong>2000년 3월 한때 1,099억이었다가 2008년 9월 47억이 됐다.</strong> 8년 반 동안 −96%. 그 사이 매도 신호에 팔고, 반등에 사고, 다시 팔기를 반복했다(2000년 한 해에만 매매 7번).</li>
          <li><strong>생활비는 한때 월 6억을 넘었다가 2009년 월 3,500만원이 됐다.</strong> 처음 생활비(월 200만원대)보다는 많지만, 익숙해진 생활에서 95%를 줄이는 일이다.</li>
          <li><strong>2000년 3월 월말 자산을 다시 넘기까지 18년이 넘게 걸렸다(2018년 8월).</strong> 그 기간 내내 규칙을 의심하지 않고 지키는 게 이 방법론의 진짜 조건이다.</li>
        </ul>
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl px-5 py-4 text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
          흔들림을 줄이는 방법(생활비 1년 고정, 현금 버퍼, 자산이 커지면 비중 낮추기)은{' '}
          <Link href="/posts/living-stability" className="underline">생활비 규칙·현금 버퍼 비교</Link>에, 더 나쁜 경우는{' '}
          <Link href="/posts/withdrawal-1929" className="underline">1929년 대공황 인출 시나리오</Link>에 있다.
        </div>
      </main>
    </div>
  )
}
