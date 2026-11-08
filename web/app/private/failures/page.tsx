'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CATS, CASES, SURVIVORS, CHECKLIST } from './data'
import { UNIV } from '../universe'

// 실패 공부방 — 기업이 무너진 길을 원인별로 모아 "피하는 법"을 배운다 (멍거의 거꾸로 생각하기)
function hrefOf(key: string) {
  if (!(key in UNIV)) return null
  const f = UNIV[key]
  const u = f.includes('S') ? 'sp500' : f.includes('N') ? 'ndx' : f.includes('R') ? 'r2k' : f.includes('Q') ? 'nasdaq' : 'other'
  return `/private/${u}?s=${key}`
}

export default function FailuresPage() {
  const [cat, setCat] = useState<string>('all')
  const [open, setOpen] = useState<string | null>(null)
  const shown = CASES.filter(c => cat === 'all' || c.cat === cat)
  const catOf = (id: string) => CATS.find(c => c.id === id)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">실패 공부방</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            찰리 멍거: &ldquo;내가 어디서 죽을지만 알면 거기엔 절대 가지 않겠다.&rdquo; 성공 비결보다 실패의 길을 먼저 알면 피할 수 있다.
            잘 나가던 회사가 무엇을 만나 무너졌는지 원인별로 모으고, 그때 미리 보였던 신호와 교훈, 그리고 같은 위기에서 살아남은 회사를 함께 본다.
          </p>
        </div>

        {/* 실패의 8가지 길 */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">기업이 무너지는 8가지 길</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(cat === c.id ? 'all' : c.id)}
                className={`text-left rounded-lg border p-3 transition-colors ${cat === c.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.title}</span>
                  <span className="text-[10px] text-gray-400">{CASES.filter(x => x.cat === c.id).length}개 사례</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{c.desc}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5"><b>미리 보이는 신호:</b> {c.signals.join(' · ')}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 사례 */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mr-2">실패 사례 {shown.length}개</h2>
            <button onClick={() => setCat('all')} className={`px-2.5 py-0.5 rounded-full text-xs ${cat === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>전체</button>
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`px-2.5 py-0.5 rounded-full text-xs ${cat === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{c.short}</button>
            ))}
          </div>
          <div className="space-y-1.5">
            {shown.map(c => {
              const isOpen = open === c.name
              const h = c.key ? hrefOf(c.key) : null
              return (
                <div key={c.name} className="rounded-lg border border-gray-200 dark:border-gray-800">
                  <button onClick={() => setOpen(isOpen ? null : c.name)} className="w-full text-left px-3 py-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</span>
                    <span className="text-[11px] text-gray-400">{c.years}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300">{catOf(c.cat)?.short}</span>
                    <span className="ml-auto text-xs text-gray-400">{isOpen ? '접기 ▲' : '펼치기 ▼'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs leading-relaxed">
                      <p className="text-gray-700 dark:text-gray-200"><b>무슨 일이 있었나:</b> {c.story}</p>
                      <p className="text-amber-700 dark:text-amber-300"><b>그때 놓친 신호:</b> {c.missed}</p>
                      <p className="text-emerald-700 dark:text-emerald-300"><b>교훈:</b> {c.lesson}</p>
                      {h && <Link href={h} className="inline-block text-blue-600 dark:text-blue-400 hover:underline">이 회사의 지금 분석 보기 →</Link>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 살아남은 회사 */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">같은 위기에서 살아남은 회사</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">실패를 피한 회사들은 무엇이 달랐나 — 대부분 &ldquo;자기 사업을 스스로 바꿀 용기&rdquo;, &ldquo;핵심으로의 집중&rdquo;, &ldquo;빚이 적어 버틸 힘&rdquo; 중 하나였다.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {SURVIVORS.map(s => {
              const h = s.key ? hrefOf(s.key) : null
              return (
                <div key={s.name} className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs leading-relaxed">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    {h ? <Link href={h} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">{s.name}</Link> : <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</span>}
                    <span className="text-[11px] text-gray-400">{s.years}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1"><b>위기:</b> {s.crisis}</p>
                  <p className="text-gray-700 dark:text-gray-200 mt-0.5"><b>어떻게:</b> {s.how}</p>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-0.5"><b>교훈:</b> {s.lesson}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* 체크리스트 */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">실패 피하기 체크리스트</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {CHECKLIST.map(g => (
              <div key={g.k} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{g.k}</h3>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
                  {g.items.map(it => <li key={it}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <p className="text-[11px] text-gray-400">널리 알려진 사실을 바탕으로 정리했고, 금액은 대략값이다. 사례는 계속 추가한다.</p>
      </div>
    </div>
  )
}
