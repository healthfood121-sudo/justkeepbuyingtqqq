'use client'

import { useState } from 'react'

// 동적 인출률: 총자산 10억 미만 0.3% · 10~20억 0.5% · 20억 이상 0.7% (매달 그 달 자산으로 다시 계산)
const rateOf = (eok: number) => (eok < 10 ? 0.003 : eok < 20 ? 0.005 : 0.007)

export default function LivingCalc() {
  const [input, setInput] = useState('10')
  const eok = Math.max(0, parseFloat(input) || 0)
  const rate = rateOf(eok)
  const man = Math.round(eok * 10000 * rate)   // 만원

  return (
    <div className="bg-white/70 dark:bg-gray-900/60 border border-purple-200 dark:border-purple-700/30 rounded-xl p-3 mb-3">
      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">이번 달 생활비 계산</p>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <label htmlFor="living-eok" className="text-gray-500 dark:text-gray-400">내 총자산</label>
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <input id="living-eok" type="number" inputMode="decimal" min={0} step={0.5} value={input}
            onChange={e => setInput(e.target.value)}
            className="w-20 px-2 py-1 text-right bg-transparent text-gray-900 dark:text-white focus:outline-none" />
          <span className="pr-2 text-gray-400">억</span>
        </div>
        <span className="text-gray-900 dark:text-white">이번 달 
          <strong className="text-base text-purple-700 dark:text-purple-300">{man.toLocaleString('ko-KR')}만원</strong>
          <span className="text-gray-400 dark:text-gray-500"> (자산의 {(rate * 100).toFixed(1)}%)</span>
        </span>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
        총자산(TQQQ + 현금) 10억 미만이면 0.3%, 10~20억 0.5%, 20억 이상 0.7%. 매달 초 그 달 자산으로 다시 계산한다.
        자산이 늘면 생활비도 늘고, 줄면 같이 줄어든다.
      </p>
    </div>
  )
}
