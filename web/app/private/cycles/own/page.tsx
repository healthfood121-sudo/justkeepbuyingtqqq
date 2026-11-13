import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UNIV } from '../../universe'
import own from './own.json'

export const metadata = { robots: 'noindex', title: '자기 역사 바닥 vs 고점 — 종목별' }

// 횡보장 공부방 7-2의 종목별 전체 목록. own.json은 scripts/build-cycle-study.mjs가 배포 때마다 다시 만든다.

type Item = { k: string; nm: string; p: number; prior: number; next: number; lo: number; hi: number; m: number }
type Sum = { n: number; med: number; loss: number }
type Yr = { year: number; n: number; all: Sum; lo: Sum; hi: Sum; loList: Item[]; hiList: Item[] }

function href(key: string) {
  const f = (UNIV as Record<string, string>)[key] ?? ''
  const u = f.includes('S') ? 'sp500' : f.includes('N') ? 'ndx' : f.includes('M') ? 'mid' : f.includes('R') ? 'r2k' : f.includes('Q') ? 'nasdaq' : 'other'
  return `/private/${u}?s=${key}`
}
const pct = (v: number | null | undefined) => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
const th = 'py-1.5 px-1.5 font-medium text-gray-400 dark:text-gray-500 text-right whitespace-nowrap'
const td = 'py-1.5 px-1.5 tabular-nums text-right text-gray-700 dark:text-gray-200 align-top'

function List({ title, tone, s, rows }: { title: string; tone: 'good' | 'bad'; s: Sum; rows: Item[] }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-2">
      <h2 className={`text-base font-semibold ${tone === 'good' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{title}</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400">{s.n}종목 · 다음 10년 중간값 <b className="text-gray-800 dark:text-gray-100">{pct(s.med)}</b> · 손실 {s.loss}종목 ({Math.round(100 * s.loss / s.n)}%). 다음 10년 수익률 높은 순.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead><tr className="border-b border-gray-200 dark:border-gray-800">
            <th className={`${th} text-left`}>종목</th><th className={th}>직전 10년</th><th className={th}>자기 역사 위치</th><th className={th}>다음 10년</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => (
              <tr key={r.k} className={r.next < 0 ? 'bg-red-50/60 dark:bg-red-500/10' : ''}>
                <td className={`${td} text-left`}>
                  <Link href={href(r.k)} className="text-blue-600 dark:text-blue-400 hover:underline">{r.nm}</Link> <span className="text-gray-400">{r.k}</span>
                  <div className="text-[10px] text-gray-400">과거 10년 수익률 {r.m}개: {pct(r.lo)} ~ {pct(r.hi)}</div>
                </td>
                <td className={td}>{pct(r.prior)}</td>
                <td className={td}>하위 {r.p}%</td>
                <td className={`${td} font-semibold ${r.next < 0 ? 'text-red-600 dark:text-red-400' : r.next >= 10 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{pct(r.next)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default async function OwnHistoryPage({ searchParams }: { searchParams: Promise<{ y?: string }> }) {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')
  const { y } = await searchParams
  const years = own.years as Yr[]
  const cur = years.find(x => String(x.year) === y) ?? years.find(x => x.year === 1999) ?? years[0]
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Link href="/private/cycles#own" className="text-sm text-blue-500 hover:underline">← 횡보장 공부방으로</Link>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{cur.year}년에 샀다면 — 자기 역사 바닥 종목 vs 고점 종목</h1>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            같은 해에 산 종목끼리 비교한다(시장 타이밍은 똑같다). <b>자기 역사 위치</b> = 직전 10년 수익률이 그 종목이 {cur.year}년까지 낸 10년 수익률들 중 아래에서 몇 %였는지 — 그때 알 수 있던 정보만 썼다.
            하위 15% 이하 = 자기 역사 바닥, 상위 15% 이상(하위 85% 이상) = 자기 역사 고점. 과거 10년 수익률이 8개 이상 있는 종목만.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {years.map(x => (
            <Link key={x.year} href={`/private/cycles/own?y=${x.year}`} scroll={false}
              className={`px-2.5 py-1 rounded-full text-xs tabular-nums ${x.year === cur.year ? 'bg-blue-600 text-white font-semibold' : x.lo.med > x.hi.med ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
              {x.year}
            </Link>
          ))}
        </div>
        <p className="text-xs text-gray-400">초록 해 = 바닥 종목이 이긴 해. 그해 전체 {cur.n}종목의 다음 10년 중간값 {pct(cur.all.med)}.</p>
        <List title={`자기 역사 바닥에서 산 종목 (${cur.lo.n}개)`} tone="good" s={cur.lo} rows={cur.loList} />
        <List title={`자기 역사 고점에서 산 종목 (${cur.hi.n}개)`} tone="bad" s={cur.hi} rows={cur.hiList} />
        <p className="text-xs leading-relaxed text-gray-400">연평균 수익률, 배당 포함. 지금 남아 있는 회사만 있어(망하거나 사라진 회사 제외) 실제보다 좋아 보인다. 빨간 줄 = 10년 뒤 손실.</p>
      </div>
    </div>
  )
}
