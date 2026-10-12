'use client'

import { useEffect, useState, useMemo, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

// ─── 타입 ────────────────────────────────────────────────────

// daily 행 형식: [date, ndx, ema200, peak52w, port, pos, act]
type DailyRow = [string, number, number|null, number, number, 0|1, 'B'|'S'|null]

interface MetaCohort {
  s:        string  // "YYYY-MM"
  end:      string  // "YYYY-MM-DD"
  inv:      boolean
  final:    number
  wd:       number
  yrs:      number
  dd:       number
  n_trades: number
}

interface MetaFile {
  generated: string
  strategy:  string
  desc:      string
  n_cohorts: number
  cohorts:   MetaCohort[]
}

// ─── 상수 ────────────────────────────────────────────────────

const PAGE_SIZE = 200
const META_URL  = '/data/withdrawal_daily_rule25_meta.json'
const DATA_DIR  = '/data/withdrawal_daily_rule25'

// ─── 유틸 ────────────────────────────────────────────────────

function fmt억(v: number) {
  if (v < 0) return '파산'
  if (v >= 100000) return `${(v / 10000).toFixed(0)}조`
  if (v >= 10000)  return `${(v / 10000).toFixed(1)}조`
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

  const [metaData,      setMetaData]      = useState<MetaFile | null>(null)
  const [dailyRows,     setDailyRows]     = useState<DailyRow[] | null>(null)
  const [metaLoading,   setMetaLoading]   = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search,        setSearch]        = useState('')
  const [page,          setPage]          = useState(0)
  const [jumpTarget,    setJumpTarget]    = useState<string | null>(null)

  const selectedStart = params.get('start') ?? ''
  const tableRef = useRef<HTMLDivElement>(null)

  // ── 메타 데이터 로드 ──
  useEffect(() => {
    setMetaLoading(true)
    fetch(META_URL)
      .then(r => r.json())
      .then((d: MetaFile) => {
        setMetaData(d)
        setMetaLoading(false)
      })
  }, [])

  // ── 코호트 상세 로드 ──
  useEffect(() => {
    if (!metaData) return
    const start = selectedStart || metaData.cohorts[0]?.s
    if (!start) return

    setDetailLoading(true)
    setDailyRows(null)
    setPage(0)
    fetch(`${DATA_DIR}/${start}.json`)
      .then(r => r.json())
      .then((rows: DailyRow[]) => {
        setDailyRows(rows)
        setDetailLoading(false)
      })
  }, [metaData, selectedStart])

  // ── 점프 처리 ──
  useEffect(() => {
    if (!jumpTarget || !dailyRows) return
    const rowIdx = dailyRows.findIndex(r => r[0] === jumpTarget)
    if (rowIdx < 0) return
    const targetPage = Math.floor(rowIdx / PAGE_SIZE)
    if (page !== targetPage) {
      setPage(targetPage)
      setTimeout(() => {
        document.getElementById(`row-${jumpTarget}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setJumpTarget(null)
      }, 100)
    } else {
      document.getElementById(`row-${jumpTarget}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setJumpTarget(null)
    }
  }, [jumpTarget, dailyRows, page])

  // ── 파생 데이터 ──
  const filteredCohorts = useMemo(() => {
    if (!metaData) return []
    if (!search.trim()) return metaData.cohorts
    return metaData.cohorts.filter(c => c.s.includes(search.trim()))
  }, [metaData, search])

  const activeMeta = useMemo(
    () => metaData?.cohorts.find(c => c.s === (selectedStart || metaData?.cohorts[0]?.s)) ?? null,
    [metaData, selectedStart]
  )

  const trades = useMemo(
    () => dailyRows ? dailyRows.filter(r => r[6] !== null) : [],
    [dailyRows]
  )

  const pagedRows = useMemo(() => {
    if (!dailyRows) return []
    return dailyRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }, [dailyRows, page])

  const totalPages = dailyRows ? Math.ceil(dailyRows.length / PAGE_SIZE) : 0

  const medianFinal = useMemo(() => {
    if (!metaData) return 0
    const vals = [...metaData.cohorts.map(c => c.final)].sort((a, b) => a - b)
    const mid = Math.floor(vals.length / 2)
    return vals.length % 2 === 0 ? (vals[mid - 1] + vals[mid]) / 2 : vals[mid]
  }, [metaData])

  if (metaLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">데이터 로딩 중…</p>
      </div>
    )
  }
  if (!metaData || !activeMeta) return null

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
          <h1 className="text-2xl font-bold mb-1">25% 룰 — 날짜별 전체 데이터 공개</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            52주 고점 −25% 매도 · 지수이동평균(200일) 위 15일 연속 재매수 · 동적 인출률 · 초기 10억 · 시작 시점부터 데이터 끝까지
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-lg px-3 py-2 inline-block">
            ℹ 스왑금리비용 + 현금 RP 이자(이자소득세 15.4% 차감) + 모든 매도 양도차익세 22% 반영
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* 왼쪽: 시작 시점 목록 */}
          <div className="lg:w-52 shrink-0">
            <div className="sticky top-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                시작 시점 선택 ({metaData.n_cohorts}개)
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
                    const isActive = c.s === activeMeta.s
                    return (
                      <button
                        key={c.s}
                        onClick={() => router.push(`?start=${c.s}`, { scroll: false })}
                        className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span>{c.s}</span>
                        <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-500">
                          {c.yrs.toFixed(0)}년
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 상세 */}
          <div className="flex-1 min-w-0">

            {/* 코호트 요약 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-4 mb-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {activeMeta.s} 시작
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                  {activeMeta.yrs.toFixed(1)}년 진행 ({activeMeta.s} → {activeMeta.end})
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeMeta.inv
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                }`}>
                  시작 포지션: {activeMeta.inv ? '투자 (NDX ≥ EMA200)' : '현금 (NDX < EMA200)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">최종 자산 ({activeMeta.end} 기준)</p>
                  <p className={`font-bold text-base ${
                    activeMeta.final >= 1000 ? 'text-green-600 dark:text-green-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {fmt억(activeMeta.final)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">총 인출액</p>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">
                    {fmt억(activeMeta.wd)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">거래 횟수</p>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">
                    {detailLoading ? '…' : `${trades.length}회`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">전체 중앙값</p>
                  <p className="font-semibold text-base text-blue-600 dark:text-blue-400">
                    {fmt억(medianFinal)}
                  </p>
                </div>
              </div>
            </div>

            {/* 거래 이벤트 요약 */}
            {!detailLoading && trades.length > 0 && (
              <div className="mb-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  거래 이벤트 ({trades.length}회) — 클릭하면 해당 날짜로 이동
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {trades.map((t, i) => {
                    const isSell = t[6] === 'S'
                    return (
                      <button
                        key={i}
                        onClick={() => setJumpTarget(t[0])}
                        className={`text-[11px] font-mono px-2 py-1 rounded-md border transition-colors ${
                          isSell
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                        }`}
                      >
                        {isSell ? '▼' : '▲'} {t[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 로딩 */}
            {detailLoading && (
              <div className="py-12 text-center text-gray-400 text-sm border border-gray-100 dark:border-gray-800 rounded-xl">
                데이터 로딩 중…
              </div>
            )}

            {/* 전체 일별 테이블 */}
            {!detailLoading && dailyRows && (
              <>
                {/* 페이지네이션 상단 */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    총 {dailyRows.length.toLocaleString()}거래일 ·&nbsp;
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, dailyRows.length)}행 표시
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setPage(0); tableRef.current?.scrollTo(0, 0) }}
                      disabled={page === 0}
                      className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >처음</button>
                    <button
                      onClick={() => { setPage(p => Math.max(0, p - 1)); tableRef.current?.scrollTo(0, 0) }}
                      disabled={page === 0}
                      className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >‹</button>
                    <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
                      {page + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); tableRef.current?.scrollTo(0, 0) }}
                      disabled={page >= totalPages - 1}
                      className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >›</button>
                    <button
                      onClick={() => { setPage(totalPages - 1); tableRef.current?.scrollTo(0, 0) }}
                      disabled={page >= totalPages - 1}
                      className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >끝</button>
                  </div>
                </div>

                <div ref={tableRef} className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        {['날짜', 'NDX 종가', 'EMA200', '52주 고점 대비', '포트폴리오', '포지션', '신호'].map(h => (
                          <th key={h} className="py-2 px-3 text-left text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                      {pagedRows.map((row) => {
                        const [date, ndx, ema, peak52w, port, pos, act] = row
                        const isSell     = act === 'S'
                        const isBuy      = act === 'B'
                        const isTrade    = isSell || isBuy
                        const isInvested = pos === 1
                        const fromPeak   = peak52w > 0 ? (ndx - peak52w) / peak52w * 100 : null

                        return (
                          <tr
                            id={`row-${date}`}
                            key={date}
                            className={`${
                              isSell      ? 'bg-red-50 dark:bg-red-900/15' :
                              isBuy       ? 'bg-green-50 dark:bg-green-900/15' :
                              !isInvested ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''
                            } ${isTrade ? 'font-semibold' : ''}`}
                          >
                            <td className={`py-1.5 px-3 font-mono text-xs whitespace-nowrap ${
                              isTrade ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {date}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-xs text-right text-gray-700 dark:text-gray-300">
                              {ndx.toLocaleString()}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-xs text-right text-gray-500 dark:text-gray-400">
                              {ema !== null ? ema.toLocaleString() : '—'}
                            </td>
                            <td className={`py-1.5 px-3 font-mono text-xs text-right ${
                              fromPeak === null  ? 'text-gray-300 dark:text-gray-600' :
                              fromPeak <= -25    ? 'text-red-600 dark:text-red-400 font-bold' :
                              fromPeak < 0       ? 'text-red-500 dark:text-red-400' :
                                                   'text-gray-500 dark:text-gray-400'
                            }`}>
                              {fromPeak !== null ? fmtPct(fromPeak) : '—'}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-xs text-right font-semibold text-gray-800 dark:text-gray-200">
                              {fmt억(port)}
                            </td>
                            <td className="py-1.5 px-3 text-xs text-center">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                isInvested ? 'bg-blue-400 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                              }`} />
                              <span className={`ml-1 text-[10px] ${
                                isInvested ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                              }`}>
                                {isInvested ? '투자' : '현금'}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-xs text-center">
                              {isTrade ? (
                                <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                  isSell
                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                    : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                                }`}>
                                  {isSell ? '매도' : '매수'}
                                </span>
                              ) : (
                                <span className="text-gray-200 dark:text-gray-700">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 하단 */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo(0, document.body.scrollHeight) }}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    ‹ 이전 {PAGE_SIZE}행
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {page + 1} / {totalPages} 페이지
                  </span>
                  <button
                    onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo(0, document.body.scrollHeight) }}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    다음 {PAGE_SIZE}행 ›
                  </button>
                </div>
              </>
            )}

            {/* 범례 */}
            {!detailLoading && dailyRows && (
              <div className="mt-5 text-xs text-gray-400 dark:text-gray-500 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-4">
                <p>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 mr-1.5 align-middle" />
                  <strong>매도</strong> = NDX가 52주 고점보다 25% 이상 낮게 마감 → 다음 거래일 전량 현금 전환
                </p>
                <p>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mr-1.5 align-middle" />
                  <strong>매수</strong> = NDX가 지수이동평균(200일) 위에서 15거래일 연속 → 다음 거래일 전액 재매수
                </p>
                <p>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 mr-1.5 align-middle" />
                  파란색 = 투자 상태 · 회색 = 현금 상태 (매도 후 대기)
                </p>
                <p>52주 고점 대비 = (NDX − 52주 최고 종가) ÷ 52주 최고 종가 × 100. −25% 이하이면 빨간 강조.</p>
                <p>포트폴리오 = 해당 날짜 기준 총 자산 (억 원). 스왑금리비용 + RP 이자 + 양도차익세 모두 반영.</p>
              </div>
            )}

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
