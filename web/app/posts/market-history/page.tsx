'use client'

import { useState, useEffect, useMemo } from 'react'
import Header from '@/components/Header'

interface CorrectionEvent {
  id: string
  name_ko: string
  peak_date: string
  trough_date: string
  recovery_date: string | null
  drawdown_pct: number
  duration_days: number
  recovery_days: number | null
  category: string
  triggers_ko: string[]
  characteristics_ko: string[]
  fed_rate: number
  inflation_rate: number
  grade: string
  note?: string
}

interface CorrectionData {
  metadata: { total_events: number; grade_scale: Record<string, string> }
  corrections: CorrectionEvent[]
}

const GRADE_INFO: Record<string, { label: string; range: string; bg: string; text: string; border: string }> = {
  S: { label: '대공황급',     range: '-80% 이상',    bg: 'bg-red-900',    text: 'text-red-100',    border: 'border-red-700' },
  A: { label: '시스템 위기',  range: '-45~-80%',     bg: 'bg-red-700',    text: 'text-red-100',    border: 'border-red-500' },
  B: { label: '심각한 약세장',range: '-30~-45%',     bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-400' },
  C: { label: '약세장',       range: '-20~-30%',     bg: 'bg-amber-500',  text: 'text-amber-100',  border: 'border-amber-400' },
  D: { label: '깊은 조정',    range: '-15~-20%',     bg: 'bg-yellow-500', text: 'text-yellow-900', border: 'border-yellow-400' },
  E: { label: '중간 조정',    range: '-10~-15%',     bg: 'bg-blue-500',   text: 'text-blue-100',   border: 'border-blue-400' },
  F: { label: '소규모 조정',  range: '-5~-10%',      bg: 'bg-green-600',  text: 'text-green-100',  border: 'border-green-500' },
  G: { label: '소규모 조정',  range: '0~-5%',        bg: 'bg-gray-500',   text: 'text-gray-100',   border: 'border-gray-400' },
}

const CAT_GROUPS: { key: string; label: string; subs: string[] }[] = [
  { key: 'all',     label: '전체',         subs: [] },
  { key: 'war',     label: '전쟁·지정학',  subs: ['war', 'terrorism', 'geopolitical'] },
  { key: 'economy', label: '경제·금융',    subs: ['financial_crisis', 'financial_stress', 'recession', 'inflation', 'trade_war'] },
  { key: 'policy',  label: '통화정책',     subs: ['monetary_policy'] },
  { key: 'politics',label: '정치·사회',    subs: ['election', 'political_scandal', 'social', 'legislation'] },
  { key: 'disaster',label: '재해·팬데믹',  subs: ['natural_disaster', 'pandemic'] },
  { key: 'tech',    label: '기술·버블',    subs: ['technology', 'bubble', 'corporate_scandal', 'technical'] },
]

function daysToText(days: number | null): string {
  if (days === null) return '미회복'
  if (days < 30) return `${days}일`
  const months = Math.round(days / 30.4)
  if (months < 12) return `${months}개월`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}년 ${rem}개월` : `${years}년`
}

function yearOf(d: string) { return d.slice(0, 4) }

const GRADES_ORDER = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
const SERIOUS_GRADES = new Set(['S', 'A', 'B', 'C', 'D'])

export default function MarketHistoryPage() {
  const [data, setData] = useState<CorrectionData | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set(GRADES_ORDER))
  const [catFilter, setCatFilter] = useState('all')
  const [sort, setSort] = useState<'date' | 'drawdown' | 'duration' | 'recovery'>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showMinor, setShowMinor] = useState(false)

  useEffect(() => {
    fetch('/data/sp500_corrections_history.json').then(r => r.json()).then(setData)
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    const catSubs = CAT_GROUPS.find(g => g.key === catFilter)?.subs ?? []
    const q = search.trim().toLowerCase()

    return data.corrections
      .filter(e => {
        if (!showMinor && !SERIOUS_GRADES.has(e.grade)) return false
        if (!selectedGrades.has(e.grade)) return false
        if (catFilter !== 'all' && !catSubs.includes(e.category)) return false
        if (q && !e.name_ko.toLowerCase().includes(q) && !e.triggers_ko.join(' ').toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        let diff = 0
        if (sort === 'date')     diff = a.peak_date.localeCompare(b.peak_date)
        if (sort === 'drawdown') diff = a.drawdown_pct - b.drawdown_pct
        if (sort === 'duration') diff = a.duration_days - b.duration_days
        if (sort === 'recovery') diff = (a.recovery_days ?? 99999) - (b.recovery_days ?? 99999)
        return sortAsc ? diff : -diff
      })
  }, [data, selectedGrades, catFilter, sort, sortAsc, search, showMinor])

  const stats = useMemo(() => {
    if (!data) return null
    const gc: Record<string, number> = {}
    data.corrections.forEach(e => { gc[e.grade] = (gc[e.grade] ?? 0) + 1 })
    return gc
  }, [data])

  function toggleGrade(g: string) {
    setSelectedGrades(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g); else next.add(g)
      return next
    })
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSort(key: typeof sort) {
    if (sort === key) setSortAsc(v => !v)
    else { setSort(key); setSortAsc(false) }
  }

  const sortLabel = (key: typeof sort, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        sort === key
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
          : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-500'
      }`}
    >
      {label} {sort === key ? (sortAsc ? '↑' : '↓') : ''}
    </button>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">장기투자</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">조정장 역사서</h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            S&P500이 -5% 이상 하락한 사건 478건 — 1871년부터 2025년까지. 장기투자가 얼마나 많은 노이즈를 견뎌야 하는지 기록한다.
            전쟁, 테러, 선거, 금리 충격, 팬데믹, 스캔들... 이 모든 것을 겪고도 시장은 우상향했다.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            S&P500 기준 (1957년 이전은 S&P Composite 지수 사용) · 종가 기준 · 출처: Yardeni Research, Hartford Funds, FRED
          </p>
        </div>

        {/* 등급 범례 */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-6">
          {GRADES_ORDER.map(g => {
            const info = GRADE_INFO[g]
            const count = stats?.[g] ?? 0
            const active = selectedGrades.has(g)
            const isMinorGrade = g === 'F' || g === 'G'
            return (
              <button
                key={g}
                onClick={() => {
                  if (isMinorGrade && !showMinor) {
                    setShowMinor(true)
                    setSelectedGrades(prev => { const n = new Set(prev); n.add(g); return n })
                  } else {
                    toggleGrade(g)
                  }
                }}
                className={`rounded-xl px-2 py-2 text-center transition-all border ${
                  active && (showMinor || !isMinorGrade)
                    ? `${info.bg} ${info.text} ${info.border}`
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800'
                }`}
              >
                <p className="text-sm font-black">{g}</p>
                <p className="text-[10px] leading-tight mt-0.5">{info.range}</p>
                <p className="text-xs font-bold mt-1">{count}건</p>
              </button>
            )
          })}
        </div>

        {/* 소규모 조정 토글 */}
        {!showMinor && (
          <div className="mb-5 flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              F·G등급 (소규모 조정 348건) 숨김 중
            </span>
            <button
              onClick={() => setShowMinor(true)}
              className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
            >
              전부 보기
            </button>
          </div>
        )}
        {showMinor && (
          <div className="mb-5">
            <button
              onClick={() => { setShowMinor(false); setSelectedGrades(new Set(GRADES_ORDER)) }}
              className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
            >
              소규모 조정 숨기기
            </button>
          </div>
        )}

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CAT_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setCatFilter(g.key)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                catFilter === g.key
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white font-medium'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* 정렬 + 검색 */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex gap-1.5 flex-wrap">
            {sortLabel('date',     '날짜순')}
            {sortLabel('drawdown', '하락폭순')}
            {sortLabel('duration', '기간순')}
            {sortLabel('recovery', '회복기간순')}
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="이름·원인 검색"
            className="ml-auto text-sm px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 w-44"
          />
        </div>

        {/* 결과 수 */}
        {data && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {filtered.length}건 표시 · 전체 {data.corrections.length}건
          </p>
        )}

        {/* 이벤트 목록 */}
        {!data ? (
          <p className="text-sm text-gray-400 py-10 text-center">불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">조건에 맞는 사건이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(e => {
              const info = GRADE_INFO[e.grade]
              const isOpen = expanded.has(e.id)
              return (
                <div
                  key={e.id}
                  className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(e.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* 등급 배지 */}
                      <span className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${info.bg} ${info.text}`}>
                        {e.grade}
                      </span>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{e.name_ko}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{yearOf(e.peak_date)}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-mono font-semibold text-red-600 dark:text-red-400">{e.drawdown_pct.toFixed(1)}%</span>
                          <span>하락 {daysToText(e.duration_days)}</span>
                          <span>회복 {daysToText(e.recovery_days)}</span>
                        </div>
                      </div>

                      {/* 화살표 */}
                      <span className="text-gray-400 dark:text-gray-600 text-sm shrink-0 mt-0.5">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
                      <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-300">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1.5">원인</p>
                          <ul className="space-y-1">
                            {e.triggers_ko.map((t, i) => (
                              <li key={i} className="flex gap-1.5"><span className="text-gray-400 shrink-0">·</span>{t}</li>
                            ))}
                          </ul>
                        </div>
                        {e.characteristics_ko.length > 0 && (
                          <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1.5">특징</p>
                            <ul className="space-y-1">
                              {e.characteristics_ko.map((c, i) => (
                                <li key={i} className="flex gap-1.5"><span className="text-gray-400 shrink-0">·</span>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                        <span>고점 {e.peak_date.slice(0, 7)}</span>
                        <span>저점 {e.trough_date.slice(0, 7)}</span>
                        {e.recovery_date && <span>회복 {e.recovery_date.slice(0, 7)}</span>}
                        {e.fed_rate > 0 && <span>기준금리 {e.fed_rate}%</span>}
                        {e.inflation_rate !== 0 && <span>물가상승률 {e.inflation_rate}%</span>}
                        {e.note && <span className="italic">{e.note}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-12 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800 pt-6 space-y-1">
          <p>S&P500 기준. 1957년 이전은 S&P Composite 지수(S&P500의 전신). 날짜·수치는 종가 기준이며 일부 초기 데이터는 월별 종가 추정치.</p>
          <p>등급: S(-80%+) A(-45~-80%) B(-30~-45%) C(-20~-30%) D(-15~-20%) E(-10~-15%) F(-5~-10%) G(0~-5%)</p>
          <p>출처: Yardeni Research, Hartford Funds, Wall Street Courier, Wikipedia, FRED</p>
        </div>
      </main>
    </div>
  )
}
