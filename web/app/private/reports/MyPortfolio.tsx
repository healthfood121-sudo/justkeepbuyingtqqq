'use client'

import { useEffect, useState } from 'react'
import OwnerCard, { ownerTotals, readShares, writeShares, money } from './OwnerCard'
import { OWNERS, PORTFOLIO_KEY } from './ownerData'

// 홈 화면 '내 포트폴리오' — 종목을 고르고 주식 수를 넣으면 종목마다 주주 카드(1초 내 몫)가 펼쳐진다.
// 주식 수는 종목 화면의 주주 카드·이익 시계와 같은 칸(각 종목 storageKey)에 저장된다.

const EUR_USD = 1.16 // 유로 → 달러 환산(합계용 가정값)
const SEC_Y = 365 * 86400

function readKeys(): string[] {
  try { const v = JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? '[]'); return Array.isArray(v) ? v.filter((k: string) => OWNERS[k]) : [] } catch { return [] }
}
function saveKeys(keys: string[]) {
  try { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(keys)) } catch {}
}

export default function MyPortfolio({ onPick }: { onPick: (key: string) => void }) {
  const [keys, setKeys] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [addKey, setAddKey] = useState('')
  const [addN, setAddN] = useState('')
  const [, bump] = useState(0)
  useEffect(() => {
    // 처음이면 종목 화면에서 이미 주식 수를 넣어 둔 종목을 자동으로 담는다
    let k = readKeys()
    if (!k.length) k = Object.values(OWNERS).filter(p => readShares(p.storageKey) > 0).map(p => p.key)
    setKeys(k); setReady(true)
    const on = () => bump(x => x + 1)
    window.addEventListener('owner-shares', on)
    return () => window.removeEventListener('owner-shares', on)
  }, [])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(id) }, [])

  const left = Object.values(OWNERS).filter(p => !keys.includes(p.key))
  const add = () => {
    const k = addKey || left[0]?.key
    if (!k) return
    const n = Number(addN)
    if (n > 0) writeShares(OWNERS[k].storageKey, n)
    const next = [...keys, k]
    setKeys(next); saveKeys(next); setAddKey(''); setAddN('')
  }
  const remove = (k: string) => { const next = keys.filter(x => x !== k); setKeys(next); saveKeys(next) }

  // 합계(달러 환산)
  const tot = keys.reduce((a, k) => {
    const p = OWNERS[k], n = readShares(p.storageKey) || 1
    const t = ownerTotals(p, n), fx = p.cur === '€' ? EUR_USD : 1
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

      {keys.length > 1 && (
        <div className="rounded-lg bg-white/80 dark:bg-gray-900/60 p-2.5">
          <p className="text-[11px] text-gray-500">전체 합계 (달러 환산{keys.some(k => OWNERS[k].cur === '€') ? `, 1유로 = ${EUR_USD}달러 가정` : ''})</p>
          <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">1초 {money(tot.profit / SEC_Y, '$')} <span className="text-sm font-normal text-gray-500">· 하루 {money(tot.profit / 365, '$')} · 1년 {money(tot.profit, '$', true)}</span></p>
          <p className="text-xs tabular-nums text-gray-600 dark:text-gray-300">오늘 0시부터 번 이익 <b className="text-emerald-600 dark:text-emerald-400">${(tot.profit / SEC_Y * todaySec).toFixed(4)}</b> · 1년 매출 {money(tot.rev, '$', true)} · 실제 배당 1년 {money(tot.div, '$', true)}</p>
        </div>
      )}

      {keys.length === 0 && <p className="text-sm text-gray-500">아직 담은 종목이 없다. 아래에서 종목과 주식 수를 넣어 본다.</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        {keys.map(k => (
          <div key={k}>
            <OwnerCard p={OWNERS[k]} compact onOpen={() => onPick(k)}>
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-xs">
              <label className="flex items-center gap-1 text-gray-500">주식 수
                <input inputMode="decimal" defaultValue={readShares(OWNERS[k].storageKey) || ''} placeholder="1"
                  onChange={e => writeShares(OWNERS[k].storageKey, Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                  className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-right tabular-nums" />
              </label>
              <button type="button" onClick={() => remove(k)} className="ml-auto text-gray-400 hover:text-red-500">빼기</button>
            </div>
            </OwnerCard>
          </div>
        ))}
      </div>

      {left.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select value={addKey || left[0].key} onChange={e => setAddKey(e.target.value)}
            className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1">
            {left.map(p => <option key={p.key} value={p.key}>{p.name} ({p.key})</option>)}
          </select>
          <input inputMode="decimal" value={addN} onChange={e => setAddN(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="주식 수"
            className="w-24 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-right tabular-nums" />
          <button type="button" onClick={add} className="px-3 py-1 rounded-full bg-emerald-600 text-white text-sm font-semibold">담기</button>
        </div>
      )}
      <p className="text-[11px] text-gray-400">지금은 구글·에르메스만 주주 카드가 있다(다른 종목은 차례로 추가). 이 기기에만 저장된다. 이익은 회사 이익 중 내 몫이라는 뜻이고, 통장에 들어오는 건 배당뿐이다.</p>
    </section>
  )
}
