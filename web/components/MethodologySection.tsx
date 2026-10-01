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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-800 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
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
          className="w-36 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm text-right focus:border-blue-500 focus:outline-none"
        />
        <span className="text-xs text-gray-500 w-4">{unit}</span>
      </div>
    </div>
  )
}

function Derived({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-blue-400 font-mono">{value}</span>
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

function fmt(n: number) {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억원`
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만원`
  return `${n.toLocaleString()}원`
}

// ── 01 적립식 ──────────────────────────────────────────
function AccumSection() {
  const [daily,  setDaily]  = useState(200_000)
  const [target, setTarget] = useState(1_000_000_000)

  return (
    <div>
      <AmountInput label="일 적립액" value={daily}  onChange={setDaily}  />
      <AmountInput label="목표금액"  value={target} onChange={setTarget} />
      <SimButton href="/simulator" />
    </div>
  )
}

// ── 02 거치식 + 적립식 ─────────────────────────────────
function LumpAccumSection() {
  const [lump,   setLump]   = useState(250_000_000)
  const [daily,  setDaily]  = useState(200_000)
  const [target, setTarget] = useState(1_000_000_000)

  const SPLIT_DAYS = 3 * 252          // 3년 거래일
  const dailyLump  = Math.round(lump / SPLIT_DAYS)

  return (
    <div>
      <AmountInput label="거치금액" value={lump}   onChange={setLump}   />
      <div className="pl-3 border-l-2 border-blue-800 my-1">
        <Derived
          label={`3년(${SPLIT_DAYS}거래일)로 분할`}
          value={`일 ${fmt(dailyLump)}`}
        />
        <Derived
          label="닷컴버블 대비 분할 매수"
          value="최악의 고점 진입 위험 최소화"
        />
      </div>
      <AmountInput label="일 적립액" value={daily}  onChange={setDaily}  />
      <AmountInput label="목표금액"  value={target} onChange={setTarget} />
      <SimButton href="/simulator" />
    </div>
  )
}

// ── 03 인출식 ─────────────────────────────────────────
function WithdrawSection() {
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-3">
        <div className="flex gap-3">
          <span className="text-blue-400 shrink-0 font-mono">01</span>
          <p className="text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">현금 버퍼 계산</span>
            {' '}— 목표 달성 소요기간이 짧을수록 버퍼를 더 쌓는다.
            <br />
            <span className="text-gray-500 text-xs font-mono mt-1 block">
              버퍼 기간 = max(0, 13년 − 소요기간)<br />
              버퍼 금액 = 버퍼 기간 × 일적립액 × 252
            </span>
          </p>
        </div>

        <div className="flex gap-3">
          <span className="text-blue-400 shrink-0 font-mono">02</span>
          <p className="text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">버블 케이스</span>
            {' '}(소요 1.5년 미만) — 전량 매도 후 2년 대기,
            이후 버퍼 기간 동안 매일 균등 분산 재진입.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="text-blue-400 shrink-0 font-mono">03</span>
          <p className="text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">월 1% 인출 시작</span>
            {' '}— 조정장은 그냥 맞고 간다.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="text-yellow-400 shrink-0 font-mono">04</span>
          <p className="text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">SP500 −20%</span>
            {' '}— 인출 중단, 1년간 일적립액으로 매수 재개.
            8억 회복 시 인출 재시작.
          </p>
        </div>

        <div className="flex gap-3">
          <span className="text-red-400 shrink-0 font-mono">05</span>
          <p className="text-gray-300 leading-relaxed">
            <span className="text-white font-semibold">SP500 −50%</span>
            {' '}— 남은 현금 버퍼를 13년에 걸쳐 매일 분산 매수.
            8억 회복 시 인출 재시작.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400 leading-relaxed">
        전 구간 백테스트(1971~2026, 643 코호트) 결과
        <span className="text-green-400 font-semibold ml-1">100% 생존</span>.
        최악 시나리오(닷컴버블 직전 진입)도 40년 후 96억+ 회복.{' '}
        <Link href="/posts/withdrawal-strategy" className="text-blue-400 hover:underline">
          설계 과정 읽기 →
        </Link>
      </div>

      <SimButton href="/simulator" />
    </div>
  )
}

// ── 메인 export ──────────────────────────────────────
export default function MethodologySection() {
  const sections = [
    {
      num: '01',
      title: '적립식',
      sub: '시드 없이 처음 시작하는 사람',
      color: 'border-blue-500/40',
      content: <AccumSection />,
    },
    {
      num: '02',
      title: '거치식 + 적립식',
      sub: '어느 정도 시드가 있는 사람',
      color: 'border-emerald-500/40',
      content: <LumpAccumSection />,
    },
    {
      num: '03',
      title: '인출식',
      sub: '목표 달성 후 FIRE 단계',
      color: 'border-purple-500/40',
      content: <WithdrawSection />,
    },
  ]

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <h2 className="text-2xl font-bold text-center mb-2">방법론</h2>
      <p className="text-gray-500 text-center text-sm mb-12">
        내 상황에 맞는 단계를 선택하고 백테스트로 확인하세요.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {sections.map(s => (
          <div
            key={s.num}
            className={`bg-gray-900 rounded-2xl border ${s.color} p-6`}
          >
            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-mono text-xs text-gray-600">{s.num}</span>
              <h3 className="text-base font-bold text-white">{s.title}</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">{s.sub}</p>
            {s.content}
          </div>
        ))}
      </div>
    </section>
  )
}
