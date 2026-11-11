'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { UNIV } from '../../universe'

export type NoteEntry = {
  id: number
  q: string
  y: number | null
  page: string
  a: { who: string; t: string }[]
  n: { t: string; d: string | null }[]
  topics: string[]
  stocks: string[]
}

export function stockHref(key: string) {
  const f = UNIV[key] ?? ''
  const u = f.includes('S') ? 'sp500' : f.includes('N') ? 'ndx' : f.includes('M') ? 'mid' : f.includes('R') ? 'r2k' : f.includes('Q') ? 'nasdaq' : 'other'
  return `/private/${u}?s=${key}`
}

const WHO: Record<string, string> = {
  버핏: 'text-blue-700 dark:text-blue-300', 멍거: 'text-emerald-700 dark:text-emerald-300', '그레그 에이블': 'text-purple-700 dark:text-purple-300',
}

// 카드 하나: 질문(연도) → 버핏·멍거 답 → 내 생각
export function NoteCard({ e, topicName, hi }: { e: NoteEntry; topicName?: Record<string, string>; hi?: string }) {
  const mark = (t: string) => {
    if (!hi) return t
    const i = t.toLowerCase().indexOf(hi.toLowerCase())
    if (i < 0) return t
    return <>{t.slice(0, i)}<mark className="bg-yellow-200 dark:bg-yellow-700/60 rounded px-0.5">{t.slice(i, i + hi.length)}</mark>{t.slice(i + hi.length)}</>
  }
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {e.y && <span className="text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{e.y}년</span>}
        <p className="text-sm font-semibold text-gray-900 dark:text-white flex-1 min-w-0">{mark(e.q)}</p>
      </div>
      {e.a.length > 0 && (
        <div className="space-y-1">
          {e.a.map((a, i) => (
            <p key={i} className="text-xs leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-line">
              <b className={WHO[a.who] ?? 'text-gray-700 dark:text-gray-200'}>{a.who}</b> {mark(a.t)}
            </p>
          ))}
        </div>
      )}
      {e.n.map((n, i) => (
        <div key={i} className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 px-2.5 py-1.5">
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">내 생각{n.d ? ` · ${n.d}` : ''}</p>
          <p className="text-xs leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-line">{mark(n.t)}</p>
        </div>
      ))}
      {(e.stocks.length > 0 || (topicName && e.topics.length > 0)) && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {e.stocks.map(k => <Link key={k} href={stockHref(k)} className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:underline">{k} →</Link>)}
          {topicName && e.topics.map(t => <span key={t} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{topicName[t]}</span>)}
        </div>
      )}
      <p className="text-[10px] text-gray-400">책 {e.page}쪽 부근</p>
    </div>
  )
}

const DECADES = [['all', '전체'], ['1980', '1980년대'], ['1990', '1990년대'], ['2000', '2000년대'], ['2010', '2010년대']] as const

export default function NotesClient({ topics, entries }: { topics: [string, string][]; entries: NoteEntry[] }) {
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('all')
  const [dec, setDec] = useState<string>('all')
  const [limit, setLimit] = useState(30)
  const topicName = Object.fromEntries(topics)
  const count = (k: string) => entries.filter(e => k === 'all' || e.topics.includes(k)).length

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const r = entries.filter(e =>
      (topic === 'all' || e.topics.includes(topic)) &&
      (dec === 'all' || (e.y != null && Math.floor(e.y / 10) * 10 === Number(dec))) &&
      (!qq || [e.q, ...e.a.map(a => a.t), ...e.stocks].join(' ').toLowerCase().includes(qq)))
    return r
  }, [entries, q, topic, dec])

  const chip = (on: boolean) => `px-2.5 py-1 rounded-full text-xs ${on ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="space-y-1">
          <Link href="/private/buffett" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">← 버핏·멍거의 회사들</Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">버핏·멍거 주주총회 — 중요한 질문과 답</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            1986~2018년 주주총회에서 나온 질문과 버핏·멍거의 답 중 중요하다고 본 {entries.length}개. 주제·연도로 찾아보고,
            회사 이름이 나오면 그 종목 화면으로 연결된다.
          </p>
        </div>

        <div className="space-y-2">
          <input value={q} onChange={e => { setQ(e.target.value); setLimit(30) }} placeholder="검색 — 예: 인플레이션, 코카콜라, 해자, 질투"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={chip(topic === 'all')} onClick={() => { setTopic('all'); setLimit(30) }}>전체 {count('all')}</button>
            {topics.map(([k, l]) => <button key={k} type="button" className={chip(topic === k)} onClick={() => { setTopic(k); setLimit(30) }}>{l} {count(k)}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {DECADES.map(([k, l]) => <button key={k} type="button" className={chip(dec === k)} onClick={() => { setDec(k); setLimit(30) }}>{l}</button>)}
          </div>
          <p className="text-[11px] text-gray-400">{list.length}개</p>
        </div>

        <div className="space-y-2.5">
          {list.slice(0, limit).map(e => <NoteCard key={e.id} e={e} topicName={topicName} hi={q.trim() || undefined} />)}
        </div>
        {list.length > limit && (
          <button type="button" onClick={() => setLimit(l => l + 30)} className="w-full rounded-lg border border-gray-200 dark:border-gray-800 py-2 text-sm text-blue-600 dark:text-blue-400">더 보기 ({list.length - limit}개 남음)</button>
        )}
        <p className="text-[11px] text-gray-400">질문·답은 책에서 옮긴 요약 문장이다. 로그인해야 열리는 개인 페이지 전용.</p>
      </div>
    </div>
  )
}
