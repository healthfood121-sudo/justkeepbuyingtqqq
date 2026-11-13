'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MOAT } from './moat'

// 횡보장 공부방 7-3 — 자기 역사 바닥 + 해자 종목 카드, 딱지별 과거 검증, 필터

export type Ep = { y: number; prior: number; next: number; sp: number | null }
export type BoardRow = { k: string; nm: string; h: string; pos: number; prior: number; pe: number | null; peMed: number | null; epsVsPeak: number | null; div: number | null; eps: Ep[] }
type T = 'temp' | 'mixed' | 'risk'

const TAG = {
  temp: { label: '일시적', cls: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300' },
  mixed: { label: '섞임', cls: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300' },
  risk: { label: '구조적 위험', cls: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' },
} as const
const TORD = { temp: 0, mixed: 1, risk: 2 } as const
const pct = (v: number | null | undefined) => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null }
const small = 'text-xs leading-relaxed text-gray-500 dark:text-gray-400'

const warnOf = (r: BoardRow) => ({ broken: r.epsVsPeak != null && r.epsVsPeak < 75, pricey: r.pe != null && r.peMed != null && r.pe > r.peMed })
const beat = (e: Ep) => e.sp != null && e.next > e.sp
const excess = (r: BoardRow) => { const x = r.eps.filter(e => e.sp != null).map(e => e.next - e.sp!); return x.length ? med(x)! : null }
const peDisc = (r: BoardRow) => r.pe != null && r.peMed != null && r.peMed > 0 ? 1 - r.pe / r.peMed : null

// 연속된 매수 해를 한 구간으로: 2002·2003·2005~2011 → "2002~2003, 2005~2011"
function ranges(ys: number[]) {
  const out: string[] = []
  for (let i = 0; i < ys.length;) {
    let j = i; while (j + 1 < ys.length && ys[j + 1] - ys[j] <= 2) j++
    out.push(i === j ? `${ys[i]}` : `${ys[i]}~${ys[j]}`); i = j + 1
  }
  return out.join(', ')
}

function History({ eps }: { eps: Ep[] }) {
  if (!eps.length) return <p className="text-[11px] text-gray-400">과거 검증: 같은 기준의 바닥이 과거엔 없었거나 역사가 짧아 확인할 수 없다 — 이번이 처음인 바닥.</p>
  const w = eps.filter(beat).length, loss = eps.filter(e => e.next < 0).length
  return (
    <details className="text-[11px] text-gray-600 dark:text-gray-300">
      <summary className="cursor-pointer">
        <b className="text-gray-900 dark:text-white">과거 바닥</b> {ranges(eps.map(e => e.y))}년 매수({eps.length}번) → 다음 10년 중간 <b>{pct(med(eps.map(e => e.next)))}</b>
        <span className="text-gray-400"> (같은 기간 S&amp;P500 {pct(med(eps.filter(e => e.sp != null).map(e => e.sp!)))})</span> · S&amp;P를 이긴 해 {w}/{eps.length}{loss ? ` · 손실 ${loss}번` : ''}
      </summary>
      <div className="mt-1 flex flex-wrap gap-1">
        {eps.map(e => (
          <span key={e.y} className={`tabular-nums px-1.5 py-0.5 rounded ${beat(e) ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
            {e.y}: {pct(e.prior)}→{pct(e.next)} <span className="text-gray-400">(S&amp;P {pct(e.sp)})</span>
          </span>
        ))}
      </div>
      <p className="text-gray-400 mt-1">괄호 앞 = 직전 10년 → 다음 10년 연평균 수익률. 초록 = S&amp;P500보다 나았던 해.</p>
    </details>
  )
}

function Card({ r }: { r: BoardRow }) {
  const m = MOAT[r.k]!
  const { broken, pricey } = warnOf(r)
  return (
    <div id={`m-${r.k}`} className="scroll-mt-20 rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0">
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded mr-1.5 whitespace-nowrap ${TAG[m.t].cls}`}>{TAG[m.t].label}</span>
          <Link href={r.h} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">{r.nm} <span className="text-xs font-normal text-gray-400">{r.k}</span></Link>
          {m.g === 'some' && <span className="ml-1 text-[10px] text-gray-400">해자 있음</span>}
        </span>
        <span className="text-xs tabular-nums px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 whitespace-nowrap">자기 역사 하위 {r.pos}%</span>
      </div>
      <p className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
        지난 약 10년 연 {pct(r.prior)}
        {r.pe != null && r.peMed != null && <> · PER {r.pe.toFixed(1)} <span className="text-gray-400">(10년 중간 {r.peMed.toFixed(1)})</span></>}
        {r.epsVsPeak != null && <> · 이익 10년 고점의 {r.epsVsPeak}%</>}
        {r.div != null && r.div > 0 && <> · 배당 {r.div.toFixed(1)}%</>}
      </p>
      <p className="text-xs text-gray-700 dark:text-gray-200"><b className="text-gray-900 dark:text-white">해자</b> {m.moat}</p>
      <p className="text-xs text-gray-600 dark:text-gray-300"><b className="text-amber-700 dark:text-amber-400">싼 이유</b> {m.worry}</p>
      <p className="text-xs text-gray-600 dark:text-gray-300"><b className="text-gray-900 dark:text-white">{TAG[m.t].label}로 본 이유</b> {m.tw}</p>
      <History eps={r.eps} />
      {(broken || pricey) && (
        <p className="text-[11px] text-red-600 dark:text-red-400">
          {broken && '⚠ 이익이 고점보다 많이 줄었다 — 회사가 망가져서 바닥일 수 있다. '}
          {pricey && '⚠ PER은 자기 10년 중간보다 아직 비싸다.'}
        </p>
      )}
    </div>
  )
}

// 딱지별 과거 검증 요약 — 그 딱지 종목들이 과거 같은 기준의 바닥에서 산 모든 경우
function Verify({ rows }: { rows: BoardRow[] }) {
  const th = 'py-1.5 px-1.5 font-medium text-gray-400 dark:text-gray-500 text-right whitespace-nowrap'
  const td = 'py-1.5 px-1.5 tabular-nums text-right text-gray-700 dark:text-gray-200'
  const stat = (t: T) => {
    const g = rows.filter(r => MOAT[r.k]!.t === t), withH = g.filter(r => r.eps.length)
    const e = withH.flatMap(r => r.eps), es = e.filter(x => x.sp != null)
    // 종목마다 한 표(여러 해가 겹치는 바닥이 한 종목에 몰려 결과를 끌고 가지 않게): 종목별 중간 초과수익이 플러스인 종목 수
    const stockWin = withH.filter(r => (excess(r) ?? -1) > 0).length
    return { n: g.length, h: withH.length, c: e.length, pos: e.filter(x => x.next > 0).length, w: es.filter(beat).length, cs: es.length, m: med(e.map(x => x.next)), sp: med(es.map(x => x.sp!)), stockWin }
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead><tr className="border-b border-gray-200 dark:border-gray-800">
          <th className={`${th} text-left`}>딱지</th><th className={th}>기록 종목</th><th className={th}>바닥 해</th><th className={th}>다음 10년</th><th className={th}>S&amp;P</th><th className={th}>이긴 해</th><th className={th}>이긴 종목</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {(['temp', 'mixed', 'risk'] as const).map(t => {
            const s = stat(t)
            return (
              <tr key={t}>
                <td className={`${td} text-left`}><span className={`font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${TAG[t].cls}`}>{TAG[t].label}</span></td>
                <td className={td}>{s.h}/{s.n}</td>
                <td className={td}>{s.c}번<div className="text-[10px] text-gray-400">손실 {s.c - s.pos}</div></td>
                <td className={`${td} font-semibold`}>{pct(s.m)}</td>
                <td className={td}>{pct(s.sp)}</td>
                <td className={td}>{s.w}/{s.cs}</td>
                <td className={td}>{s.stockWin}/{s.h}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const chip = (on: boolean) => `px-2.5 py-1 rounded-full text-xs whitespace-nowrap ${on ? 'bg-blue-600 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`
type Sort = 'tag' | 'pos' | 'pe' | 'hist'
type Hist = 'all' | 'won' | 'none'

export default function MoatBoard({ rows }: { rows: BoardRow[] }) {
  const [tags, setTags] = useState<Record<T, boolean>>({ temp: true, mixed: true, risk: true })
  const [moat, setMoat] = useState<'all' | 'deep' | 'some'>('all')
  const [hist, setHist] = useState<Hist>('all')
  const [noWarn, setNoWarn] = useState(false)
  const [sort, setSort] = useState<Sort>('tag')

  const list = useMemo(() => {
    const f = rows.filter(r => {
      const m = MOAT[r.k]!
      if (!tags[m.t]) return false
      if (moat !== 'all' && m.g !== moat) return false
      if (hist === 'won' && !((excess(r) ?? -1) > 0)) return false
      if (hist === 'none' && r.eps.length) return false
      if (noWarn) { const w = warnOf(r); if (w.broken || w.pricey) return false }
      return true
    })
    const key: Record<Sort, (r: BoardRow) => number> = {
      tag: r => TORD[MOAT[r.k]!.t] * 1000 + (MOAT[r.k]!.g === 'deep' ? 0 : 500) + r.pos,
      pos: r => r.pos,
      pe: r => -(peDisc(r) ?? -9),
      hist: r => -(excess(r) ?? -99),
    }
    return [...f].sort((a, b) => key[sort](a) - key[sort](b))
  }, [rows, tags, moat, hist, noWarn, sort])

  const reset = () => { setTags({ temp: true, mixed: true, risk: true }); setMoat('all'); setHist('all'); setNoWarn(false); setSort('tag') }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">과거 검증 — 이 종목들이 예전에도 같은 기준의 바닥(자기 역사 하위 15% 이하)에 있었을 때, 그 뒤 10년은? <span className="font-normal text-gray-500">(다음 10년·S&amp;P = 연평균 수익률 중간값)</span></p>
        <Verify rows={rows} />
        <p className={small}>
          매수 해마다 그때까지의 자기 10년 수익률만으로 바닥인지 판정했다(7-2와 같은 방법). &lsquo;S&amp;P 이긴 해&rsquo; = 바닥에서 산 해 중 다음 10년이 같은 기간 S&amp;P500(배당 포함)보다 나았던 해.
          바닥은 몇 년씩 이어지므로 한 종목이 여러 해를 차지한다 — 그래서 &lsquo;이긴 종목&rsquo;(종목마다 한 번만 센 것)도 같이 본다. 바닥 기록이 없는 종목은 역사가 짧거나 이번이 처음인 바닥이다.
        </p>
        <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
          <b>읽는 법:</b> &lsquo;일시적&rsquo; 종목들은 과거 바닥에서도 회복했다 — 손실 없이, 대부분 S&amp;P500보다 나았다. 다만 <b>&lsquo;섞임&rsquo;·&lsquo;구조적 위험&rsquo; 종목들도 과거 바닥에서는 똑같이 회복했다.</b>
          즉 과거 데이터는 &lsquo;해자 깊은 회사의 바닥은 대체로 회복했다&rsquo;는 걸 보여 줄 뿐, 딱지가 맞는지는 가려 주지 못한다. 이번 걱정(AI·비만치료제·음주 감소)은 과거 바닥 때와 원인이 다르기 때문이다.
          그리고 지금 남아 있는 회사만 있어(사라진 회사 제외) 실제보다 좋아 보인다.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-14">딱지</span>
          {(['temp', 'mixed', 'risk'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTags(s => ({ ...s, [t]: !s[t] }))}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tags[t] ? TAG[t].cls : 'bg-gray-100 dark:bg-gray-800 text-gray-400 line-through'}`}>
              {TAG[t].label} {rows.filter(r => MOAT[r.k]!.t === t).length}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-14">해자</span>
          {([['all', '전체'], ['deep', '깊음'], ['some', '있음']] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setMoat(v)} className={chip(moat === v)}>{l}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-14">과거</span>
          {([['all', '전체'], ['won', '바닥 뒤 S&P를 이긴 기록'], ['none', '이번이 처음인 바닥']] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setHist(v)} className={chip(hist === v)}>{l}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500 w-14">정렬</span>
          {([['tag', '딱지순'], ['pos', '자기 역사 바닥 순'], ['pe', 'PER 할인 큰 순'], ['hist', '과거 바닥 뒤 성적 순']] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setSort(v)} className={chip(sort === v)}>{l}</button>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={noWarn} onChange={e => setNoWarn(e.target.checked)} /> 경고(이익 급감·PER 아직 비쌈) 있는 종목 빼기
          </label>
          <span className="text-xs text-gray-500">{list.length}/{rows.length}개 <button type="button" onClick={reset} className="ml-2 text-blue-600 dark:text-blue-400 hover:underline">초기화</button></span>
        </div>
      </div>

      {list.length ? <div className="grid sm:grid-cols-2 gap-2">{list.map(r => <Card key={r.k} r={r} />)}</div> : <p className={small}>조건에 맞는 종목이 없다.</p>}
    </div>
  )
}
