'use client'

import { useEffect, useState } from 'react'

// 목표 PER을 정하면 "그 PER이 되는 주가"를 지금과 앞으로(예상 주당이익)로 보여 준다.
// 주가가 그 값 아래로 오면 "목표 PER 이하로 살 수 있는 날"이라는 뜻.
export type PeMark = { pe: number; label: string; note: string }

const fmt = (v: number) => `€${Math.round(v).toLocaleString('ko-KR')}`
const sgn = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`

export default function TargetPriceTable({
  price, priceDate, eps, epsEnd, g, marks, years = 5, payout, myPrices = [], storeKey,
}: {
  price: number
  priceDate: string
  eps: number      // 최근 1년 주당이익
  epsEnd: number   // 그 1년이 끝난 시점(소수 연도, 예: 2026.5 = 2026년 6월 말)
  g: number        // 기본 이익 성장률(연 %)
  marks: PeMark[]
  years?: number
  payout?: number  // 배당성향(이익 중 배당 비율, 0~1) — 있으면 '살 때 PER별 10년 수익률' 표를 보여 준다
  myPrices?: number[] // '내 목표가' 기본값
  storeKey?: string   // 있으면 내 목표가를 이 브라우저에 기억
}) {
  const [mine, setMine] = useState<string[]>(myPrices.map(String))
  useEffect(() => {
    if (!storeKey) return
    try { const v = JSON.parse(localStorage.getItem(storeKey) ?? 'null'); if (Array.isArray(v) && v.every(x => typeof x === 'string')) setMine(v) } catch {}
  }, [storeKey])
  const saveMine = (v: string[]) => { setMine(v); if (storeKey) try { localStorage.setItem(storeKey, JSON.stringify(v)) } catch {} }
  const [pe, setPe] = useState(marks[0]?.pe ?? 20)
  const [custom, setCustom] = useState('')
  const peNow = price / eps
  const lo = Math.max(g - 3, 0), hi = g + 3
  // 소수 연도: Y년 말 = Y + 1 (2026.5 = 2026년 6월 말)
  const y0 = Math.floor(epsEnd) + 1 > epsEnd ? Math.floor(epsEnd) : Math.floor(epsEnd) + 1
  const epsAt = (t: number, r: number) => eps * Math.pow(1 + r / 100, t - epsEnd)
  const rows = [
    { k: '지금', sub: '최근 1년 주당이익', t: epsEnd },
    ...Array.from({ length: years }, (_, i) => ({ k: `${y0 + i}년 말`, sub: `${y0 + i}년 연간 예상`, t: y0 + i + 1 })),
  ]
  const th = 'py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500 break-keep'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200'
  const p = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const matrixPes = Array.from(new Set([...marks.map(m => m.pe)])).sort((a, b) => a - b)
  const reachYear = (target: number) => {
    // 기본 성장률로 "목표 PER 가격"이 지금 주가를 넘는 첫 해 (주가가 그대로라면)
    if (target * eps >= price) return 'now'
    const yrs = Math.log(price / (target * eps)) / Math.log(1 + g / 100)
    return g > 0 ? epsEnd + yrs : null
  }
  const ry = reachYear(pe)
  const ryLabel = (t: number) => `${Math.floor(t)}년 ${Math.min(12, Math.max(1, Math.round((t - Math.floor(t)) * 12) || 1))}월`

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">목표 PER로 사려면 주가가 얼마여야 하나 — 지금과 앞으로</h4>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">가격 = PER × 주당이익. 이익이 자라면 같은 PER의 가격도 해마다 올라간다. 주가가 아래 값 밑으로 오면 &ldquo;그 PER 이하로 살 수 있다&rdquo;는 뜻.</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {marks.map(m => (
          <button key={m.pe} onClick={() => { setPe(m.pe); setCustom('') }}
            className={`text-xs px-2 py-1 rounded border transition-colors ${pe === m.pe && !custom ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {m.pe}배 <span className="opacity-75">{m.label}</span>
          </button>
        ))}
        <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          직접
          <input type="number" min={5} max={80} step={1} value={custom} placeholder="배"
            onChange={e => { setCustom(e.target.value); const v = Number(e.target.value); if (v >= 5 && v <= 80) setPe(v) }}
            className="w-14 rounded border border-gray-300 dark:border-gray-700 bg-transparent px-1.5 py-0.5 text-xs" />
        </label>
      </div>
      {!custom && <p className="text-[11px] text-gray-500 dark:text-gray-400">{marks.find(m => m.pe === pe)?.note}</p>}

      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead><tr>
            <th className={`${th} text-left`}>시점</th>
            <th className={`${th} text-right`}>주당이익 (기본 연 {g.toFixed(1)}%)</th>
            <th className={`${th} text-right`}>{pe}배 가격</th>
            <th className={`${th} text-right`}>범위 (이익 연 {lo.toFixed(1)}~{hi.toFixed(1)}%)</th>
            <th className={`${th} text-right`}>지금 주가와 차이</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => {
              const e = epsAt(r.t, g), tp = pe * e
              const ok = price <= tp
              return (
                <tr key={r.k} className={ok ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}>
                  <td className={`${td} break-keep`}>{r.k}<span className="block text-[10px] text-gray-400">{r.sub}</span></td>
                  <td className={`${td} text-right`}>€{e.toFixed(1)}</td>
                  <td className={`${td} text-right font-semibold`}>{fmt(tp)}</td>
                  <td className={`${td} text-right text-gray-500 dark:text-gray-400`}>{r.t === epsEnd ? '—' : `${fmt(pe * epsAt(r.t, lo))}~${fmt(pe * epsAt(r.t, hi))}`}</td>
                  <td className={`${td} text-right ${ok ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-500'}`}>{ok ? '이미 그 아래' : `주가 ${sgn((tp / price - 1) * 100)}`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className={`${p} list-disc pl-4 space-y-1`}>
        <li>지금 주가 <b>{fmt(price)}</b>({priceDate}) = PER <b>{peNow.toFixed(1)}배</b>. {pe}배가 되려면 지금 이익 기준으로 <b>{fmt(pe * eps)}</b>, 주가가 {sgn((pe * eps / price - 1) * 100)} 움직여야 한다.</li>
        <li>
          {ry === 'now' ? <>지금 주가가 이미 {pe}배 이하다.</>
            : ry ? <>주가가 지금 그대로 머물고 이익만 기본 속도로 자라면 <b>{ryLabel(ry)}쯤</b> PER이 {pe}배까지 내려온다(주가가 오르면 더 늦어진다).</>
              : <>이익이 자라지 않으면 주가가 내려와야만 {pe}배가 된다.</>}
        </li>
        <li>표의 초록 줄 = 지금 주가로 이미 그 PER 이하인 시점. 예상 주당이익은 추정이다 — 실적 발표마다 최근 1년 값이 바뀌면(자동 갱신) 표도 따라 바뀐다.</li>
      </ul>

      <div className="rounded bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/70 dark:border-amber-800/50 p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mr-1">내 목표가 — 그 가격이면 PER 몇 배? 언제 오면 얼마나 싼가?</p>
          {mine.map((v, i) => (
            <span key={i} className="inline-flex items-center gap-0.5">
              <span className="text-xs text-gray-500">€</span>
              <input type="number" min={1} step={10} value={v} onChange={e => saveMine(mine.map((x, j) => (j === i ? e.target.value : x)))}
                className="w-20 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-0.5 text-xs tabular-nums" />
              <button onClick={() => saveMine(mine.filter((_, j) => j !== i))} className="text-xs text-gray-400 hover:text-red-500 px-0.5" aria-label="지우기">×</button>
            </span>
          ))}
          {mine.length < 5 && <button onClick={() => saveMine([...mine, String(Math.round(price * 0.8 / 10) * 10)])} className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">+ 추가</button>}
          {storeKey && <span className="text-[10px] text-gray-400">이 브라우저에 저장됨</span>}
        </div>
        {mine.map(Number).filter(v => v > 0).length > 0 && (
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead><tr>
                <th className={`${th} text-left`}>목표가</th>
                <th className={`${th} text-right`}>지금 주가 대비</th>
                {rows.map(r => <th key={r.k} className={`${th} text-right`}>{r.k}에 오면</th>)}
                {payout != null && <th className={`${th} text-right`}>지금 사면 10년 연평균<br /><span className="font-normal">(10년 뒤 25·30·35배)</span></th>}
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {mine.map(Number).filter(v => v > 0).sort((a, b) => b - a).map((v, i) => {
                  const e0 = v / eps
                  const ret = (x: number) => ((1 + g / 100) * Math.pow(x / e0, 0.1) - 1 + (payout ?? 0) / e0) * 100
                  return (
                    <tr key={`${v}-${i}`}>
                      <td className={`${td} font-semibold`}>{fmt(v)}</td>
                      <td className={`${td} text-right`}>{v >= price ? '이미 그 아래' : `주가 ${sgn((v / price - 1) * 100)}`}</td>
                      {rows.map(r => {
                        const x = v / epsAt(r.t, g)
                        const c = x <= 20 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : x <= 25 ? 'text-emerald-600 dark:text-emerald-400' : x <= 30 ? '' : 'text-gray-400'
                        return <td key={r.k} className={`${td} text-right ${c}`}>{x.toFixed(1)}배</td>
                      })}
                      {payout != null && <td className={`${td} text-right`}>연 {ret(25).toFixed(1)} · {ret(30).toFixed(1)} · {ret(35).toFixed(1)}%</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1">같은 가격이라도 늦게 올수록 이익이 자라 PER이 더 낮다. 초록 굵게 = 20배 이하(멍거 기준), 초록 = 25배 이하(역사적 바닥 수준), 회색 = 30배 넘음. 이익은 연 {g.toFixed(1)}% 성장 가정(추정).</p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 pb-1">한눈에 — PER별 가격 (기본 성장률)</p>
        <table className="text-xs">
          <thead><tr>
            <th className={`${th} text-left`}>PER</th>
            {rows.map(r => <th key={r.k} className={`${th} text-right`}>{r.k}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {matrixPes.map(x => (
              <tr key={x} className={x === pe ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                <td className={`${td} break-keep`}>{x}배 <span className="text-[10px] text-gray-400">{marks.find(m => m.pe === x)?.label}</span></td>
                {rows.map(r => {
                  const tp = x * epsAt(r.t, g)
                  return <td key={r.k} className={`${td} text-right ${price <= tp ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>{fmt(tp)}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payout != null && (() => {
        const entries = Array.from(new Set([...matrixPes, Math.round(peNow)])).sort((a, b) => a - b)
        const ret = (e: number, x: number) => ((1 + g / 100) * Math.pow(x / e, 0.1) - 1 + payout / e) * 100
        return (
          <div className="overflow-x-auto">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 pb-1">그 PER에 사면 10년 동안 연 몇 %? (살 때 PER × 10년 뒤 PER)</p>
            <table className="text-xs">
              <thead><tr>
                <th className={`${th} text-left`}>살 때 PER (지금 이익 기준 가격)</th>
                {matrixPes.map(x => <th key={x} className={`${th} text-right`}>10년 뒤 {x}배</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {entries.map(e => (
                  <tr key={e} className={e === pe ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                    <td className={`${td} break-keep`}>{e}배 ({fmt(e * eps)}){e === Math.round(peNow) && <span className="text-[10px] text-gray-400"> 지금</span>}</td>
                    {matrixPes.map(x => {
                      const r = ret(e, x)
                      return <td key={x} className={`${td} text-right ${r >= 15 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : r < 8 ? 'text-red-500' : ''}`}>연 {r.toFixed(1)}%</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-1">이익 연 {g.toFixed(1)}% 성장(위 기본 성장률), 배당은 이익의 약 {Math.round(payout * 100)}%를 준다고 가정한 대략 계산(배당 포함). 초록 = 연 15% 이상, 빨강 = 연 8% 미만. 추정이며 보장이 아니다.</p>
          </div>
        )
      })()}
    </div>
  )
}
