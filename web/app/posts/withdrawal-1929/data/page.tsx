'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { NAME } from '@/components/Withdrawal1929'

// cols: s(시작) i(인출 포함 연 수익률) min(자산 최저점, 억) w10(첫 10년 꺼내 쓴 돈, 억) dd(최대 낙폭) f(오늘 남은 자산, 억) t(매매 횟수)
type RowT = [string, number, number, number, number, number, number]
interface Rows { cols: string[]; rows: Record<string, Record<string, RowT[]>> }

const VNAME: Record<string, string> = { recent: '최근 베타', pretech: '1971~1990 베타', recent0: '최근 베타 · 초과수익 없음', harsh: '가혹 (β 1.5)', ndx: '실제 나스닥100 (1971~)' }
const eok = (v: number) => v < 1 ? `${Math.round(v * 10000).toLocaleString('ko-KR')}만` : v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`

function Viewer() {
  const params = useSearchParams()
  const router = useRouter()
  const [data, setData] = useState<Rows | null>(null)
  const v = params.get('v') ?? 'recent'
  useEffect(() => { fetch('/data/withdrawal_1929_rows.json').then(r => r.json()).then(setData) }, [])
  const avail = data ? Object.keys(data.rows[v] ?? {}) : []
  const sel = (params.get('s') ?? 'RULE25,HOLD1').split(',').filter(k => avail.includes(k))
  const go = (nv: string, ns: string[]) => router.replace(`?v=${nv}&s=${ns.join(',')}`, { scroll: false })
  const toggle = (k: string) => {
    const next = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k].slice(-3)
    if (next.length) go(v, next)
  }
  const base = sel[0] ? data?.rows[v][sel[0]] ?? [] : []
  const worst = useMemo(() => base.length ? base.reduce((a, b) => (b[2] < a[2] ? b : a))[0] : '', [base])
  if (!data) return <p className="text-sm text-gray-400 py-10 text-center">불러오는 중…</p>

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.keys(data.rows).map(x => (
          <button key={x} onClick={() => go(x, sel.filter(k => k in data.rows[x]).length ? sel.filter(k => k in data.rows[x]) : ['RULE25'])}
            className={`text-xs px-3 py-1.5 rounded-full border ${v === x ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
            {VNAME[x] ?? x}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {avail.map(k => (
          <button key={k} onClick={() => toggle(k)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sel.includes(k)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {NAME[k] ?? k}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="py-2 px-2 text-left font-medium">진입 시점</th>
              {sel.map(k => (
                <th key={k} colSpan={4} className="py-2 px-2 text-left font-medium whitespace-nowrap">
                  {NAME[k] ?? k} (자산 최저점 · 첫 10년 꺼내 쓴 돈 · 인출 포함 수익률 · 매매)
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {base.map((r, i) => (
              <tr key={r[0]} className={r[0] === worst ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}>
                <td className="py-1.5 px-2 font-mono">{r[0]}</td>
                {sel.map(k => {
                  const c = data.rows[v][k][i]
                  return [
                    <td key={k + 'm'} className="py-1.5 px-2 font-mono">{eok(c[2])}</td>,
                    <td key={k + 'w'} className="py-1.5 px-2 font-mono">{eok(c[3])}</td>,
                    <td key={k + 'i'} className="py-1.5 px-2 font-mono text-gray-400">{c[1]}%</td>,
                    <td key={k + 't'} className="py-1.5 px-2 font-mono text-gray-400">{c[6]}</td>,
                  ]
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        처음 10억 · 오늘까지 보유 · 빨간 줄 = 첫 번째로 고른 전략에서 자산 최저점이 가장 낮았던 시작 시점 ·
        1971년 이전은 S&amp;P500으로 만든 가상 나스닥100 · 실제 나스닥100은 10년 이상 보유한 시작 시점만 · 금액은 물가 상승을 빼지 않은 금액
      </p>
    </>
  )
}

export default function Withdrawal1929DataPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-6xl" />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/posts/withdrawal-1929" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">← 글로 돌아가기</Link>
        <h1 className="text-2xl font-black mb-2">1929년 대공황 인출 시나리오 — 시작 시점별 데이터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">1929~1970년 매달 시작 (가상 나스닥100 4가지) + 비교용 실제 나스닥100 · 최대 3개 비교</p>
        <Suspense fallback={null}><Viewer /></Suspense>
      </main>
    </div>
  )
}
