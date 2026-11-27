'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Header from '@/components/Header'
import { useTheme } from '@/components/ThemeProvider'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

type Key = 'RULE25' | 'S0' | 'HOLD3' | 'HOLD1'
// sig: 그날 종가로 홈 화면 '오늘의 신호'에 실제로 떴던 값 (첫날은 없음)
interface Sig {
  rsi: number | null; ema: number | null; peak: number | null; below: number | null
  act: Partial<Record<'RULE25' | 'S0' | 'D10GK', string>>; d10gk?: '보유' | '현금'
}
interface Row { d: string; ndx: number; tqqq: number | null; state: Record<'RULE25' | 'S0', '보유' | '현금'>; v: Record<Key, number>; est?: boolean; sig?: Sig }
interface Record_ { start: string; asof: string; days: number; now: Record<Key, number>; events: { d: string; k: string; from: string; to: string }[]; rows: Row[] }

const SERIES: { k: Key; label: string; light: string; dark: string }[] = [
  { k: 'RULE25', label: '25% 룰', light: '#7c3aed', dark: '#a78bfa' },
  { k: 'S0', label: 'S0', light: '#2563eb', dark: '#60a5fa' },
  { k: 'HOLD3', label: 'TQQQ 계속 보유', light: '#6b7280', dark: '#9ca3af' },
  { k: 'HOLD1', label: '나스닥100 보유', light: '#d97706', dark: '#fbbf24' },
]
const pct = (v: number) => `${v >= 100 ? '+' : ''}${(v - 100).toFixed(2)}%`
const sgn = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
const NAME: Record<string, string> = { RULE25: '25% 룰', S0: 'S0', D10GK: 'D10GK' }

// 그날 신호 한 줄 요약. tone: on(매매 신호) / near(D10GK 조건 충족했지만 보유 중) / off
function sigSummary(g: Sig): { text: string; tone: 'on' | 'near' | 'off' } {
  const on = Object.entries(g.act).filter(([, a]) => a && a !== '없음')
  if (on.length) return { text: on.map(([k, a]) => `${NAME[k]} ${a === 'LOC 매수 주문' ? 'LOC 매수 주문' : `${a} 신호`}`).join(' · '), tone: 'on' }
  if (g.rsi !== null && g.ema !== null && g.rsi < 30 && g.ema <= -10)
    return { text: g.d10gk === '보유' ? 'D10GK 재매수 조건 충족 (보유 중이라 할 일 없음)' : 'D10GK 재매수 조건 충족', tone: 'near' }
  return { text: '없음', tone: 'off' }
}

export default function LivePage() {
  const [rec, setRec] = useState<Record_ | null>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  useEffect(() => { fetch('/data/live_record.json').then(r => r.json()).then(setRec) }, [])
  const liveChartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    import('chartjs-plugin-zoom').then(({ default: zoomPlugin }) => {
      ChartJS.register(zoomPlugin)
      setPluginLoaded(true)
    })
  }, [])
  const grid = dark ? '#1f2937' : '#f3f4f6'
  const tick = dark ? '#9ca3af' : '#6b7280'

  const liveOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    scales: {
      x: {
        ticks: { color: tick, font: { size: 11 }, maxTicksLimit: 12, autoSkip: true },
        grid: { color: grid },
        border: { color: grid },
      },
      y: {
        ticks: {
          color: tick,
          font: { size: 11 },
          callback: (v: number | string) => {
            const d = Number(v) - 100
            return `${d >= 0 ? '+' : ''}${d.toFixed(0)}%`
          },
        },
        grid: { color: grid },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: dark ? '#111827' : '#ffffff',
        borderColor: dark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        titleColor: tick,
        bodyColor: dark ? '#f9fafb' : '#111827',
        padding: 8,
        callbacks: {
          title: (items: Array<{ label: string }>) => items[0]?.label ?? '',
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => {
            const v = ctx.parsed.y
            const pct = (v - 100).toFixed(2)
            return `${ctx.dataset.label}: ${v >= 100 ? '+' : ''}${pct}%`
          },
        },
      },
      ...(pluginLoaded ? {
        zoom: {
          pan: { enabled: true, mode: 'x' as const },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const },
        },
      } : {}),
    },
  } as Parameters<typeof Line>[0]['options']

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
              <div className="relative mb-8">
                <button
                  onClick={() => liveChartRef.current?.resetZoom()}
                  className="absolute top-0 right-0 z-10 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  줌 초기화
                </button>
                <div style={{ height: 256 }}>
                  <Line
                    ref={liveChartRef}
                    data={{
                      labels: rec.rows.map(r => r.d),
                      datasets: SERIES.map(s => ({
                        label: s.label,
                        data: rec.rows.map(r => r.v[s.k]),
                        borderColor: dark ? s.dark : s.light,
                        backgroundColor: dark ? s.dark : s.light,
                        borderWidth: s.k === 'RULE25' ? 2.5 : 1.5,
                        pointRadius: 0,
                        tension: 0,
                      })),
                    }}
                    options={liveOptions}
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
                  휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
                </p>
              </div>
            )}
            {rec.rows.length > 2 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 -mt-6 mb-8 text-[11px] text-gray-500 dark:text-gray-400">
                {SERIES.map(s => (
                  <span key={s.k} className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5" style={{ background: dark ? s.dark : s.light }} />{s.label}</span>
                ))}
                <span>· 시작 = 100 · 선이 겹치면 같은 결과 (둘 다 TQQQ 보유 중)</span>
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
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3 space-y-0.5">
              <p>날짜마다 그날 종가로 홈 화면 &lsquo;오늘의 신호&rsquo;에 실제로 떴던 값을 함께 남긴다. 기준에 닿은 칸은 빨간색이다.</p>
              <p>· <strong>최고가 대비</strong>: 1년 최고 종가에서 몇 % 내려왔는지 (−25%면 25% 룰 매도)</p>
              <p>· <strong>200일선 아래</strong>: 나스닥100이 200일 평균선 아래로 마감한 연속 일수 (15일이면 S0·D10GK 매도)</p>
              <p>· <strong>RSI · 200일선 대비</strong>: 14일 상대강도지수(RSI)와 200일 평균선에서 떨어진 정도. 현금일 때 둘이 같은 날 30 미만 · −10% 이하면 D10GK가 조기 재매수한다</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    {['날짜 (종가)', '나스닥100', 'TQQQ', '신호', '최고가 대비', '200일선 아래', 'RSI', '200일선 대비', '25% 룰 상태', '25% 룰', 'S0', 'TQQQ 보유', '나스닥100 보유'].map(h => (
                      <th key={h} className="py-2 px-2 text-left font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[...rec.rows].reverse().map(r => {
                    const g = r.sig
                    const sm = g ? sigSummary(g) : null
                    const hit = 'text-red-600 dark:text-red-400 font-semibold'
                    return (
                    <tr key={r.d} className={`text-gray-700 dark:text-gray-300 ${sm?.tone === 'on' ? 'bg-red-50 dark:bg-red-500/10' : sm?.tone === 'near' ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}>
                      <td className="py-1.5 px-2 font-mono whitespace-nowrap">{r.d}</td>
                      <td className="py-1.5 px-2 font-mono">{r.ndx.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="py-1.5 px-2 font-mono">{r.tqqq ? `$${r.tqqq.toFixed(2)}` : '—'}{r.est && <span className="text-gray-400"> (추정)</span>}</td>
                      <td className={`py-1.5 px-2 whitespace-nowrap ${sm?.tone === 'on' ? hit : sm?.tone === 'near' ? 'text-amber-700 dark:text-amber-300 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>{sm ? sm.text : '—'}</td>
                      <td className={`py-1.5 px-2 font-mono ${g?.peak != null && g.peak <= -25 ? hit : ''}`}>{g?.peak != null ? sgn(g.peak) : '—'}</td>
                      <td className={`py-1.5 px-2 font-mono whitespace-nowrap ${g?.below != null && g.below >= 15 ? hit : ''}`}>{g?.below != null ? (g.below > 0 ? `${g.below}/15일` : '0') : '—'}</td>
                      <td className={`py-1.5 px-2 font-mono ${g?.rsi != null && g.rsi < 30 ? hit : ''}`}>{g?.rsi != null ? g.rsi.toFixed(1) : '—'}</td>
                      <td className={`py-1.5 px-2 font-mono ${g?.ema != null && g.ema <= -10 ? hit : ''}`}>{g?.ema != null ? sgn(g.ema) : '—'}</td>
                      <td className="py-1.5 px-2">{r.state.RULE25}</td>
                      {SERIES.map(s => <td key={s.k} className="py-1.5 px-2 font-mono">{pct(r.v[s.k])}</td>)}
                    </tr>
                    )
                  })}
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
