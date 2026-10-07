'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Sum { n: number; irr: number; irr0: number; irr_cost: number; tax_vs_wd: number; max_tax_pct: number; max_tax_pct_p90: number; tax_free_pct: number }
interface Ex { y: number; tax: number; gain: number; total: number; pct: number }
interface Data { summary: Record<string, Sum>; example: Ex[] }

const NAME: Record<string, string> = { RULE25: '25% 룰', S0: 'S0', D10GK: 'D10GK', HOLD3: 'TQQQ 계속 보유' }
const eok = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString('ko-KR', { maximumFractionDigits: v >= 10 ? 0 : 1 })}억`

let cache: Promise<Data> | null = null
function useData() {
  const [d, setD] = useState<Data | null>(null)
  useEffect(() => { cache ??= fetch('/data/withdrawal_tax.json').then(r => r.json()); cache.then(setD) }, [])
  return d
}
const Loading = () => <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>

export function TaxSummary() {
  const d = useData()
  if (!d) return <Loading />
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['전략', '인출 포함 연 수익률', '세금이 없었다면', '세금이 깎은 수익률', '낸 세금 ÷ 꺼내 쓴 생활비', '가장 큰 한 해 세금 (그때 자산 대비)', ''].map(h => (
              <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {Object.entries(d.summary).map(([k, g]) => (
            <tr key={k} className={k === 'RULE25' ? 'bg-purple-50/60 dark:bg-purple-500/10' : ''}>
              <td className="py-2 px-2 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{NAME[k]}</td>
              <td className="py-2 px-2 font-mono text-gray-800 dark:text-gray-200">{g.irr}%</td>
              <td className="py-2 px-2 font-mono text-gray-500 dark:text-gray-400">{g.irr0}%</td>
              <td className="py-2 px-2 font-mono text-red-600 dark:text-red-400">−{g.irr_cost}%p</td>
              <td className="py-2 px-2 font-mono text-gray-700 dark:text-gray-300">{g.tax_vs_wd}%</td>
              <td className="py-2 px-2 font-mono text-gray-700 dark:text-gray-300">{k === 'HOLD3' ? '—' : `${g.max_tax_pct}%`}</td>
              <td className="py-2 px-2"><Link href={`/posts/withdrawal-tax/data?s=${k}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TaxExample() {
  const d = useData()
  if (!d) return <Loading />
  const rows = [...d.example].sort((a, b) => b.tax - a.tax).slice(0, 8).sort((a, b) => a.y - b.y)
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['양도 연도', '그해 양도차익', '양도세 (다음 해 납부)', '납부할 때 총자산', '총자산 대비'].map(h => (
              <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(e => (
            <tr key={e.y} className={e.pct >= 10 ? 'bg-red-50/60 dark:bg-red-500/10' : ''}>
              <td className="py-1.5 px-2 font-mono text-gray-800 dark:text-gray-200">{e.y}</td>
              <td className="py-1.5 px-2 font-mono text-gray-600 dark:text-gray-300">{eok(e.gain)}</td>
              <td className="py-1.5 px-2 font-mono font-semibold text-gray-800 dark:text-gray-200">{eok(e.tax)}</td>
              <td className="py-1.5 px-2 font-mono text-gray-500 dark:text-gray-400">{eok(e.total)}</td>
              <td className={`py-1.5 px-2 font-mono ${e.pct >= 10 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>{e.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
        1990년 1월 10억으로 시작한 25% 룰 · 세금이 컸던 8개 해 · 양도차익은 같은 해 손실과 합친 뒤의 금액 · 금액은 물가 상승을 빼지 않은 금액
      </p>
    </div>
  )
}
