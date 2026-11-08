'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GROUPS, PRINCIPLES, STATUS_LABEL, type BStatus } from './data'
import { UNIV } from '../universe'

// 버핏·멍거가 사거나 언급한 회사 — 이유·교훈 + 사이트 숫자(PER·10년 보유 성적·등급)
type Sum = { key: string; pe: number | null; peMed10: number | null; chg1y: number | null; fromHigh3y: number | null; beatBench: number | null; beatTotal: number | null; roll10Median: number | null }

const STATUS_STYLE: Record<BStatus, string> = {
  hold: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  sold: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  mistake: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  private: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  missed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  mentioned: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

function hrefOf(key: string) {
  const f = UNIV[key] ?? ''
  const u = f.includes('S') ? 'sp500' : f.includes('N') ? 'ndx' : f.includes('R') ? 'r2k' : f.includes('Q') ? 'nasdaq' : 'other'
  return `/private/${u}?s=${key}`
}

export default function BuffettPage() {
  const [sum, setSum] = useState<Record<string, Sum>>({})
  const [grade, setGrade] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'all' | BStatus>('all')
  useEffect(() => {
    fetch('/data/fundamentals/_summary.json').then(r => r.json()).then(d => {
      const m: Record<string, Sum> = {}
      for (const s of d.stocks ?? []) m[s.key] = s
      setSum(m)
    }).catch(() => {})
    fetch('/data/fundamentals/_quality.json').then(r => r.json()).then(d => {
      const m: Record<string, string> = {}
      for (const [k, v] of Object.entries(d.stocks ?? {})) m[k] = (v as { grade: string }).grade
      setGrade(m)
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">버핏·멍거의 회사들</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">워런 버핏과 찰리 멍거가 사거나 직접 언급한 회사, 왜 위대하다고 봤는지, 그리고 두 사람이 인정한 실수까지. 회사 이름을 누르면 사이트의 상세 분석으로 간다.</p>
        </div>

        <section className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">두 사람이 회사를 고르는 기준</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {PRINCIPLES.map(p => (
              <li key={p.k} className="text-xs leading-relaxed">
                <b className="text-gray-900 dark:text-white">{p.k}</b>
                <span className="block text-gray-600 dark:text-gray-300">{p.v}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'hold', 'sold', 'mistake', 'private', 'missed', 'mentioned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
              {f === 'all' ? '전체' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        {GROUPS.map(g => {
          const items = g.items.filter(it => filter === 'all' || it.status === filter)
          if (!items.length) return null
          return (
            <section key={g.id} className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{g.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{g.desc}</p>
              </div>
              <div className="space-y-2">
                {items.map(it => {
                  const s = it.key ? sum[it.key] : undefined
                  const gr = it.key ? grade[it.key] : undefined
                  const rel = s?.pe && s?.peMed10 ? s.pe / s.peMed10 : null
                  return (
                    <div key={it.name} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {it.key
                          ? <Link href={hrefOf(it.key)} className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline">{it.name} <span className="text-xs text-gray-400">{it.key}</span></Link>
                          : <span className="font-semibold text-sm text-gray-900 dark:text-white">{it.name}</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_STYLE[it.status]}`}>{STATUS_LABEL[it.status]}</span>
                        <span className="text-[10px] text-gray-400">{it.who}</span>
                        {gr && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">사업의 질 {gr}</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{it.when}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-200 mt-1 leading-relaxed"><b>왜 위대한가:</b> {it.why}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed"><b>교훈:</b> {it.lesson}</p>
                      {s && (
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-[11px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-1.5">
                          {s.pe != null && <span>PER {s.pe.toFixed(1)}배{s.peMed10 != null && <> (10년 평소 {s.peMed10.toFixed(1)}배{rel != null && <b className={rel < 0.85 ? ' text-emerald-600 dark:text-emerald-400' : rel > 1.15 ? ' text-red-500' : ''}> · {rel < 0.85 ? '싸다' : rel > 1.15 ? '비싸다' : '평소 수준'}</b>})</>}</span>}
                          {s.fromHigh3y != null && <span>3년 고점 대비 {s.fromHigh3y.toFixed(0)}%</span>}
                          {s.beatTotal ? <span>10년 보유 {s.beatTotal}번 중 {s.beatBench}번 S&amp;P 500 이김</span> : null}
                          {s.roll10Median != null && <span>10년 보유 중간값 연 {s.roll10Median.toFixed(1)}%</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}

        <p className="text-[11px] text-gray-400">버크셔 보유 여부는 2026년 11월까지 알려진 공시 기준. 버핏은 2025년 말 CEO에서 물러났다(그레그 에이블 승계). 일부 최근 종목은 버핏이 아니라 운용역이 골랐다.</p>
      </div>
    </div>
  )
}
