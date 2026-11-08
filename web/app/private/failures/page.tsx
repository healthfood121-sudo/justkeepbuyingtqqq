'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CATS, CASES, SURVIVORS, CHECKLIST } from './data'
import { CORE, CAT_RULES, ME } from './lessons'
import { WATCH, WATCH_AS_OF } from './watch'
import { UNIV } from '../universe'

// 실패 공부방 — 기업이 무너진 길을 원인별로 모아 "내가 지킬 원칙"을 배운다 (멍거의 거꾸로 생각하기)
function hrefOf(key: string) {
  if (!(key in UNIV)) return null
  const f = UNIV[key]
  const u = f.includes('S') ? 'sp500' : f.includes('N') ? 'ndx' : f.includes('R') ? 'r2k' : f.includes('Q') ? 'nasdaq' : 'other'
  return `/private/${u}?s=${key}`
}

const chip = (on: boolean) => `px-2.5 py-0.5 rounded-full text-xs ${on ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`

export default function FailuresPage() {
  const [cat, setCat] = useState<string>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [side, setSide] = useState<'turn' | 'drift'>('turn')
  const [openW, setOpenW] = useState<string | null>(null)
  const shown = CASES.filter(c => cat === 'all' || c.cat === cat)
  const catOf = (id: string) => CATS.find(c => c.id === id)

  const jump = (name: string) => {
    setCat('all')
    setOpen(name)
    setTimeout(() => document.getElementById(`case-${name}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">실패 공부방</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            찰리 멍거: &ldquo;내가 어디서 죽을지만 알면 거기엔 절대 가지 않겠다.&rdquo; 이 방의 목적은 이야기가 아니라 <b className="text-gray-700 dark:text-gray-200">내 투자에 가져갈 원칙</b>이다.
            먼저 사례 {CASES.length}개에서 반복된 교훈 {CORE.length}가지를 보고, 지금 위기에 있는 회사로 연습한 뒤, 원인별 사례로 깊게 들어간다.
          </p>
        </div>

        {/* 핵심 교훈 */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">내가 가져갈 핵심 교훈 {CORE.length}가지</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">여러 회사가 같은 길로 무너졌다. 아래 사례 이름을 누르면 그 실패 이야기로 간다.</p>
          </div>
          <div className="space-y-2">
            {CORE.map(l => (
              <div key={l.n} className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{l.n}. {l.title}</h3>
                <p className="text-xs text-gray-700 dark:text-gray-200 mt-1 leading-relaxed">{l.why}</p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed"><b>내 종목에서 확인하는 법:</b> {l.how}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {l.cases.map(n => (
                    <button key={n} onClick={() => jump(n)} className="text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400">{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 지금 위기의 회사 */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">지금 위기의 회사 — 결말은 아직 모른다</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              과거 실패는 결과를 알고 보니 쉽다. 진짜 연습은 진행 중인 회사로 한다. 전략을 바꿔 살리려는 회사와, 문제는 보이는데 비용 절감·자산 매각으로 버티기만 하는 회사를 나눴다.
              &ldquo;살아나는지 확인할 신호&rdquo;를 분기마다 직접 체크해 보자. ({WATCH_AS_OF})
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSide('turn')} className={chip(side === 'turn')}>살리려고 바꾸는 회사 {WATCH.filter(w => w.side === 'turn').length}</button>
            <button onClick={() => setSide('drift')} className={chip(side === 'drift')}>버티기만 하는 회사 {WATCH.filter(w => w.side === 'drift').length}</button>
          </div>
          <div className="space-y-1.5">
            {WATCH.filter(w => w.side === side).map(w => {
              const isOpen = openW === w.name
              const h = w.key ? hrefOf(w.key) : null
              return (
                <div key={w.name} className="rounded-lg border border-gray-200 dark:border-gray-800">
                  <button onClick={() => setOpenW(isOpen ? null : w.name)} className="w-full text-left px-3 py-2">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{w.name}</span>
                      <span className="text-[11px] text-gray-400">{w.since}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${w.side === 'turn' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'}`}>{catOf(w.cat)?.short}</span>
                      <span className="ml-auto text-xs text-gray-400">{isOpen ? '접기 ▲' : '펼치기 ▼'}</span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed"><b>배울 점:</b> {w.lesson}</p>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs leading-relaxed">
                      <p className="text-gray-700 dark:text-gray-200"><b>무엇이 무너지고 있나:</b> {w.problem}</p>
                      <p className="text-gray-700 dark:text-gray-200"><b>{w.side === 'turn' ? '어떻게 바꾸고 있나' : '어떻게 버티고 있나'}:</b> {w.action}</p>
                      <p className="text-blue-700 dark:text-blue-300"><b>살아나는지 확인할 신호:</b> {w.check}</p>
                      {h && <Link href={h} className="inline-block text-blue-600 dark:text-blue-400 hover:underline">이 회사의 지금 분석 보기 →</Link>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 실패의 8가지 길 */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">기업이 무너지는 8가지 길 — 그리고 내가 할 일</h2>
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
                {CAT_RULES[c.id] && (
                  <ul className="mt-1.5 space-y-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                    {CAT_RULES[c.id].map(r => <li key={r}>✓ {r}</li>)}
                  </ul>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* 사례 */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mr-2">실패 사례 {shown.length}개</h2>
            <button onClick={() => setCat('all')} className={chip(cat === 'all')}>전체</button>
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)} className={chip(cat === c.id)}>{c.short}</button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">닫힌 상태에서도 교훈이 보인다. 펼치면 &ldquo;내가 주주였다면 언제 무엇을 보고 행동했어야 했나&rdquo;와 그때의 이야기가 나온다.</p>
          <div className="space-y-1.5">
            {shown.map(c => {
              const isOpen = open === c.name
              const h = c.key ? hrefOf(c.key) : null
              return (
                <div key={c.name} id={`case-${c.name}`} className={`rounded-lg border ${isOpen ? 'border-blue-400 dark:border-blue-700' : 'border-gray-200 dark:border-gray-800'}`}>
                  <button onClick={() => setOpen(isOpen ? null : c.name)} className="w-full text-left px-3 py-2">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</span>
                      <span className="text-[11px] text-gray-400">{c.years}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300">{catOf(c.cat)?.short}</span>
                      <span className="ml-auto text-xs text-gray-400">{isOpen ? '접기 ▲' : '펼치기 ▼'}</span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed"><b>교훈:</b> {c.lesson}</p>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs leading-relaxed">
                      {ME[c.name] && <p className="rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 px-2 py-1.5"><b>내가 주주였다면:</b> {ME[c.name]}</p>}
                      <p className="text-amber-700 dark:text-amber-300"><b>그때 놓친 신호:</b> {c.missed}</p>
                      <p className="text-gray-700 dark:text-gray-200"><b>무슨 일이 있었나:</b> {c.story}</p>
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
                  <p className="text-emerald-700 dark:text-emerald-300 mt-1"><b>교훈:</b> {s.lesson}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-0.5"><b>위기:</b> {s.crisis}</p>
                  <p className="text-gray-700 dark:text-gray-200 mt-0.5"><b>어떻게:</b> {s.how}</p>
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

        <p className="text-[11px] text-gray-400">널리 알려진 사실을 바탕으로 정리했고, 금액은 대략값이다. &ldquo;지금 위기의 회사&rdquo;는 {WATCH_AS_OF}이며 결과는 정해지지 않았다 — 매수·매도 추천이 아니다.</p>
      </div>
    </div>
  )
}
