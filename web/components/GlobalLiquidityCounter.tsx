'use client'

import { useState, useEffect } from 'react'

// IMF/BIS 전 세계 M2 통화량 추정치
// 2024년 기준 ~$107조(달러), 연 6% 성장
// 2026-01-01 기준: $107T × 1.06² ≈ $120.2T
// 초당 증가: $120.2T × 0.06 / 31,557,600 ≈ $228,600/초
const BASE_M2 = 120_200_000_000_000
const GROWTH_PER_SEC = 228_600
const BASE_DATE = new Date('2026-01-01T00:00:00Z').getTime()

export default function GlobalLiquidityCounter() {
  // 서버 화면과 첫 브라우저 화면이 같도록 처음엔 비워 두고, 브라우저에서 현재 시각으로 채운다
  const [m2, setM2] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setM2(Math.round(BASE_M2 + (Date.now() - BASE_DATE) / 1000 * GROWTH_PER_SEC))
    tick()
    const id = setInterval(tick, 450)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-gray-800 dark:bg-gray-900/80 rounded-xl px-4 py-3 text-white">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-yellow-200/50 whitespace-nowrap">전 세계 통화량 (M2)</span>
        <span className="font-mono text-sm font-bold text-yellow-300 tabular-nums select-none">
          {m2 === null ? '$—' : `$${m2.toLocaleString('en-US')}`}
        </span>
        <span className="text-[11px] text-yellow-200/30 whitespace-nowrap">
          연 +6% · 연 +$7.2조 · IMF 2024 추정치
        </span>
      </div>
      <div className="mt-2 text-xs text-white/40 leading-relaxed">
        중앙은행 통화 공급 + 신용 창출 — 돈이 더 풀릴수록 현금 가치는 희석되고, 자산 가격은 오른다
      </div>
    </div>
  )
}
