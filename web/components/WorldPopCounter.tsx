'use client'

import { useState, useEffect, useRef } from 'react'

// UN DESA World Population Prospects 2024 기준
// 2026-01-01 00:00:00 UTC 기준 약 81.92억 명
// 출생: 연 ~1억3800만 → 4.37명/초
// 사망: 연 ~6700만 → 2.12명/초
// 순증가: 2.25명/초 (연 ~7100만)
const BASE_POPULATION = 8_192_000_000
const NET_RATE = 2.25
// birth 페이즈: 실제값 +100 표시 (출생 순간 표현)
// death 페이즈: 실제값 -40 표시 (사망 순간 표현)
// → 0.5초마다 약 140 진폭으로 오르락내리락하며 전체는 우상향
const BIRTH_OFFSET = 100
const DEATH_OFFSET = 40
const BASE_DATE = new Date('2026-01-01T00:00:00Z').getTime()

export default function WorldPopCounter() {
  const phaseRef = useRef<'birth' | 'death'>('birth')
  const [pop, setPop] = useState(() => {
    const elapsed = (Date.now() - BASE_DATE) / 1000
    return Math.round(BASE_POPULATION + elapsed * NET_RATE)
  })
  const [isUp, setIsUp] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - BASE_DATE) / 1000
      const truePop = BASE_POPULATION + elapsed * NET_RATE

      if (phaseRef.current === 'birth') {
        setPop(Math.round(truePop + BIRTH_OFFSET))
        setIsUp(true)
        phaseRef.current = 'death'
      } else {
        setPop(Math.round(truePop - DEATH_OFFSET))
        setIsUp(false)
        phaseRef.current = 'birth'
      }
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-gray-800 dark:bg-gray-900/80 rounded-xl px-4 py-3 text-white">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-blue-200/50 whitespace-nowrap">지금 이 순간 세계 인구</span>
        <span className={`font-mono text-sm font-bold tabular-nums select-none transition-colors duration-150 ${isUp ? 'text-green-300' : 'text-red-400'}`}>
          {pop.toLocaleString()}명
        </span>
        <span className="text-[11px] text-blue-200/30 whitespace-nowrap">
          출생 4.37/초 · 사망 2.12/초 · UN 2024 추정치
        </span>
      </div>
      <div className="mt-2 text-xs text-white/40 leading-relaxed">
        새로운 소비자가 지금 이 순간에도 태어나고 있다
      </div>
    </div>
  )
}
