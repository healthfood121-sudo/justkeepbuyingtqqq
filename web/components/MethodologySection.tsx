'use client'

import { useState } from 'react'
import Link from 'next/link'

function AmountInput({
  label, value, onChange, unit = '원',
}: {
  label: string; value: number; onChange: (v: number) => void; unit?: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={focused ? value : value.toLocaleString()}
          onFocus={e => { setFocused(true); e.target.select() }}
          onBlur={() => setFocused(false)}
          onChange={e => {
            const raw = e.target.value.replace(/,/g, '')
            const n = Number(raw)
            if (!isNaN(n)) onChange(n)
          }}
          className="w-36 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white text-sm text-right focus:border-blue-500 focus:outline-none"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500 w-4">{unit}</span>
      </div>
    </div>
  )
}

function Derived({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
      <span className="text-sm text-blue-500 dark:text-blue-400 font-mono">{value}</span>
    </div>
  )
}

function SimButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="mt-5 block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
    >
      백테스트 결과 확인 →
    </Link>
  )
}

function simUrl(params: { daily?: number; target?: number; lump?: number }) {
  const q = new URLSearchParams()
  if (params.daily)  q.set('daily',  String(params.daily))
  if (params.target) q.set('target', String(params.target))
  if (params.lump)   q.set('lump',   String(params.lump))
  if (params.lump)   q.set('cap',    String(params.lump))  // B한도 = C거치금 (목돈 동일 사용)
  const qs = q.toString()
  return `/simulator/custom${qs ? '?' + qs : ''}`
}

function fmt(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억원`
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만원`
  return `${n.toLocaleString()}원`
}

// ── 01 적립식 (거치 포함) ──────────────────────────────
function AccumSection() {
  const [lump,   setLump]   = useState(0)
  const [daily,  setDaily]  = useState(200_000)
  const [target, setTarget] = useState(1_000_000_000)

  const SPLIT_DAYS = 5 * 252
  const dailyLump  = Math.round(lump / SPLIT_DAYS)

  return (
    <div>
      <AmountInput label="목돈 (없으면 0)" value={lump} onChange={setLump} />
      {lump > 0 && (
        <div className="pl-3 border-l-2 border-blue-300 dark:border-blue-800 my-1">
          <Derived
            label="C전략: 5년 분할 거치"
            value={`일 ${fmt(dailyLump)}`}
          />
          <Derived
            label="B전략: 매입한도로도 적용"
            value={`누적 ${fmt(lump)} 도달 시 중단`}
          />
        </div>
      )}
      <AmountInput label="일 적립액" value={daily}  onChange={setDaily}  />
      <AmountInput label="목표금액"  value={target} onChange={setTarget} />
      <SimButton href={simUrl({ daily, target, lump })} />
    </div>
  )
}

// ── 02 인출식 ─────────────────────────────────────────
function WithdrawSection() {
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-3">
        <div className="flex gap-3">
          <span className="text-purple-500 dark:text-purple-400 shrink-0 font-mono">01</span>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            <span className="text-gray-900 dark:text-white font-semibold">동적 인출 시작</span>
            {' '}— 자산이 작을 때 덜 꺼내고, 클 때 더 꺼낸다.
            <span className="text-gray-400 dark:text-gray-500 text-xs font-mono mt-1 block">
              10억 미만 → 월 0.3% · 10~20억 → 월 0.5% · 20억 이상 → 월 0.7%
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-500 dark:text-purple-400 shrink-0 font-mono">02</span>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            <span className="text-gray-900 dark:text-white font-semibold">하락 신호 → 전량 현금 전환</span>
            {' '}— 나스닥100이 EMA200 아래 15거래일 연속이면 전량 매도. 현금은 외화RP로 이자를 받는다.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-500 dark:text-purple-400 shrink-0 font-mono">03</span>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            <span className="text-gray-900 dark:text-white font-semibold">과매도 신호 → 즉시 재매수</span>
            {' '}— EMA200 회복 신호를 기다리지 않고, RSI 14일이 30 미만이면서 가격이 EMA200보다 10% 이상 떨어진 상태면 바로 재진입.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="text-purple-500 dark:text-purple-400 shrink-0 font-mono">04</span>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            <span className="text-gray-900 dark:text-white font-semibold">Guyton-Klinger 조정</span>
            {' '}— 자산이 크게 늘면 인출을 자동으로 줄여 복리를 지킨다.
          </p>
        </div>
      </div>

      <Link
        href="/posts/withdrawal-guide"
        className="mt-5 block w-full text-center bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        방법론 상세 보기 →
      </Link>
    </div>
  )
}

// ── 메인 export ──────────────────────────────────────
export default function MethodologySection() {
  const sections = [
    {
      num: '01',
      title: '적립식',
      tag: 'JUST KEEP BUYING',
      tagColor: 'text-blue-500 dark:text-blue-400',
      sub: '시드 없이 시작하거나, 목돈이 있는 사람',
      color: 'border-blue-200 dark:border-blue-500/40',
      content: <AccumSection />,
    },
    {
      num: '02',
      title: '인출식',
      tag: 'JUST KEEP SELLING',
      tagColor: 'text-purple-500 dark:text-purple-400',
      sub: '목표 달성 후 FIRE 단계',
      color: 'border-purple-200 dark:border-purple-500/40',
      content: <WithdrawSection />,
    },
  ]

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">방법론</h2>
      <p className="text-gray-500 dark:text-gray-500 text-center text-sm mb-12">
        내 상황에 맞는 단계를 선택하고 백테스트로 확인하세요.
      </p>
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {sections.map(s => (
          <div
            key={s.num}
            className={`bg-gray-50 dark:bg-gray-900 rounded-2xl border ${s.color} p-6`}
          >
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400 dark:text-gray-600">{s.num}</span>
              <span className={`text-xs font-bold tracking-wide ${s.tagColor}`}>{s.tag}</span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{s.title}</h3>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">{s.sub}</p>
            {s.content}
          </div>
        ))}
      </div>
    </section>
  )
}
