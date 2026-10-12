'use client'

import { useState, useEffect, useRef } from 'react'

// 2026년 세계 인구 추정치 및 증가율
// UN DESA World Population Prospects 2024 기준
// 2026년 약 81.9억 명, 연간 약 7,000만 명 증가 (~2.22명/초)
const BASE_POPULATION = 8_190_000_000
const GROWTH_PER_SEC = 2.22
// 이 페이지가 처음 로드된 2026-01-01 00:00:00 UTC 기준으로 계산
const BASE_DATE = new Date('2026-01-01T00:00:00Z').getTime()

export default function WorldPopCounter() {
  const [pop, setPop] = useState(() => {
    const elapsed = (Date.now() - BASE_DATE) / 1000
    return Math.round(BASE_POPULATION + elapsed * GROWTH_PER_SEC)
  })

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - BASE_DATE) / 1000
      setPop(Math.round(BASE_POPULATION + elapsed * GROWTH_PER_SEC))
    }, 450)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-gray-800 dark:bg-gray-900/80 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-blue-200/50 whitespace-nowrap">지금 이 순간 세계 인구</span>
        <span className="font-mono text-sm font-bold text-green-300 tabular-nums select-none">
          {pop.toLocaleString()}명
        </span>
        <span className="text-[11px] text-blue-200/40 whitespace-nowrap">
          +{GROWTH_PER_SEC.toFixed(2)}명/초 · UN 2024
        </span>
      </div>
      <div className="mt-2 text-xs text-white/40 leading-relaxed">
        이 글을 읽는 동안에도 새로운 소비자가 태어나고 있다
      </div>
    </div>
  )
}
