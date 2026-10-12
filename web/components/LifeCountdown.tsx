'use client'

import { useState, useEffect, useRef } from 'react'

// 2024년 통계청 생명표 기준 나이별 기대여명 (잔여 기대수명, 단위: 년)
// [나이, 남자_기대여명, 여자_기대여명]
const LIFE_TABLE: [number, number, number][] = [
  [0,  80.8, 86.6],
  [20, 61.2, 66.9],
  [30, 51.5, 57.1],
  [35, 46.7, 52.3],
  [40, 41.9, 47.4],
  [50, 32.5, 37.8],
  [60, 23.7, 28.4],
  [70, 15.5, 19.2],
  [80,  7.5, 10.8],
  [90,  3.2,  5.0],
]

function getRemainingYears(age: number, gender: 'M' | 'F'): number {
  const col = gender === 'M' ? 1 : 2

  // 범위 밖: 0세 미만 or 테이블 마지막보다 큰 나이
  if (age <= LIFE_TABLE[0][0]) return LIFE_TABLE[0][col]
  if (age >= LIFE_TABLE[LIFE_TABLE.length - 1][0]) {
    // 100세 이상이면 1년 미만으로 빠르게 감소
    const last = LIFE_TABLE[LIFE_TABLE.length - 1]
    const extra = age - last[0]
    return Math.max(0.1, last[col] - extra * 0.5)
  }

  // 선형 보간
  for (let i = 0; i < LIFE_TABLE.length - 1; i++) {
    const [a0, m0, f0] = LIFE_TABLE[i]
    const [a1, m1, f1] = LIFE_TABLE[i + 1]
    if (age >= a0 && age <= a1) {
      const t = (age - a0) / (a1 - a0)
      return (gender === 'M' ? m0 : f0) + t * ((gender === 'M' ? m1 : f1) - (gender === 'M' ? m0 : f0))
    }
  }
  return 0
}

function pad(n: number, digits = 2) {
  return String(Math.abs(n)).padStart(digits, '0')
}

export default function LifeCountdown() {
  const [age, setAge] = useState(() => {
    try { const v = localStorage.getItem('lcd_age'); return v ? Math.max(1, Math.min(110, Number(v))) : 35 } catch { return 35 }
  })
  const [gender, setGender] = useState<'M' | 'F'>(() => {
    try { const v = localStorage.getItem('lcd_gender'); return v === 'F' ? 'F' : 'M' } catch { return 'M' }
  })
  const [ms, setMs] = useState(() => getRemainingYears(age, gender) * 365.25 * 24 * 3600 * 1000)

  const startRef = useRef<number>(Date.now())
  const initialMsRef = useRef<number>(ms)

  // 나이/성별 바뀌면 리셋 + localStorage 저장
  useEffect(() => {
    try { localStorage.setItem('lcd_age', String(age)); localStorage.setItem('lcd_gender', gender) } catch {}
    const init = getRemainingYears(age, gender) * 365.25 * 24 * 3600 * 1000
    initialMsRef.current = init
    startRef.current = Date.now()
    setMs(init)
  }, [age, gender])

  // 실시간 카운트다운 (100ms 간격)
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      setMs(Math.max(0, initialMsRef.current - elapsed))
    }, 100)
    return () => clearInterval(id)
  }, [])

  const totalSec = Math.floor(ms / 1000)
  const years   = Math.floor(totalSec / (365.25 * 24 * 3600))
  const days    = Math.floor((totalSec % (365.25 * 24 * 3600)) / (24 * 3600))
  const hours   = Math.floor((totalSec % (24 * 3600)) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const secs    = totalSec % 60
  const tenths  = Math.floor((ms % 1000) / 100)

  const remainingYears = getRemainingYears(age, gender)
  const expectedDeathAge = (age + remainingYears).toFixed(1)
  const usedPct = (age / (age + remainingYears)) * 100

  return (
    <div className="text-white">
      {/* 한 줄: 제목 + 입력 + 카운트다운 */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="text-xs text-blue-200/50 whitespace-nowrap">남은 시간</span>

        {/* 나이 입력 */}
        <input
          type="number"
          min={1}
          max={110}
          value={age}
          onChange={e => setAge(Math.max(1, Math.min(110, Number(e.target.value))))}
          className="w-14 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-400 placeholder-white/30"
        />
        <span className="text-xs text-blue-200/50 -ml-2">세</span>

        {/* 성별 */}
        <div className="flex rounded overflow-hidden border border-white/20 text-xs">
          <button
            onClick={() => setGender('M')}
            className={`px-2 py-1 transition-colors ${gender === 'M' ? 'bg-blue-500/60 text-white' : 'bg-transparent text-white/40 hover:text-white/70'}`}
          >남</button>
          <button
            onClick={() => setGender('F')}
            className={`px-2 py-1 transition-colors ${gender === 'F' ? 'bg-pink-500/60 text-white' : 'bg-transparent text-white/40 hover:text-white/70'}`}
          >여</button>
        </div>

        {/* 카운트다운 */}
        <span className="font-mono text-sm font-bold text-red-300 tabular-nums select-none">
          {pad(years, 3)}년 {pad(days, 3)}일 {pad(hours)}:{pad(minutes)}:{pad(secs)}<span className="text-white/25">.{tenths}</span>
        </span>

        {/* 기대 사망 나이 */}
        <span className="text-[11px] text-blue-200/40 whitespace-nowrap">
          기대 사망 {expectedDeathAge}세 · 통계청 2024
        </span>
      </div>

      {/* 진행 바 */}
      <div className="mt-3 w-full h-px bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/25 rounded-full"
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  )
}
