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
  above_days?: number   // 현금일 때 200일선 위 연속일 (15일이면 매수)
  sell_line?:  number   // RULE25 보유 중 매도선 (1년 최고 종가 × 0.75)
  last_events: { date: string; action: string; how: string }[]
}

interface Signal {
  asof:        string
  ndx_close:   number
  ema200:      number
  vs_ema_pct:  number
  vs_peak_pct: number
  peak_1y:     number
  rsi14:       number
  strategies:  Record<'S0' | 'RULE25' | 'D10GK', StrategySignal>
}

const ROWS: { key: 'RULE25' | 'S0' | 'D10GK'; name: string; rule: string }[] = [
  { key: 'RULE25',   name: '25% 룰',   rule: '1년 최고 종가보다 25% 떨어지면 매도' },
  { key: 'S0',    name: 'S0',    rule: '200일 평균선 아래 15일 연속이면 매도' },
  { key: 'D10GK', name: 'D10GK', rule: 'S0 + 급락 때 LOC 주문으로 조기 재매수' },
]

const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
const num = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })

// 매도선(−25%)까지 얼마나 내려왔는지 / 재매수(15일)까지 며칠 남았는지 막대로 표시
function Gauge({ sig, t }: { sig: Signal; t: StrategySignal }) {
  if (t.state === '보유') {
    const drop = Math.max(0, -sig.vs_peak_pct)            // 최고가 대비 하락폭 (%)
    const ratio = Math.min(1, drop / 25)
    const line = t.sell_line ?? sig.peak_1y * 0.75
    const bar = ratio < 0.5 ? 'bg-green-500' : ratio < 0.8 ? 'bg-amber-500' : 'bg-red-500'
    return (
      <div className="mt-1.5">
        <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className={`absolute inset-y-0 left-0 rounded-full ${bar}`} style={{ width: `${Math.max(ratio * 100, 2)}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
          <span>지금 최고가 대비 {pct(sig.vs_peak_pct)}</span>
          <span>매도선 −25%</span>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
          매도까지 <strong>{(25 - drop).toFixed(1)}%</strong> 남음
          <span className="text-gray-400 dark:text-gray-500"> · 나스닥100 {num(line)} 아래 마감 시</span>
        </p>
      </div>
    )
  }
  if (t.above_days === undefined) return <p className="text-[11px] mt-0.5 text-gray-500 dark:text-gray-400">{t.detail}</p>
  const d = Math.min(15, t.above_days)
  return (
    <div className="mt-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-sm ${i < d ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
        재매수까지 <strong>15일 중 {d}일째</strong>
        <span className="text-gray-400 dark:text-gray-500"> · 200일 평균선 {num(sig.ema200)} 위 마감 기준</span>
      </p>
    </div>
  )
}

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
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">오늘의 신호</span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">{sig.asof} 미국 종가 기준</span>
      </div>

      {(() => {
        const t = sig.strategies.RULE25
        const urgent = t.action === '매도' || t.action === '매수'
        return (
          <div className={`rounded-lg px-3 py-2 mb-2 ${urgent ? 'bg-red-50 dark:bg-red-500/10' : 'bg-purple-50/60 dark:bg-purple-500/10'}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-gray-900 dark:text-white">25% 룰</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                t.state === '보유'
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                {t.state === '보유' ? 'TQQQ 보유' : '현금'}
              </span>
              <span className={`text-xs font-bold ${urgent ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {urgent ? `다음 거래일 전량 ${t.action}` : '할 일 없음'}
              </span>
            </div>
            {urgent
              ? <p className="text-[11px] mt-0.5 text-red-600 dark:text-red-400">{t.detail}</p>
              : <Gauge sig={sig} t={t} />}
          </div>
        )
      })()}

      <details className="text-[11px]">
        <summary className="cursor-pointer text-gray-400 dark:text-gray-500 select-none">다른 전략 신호 (비교용)</summary>
        <div className="space-y-2 mt-2">
          {ROWS.filter(r => r.key !== 'RULE25').map(({ key, name, rule }) => {
            const s = sig.strategies[key]
            const urgent = s.action === '매도' || s.action === '매수'
            return (
              <div key={key} className="border-t border-gray-100 dark:border-gray-800 pt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{s.state === '보유' ? 'TQQQ 보유' : '현금'}</span>
                  <span className={urgent ? 'text-red-600 dark:text-red-400 font-semibold' : s.loc ? 'text-purple-600 dark:text-purple-300' : 'text-gray-400 dark:text-gray-500'}>
                    {urgent ? `다음 거래일 ${s.action}` : s.loc ? 'LOC 매수 주문' : '할 일 없음'}
                  </span>
                </div>
                <p className="text-gray-400 dark:text-gray-500">{rule}</p>
                {s.loc && (
                  <p className="text-purple-700 dark:text-purple-300 mt-0.5">
                    {s.loc.tqqq_price
                      ? <>TQQQ <strong>${s.loc.tqqq_price.toFixed(2)}</strong> 이하 LOC 매수</>
                      : <>TQQQ 전일 종가 대비 <strong>{pct(s.loc.tqqq_pct)}</strong> 이하 가격으로 LOC 매수</>}
                    {' '}(나스닥100이 {pct(s.loc.ndx_pct)} 이하로 끝나야 체결)
                  </p>
                )}
                {urgent && <p className="text-red-600 dark:text-red-400 mt-0.5">{s.detail}</p>}
              </div>
            )
          })}
        </div>
      </details>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
        매일 아침 7시 30분 자동 갱신 · 투자 권유 아님
      </p>
    </div>
  )
}
