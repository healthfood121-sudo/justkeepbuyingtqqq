'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { loadNdx } from '@/lib/dataLoader'
import { computeEmaSignal, SIGNAL_DAYS, type EmaSignal } from '@/lib/emaSignal'

function fmtNum(v: number) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function EmaSignalCard({ compact = false, showGuideLink = false }: {
  compact?: boolean
  showGuideLink?: boolean
}) {
  const [signal, setSignal] = useState<EmaSignal | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadNdx()
      .then(d => setSignal(computeEmaSignal(d)))
      .catch(() => setError(true))
  }, [])

  const box = 'border rounded-xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'

  if (error) {
    return (
      <div className={`${box} px-4 py-3 text-xs text-gray-400`}>
        신호 데이터를 불러오지 못했습니다.
      </div>
    )
  }

  if (!signal) {
    return (
      <div className={`${box} px-4 py-3 text-xs text-gray-400 animate-pulse`}>
        오늘의 신호 계산 중…
      </div>
    )
  }

  const s = signal
  const above = s.side === 'above'
  const sideLabel = s.side === 'above' ? '위' : s.side === 'below' ? '아래' : '같은 값'

  // 다음 신호까지 진행 상황
  const nextAction = s.holding ? '매도' : '매수'
  const progressing = s.counter > 0
  const remaining = SIGNAL_DAYS - s.counter
  const barColor = s.holding ? 'bg-red-500' : 'bg-green-500'

  return (
    <div className={`${box} ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${compact ? '' : 'md:text-base'} text-gray-900 dark:text-white`}>
            오늘의 인출식 신호
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              s.holding
                ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
            }`}
          >
            {s.holding ? '● 보유 중' : '● 현금 대기'}
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{s.date} 종가 기준</span>
      </div>

      {/* 오늘 신호 발생 */}
      {s.signalToday && s.lastSignal && (
        <div
          className={`rounded-lg px-3 py-2 mb-3 text-sm font-bold ${
            s.lastSignal.action === 'SELL'
              ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300'
          }`}
        >
          {s.lastSignal.action === 'SELL'
            ? `매도 신호 발생 — 이동평균 아래 ${SIGNAL_DAYS}거래일 연속. 전량 현금 전환.`
            : `매수 신호 발생 — 이동평균 위 ${SIGNAL_DAYS}거래일 연속. 전액 재매수.`}
        </div>
      )}

      {/* 수치 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">나스닥100 종가</div>
          <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">{fmtNum(s.close)}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">200일 지수이동평균</div>
          <div className="text-sm font-mono font-bold text-gray-900 dark:text-white">{fmtNum(s.ema)}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500">이동평균 대비</div>
          <div className={`text-sm font-mono font-bold ${above ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {fmtPct(s.divPct)}
          </div>
        </div>
      </div>

      {/* 연속일 */}
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
        현재 가격이 200일 지수이동평균 <strong className={above ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{sideLabel}</strong>에서{' '}
        <strong className="text-gray-900 dark:text-white">{s.streak}거래일째</strong>
        {s.crossDate && <span className="text-gray-400 dark:text-gray-500"> ({s.crossDate}부터)</span>}
      </p>

      {/* 다음 신호까지 */}
      {!s.signalToday && (
        progressing ? (
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {nextAction} 신호까지 {SIGNAL_DAYS}거래일 중 {s.counter}일째
              </span>
              <span className="font-mono text-gray-500 dark:text-gray-400">{remaining}일 남음</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full ${barColor}`} style={{ width: `${(s.counter / SIGNAL_DAYS) * 100}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {s.holding
              ? `매도 조건 아님 — 이동평균 아래에서 ${SIGNAL_DAYS}거래일 연속 머물면 전량 매도`
              : `매수 조건 아님 — 이동평균 위에서 ${SIGNAL_DAYS}거래일 연속 머물면 전액 재매수`}
          </p>
        )
      )}

      {/* 마지막 신호 */}
      {s.lastSignal && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          마지막 신호: <span className="font-mono">{s.lastSignal.date}</span>{' '}
          {s.lastSignal.action === 'BUY' ? '매수' : '매도'}
        </p>
      )}

      {!compact && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
          나스닥100 원지수 일별 종가 기준. 200일 지수이동평균은 TradingView 일봉 차트와 같은 공식
          (가중치 2/201, 매일 미국장 마감 후 자동 갱신). 과거 백테스트 규칙을 그대로 적용한 결과이며 투자 권유가 아닙니다.
        </p>
      )}

      {showGuideLink && (
        <Link
          href="/posts/withdrawal-guide"
          className="inline-block mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-semibold"
        >
          신호 규칙 자세히 보기 →
        </Link>
      )}
    </div>
  )
}
