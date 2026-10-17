'use client'

import { useState, useEffect, useRef } from 'react'

// IMF/BIS 전 세계 M2 통화량 추정치
// 2024년 기준 ~$107조(달러), 연 6% 성장
// 2026-01-01 기준: $107T × 1.06² ≈ $120.2T
// 초당 증가: $120.2T × 0.06 / 31,557,600 ≈ $228,600/초
const GROWTH_PER_SEC = 228_600

export default function GlobalLiquidityCounter() {
  const startTime = useRef(Date.now())
  const [increase, setIncrease] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000
      setIncrease(Math.round(elapsed * GROWTH_PER_SEC))
    }, 450)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-gray-800 dark:bg-gray-900/80 rounded-xl px-4 py-3 text-white">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-yellow-200/50 whitespace-nowrap">이 페이지 연 이후 새로 풀린 돈</span>
        <span className="font-mono text-sm font-bold text-yellow-300 tabular-nums select-none">
          +${increase.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 text-xs text-white/40 leading-relaxed">
        +$228,600/초 · 전 세계 M2 기준 · IMF 2024 — 돈이 더 풀릴수록 현금 가치는 희석되고, 자산 가격은 오른다
      </div>
    </div>
  )
}
