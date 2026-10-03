'use client'

import { useEffect, useState } from 'react'

interface Loc {
  ndx_price:  number
  ndx_pct:    number
  tqqq_pct:   number
  tqqq_price: number | null
}

interface StrategySignal {
  state:  '보유' | '현금'
  action: string
  detail: string
  loc?:   Loc
  last_events: { date: string; action: string; how: string }[]
}

interface Signal {
  asof:        string
  ndx_close:   number
  ema200:      number
  vs_ema_pct:  number
  vs_peak_pct: number
  rsi14:       number
  strategies:  Record<'S0' | 'T25' | 'D10GK', StrategySignal>
}

const ROWS: { key: 'T25' | 'S0' | 'D10GK'; name: string; rule: string }[] = [
  { key: 'T25',   name: 'T25',   rule: '1년 최고 종가보다 25% 떨어지면 매도' },
  { key: 'S0',    name: 'S0',    rule: '200일 평균선 아래 15일 연속이면 매도' },
  { key: 'D10GK', name: 'D10GK', rule: 'S0 + 급락 때 LOC 주문으로 조기 재매수' },
]

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`

export default function WithdrawalSignal() {
  const [sig, setSig] = useState<Signal | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    fetch('/data/withdrawal_signal.json')
      .then(r => r.json())
      .then(setSig)
      .catch(() => setErr(true))
  }, [])

  if (err) return null
  if (!sig) return <div className="text-xs text-gray-400 py-3">신호 불러오는 중…</div>

  return (
    <div className="bg-white/70 dark:bg-gray-900/60 border border-purple-200 dark:border-purple-700/30 rounded-xl p-3 mb-3">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">오늘의 신호</span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{sig.asof} 미국 종가 기준</span>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
        나스닥100 {sig.ndx_close.toLocaleString('en-US', { maximumFractionDigits: 0 })} ·
        200일 평균선 대비 {pct(sig.vs_ema_pct)} · 1년 최고 종가 대비 {pct(sig.vs_peak_pct)}
      </p>

      <div className="space-y-2">
        {ROWS.map(({ key, name, rule }) => {
          const s = sig.strategies[key]
          const urgent = s.action === '매도' || s.action === '매수'
          return (
            <div key={key} className="border-t border-gray-100 dark:border-gray-800 pt-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  s.state === '보유'
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {s.state === '보유' ? 'TQQQ 보유' : '현금'}
                </span>
                <span className={`text-[10px] font-semibold ${
                  urgent ? 'text-red-600 dark:text-red-400'
                  : s.loc ? 'text-purple-600 dark:text-purple-300'
                  : 'text-gray-400 dark:text-gray-500'}`}>
                  {urgent ? `다음 거래일 ${s.action}` : s.loc ? 'LOC 매수 주문' : '할 일 없음'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{rule}</p>
              {s.loc && (
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                  {s.loc.tqqq_price
                    ? <>TQQQ <strong>${s.loc.tqqq_price.toFixed(2)}</strong> 이하 LOC 매수</>
                    : <>TQQQ 전일 종가 대비 <strong>{pct(s.loc.tqqq_pct)}</strong> 이하 가격으로 LOC 매수</>}
                  {' '}(나스닥100이 {pct(s.loc.ndx_pct)} 이하로 끝나야 체결)
                </p>
              )}
              {urgent && <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">{s.detail}</p>}
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
        매일 한국 시간 아침 7시 30분 자동 갱신. 투자 권유가 아닌 백테스트 규칙의 계산 결과입니다.
      </p>
    </div>
  )
}
