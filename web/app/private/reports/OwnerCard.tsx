'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { OwnerProfile } from './ownerData'

// 주주 카드 — 내 주식 몫으로 1초·하루·1년에 얼마를 벌고(매출·이익), 사업부별로 얼마이고, 무엇이 얼마나 팔리나.
// full: 종목 화면용(입력칸·사업부·환산·지분·배당 전부) / compact: 홈 포트폴리오용(외울 숫자만)

const SEC_Y = 365 * 86400

export function readShares(key: string): number {
  try { const v = Number(localStorage.getItem(key)); return v > 0 ? v : 0 } catch { return 0 }
}
export function writeShares(key: string, v: number) {
  try { if (v > 0) localStorage.setItem(key, String(v)); else localStorage.removeItem(key) } catch {}
  try { window.dispatchEvent(new CustomEvent('owner-shares', { detail: key })) } catch {}
}
// 같은 칸을 쓰는 다른 카드(홈·종목 화면)와 숫자를 맞춘다
export function useShares(key: string): [number, (v: number) => void] {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(readShares(key))
    const on = (e: Event) => { if ((e as CustomEvent).detail === key) setN(readShares(key)) }
    window.addEventListener('owner-shares', on)
    return () => window.removeEventListener('owner-shares', on)
  }, [key])
  return [n, v => { writeShares(key, v); setN(v) }]
}

function useNow(ms = 200) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id) }, [ms])
  return now
}

// 돈: 1 미만은 센트로
export function money(v: number, cur: string, big = false): string {
  const a = Math.abs(v), s = v < 0 ? '−' : ''
  if (a >= 1) return `${s}${cur}${a.toLocaleString('ko-KR', { maximumFractionDigits: big || a >= 100 ? 0 : 2, minimumFractionDigits: big || a >= 100 ? 0 : 2 })}`
  const c = a * 100
  return `${s}${c.toFixed(c < 0.001 ? 6 : c < 0.01 ? 5 : c < 0.1 ? 4 : c < 1 ? 3 : 2)}${cur === '€' ? '유로센트' : '센트'}`
}
const num = (v: number) => v >= 1e8 ? `${(v / 1e8).toFixed(1)}억` : v >= 1e4 ? `${(v / 1e4).toFixed(1)}만` : v >= 100 ? Math.round(v).toLocaleString() : v >= 1 ? v.toFixed(1) : v >= 0.01 ? v.toFixed(2) : v.toPrecision(2)
// 1년 양을 읽기 좋은 단위로: 0.1보다 작으면 1초 → 1분 → 1시간 → 하루 → 1년으로 늘린다
export function rateStr(perYear: number, unit: string, from: 'sec' | 'day' = 'sec'): string {
  const steps: [string, number][] = [['1초', SEC_Y], ['1분', SEC_Y / 60], ['1시간', SEC_Y / 3600], ['하루', 365], ['1년', 1]]
  for (const [k, d] of steps.slice(from === 'day' ? 3 : 0)) {
    let v = perYear / d, u = unit
    if (u === 'm' && v >= 1000) { v /= 1000; u = 'km' }
    if (u === '초' && v >= 60) { v /= 60; u = '분' }
    if (v >= 0.1 || k === '1년') {
      if (k === '1년' && v < 1 && v > 0) return `약 ${Math.round(1 / v).toLocaleString()}년에 1${unit.replace(' 값', '')}${unit.endsWith(' 값') ? ' 값' : ''}`
      return `${k} ${num(v)}${u}`
    }
  }
  return ''
}

// 하루 양: 초 → 분·시간, m → km, 너무 작으면 'N일에 1번'
export function dayStr(perDay: number, unit: string): string {
  let v = perDay, u = unit
  if (u === '초') { if (v >= 3600) { v /= 3600; u = '시간' } else if (v >= 60) { v /= 60; u = '분' } }
  if (u === 'm' && v >= 1000) { v /= 1000; u = 'km' }
  if (v > 0 && v < 0.1) return `약 ${Math.round(1 / v).toLocaleString()}일에 1${unit.replace(' 값', '')}${unit.endsWith(' 값') ? ' 값' : ''}`
  return `하루 ${num(v)}${u}`
}

function Tip({ children, text }: { children: ReactNode; text: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block group/tip" onClick={() => setOpen(o => !o)}>
      <span className="border-b border-dotted border-gray-400 cursor-help">{children}</span>
      <span className={`absolute left-0 top-full mt-1 z-50 w-64 max-w-[75vw] rounded-md bg-gray-900 text-white text-xs leading-relaxed px-2.5 py-2 shadow-lg font-normal ${open ? 'block' : 'hidden group-hover/tip:block'}`}>{text}</span>
    </span>
  )
}

export function ownerTotals(p: OwnerProfile, shares: number) {
  const ratio = shares / p.sharesOut
  const rev = p.segs.reduce((a, s) => a + s.rev, 0) * ratio
  const profit = p.segs.reduce((a, s) => a + s.profit, 0) * ratio
  return { ratio, rev, profit, div: p.dps * shares }
}

export default function OwnerCard({ p, compact = false, onOpen, children }: { p: OwnerProfile; compact?: boolean; onOpen?: () => void; children?: ReactNode }) {
  const [saved, setSaved] = useShares(p.storageKey)
  const [txt, setTxt] = useState('')
  useEffect(() => { setTxt(saved > 0 ? String(saved) : '') }, [saved])
  const now = useNow()
  const shares = saved > 0 ? saved : 1
  const { ratio, rev, profit, div } = ownerTotals(p, shares)
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const todaySec = (now - startOfDay) / 1000
  const c = p.cur
  const segTotalRev = p.segs.reduce((a, s) => a + Math.max(0, s.rev), 0)
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const big = 'text-base font-bold tabular-nums text-gray-900 dark:text-white'
  const lab = 'text-[11px] text-gray-500 dark:text-gray-400'

  const top = (
    <div className="grid grid-cols-3 gap-1.5">
      {([
        ['1초', profit / SEC_Y, rev / SEC_Y],
        ['하루', profit / 365, rev / 365],
        ['1년', profit, rev],
      ] as [string, number, number][]).map(([k, pf, rv]) => (
        <div key={k} className="rounded-lg bg-white/80 dark:bg-gray-900/60 px-2 py-2">
          <p className={lab}>내 몫 이익 · {k}</p>
          <p className={big}>{money(pf, c, k === '1년')}</p>
          <p className="text-[11px] text-gray-400 tabular-nums">매출 {money(rv, c, k === '1년')}</p>
        </div>
      ))}
    </div>
  )
  const ticker = (
    <p className="text-xs text-gray-700 dark:text-gray-200 tabular-nums">
      오늘 0시부터 내 몫으로 번 이익 <b className="text-emerald-600 dark:text-emerald-400">{c}{(profit / SEC_Y * todaySec).toFixed(4)}</b>
      <span className="text-gray-400"> · 매출 {c}{(rev / SEC_Y * todaySec).toFixed(3)}</span>
    </p>
  )

  if (compact) {
    const segs = [...p.segs].filter(s => s.rev > 0).sort((a, b) => b.rev - a.rev).slice(0, 3)
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.name} <span className="font-normal text-gray-500 tabular-nums">{shares.toLocaleString()}주{saved ? '' : '(1주로 계산)'}</span></p>
          {onOpen && <button type="button" onClick={onOpen} className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">자세히 →</button>}
        </div>
        {top}
        {ticker}
        <div className="space-y-0.5">
          {segs.map(s => (
            <p key={s.name} className="text-xs text-gray-600 dark:text-gray-300 tabular-nums flex gap-1.5 items-center">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto shrink-0">1초 {money(s.rev * ratio / SEC_Y, c)} · 하루 {money(s.rev * ratio / 365, c)}</span>
            </p>
          ))}
        </div>
        <p className="text-xs text-amber-700 dark:text-amber-300 tabular-nums">
          {p.fun.slice(0, 2).map(f => `${f.label} ${rateStr(f.perYear * ratio, f.unit, f.per === 'day' ? 'day' : 'sec')}`).join(' · ')}
        </p>
        {children}
      </div>
    )
  }

  return (
    <section id="owner-card" className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10 p-3 sm:p-4 space-y-3">
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">주주 카드 — 내 {p.name} 몫은 1초에 얼마를 버나</h3>
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-300">내 주식</span>
          <input inputMode="decimal" value={txt} placeholder="예: 100"
            onChange={e => { const t = e.target.value.replace(/[^0-9.]/g, ''); setTxt(t); setSaved(Number(t) > 0 ? Number(t) : 0) }}
            className="w-24 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-right tabular-nums" />
          <span className="text-gray-500 text-xs">주 {saved ? `= 회사의 ${Math.round(1 / ratio).toLocaleString()}분의 1` : '(비우면 1주)'}</span>
        </label>
        <p className="text-[11px] text-gray-400">메인 화면 &lsquo;내 포트폴리오&rsquo;·이익 시계와 같은 칸(이 기기에만 저장).</p>
      </div>

      {top}
      {ticker}

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">사업부별 — 내 몫 매출 1초·하루, 이익 1년</p>
        {p.segs.map(s => (
          <div key={s.name} className="text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <Tip text={s.note}><span className="text-gray-800 dark:text-gray-100">{s.name}</span></Tip>
              <span className="ml-auto tabular-nums text-gray-700 dark:text-gray-200">{s.rev > 0 ? `${money(s.rev * ratio / SEC_Y, c)} · ${money(s.rev * ratio / 365, c)}` : '—'}</span>
              <span className={`w-20 text-right tabular-nums font-semibold ${s.profit < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{money(s.profit * ratio, c, Math.abs(s.profit * ratio) >= 100)}</span>
            </div>
            {s.rev > 0 && <div className="ml-3.5 mt-0.5 h-1 rounded-full bg-gray-200 dark:bg-gray-800"><div className="h-1 rounded-full" style={{ width: `${s.rev / segTotalRev * 100}%`, background: s.color }} /></div>}
          </div>
        ))}
        <p className="text-[11px] text-gray-400">가운데 = 매출 1초 · 하루, 오른쪽 = 이익 1년(추정). 이름을 누르면 설명.</p>
      </div>

      <div className="rounded-lg bg-amber-50/80 dark:bg-amber-950/20 p-2.5 space-y-1">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">내 몫으로 일어나는 일</p>
        {p.fun.map(f => (
          <p key={f.label} className="text-xs text-gray-700 dark:text-gray-200 tabular-nums">
            <Tip text={<>{f.note} 회사 전체 1년 {num(f.perYear)}{f.unit} × 내 비율. 신뢰도 {f.grade}(A 회사 공식 · B 회사 발표지만 최소값·환산 · C 2차 출처).</>}>{f.label}</Tip>{' '}
            <b className="text-amber-700 dark:text-amber-300">{rateStr(f.perYear * ratio, f.unit, f.per === 'day' ? 'day' : 'sec')}</b>
            <span className="text-gray-400"> · {dayStr(f.perYear * ratio / 365, f.unit)}</span>
          </p>
        ))}
      </div>

      {p.stakes && (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">이익에 안 잡히는 내 몫</p>
          {p.stakes.map(st => (
            <p key={st.label} className="text-xs text-gray-700 dark:text-gray-200 tabular-nums"><Tip text={st.note}>{st.label}</Tip> {c}{Math.round(st.v / 1e8).toLocaleString()}억 → <b>내 몫 {money(st.v * ratio, c, st.v * ratio >= 100)}</b></p>
          ))}
        </div>
      )}

      <p className={small}><b>실제로 통장에 들어오는 돈:</b> 배당 1년 {money(div, c, div >= 100)}(이익의 약 {profit > 0 ? Math.round(div / profit * 100) : 0}%). {p.cash}</p>
      <p className="text-[11px] text-gray-400">{p.period} · {p.src}. {p.how} 매출·이익은 비용·세금을 빼기 전·후 회사 숫자 × 내 비율이라 실제 주가 움직임과는 다르다.</p>
    </section>
  )
}
