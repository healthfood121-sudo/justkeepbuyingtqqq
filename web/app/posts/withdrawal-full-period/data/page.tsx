'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CostToggle from '@/components/CostToggle'
import Link from 'next/link'
import Header from '@/components/Header'

interface Cell { f: number; i: number | null; dd: number; w: number; t: number; y: Record<string, number>; yw: Record<string, number> }
interface CohortRow { s: string; y: number; [k: string]: Cell | string | number }
interface Data {
  meta: { generated: string; conditions: string; years: number[]; strategies: { name: string; desc: string; group: string }[] }
  cohorts: CohortRow[]
}

const fmt = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`

function Viewer() {
  const params = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const sel = (params.get('s') ?? 'T25,S0,D10GK').split(',').filter(Boolean)
  const view = params.get('y') ?? 'full'   // 'full' | '10' | '20' ...
  const withCosts = params.get('fee') !== '1'

  useEffect(() => {
    fetch(`/data/withdrawal_full_period${withCosts ? '' : '_fee'}.json`).then(r => r.json()).then(setData)
  }, [withCosts])

  const setParam = (s: string[], y: string, wc = withCosts) =>
    router.replace(`?s=${s.join(',')}&y=${y}${wc ? '' : '&fee=1'}`, { scroll: false })
  const toggle = (n: string) => {
    const next = sel.includes(n) ? sel.filter(x => x !== n) : [...sel, n].slice(-4)
    if (next.length) setParam(next, view)
  }

  const rows = useMemo(() => {
    if (!data) return []
    return data.cohorts.filter(c => view === 'full' ? true : (c[sel[0]] as Cell)?.y?.[view] !== undefined)
  }, [data, view, sel])

  const worstStart = useMemo(() => {
    if (!rows.length) return ''
    let worst = '', wv = Infinity
    for (const r of rows) {
      const c = r[sel[0]] as Cell
      if (!c) continue
      const v = view === 'full' ? (r.y >= 10 ? c.i ?? Infinity : Infinity) : c.y[view] + c.yw[view]
      if (v < wv) { wv = v; worst = r.s }
    }
    return worst
  }, [rows, sel, view])

  if (!data) return <p className="text-sm text-gray-400 py-10 text-center">불러오는 중…</p>
  const names = data.meta.strategies

  return (
    <>
      <CostToggle withCosts={withCosts} onChange={wc => setParam(sel, view, wc)} />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{data.meta.conditions}</p>

      <div className="mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">전략 (최대 4개, 첫 번째 전략 기준으로 최악의 경우를 빨간색 표시)</p>
        <div className="flex flex-wrap gap-1.5">
          {names.map(s => (
            <button key={s.name} onClick={() => toggle(s.name)} title={s.desc}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sel.includes(s.name)
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              {s.name === 'T25' ? '25% 룰 (T25)' : s.name === 'T25C50' ? '25% 룰 + 현금' : s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium w-fit mb-4">
        {['full', ...data.meta.years.map(String)].map(y => (
          <button key={y} onClick={() => setParam(sel, y)}
            className={`px-3 py-1.5 ${view === y ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {y === 'full' ? '오늘까지' : `${y}년 시점`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="py-2 px-2 text-left font-medium">진입 시점</th>
              <th className="py-2 px-2 text-left font-medium">보유</th>
              {sel.map(n => (
                <th key={n} className="py-2 px-2 text-left font-medium whitespace-nowrap" colSpan={view === 'full' ? 4 : 2}>
                  {n === 'T25' ? '25% 룰' : n === 'T25C50' ? '25% 룰 + 현금' : n} {view === 'full' ? '(인출 포함 수익률 · 꺼내 쓴 돈 · 남은 자산 · 최대 낙폭)' : `(${view}년 시점: 꺼내 쓴 돈 · 남은 자산)`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => (
              <tr key={r.s} className={r.s === worstStart ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}>
                <td className="py-1.5 px-2 font-mono">{r.s}</td>
                <td className="py-1.5 px-2 text-gray-400">{r.y}년</td>
                {sel.map(n => {
                  const c = r[n] as Cell
                  if (!c) return <td key={n} />
                  return view === 'full' ? (
                    [<td key={n + 'i'} className="py-1.5 px-2 font-mono">{c.i === null || r.y < 1 ? '—' : `${c.i}%`}</td>,
                     <td key={n + 'w'} className="py-1.5 px-2 font-mono">{fmt(c.w)}</td>,
                     <td key={n + 'f'} className="py-1.5 px-2 font-mono">{fmt(c.f)}</td>,
                     <td key={n + 'd'} className="py-1.5 px-2 font-mono text-gray-400">−{c.dd}%</td>]
                  ) : (
                    [<td key={n + 'w'} className="py-1.5 px-2 font-mono">{fmt(c.yw[view])}</td>,
                     <td key={n + 'f'} className="py-1.5 px-2 font-mono">{fmt(c.y[view])}</td>]
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        인출 포함 수익률 = 10억을 넣고 매달 생활비를 꺼내 쓰고 마지막 남은 자산까지 돌려받았을 때의 연 수익률.
        보유 10년 미만인 진입 시점은 수익률이 크게 출렁이므로 최악 표시에서 제외했다. 시점별 보기의 최악은 꺼내 쓴 돈 + 남은 자산 기준. 금액은 물가 상승을 빼지 않은 금액.
      </p>
    </>
  )
}

export default function FullPeriodDataPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-6xl" />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/posts/withdrawal-full-period" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">
          ← 글로 돌아가기
        </Link>
        <h1 className="text-2xl font-black mb-2">인출 전략 전체 기간 데이터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">1971-02 ~ 2026-09 매달 시작한 668가지 경우 · 각자 오늘까지 보유</p>
        <Suspense fallback={null}><Viewer /></Suspense>
      </main>
    </div>
  )
}
