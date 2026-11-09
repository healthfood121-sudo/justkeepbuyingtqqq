'use client'

import { useState } from 'react'

// 심층 리포트(아마존·알파벳·마이크로소프트·에르메스 공용) — 종목 분석 화면 안에 함께 보여 준다.
export type Light = 'g' | 'y' | 'r'
export type Sc = 'bad' | 'base' | 'good'
// 사업부별로 매출·이익률을 쌓아 10년 뒤 주당이익을 계산하는 미래 모델
export type Model = {
  cur: string                         // 통화 이름 (달러·유로)
  price: number; eps: number          // 지금 주가, 출발 주당이익(본업)
  sh: number; shc: number             // 주식 수(억 주), 연 변화율 %(자사주 매입은 −)
  tax: number; div: number            // 세율 %, 배당수익률 %
  pe: Record<Sc, number>              // 10년 뒤 PER
  other: { name: string; now: number; g: number; why: string }  // 사업부 밖 비용·수익(억), 연 증가율
  segs: { name: string; rev: number; m0: number; g: Record<Sc, [number, number]>; mEnd: Record<Sc, number>; why: string }[]
  scen: Record<Sc, Odds>
  note: string
}
// 미래 시나리오: 그 세계가 어떤 모습인지, 가능성(%), 확률을 바꿀 신호
export type Odds = { name: string; story: string; p: number; world: string[]; signs: string[]; ret?: number; eps?: string }
export function runModel(m: Model, sc: Sc, Y: number) {
  let oi = 0
  const segs = m.segs.map(s => {
    let r = s.rev
    for (let y = 1; y <= Y; y++) r *= 1 + (y <= 5 ? s.g[sc][0] : s.g[sc][1]) / 100
    const mg = s.m0 + (s.mEnd[sc] - s.m0) * Y / 10
    oi += r * mg / 100
    return { name: s.name, rev: r, mg, oi: r * mg / 100 }
  })
  const oth = m.other.now * Math.pow(1 + m.other.g / 100, Y)
  const net = (oi + oth) * (1 - m.tax / 100)
  const eps = net / (m.sh * Math.pow(1 + m.shc / 100, Y))
  return { segs, oi, oth, eps }
}
export function modelResult(m: Model, sc: Sc) {
  const e5 = runModel(m, sc, 5).eps, e10 = runModel(m, sc, 10).eps
  const cagr = (Math.pow(e10 / m.eps, 0.1) - 1) * 100
  const ret = (Math.pow(e10 * m.pe[sc] / m.price, 0.1) - 1) * 100 + m.div
  return { e5, e10, cagr, ret }
}
export type BigReportData = {
  key: string
  asOf: string
  title: string
  intro: string
  conclusion: string[]
  epsFix?: { note: string; rows: { k: string; v: string }[]; per: string }
  plan: { q: string; now: string; l: Light }[]
  units?: { name: string; share: string; growth: string; role: string; view: string }[]
  history: { years: string; kind: 'start' | 'crisis' | 'win' | 'now'; title: string; story: string[]; lesson: string }[]
  ai?: { opp: string[]; threat: string[]; verdict: string }
  worries?: { w: string; fact: string; l: Light }[]
  calls: { q: string; date: string; url?: string; head: string; nums: string[]; said?: string; note: string }[]
  hermes?: { k: string; it: string; rms: string }[]
  hermesVerdict?: string
  numbers?: { title: string; cols: string[]; rows: string[][]; note: string }
  peers?: { title: string; cols: string[]; rows: { k: string; v: string[] }[]; verdict: string }
  callsTitle?: string
  extra?: { id: string; toc: string; title: string; intro?: string; parts: { h?: string; p?: string[]; list?: string[]; table?: { cols: string[]; rows: string[][] } }[] }[]
  callsNote?: string
  scen?: { name: string; l: Light; story: string; eps: string; pe: string; ret: string }[]
  scenNote: string
  model?: Model
  odds?: { items: (Odds & { sc: Sc; ret: number })[]; why: string }
  oddsWhy?: string
  warn: { k: string; ok: string; bad: string }[]
  final: string[]
}

const LIGHT: Record<Light, { dot: string; txt: string }> = {
  g: { dot: 'bg-emerald-500', txt: '좋음' }, y: { dot: 'bg-amber-400', txt: '지켜볼 것' }, r: { dot: 'bg-red-500', txt: '약점' },
}
const CH: Record<string, string> = { start: 'bg-gray-400', crisis: 'bg-red-500', win: 'bg-emerald-500', now: 'bg-blue-500' }
const CHL: Record<string, string> = { start: '시작', crisis: '난관', win: '돌파', now: '지금' }
const B = ({ t }: { t: string }) => <>{t.split(/\*\*(.+?)\*\*/g).map((x, i) => i % 2 ? <b key={i}>{x}</b> : x)}</>
const Dot = ({ l }: { l: Light }) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${LIGHT[l].dot} shrink-0 mt-1`} title={LIGHT[l].txt} />
const sec = 'space-y-2 scroll-mt-20'
const h2 = 'text-base font-semibold text-gray-900 dark:text-white'
const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
const th = 'text-left py-1.5 px-2 font-medium'
const td = 'py-1.5 px-2'

export default function BigReport({ d }: { d: BigReportData }) {
  const [openQ, setOpenQ] = useState<string | null>(d.calls[0]?.q ?? null)
  const [allCalls, setAllCalls] = useState(false)
  const id = (s: string) => `${d.key.toLowerCase()}-${s}`
  const toc = ([['fix', 'PER 바로잡기', !!d.epsFix], ['plan', '분석 질문', true], ['units', '사업부', !!d.units], ['model', '미래 이익 모델', !!d.model], ['history', '역사·위기', true], ['nums', '연도별 숫자', !!d.numbers], ['peers', '경쟁사와 비교', !!d.peers], ...(d.extra ?? []).map(x => [x.id, x.toc, true]), ['ai', 'AI', !!d.ai], ['worry', '걱정 vs 숫자', !!d.worries], ['calls', d.callsTitle ? '실적 발표' : '최근 콜', true], ['rms', '에르메스와 비교', !!d.hermes], ['scen', '미래 시나리오·가능성', !!(d.scen || d.model || d.odds)], ['warn', '경고 신호', true]] as [string, string, boolean][]).filter(t => t[2])
  let n = 0
  const N = () => `${++n}. `
  return (
    <div id={`${d.key.toLowerCase()}-report`} className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 scroll-mt-20">
      <article className="px-3 sm:px-5 py-6 space-y-9">
        <header className="space-y-2">
          <p className="text-xs text-gray-400">심층 리포트 · {d.asOf} 기준</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{d.title}</h2>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200"><B t={d.intro} /></p>
          <nav className="flex flex-wrap gap-1.5 text-xs pt-1">
            {toc.map(([h, t]) => <a key={h} href={`#${id(h)}`} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">{t}</a>)}
          </nav>
        </header>

        <section className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-2">
          <h3 className={h2}>결론 먼저</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{d.conclusion.map((t, i) => <li key={i}><B t={t} /></li>)}</ul>
        </section>

        {d.epsFix && <section id={id('fix')} className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2 scroll-mt-20">
          <h3 className={h2}>먼저 바로잡기 — 이 회사의 진짜 PER</h3>
          <p className={small}><B t={d.epsFix.note} /></p>
          <div className="overflow-x-auto"><table className="w-full text-xs"><tbody className="text-gray-700 dark:text-gray-200">
            {d.epsFix.rows.map(r => <tr key={r.k} className="border-b border-amber-100 dark:border-amber-900/40"><td className={`${td} font-medium`}>{r.k}</td><td className={td}><B t={r.v} /></td></tr>)}
          </tbody></table></div>
          <p className="text-sm text-gray-800 dark:text-gray-100"><B t={d.epsFix.per} /></p>
        </section>}

        <section id={id('plan')} className={sec}>
          <h3 className={h2}>{N()}이 회사를 판단할 질문들</h3>
          <div className="space-y-1.5">
            {d.plan.map(x => (
              <div key={x.q} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex gap-2"><Dot l={x.l} /><p className="text-sm font-semibold text-gray-900 dark:text-white">{x.q} <span className="text-[11px] font-normal text-gray-400">{LIGHT[x.l].txt}</span></p></div>
                <p className={`${small} mt-0.5`}><B t={x.now} /></p>
              </div>
            ))}
          </div>
        </section>

        {d.units && <section id={id('units')} className={sec}>
          <h3 className={h2}>{N()}돈을 버는 곳 — 사업부 한눈에</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className={th}>사업</th><th className={th}>비중</th><th className={th}>성장</th><th className={th}>회사 안의 역할</th><th className={th}>판단</th></tr></thead>
            <tbody className="text-gray-700 dark:text-gray-200">{d.units.map(u => <tr key={u.name} className="border-b border-gray-100 dark:border-gray-900 align-top"><td className={`${td} font-medium whitespace-nowrap`}>{u.name}</td><td className={`${td} whitespace-nowrap`}>{u.share}</td><td className={`${td} whitespace-nowrap`}>{u.growth}</td><td className={td}>{u.role}</td><td className={td}><B t={u.view} /></td></tr>)}</tbody>
          </table></div>
          <p className="text-[11px] text-gray-400">분기별 자세한 숫자는 위 &ldquo;사업부·지역별 매출&rdquo;과 사업부 심층 분석에 있다.</p>
        </section>}

        {d.model && <ModelSection m={d.model} sid={id('model')} title={`${N()}미래 이익 모델 — 사업부별로 10년 뒤를 쌓아 보기`} />}

        <section id={id('history')} className={sec}>
          <h3 className={h2}>{N()}역사 — 위기를 어떻게 넘었나</h3>
          <div className="space-y-2.5">
            {d.history.map(c => (
              <div key={c.years} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${CH[c.kind]}`} />
                  <span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400">{c.years}</span>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{c.title}</h4>
                  <span className="text-[10px] text-gray-400">{CHL[c.kind]}</span>
                </div>
                {c.story.map((t, i) => <p key={i} className={small}><B t={t} /></p>)}
                <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300"><b>교훈:</b> {c.lesson}</p>
              </div>
            ))}
          </div>
        </section>

        {d.numbers && <section id={id('nums')} className={sec}>
          <h3 className={h2}>{N()}{d.numbers.title}</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800">{d.numbers.cols.map(c => <th key={c} className={`${th} whitespace-nowrap`}>{c}</th>)}</tr></thead>
            <tbody className="text-gray-700 dark:text-gray-200">{d.numbers.rows.map(r => <tr key={r[0]} className="border-b border-gray-100 dark:border-gray-900 align-top">{r.map((v, i) => <td key={i} className={`${td} ${i < r.length - 1 ? 'whitespace-nowrap tabular-nums' : ''} ${i === 0 ? 'font-medium' : ''}`}><B t={v} /></td>)}</tr>)}</tbody>
          </table></div>
          <p className="text-[11px] text-gray-400"><B t={d.numbers.note} /></p>
        </section>}

        {d.peers && <section id={id('peers')} className={sec}>
          <h3 className={h2}>{N()}{d.peers.title}</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className={th}></th>{d.peers.cols.map(c => <th key={c} className={th}>{c}</th>)}</tr></thead>
            <tbody className="text-gray-700 dark:text-gray-200">{d.peers.rows.map(r => <tr key={r.k} className="border-b border-gray-100 dark:border-gray-900 align-top"><td className={`${td} font-medium whitespace-nowrap`}>{r.k}</td>{r.v.map((v, i) => <td key={i} className={td}><B t={v} /></td>)}</tr>)}</tbody>
          </table></div>
          <p className={small}><B t={d.peers.verdict} /></p>
        </section>}

        {(d.extra ?? []).map(x => (
          <section key={x.id} id={id(x.id)} className={sec}>
            <h3 className={h2}>{N()}{x.title}</h3>
            {x.intro && <p className={small}><B t={x.intro} /></p>}
            {x.parts.map((pt, i) => (
              <div key={i} className="space-y-1.5 pt-1">
                {pt.h && <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{pt.h}</h4>}
                {pt.p?.map((t, j) => <p key={j} className={small}><B t={t} /></p>)}
                {pt.list && <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">{pt.list.map((t, j) => <li key={j}><B t={t} /></li>)}</ul>}
                {pt.table && <div className="overflow-x-auto"><table className="w-full text-xs">
                  <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800">{pt.table.cols.map(c => <th key={c} className={`${th} whitespace-nowrap`}>{c}</th>)}</tr></thead>
                  <tbody className="text-gray-700 dark:text-gray-200">{pt.table.rows.map((r, k) => <tr key={k} className="border-b border-gray-100 dark:border-gray-900 align-top">{r.map((v, m) => <td key={m} className={`${td} ${m === 0 ? 'font-medium whitespace-nowrap' : ''}`}><B t={v} /></td>)}</tr>)}</tbody>
                </table></div>}
              </div>
            ))}
          </section>
        ))}

        {d.ai && <section id={id('ai')} className={sec}>
          <h3 className={h2}>{N()}AI — 기회인가 위협인가</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3"><p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">기회</p><ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">{d.ai.opp.map((t, i) => <li key={i}><B t={t} /></li>)}</ul></div>
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 p-3"><p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">위협·부담</p><ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">{d.ai.threat.map((t, i) => <li key={i}><B t={t} /></li>)}</ul></div>
          </div>
          <p className={small}><B t={d.ai.verdict} /></p>
        </section>}

        {d.worries && <section id={id('worry')} className={sec}>
          <h3 className={h2}>{N()}시장의 걱정 vs 숫자가 말하는 것</h3>
          <div className="space-y-1.5">
            {d.worries.map(x => (
              <div key={x.w} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <div className="flex gap-2"><Dot l={x.l} /><p className="text-xs font-semibold text-gray-900 dark:text-white">걱정: {x.w}</p></div>
                <p className={`${small} mt-0.5`}><b>숫자:</b> <B t={x.fact} /></p>
              </div>
            ))}
          </div>
        </section>}

        <section id={id('calls')} className={sec}>
          <h3 className={h2}>{N()}{d.callsTitle ?? `최근 컨퍼런스콜 (${d.calls.length}개 분기)`}</h3>
          <p className={small}>{d.callsNote ?? '녹취록 전문을 읽고 요약했다. 제목을 누르면 펼쳐진다.'}</p>
          <div className="space-y-1.5">
            {(allCalls ? d.calls : d.calls.slice(0, 8)).map(c => {
              const on = openQ === c.q
              return (
                <div key={c.q} className={`rounded-lg border ${on ? 'border-blue-400 dark:border-blue-700' : 'border-gray-200 dark:border-gray-800'}`}>
                  <button onClick={() => setOpenQ(on ? null : c.q)} className="w-full text-left px-3 py-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.q}</span>
                    <span className="text-[11px] text-gray-400 tabular-nums">{c.date}</span>
                    <span className="basis-full text-xs text-gray-700 dark:text-gray-200">{c.head}</span>
                  </button>
                  {on && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs leading-relaxed">
                      <ul className="list-disc pl-4 space-y-0.5 text-gray-700 dark:text-gray-200">{c.nums.map(n => <li key={n}><B t={n} /></li>)}</ul>
                      {c.said && <p className="italic text-purple-700 dark:text-purple-300 border-l-2 border-purple-300 dark:border-purple-700 pl-2">{c.said}</p>}
                      <p className="text-emerald-800 dark:text-emerald-300"><b>의미:</b> {c.note}</p>
                      {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-[11px] text-gray-400 hover:underline">원문 보기 →</a>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {d.calls.length > 8 && <button onClick={() => setAllCalls(!allCalls)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">{allCalls ? '최근 8개만 보기' : `나머지 ${d.calls.length - 8}개 더 보기 ↓`}</button>}
        </section>

        {d.hermes && <section id={id('rms')} className={sec}>
          <h3 className={h2}>{N()}에르메스와 비교하면</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className={th}></th><th className={th}>이 회사</th><th className={th}>에르메스</th></tr></thead>
            <tbody className="text-gray-700 dark:text-gray-200">{d.hermes.map(r => <tr key={r.k} className="border-b border-gray-100 dark:border-gray-900 align-top"><td className={`${td} font-medium whitespace-nowrap`}>{r.k}</td><td className={td}><B t={r.it} /></td><td className={td}>{r.rms}</td></tr>)}</tbody>
          </table></div>
          <p className={small}><B t={d.hermesVerdict ?? ''} /></p>
        </section>}

        {(d.scen || d.model || d.odds) && <section id={id('scen')} className={sec}>
          <h3 className={h2}>{N()}{d.model || d.odds ? '미래 시나리오와 가능성 — 10년 뒤 어떤 세계일까' : '10년 시나리오(추정)'}</h3>
          {(d.model || d.odds) ? <OddsBlock items={d.model ? (['good', 'base', 'bad'] as Sc[]).map(sc => { const r = modelResult(d.model!, sc); return { ...d.model!.scen[sc], sc, ret: r.ret, eps: `주당이익 연 ${r.cagr.toFixed(1)}% → 10년 뒤 약 ${r.e10.toFixed(0)}${d.model!.cur}, PER ${d.model!.pe[sc]}배` } }) : d.odds!.items} why={d.oddsWhy ?? d.odds?.why ?? ''} /> : (
          <div className="grid sm:grid-cols-3 gap-2">
            {d.scen!.map(s => (
              <div key={s.name} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
                <div className="flex gap-2"><Dot l={s.l} /><p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p></div>
                <p className={small}>{s.story}</p>
                <p className="text-xs text-gray-800 dark:text-gray-100"><b>{s.eps}</b>, {s.pe}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.ret}</p>
              </div>
            ))}
          </div>)}
          <p className={small}><B t={d.scenNote} /></p>
        </section>}

        <section id={id('warn')} className={sec}>
          <h3 className={h2}>{N()}분기마다 확인할 신호</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className={th}>숫자</th><th className={th}>괜찮은 범위</th><th className={th}>경고</th></tr></thead>
            <tbody className="text-gray-700 dark:text-gray-200">{d.warn.map(w => <tr key={w.k} className="border-b border-gray-100 dark:border-gray-900"><td className={`${td} font-medium`}>{w.k}</td><td className={`${td} text-emerald-700 dark:text-emerald-400`}>{w.ok}</td><td className={`${td} text-red-600 dark:text-red-400`}>{w.bad}</td></tr>)}</tbody>
          </table></div>
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
          <h3 className={h2}>{N()}정리 — 어떻게 들고 갈까</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-gray-700 dark:text-gray-200">{d.final.map((t, i) => <li key={i}><B t={t} /></li>)}</ul>
          <p className="text-[11px] text-gray-400">매수·매도 추천이 아니다. 시나리오는 추정이고, 일회성 이익 조정은 회사 발표·보도 숫자를 바탕으로 한 대략값이다.</p>
        </section>
      </article>
    </div>
  )
}

const fmtAmt = (v: number) => {
  const r = Math.round(v)
  if (Math.abs(r) >= 10000) { const jo = Math.floor(Math.abs(r) / 10000), rest = Math.abs(r) % 10000; return `${r < 0 ? '−' : ''}${jo}조${rest ? ` ${rest.toLocaleString('ko-KR')}` : ''}억` }
  return `${r < 0 ? '−' : ''}${Math.abs(r).toLocaleString('ko-KR')}억`
}
const SC_LABEL: Record<Sc, string> = { bad: '나쁜 그림', base: '기본 그림', good: '좋은 그림' }

function ModelSection({ m, sid, title }: { m: Model; sid: string; title: string }) {
  const [sc, setSc] = useState<Sc>('base')
  const y5 = runModel(m, sc, 5), y10 = runModel(m, sc, 10), r = modelResult(m, sc)
  const oi0 = m.segs.reduce((a, s) => a + s.rev * s.m0 / 100, 0)
  return (
    <section id={sid} className={sec}>
      <h3 className={h2}>{title}</h3>
      <p className={small}>과거 성장률을 그대로 늘리는 대신, <b>사업부마다 앞으로의 성장률과 이익률을 따로 가정</b>해 10년 뒤 이익을 쌓아 올렸다. 빨리 크는 사업(클라우드 등)이 회사 안에서 커질수록 회사 전체 성장률도 올라가는 효과가 그대로 반영된다. 버튼으로 시나리오를 바꿔 본다.</p>
      <div className="flex gap-1.5">
        {(['bad', 'base', 'good'] as Sc[]).map(x => (
          <button key={x} onClick={() => setSc(x)} className={`px-3 py-1 rounded-full text-xs font-semibold ${sc === x ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{SC_LABEL[x]}</button>
        ))}
      </div>
      <p className={small}><b>{m.scen[sc].name}:</b> {m.scen[sc].story}</p>
      <div className="overflow-x-auto"><table className="w-full text-xs">
        <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800">
          {['사업부', '지금 매출(1년)', '성장 가정 1~5년 / 6~10년', '10년 뒤 매출', '이익률 지금 → 10년 뒤', '10년 뒤 영업이익', '이익 비중 지금 → 10년 뒤'].map(c => <th key={c} className={`${th} whitespace-nowrap`}>{c}</th>)}
        </tr></thead>
        <tbody className="text-gray-700 dark:text-gray-200">
          {m.segs.map((s, i) => {
            const z = y10.segs[i]
            return (
              <tr key={s.name} className="border-b border-gray-100 dark:border-gray-900 align-top">
                <td className={`${td} font-medium whitespace-nowrap`}>{s.name}</td>
                <td className={`${td} tabular-nums whitespace-nowrap`}>{fmtAmt(s.rev)} {m.cur}</td>
                <td className={`${td} tabular-nums whitespace-nowrap`}>연 {s.g[sc][0]}% / {s.g[sc][1]}%</td>
                <td className={`${td} tabular-nums whitespace-nowrap font-semibold`}>{fmtAmt(z.rev)} {m.cur} <span className="font-normal text-gray-400">(×{(z.rev / s.rev).toFixed(1)})</span></td>
                <td className={`${td} tabular-nums whitespace-nowrap`}>{s.m0}% → {s.mEnd[sc]}%</td>
                <td className={`${td} tabular-nums whitespace-nowrap`}>{fmtAmt(z.oi)} {m.cur}</td>
                <td className={`${td} tabular-nums whitespace-nowrap`}>{Math.round(s.rev * s.m0 / oi0 * 100)}% → {Math.round(z.oi / y10.oi * 100)}%</td>
              </tr>
            )
          })}
          <tr className="border-b border-gray-100 dark:border-gray-900 align-top text-gray-500">
            <td className={`${td} whitespace-nowrap`}>{m.other.name}</td>
            <td className={`${td} tabular-nums whitespace-nowrap`}>{fmtAmt(m.other.now)} {m.cur}</td>
            <td className={`${td} tabular-nums whitespace-nowrap`}>연 {m.other.g}%</td>
            <td className={td} colSpan={2}></td>
            <td className={`${td} tabular-nums whitespace-nowrap`}>{fmtAmt(y10.oth)} {m.cur}</td>
            <td className={td}></td>
          </tr>
        </tbody>
      </table></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[['주당이익 지금', `${m.eps}${m.cur}`], ['5년 뒤', `약 ${y5.eps.toFixed(1)}${m.cur}`], ['10년 뒤', `약 ${y10.eps.toFixed(1)}${m.cur} (연 ${r.cagr.toFixed(1)}%)`], [`10년 연 수익률 (PER ${m.pe[sc]}배)`, `약 ${r.ret.toFixed(1)}%`]].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2"><p className="text-[11px] text-gray-400">{k}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{v}</p></div>
        ))}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">가정의 근거</p>
        <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
          {m.segs.map(s => <li key={s.name}><b>{s.name}:</b> <B t={s.why} /></li>)}
          <li><b>{m.other.name}:</b> <B t={m.other.why} /></li>
        </ul>
      </div>
      <p className="text-[11px] text-gray-400"><B t={m.note} /> 세율 {m.tax}%, 주식 수 연 {m.shc > 0 ? '+' : ''}{m.shc}%{m.shc < 0 ? '(자사주 매입)' : '(주식 보상으로 늘어남)'}. 이익률은 10년에 걸쳐 고르게 바뀐다고 가정. 단위: 억 {m.cur}(1조 = 1만 억).</p>
    </section>
  )
}

const SC_DOT: Record<Sc, Light> = { good: 'g', base: 'y', bad: 'r' }
function OddsBlock({ items, why }: { items: (Odds & { sc: Sc; ret: number })[]; why: string }) {
  const tot = items.reduce((a, x) => a + x.p, 0)
  const ev = items.reduce((a, x) => a + x.p * x.ret, 0) / tot
  const loss = items.filter(x => x.ret < 0).reduce((a, x) => a + x.p, 0)
  const low = items.filter(x => x.ret < 6).reduce((a, x) => a + x.p, 0)
  const lo = Math.min(...items.map(x => x.ret)), hi = Math.max(...items.map(x => x.ret))
  const bar: Record<Sc, string> = { good: 'bg-emerald-500', base: 'bg-amber-400', bad: 'bg-red-500' }
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-3 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[['가능성을 반영한 기대수익률', `연 약 ${ev.toFixed(1)}%`], ['결과 범위', `연 ${lo.toFixed(0)}% ~ ${hi.toFixed(0)}%`], ['10년 뒤 원금 손실 가능성', `약 ${Math.round(loss / tot * 100)}%`], ['연 6% 못 미칠 가능성', `약 ${Math.round(low / tot * 100)}%`]].map(([k, v]) => (
            <div key={k}><p className="text-[11px] text-gray-500 dark:text-gray-400">{k}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{v}</p></div>
          ))}
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden">{items.map(x => <div key={x.sc} className={bar[x.sc]} style={{ width: `${x.p / tot * 100}%` }} title={`${x.name} ${x.p}%`} />)}</div>
        <p className={small}><B t={why} /></p>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        {items.map(x => (
          <div key={x.sc} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1.5">
            <div className="flex gap-2 items-baseline"><Dot l={SC_DOT[x.sc]} /><p className="text-sm font-semibold text-gray-900 dark:text-white">{x.name}</p><span className="ml-auto text-sm font-bold text-gray-900 dark:text-white">{x.p}%</span></div>
            <p className={small}><B t={x.story} /></p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">그 세계의 모습</p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs leading-relaxed text-gray-700 dark:text-gray-200">{x.world.map((t, i) => <li key={i}><B t={t} /></li>)}</ul>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">이 그림이 맞아 간다는 신호</p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs leading-relaxed text-gray-700 dark:text-gray-200">{x.signs.map((t, i) => <li key={i}><B t={t} /></li>)}</ul>
            {x.eps && <p className="text-xs text-gray-800 dark:text-gray-100 pt-1"><b>{x.eps}</b></p>}
            <p className="text-sm font-semibold text-gray-900 dark:text-white">연 약 {x.ret.toFixed(0)}%</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">가능성(%)은 지금까지의 숫자와 회사·산업 상황을 보고 매긴 판단이다. 신호가 나올 때마다 다시 매긴다. 매수·매도 추천이 아니다.</p>
    </div>
  )
}
