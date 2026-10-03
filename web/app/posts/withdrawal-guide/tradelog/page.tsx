'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ─── 타입 ────────────────────────────────────────────────────

interface TradeEntry {
  date:    string
  action:  'BUY' | 'SELL'
  ndx:     number
  ema200:  number
  div_pct: number
  port:    number
  days:    number
}

interface CohortData {
  start:     string
  complete:  boolean
  initial:   'INVESTED' | 'CASH'
  final:     number
  withdrawn: number
  bankrupt:  boolean
  trades:    TradeEntry[]
}

interface Meta {
  generated:    string
  strategy:     string
  desc:         string
  sim_years:    number
  n_cohorts:    number
  n_complete:   number
  median_final: number
  avg_trades:   number
}

interface TradelogData {
  meta:    Meta
  cohorts: CohortData[]
}

// ─── 유틸 ────────────────────────────────────────────────────

function fmt억(v: number) {
  if (v < 0) return '파산'
  if (v >= 10000) return `${(v / 10000).toFixed(1)}조`
  return `${v.toFixed(1)}억`
}

function fmtPct(v: number) {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

// ─── 내부 컴포넌트 ────────────────────────────────────────────

function TradelogInner() {
  const params  = useSearchParams()
  const router  = useRouter()

  const [data,       setData]      = useState<TradelogData | null>(null)
  const [loading,    setLoading]   = useState(true)
  const [search,     setSearch]    = useState('')
  const [withCosts,  setWithCosts] = useState(false)

  const selectedStart = params.get('start') ?? ''

  useEffect(() => {
    setLoading(true)
    setData(null)
    const url = withCosts ? '/data/s0_tradelog_v2.json' : '/data/s0_tradelog.json'
    fetch(url)
      .then(r => r.json())
      .then((d: TradelogData) => { setData(d); setLoading(false) })
  }, [withCosts])

  const filteredCohorts = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.cohorts
    return data.cohorts.filter(c => c.start.includes(search.trim()))
  }, [data, search])

  const cohort = useMemo(
    () => data?.cohorts.find(c => c.start === selectedStart) ?? data?.cohorts[0] ?? null,
    [data, selectedStart]
  )

  const activeCohort = useMemo(
    () => selectedStart && cohort?.start === selectedStart ? cohort : (data?.cohorts[0] ?? null),
    [cohort, selectedStart, data]
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">데이터 로딩 중…</p>
      </div>
    )
  }
  if (!data || !activeCohort) return null

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-7xl" />

      <main className="max-w-7xl mx-auto px-4 py-10">

        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/posts/withdrawal-guide"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">
            ← 인출 방법론으로
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-1">S0 전략 — 거래 로그 전체 공개</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                EMA200 15일 연속 + 동적 인출률 · 초기 10억 · 20년 시뮬레이션
              </p>
            </div>
            {/* 비용 모드 선택 */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shrink-0">
              <p className="text-xs text-gray-400 mb-1.5">비용 반영</p>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
                <button
                  onClick={() => setWithCosts(false)}
                  className={`flex-1 px-3 py-1.5 transition-colors ${
                    !withCosts
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                  }`}
                >
                  운용보수만
                </button>
                <button
                  onClick={() => setWithCosts(true)}
                  className={`flex-1 px-3 py-1.5 border-l border-gray-200 dark:border-gray-700 transition-colors ${
                    withCosts
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
                  }`}
                >
                  + 스왑금리
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-lg px-3 py-2 inline-block">
            {withCosts
              ? '✅ TQQQ 스왑금리비용 반영 · RP 이자 미반영 (현금 보유 수익 미포함)'
              : '⚠ TQQQ 스왑금리비용 미반영 · RP 이자도 미반영 (두 효과를 함께 반영하려면 위 토글 사용)'
            }
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* 왼쪽: 시작 시점 목록 */}
          <div className="lg:w-52 shrink-0">
            <div className="sticky top-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                시작 시점 선택 ({data.meta.n_cohorts}개)
              </p>
              <input
                type="text"
                placeholder="예: 2000-03"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full mb-2 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                  {filteredCohorts.map(c => {
                    const isActive = c.start === (activeCohort?.start ?? '')
                    return (
                      <button
                        key={c.start}
                        onClick={() => router.push(`?start=${c.start}`, { scroll: false })}
                        className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span>{c.start}</span>
                        {!c.complete && (
                          <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-600">진행중</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 거래 로그 */}
          <div className="flex-1 min-w-0">

            {/* 코호트 요약 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-4 mb-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {activeCohort.start} 시작
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  activeCohort.complete
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {activeCohort.complete ? '20년 완료' : '진행 중'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeCohort.initial === 'CASH'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  시작 포지션: {activeCohort.initial === 'CASH' ? '현금 (NDX < EMA200)' : '투자 (NDX ≥ EMA200)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">최종 자산</p>
                  <p className={`font-bold text-base ${
                    activeCohort.bankrupt ? 'text-red-500' :
                    activeCohort.final >= 1000 ? 'text-green-600 dark:text-green-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {fmt억(activeCohort.final)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">총 인출액</p>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">
                    {fmt억(activeCohort.withdrawn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">거래 횟수</p>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">
                    {activeCohort.trades.length}회
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">전체 기준 중앙값</p>
                  <p className="font-semibold text-base text-blue-600 dark:text-blue-400">
                    {fmt억(data.meta.median_final)}
                  </p>
                </div>
              </div>
            </div>

            {/* 거래 없음 */}
            {activeCohort.trades.length === 0 && (
              <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center border border-gray-100 dark:border-gray-800 rounded-xl">
                이 시작 시점에서는 20년간 매수/매도 신호가 발생하지 않았습니다.<br />
                <span className="text-xs">(시작부터 끝까지 내내 투자 상태 유지)</span>
              </div>
            )}

            {/* 거래 로그 테이블 */}
            {activeCohort.trades.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {['#', '날짜', '신호', 'NDX 종가', 'EMA200', '이격도', '포트폴리오'].map(h => (
                        <th key={h} className="py-2 px-3 text-left text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {activeCohort.trades.map((t, i) => {
                      const isSell = t.action === 'SELL'
                      return (
                        <tr
                          key={i}
                          className={`${
                            isSell
                              ? 'bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'bg-green-50/60 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          <td className="py-2 px-3 text-xs text-gray-400 dark:text-gray-600 font-mono">
                            {i + 1}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {t.date}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isSell
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                            }`}>
                              {isSell ? '매도' : '매수'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-700 dark:text-gray-300 text-right">
                            {t.ndx.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-500 dark:text-gray-400 text-right">
                            {t.ema200.toLocaleString()}
                          </td>
                          <td className={`py-2 px-3 font-mono text-xs text-right font-semibold ${
                            t.div_pct < 0
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {fmtPct(t.div_pct)}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-right font-semibold text-gray-800 dark:text-gray-200">
                            {fmt억(t.port)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 범례 */}
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 space-y-1">
              <p>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 mr-1.5 align-middle" />
                매도 = NDX가 EMA200 아래에서 {data.meta.strategy === 'S0' ? '15' : '—'}거래일 연속 → 전량 현금 전환
              </p>
              <p>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mr-1.5 align-middle" />
                매수 = NDX가 EMA200 위에서 {data.meta.strategy === 'S0' ? '15' : '—'}거래일 연속 → 전액 재매수
              </p>
              <p className="mt-1">
                이격도 = (NDX − EMA200) ÷ EMA200 × 100. 매도 시 음수(-), 매수 시 양수(+).
              </p>
              <p>포트폴리오 = 거래 직후 총 자산 (억 원). RP 이자 / TQQQ 스왑 비용 둘 다 미반영.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default function TradelogPage() {
  return (
    <Suspense>
      <TradelogInner />
    </Suspense>
  )
}
