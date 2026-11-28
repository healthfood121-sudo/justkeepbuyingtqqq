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

type Key = 'RULE25' | 'S0' | 'D10GK' | 'HOLD3' | 'HOLD1'
// sig: 그날 종가로 홈 화면 '오늘의 신호'에 실제로 떴던 값 (첫날은 없음)
//   s[전략].cnt = 보유 중이면 200일선 아래 연속일(15일이면 매도), 현금이면 위 연속일(15일이면 매수)
type Strat = 'RULE25' | 'S0' | 'D10GK'
interface StratSig { st: '보유' | '현금'; act: string; cnt?: number }
interface Sig { rsi: number | null; ema: number | null; peak: number | null; s: Partial<Record<Strat, StratSig>> }
interface Row { d: string; ndx: number; tqqq: number | null; state: Record<'RULE25' | 'S0' | 'D10GK', '보유' | '현금'>; v: Record<Key, number>; est?: boolean; sig?: Sig }
interface Record_ { start: string; asof: string; days: number; now: Record<Key, number>; events: { d: string; k: string; from: string; to: string }[]; rows: Row[] }

const SERIES: { k: Key; label: string; light: string; dark: string }[] = [
  { k: 'RULE25', label: '25% 룰', light: '#7c3aed', dark: '#a78bfa' },
  { k: 'S0', label: 'S0', light: '#2563eb', dark: '#60a5fa' },
  { k: 'D10GK', label: 'D10GK', light: '#059669', dark: '#34d399' },
  { k: 'HOLD3', label: 'TQQQ 계속 보유', light: '#6b7280', dark: '#9ca3af' },
  { k: 'HOLD1', label: '나스닥100 보유', light: '#d97706', dark: '#fbbf24' },
]
const pct = (v: number) => `${v >= 100 ? '+' : ''}${(v - 100).toFixed(2)}%`
const sgn = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
// 홈 화면 신호 파일의 전략별 최근 매매 (최신순). date=매매일, signal=신호가 켜진 날
type LastEv = { date: string; signal?: string; action: string }
type LastMap = Partial<Record<Strat, LastEv[]>>

// 표 머리글: 전략 이름 아래 마지막 매도·매수 신호 날짜
type LastCond = { date: string; state: '보유' | '현금' }

function LastSig({ ev, cond, big }: { ev?: LastEv[]; cond?: LastCond; big?: boolean }) {
  // D10GK: 보유 중에 RSI 매수 신호만 뜬 날이 마지막 매수보다 뒤면, 그날을 '마지막 매수 신호'로
  const buy = ev?.find(x => x.action === '매수')
  const c = cond && cond.state === '보유' && (!buy || cond.date > (buy.signal ?? buy.date)) ? cond : null
  if (!ev?.length && !c) return null
  return (
    <div className={big ? 'space-y-0.5 text-xs' : 'mt-0.5 space-y-px font-normal text-[10px] whitespace-nowrap'}>
      {(['매도', '매수'] as const).map(a => {
        const e = ev?.find(x => x.action === a)
        if (!e && !(a === '매수' && c)) return null
        const d = a === '매수' && c ? c.date : (e!.signal ?? e!.date)
        return (
          <div key={a} className="text-gray-500 dark:text-gray-400">
            <span className={a === '매도' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}>마지막 {a} 신호</span>{' '}
            <span className="font-mono">{d}</span>
            {a === '매수' && c
              ? <span className="text-gray-400 dark:text-gray-500"> → 이미 보유 중이라 매매 없음{e ? ` (${e.date}부터 보유)` : ''}</span>
              : d !== e!.date && <span className="text-gray-400 dark:text-gray-500"> → {e!.date.slice(5)} {a}</span>}
          </div>
        )
      })}
    </div>
  )
}

const TABS: { k: Strat; label: string; main?: boolean; rule: string }[] = [
  { k: 'RULE25', label: '25% 룰', main: true, rule: '1년 최고 종가보다 25% 떨어지면 매도, 현금일 때 200일 평균선 위로 15일 연속이면 재매수. ‘최고가 대비’가 −25%에 닿으면 빨간색' },
  { k: 'S0', label: 'S0', rule: '200일 평균선 아래로 15일 연속 마감하면 매도, 현금일 때 위로 15일 연속이면 재매수' },
  { k: 'D10GK', label: 'D10GK', rule: 'S0와 같은 매도 규칙에, 14일 상대강도지수(RSI) 30 미만이면서 200일선 대비 −10% 이하인 날 종가로 조기 재매수. 조건 칸은 기준에 닿으면 빨간색' },
]

const HIT = 'text-red-600 dark:text-red-400 font-semibold'
const GROUP = 'border-l border-gray-200 dark:border-gray-700'

// 상태 칩 + 그날 할 일
function StateCell({ t, extra }: { t?: StratSig; extra?: string | null }) {
  if (!t) return <td className={`py-1.5 px-2 text-gray-300 dark:text-gray-600 ${GROUP}`}>—</td>
  const act = t.act && t.act !== '없음' ? t.act : null
  return (
    <td className={`py-1.5 px-2 whitespace-nowrap ${GROUP}`}>
      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold mr-1.5 ${
        t.st === '보유'
          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
        {t.st === '보유' ? '보유' : '현금'}
      </span>
      {act
        ? <span className={act === 'LOC 매수 주문' ? 'text-purple-700 dark:text-purple-300 font-semibold' : HIT}>
            {act === 'LOC 매수 주문' ? act : `${act} 신호`}
          </span>
        : extra
          ? <span className="text-amber-700 dark:text-amber-300 font-semibold">{extra}</span>
          : <span className="text-gray-300 dark:text-gray-600" title="할 일 없음">–</span>}
    </td>
  )
}

// 200일선 연속일: 보유면 아래 n/15 (매도까지), 현금이면 위 n/15 (매수까지)
function CountCell({ t }: { t?: StratSig }) {
  if (!t || t.cnt === undefined) return <td className="py-1.5 px-2 text-gray-300 dark:text-gray-600">—</td>
  const n = t.cnt
  return (
    <td className={`py-1.5 px-2 font-mono whitespace-nowrap ${n >= 15 ? HIT : n >= 10 ? 'text-amber-700 dark:text-amber-300' : ''}`}>
      {n === 0 ? <span className="text-gray-400 dark:text-gray-500">0</span> : `${t.st === '보유' ? '아래' : '위'} ${n}/15일`}
    </td>
  )
}

export default function LivePage() {
  const [rec, setRec] = useState<Record_ | null>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'
  useEffect(() => { fetch('/data/live_record.json').then(r => r.json()).then(setRec) }, [])
  const [last, setLast] = useState<LastMap>({})
  const [d10Cond, setD10Cond] = useState<LastCond | undefined>()
  const [tab, setTab] = useState<Strat>('RULE25')
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('s')
    if (q === 'RULE25' || q === 'S0' || q === 'D10GK') setTab(q)
  }, [])
  const pickTab = (k: Strat) => {
    setTab(k)
    const u = new URL(window.location.href)
    if (k === 'RULE25') u.searchParams.delete('s'); else u.searchParams.set('s', k)
    window.history.replaceState(null, '', u.toString())
  }
  useEffect(() => {
    fetch('/data/withdrawal_signal.json')
      .then(r => r.json())
      .then(j => {
        const m: LastMap = {}
        for (const k of ['RULE25', 'S0', 'D10GK'] as Strat[]) m[k] = j.strategies?.[k]?.last_events
        setLast(m)
        setD10Cond(j.strategies?.D10GK?.last_cond)
      })
      .catch(() => {})
  }, [])
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
              {SERIES.map(s => (
                <div key={s.k} className={`rounded-xl px-3 py-3 text-center ${s.k === 'RULE25' ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-gray-50 dark:bg-gray-900'}`}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}{s.k === 'RULE25' ? <span className="text-purple-600 dark:text-purple-300 font-semibold"> (메인)</span> : (s.k === 'S0' || s.k === 'D10GK') ? ' (비교)' : ''}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{pct(rec.now[s.k])}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
              {rec.start} 종가 ~ {rec.asof} 종가 · {rec.days}거래일 · 세금·생활비 인출 제외 · 현금일 때 외화RP 이자(세후) · 신호 다음 거래일 종가에 매매 (D10GK 조기 재매수만 신호 당일 종가 LOC 주문)
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
              ? <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">아직 매매가 없다. 공개 이후 25% 룰 · S0 · D10GK 모두 TQQQ를 계속 들고 있다.</p>
              : (
                <ul className="text-sm text-gray-700 dark:text-gray-300 mb-8 space-y-1">
                  {rec.events.map(e => (
                    <li key={e.d + e.k}><span className="font-mono">{e.d}</span> · {e.k === 'RULE25' ? '25% 룰' : e.k} {e.to === '현금' ? '전량 매도 → 현금' : '전액 매수'}</li>
                  ))}
                </ul>
              )}

            <h2 className="text-lg font-bold mb-3">날짜별 기록</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
              날짜마다 그날 종가로 홈 화면 &lsquo;오늘의 신호&rsquo;에 떴던 값을 남긴다. 내가 따르는 전략을 골라서 보면 된다.
            </p>
            <div className="flex gap-1.5 mb-3" role="tablist">
              {TABS.map(t => (
                <button
                  key={t.k}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.k}
                  onClick={() => pickTab(t.k)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                    tab === t.k
                      ? 'bg-purple-600 border-purple-600 text-white dark:bg-purple-500 dark:border-purple-500'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                >
                  {t.label}
                  {t.main
                    ? <span className={`ml-1 text-xs ${tab === t.k ? 'text-purple-100' : 'text-purple-600 dark:text-purple-300'}`}>(메인)</span>
                    : <span className={`ml-1 text-xs font-normal ${tab === t.k ? 'text-purple-100' : 'text-gray-400 dark:text-gray-500'}`}>(비교)</span>}
                </button>
              ))}
            </div>
            {(() => {
              const T = TABS.find(t => t.k === tab)!
              return (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900 px-3 py-2 mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{T.rule}</p>
                  <LastSig big ev={last[tab]} cond={tab === 'D10GK' ? d10Cond : undefined} />
                </div>
              )
            })()}
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">
              상태: 그날 종가 이후 TQQQ 보유/현금 · &lsquo;–&rsquo;는 할 일 없음 · 누적: 2026-10-02 종가 대비 수익률
            </p>
            <div className="overflow-x-auto lg:-mx-24">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    {[
                      '날짜', '나스닥100', 'TQQQ', '상태 · 할 일',
                      ...(tab === 'RULE25' ? ['최고가 대비'] : tab === 'S0' ? ['200일선 연속'] : ['200일선 연속', 'RSI · 200일선']),
                      `${TABS.find(t => t.k === tab)!.label} 누적`, 'TQQQ 보유', '나스닥100',
                    ].map((h, i) => (
                      <th key={i} className={`py-2 px-2 text-left font-medium whitespace-nowrap ${i === 0 ? 'sticky left-0 z-10 bg-white dark:bg-gray-950' : ''} ${h === '나스닥100' ? 'hidden sm:table-cell' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {[...rec.rows].reverse().map(r => {
                    const g = r.sig
                    const t = g?.s[tab]
                    const rsiOk = g?.rsi != null && g.rsi < 30
                    const emaOk = g?.ema != null && g.ema <= -10
                    // D10GK 보유 중에 RSI 매수 신호가 뜬 날 (예: 2026-11-20)
                    const extra = tab === 'D10GK' && t?.st === '보유' && rsiOk && emaOk ? '매수 신호 (보유 중)' : null
                    return (
                    <tr key={r.d} className="text-gray-700 dark:text-gray-300">
                      <td className="py-1.5 px-2 font-mono whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-gray-950">{r.d}</td>
                      <td className="py-1.5 px-2 font-mono hidden sm:table-cell">{r.ndx.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="py-1.5 px-2 font-mono whitespace-nowrap">{r.tqqq ? `$${r.tqqq.toFixed(2)}` : '—'}{r.est && <span className="text-gray-400"> (추정)</span>}</td>
                      <StateCell t={t} extra={extra} />

                      {tab === 'RULE25' && (t?.st === '현금'
                        ? <CountCell t={t} />
                        : <td className={`py-1.5 px-2 font-mono ${g?.peak != null && g.peak <= -25 ? HIT : g?.peak != null && g.peak <= -20 ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                            {g?.peak != null ? sgn(g.peak) : '—'}
                          </td>)}
                      {tab !== 'RULE25' && <CountCell t={t} />}
                      {tab === 'D10GK' && (
                        <td className="py-1.5 px-2 font-mono whitespace-nowrap">
                          {g?.rsi != null && g?.ema != null ? (
                            <>
                              <span className={rsiOk ? HIT : ''}>{g.rsi.toFixed(1)}</span>
                              <span className="text-gray-400"> · </span>
                              <span className={emaOk ? HIT : ''}>{sgn(g.ema)}</span>
                              {rsiOk && emaOk && <span className="ml-1 text-amber-700 dark:text-amber-300 font-sans font-semibold">충족</span>}
                            </>
                          ) : '—'}
                        </td>
                      )}

                      <td className={`py-1.5 px-2 font-mono font-semibold ${GROUP}`}>{pct(r.v[tab])}</td>
                      <td className="py-1.5 px-2 font-mono text-gray-500 dark:text-gray-400">{pct(r.v.HOLD3)}</td>
                      <td className="py-1.5 px-2 font-mono text-gray-500 dark:text-gray-400 hidden sm:table-cell">{pct(r.v.HOLD1)}</td>
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
