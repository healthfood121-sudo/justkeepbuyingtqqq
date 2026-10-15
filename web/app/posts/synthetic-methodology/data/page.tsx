'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

interface DailyData {
  note: string
  meta: {
    from: string
    to: string
    rows: number
    tqqq_exp: number
    qld_exp: number
    qqq_exp: number
    swap_spread: number
  }
  d:    string[]
  ndx:  number[]
  tqqq: number[]
  qld:  number[]
  qqq:  number[]
  fed:  number[]
}

const PAGE_SIZE = 100

export default function SyntheticDataPage() {
  const [data,        setData]        = useState<DailyData | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [startYear,   setStartYear]   = useState(1971)
  const [endYear,     setEndYear]     = useState(2026)
  const [page,        setPage]        = useState(0)

  useEffect(() => {
    fetch('/data/synthetic_daily.json')
      .then(r => r.json())
      .then((d: DailyData) => {
        setData(d)
        // 기본값: 데이터 끝 연도
        const lastYear = parseInt(d.meta.to.slice(0, 4))
        setEndYear(lastYear)
        setLoading(false)
      })
  }, [])

  // 연도 범위
  const { minYear, maxYear } = useMemo(() => {
    if (!data) return { minYear: 1971, maxYear: 2026 }
    return {
      minYear: parseInt(data.meta.from.slice(0, 4)),
      maxYear: parseInt(data.meta.to.slice(0, 4)),
    }
  }, [data])

  // 필터된 인덱스 목록
  const filteredIdx = useMemo(() => {
    if (!data) return []
    return data.d.reduce<number[]>((acc, date, i) => {
      const y = parseInt(date.slice(0, 4))
      if (y >= startYear && y <= endYear) acc.push(i)
      return acc
    }, [])
  }, [data, startYear, endYear])

  // 페이지네이션
  const totalPages = Math.ceil(filteredIdx.length / PAGE_SIZE)
  const pageIdx    = filteredIdx.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // 연도 바뀔 때 페이지 초기화
  useEffect(() => { setPage(0) }, [startYear, endYear])

  // CSV 전체 다운로드 (필터 무관 전체 데이터)
  const handleDownloadAll = useCallback(() => {
    if (!data) return
    const header = 'date,ndx_adj,tqqq,qld,qqq_1x,fed_rate_pct'
    const rows = data.d.map((date, i) =>
      `${date},${data.ndx[i]},${data.tqqq[i]},${data.qld[i]},${data.qqq[i]},${data.fed[i]}`
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'synthetic_ndx_daily.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  // CSV 필터 범위만 다운로드
  const handleDownloadFiltered = useCallback(() => {
    if (!data || filteredIdx.length === 0) return
    const header = 'date,ndx_adj,tqqq,qld,qqq_1x,fed_rate_pct'
    const rows = filteredIdx.map(i =>
      `${data.d[i]},${data.ndx[i]},${data.tqqq[i]},${data.qld[i]},${data.qqq[i]},${data.fed[i]}`
    )
    const csv  = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `synthetic_ndx_${startYear}_${endYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [data, filteredIdx, startYear, endYear])

  const years = useMemo(() => {
    const arr: number[] = []
    for (let y = minYear; y <= maxYear; y++) arr.push(y)
    return arr
  }, [minYear, maxYear])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" />

      <main className="max-w-6xl mx-auto px-6 py-16">

        <Link href="/posts/synthetic-methodology"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-8 inline-block">
          ← 합성 가격 방법론으로
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">합성 가격 일별 원본 데이터</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            NDX 보정 지수 · TQQQ / QLD / 나스닥100 합성가격(초기 100 기준) · 연방기금금리
          </p>
        </div>

        {loading ? (
          <div className="text-center py-24 text-gray-400">데이터 로딩 중…</div>
        ) : data && (
          <>
            {/* 상단: 메타 + 다운로드 */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
                <p>기간: {data.meta.from} ~ {data.meta.to} · 총 {data.meta.rows.toLocaleString()}행</p>
                <p>
                  운용보수: TQQQ {(data.meta.tqqq_exp * 100).toFixed(2)}% ·
                  QLD {(data.meta.qld_exp * 100).toFixed(2)}% ·
                  나스닥100 {(data.meta.qqq_exp * 100).toFixed(2)}% ·
                  스왑 스프레드 {(data.meta.swap_spread * 100).toFixed(2)}%
                </p>
                <p>합성가격 기준: 1971-02-05 = 100</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleDownloadFiltered}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  CSV 다운로드 (현재 범위)
                </button>
                <button
                  onClick={handleDownloadAll}
                  className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  CSV 전체 ({data.meta.rows.toLocaleString()}행)
                </button>
              </div>
            </div>

            {/* 계산 공식 요약 */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 mb-6 text-xs text-gray-500 dark:text-gray-400 font-mono leading-relaxed">
              <span className="font-semibold text-gray-700 dark:text-gray-300">TQQQ:</span>{' '}
              (1 + 3r − 2×(FFR+0.5%)/252) × (1 − 0.88%/252) · 누적곱 × 100<br />
              <span className="font-semibold text-gray-700 dark:text-gray-300">QLD:</span>{' '}
              (1 + 2r − 1×(FFR+0.5%)/252) × (1 − 0.95%/252) · 누적곱 × 100<br />
              <span className="font-semibold text-gray-700 dark:text-gray-300">나스닥100:</span>{' '}
              (1 + r) × (1 − 0.20%/252) · 누적곱 × 100 &nbsp;
              <span className="text-gray-400">(차입 이자 없음)</span>
            </div>

            {/* 연도 필터 */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">기간</span>
              <select
                value={startYear}
                onChange={e => setStartYear(parseInt(e.target.value))}
                className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300"
              >
                {years.filter(y => y <= endYear).map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <span className="text-gray-400">~</span>
              <select
                value={endYear}
                onChange={e => setEndYear(parseInt(e.target.value))}
                className="text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300"
              >
                {years.filter(y => y >= startYear).map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {filteredIdx.length.toLocaleString()}행
              </span>
              {/* 빠른 선택 */}
              {[
                { label: '전체',   s: minYear, e: maxYear },
                { label: '최근 5년', s: maxYear - 4, e: maxYear },
                { label: '닷컴버블', s: 1999, e: 2003 },
                { label: '금융위기', s: 2007, e: 2010 },
              ].map(({ label, s, e }) => (
                <button
                  key={label}
                  onClick={() => { setStartYear(Math.max(s, minYear)); setEndYear(Math.min(e, maxYear)) }}
                  className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2.5 px-4 text-left text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">날짜</th>
                    <th className="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                      NDX 지수
                      <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500">합성가격 계산에 쓰인 원지수</span>
                    </th>
                    <th className="py-2.5 px-4 text-right text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                      TQQQ 합성
                      <span className="block text-[10px] font-normal text-blue-400/70 dark:text-blue-500/70">3배 · 운용보수+스왑금리 반영</span>
                    </th>
                    <th className="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                      QLD 합성
                      <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500">2배 · 운용보수+스왑금리 반영</span>
                    </th>
                    <th className="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                      나스닥100 합성
                      <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500">1배 · 운용보수만 반영 (QQQ 근사)</span>
                    </th>
                    <th className="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                      기준금리
                      <span className="block text-[10px] font-normal text-gray-400 dark:text-gray-500">FFR 연율 %</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pageIdx.map(i => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-2 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs whitespace-nowrap">{data.d[i]}</td>
                      <td className="py-2 px-4 text-right text-gray-700 dark:text-gray-300 font-mono text-xs tabular-nums">
                        {data.ndx[i].toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-4 text-right text-blue-700 dark:text-blue-300 font-mono text-xs tabular-nums font-medium">
                        {data.tqqq[i].toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-700 dark:text-gray-300 font-mono text-xs tabular-nums">
                        {data.qld[i].toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-700 dark:text-gray-300 font-mono text-xs tabular-nums">
                        {data.qqq[i].toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-4 text-right text-gray-500 dark:text-gray-400 font-mono text-xs tabular-nums">
                        {data.fed[i].toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {pageIdx.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        해당 기간에 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ← 이전
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {page + 1} / {totalPages} 페이지
                  <span className="ml-2 text-xs text-gray-400">
                    ({(page * PAGE_SIZE + 1).toLocaleString()}~{Math.min((page + 1) * PAGE_SIZE, filteredIdx.length).toLocaleString()}행)
                  </span>
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  다음 →
                </button>
              </div>
            )}

            {/* 컬럼 설명 */}
            <div className="mt-10 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">컬럼 설명</p>
              <p><span className="font-mono text-gray-600 dark:text-gray-300">NDX 지수</span> — 나스닥100 원지수 (스플라이스 보정 후 연속값, 1985-10-01 이전은 나스닥 종합지수 비율보정)</p>
              <p><span className="font-mono text-blue-600 dark:text-blue-400">TQQQ 합성</span> — 운용보수 0.88% + 스왑 차입 이자(기준금리+0.50%) × 2 반영. 1971-02-05 = 100</p>
              <p><span className="font-mono text-gray-600 dark:text-gray-300">QLD 합성</span> — 운용보수 0.95% + 스왑 차입 이자(기준금리+0.50%) × 1 반영. 1971-02-05 = 100</p>
              <p><span className="font-mono text-gray-600 dark:text-gray-300">나스닥100 합성</span> — 운용보수 0.20% 반영. 차입 이자 없음. 1971-02-05 = 100</p>
              <p><span className="font-mono text-gray-600 dark:text-gray-300">기준금리</span> — 미국 연방기금금리 연율(%). 데이터 없는 구간은 3.0% 대입</p>
            </div>

            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              CSV 컬럼: date, ndx_adj, tqqq, qld, qqq_1x, fed_rate_pct ·{' '}
              <Link href="/posts/synthetic-methodology" className="underline hover:text-gray-600">계산 방법론 상세</Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
