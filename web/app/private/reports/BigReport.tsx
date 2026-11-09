'use client'

import { useState } from 'react'

// 심층 리포트(아마존·알파벳·마이크로소프트·에르메스 공용) — 종목 분석 화면 안에 함께 보여 준다.
export type Light = 'g' | 'y' | 'r'
export type BigReportData = {
  key: string
  asOf: string
  title: string
  intro: string
  conclusion: string[]
  epsFix?: { note: string; rows: { k: string; v: string }[]; per: string }
  plan: { q: string; now: string; l: Light }[]
  units: { name: string; share: string; growth: string; role: string; view: string }[]
  history: { years: string; kind: 'start' | 'crisis' | 'win' | 'now'; title: string; story: string[]; lesson: string }[]
  ai?: { opp: string[]; threat: string[]; verdict: string }
  worries: { w: string; fact: string; l: Light }[]
  calls: { q: string; date: string; url?: string; head: string; nums: string[]; said?: string; note: string }[]
  hermes?: { k: string; it: string; rms: string }[]
  hermesVerdict?: string
  numbers?: { title: string; cols: string[]; rows: string[][]; note: string }
  peers?: { title: string; cols: string[]; rows: { k: string; v: string[] }[]; verdict: string }
  callsTitle?: string
  callsNote?: string
  scen: { name: string; l: Light; story: string; eps: string; pe: string; ret: string }[]
  scenNote: string
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
  const id = (s: string) => `${d.key.toLowerCase()}-${s}`
  const toc = ([['fix', 'PER 바로잡기', !!d.epsFix], ['plan', '분석 질문', true], ['units', '사업부', true], ['history', '역사·위기', true], ['nums', '연도별 숫자', !!d.numbers], ['peers', '경쟁사와 비교', !!d.peers], ['ai', 'AI', !!d.ai], ['worry', '걱정 vs 숫자', true], ['calls', d.callsTitle ? '실적 발표' : '최근 콜', true], ['rms', '에르메스와 비교', !!d.hermes], ['scen', '10년 시나리오', true], ['warn', '경고 신호', true]] as [string, string, boolean][]).filter(t => t[2])
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

        <section id={id('units')} className={sec}>
          <h3 className={h2}>{N()}돈을 버는 곳 — 사업부 한눈에</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className={th}>사업</th><th className={th}>비중</th><th className={th}>성장</th><th className={th}>회사 안의 역할</th><th className={th}>판단</th></tr></thead>
            <tbody className="text-gray-700 dark:text-gray-200">{d.units.map(u => <tr key={u.name} className="border-b border-gray-100 dark:border-gray-900 align-top"><td className={`${td} font-medium whitespace-nowrap`}>{u.name}</td><td className={`${td} whitespace-nowrap`}>{u.share}</td><td className={`${td} whitespace-nowrap`}>{u.growth}</td><td className={td}>{u.role}</td><td className={td}><B t={u.view} /></td></tr>)}</tbody>
          </table></div>
          <p className="text-[11px] text-gray-400">분기별 자세한 숫자는 위 &ldquo;사업부·지역별 매출&rdquo;과 사업부 심층 분석에 있다.</p>
        </section>

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

        {d.ai && <section id={id('ai')} className={sec}>
          <h3 className={h2}>{N()}AI — 기회인가 위협인가</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3"><p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">기회</p><ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">{d.ai.opp.map((t, i) => <li key={i}><B t={t} /></li>)}</ul></div>
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 p-3"><p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">위협·부담</p><ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">{d.ai.threat.map((t, i) => <li key={i}><B t={t} /></li>)}</ul></div>
          </div>
          <p className={small}><B t={d.ai.verdict} /></p>
        </section>}

        <section id={id('worry')} className={sec}>
          <h3 className={h2}>{N()}시장의 걱정 vs 숫자가 말하는 것</h3>
          <div className="space-y-1.5">
            {d.worries.map(x => (
              <div key={x.w} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <div className="flex gap-2"><Dot l={x.l} /><p className="text-xs font-semibold text-gray-900 dark:text-white">걱정: {x.w}</p></div>
                <p className={`${small} mt-0.5`}><b>숫자:</b> <B t={x.fact} /></p>
              </div>
            ))}
          </div>
        </section>

        <section id={id('calls')} className={sec}>
          <h3 className={h2}>{N()}{d.callsTitle ?? `최근 컨퍼런스콜 (${d.calls.length}개 분기)`}</h3>
          <p className={small}>{d.callsNote ?? '녹취록 전문을 읽고 요약했다. 제목을 누르면 펼쳐진다.'}</p>
          <div className="space-y-1.5">
            {d.calls.map(c => {
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
        </section>

        {d.hermes && <section id={id('rms')} className={sec}>
          <h3 className={h2}>{N()}에르메스와 비교하면</h3>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className={th}></th><th className={th}>이 회사</th><th className={th}>에르메스</th></tr></thead>
            <tbody className="text-gray-700 dark:text-gray-200">{d.hermes.map(r => <tr key={r.k} className="border-b border-gray-100 dark:border-gray-900 align-top"><td className={`${td} font-medium whitespace-nowrap`}>{r.k}</td><td className={td}><B t={r.it} /></td><td className={td}>{r.rms}</td></tr>)}</tbody>
          </table></div>
          <p className={small}><B t={d.hermesVerdict ?? ''} /></p>
        </section>}

        <section id={id('scen')} className={sec}>
          <h3 className={h2}>{N()}10년 시나리오(추정)</h3>
          <div className="grid sm:grid-cols-3 gap-2">
            {d.scen.map(s => (
              <div key={s.name} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
                <div className="flex gap-2"><Dot l={s.l} /><p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p></div>
                <p className={small}>{s.story}</p>
                <p className="text-xs text-gray-800 dark:text-gray-100"><b>{s.eps}</b>, {s.pe}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.ret}</p>
              </div>
            ))}
          </div>
          <p className={small}><B t={d.scenNote} /></p>
        </section>

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
