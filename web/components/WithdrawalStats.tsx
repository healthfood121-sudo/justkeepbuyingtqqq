'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Meta {
  median_final: number
  n_cohorts:    number
  n_complete:   number
  avg_trades:   number
}

function fmt억(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(0)}조`
  return `${v.toFixed(0)}억`
}

export default function WithdrawalStats() {
  const [withCosts, setWithCosts] = useState(false)
  const [meta,      setMeta]      = useState<Meta | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(withCosts ? '/data/s0_tradelog_v2.json' : '/data/s0_tradelog.json')
      .then(r => r.json())
      .then(d => { setMeta(d.meta); setLoading(false) })
  }, [withCosts])

  const survivalPct = meta
    ? `${(meta.n_complete / meta.n_cohorts * 100).toFixed(1)}%`
    : '—'

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6">
      {/* 헤더 + 토글 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          S0 백테스트 결과{meta ? ` (${meta.n_cohorts}가지 시작 시점 · 20년)` : ''}
        </span>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
          <button
            onClick={() => setWithCosts(false)}
            className={`px-3 py-1.5 transition-colors ${!withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            운용보수만
          </button>
          <button
            onClick={() => setWithCosts(true)}
            className={`px-3 py-1.5 transition-colors ${withCosts ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            + 스왑금리
          </button>
        </div>
      </div>

      {/* 통계 */}
      {loading && <div className="text-xs text-gray-400 py-4 text-center">로딩 중…</div>}
      {!loading && meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: '생존율',        value: survivalPct },
            { label: '중간값 (20년)', value: fmt억(meta.median_final) },
            { label: '평균 거래',     value: `${Math.round(meta.avg_trades)}회/20년` },
            { label: 'TQQQ 스왑금리', value: withCosts ? '반영' : '미반영 (이론치)' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-900 rounded-xl px-3 py-2.5 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/posts/withdrawal-guide/tradelog"
        className="text-xs text-blue-500 hover:underline"
      >
        전체 거래 로그 — 시작 시점별 날짜별 매수/매도 기록 →
      </Link>
    </div>
  )
}
