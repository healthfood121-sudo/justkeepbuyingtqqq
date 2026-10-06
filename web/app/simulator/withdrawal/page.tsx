'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, LabelList,
} from 'recharts'
import Header from '@/components/Header'
import CostToggle from '@/components/CostToggle'
import { useTheme } from '@/components/ThemeProvider'
import { SERIES_COLORS } from '@/components/charts/WithdrawalYearsChart'
import { stratName } from '@/lib/strategyNames'
import { buildMarket, runWithdrawal, STRATS, type Market, type SimResult, type StratKey } from '@/lib/withdrawalEngine'

const EOK = 1e8
const COMPARE: StratKey[] = ['S0', 'HOLD3']

const fmtEok = (v: number) =>
  v >= 10000 ? `${(v / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조`
    : `${v.toLocaleString('ko-KR', { maximumFractionDigits: v >= 100 ? 0 : v >= 1 ? 1 : 2 })}억`
const fmtMan = (v: number) =>
  v >= 10000 ? `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}억` : `${Math.round(v).toLocaleString('ko-KR')}만`

async function loadMarket(): Promise<Market> {
  const [csv, fedRows] = await Promise.all([
    fetch('/ndx.csv').then(r => r.text()),
    fetch('/data/fed_funds_rate.json').then(r => r.json()) as Promise<{ date: string; rate: number }[]>,
  ])
  const dates: string[] = [], closes: number[] = []
  for (const line of csv.trim().split('\n').slice(1)) {
    const [d, c] = line.split(',')
    if (d && c) { dates.push(d); closes.push(Number(c)) }
  }
  const fed = Object.fromEntries(fedRows.map(r => [r.date.slice(0, 7), Number(r.rate)]))
  return buildMarket(dates, closes, fed)
}

function Simulator() {
  const params = useSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [market, setMarket] = useState<Market | null>(null)
  useEffect(() => { loadMarket().then(setMarket) }, [])

  // URL: ?start=YYYY-MM(-DD)&amt=억&fee=1&cmp=S0,HOLD3
  const start = params.get('start') ?? '2000-03'
  const amt = Math.max(0.1, Number(params.get('amt')) || 10)
  const withCosts = params.get('fee') !== '1'
  const cmp = (params.get('cmp') ?? 'S0').split(',').filter((k): k is StratKey => COMPARE.includes(k as StratKey))
  const [amtInput, setAmtInput] = useState(String(amt))
  useEffect(() => { setAmtInput(String(amt)) }, [amt])

  const go = (o: { start?: string; amt?: number; fee?: boolean; cmp?: StratKey[] }) => {
    const q = new URLSearchParams()
    q.set('start', o.start ?? start)
    q.set('amt', String(o.amt ?? amt))
    if (o.fee ?? !withCosts) q.set('fee', '1')
    const c = o.cmp ?? cmp
    q.set('cmp', c.join(','))
    router.replace(`?${q.toString()}`, { scroll: false })
  }

  const startIdx = useMemo(() => {
    if (!market) return -1
    const key = start.length === 7 ? `${start}-01` : start
    const i = market.dates.findIndex(d => d >= key)
    return i < 0 ? market.dates.length - 1 : i
  }, [market, start])

  const keys: StratKey[] = ['RULE25', ...cmp]
  const results = useMemo(() => {
    if (!market || startIdx < 0) return null
    return Object.fromEntries(keys.map(k => [k, runWithdrawal(market, startIdx, amt * EOK, k, withCosts)])) as Record<StratKey, SimResult>
  }, [market, startIdx, amt, withCosts, cmp.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!market || !results) {
    return <p className="text-sm text-gray-400 py-20 text-center">데이터 불러오는 중…</p>
  }

  const rule25 = results.RULE25
  const firstDate = market.dates[0].slice(0, 7), lastDate = market.dates[market.dates.length - 1]
  const realStart = market.dates[startIdx]
  const years = rule25.years

  // 그래프 데이터 (월말 총자산·그 달 생활비)
  const rows = rule25.months.map((p, i) => {
    const r: Record<string, number | string | boolean> = { m: p.date }
    for (const k of keys) {
      const q = results[k].months[i]
      // 로그 눈금이라 0은 그릴 수 없음 → 첫 달(생활비 없음)은 비워 둠
      if (q) { r[k] = Math.max(q.total / EOK, 0.01); if (q.living > 0) r[`${k}_liv`] = Math.max(q.living / 1e4, 1) }
    }
    r.cash = !p.invested
    return r
  })
  // 25% 룰 현금 보유 구간 (회색 배경)
  const cashSpans: [string, string][] = []
  rows.forEach((r, i) => {
    if (r.cash && (i === 0 || !rows[i - 1].cash)) cashSpans.push([r.m as string, r.m as string])
    if (r.cash && cashSpans.length) cashSpans[cashSpans.length - 1][1] = r.m as string
  })

  const grid = dark ? '#1f2937' : '#f3f4f6'
  const tick = dark ? '#9ca3af' : '#6b7280'
  const colorOf = (k: StratKey) => SERIES_COLORS[k][dark ? 'dark' : 'light']
  const btn = (on: boolean) => `px-3 py-1.5 transition-colors ${on ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`

  const chart = (metric: 'total' | 'liv', fmt: (v: number) => string) => (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 64, bottom: 0, left: 4 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          {metric === 'total' && cashSpans.map(([a, b]) => (
            <ReferenceArea key={a} x1={a} x2={b} fill={dark ? '#374151' : '#e5e7eb'} fillOpacity={0.5} stroke="none" />
          ))}
          <XAxis dataKey="m" tick={{ fill: tick, fontSize: 11 }} axisLine={{ stroke: grid }} tickLine={false}
                 tickFormatter={(v: string) => v.slice(0, 4)} minTickGap={40} />
          <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow tickFormatter={fmt}
                 tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            cursor={{ stroke: tick, strokeDasharray: '3 3' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs shadow-md">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  {payload.map(p => {
                    const k = String(p.dataKey).replace('_liv', '') as StratKey
                    return (
                      <p key={k} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <span className="inline-block w-2.5 h-0.5" style={{ background: p.stroke as string }} />
                        {STRATS[k].label} <strong className="ml-auto pl-3">{fmt(p.value as number)}</strong>
                      </p>
                    )
                  })}
                </div>
              )
            }}
          />
          {keys.map(k => (
            <Line key={k} dataKey={metric === 'total' ? k : `${k}_liv`} stroke={colorOf(k)} strokeWidth={2}
                  dot={false} activeDot={{ r: 4 }} isAnimationActive={false} connectNulls>
              <LabelList dataKey={metric === 'total' ? k : `${k}_liv`} content={(props) => {
                const { x, y, index } = props as { x: number; y: number; index: number }
                if (index !== rows.length - 1) return null
                return <text x={x + 6} y={y + 4} fontSize={11} fill={tick}>{k === 'HOLD3' ? '보유' : stratName(k)}</text>
              }} />
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  // 연도별 표 (각 해 마지막 달)
  const yearRows = rows.filter((r, i) => i === rows.length - 1 || (rows[i + 1].m as string).slice(0, 4) !== (r.m as string).slice(0, 4))

  return (
    <>
      {/* 설정 */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-5 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            시작 금액
            <div className="mt-1 flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden">
              <input type="number" inputMode="decimal" min={0.1} step={0.5} value={amtInput}
                onChange={e => setAmtInput(e.target.value)}
                onBlur={() => { const v = Number(amtInput); if (v > 0) go({ amt: v }) }}
                onKeyDown={e => { if (e.key === 'Enter') { const v = Number(amtInput); if (v > 0) go({ amt: v }) } }}
                className="w-20 px-2 py-1.5 text-right text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none" />
              <span className="pr-2 text-gray-400">억</span>
            </div>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400">
            인출 시작
            <input type="month" min={firstDate} max={lastDate.slice(0, 7)} value={start.slice(0, 7)}
              onChange={e => e.target.value && go({ start: e.target.value })}
              className="mt-1 block px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white" />
          </label>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            함께 비교
            <div className="mt-1 flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 font-medium">
              {COMPARE.map(k => (
                <button key={k} onClick={() => go({ cmp: cmp.includes(k) ? cmp.filter(x => x !== k) : [...cmp, k] })}
                  className={btn(cmp.includes(k))}>{STRATS[k].label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="text-gray-400 dark:text-gray-500 self-center">예시:</span>
          {[['1973-01', '1973 폭락 직전'], ['2000-03', '닷컴 정점'], ['2007-10', '금융위기 직전'], ['2009-03', '금융위기 바닥'], ['2021-11', '2022 하락 직전']].map(([s, l]) => (
            <button key={s} onClick={() => go({ start: s })}
              className={`px-2 py-0.5 rounded-full border ${start.slice(0, 7) === s ? 'border-blue-400 text-blue-600 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>
        <CostToggle withCosts={withCosts} onChange={wc => go({ fee: !wc })} />
      </div>

      {/* 요약 */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        <strong className="text-gray-900 dark:text-white">{realStart}</strong>에 <strong className="text-gray-900 dark:text-white">{fmtEok(amt)}</strong>으로 인출 시작 →
        오늘({lastDate})까지 <strong className="text-gray-900 dark:text-white">{years.toFixed(1)}년</strong>
      </p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              {['전략', '꺼내 쓴 돈', '지금 남은 자산', '첫 달 생활비', '최근 생활비', '최대 낙폭', '매매'].map(h => (
                <th key={h} className="py-2 px-2 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {keys.map(k => {
              const r = results[k]
              const firstLiv = r.months.find(p => p.living > 0)?.living ?? 0
              const lastLiv = r.months[r.months.length - 1]?.living ?? 0
              return (
                <tr key={k} className="text-gray-700 dark:text-gray-300">
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ background: colorOf(k) }} />
                    <span className={k === 'RULE25' ? 'font-bold text-gray-900 dark:text-white' : ''}>{STRATS[k].label}</span>
                  </td>
                  <td className="py-2 px-2 font-semibold whitespace-nowrap">{fmtEok(r.withdrawn / EOK)}</td>
                  <td className={`py-2 px-2 whitespace-nowrap ${r.final < amt * EOK ? 'text-red-500 dark:text-red-400' : ''}`}>{fmtEok(r.final / EOK)}</td>
                  <td className="py-2 px-2 whitespace-nowrap">{fmtMan(firstLiv / 1e4)}원</td>
                  <td className="py-2 px-2 whitespace-nowrap">{fmtMan(lastLiv / 1e4)}원</td>
                  <td className="py-2 px-2 whitespace-nowrap">−{(r.maxDD * 100).toFixed(0)}%</td>
                  <td className="py-2 px-2 whitespace-nowrap">{k === 'HOLD3' ? '—' : `${r.trades.length}회`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">남은 자산이 시작 금액보다 적으면 빨간색. 생활비는 매달 그 달 총자산의 0.3%(10억 미만)·0.5%(10~20억)·0.7%(20억 이상).</p>
      </div>

      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">총자산 (월말)</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">회색 배경 = 25% 룰이 현금으로 있던 기간 · 세로축은 로그 눈금</p>
      {chart('total', fmtEok)}

      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-6 mb-1">매달 꺼내 쓰는 생활비</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">단위 만원 · 세로축은 로그 눈금</p>
      {chart('liv', fmtMan)}

      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 select-none">연도별 표</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                <th className="py-1.5 px-2 text-left font-medium">연말</th>
                {keys.map(k => <th key={k} className="py-1.5 px-2 text-right font-medium whitespace-nowrap">{k === 'HOLD3' ? '보유' : stratName(k)} 자산 · 생활비</th>)}
                <th className="py-1.5 px-2 text-left font-medium">25% 룰 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
              {yearRows.map(r => (
                <tr key={r.m as string} className="text-gray-700 dark:text-gray-300">
                  <td className="py-1 px-2">{r.m as string}</td>
                  {keys.map(k => (
                    <td key={k} className="py-1 px-2 text-right whitespace-nowrap">
                      {r[k] !== undefined ? `${fmtEok(r[k] as number)} · ${fmtMan((r[`${k}_liv`] as number | undefined) ?? 0)}` : '—'}
                    </td>
                  ))}
                  <td className="py-1 px-2 font-sans">{r.cash ? '현금' : 'TQQQ'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-gray-500 dark:text-gray-400 select-none">25% 룰 매매 기록 ({rule25.trades.length}회)</summary>
        <ul className="mt-2 space-y-1 text-xs font-mono text-gray-600 dark:text-gray-300">
          {rule25.trades.map((t, i) => (
            <li key={i}>
              {t.date} <span className={t.action === 'S' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}>{t.action === 'S' ? '매도' : '매수'}</span>
              {' '}· 거래 후 총자산 {fmtEok(t.total / EOK)}
            </li>
          ))}
          {rule25.trades.length === 0 && <li>이 기간에는 매매 신호가 없었습니다.</li>}
        </ul>
      </details>

      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 rounded-xl p-4 text-xs text-yellow-800 dark:text-yellow-200/70 space-y-1">
        <p>계산 조건은 <Link href="/posts/withdrawal-guide" className="underline">인출식 방법론</Link>과 같습니다: TQQQ 합성 가격({withCosts ? '운용보수 + 스왑금리' : '운용보수만'}),
          모든 매도 양도세 22%(연 250만원 공제, 다음 해 1월 납부), 매매 수수료 0.07%, 현금은 외화RP(기준금리 − 0.4%, 이자소득세 15.4%), 신호 다음 거래일 종가 매매.</p>
        <p>10억으로 시작한 결과는 방법론의 668가지 시작 시점 데이터와 같은 값입니다. 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.</p>
      </div>
    </>
  )
}

export default function WithdrawalSimulatorPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="withdrawal" maxWidth="max-w-5xl" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">인출 시뮬레이터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          모은 돈으로 언제 인출을 시작했다면, 매달 얼마를 쓰고 자산이 어떻게 변했을까 — 25% 룰 권장 전략 기준
        </p>
        <Suspense fallback={<p className="text-sm text-gray-400 py-20 text-center">불러오는 중…</p>}>
          <Simulator />
        </Suspense>
      </main>
    </div>
  )
}
