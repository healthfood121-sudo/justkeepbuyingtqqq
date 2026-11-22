import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import data from '@/public/data/slowdown.json'
import SlowdownCharts, { WeeklyCharts, ClaimsChart } from './SlowdownCharts'

// 경기 둔화는 얼마나 클까 — 1971년 이후 나스닥100 하락장 21개를 다섯 유형으로 나누고, 유형마다 경기 지표가 어땠는지, 지금은 어느 쪽을 닮았는지.
// 데이터: scripts/export_macro_cycle.py(FRED·야후·쉴러, 매주 토요일 자동) → scripts/build_slowdown.py → slowdown.json. 서버에서 로그인 확인 뒤에만 그린다.

type Row = {
  key: string; type: string; cause: string; peak: string; trough: string; months: number; ndx: number; tqqq: number
  recoverMonths: number | null; recession: boolean; fedUpDuring: number | null; curveMin24: number | null
  creditUp: number | null; gzUp: number | null; ebpMax: number | null; creditPeakVsTrough: number | null; unrUp: number | null; unrPeakLag: number | null
  cape: number | null; infl: number | null; tq3: number | null; tq5: number | null
}
type TypeSum = { note: string; n: number; ndx: number; tqqq: number; months: number; recoverMonths: number; fedUpDuring: number; curveMin24: number; creditUp: number; gzUp: number; ebpMax: number; unrUp: number; cape: number; tq3: number; tq5: number; ndxRange: [number, number] }
type NowV = { month: string | null; v: number | null; [k: string]: number | string | null }
const D = data as unknown as {
  generated: string; rows: Row[]; types: Record<string, TypeSum>; now: Record<string, NowV>
  chart: Record<string, { start: string; v: (number | null)[] }>
  given: { dd: number; n: number; rows: [string, string, number, number][]; within5: number; deeper15: number; median: number } | null
  inversions: [string, boolean, string | null][]; sahm: [string, string | null][]
  analog: { month: string; now: Record<string, number>; top: [number, string, Record<string, number>, number | null, number | null, number | null, number | null, number | null, number | null, number | null, string | null][]; summary: { n: number; up12: number; med12: number | null; deep: number; rec2y: number } } | null
  check2000: { items: { k: string; t: string; rule: string; now: string; state: 'on' | 'near' | 'off'; y2000: string; asOf?: string }[]; coreOn: number; coreNear: number; splitState: string; verdict: string; ctx: { cape: number | null; capeMonth: string | null; fed3: number | null; g10: number | null; infl: number | null; defcyc6: number | null } } | null
  weekly: {
    HY?: { date: string; v: number; low52: number; lowDate: string; up52: number; chg13w: number; max52: number; band: string }
    BAA10Y?: { date: string; v: number; chg26w: number | null }
    ICSA?: { date: string; v: number; ma4: number; low52: number; upPct: number }
    CCSA?: { date: string; v: number; chg26wPct: number | null }
    HY_chart?: [string, number][]; BAA10Y_chart?: [string, number][]; ICSA_chart?: [string, number][]; ICSA_long?: [string, number, number][]; CCSA_long?: [string, number][]
    claimsHist?: [string, number, boolean, number][] | null
    wedge?: { anchorA: [string, number]; anchorB: [string, number]; slopeYr: number; lineNow: number; now: number; nowDate: string; status: string; aboveDone: number; levels: [number, string][]; peak6m: [string, number]; dropFromPeak: number; turned: boolean; hist: [string, string, number, number, boolean][] } | null
  }
}

const TYPES: [string, string, string][] = [
  ['soft', '① 둔화만', 'bg-emerald-500'],
  ['hike', '② 금리 인상 둔화', 'bg-sky-500'],
  ['crash', '③ 단기 폭락(사건)', 'bg-violet-500'],
  ['rec', '④ 경기침체', 'bg-amber-500'],
  ['bubble', '⑤ 침체 + 거품 붕괴', 'bg-red-600'],
]
const TNAME = Object.fromEntries(TYPES.map(t => [t[0], t[1]]))
const TDOT = Object.fromEntries(TYPES.map(t => [t[0], t[2]]))
const ym = (s: string | null | undefined) => s ? `${s.slice(0, 4)}년 ${Number(s.slice(5, 7))}월` : '—'
const f = (v: number | null | undefined, d = 1, suf = '') => v == null ? '—' : `${v > 0 && suf === '%p' ? '+' : ''}${v.toFixed(d)}${suf}`
type L = 'g' | 'y' | 'r' | 'n'
const LC: Record<L, string> = { g: 'bg-emerald-500', y: 'bg-amber-400', r: 'bg-red-500', n: 'bg-gray-300' }
const LT: Record<L, string> = { g: '괜찮음', y: '주의', r: '경고', n: '자료 없음' }

export default async function SlowdownPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')

  const box = 'rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 scroll-mt-20'
  const h2 = 'text-base font-bold text-gray-900 dark:text-white'
  const p = 'text-sm leading-relaxed text-gray-700 dark:text-gray-200'
  const small = 'text-xs leading-relaxed text-gray-500 dark:text-gray-400'
  const th = 'text-left py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500 break-keep whitespace-nowrap'
  const td = 'py-1.5 px-2 align-top text-gray-700 dark:text-gray-200 whitespace-nowrap'
  const N = D.now
  const T = D.types

  // ── 지금 신호등 (규칙은 아래 표의 과거 유형별 숫자에서 정했다) ──
  const unrUp = N.UNRATE?.v != null && N.UNRATE?.low12 != null ? (N.UNRATE.v as number) - (N.UNRATE.low12 as number) : null
  const sahm = N.SAHMREALTIME?.v ?? null
  const claims6 = N.ICSA?.chg6pct as number | null
  const credit6 = N.CREDIT?.chg6 as number | null
  const W = D.weekly ?? {}
  const hyUp = W.HY ? W.HY.up52 : N.BAMLH0A0HYM2?.v != null && N.BAMLH0A0HYM2?.min12 != null ? (N.BAMLH0A0HYM2.v as number) - (N.BAMLH0A0HYM2.min12 as number) : null
  const hyV = W.HY ? W.HY.v : (N.BAMLH0A0HYM2?.v ?? null)
  const hyL: L = hyV == null ? 'n' : (hyV >= 6 || (hyUp ?? 0) >= 1.5) ? 'r' : (hyV >= 5 || (hyUp ?? 0) >= 0.5) ? 'y' : 'g'
  const clUp = W.ICSA ? W.ICSA.upPct : null
  const ch = W.claimsHist ?? []
  const chHit = ch.filter(x => x[2]).length
  const lvl = (v: number | null, y: number, r: number, rev = false): L => v == null ? 'n' : rev ? (v <= r ? 'r' : v <= y ? 'y' : 'g') : (v >= r ? 'r' : v >= y ? 'y' : 'g')
  const signals: { group: string; k: string; now: string; l: L; rule: string; why: string }[] = [
    { group: '일자리', k: '실업률 — 1년 최저 대비', now: `${f(N.UNRATE?.v, 1, '%')} (1년 최저 ${f(N.UNRATE?.low12 as number, 1, '%')}, ${f(unrUp, 1, '%p')})`, l: lvl(unrUp, 0.3, 0.5), rule: '+0.3%p 주의 · +0.5%p 경고', why: '침체 유형은 실업률이 중간값 +2.9%p, 둔화·금리 인상 유형은 +0.1~0.3%p. 가장 확실한 갈림길.' },
    { group: '일자리', k: '삼 규칙 지표', now: f(sahm, 2, '%p'), l: lvl(sahm, 0.3, 0.5), rule: '0.5 넘으면 침체 시작 신호', why: '1960년 이후 14번 켜졌고 대부분 침체 시작 0~4개월 뒤 — 예측이 아니라 "이미 시작됐다"는 확인용. 1976년·2024년 7월은 침체 없이 켜졌다.' },
    W.ICSA
      ? { group: '일자리', k: `실업수당 신규 청구 4주 평균 — 1년 최저 대비 (주간, ${W.ICSA.date})`, now: `${(W.ICSA.ma4 / 10000).toFixed(1)}만 건 (최저 ${(W.ICSA.low52 / 10000).toFixed(1)}만, ${f(clUp, 1, '%')})`, l: lvl(clUp, 10, 20), rule: '+10% 주의 · +20% 경고', why: `매주 목요일 발표 — 가장 빠른 일자리 지표. 1967년 이후 +20%를 넘은 ${ch.length}번 중 ${chHit}번이 침체와 겹쳤다(거짓 경보는 허리케인·일시 해고 때).` }
      : { group: '일자리', k: '실업수당 신규 청구 — 6개월 변화', now: `${N.ICSA?.v != null ? Math.round((N.ICSA.v as number) / 1000) + '천 건' : '—'} (${f(claims6, 1, '%')})`, l: lvl(claims6, 10, 20), rule: '+10% 주의 · +20% 경고', why: '매주 나오는 가장 빠른 일자리 지표. 해고가 늘면 먼저 오른다.' },
    ...(W.CCSA ? [{ group: '일자리', k: `실업수당 계속 청구 — 6개월 변화 (주간, ${W.CCSA.date})`, now: `${(W.CCSA.v / 10000).toFixed(0)}만 명 (${f(W.CCSA.chg26wPct, 1, '%')})`, l: lvl(W.CCSA.chg26wPct, 10, 20) as L, rule: '+10% 주의 · +20% 경고', why: '실업 상태가 계속되는 사람 수 — 일자리를 다시 찾기 어려워지는지.' }] : []),
    { group: '신용', k: '회사채 신용 스프레드(BAA − 10년 국채) — 6개월 변화', now: W.BAA10Y ? `${f(W.BAA10Y.v, 2, '%p')} (${f(W.BAA10Y.chg26w, 2, '%p')}, 일간 ${W.BAA10Y.date})` : `${f(N.CREDIT?.v, 2, '%p')} (${f(credit6, 2, '%p')})`, l: lvl(W.BAA10Y?.chg26w ?? credit6, 0.3, 0.8), rule: '+0.3%p 주의 · +0.8%p 경고', why: '침체 유형은 하락장 동안 중간값 +1.6%p, 둔화·금리 인상 유형은 +0.03~0.2%p. 돈 빌리기 어려워지는지 보는 지표.' },
    ...(N.GZ?.v != null ? [{ group: '신용', k: `연준 GZ 회사채 스프레드 — 1년 최저 대비 (${ym(N.GZ.month)})`, now: `${f(N.GZ.v, 2, '%p')} (1년 최저 ${f(N.GZ.low12 as number, 2)}, ${f((N.GZ.v as number) - (N.GZ.low12 as number), 2, '%p')}) · 1973년 이후 하위 ${N.GZ.pctile}%`, l: lvl((N.GZ.v as number) - (N.GZ.low12 as number), 0.3, 0.8) as L, rule: '+0.3%p 주의 · +0.8%p 경고', why: `하이일드 옛 기록(FRED는 최근 3년만) 대신 보는 1973년~ 긴 신용 지표(연준 길크리스트·자크라이섹). 하락장 동안 침체형은 중간값 +${T.rec.gzUp}%p, 거품 붕괴형 +${T.bubble.gzUp}%p, 금리 인상형 +${T.hike.gzUp}%p.${N.GZ.lowSince ? ` 올해 바닥(${f(N.GZ.low12 as number, 2)})은 ${ym(N.GZ.lowSince as string)} 이후 가장 낮았다.` : ''}` }] : []),
    ...(N.EBP?.v != null ? [{ group: '신용', k: `초과 채권 프리미엄(EBP) · 연준 12개월 침체 확률 (${ym(N.EBP.month)})`, now: `${f(N.EBP.v, 2)} · 확률 ${f((N.EBPPROB?.v ?? 0) * 100, 0, '%')}`, l: (((N.EBPPROB?.v ?? 0) >= 0.5 || (N.EBP.v as number) >= 0.5) ? 'r' : ((N.EBPPROB?.v ?? 0) >= 0.3 || (N.EBP.v as number) >= 0) ? 'y' : 'g') as L, rule: 'EBP 0 이상 또는 확률 30% 주의 · EBP 0.5 또는 확률 50% 경고', why: '회사 부도 위험으로 설명되지 않는 "겁"의 크기. 0보다 낮으면 투자자들이 위험을 잘 받아 준다는 뜻. 2001·2008·2020년 침체 시작 때 0.75~1.19.' }] : []),
    { group: '신용', k: `하이일드(위험한 회사채) 스프레드 — 수준과 1년 최저 대비${W.HY ? ` (일간, ${W.HY.date})` : ''}`, now: `${f(hyV, 2, '%')} · ${W.HY?.band ?? ''} (1년 최저 ${f(W.HY?.low52 ?? (N.BAMLH0A0HYM2?.min12 as number), 2)}, ${f(hyUp, 2, '%p')})`, l: hyL, rule: '수준 5% 또는 +0.5%p 주의 · 6% 또는 +1.5%p 경고', why: '드러켄밀러가 말한 "신용 스프레드 확대". 2018·2022년(침체 없음)은 5~6%에서 멈췄고, 침체 때는 8~20%까지 갔다(아래 주간 체크).' },
    { group: '금리', k: '10년 국채 금리', now: f(N.GS10?.v, 2, '%'), l: lvl(N.GS10?.v ?? null, 4.5, 5), rule: '4.5% 주의 · 5% 경고', why: '높은 장기 금리는 주식 값(PER)을 누른다. 2022년 금리 인상 하락장이 −36%였다.' },
    { group: '금리', k: '기준금리 — 1년 변화', now: `${f(N.FEDFUNDS?.v, 2, '%')} (${f(N.FEDFUNDS?.chg12 as number, 2, '%p')})`, l: lvl(N.FEDFUNDS?.chg12 as number, 0.5, 1.5), rule: '+0.5%p 주의 · +1.5%p 경고', why: '금리 인상 유형의 하락장 전후 인상폭 중간값 4%p. 월평균 자료라 최근 인상이 늦게 잡힌다.' },
    { group: '금리', k: '10년 − 3개월 금리차(최근 2년 최저)', now: `${f(N.CURVE?.v, 2, '%p')} (최저 ${f(N.CURVE?.min24 as number, 2)})`, l: (N.CURVE?.min24 as number) < 0 ? 'y' : 'g', rule: '최근 2년 안에 역전(0 아래)이 있었으면 주의', why: '1960년 이후 역전 10번 중 8번이 2년 안에 침체. 2022년 11월 역전은 침체 없이 끝났다 — 지금까지 가장 큰 예외.' },
    { group: '물가', k: '물가 상승률(전년 대비)', now: f(N.INFL?.v, 1, '%'), l: lvl(N.INFL?.v ?? null, 3, 4), rule: '3% 주의 · 4% 경고', why: '물가가 높으면 연준이 경기가 식어도 금리를 못 내린다 — 하락장이 길어지는 조건.' },
    { group: '시장', k: '방어주 ÷ 경기민감주 — 6개월 변화', now: f(N.DEFCYC?.chg6pct as number, 1, '%'), l: lvl(N.DEFCYC?.chg6pct as number, 5, 10), rule: '+5% 주의 · +10% 경고', why: '필수소비재·유틸리티·헬스케어 ÷ 임의소비재·산업재·소재. 드러켄밀러가 2027년 하반기 둔화를 걱정한 근거.' },
    { group: '시장', k: '변동성 지수(VIX)', now: f(N.VIX?.v, 1), l: lvl(N.VIX?.v ?? null, 25, 35), rule: '25 주의 · 35 경고', why: '공포의 크기. 바닥 근처에서 크게 뛰는 경우가 많다.' },
    { group: '값', k: 'S&P 500 경기조정 PER(쉴러 CAPE)', now: `${f(N.CAPE?.v, 1)}배 (${ym(N.CAPE?.month)} 자료)`, l: lvl(N.CAPE?.v ?? null, 25, 30), rule: '25배 주의 · 30배 경고', why: '같은 침체라도 값이 비쌀 때 시작하면 훨씬 깊게 빠졌다(2000년 43배 → −83%). 쉴러 자료가 2023년 9월에서 멈춰 있어 최신이 아니다.' },
  ]
  const red = (g: string) => signals.filter(s => s.group === g && s.l === 'r').length
  const yellow = (g: string) => signals.filter(s => s.group === g && s.l === 'y').length
  const jobBad = red('일자리') > 0, jobWarn = yellow('일자리') > 0
  const creditBad = red('신용') > 0, creditWarn = yellow('신용') > 0
  const rateBad = red('금리') + red('물가') > 0
  const pricey = (N.CAPE?.v ?? 0) >= 30
  const verdict = jobBad && creditBad
    ? (pricey ? { t: 'bubble', s: '일자리와 신용이 함께 무너지는 중 + 값이 비쌈 → ⑤ 거품 붕괴형 위험' } : { t: 'rec', s: '일자리와 신용이 함께 무너지는 중 → ④ 경기침체형' })
    : (jobBad || creditBad)
      ? { t: 'rec', s: '일자리나 신용 중 하나가 무너지기 시작 → ④ 경기침체형으로 넘어가는 중일 수 있음' }
      : rateBad
        ? { t: 'hike', s: '일자리·신용은 아직 버티고, 금리·물가가 문제 → ② 금리 인상 둔화형에 가장 가까움' }
        : { t: 'soft', s: '일자리·신용·금리 모두 큰 문제 없음 → ① 둔화만 또는 ③ 사건형에 가까움' }

  const toc: [string, string][] = [['answer', '먼저 답부터'], ['y2000', '2000년형 체크리스트'], ['weekly', '매주 볼 두 줄'], ['types', '하락장 다섯 유형'], ['how', '유형을 가르는 법'], ['now', '지금 신호등'], ['given', '지금 낙폭에서 보면'], ['analog', '닮은 시기'], ['bottom', '바닥은 언제였나'], ['future', '미래를 알 수 있나'], ['all', '하락장 21개 전체'], ['charts', '그래프'], ['src', '데이터·출처']]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">시장 공부 · 지표 {D.generated} 자동 갱신(매주 토요일)</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">경기 둔화는 얼마나 클까 — 하락장 다섯 유형과 지금 신호</h1>
          <p className={p}>
            드러켄밀러는 2027년 하반기 경기 둔화를 경계했다. 시장은 경기보다 먼저 움직이니, 중요한 건 <b>&quot;그 둔화가 어떤 종류이고 얼마나 클까&quot;</b>다.
            1971년 이후 나스닥100이 고점에서 15% 넘게 빠진 <b>21번</b>을 다섯 유형으로 나누고, 유형마다 일자리·신용·금리·값이 어땠는지, 지금은 어느 쪽을 닮았는지 정리했다.
          </p>
          <nav className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {toc.map(([id, t]) => <a key={id} href={`#${id}`} className="text-blue-600 dark:text-blue-400 hover:underline">{t}</a>)}
          </nav>
        </div>

        <section id="answer" className={box}>
          <h2 className={h2}>먼저 답부터</h2>
          <ul className={`${p} list-disc pl-5 space-y-1.5`}>
            <li><b>크기를 가르는 건 &quot;일자리가 무너지느냐&quot;와 &quot;값이 비쌌느냐&quot; 두 가지다.</b> 실업률이 오르지 않으면 금리를 올려도 나스닥100은 보통 −16~−36%에서 멈췄다(중간값 −23%). 실업률이 1년 최저보다 1%포인트 넘게 오르고 신용 스프레드가 벌어지면 침체형(−25~−33%), 거기에 값까지 비쌌으면 거품 붕괴형(−54~−83%)이었다.</li>
            <li><b>지금({ym(N.NDX?.month)}) 판정: {verdict.s}.</b> 나스닥100은 최근 1년 고점보다 약 {f(N.NDX?.fromHigh12 as number, 0, '%')}(월말 기준). 실업률은 1년 최저 그대로, 실업수당 청구는 낮고, BAA 회사채 스프레드는 오히려 좁아졌다(하이일드만 1년 최저보다 {f(hyUp, 1, '%p')} 벌어짐). 대신 10년 금리 {f(N.GS10?.v, 1, '%')}·물가 {f(N.INFL?.v, 1, '%')}가 높고, 방어주가 6개월 동안 경기민감주보다 {f(N.DEFCYC?.chg6pct as number, 0, '%')} 앞섰다 — 드러켄밀러가 짚은 그 신호.</li>
            <li><b>그래서 범위로 보면:</b> 금리 인상 둔화형으로 끝나면 과거 기준 총 −20~−36%(지금보다 조금 더), 2027년 하반기에 일자리가 꺾여 침체형으로 넘어가면 −25~−35%, AI 투자 열기까지 꺼지는 거품 붕괴형이면 −50% 이상. 과거에 지금 낙폭(약 {f(D.given?.dd, 0, '%')})을 지난 하락장 {D.given?.n}번의 최종 깊이 중간값은 <b>{f(D.given?.median, 0, '%')}</b>였다.</li>
            <li><b>미래를 정확히 알 수는 없다</b> — 그러나 &quot;어느 유형으로 가고 있는지&quot;는 일자리·신용 지표로 몇 달 안에 꽤 선명해진다. 예측보다 <b>확인하며 대응</b>하는 쪽이 과거에 더 잘 맞았다(아래 &quot;미래를 알 수 있나&quot;).</li>
          </ul>
        </section>



        {D.check2000 && (() => { const C = D.check2000; const st = { on: ['bg-red-500', '켜짐'], near: ['bg-amber-400', '가까워짐'], off: ['bg-emerald-500', '꺼짐'] } as const; return (
        <section id="y2000" className={box}>
          <h2 className={h2}>2000년형 체크리스트 — AI 거품이 꺼지며 침체로 가는가</h2>
          <p className={p}>가설: <b>거품은 AI·큰 기술주에만 끼었고, 그게 꺼지면서 큰 우량주가 이끌던 강세장이 끝난다</b>(2000~2002년형: 나스닥100 −83%, 30개월, 그동안 가치주·중소형주는 선방). 아래 ①~③ 중 <b>2개가 켜지면</b> 2000년형 쪽으로 무게를 옮기고, ④는 &quot;AI만 거품&quot; 구도가 맞는지 확인하는 칸이다. 매주 자동 갱신(③은 직접 적는 칸).</p>
          <div className={`rounded-lg p-3 text-sm font-semibold ${C.coreOn >= 2 ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' : C.coreOn === 1 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200'}`}>
            판정: {C.verdict} · 구도 확인(④): {st[C.splitState as 'on' | 'near' | 'off'][1]}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['', '항목', '지금', '켜지는 기준', '2000년엔'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {C.items.map(c => (
                  <tr key={c.k} className="border-b border-gray-100 dark:border-gray-900">
                    <td className={td}><span className={`inline-block w-2.5 h-2.5 rounded-full ${st[c.state][0]}`} /> <span className="text-[10px] text-gray-500">{st[c.state][1]}</span></td>
                    <td className={`${td} whitespace-normal font-semibold min-w-[9rem]`}>{c.t}</td>
                    <td className={`${td} whitespace-normal min-w-[14rem]`}>{c.now}{c.asOf ? <span className="text-gray-400"> ({c.asOf} 확인)</span> : null}</td>
                    <td className={`${td} whitespace-normal text-gray-500 min-w-[12rem]`}>{c.rule}</td>
                    <td className={`${td} whitespace-normal text-gray-500 min-w-[10rem]`}>{c.y2000}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">배경 조건(점수에는 안 넣음)</p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              [`시장 값(CAPE) ${f(C.ctx.cape, 0)}배`, `2000년 43배 · ${ym(C.ctx.capeMonth)} 자료`],
              [`기준금리 3개월 ${f(C.ctx.fed3, 2, '%p')}`, '1999~2000년 연준 인상 중 거품이 꺾임'],
              [`10년 금리 ${f(C.ctx.g10, 1, '%')}`, '2000년 1월 약 6.7%'],
              [`물가 ${f(C.ctx.infl, 1, '%')}`, '2000년 약 3%대'],
              [`방어주÷경기민감주 6개월 ${f(C.ctx.defcyc6, 0, '%')}`, '거품 뒤 돈이 방어주로'],
            ].map(([a, b]) => <span key={a} className="px-2 py-1 rounded border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">{a} <span className="text-gray-400">· {b}</span></span>)}
          </div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">2000년형에 거는 사람의 TQ 규칙</p>
          <ul className={`${p} list-disc pl-5 space-y-1`}>
            <li><b>2000년 장에서는 −30·−40·−50%에서 산 TQ가 모두 거의 0이 됐다.</b> 200일 이동평균 회복 신호도 2000년엔 가짜 신호 세 번이 다 0. 나눠 사기 시작점을 −50% 아래로, 그것도 작게.</li>
            <li><b>시간 조건:</b> 2000년 바닥은 고점 30개월 뒤, 침체 시작 19개월 뒤였다. 고점이 2026년 가을이면 비슷한 바닥은 2028~29년.</li>
            <li><b>바닥 확인:</b> 하이일드·GZ 스프레드가 꼭대기를 찍고 꺾이고, 실업률이 이미 오른 뒤(2002년 10월 모양).</li>
            <li><b>그동안 들 것:</b> AI 거품과 거리가 먼 우량주(에르메스·유나이티드헬스 등). 단 값이 비싼 우량주는 같이 끌려 내려갈 수 있다.</li>
            <li><b>경계:</b> &quot;지금은 2000년&quot;은 흔한 이야기다. 1996년 &quot;비이성적 과열&quot;부터 꼭대기까지 3년 넘게 걸렸다 — 결론을 정하고 걸기보다 켜지는 신호만큼 비중을 옮긴다.</li>
          </ul>
          <p className={small}>④의 비율 흐름은 아래 그래프 ⑤(나스닥100÷S&amp;P 500, 동일가중÷시가총액가중)에서 볼 수 있다. ③을 켜려면 scripts/build_slowdown.py의 CAPEX에 날짜·내용을 적는다.</p>
        </section>) })()}

        <section id="weekly" className={box}>
          <h2 className={h2}>매주 볼 두 줄 — 하이일드 스프레드와 실업수당 청구</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1">
              <p className="text-xs text-gray-500">하이일드 스프레드 {W.HY ? `(${W.HY.date})` : ''}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{f(hyV, 2, '%')} <span className="text-sm font-medium text-gray-500">{W.HY?.band}</span></p>
              {W.HY && <p className={small}>1년 최저 {W.HY.low52.toFixed(2)}%({W.HY.lowDate})보다 <b>+{W.HY.up52.toFixed(2)}%p</b>, 3개월 {f(W.HY.chg13w, 2, '%p')}. 바닥을 찍고 올라오는 중 — 아직 수준은 낮다.</p>}
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1">
              <p className="text-xs text-gray-500">실업수당 신규 청구 4주 평균 {W.ICSA ? `(${W.ICSA.date})` : ''}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{W.ICSA ? `${(W.ICSA.ma4 / 10000).toFixed(1)}만 건` : '—'} <span className="text-sm font-medium text-gray-500">{W.ICSA ? `1년 최저 대비 ${f(clUp, 1, '%')}` : ''}</span></p>
              <p className={small}>+10%면 주의, +20%면 경고. 해고가 늘기 시작하면 여기서 가장 먼저 보인다.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['', '하이일드 스프레드', '실업수당 청구(4주 평균, 1년 최저 대비)', '읽는 법'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  ['g', '5% 아래, 1년 최저 +0.5%p 아래', '+10% 아래', '신용·일자리 모두 괜찮음'],
                  ['y', '5% 넘거나 1년 최저 +0.5%p 이상', '+10~20%', '약한 회사부터 조여지는 중 — 금리 인상 둔화형(2018·2022년)도 여기까지 왔다'],
                  ['r', '6% 넘거나 +1.5%p 이상', '+20% 이상', '돈줄이 실제로 막히는 중 — 둘이 함께 오면 침체형 쪽으로'],
                ].map(([l, a, b, c]) => (
                  <tr key={l} className="border-b border-gray-100 dark:border-gray-900">
                    <td className={td}><span className={`inline-block w-2.5 h-2.5 rounded-full ${LC[l as L]}`} /></td>
                    <td className={`${td} whitespace-normal`}>{a}</td><td className={`${td} whitespace-normal`}>{b}</td><td className={`${td} whitespace-normal`}>{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">하이일드 스프레드 — 과거 꼭대기</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['시기', '꼭대기', '결과'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    ['2007년 6월(바닥)', '2.42%', '여기서 올라가기 시작 → 금융위기'],
                    ['2008년 12월', '21.44%(월말 약 20)', '침체 + 거품 붕괴, 나스닥100 −54%'],
                    ['2002년 10월', '11.14%', '침체 + 거품 붕괴, −83%'],
                    ['2020년 3월', '월말 8.64%(하루 최고 약 10.9)', '짧은 침체, −28%'],
                    ['2016년 2월', '월말 약 8%', '유가 폭락, 침체 없음, −16%'],
                    ['2022년 여름', '월말 약 5.9%', '금리 인상, 침체 없음, −36%'],
                    ['2018년 12월', '월말 약 5.3%', '금리 인상, 침체 없음, −23%'],
                    ['2025년 4월', '월말 3.94%(하루 최고 4.61)', '관세 폭락, 침체 없음, −23%'],
                  ].map(r => <tr key={r[0]} className="border-b border-gray-100 dark:border-gray-900">{r.map((c, i) => <td key={i} className={`${td} whitespace-normal`}>{c}</td>)}</tr>)}
                </tbody>
              </table>
              <p className={small}>ICE BofA 미국 하이일드 스프레드. 2023년 11월 이후는 FRED 일간 자료, 그 전은 트레이딩뷰 월봉 차트(사용자 제공)에서 읽은 값이다(FRED는 최근 3년치만 공개하고, 옛 버전 보관소 ALFRED도 막혀 있다). 그래서 1973년~ 긴 기록은 연준 GZ 회사채 스프레드로 대신 본다 — 아래 그래프 ④.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">실업수당 청구 +20% 신호의 성적(1967년~)</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['처음 넘은 주', '상승', '4주 평균', '침체?'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {ch.map(([d, up, hit, ma]) => (
                    <tr key={d} className="border-b border-gray-100 dark:border-gray-900">
                      <td className={td}>{d}</td><td className={td}>+{up}%</td><td className={td}>{(ma / 10000).toFixed(1)}만</td>
                      <td className={td}>{hit ? <span className="text-red-600 dark:text-red-400 font-semibold">침체</span> : <span className="text-gray-400">아님</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={small}>{ch.length}번 중 {chHit}번이 침체(신호 전 3개월~뒤 12개월 안)와 겹쳤다. 거짓 경보는 1972·1977·1984년, 2005년(허리케인 카트리나), 2017년(허리케인 하비·어마), 2023년. 주로 일시적인 사건이라 1~2주 튄 뒤 내려왔다 — 몇 주 이어지는지가 중요하다.</p>
            </div>
          </div>
          <p className={p}><b>읽는 법:</b> 하이일드만 오르고 실업수당 청구가 조용하면 2018·2022년처럼 금리 때문에 값이 내려가는 하락(−23~−36%)에 가깝다. <b>하이일드가 6%를 넘고 실업수당 청구 4주 평균이 1년 최저보다 20% 넘게 오른 상태가 몇 주 이어지면</b> 침체형 쪽으로 대비한다 — 지금 값이 비싸서(CAPE 30배대) 그때는 더 깊을 수 있다.</p>
          {W.wedge && <div className="rounded-lg border border-pink-200 dark:border-pink-900/60 p-3 space-y-2">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">하이일드 월봉 쐐기 — 위쪽 추세선 돌파 확인</p>
            <p className={small}>월봉 차트에 그은 선을 숫자로 옮겼다. 위쪽 추세선 = 2020년 3월 월말 꼭대기 {W.wedge.anchorA[1]}%와 2025년 4월 월말 꼭대기 {W.wedge.anchorB[1]}%를 잇는 직선(로그 눈금, 해마다 약 {Math.abs(W.wedge.slopeYr)}%씩 낮아짐). 2022년 꼭대기(약 5.9%)도 이 선에 닿는다 — 세 번 닿은 선. 아래쪽은 30년 동안 뚫리지 않은 바닥대 2.42~2.62%.</p>
            <div className="grid sm:grid-cols-3 gap-2 text-sm">
              <div className="rounded bg-gray-50 dark:bg-gray-900 p-2"><p className="text-[11px] text-gray-500">지금({W.wedge.nowDate})</p><p className="font-bold text-gray-900 dark:text-white">{W.wedge.now.toFixed(2)}%</p></div>
              <div className="rounded bg-gray-50 dark:bg-gray-900 p-2"><p className="text-[11px] text-gray-500">이번 달 추세선</p><p className="font-bold text-gray-900 dark:text-white">{W.wedge.lineNow.toFixed(2)}% <span className="text-xs font-medium text-gray-500">({f(W.wedge.now - W.wedge.lineNow, 2, '%p')})</span></p></div>
              <div className={`rounded p-2 ${W.wedge.aboveDone >= 1 || W.wedge.now > W.wedge.lineNow ? 'bg-pink-50 dark:bg-pink-950/40' : 'bg-gray-50 dark:bg-gray-900'}`}><p className="text-[11px] text-gray-500">판정</p><p className="font-semibold text-gray-900 dark:text-white text-xs">{W.wedge.status}</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['최근 월말', '종가', '추세선', ''].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>{W.wedge.hist.slice(-8).map(([m, d, v, ln, up]) => (
                  <tr key={m} className="border-b border-gray-100 dark:border-gray-900"><td className={td}>{m}{d.slice(8) < '28' ? ` (${d.slice(5)} 현재)` : ''}</td><td className={td}>{v.toFixed(2)}%</td><td className={td}>{ln.toFixed(2)}%</td><td className={td}>{up ? <span className="text-pink-600 dark:text-pink-400 font-semibold">선 위</span> : <span className="text-gray-400">선 아래</span>}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">다음 자리(지금과의 거리)</p>
            <div className="flex flex-wrap gap-1.5">
              {W.wedge.levels.map(([v, nm]) => (
                <span key={nm} className={`text-xs px-2 py-1 rounded border ${v > W.wedge!.now ? 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200' : 'border-gray-100 dark:border-gray-900 text-gray-400'}`}>
                  {v.toFixed(2)}% {nm} <span className="text-gray-400">({f(v - W.wedge!.now, 2, '%p')})</span>
                </span>
              ))}
            </div>
            <p className={small}><b>꼭대기 후 꺾임 신호:</b> 최근 6개월 꼭대기 {W.wedge.peak6m[1].toFixed(2)}%({W.wedge.peak6m[0]})에서 {W.wedge.dropFromPeak.toFixed(2)}%p 내려옴 — {W.wedge.turned ? <b className="text-emerald-600 dark:text-emerald-400">켜짐(1년 최저보다 1%p 넘게 오른 뒤 0.5%p 넘게 꺾임) — 2018년 12월·2020년 3월·2022년 7월처럼 주가 바닥 근처였던 모양</b> : '아직 아님(1년 최저보다 1%p 넘게 오른 뒤 0.5%p 넘게 꺾여야 켜짐)'}.</p>
            <ul className={`${small} list-disc pl-4 space-y-0.5`}>
              <li><b>시나리오 B(가장 흔했음):</b> 5% 안팎까지 → 다시 2.6~3% 근처로 → 몇 년 뒤 큰 위기. 2018년(5.3 → 3.4), 2022년(5.9 → 3)이 이 모양.</li>
              <li><b>시나리오 A(드묾):</b> 곧장 10~20%. 30년 동안 2002년(11.14)·2008년(21.44) 두 번 — 둘 다 값이 비싼 채 침체가 겹쳤다. 실업수당 청구 +20%가 함께 켜지는지로 가른다.</li>
              <li><b>돌파 실패:</b> 월말 종가가 다시 추세선 아래로 내려오면 하락도 얕을 가능성이 크다.</li>
            </ul>
          </div>}
          {W.HY_chart && <WeeklyCharts hy={W.HY_chart ?? []} baa={W.BAA10Y_chart ?? []} wedge={W.wedge ? { anchorA: W.wedge.anchorA, anchorB: W.wedge.anchorB } : null} />}
          {W.ICSA_long && <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 p-3 space-y-2">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">실업수당 청구 차트 — 바닥선과 돌파선</p>
            <p className={small}>하이일드 추세선처럼 보는 법: 초록 선(1년 최저)이 바닥, 빨간 점선(바닥 +20%)이 돌파선이다. 파란 4주 평균이 바닥에 붙어 있으면 해고가 적은 것이고, 빨간 점선 위로 올라가 몇 주 머물면 일자리가 깨지기 시작한 것이다. 점은 1967년 이후 처음 +20%를 넘은 주 — 빨강은 침체와 겹친 경우, 회색은 거짓 경보(허리케인 등).</p>
            <ClaimsChart long={W.ICSA_long} ccsa={W.CCSA_long ?? []} rec={D.chart.USREC} signals={W.claimsHist ?? []} />
          </div>}
        </section>

        <section id="types" className={box}>
          <h2 className={h2}>하락장 다섯 유형 — 1971년 이후 나스닥100 −15% 이상 21번</h2>
          <p className={small}>숫자는 유형별 중간값. TQ는 같은 기간 합성 TQQQ(나스닥100 3배, 비용·금리 반영) 낙폭. 유형은 원인을 보고 사람이 나눴다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">
                {['유형', '횟수', '나스닥100', '범위', 'TQ', '하락 기간', '회복까지', '실업률 상승', '신용 스프레드 상승', 'GZ 스프레드 상승', '금리 인상폭', '고점 때 CAPE', '바닥 뒤 TQ 3년'].map(h => <th key={h} className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {TYPES.map(([k, name, dot]) => { const s = T[k]; return (
                  <tr key={k} className="border-b border-gray-100 dark:border-gray-900">
                    <td className={td}><span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${dot}`} />{name}</td>
                    <td className={td}>{s.n}</td>
                    <td className={`${td} font-semibold`}>{s.ndx}%</td>
                    <td className={td}>{s.ndxRange?.[1]}~{s.ndxRange?.[0]}%</td>
                    <td className={td}>{s.tqqq}%</td>
                    <td className={td}>{s.months}개월</td>
                    <td className={td}>{s.recoverMonths}개월</td>
                    <td className={td}>{f(s.unrUp, 1, '%p')}</td>
                    <td className={td}>{f(s.creditUp, 2, '%p')}</td>
                    <td className={td}>{f(s.gzUp, 2, '%p')}</td>
                    <td className={td}>{f(s.fedUpDuring, 1, '%p')}</td>
                    <td className={td}>{f(s.cape, 0)}배</td>
                    <td className={td}>{f(s.tq3, 1)}배</td>
                  </tr>) })}
              </tbody>
            </table>
          </div>
          <ul className={`${small} list-disc pl-5 space-y-1`}>
            {TYPES.map(([k, name]) => <li key={k}><b>{name}</b> — {T[k].note}. 예: {D.rows.filter(r => r.type === k).map(r => `${r.peak.slice(0, 4)}년(${r.ndx}%)`).join(', ')}</li>)}
          </ul>
          <p className={small}>실업률 상승 = 고점 전 1년 최저 → 바닥 뒤 1년 안 최고. 신용 스프레드 = BAA 회사채 금리 − 10년 국채 금리, 고점 → 바닥 뒤 3개월 안 최고. 금리 인상폭 = 고점 전후 기준금리 최저 → 최고. 회복까지 = 바닥이 아니라 고점에서 다시 고점까지.</p>
        </section>

        <section id="how" className={box}>
          <h2 className={h2}>유형을 가르는 법 — 세 가지 질문</h2>
          <p className={p}>질문하신 대로, 지금은 &quot;둔화만&quot;보다 &quot;금리 인상 둔화&quot;에 가깝고, 경기침체나 거품 붕괴로 번질 수도 있다. 그 갈림길을 과거 숫자로 보면 이렇다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['질문', '아니면', '그렇다면', '과거 숫자', '지금'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-900">
                  <td className={`${td} whitespace-normal font-semibold`}>① 일자리가 무너지나?<br /><span className="font-normal text-gray-400">실업률 1년 최저 대비 +0.5%p, 실업수당 +20%</span></td>
                  <td className={`${td} whitespace-normal`}>둔화·금리 인상·사건형<br />(중간값 −17~−23%)</td>
                  <td className={`${td} whitespace-normal`}>침체형 이상<br />(−25% 이하)</td>
                  <td className={`${td} whitespace-normal`}>침체 없는 하락장 14번 중 실업률 +1%p 넘은 건 2번(1989·1992년, 직전 침체의 여파). 침체 7번은 모두 +1.8%p 이상.</td>
                  <td className={`${td} whitespace-normal`}>{jobBad ? '⚠ 무너지는 중' : jobWarn ? '주의' : '아직 아니다'} — 실업률 {f(unrUp, 1, '%p')}, 삼 지표 {f(sahm, 2)}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-900">
                  <td className={`${td} whitespace-normal font-semibold`}>② 돈줄(신용)이 막히나?<br /><span className="font-normal text-gray-400">BAA 스프레드 6개월 +0.8%p</span></td>
                  <td className={`${td} whitespace-normal`}>시장 안의 조정</td>
                  <td className={`${td} whitespace-normal`}>기업 부도·해고로 번짐</td>
                  <td className={`${td} whitespace-normal`}>침체 없는 하락장의 신용 스프레드 상승 중간값 +0.03~0.36%p(최대 1998년 +0.96). 침체·거품형은 +0.6~+4.1%p(2008년).</td>
                  <td className={`${td} whitespace-normal`}>{creditBad ? '⚠ 벌어지는 중' : creditWarn ? '주의' : '아직 아니다'} — BAA {f(credit6, 2, '%p')}, 하이일드 {f(hyUp, 2, '%p')}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-900">
                  <td className={`${td} whitespace-normal font-semibold`}>③ 시작할 때 값이 비쌌나?<br /><span className="font-normal text-gray-400">CAPE 30배 이상</span></td>
                  <td className={`${td} whitespace-normal`}>침체여도 −25~−33%</td>
                  <td className={`${td} whitespace-normal`}>침체와 겹치면 거품 붕괴형(−54~−83%)</td>
                  <td className={`${td} whitespace-normal`}>2000년(CAPE 43배) −83%, 2007년(27배, 신용 거품) −54%. 반대로 1980·1981년(9배)은 침체에도 −25~−29%. 단, 비싸도 침체가 없으면 2021년(39배)처럼 −36%에서 멈췄다.</td>
                  <td className={`${td} whitespace-normal`}>{pricey ? '비싸다' : '보통'} — CAPE {f(N.CAPE?.v, 0)}배({ym(N.CAPE?.month)})</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={p}><b>정리:</b> ①·②가 둘 다 &quot;아니다&quot;인 동안은 금리 때문에 값(PER)만 내려가는 하락이다 — 과거엔 −16~−36%. ①·②가 켜지면 이익까지 줄어드는 침체형이고, 그때 ③이 &quot;비싸다&quot;면 거품 붕괴형까지 열어 둬야 한다. 지금은 ①·② 모두 꺼져 있고 ③은 켜져 있다 — <b>그래서 &quot;당장은 금리 인상 둔화형, 2027년 일자리가 꺾이면 큰 하락으로 번질 수 있는 상태&quot;</b>로 읽힌다.</p>
        </section>

        <section id="now" className={box}>
          <h2 className={h2}>지금 신호등 ({ym(N.FEDFUNDS?.month)} 무렵 자료)</h2>
          <div className={`rounded-lg p-3 text-sm font-semibold ${verdict.t === 'bubble' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' : verdict.t === 'rec' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300'}`}>
            자동 판정: {verdict.s}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['', '지표', '지금', '기준', '왜 보나'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {signals.map(s => (
                  <tr key={s.k} className="border-b border-gray-100 dark:border-gray-900">
                    <td className={td}><span className={`inline-block w-2.5 h-2.5 rounded-full ${LC[s.l]}`} title={LT[s.l]} /></td>
                    <td className={`${td} whitespace-normal`}><span className="text-gray-400">{s.group} · </span>{s.k}</td>
                    <td className={`${td} font-semibold`}>{s.now}</td>
                    <td className={`${td} whitespace-normal text-gray-500`}>{s.rule}</td>
                    <td className={`${td} whitespace-normal text-gray-500`}>{s.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={small}>월별 자료라 1~2개월 늦다. 기준선은 위 유형 표의 과거 숫자에서 정한 것으로, 맞고 틀림이 보장된 규칙은 아니다. 판정 규칙: 일자리·신용 둘 다 경고 → 침체형(값까지 비싸면 거품 붕괴형), 하나만 경고 → 침체형으로 넘어가는 중, 둘 다 괜찮고 금리·물가 경고 → 금리 인상 둔화형.</p>
        </section>

        {D.given && <section id="given" className={box}>
          <h2 className={h2}>지금 낙폭({f(D.given.dd, 0, '%')})을 지난 하락장들은 어디까지 갔나</h2>
          <p className={p}>1971년 이후 하락장 21번 중 <b>{D.given.n}번</b>이 지금 낙폭을 지났다. 그중 <b>{D.given.within5}번</b>은 거기서 5%포인트 안에서 멈췄고, <b>{D.given.deeper15}번</b>은 15%포인트 넘게 더 빠졌다. 최종 깊이 중간값 <b>{D.given.median}%</b>.</p>
          <div className="flex flex-wrap gap-1.5">
            {[...D.given.rows].sort((a, b) => b[2] - a[2]).map(([k, t, n, tq]) => (
              <span key={k} className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200">
                <span className={`inline-block w-2 h-2 rounded-full mr-1 ${TDOT[t]}`} />{k.slice(0, 4)} {n}% <span className="text-gray-400">TQ {tq}%</span>
              </span>
            ))}
          </div>
          <p className={small}>얕게 멈춘 쪽은 대부분 둔화·사건형, 깊게 간 쪽은 침체·거품형과 2021년(금리 인상 + 비싼 값)이다. 결국 앞의 세 질문으로 돌아간다.</p>
        </section>}


        {D.analog && <section id="analog" className={box}>
          <h2 className={h2}>지금과 가장 닮은 과거 — 그 뒤 어떻게 됐나</h2>
          <p className={small}>지표 10개(나스닥100 1년 고점 대비, 10년−3개월 금리차와 최근 2년 최저, BAA 회사채 스프레드와 6개월 변화, 실업률 1년 최저 대비, 물가, 기준금리 1년 변화, 10년 금리, CAPE)를 표준화해 {ym(D.analog.month)} 값과 가장 가까운 달을 1972~2024년에서 찾았다(서로 18개월 넘게 떨어진 달만). 매주 자동으로 다시 계산된다.</p>
          <p className={p}><b>닮은 {D.analog.summary.n}개 중 {D.analog.summary.up12}개는 1년 뒤 나스닥100이 올라 있었다(중간값 {f(D.analog.summary.med12, 0, '%')}). 하지만 {D.analog.summary.deep}개는 2년 안에 25% 넘게 더 빠졌고, {D.analog.summary.rec2y}개는 2년 안에 침체가 왔다.</b> 같은 숫자에서 결과가 크게 갈렸다 — 갈래를 정한 건 그 뒤의 물가·일자리였다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">
                {['닮은 달', '거리', '나스닥100 낙폭', '10년 금리', '물가', 'BAA 스프레드', '실업률 변화', 'CAPE', '나스닥100 6·12·24개월 뒤', 'TQ 12·24개월 뒤', '2년 안 최저(나스닥100·TQ)', '2년 안 침체'].map(h => <th key={h} className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-blue-50/60 dark:bg-blue-950/30">
                  <td className={`${td} font-semibold`}>지금</td><td className={td}>—</td>
                  <td className={td}>{f(D.analog.now.dd, 0, '%')}</td><td className={td}>{f(D.analog.now.g10, 1, '%')}</td><td className={td}>{f(D.analog.now.infl, 1, '%')}</td>
                  <td className={td}>{f(D.analog.now.cr, 2)}</td><td className={td}>{f(D.analog.now.unr, 1, '%p')}</td><td className={td}>{f(D.analog.now.cape, 0)}</td>
                  <td className={td} colSpan={4}>?</td>
                </tr>
                {D.analog.top.map(([dist, m, x, n6, n12, n24, t12, t24, low, tlow, rec]) => (
                  <tr key={m} className="border-b border-gray-100 dark:border-gray-900">
                    <td className={`${td} font-semibold`}>{ym(m)}</td><td className={td}>{dist.toFixed(2)}</td>
                    <td className={td}>{f(x.dd, 0, '%')}</td><td className={td}>{f(x.g10, 1, '%')}</td><td className={td}>{f(x.infl, 1, '%')}</td>
                    <td className={td}>{f(x.cr, 2)}</td><td className={td}>{f(x.unr, 1, '%p')}</td><td className={td}>{f(x.cape, 0)}</td>
                    <td className={td}>{[n6, n12, n24].map(v => v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`).join(' · ')}</td>
                    <td className={td}>{[t12, t24].map(v => v == null ? '—' : `${v > 0 ? '+' : ''}${v}%`).join(' · ')}</td>
                    <td className={`${td} ${(low ?? 0) <= -25 ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>{f(low, 0, '%')} · {f(tlow, 0, '%')}</td>
                    <td className={td}>{rec ? ym(rec) : '없음'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={small}>거리가 작을수록 닮았다. 10개뿐이라 운이 크게 작용한다 — &quot;지금이 무엇이다&quot;를 정해 주는 표가 아니라 &quot;어떤 갈래가 가능한지&quot;를 보여 주는 표다.</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">숫자뿐 아니라 사정까지 보면 (2026년 11월 정리)</p>
          <ul className={`${p} list-disc pl-5 space-y-1.5`}>
            <li><b>가장 닮은 곳: 2018년 4분기 ~ 2022년 사이.</b> 일자리는 멀쩡한데 금리 때문에 값이 내려가고, 하이일드는 3%대 바닥에서 고개를 든다. 2018년은 하이일드 5.3%에서 멈췄고 연준이 인상을 멈추자 바로 반등. 2022년은 물가 때문에 연준이 못 멈춰 하이일드 6%, 나스닥100 −36%.</li>
            <li><b>조심할 갈래: 1973년형.</b> 비싼 값 + 물가 + 긴축이 겹친 뒤 침체로 −48%(TQ −91%). 위 표에서 크게 빠진 1973·2000·2021년의 공통점은 값이 비쌌고(당시 기준), 물가나 금리 때문에 연준이 몰렸다는 것 — 지금도 CAPE 30배대, 10년 금리 5%대, 물가 4% 안팎이라 이 조건에 걸린다.</li>
          </ul>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">{['그 뒤 벌어진 일', '결과', '통했던 접근'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  ['물가가 잡혀 연준이 멈춤(2018년, 1990년 뒤)', '−20%대에서 바닥, 1~2년 뒤 크게 반등', '−20~−25%부터 나눠 사기'],
                  ['물가 때문에 계속 긴축, 일자리는 버팀(2022년)', '−36%, 고점 회복 약 2년', '서두르면 TQ −80%. 하이일드 꼭대기(약 6%) 근처에서 넣은 쪽이 좋았다'],
                  ['긴축 끝에 일자리까지 깨짐(1973년, 2000년)', '−48~−83%, 회복에 수년', 'TQ는 작게, 실업수당 청구가 오르면 더 기다림'],
                ].map(r => <tr key={r[0]} className="border-b border-gray-100 dark:border-gray-900">{r.map((c, i) => <td key={i} className={`${td} whitespace-normal`}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <p className={p}><b>지금 기준 실전:</b> 일자리·우량 회사채가 조용한 동안은 1·2번 갈래 — −20~−25%부터 나눠 사되 한 번에 다 넣지 않는다. 하이일드 5~6% 돌파, BAA 스프레드 6개월 +0.5%p 이상, 실업수당 4주 평균 +20% 중 하나라도 켜지면 남은 몫을 −35~−50%로 미룬다.</p>
        </section>}

        <section id="bottom" className={box}>
          <h2 className={h2}>바닥은 언제였나 — 실업률을 기다리면 늦는다</h2>
          <ul className={`${p} list-disc pl-5 space-y-1.5`}>
            <li><b>주가 바닥은 실업률 꼭대기보다 먼저 왔다.</b> 침체·거품형 7번에서 실업률이 가장 높았던 때는 주가 바닥 뒤 {D.rows.filter(r => r.type === 'rec' || r.type === 'bubble').map(r => r.unrPeakLag).filter(x => x != null).sort((a, b) => (a as number) - (b as number)).join('·')}개월(중간값 약 8개월). &quot;실업률이 나빠지는 걸 보고 사겠다&quot;면 바닥은 이미 지나 있다.</li>
            <li><b>대신 신용 스프레드 꼭대기와 거의 같았다.</b> 같은 7번에서 신용 스프레드가 가장 넓었던 때는 주가 바닥 뒤 {D.rows.filter(r => r.type === 'rec' || r.type === 'bubble').map(r => r.creditPeakVsTrough).join('·')}개월. 스프레드가 꺾여 좁아지기 시작하면 바닥 근처였다.</li>
            <li><b>TQ에게는 유형이 전부다.</b> 침체·거품형 바닥에서 산 TQ는 5년 뒤 2.5~16배였지만, 그 바닥을 맞히기 전에 −60~−100%를 먼저 지나야 했다. 반대로 1997~1998년처럼 거품 직전의 작은 하락에서 산 TQ는 5년 뒤 0.03~0.19배 — 다음 거품 붕괴에 다 날아갔다.</li>
            <li><b>실전 규칙으로 바꾸면:</b> ① 둔화·금리 인상형으로 보이는 동안(일자리·신용 괜찮음)은 −20~−30%에서 나눠 산다. ② 일자리·신용이 켜지면 더 깊이(−35~−50%) 기다리고, 신용 스프레드가 꼭대기를 찍고 꺾이는 것을 보며 늘린다. ③ 값이 비싼 채 침체로 가면 2000년처럼 2년 넘게 갈 수 있으니 TQ 비중을 작게.</li>
          </ul>
        </section>

        <section id="future" className={box}>
          <h2 className={h2}>미래를 알 수 있나? — 정말로?</h2>
          <p className={p}><b>정확한 시점과 깊이는 거의 못 맞힌다. 하지만 &quot;어느 쪽으로 가고 있는지&quot;는 꽤 알 수 있다.</b> 기록이 그렇게 말한다.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1.5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">못 맞히는 것</p>
              <ul className={`${small} list-disc pl-4 space-y-1`}>
                <li><b>전문가 예측:</b> IMF 연구(2018)에 따르면 1992~2014년 63개국의 침체 153번 중 그 전해 4월까지 예측된 건 5번뿐이었다.</li>
                <li><b>금리차 역전:</b> 1960년 이후 {D.inversions.length}번 역전({D.inversions.map(i => i[0].slice(0, 4)).join('·')}) 중 {D.inversions.filter(i => i[1]).length}번이 2년 안에 침체. 하지만 역전에서 침체까지 6~17개월로 들쭉날쭉했고, 2022년 11월의 가장 긴 역전은 침체 없이 끝났다.</li>
                <li><b>삼 규칙:</b> {D.sahm.length}번 켜진 것 중 대부분은 침체가 이미 시작된 뒤였다(확인용). 2024년 7월에는 침체 없이 켜졌다.</li>
                <li><b>시장 자체:</b> &quot;주식시장은 지난 다섯 번의 침체를 아홉 번 예측했다&quot;(경제학자 폴 새뮤얼슨) — 하락장 21번 중 침체가 온 건 7번뿐이다.</li>
              </ul>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1.5">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">알 수 있는 것</p>
              <ul className={`${small} list-disc pl-4 space-y-1`}>
                <li><b>유형은 몇 달 안에 드러난다.</b> 침체형으로 갈 때는 실업수당 청구·신용 스프레드가 주가 바닥 전에 먼저 움직였다. 매주·매월 지표를 보면 &quot;지금 어느 유형으로 가는지&quot;를 확인할 수 있다.</li>
                <li><b>값이 크기를 정한다.</b> 시작할 때 비쌌는지는 지금 알 수 있는 숫자다 — 같은 침체라도 비싸면 두세 배 깊었다.</li>
                <li><b>바닥 근처의 모습도 비슷했다.</b> 공포(VIX)가 치솟고, 신용 스프레드가 꼭대기를 찍고, 실업률은 아직 오르는 중.</li>
                <li><b>드러켄밀러의 방식도 이것이다:</b> 확신이 없을 땐 작게, 손익과 지표가 맞아 들어가면 크게. 예측이 아니라 확인하며 크기를 조절한다.</li>
              </ul>
            </div>
          </div>
          <p className={p}><b>그래서 이 페이지의 쓰임새:</b> &quot;다음에 −40%가 온다&quot;를 맞히려는 게 아니라, 매주 신호등을 보고 <b>지금 하락이 어느 유형으로 가고 있는지</b>에 맞춰 TQ를 살 깊이와 크기를 바꾸는 것.</p>
        </section>

        <section id="all" className={box}>
          <h2 className={h2}>하락장 21개 전체</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">
                {['고점', '바닥', '유형', '원인', '나스닥100', 'TQ', '기간', '회복', '침체', '실업률', '신용', 'GZ', '금리 인상', 'CAPE', '바닥 뒤 TQ 3년·5년'].map(h => <th key={h} className={th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {D.rows.map(r => (
                  <tr key={r.key} className="border-b border-gray-100 dark:border-gray-900">
                    <td className={td}>{r.peak}</td>
                    <td className={td}>{r.trough}</td>
                    <td className={td}><span className={`inline-block w-2 h-2 rounded-full mr-1 ${TDOT[r.type]}`} />{TNAME[r.type]}</td>
                    <td className={`${td} whitespace-normal min-w-[14rem]`}>{r.cause}</td>
                    <td className={`${td} font-semibold`}>{r.ndx}%</td>
                    <td className={td}>{r.tqqq}%</td>
                    <td className={td}>{r.months}개월</td>
                    <td className={td}>{r.recoverMonths != null ? `${r.recoverMonths}개월` : '—'}</td>
                    <td className={td}>{r.recession ? '○' : ''}</td>
                    <td className={td}>{f(r.unrUp, 1, '%p')}</td>
                    <td className={td}>{f(r.creditUp, 2, '%p')}</td>
                    <td className={td}>{f(r.gzUp, 2, '%p')}</td>
                    <td className={td}>{f(r.fedUpDuring, 1, '%p')}</td>
                    <td className={td}>{f(r.cape, 0)}</td>
                    <td className={td}>{f(r.tq3, 1)} · {f(r.tq5, 1)}배</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={small}>나스닥100·TQ는 사이트의 합성 일간 가격(1971년~, TQ는 3배 + 비용·차입 금리 반영). 2000~2002년 하락 안의 2007~2009년 하락은 따로 뗐다(2000년 고점은 2015년에야 회복). 회복 = 고점에서 다시 고점까지. 2025년 이후 자료는 짧아 바닥 뒤 수익이 비어 있다.</p>
        </section>

        <section id="charts" className={box}>
          <h2 className={h2}>그래프 — 회색 띠가 경기침체</h2>
          <SlowdownCharts chart={D.chart} />
        </section>

        <section id="src" className={box}>
          <h2 className={h2}>데이터·출처</h2>
          <ul className={`${small} list-disc pl-5 space-y-0.5 break-all`}>
            <li>미국 세인트루이스 연준 FRED: 경기침체 기간(USREC), 기준금리(FEDFUNDS), 국채 금리(GS10·TB3MS·GS2), BAA 회사채(BAA), 하이일드 스프레드(BAMLH0A0HYM2, 최근 3년만 공개), 실업률(UNRATE), 삼 규칙(SAHMREALTIME), 실업수당 청구(ICSA), 물가(CPIAUCSL), 산업생산, 소비자심리, 침체 확률, 구리, 금융여건지수, 주택 허가 — <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://fred.stlouisfed.org" target="_blank" rel="noopener noreferrer">fred.stlouisfed.org</a></li>
            <li>연준 GZ 회사채 스프레드·초과 채권 프리미엄(EBP)·12개월 침체 확률(1973년~): <a className="text-blue-600 dark:text-blue-400 hover:underline" href="https://www.federalreserve.gov/econres/notes/feds-notes/ebp_csv.csv" target="_blank" rel="noopener noreferrer">federalreserve.gov ebp_csv.csv</a> (Gilchrist·Zakrajšek)</li>
            <li>야후 파이낸스: 나스닥100·S&amp;P 500·VIX·업종 ETF(XLP·XLU·XLV·XLY·XLI·XLB)·RSP·SPY 월말 종가</li>
            <li>로버트 쉴러 경기조정 PER(CAPE): <a className="text-blue-600 dark:text-blue-400 hover:underline" href="http://www.econ.yale.edu/~shiller/data.htm" target="_blank" rel="noopener noreferrer">예일대 자료</a> — 2023년 9월 이후 갱신이 멈춰 있다</li>
            <li>IMF 연구: An, Jalles, Loungani, &quot;How Well Do Economists Forecast Recessions?&quot;(2018)</li>
            <li>드러켄밀러 발언: 2026년 11월 인터뷰(사용자가 공유한 영상·스레드 요약)</li>
            <li>유형 분류·원인 메모는 이 사이트가 붙인 것이다. 자동 갱신: 매주 토요일 <code>export-macro-cycle</code> 워크플로 → <code>scripts/build_slowdown.py</code>.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
