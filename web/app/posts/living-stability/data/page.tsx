'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { DESIGNS } from '@/components/LivingStability'

interface Cell { i: number; f: number; w: number; dd: number; mn: number; lh: number; lc: number }
interface Row { s: string; y: number; [k: string]: Cell | string | number }

const eok = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`

function Viewer() {
  const params = useSearchParams()
  const router = useRouter()
  const [rows, setRows] = useState<Row[] | null>(null)
  const sel = (params.get('s') ?? 'RULE25,RULE25_annual').split(',').filter(k => DESIGNS.some(d => d.k === k))
  useEffect(() => { fetch('/data/withdrawal_recommend.json').then(r => r.json()).then(d => setRows(d.cohorts)) }, [])
  const toggle = (k: string) => {
    const next = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k].slice(-3)
    if (next.length) router.replace(`?s=${next.join(',')}`, { scroll: false })
  }
  const list = useMemo(() => (rows ?? []).filter(r => r.y >= 10), [rows])
  const worst = !list.length || !sel[0] ? ''
    : list.reduce((a, b) => ((b[sel[0]] as Cell).mn < (a[sel[0]] as Cell).mn ? b : a)).s
  if (!rows) return <p className="text-sm text-gray-400 py-10 text-center">불러오는 중…</p>
  const name = (k: string) => DESIGNS.find(d => d.k === k)?.name ?? k

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {DESIGNS.map(d => (
          <button key={d.k} onClick={() => toggle(d.k)} title={d.desc}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sel.includes(d.k)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {d.name}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="py-2 px-2 text-left font-medium">진입 시점</th>
              <th className="py-2 px-2 text-left font-medium">보유</th>
              {sel.map(k => (
                <th key={k} colSpan={4} className="py-2 px-2 text-left font-medium whitespace-nowrap">
                  {name(k)} (수익률 · 자산 최저점 · 생활비 반토막 달 · 꺼내 쓴 돈)
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {list.map(r => (
              <tr key={r.s} className={r.s === worst ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}>
                <td className="py-1.5 px-2 font-mono">{r.s}</td>
                <td className="py-1.5 px-2 text-gray-400">{r.y}년</td>
                {sel.map(k => {
                  const c = r[k] as Cell
                  return [
                    <td key={k + 'i'} className="py-1.5 px-2 font-mono">{c.i}%</td>,
                    <td key={k + 'm'} className="py-1.5 px-2 font-mono">{eok(c.mn)}</td>,
                    <td key={k + 'h'} className="py-1.5 px-2 font-mono text-gray-400">{c.lh}%</td>,
                    <td key={k + 'w'} className="py-1.5 px-2 font-mono text-gray-400">{eok(c.w)}</td>,
                  ]
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        수익률 = 인출 포함 연 수익률 · 자산 최저점 = 들고 가는 동안 총자산이 가장 낮았던 값 · 생활비 반토막 달 = 그때까지 최고 생활비의 절반보다 적게 받은 달의 비율 ·
        빨간 줄 = 첫 번째로 고른 방식에서 자산 최저점이 가장 낮았던 시작 시점 · 10년 이상 보유한 시작 시점만 · 금액은 물가 상승을 빼지 않은 금액
      </p>
    </>
  )
}

export default function LivingStabilityDataPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-6xl" />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/posts/living-stability" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">← 글로 돌아가기</Link>
        <h1 className="text-2xl font-black mb-2">생활비 규칙·현금 버퍼 — 시작 시점별 데이터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">25% 룰 신호 · 초기 10억 · 매달 시작해 오늘까지 (최대 3개 비교)</p>
        <Suspense fallback={null}><Viewer /></Suspense>
      </main>
    </div>
  )
}
