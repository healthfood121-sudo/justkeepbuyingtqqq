'use client'

import { useState, useEffect } from 'react'

// IIF(국제금융협회) 전 세계 부채 추정치
// 2024년 기준 ~$315조(달러), 연 5% 성장
// 2026-01-01 기준: $315T × 1.05² ≈ $347.3T
// 초당 증가: $347.3T × 0.05 / 31,557,600 ≈ $550,000/초
const BASE_DEBT = 347_300_000_000_000
const GROWTH_PER_SEC = 550_000
const BASE_DATE = new Date('2026-01-01T00:00:00Z').getTime()

export default function GlobalDebtCounter() {
  const [debt, setDebt] = useState(() => {
    const elapsed = (Date.now() - BASE_DATE) / 1000
    return Math.round(BASE_DEBT + elapsed * GROWTH_PER_SEC)
  })

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - BASE_DATE) / 1000
      setDebt(Math.round(BASE_DEBT + elapsed * GROWTH_PER_SEC))
    }, 450)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-gray-800 dark:bg-gray-900/80 rounded-xl px-4 py-3 text-white">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-orange-200/50 whitespace-nowrap">전 세계 부채</span>
        <span className="font-mono text-sm font-bold text-orange-300 tabular-nums select-none">
          ${debt.toLocaleString()}
        </span>
        <span className="text-[11px] text-orange-200/30 whitespace-nowrap">
          연 +5% · 연 +$17.4조 · IIF 2024 추정치
        </span>
      </div>
      <div className="mt-2 text-xs text-white/40 leading-relaxed">
        부채가 늘면 더 많은 돈이 경제에 풀리고, 그 돈이 자산 시장으로 흘러든다
      </div>
    </div>
  )
}
