'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  entry_loc?: Loc       // D10GK 보유 중: 다음 종가가 이 값 이하면 재매수 조건 충족 (새로 시작하는 사람용)
  above_days?: number   // 현금일 때 200일선 위 연속일 (15일이면 매수)
  sell_line?:  number   // RULE25 보유 중 매도선 (1년 최고 종가 × 0.75)
  below_days?: number   // S0·D10GK 보유 중 200일선 아래 연속일 (15일이면 매도)
  last_events: { date: string; signal?: string; action: string; how: string }[]   // 최신순. date=매매일, signal=신호가 켜진 날
  last_cond?: { date: string; state: '보유' | '현금' }   // D10GK: 재매수 조건이 마지막으로 맞은 날과 그때 상태
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

const ROWS: { key: 'S0' | 'D10GK'; name: string; rule: string }[] = [
  { key: 'S0',    name: 'S0',    rule: '200일 평균선 아래 15일 연속 마감하면 매도, 위로 15일 연속이면 재매수' },
  { key: 'D10GK', name: 'D10GK', rule: 'S0와 같은 매도 규칙 + 급락 때 RSI 조건으로 조기 재매수' },
]

// 텔레그램 채널 주소 (Vercel 환경 변수 NEXT_PUBLIC_TELEGRAM_URL, 예: https://t.me/채널아이디) — 없으면 링크 숨김
const TELEGRAM_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL ?? ''

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

// 마지막 매도·매수 신호가 켜진 날과 실제 매매일
function LastEvents({ t }: { t: StrategySignal }) {
  const ago = (d: string) => {
    const days = Math.round((Date.now() - new Date(d + 'T00:00:00Z').getTime()) / 86400000)
    if (days < 60) return `${days}일 전`
    if (days < 730) return `${Math.round(days / 30.4)}개월 전`
    return `${(days / 365.25).toFixed(1)}년 전`
  }
  const items = (['매도', '매수'] as const)
    .map(a => ({ a, e: t.last_events.find(e => e.action === a) }))
    .filter((x): x is { a: '매도' | '매수'; e: StrategySignal['last_events'][number] } => !!x.e)
  // D10GK: 마지막 매수 신호보다 뒤에 조건만 맞은 날(보유 중이라 매매 없음)이 있으면 따로 표시
  const lastBuy = items.find(x => x.a === '매수')?.e
  const cond = t.last_cond && (!lastBuy || t.last_cond.date > (lastBuy.signal ?? lastBuy.date)) ? t.last_cond : null
  if (!items.length && !cond) return null
  return (
    <div className="mt-1.5 space-y-0.5 text-[11px]">
      {items.map(({ a, e }) => {
        const sigDay = e.signal ?? e.date
        const sameDay = sigDay === e.date
        return (
          <p key={a} className="text-gray-500 dark:text-gray-400">
            <span className="whitespace-nowrap">
              <span className={`font-semibold ${a === '매도' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>마지막 {a} 신호</span>{' '}
              <span className="font-mono text-gray-700 dark:text-gray-200">{sigDay}</span>
              <span className="text-gray-400 dark:text-gray-500"> ({ago(sigDay)})</span>
            </span>{' '}
            <span className="whitespace-nowrap text-gray-400 dark:text-gray-500">
              → {sameDay ? '그날 종가에' : <><span className="font-mono">{e.date}</span> 종가에</>} {a}
            </span>
          </p>
        )
      })}
      {cond && (
        <p className="text-gray-500 dark:text-gray-400">
          <span className="whitespace-nowrap">
            <span className="font-semibold text-amber-700 dark:text-amber-300">마지막 재매수 조건 충족</span>{' '}
            <span className="font-mono text-gray-700 dark:text-gray-200">{cond.date}</span>
            <span className="text-gray-400 dark:text-gray-500"> ({ago(cond.date)})</span>
          </span>{' '}
          <span className="whitespace-nowrap text-gray-400 dark:text-gray-500">
            → {cond.state === '보유' ? '보유 중이라 매매 없음' : '그날 종가에 매수'}
          </span>
        </p>
      )}
    </div>
  )
}

// S0·D10GK 보유 중: 200일선 아래 연속일 15칸 막대
function BelowGauge({ sig, days }: { sig: Signal; days: number }) {
  const d = Math.min(15, days)
  const color = d >= 12 ? 'bg-red-500' : d >= 8 ? 'bg-amber-500' : 'bg-gray-400'
  return (
    <div className="mt-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-sm ${i < d ? color : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
        {days === 0
          ? <>200일 평균선 위 · 매도 카운트 없음</>
          : <>매도까지 <strong>15일 중 {d}일째</strong></>}
        <span className="text-gray-400 dark:text-gray-500"> · 200일 평균선 {num(sig.ema200)} 아래 마감 기준</span>
      </p>
    </div>
  )
}

// D10GK 조기 재매수 조건: RSI(14) 30 미만 + 200일선 대비 −10% 이하 (둘 다 그날 종가 기준)
function RsiCheck({ sig, t }: { sig: Signal; t: StrategySignal }) {
  const rsiOk = sig.rsi14 < 30
  const divOk = sig.vs_ema_pct <= -10
  const both = rsiOk && divOk
  const Item = ({ ok, label, now, need }: { ok: boolean; label: string; now: string; need: string }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-600 dark:text-gray-300">
        <span className={`inline-block w-1.5 h-1.5 rounded-full align-middle mr-1 ${ok ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />{label}
      </span>
      <span className="tabular-nums">
        <strong className={ok ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-200'}>{now}</strong>
        <span className="text-gray-400 dark:text-gray-500"> / 기준 {need}</span>
      </span>
    </div>
  )
  return (
    <div className="mt-2 rounded-md bg-gray-50 dark:bg-gray-800/60 px-2 py-1.5 space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-700 dark:text-gray-200">조기 재매수 조건</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
          both ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
               : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
          {both ? '둘 다 충족' : rsiOk || divOk ? '1개 충족' : '미충족'}
        </span>
      </div>
      <Item ok={rsiOk} label="14일 RSI" now={sig.rsi14.toFixed(1)} need="30 미만" />
      <Item ok={divOk} label="200일선 대비" now={pct(sig.vs_ema_pct)} need="−10% 이하" />
      {t.state === '보유' && t.entry_loc && sig.rsi14 < 35 && t.entry_loc.ndx_pct >= -8 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300 pt-0.5">
          새로 시작하는 사람 참고: 오늘 밤 나스닥100이 <strong>{num(t.entry_loc.ndx_price)}</strong>({pct(t.entry_loc.ndx_pct)}) 이하로 마감하면 조건 충족
          {t.entry_loc.tqqq_price ? <> → TQQQ <strong>${t.entry_loc.tqqq_price.toFixed(2)}</strong> 이하 LOC 매수</> : null}
        </p>
      )}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed pt-0.5">
        {t.state === '보유'
          ? both
            ? '이미 TQQQ를 보유 중이면 할 일이 없습니다. 현금으로 새로 시작하는 사람에게는 D10GK 규칙상 들어가는 조건이 맞은 날입니다 (규칙대로라면 이 종가에 매수).'
            : '매도 후 현금일 때, 두 조건이 같은 날 종가로 동시에 맞으면 그날 종가에 재매수합니다.'
          : '두 조건이 같은 날 종가로 동시에 맞으면 그날 종가에 재매수합니다 (LOC 주문).'}
      </p>
    </div>
  )
}

export default function WithdrawalSignal() {
  const [sig, setSig] = useState<Signal | null>(null)
  const [err, setErr] = useState(false)
  const [showOthers, setShowOthers] = useState(false)

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
            <LastEvents t={t} />
          </div>
        )
      })()}

      {(() => {
        const urgentCount = ROWS.filter(r => {
          const a = sig.strategies[r.key].action
          return a === '매도' || a === '매수' || a === 'LOC 매수 주문'
        }).length
        return (
          <button
            type="button"
            onClick={() => setShowOthers(v => !v)}
            aria-expanded={showOthers}
            className="w-full flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
          >
            <span className="text-left">
              <span className="block">다른 신호 보기 <span className="font-normal text-gray-400 dark:text-gray-500">· 비교 전략 S0 · D10GK</span></span>
              {urgentCount > 0
                ? <span className="block text-red-600 dark:text-red-400">신호 {urgentCount}개 켜짐</span>
                : <span className="block font-normal text-gray-400 dark:text-gray-500">켜진 신호 없음</span>}
            </span>
            <span className="shrink-0 pl-2 text-gray-400 whitespace-nowrap">{showOthers ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>
        )
      })()}

      {showOthers && (
        <div className="space-y-2 mt-2 text-[11px]">
          <p className="text-[10px] text-gray-400 dark:text-gray-500">비교용입니다. 메인 전략은 위의 25% 룰입니다.</p>
          {ROWS.map(({ key, name, rule }) => {
            const s = sig.strategies[key]
            const urgent = s.action === '매도' || s.action === '매수'
            return (
              <div key={key} className="rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    s.state === '보유'
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                    {s.state === '보유' ? 'TQQQ 보유' : '현금'}
                  </span>
                  <span className={urgent ? 'text-red-600 dark:text-red-400 font-semibold' : s.loc ? 'text-purple-600 dark:text-purple-300 font-semibold' : 'text-gray-400 dark:text-gray-500'}>
                    {urgent ? `다음 거래일 전량 ${s.action}` : s.loc ? 'LOC 매수 주문' : '할 일 없음'}
                  </span>
                </div>
                <p className="text-gray-400 dark:text-gray-500 mt-0.5">{rule}</p>
                {urgent
                  ? <p className="text-red-600 dark:text-red-400 mt-0.5">{s.detail}</p>
                  : s.state === '보유' && s.below_days !== undefined
                    ? <BelowGauge sig={sig} days={s.below_days} />
                    : <Gauge sig={sig} t={s} />}
                {s.loc && (
                  <p className="text-purple-700 dark:text-purple-300 mt-1">
                    {s.loc.tqqq_price
                      ? <>TQQQ <strong>${s.loc.tqqq_price.toFixed(2)}</strong> 이하 LOC 매수</>
                      : <>TQQQ 전일 종가 대비 <strong>{pct(s.loc.tqqq_pct)}</strong> 이하 가격으로 LOC 매수</>}
                    {' '}(나스닥100이 {pct(s.loc.ndx_pct)} 이하로 끝나야 체결)
                  </p>
                )}
                <LastEvents t={s} />
                {key === 'D10GK' && <RsiCheck sig={sig} t={s} />}
              </div>
            )
          })}
        </div>
      )}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
        매일 아침 7시 30분 자동 갱신 · 투자 권유 아님 ·{' '}
        <Link href="/live" className="underline text-purple-600 dark:text-purple-300 whitespace-nowrap">공개 이후 실제 성적</Link>
        {TELEGRAM_URL && (
          <>
            {' · '}
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="underline text-purple-600 dark:text-purple-300">
              텔레그램으로 신호 알림 받기
            </a>
          </>
        )}
      </p>
    </div>
  )
}
