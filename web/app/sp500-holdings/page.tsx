'use client'

import { useState, useMemo } from 'react'
import Header from '@/components/Header'
import { HOLDINGS, META, type Holding } from './data'
import { WEBSITES } from './websites'

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

function rowBg(h: Holding, idx: number) {
  if (h.type === 'cash')    return 'bg-yellow-50 dark:bg-yellow-900/20'
  if (h.type === 'futures') return 'bg-green-50 dark:bg-green-900/20'
  if (h.type === 'other')   return 'bg-gray-100 dark:bg-gray-800/50'
  return idx % 2 === 0
    ? 'bg-white dark:bg-gray-950'
    : 'bg-blue-50/40 dark:bg-gray-900/40'
}

export default function Sp500HoldingsPage() {
  const [rawInput, setRawInput] = useState('270000000')
  const [query, setQuery] = useState('')

  const totalKRW = useMemo(() => {
    const num = Number(rawInput.replace(/,/g, ''))
    return isNaN(num) ? 0 : num
  }, [rawInput])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return HOLDINGS
    return HOLDINGS.filter(
      h => h.ticker.toLowerCase().includes(q) || h.name.toLowerCase().includes(q)
    )
  }, [query])

  // 누적 비율은 전체 HOLDINGS 기준으로 계산 (필터 시에도 유지)
  const cumulativeMap = useMemo(() => {
    let cum = 0
    const map = new Map<string, number>()
    for (const h of HOLDINGS) {
      if (h.type !== 'other') cum += h.weight
      if (h.type !== 'other') map.set(h.ticker, cum)
    }
    return map
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setRawInput(raw)
  }

  const displayInput = rawInput ? Number(rawInput).toLocaleString('ko-KR') : ''

  const totalWeight = useMemo(
    () => HOLDINGS.reduce((s, h) => s + h.weight, 0),
    []
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="sp500-holdings" />

      <main className="max-w-screen-2xl mx-auto px-4 pt-10 pb-20">
        {/* 제목 + 메타 */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            S&P 500 (VOO / Vanguard S&P 500 ETF) — 보유 종목 전체 현황
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            기준일: {META.asOf}&nbsp;&nbsp;|&nbsp;&nbsp;출처: {META.source}&nbsp;&nbsp;|&nbsp;&nbsp;종목 수: {HOLDINGS.length}개
          </p>
        </div>

        {/* 컨트롤 바 */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* 투자금액 입력 */}
          <div className="inline-flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl px-5 py-3">
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200 whitespace-nowrap">
              총 투자금액 (KRW)
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={displayInput}
              onChange={handleInput}
              placeholder="270,000,000"
              className="w-44 text-right font-mono text-base font-bold bg-transparent border-b-2 border-orange-400 dark:border-orange-500 text-orange-900 dark:text-orange-100 outline-none placeholder:text-orange-300 dark:placeholder:text-orange-700 py-0.5"
            />
            <span className="text-sm text-orange-600 dark:text-orange-400">원</span>
          </div>

          {/* 검색 */}
          <div className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex-1 min-w-[180px] max-w-xs">
            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="티커 또는 종목명 검색"
              className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {query && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filtered.length}개 검색됨
            </span>
          )}
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-medium w-10">#</th>
                <th className="py-3 px-3 text-left text-gray-500 dark:text-gray-400 font-medium w-20">티커</th>
                <th className="py-3 px-3 text-left text-gray-500 dark:text-gray-400 font-medium min-w-[140px]">종목명</th>
                <th className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-medium w-24">배분 비율</th>
                <th className="py-3 px-3 text-left text-gray-500 dark:text-gray-400 font-medium min-w-[110px]">섹터</th>
                <th className="py-3 px-3 text-left text-gray-500 dark:text-gray-400 font-medium min-w-[260px]">주요 제품 / 사업</th>
                <th className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-medium min-w-[130px]">투자금액 (KRW)</th>
                <th className="py-3 px-3 text-right text-gray-500 dark:text-gray-400 font-medium w-24">누적 비율</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, idx) => {
                const amount = totalKRW > 0 ? Math.round(totalKRW * h.weight / 100) : null
                const cum = cumulativeMap.get(h.ticker) ?? null
                const url = WEBSITES[h.ticker]
                return (
                  <tr
                    key={h.ticker}
                    className={`border-b border-gray-100 dark:border-gray-800 ${rowBg(h, idx)}`}
                  >
                    <td className="py-2 px-3 text-right text-gray-400 dark:text-gray-600 font-mono text-xs">{h.rank}</td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-blue-800 dark:hover:text-blue-200"
                          title={`${h.name} 공식 사이트`}
                        >
                          {h.ticker}
                          <svg className="inline-block ml-0.5 mb-0.5 w-3 h-3 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : h.ticker}
                    </td>
                    <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium">{h.name}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      <span className={h.weight < 0 ? 'text-red-500' : ''}>{h.weight.toFixed(2)}%</span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">{h.sector}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-500 text-xs leading-relaxed">{h.products}</td>
                    <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      {amount !== null ? (
                        <span className={amount < 0 ? 'text-red-500' : ''}>{fmt(amount)}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-500 dark:text-gray-500 text-xs">
                      {cum !== null ? `${cum.toFixed(2)}%` : ''}
                    </td>
                  </tr>
                )
              })}

              {/* 합계 행 */}
              {!query && (
                <tr className="bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                  <td colSpan={3} className="py-3 px-3 text-right text-gray-700 dark:text-gray-200">합계</td>
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">{totalWeight.toFixed(2)}%</td>
                  <td colSpan={2} />
                  <td className="py-3 px-3 text-right font-mono text-gray-800 dark:text-gray-100">
                    {totalKRW > 0 ? fmt(Math.round(totalKRW * totalWeight / 100)) : '—'}
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 색상 범례 */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 inline-block" />
            <span className="text-gray-600 dark:text-gray-400">일반 주식 (홀수 행)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-blue-50 dark:bg-gray-900 border border-blue-100 dark:border-gray-700 inline-block" />
            <span className="text-gray-600 dark:text-gray-400">일반 주식 (짝수 행)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 inline-block" />
            <span className="text-gray-600 dark:text-gray-400">현금 및 현금성 자산</span>
          </div>
        </div>
      </main>
    </div>
  )
}
