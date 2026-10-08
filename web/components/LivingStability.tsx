'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Sum {
  name: string; desc: string
  med_irr_pct: number; p10_irr_pct: number; med_max_dd: number
  p10_min_eok: number; med_min_eok: number
  liv_half_pct: number; med_liv_worst_cut: number
  by_year: Record<string, { med_total: number; p10_total: number; med_living_man: number; p10_living_man: number }>
}

// 포스트에서 보여 줄 설계 (withdrawal_recommend.json의 이름) — 화면 이름과 한 줄 설명
export const DESIGNS: { k: string; name: string; desc: string }[] = [
  { k: 'RULE25', name: '25% 룰 (지금 권장)', desc: '매달 그때 자산 × 0.3/0.5/0.7%' },
  { k: 'RULE25_annual', name: '생활비 1년 고정', desc: '12개월마다 한 번 정하고 1년 동안 같은 금액' },
  { k: 'RULE25_floor75', name: '생활비 하한', desc: '직전 12개월 최고 생활비의 75% 아래로 안 내림' },
  { k: 'A5_20', name: '자산 커지면 현금', desc: '50억↑ TQQQ ⅔ · 200억↑ ⅓, 나머지 현금' },
  { k: 'R20', name: '기본 현금 20% + 1년 점검', desc: '처음부터 현금 20%, 생활비·비중은 1년에 한 번' },
  { k: 'R30', name: '기본 현금 30% + 1년 점검', desc: '처음부터 현금 30%, 생활비·비중은 1년에 한 번' },
]

const DATA_URL = '/posts/living-stability/data'

export default function LivingStability() {
  const [rows, setRows] = useState<Sum[] | null>(null)
  useEffect(() => {
    fetch('/data/withdrawal_recommend.json').then(r => r.json()).then(d => setRows(d.summary))
  }, [])
  if (!rows) return <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>
  const by = Object.fromEntries(rows.map(r => [r.name, r]))
  const man = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}억` : `${v.toLocaleString('ko-KR')}만`
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {['방식', '인출 포함 연 수익률 (하위 10%)', '생활비가 최고의 절반 아래였던 달', '10년 뒤 월 생활비 하위 10%', '20년 뒤 월 생활비 하위 10%', '자산 최저점 하위 10%', '최대 낙폭', ''].map(h => (
              <th key={h} className="py-2 px-2 text-left text-gray-500 dark:text-gray-400 font-medium text-xs">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {DESIGNS.map(d => {
            const r = by[d.k]
            if (!r) return null
            return (
              <tr key={d.k} className={d.k === 'RULE25' ? 'bg-purple-50/60 dark:bg-purple-500/10' : ''}>
                <td className="py-2 px-2">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{d.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{d.desc}</p>
                </td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-800 dark:text-gray-200 whitespace-nowrap">{r.med_irr_pct}% <span className="text-gray-400">({r.p10_irr_pct}%)</span></td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-700 dark:text-gray-300">{r.liv_half_pct}%</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-700 dark:text-gray-300">{man(r.by_year['10'].p10_living_man)}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-700 dark:text-gray-300">{man(r.by_year['20'].p10_living_man)}</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-700 dark:text-gray-300">{r.p10_min_eok}억</td>
                <td className="py-2 px-2 font-mono whitespace-nowrap text-gray-500 dark:text-gray-400">−{r.med_max_dd}%</td>
                <td className="py-2 px-2">
                  <Link href={`${DATA_URL}?s=${d.k}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
