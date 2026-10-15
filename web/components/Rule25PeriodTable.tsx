'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CostToggle from '@/components/CostToggle'

interface PRow { name: string; med_irr_pct: number; p10_irr_pct: number; med_withdrawn: number; rule25_better_pct: number | null; same_pct: number | null }
interface Period { key: string; title: string; n: number; years: string; rows: PRow[] }
interface WRow { name: string; by_year: Record<string, { med: number; p10: number; ratio_vs_rule25: number; rule25_more_pct: number }>; today_med: number }
interface Data { withdrawn: WRow[]; periods: Period[] }

const LABEL: Record<string, string> = {
  RULE25: '25% 룰', S0: 'S0', D10GK: 'D10GK', RULE25C50: '25% 룰 + 자산별 현금', HOLD3: 'TQQQ 계속 보유',
}
const ORDER = ['A', 'D', 'E', 'F', 'G', 'B', 'C']

function DataLink({ s, fee }: { s: string; fee?: boolean }) {
  return <Link href={`/posts/withdrawal-full-period/data?s=${s}&y=full${fee ? '&fee=1' : ''}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>
}

export default function Rule25PeriodTable({ part }: { part: 'withdrawn' | 'periods' }) {
  const [data, setData] = useState<Data | null>(null)
  const [withCosts, setWithCosts] = useState(true)
  useEffect(() => {
    fetch(`/data/withdrawal_rule25_periods${withCosts ? '' : '_fee'}.json`).then(r => r.json()).then(setData)
  }, [withCosts])
  if (!data) return <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>
  const toggle = <CostToggle withCosts={withCosts} onChange={setWithCosts} />

  if (part === 'withdrawn') {
    return (
      <div>
      {toggle}
      <div className="overflow-x-auto mb-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <th className="py-2 px-2 text-left font-medium">전략</th>
              {['10', '20', '30'].map(y => <th key={y} className="py-2 px-2 text-left font-medium whitespace-nowrap">{y}년간 꺼내 쓴 돈</th>)}
              <th className="py-2 px-2 text-left font-medium whitespace-nowrap">오늘까지</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.withdrawn.map(w => (
              <tr key={w.name} className="text-gray-700 dark:text-gray-300">
                <td className={`py-2 px-2 whitespace-nowrap ${w.name === 'RULE25' ? 'font-bold text-gray-900 dark:text-white' : ''}`}>{LABEL[w.name]}</td>
                {['10', '20', '30'].map(y => {
                  const b = w.by_year[y]
                  return (
                    <td key={y} className="py-2 px-2 font-mono whitespace-nowrap">
                      {Math.round(b.med).toLocaleString('ko-KR')}억
                      {w.name !== 'RULE25' && <span className="text-xs text-gray-400 dark:text-gray-500"> (25% 룰의 {b.ratio_vs_rule25}%)</span>}
                    </td>
                  )
                })}
                <td className="py-2 px-2 font-mono">{Math.round(w.today_med).toLocaleString('ko-KR')}억</td>
                <td className="py-2 px-2"><DataLink s={w.name} fee={!withCosts} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          중간값. &lsquo;25% 룰의 ○%&rsquo;는 같은 시작 시점끼리 비교한 비율의 중간값. 오늘까지는 10년 이상 보유한 548가지 경우.
        </p>
      </div>
      </div>
    )
  }

  const periods = ORDER.map(k => data.periods.find(p => p.key === k)!).filter(Boolean)
  return (
    <div>
    {toggle}
    <div className="space-y-5 mb-2">
      {periods.map(p => {
        const best = Math.max(...p.rows.map(r => r.med_irr_pct))
        return (
          <div key={p.key} className={`rounded-xl overflow-hidden border ${p.key === 'C' ? 'border-blue-200 dark:border-blue-700/40' : 'border-gray-200 dark:border-gray-800'}`}>
            <div className={`px-3 py-2 text-xs font-semibold ${p.key === 'C' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'}`}>
              {p.title} <span className="font-normal opacity-70">· {p.n}가지</span>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                  <th className="py-1.5 px-3 text-left font-medium">전략</th>
                  <th className="py-1.5 px-3 text-right font-medium">수익률</th>
                  <th className="py-1.5 px-3 text-right font-medium">하위 10%</th>
                  <th className="py-1.5 px-3 text-right font-medium">25% 룰 우세</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {p.rows.map(r => (
                  <tr key={r.name} className={r.name === 'RULE25' ? 'bg-gray-50/60 dark:bg-gray-900/40' : ''}>
                    <td className={`py-1.5 px-3 whitespace-nowrap ${r.name === 'RULE25' ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{LABEL[r.name]}</td>
                    <td className={`py-1.5 px-3 text-right font-mono ${r.med_irr_pct === best ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{r.med_irr_pct}%</td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-500 dark:text-gray-400">{r.p10_irr_pct}%</td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-500 dark:text-gray-400">
                      {r.rule25_better_pct !== null ? `${r.rule25_better_pct}%` : '—'}
                      {r.same_pct ? <span className="text-[10px] ml-1 opacity-60">(같음 {r.same_pct}%)</span> : null}
                    </td>
                    <td className="py-1.5 px-3"><DataLink s={r.name} fee={!withCosts} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
      인출 포함 연 수익률 중간값. 굵은 글씨 = 그 구간 최고. &lsquo;25% 룰 우세&rsquo; = 같은 시작 시점에서 25% 룰이 더 높았던 비율.
    </p>
    </div>
  )
}
