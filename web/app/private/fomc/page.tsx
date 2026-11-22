import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MINUTES, type Para } from './data'

// FOMC 의사록 번역·정리 — 최신 회의가 맨 위. 서버에서 로그인 확인 뒤에만 그린다.

const Bold = ({ t }: { t: string }) => <>{t.split(/\*\*(.+?)\*\*/g).map((x, i) => i % 2 ? <b key={i}>{x}</b> : x)}</>

export default async function FomcPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')

  const box = 'rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 scroll-mt-20'
  const h2 = 'text-base font-bold text-gray-900 dark:text-white'
  const p = 'text-sm leading-relaxed text-gray-700 dark:text-gray-200'
  const small = 'text-xs leading-relaxed text-gray-500 dark:text-gray-400'
  const para = (x: Para, i: number) =>
    typeof x === 'string' ? <p key={i} className={p}><Bold t={x} /></p>
      : 'list' in x ? <ul key={i} className={`${p} list-disc pl-5 space-y-1`}>{x.list.map((l, j) => <li key={j}><Bold t={l} /></li>)}</ul>
        : <blockquote key={i} className="border-l-4 border-gray-300 dark:border-gray-700 pl-3 space-y-1.5">{x.quote.map((q, j) => <p key={j} className="text-sm leading-relaxed text-gray-600 dark:text-gray-300"><Bold t={q} /></p>)}</blockquote>

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">시장 공부 · 연준 회의 기록 번역</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FOMC 의사록 — 연준은 무엇을 걱정하나</h1>
          <p className={p}>연방공개시장위원회(FOMC) 회의 3주 뒤 공개되는 의사록을 번역·정리했다. 연준 문서는 미국 정부 저작물이라 본문 전체를 옮겼다(참석자 명단·각주 제외). 경기 판단은 <Link href="/private/slowdown" className="text-blue-600 dark:text-blue-400 hover:underline">둔화 판단</Link> 페이지와 함께 본다.</p>
        </div>

        {MINUTES.map((m, mi) => (
          <div key={m.meeting} className="space-y-4">
            <section className={`${box} ${mi === 0 ? 'border-blue-300 dark:border-blue-800' : ''}`}>
              <p className="text-xs text-gray-400">회의 {m.meeting} · 공개 {m.released} · <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">원문</a></p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{m.headline}</h2>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-gray-50 dark:bg-gray-900 p-2"><p className="text-[11px] text-gray-500">결정</p><p className="font-semibold text-gray-900 dark:text-white">{m.rate}</p></div>
                <div className="rounded bg-gray-50 dark:bg-gray-900 p-2"><p className="text-[11px] text-gray-500">표결</p><p className="font-semibold text-gray-900 dark:text-white">{m.vote}</p></div>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">핵심 정리</h3>
              <ol className="space-y-2">
                {m.key.map((k, i) => (
                  <li key={i} className="text-sm leading-relaxed text-gray-700 dark:text-gray-200"><b>{i + 1}. {k.t}</b> — <Bold t={k.d} /></li>
                ))}
              </ol>
              <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/30 p-3 space-y-1.5">
                {m.links.map((l, i) => <p key={i} className="text-sm text-gray-700 dark:text-gray-200"><b>{l.t}:</b> <Bold t={l.d} /></p>)}
              </div>
              <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-400">본문 번역:</span>
                {m.sections.map(s => <a key={s.id} href={`#${mi}-${s.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">{s.title.replace(/^\d+\.\s*/, '')}</a>)}
              </nav>
            </section>

            {m.sections.map(s => (
              <section key={s.id} id={`${mi}-${s.id}`} className={box}>
                <h2 className={h2}>{s.title}</h2>
                {s.paras.map(para)}
              </section>
            ))}
            <p className={small}>번역은 뜻을 살린 우리말 옮김이다. 의사록의 수량 표현은 한 가지로 맞춰 옮겼다: a couple = 두어 명, a few = 몇몇, some = 일부, several = 여러, many = 많은, a majority = 과반, most = 대부분, the vast majority = 대다수, almost all = 거의 모든.</p>
          </div>
        ))}
      </div>
    </div>
  )
}
