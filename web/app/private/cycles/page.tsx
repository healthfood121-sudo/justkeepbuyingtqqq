import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UNIV } from '../universe'
import study from './study.json'

export const metadata = { robots: 'noindex', title: '횡보장 공부방' }

// 횡보장 공부방 — 나스닥이 10년씩 제자리였던 시기에 어떤 종목이 이겼나.
// 숫자는 scripts/build-cycle-study.mjs 가 배포 때마다 롤링·펀더멘털 데이터(매주 자동 갱신)에서 다시 계산한다.

type Row = { k: string; nm: string; prior: number; next: number }
type Q = { lo: number; hi: number; med: number; loss: number; over10: number; size: number }
type Year = { year: number; n: number; q: Q[]; bottomWin: Row[]; bottomLose: Row[]; topHot: Row[]; topWin: Row[] }
type Dec = { year: number; n: number; med: number; loss: number; top: { k: string; nm: string; next: number }[]; bottom: { k: string; nm: string; next: number }[] }
type NowRow = { k: string; nm: string; pos: number | null; prior: number; pe: number | null; peMed: number | null; roic5: number | null; epsVsPeak: number | null; div: number | null; pass: boolean; q: number }
type Same = { from: number; n: number; byYear: { y: number; best: number; worst: number; med: number }[]; perStock: { k: string; nm: string; best: number; bestR: number; bestPrior: number | null; worst: number; worstR: number; worstPrior: number | null; lo: number | null; hi: number | null }[]; ownN: number; ownLo: number; ownHi: number; ownLoWins: number; spreadMed: number }
type Study = {
  generated: string; note: string
  sameStocks: Same[]
  techSrc: { k: string; nm: string; total: number; eps: number; pe: number; peBuy: number; peSell: number }[]
  ndx: { buyYear: number; cagr: number; asOf: string; years: number } | null
  years: Year[]; seventies: Dec[]
  now: { buyYear: number; asOf: string; n: number; q: { lo: number; hi: number; size: number }[]; bottom: NowRow[]; top: { k: string; nm: string; prior: number; pe: number | null }[]; watch: { k: string; nm: string; prior: number; pos: number | null }[] } | null
}

function href(key: string) {
  const f = (UNIV as Record<string, string>)[key] ?? ''
  const u = f.includes('S') ? 'sp500' : f.includes('N') ? 'ndx' : f.includes('M') ? 'mid' : f.includes('R') ? 'r2k' : f.includes('Q') ? 'nasdaq' : 'other'
  return `/private/${u}?s=${key}`
}
const pct = (v: number | null | undefined, sign = true) => v == null ? '—' : `${sign && v > 0 ? '+' : ''}${v.toFixed(1)}%`
const box = 'rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3'
const h2 = 'text-base font-semibold text-gray-900 dark:text-white'
const p = 'text-sm leading-relaxed text-gray-700 dark:text-gray-300'
const small = 'text-xs leading-relaxed text-gray-500 dark:text-gray-400'
const th = 'py-1.5 px-1.5 font-medium text-gray-400 dark:text-gray-500 text-right whitespace-nowrap'
const td = 'py-1.5 px-1.5 tabular-nums text-right text-gray-700 dark:text-gray-200'

function Names({ rows, tone }: { rows: Row[]; tone: 'good' | 'bad' }) {
  if (!rows.length) return <span className={small}>없음</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.map(r => (
        <Link key={r.k} href={href(r.k)} className={`text-xs px-2 py-1 rounded-md hover:underline ${tone === 'good' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'}`}>
          {r.nm} <span className="opacity-70 tabular-nums">{pct(r.prior)} → {pct(r.next)}</span>
        </Link>
      ))}
    </div>
  )
}

export default async function CyclesPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')
  const d = study as unknown as Study
  const y99 = d.years.find(y => y.year === 1999)!
  const y00 = d.years.find(y => y.year === 2000)!
  const others = d.years.filter(y => y.year !== 1999 && y.year !== 2000)
  const ndx = d.ndx
  const pass = d.now?.bottom.filter(r => r.pass) ?? []

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">횡보장 공부방 — 나스닥이 10년 제자리일 때 무엇이 이겼나</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            나스닥은 긴 횡보장을 두 번 겪었다(1970년대, 2000년대). 세 번째가 오면 어떻게 해야 하나 — 사이트 종목 데이터로 &ldquo;그때 무엇을 샀어야 했나&rdquo;를 확인한다.
            숫자는 배포할 때마다 최신 가격으로 다시 계산된다(최근 계산 {d.generated}).
          </p>
        </div>

        {/* 지금 위치 */}
        <section className="rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2">
          <h2 className={h2}>지금 위치</h2>
          {ndx && (
            <p className={p}>
              나스닥100의 지난 약 10년({ndx.buyYear}년 말 → {ndx.asOf}) 연평균 수익률은 <b>{pct(ndx.cagr)}</b>.
              {ndx.cagr >= 18
                ? <> 1985년 이후 이 정도로 좋았던 때(지난 10년 연 18~22%)는 대부분 <b>1996~1998년</b>이었고, 그 뒤 10년 나스닥100은 연 2~8%로 낮았다. <b>아래 1999·2000년 표가 지금 가장 참고할 만한 사례</b>다.</>
                : ndx.cagr < 10
                  ? <> 지난 10년이 나빴던 때다. 과거엔 이런 때 다음 10년이 좋았다(2008~2012년 → 연 17% 안팎).</>
                  : <> 평범한 구간이다. 아래 표처럼 평범한 시기에는 &lsquo;잘나가던 종목&rsquo;과 &lsquo;바닥 종목&rsquo;의 차이가 크지 않았다.</>}
            </p>
          )}
          <p className={small}>나스닥 사이클 자체(지난 10년 → 다음 10년, TQQQ 포함)는 공개 글 <Link href="/posts/nasdaq-cycle" className="underline">&ldquo;나스닥 사이클 — 지금은 어디쯤인가&rdquo;</Link>에 있다.</p>
        </section>

        {/* 1. 1999·2000 */}
        <section className={box}>
          <h2 className={h2}>1. 거품 꼭대기에서 샀다면 — 직전 10년 성적으로 5등분</h2>
          <p className={p}>
            1999년·2000년 말에 산 경우를 <b>직전 10년 동안 얼마나 올랐나</b>로 다섯 무리로 나눴다. 1무리 = 직전 10년이 가장 나빴던(바닥에 기던) 종목, 5무리 = 가장 잘나가던 종목.
          </p>
          {[y99, y00].map(y => (
            <div key={y.year} className="overflow-x-auto">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{y.year}년 말 매수 → {y.year + 10}년 (종목 {y.n}개)</p>
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-gray-200 dark:border-gray-800"><th className={`${th} text-left`}>무리</th><th className={th}>직전 10년</th><th className={th}>다음 10년(중간값)</th><th className={th}>손실</th><th className={th}>연 10% 이상</th></tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {y.q.map((q, i) => (
                    <tr key={i} className={i === 0 ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : i === 4 ? 'bg-red-50/60 dark:bg-red-950/20' : ''}>
                      <td className={`${td} text-left whitespace-nowrap`}>{i === 0 ? '1 (바닥)' : i === 4 ? '5 (잘나가던)' : i + 1}</td>
                      <td className={td}>{pct(q.lo)} ~ {pct(q.hi)}</td>
                      <td className={`${td} font-bold`}>{pct(q.med)}</td>
                      <td className={td}>{q.loss}/{q.size}</td>
                      <td className={td}>{q.over10}/{q.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <p className={p}>
            <b>읽는 법:</b> 거품 꼭대기에서는 <b>바닥에 기던 종목이 다음 10년에 연 13~14%</b>, 가장 잘나가던 종목은 <b>연 0~2%이고 절반 가까이 손해</b>였다. 같은 &ldquo;좋은 회사&rdquo;라도 직전 10년에 너무 많이 오른 종목은 다음 10년을 미리 당겨 쓴 셈이다.
          </p>
        </section>

        {/* 2. 다른 해 */}
        <section className={box}>
          <h2 className={h2}>2. 평범한 해에는? — 이 효과는 거품 꼭대기에서만 강했다</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800"><th className={`${th} text-left`}>매수 해</th><th className={th}>1 (바닥)</th><th className={th}>2</th><th className={th}>3</th><th className={th}>4</th><th className={th}>5 (잘나가던)</th><th className={th}>차이(1−5)</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {d.years.sort((a, b) => a.year - b.year).map(y => {
                  const gap = y.q[0].med - y.q[4].med
                  return (
                    <tr key={y.year} className={y.year === 1999 || y.year === 2000 ? 'bg-amber-50/60 dark:bg-amber-950/20 font-semibold' : ''}>
                      <td className={`${td} text-left`}>{y.year}</td>
                      {y.q.map((q, i) => <td key={i} className={td}>{pct(q.med)}</td>)}
                      <td className={`${td} ${gap >= 5 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>{gap > 0 ? '+' : ''}{gap.toFixed(1)}%p</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className={p}>
            숫자는 각 무리의 다음 10년 연평균 수익률 중간값. <b>1990·2008·2010·2013년처럼 평범한 때는 무리 사이 차이가 거의 없다</b>(오히려 잘나가던 종목이 계속 잘나가기도). 차이가 크게 벌어진 건 <b>1999·2000년, 그리고 그 여파가 남은 2003·2005년</b>뿐이다.
            → &ldquo;바닥 종목을 사라&rdquo;는 늘 통하는 공식이 아니라 <b>시장 전체가 오래 크게 오른 뒤</b>에 통했다. 지금이 그런 때인지는 위 &lsquo;지금 위치&rsquo;를 본다.
          </p>
        </section>

        {/* 3. 이름 */}
        <section className={box}>
          <h2 className={h2}>3. 이름으로 보기 — 2000년 말에 샀다면 (괄호: 직전 10년 → 다음 10년)</h2>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">바닥에서 산 대박 — 직전 10년이 나빴는데 다음 10년 연 15% 이상</p>
            <Names rows={y00.bottomWin} tone="good" />
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 pt-1">바닥이었는데 계속 나빴던 종목</p>
            <Names rows={y00.bottomLose} tone="bad" />
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 pt-1">가장 잘나가던 종목의 다음 10년</p>
            <Names rows={y00.topHot} tone="bad" />
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 pt-1">잘나가던 종목 중에서도 계속 이긴 곳(연 10% 이상)</p>
            <Names rows={y00.topWin} tone="good" />
          </div>
          <p className={p}>
            <b>공통점:</b> 바닥에서 대박 난 회사들(애플·몬스터 음료·커민스 등)은 <b>그 뒤 10년 이익이 크게 늘었다</b> — 주가가 바닥이었던 건 회사가 망가져서가 아니라 시장의 관심 밖이었기 때문. 반대로 잘나가던 시스코·오라클·반도체 회사들은 회사는 멀쩡했지만 <b>값이 너무 비쌌다</b>. 잘나가던 종목 중 이긴 곳(패스트널·익스페디터스 등)은 비싸지 않은 값에 이익이 꾸준히 큰 회사들이었다.
          </p>
        </section>

        {/* 4. 1970년대 */}
        <section className={box}>
          <h2 className={h2}>4. 1970년대 횡보장 — &lsquo;니프티 피프티&rsquo;의 교훈</h2>
          <p className={p}>
            1970년대 초 미국에는 &ldquo;영원히 들고 갈 우량주 50개&rdquo;(니프티 피프티 — 코카콜라·디즈니·폴라로이드 등)라는 유행이 있었다. 좋은 회사라는 이유로 PER 40~90배까지 올랐고, 1973~1974년 폭락 뒤 오랫동안 제자리였다. 사이트 데이터에는 이 시기 직전 10년 수익률이 없어, 그 뒤 10년의 승자·패자만 본다.
          </p>
          {d.seventies.map(s => (
            <div key={s.year} className="space-y-1">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{s.year}년 말 매수 → {s.year + 10}년 (종목 {s.n}개, 중간값 {pct(s.med)}, 손실 {s.loss}개)</p>
              <div className="flex flex-wrap gap-1.5">
                {s.top.map(r => <Link key={r.k} href={href(r.k)} className="text-xs px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:underline">{r.nm} {pct(r.next)}</Link>)}
                {s.bottom.map(r => <Link key={r.k} href={href(r.k)} className="text-xs px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:underline">{r.nm} {pct(r.next)}</Link>)}
              </div>
            </div>
          ))}
          <p className={p}>
            <b>읽는 법:</b> 당시 최고 인기주였던 디즈니·코카콜라는 10년 동안 손해이거나 거의 제자리였고, <b>작고 덜 유명하던 월마트</b>가 연 29~48%였다. 방산(록히드·제너럴 다이내믹스·보잉)처럼 그 시대 흐름(냉전 군비 확대)에 맞는 업종도 이겼다. 2000년대와 같은 결론 — <b>모두가 아는 1등은 값이 이미 비쌌고, 승자는 그 밖에서 나왔다.</b>
          </p>
        </section>

        {/* 5. 어떻게 */}
        <section className={box}>
          <h2 className={h2}>5. 그때 어떻게 사고팔았으면 됐나 — 규칙으로 정리</h2>
          <ol className={`${p} list-decimal pl-5 space-y-1.5`}>
            <li><b>신호:</b> 나스닥100 지난 10년 연평균이 <b>18%를 넘으면</b> &lsquo;꼭대기 근처일 수 있다&rsquo;로 본다(1996~2000년, 2021~2022년, 지금).</li>
            <li><b>새 돈의 방향을 바꾼다:</b> 직전 10년 상위 20%(가장 잘나가던 종목)에는 새 돈을 덜 넣는다. 이미 가진 걸 다 팔 필요는 없다 — 잘나가던 종목 중에도 계속 이긴 곳이 있었다.</li>
            <li><b>바닥 무리에서 고르되 &lsquo;망가진 회사&rsquo;는 거른다:</b> 직전 10년 하위 40% 중 ① 지금도 이익을 내고 ② 자본이익률이 높고 ③ PER이 자기 10년 중간보다 낮고 ④ 이익이 10년 고점 근처인 회사. 주가만 빠진 게 아니라 회사가 무너진 종목(바닥인데 계속 나빴던 종목들)을 피하려는 것.</li>
            <li><b>나눠 담는다:</b> 바닥 무리도 손실 종목이 섞여 있다 — 10~20종목 이상, 업종을 섞는다.</li>
            <li><b>10년을 들고 간다:</b> 이 효과는 1~2년이 아니라 10년 단위로 나타났다.</li>
          </ol>
          <p className={small}>규칙 ③의 기준(자본이익률 5년 평균 10% 이상, 이익이 10년 고점의 75% 이상)은 이 사이트가 정한 것이고, 과거 시험(백테스트)으로 검증한 기준은 아니다.</p>
        </section>

        {/* 6. 지금 후보 */}
        {d.now && (
          <section className={box}>
            <h2 className={h2}>6. 지금 같은 규칙을 적용하면 — 바닥 무리 중 걸러진 종목 {pass.length}개</h2>
            <p className={p}>
              사이트 종목 {d.now.n}개를 지난 약 10년({d.now.buyYear}년 말 → {d.now.asOf}) 수익률로 5등분: 1무리 {pct(d.now.q[0].lo)}~{pct(d.now.q[0].hi)}, 2무리 ~{pct(d.now.q[1].hi)} … 5무리 {pct(d.now.q[4].lo)} 이상.
              1·2무리(하위 40%) 중 위 규칙 ③을 통과한 종목이다. <b>매수 추천이 아니라 공부할 후보 목록</b>이다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className={`${th} text-left`}>종목</th><th className={th}>지난 10년</th><th className={th}>자기 역사 위치</th><th className={th}>PER (10년 중간)</th><th className={th}>자본이익률 5년</th><th className={th}>이익/10년 고점</th><th className={th}>배당</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pass.map(r => (
                    <tr key={r.k}>
                      <td className={`${td} text-left`}><Link href={href(r.k)} className="text-blue-600 dark:text-blue-400 hover:underline">{r.nm}</Link> <span className="text-gray-400">{r.k}{r.q === 1 ? ' · 1무리' : ''}</span></td>
                      <td className={td}>{pct(r.prior)}</td>
                      <td className={td}>{r.pos != null ? `하위 ${r.pos}%` : '—'}</td>
                      <td className={`${td} whitespace-nowrap`}>{r.pe?.toFixed(0)}배 <span className="text-gray-400">({r.peMed?.toFixed(0)}배)</span></td>
                      <td className={td}>{r.roic5 != null ? `${r.roic5.toFixed(0)}%` : '—'}</td>
                      <td className={td}>{r.epsVsPeak != null ? `${Math.min(r.epsVsPeak, 100)}%` : '—'}</td>
                      <td className={td}>{r.div != null ? `${r.div.toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">반대편 — 지금 가장 잘나가는 5무리(지난 10년 수익률 높은 순)</p>
              <div className="flex flex-wrap gap-1.5">
                {d.now.top.map(r => <Link key={r.k} href={href(r.k)} className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:underline">{r.nm} <span className="opacity-70 tabular-nums">{pct(r.prior)}</span></Link>)}
              </div>
              <p className={small}>2000년이었다면 이 자리에 시스코·오라클·잭 헨리가 있었다. 좋은 회사여도 &ldquo;다음 10년을 미리 당겨 쓴&rdquo; 값인지 각 종목 화면의 10년 보유 수익률 분해(보라 칸 = PER 몫)로 확인한다.</p>
            </div>
          </section>
        )}


        {/* 7. 같은 종목, 언제 */}
        <section className={box}>
          <h2 className={h2}>7. 같은 종목, 언제 샀으면 좋았나 — 역사가 긴 종목만 모아서</h2>
          <p className={p}>
            이번엔 종목끼리 비교하지 않고 <b>한 종목 안에서</b> 매수 해를 비교한다. 매수 해마다 10년 보유 수익률이 모두 있는 종목만 골랐다 — 역사가 길수록 종목 수는 줄어든다.
            &lsquo;직전 10년&rsquo;은 그 종목 자신의 직전 10년 수익률.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">
                <th className={`${th} text-left`}>데이터 시작</th><th className={th}>종목 수</th><th className={th}>자기 직전 10년이 나빴던 해에 산 경우</th><th className={th}>좋았던 해에 산 경우</th><th className={th}>나빴던 해가 더 나은 종목</th><th className={th}>최고·최악 매수 해 차이</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {d.sameStocks.map(x => (
                  <tr key={x.from}>
                    <td className={`${td} text-left`}>{x.from}~2015년 매수</td>
                    <td className={td}>{x.n}</td>
                    <td className={`${td} font-bold text-emerald-600 dark:text-emerald-400`}>{pct(x.ownLo)}</td>
                    <td className={`${td} font-bold text-red-500`}>{pct(x.ownHi)}</td>
                    <td className={td}>{x.ownLoWins}/{x.ownN} ({Math.round(100 * x.ownLoWins / x.ownN)}%)</td>
                    <td className={td}>{x.spreadMed.toFixed(1)}%p</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={p}>
            <b>읽는 법:</b> 같은 회사라도 <b>자기 직전 10년이 나빴던 해(하위 3분의 1)에 사면 다음 10년 연 13~14%</b>, 좋았던 해(상위 3분의 1)에 사면 연 9~10%였다. 1970년대부터 본 42종목, 1980년부터 172종목, 1990년부터 252종목 — <b>역사를 얼마나 길게 잡아도 같은 방향</b>이고, 10개 중 7~8개 종목에서 그랬다.
            같은 종목을 &lsquo;가장 좋은 해&rsquo;와 &lsquo;가장 나쁜 해&rsquo;에 샀을 때 차이는 중간값으로 연 24~29%포인트 — <b>무엇을 사느냐만큼 언제 사느냐가 컸다.</b>
          </p>
          {d.sameStocks.map(x => {
            const hot = x.byYear.filter(b => b.best + b.worst >= Math.max(3, Math.round(x.n / 15)))
            return (
              <details key={x.from} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <summary className="text-sm font-semibold text-gray-800 dark:text-gray-100 cursor-pointer">{x.from}년부터 {x.n}종목 — 최고·최악 매수 해가 몰린 해, 종목별 표 (눌러서 펼치기)</summary>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {hot.map(b => (
                      <span key={b.y} className={`text-xs px-2 py-1 rounded-md tabular-nums ${b.best >= b.worst ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'}`}>
                        {b.y}년: 최고 {b.best} · 최악 {b.worst}
                      </span>
                    ))}
                  </div>
                  <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="sticky top-0 bg-white dark:bg-gray-950"><tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className={`${th} text-left`}>종목</th><th className={th}>최고 매수 해 (직전 10년)</th><th className={th}>그 뒤 10년</th><th className={th}>최악 매수 해 (직전 10년)</th><th className={th}>그 뒤 10년</th>
                      </tr></thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {x.perStock.map(r => (
                          <tr key={r.k}>
                            <td className={`${td} text-left`}><Link href={href(r.k)} className="text-blue-600 dark:text-blue-400 hover:underline">{r.nm}</Link></td>
                            <td className={td}>{r.best} <span className="text-gray-400">({pct(r.bestPrior)})</span></td>
                            <td className={`${td} text-emerald-600 dark:text-emerald-400`}>{pct(r.bestR)}</td>
                            <td className={td}>{r.worst} <span className="text-gray-400">({pct(r.worstPrior)})</span></td>
                            <td className={`${td} text-red-500`}>{pct(r.worstR)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            )
          })}
          <p className={p}>
            <b>최고의 매수 해</b>는 1974년(오일쇼크 폭락 뒤)·1981년(금리 정점)·1987~1990년(블랙먼데이·불황)·2008~2011년(금융위기)에, <b>최악의 매수 해</b>는 1972년(니프티 피프티 정점)·1998~2001년(닷컴 정점)에 몰렸다. 좋은 해는 늘 <b>모두가 무서워하던 때</b>였다.
          </p>
          {d.now && d.now.watch.length > 0 && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">지금 자주 보는 종목은 &lsquo;자기 역사&rsquo;에서 어디인가 — 지난 약 10년 수익률이 그 종목의 과거 10년 수익률들 중 아래에서 몇 %인지</p>
              <div className="flex flex-wrap gap-1.5">
                {d.now.watch.map(w => (
                  <Link key={w.k} href={href(w.k)} className={`text-xs px-2 py-1 rounded-md hover:underline ${w.pos == null ? 'bg-gray-100 dark:bg-gray-800' : w.pos <= 33 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' : w.pos >= 67 ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}>
                    {w.nm} {pct(w.prior)} · {w.pos == null ? '역사 짧음' : `하위 ${w.pos}%`}
                  </Link>
                ))}
              </div>
              <p className={small}>초록 = 자기 역사에서 나빴던 쪽(하위 3분의 1, 과거엔 다음 10년이 좋았던 자리), 빨강 = 좋았던 쪽(상위 3분의 1). 에르메스·나이키는 지금 자기 역사의 바닥 쪽, 구글·코스트코·애플·엔비디아는 꼭대기 쪽이다. 회사가 망가져서 바닥인지(나이키)도 같이 봐야 한다.</p>
            </div>
          )}
        </section>

        {/* 8. 지금은 1999년과 다른가 */}
        <section className={box}>
          <h2 className={h2}>8. 지금은 1999년과 다른가 — 지난 10년 기술주 상승은 어디서 왔나</h2>
          <p className={p}>나스닥의 지난 10년이 좋았던 건 1990년대 후반과 같다. 차이는 <b>그 수익이 이익 성장에서 왔나, PER이 부풀어서 왔나</b>다. 1999년 나스닥은 PER이 크게 부풀며 올랐다(나스닥100 PER 수십~100배대, 보도).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">
                <th className={`${th} text-left`}>종목</th><th className={th}>지난 약 10년 연평균</th><th className={th}>이익(EPS) 성장</th><th className={th}>PER 변화</th><th className={th}>PER</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {d.techSrc.map(r => (
                  <tr key={r.k}>
                    <td className={`${td} text-left`}><Link href={href(r.k)} className="text-blue-600 dark:text-blue-400 hover:underline">{r.nm}</Link></td>
                    <td className={`${td} font-bold`}>{pct(r.total)}</td>
                    <td className={`${td} text-emerald-600 dark:text-emerald-400`}>{pct(r.eps)}</td>
                    <td className={`${td} ${r.pe < 0 ? 'text-red-500' : 'text-purple-600 dark:text-purple-400'}`}>{pct(r.pe)}</td>
                    <td className={`${td} whitespace-nowrap`}>{r.peBuy.toFixed(0)}배 → {r.peSell.toFixed(0)}배</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={p}>
            <b>읽는 법:</b> 애플을 빼면 <b>지난 10년 대형 기술주 수익은 거의 다 이익 성장에서 왔고, PER은 오히려 내려간 곳이 많다</b>(아마존 153배 → 20배, 엔비디아 42배 → 27배). 1999년처럼 &lsquo;값만 부푼&rsquo; 상승이 아니다 — 지금 기술주가 역사적으로 비싸지 않아 보이는 이유다.
          </p>
          <p className={p}>
            <b>그럼 왜 불안한가:</b> 다음 10년 수익 = 이익 성장 + PER 변화. 지금 위험은 1999년식 &lsquo;PER 붕괴&rsquo;보다 <b>&lsquo;이익 성장이 연 20~60%에서 크게 느려지는 것&rsquo;</b>이다. 회사가 클수록 같은 속도로 크기 어렵고, 지금은 AI 설비투자로 쓰는 돈도 많다. 이익 성장이 연 10% 안팎으로 내려오고 PER이 그대로면, 지수 수익도 그 근처로 내려온다 — 앞의 표(다음 10년 나스닥100 연 2~8%)보다는 낫지만 지난 10년의 20%와는 거리가 멀다.
            하워드 막스가 하워드 막스가 &ldquo;아직 거품은 아니지만 높은 편이니 한 발만 걸쳐라&rdquo;고 한 것과 같은 그림이다.ldquo;아직 거품은 아니지만 값이 높은 편이니 한 발은 걸치고 조심하라하워드 막스가 &ldquo;아직 거품은 아니지만 높은 편이니 한 발만 걸쳐라&rdquo;고 한 것과 같은 그림이다.rdquo;는 취지로 말한 것(보도 요약)과 같은 그림이다.
          </p>
          <p className={small}>구글 PER 14배는 공시 순이익에 스페이스X 등 지분 평가이익이 섞인 착시(본업 기준 약 26배) — 구글 화면 ① &lsquo;먼저 바로잡기&rsquo; 참고. 이익 성장·PER 변화는 각 종목 화면의 &lsquo;10년 보유 수익률 분해&rsquo;와 같은 계산(진행 중 구간).</p>
        </section>

        <section className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4 space-y-1.5">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">한계 — 꼭 알고 볼 것</h2>
          <ul className={`${small} list-disc pl-4 space-y-1`}>
            <li><b>생존 편향:</b> {d.note} 특히 &lsquo;바닥 무리&rsquo;에서 망한 회사가 빠져 있어 1무리 성적이 실제보다 좋게 나온다.</li>
            <li><b>사례가 적다:</b> 거품 꼭대기 사례는 사실상 한 번(1999~2000년)이다. 1970년대는 직전 10년 데이터가 없다. 세 번째 횡보장이 같은 모양일 거라는 보장은 없다.</li>
            <li>수익률은 배당 재투자 포함 10년 보유 연평균. 각 종목의 자세한 숫자는 종목 화면에 있다.</li>
            <li>공부 기록이며 매수·매도 권유가 아니다. 투자 판단과 책임은 본인에게 있다.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
