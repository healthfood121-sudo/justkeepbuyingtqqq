'use client'

import { useEffect, useState } from 'react'
import OwnerCard, { ownerTotals, readShares, writeShares, money } from './OwnerCard'
import { PORTFOLIO_KEY, type OwnerProfile } from './ownerData'

// 홈 화면 '내 포트폴리오' — 종목을 고르고 주식 수를 넣으면 종목마다 주주 카드(1초 내 몫)가 펼쳐진다.
// 카드 숫자는 종목 화면의 주주 카드와 같다(resolve가 같은 방법으로 만든다). 주식 수도 같은 칸(storageKey)에 저장.

const EUR_USD = 1.16 // 유로 → 달러 환산(합계용 가정값)
const SEC_Y = 365 * 86400

function readKeys(): string[] | null {
  try { const v = JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? 'null'); return Array.isArray(v) ? v : null } catch { return null }
}
function saveKeys(keys: string[]) {
  try { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(keys)) } catch {}
}
const keyOf = (k: string) => k === 'RMS' ? 'rms-shares' : `clock-shares-${k}`

export default function MyPortfolio({ onPick, resolve, options }: {
  onPick: (key: string) => void
  resolve: (key: string) => Promise<OwnerProfile | null>
  options: { key: string; name: string }[]
}) {
  const [keys, setKeys] = useState<string[]>([])
  const [profiles, setProfiles] = useState<Record<string, OwnerProfile | null>>({})
  const [ready, setReady] = useState(false)
  const [q, setQ] = useState('')
  const [addN, setAddN] = useState('')
  const [msg, setMsg] = useState('')
  const [, bump] = useState(0)
  useEffect(() => {
    // 처음이면 종목 화면에서 이미 주식 수를 넣어 둔 종목을 자동으로 담는다
    const k = readKeys() ?? options.map(o => o.key).filter(x => readShares(keyOf(x)) > 0)
    setKeys(k); setReady(true)
    const on = () => bump(x => x + 1)
    window.addEventListener('owner-shares', on)
    return () => window.removeEventListener('owner-shares', on)
  }, [options])
  useEffect(() => {
    for (const k of keys) if (!(k in profiles)) resolve(k).then(p => setProfiles(o => ({ ...o, [k]: p })))
  }, [keys, profiles, resolve])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(id) }, [])

  const qq = q.trim().toLowerCase()
  const hits = qq ? options.filter(o => !keys.includes(o.key) && (o.key.toLowerCase().startsWith(qq) || o.name.toLowerCase().includes(qq))).slice(0, 6) : []
  const add = async (k: string) => {
    setMsg('')
    const p = await resolve(k)
    if (!p) { setMsg(`${k}: 매출 자료가 없어 주주 카드를 만들 수 없다(지수·ETF, 버크셔처럼 분기 매출이 자동 수집되지 않는 종목).`); return }
    const n = Number(addN)
    if (n > 0) writeShares(p.storageKey, n)
    setProfiles(o => ({ ...o, [k]: p }))
    const next = [...keys.filter(x => x !== k), k]
    setKeys(next); saveKeys(next); setQ(''); setAddN('')
  }
  const remove = (k: string) => { const next = keys.filter(x => x !== k); setKeys(next); saveKeys(next) }

  // 합계(달러 환산)
  const live = keys.map(k => profiles[k]).filter((p): p is OwnerProfile => !!p)
  const tot = live.reduce((a, p) => {
    const t = ownerTotals(p, readShares(p.storageKey) || 1), fx = p.cur === '€' ? EUR_USD : 1
    return { profit: a.profit + t.profit * fx, rev: a.rev + t.rev * fx, div: a.div + t.div * fx }
  }, { profit: 0, rev: 0, div: 0 })
  const startOfDay = new Date(new Date(now).setHours(0, 0, 0, 0)).getTime()
  const todaySec = (now - startOfDay) / 1000

  if (!ready) return null
  return (
    <section className="rounded-xl border-2 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10 p-3 sm:p-4 space-y-3">
      <div>
        <p className="text-base font-semibold text-gray-900 dark:text-white">💼 내 포트폴리오 — 내 몫은 지금도 벌고 있다</p>
        <p className="text-xs text-gray-600 dark:text-gray-300">주식 수를 넣으면 회사 숫자 × 내 비율로, 내 몫이 1초·하루·1년에 버는 이익과 매출, 사업부별 몫이 나온다. 종목 화면의 주주 카드와 같은 숫자다.</p>
      </div>

      {live.length > 1 && (
        <div className="rounded-lg bg-white/80 dark:bg-gray-900/60 p-2.5">
          <p className="text-[11px] text-gray-500">전체 합계 (달러 환산{live.some(p => p.cur === '€') ? `, 1유로 = ${EUR_USD}달러 가정` : ''})</p>
          <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">1초 {money(tot.profit / SEC_Y, '$')} <span className="text-sm font-normal text-gray-500">· 하루 {money(tot.profit / 365, '$')} · 1년 {money(tot.profit, '$', true)}</span></p>
          <p className="text-xs tabular-nums text-gray-600 dark:text-gray-300">오늘 0시부터 번 이익 <b className="text-emerald-600 dark:text-emerald-400">${(tot.profit / SEC_Y * todaySec).toFixed(4)}</b> · 1년 매출 {money(tot.rev, '$', true)} · 실제 배당 1년 {money(tot.div, '$', true)}</p>
        </div>
      )}

      {keys.length === 0 && <p className="text-sm text-gray-500">아직 담은 종목이 없다. 아래에서 종목과 주식 수를 넣어 본다.</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        {keys.map(k => {
          const p = profiles[k]
          if (p === undefined) return <div key={k} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-xs text-gray-400">{k} 불러오는 중…</div>
          if (p === null) return <div key={k} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-xs text-gray-500 flex">{k}: 숫자가 없어 카드를 만들 수 없다 <button type="button" onClick={() => remove(k)} className="ml-auto text-gray-400 hover:text-red-500">빼기</button></div>
          return (
            <OwnerCard key={k} p={p} compact onOpen={() => onPick(k)}>
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
                <label className="flex items-center gap-1 text-gray-500">주식 수
                  <input inputMode="decimal" defaultValue={readShares(p.storageKey) || ''} placeholder="1"
                    onChange={e => writeShares(p.storageKey, Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                    className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-right tabular-nums" />
                </label>
                <button type="button" onClick={() => remove(k)} className="ml-auto text-gray-400 hover:text-red-500">빼기</button>
              </div>
            </OwnerCard>
          )
        })}
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="담을 종목 (티커나 이름)"
            className="flex-1 min-w-[10rem] rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1" />
          <input inputMode="decimal" value={addN} onChange={e => setAddN(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="주식 수"
            className="w-24 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-right tabular-nums" />
        </div>
        {hits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hits.map(o => (
              <button key={o.key} type="button" onClick={() => add(o.key)} className="px-2.5 py-1 rounded-full text-xs bg-emerald-600 text-white">
                + {o.key} <span className="opacity-80">{o.name}</span>
              </button>
            ))}
          </div>
        )}
        {msg && <p className="text-xs text-rose-600">{msg}</p>}
      </div>
      <p className="text-[11px] text-gray-400">이 기기에만 저장된다. 이익은 회사 이익 중 내 몫이라는 뜻이고, 통장에 들어오는 건 배당뿐이다. 구글·에르메스는 직접 조사한 카드, 나머지는 이익 시계의 사업부별 숫자와 회사 공시(SEC)로 자동으로 만든 카드다.</p>
    </section>
  )
}
