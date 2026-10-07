'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface Row { s: string; irr: number; irr0: number; tax: number; wd: number; tax_vs_wd: number; max_tax_pct: number; max_tax_year: number | null; tax_free_pct: number }
const NAME: Record<string, string> = { RULE25: '25% 룰', S0: 'S0', D10GK: 'D10GK', HOLD3: 'TQQQ 계속 보유' }
const eok = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`

function Viewer() {
  const params = useSearchParams()
  const router = useRouter()
  const [rows, setRows] = useState<Record<string, Row[]> | null>(null)
  const s = params.get('s') ?? 'RULE25'
  useEffect(() => { fetch('/data/withdrawal_tax.json').then(r => r.json()).then(d => setRows(d.rows)) }, [])
  const list = rows?.[s] ?? []
  const worst = useMemo(() => list.length ? list.reduce((a, b) => (b.irr0 - b.irr > a.irr0 - a.irr ? b : a)).s : '', [list])
  if (!rows) return <p className="text-sm text-gray-400 py-10 text-center">불러오는 중…</p>
  return (
    <>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.keys(rows).map(k => (
          <button key={k} onClick={() => router.replace(`?s=${k}`, { scroll: false })}
            className={`text-xs px-3 py-1.5 rounded-full border ${s === k ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {NAME[k] ?? k}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              {['진입 시점', '인출 포함 수익률', '세금 없었다면', '차이', '낸 세금 합계', '꺼내 쓴 생활비', '세금 ÷ 생활비', '가장 큰 한 해 세금 (연도)', '세금 0인 해'].map(h => (
                <th key={h} className="py-2 px-2 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {list.map(r => (
              <tr key={r.s} className={r.s === worst ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}>
                <td className="py-1.5 px-2 font-mono">{r.s}</td>
                <td className="py-1.5 px-2 font-mono">{r.irr}%</td>
                <td className="py-1.5 px-2 font-mono text-gray-400">{r.irr0}%</td>
                <td className="py-1.5 px-2 font-mono">−{(r.irr0 - r.irr).toFixed(1)}%p</td>
                <td className="py-1.5 px-2 font-mono">{eok(r.tax)}</td>
                <td className="py-1.5 px-2 font-mono text-gray-400">{eok(r.wd)}</td>
                <td className="py-1.5 px-2 font-mono">{r.tax_vs_wd}%</td>
                <td className="py-1.5 px-2 font-mono">{r.max_tax_pct}% ({r.max_tax_year ?? '—'})</td>
                <td className="py-1.5 px-2 font-mono text-gray-400">{r.tax_free_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        처음 10억 · 오늘까지 보유 · 10년 이상 보유한 시작 시점 · 빨간 줄 = 세금이 수익률을 가장 많이 깎은 시작 시점 ·
        가장 큰 한 해 세금 = 그 세금을 낼 때 총자산 대비 · 세금은 다음 해 초 현금에서 낸다고 계산(실제 신고·납부는 5월)
      </p>
    </>
  )
}

export default function WithdrawalTaxDataPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-6xl" />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/posts/withdrawal-tax" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">← 글로 돌아가기</Link>
        <h1 className="text-2xl font-black mb-2">인출식 세금 — 시작 시점별 데이터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">1971~2016년 매달 시작한 548가지 경우 · 오늘까지 보유</p>
        <Suspense fallback={null}><Viewer /></Suspense>
      </main>
    </div>
  )
}
