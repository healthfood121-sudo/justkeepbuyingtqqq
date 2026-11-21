import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import data from '@/public/data/slowdown.json'
import SlowdownCharts from './SlowdownCharts'

// 경기 둔화는 얼마나 클까 — 1971년 이후 나스닥100 하락장 21개를 다섯 유형으로 나누고, 유형마다 경기 지표가 어땠는지, 지금은 어느 쪽을 닮았는지.
// 데이터: scripts/export_macro_cycle.py(FRED·야후·쉴러, 매주 토요일 자동) → scripts/build_slowdown.py → slowdown.json. 서버에서 로그인 확인 뒤에만 그린다.

type Row = {
  key: string; type: string; cause: string; peak: string; trough: string; months: number; ndx: number; tqqq: number
  recoverMonths: number | null; recession: boolean; fedUpDuring: number | null; curveMin24: number | null
  creditUp: number | null; creditPeakVsTrough: number | null; unrUp: number | null; unrPeakLag: number | null
  cape: number | null; infl: number | null; tq3: number | null; tq5: number | null
}
type TypeSum = { note: string; n: number; ndx: number; tqqq: number; months: number; recoverMonths: number; fedUpDuring: number; curveMin24: number; creditUp: number; unrUp: number; cape: number; tq3: number; tq5: number; ndxRange: [number, number] }
type NowV = { month: string | null; v: number | null; [k: string]: number | string | null }
const D = data as unknown as {
  generated: string; rows: Row[]; types: Record<string, TypeSum>; now: Record<string, NowV>
  chart: Record<string, { start: string; v: (number | null)[] }>
  given: { dd: number; n: number; rows: [string, string, number, number][]; within5: number; deeper15: number; median: number } | null
  inversions: [string, boolean, string | null][]; sahm: [string, string | null][]
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
  const hyUp = N.BAMLH0A0HYM2?.v != null && N.BAMLH0A0HYM2?.min12 != null ? (N.BAMLH0A0HYM2.v as number) - (N.BAMLH0A0HYM2.min12 as number) : null
  const lvl = (v: number | null, y: number, r: number, rev = false): L => v == null ? 'n' : rev ? (v <= r ? 'r' : v <= y ? 'y' : 'g') : (v >= r ? 'r' : v >= y ? 'y' : 'g')
  const signals: { group: string; k: string; now: string; l: L; rule: string; why: string }[] = [
    { group: '일자리', k: '실업률 — 1년 최저 대비', now: `${f(N.UNRATE?.v, 1, '%')} (1년 최저 ${f(N.UNRATE?.low12 as number, 1, '%')}, ${f(unrUp, 1, '%p')})`, l: lvl(unrUp, 0.3, 0.5), rule: '+0.3%p 주의 · +0.5%p 경고', why: '침체 유형은 실업률이 중간값 +2.9%p, 둔화·금리 인상 유형은 +0.1~0.3%p. 가장 확실한 갈림길.' },
    { group: '일자리', k: '삼 규칙 지표', now: f(sahm, 2, '%p'), l: lvl(sahm, 0.3, 0.5), rule: '0.5 넘으면 침체 시작 신호', why: '1960년 이후 14번 켜졌고 대부분 침체 시작 0~4개월 뒤 — 예측이 아니라 "이미 시작됐다"는 확인용. 1976년·2024년 7월은 침체 없이 켜졌다.' },
    { group: '일자리', k: '실업수당 신규 청구 — 6개월 변화', now: `${N.ICSA?.v != null ? Math.round((N.ICSA.v as number) / 1000) + '천 건' : '—'} (${f(claims6, 1, '%')})`, l: lvl(claims6, 10, 20), rule: '+10% 주의 · +20% 경고', why: '매주 나오는 가장 빠른 일자리 지표. 해고가 늘면 먼저 오른다.' },
    { group: '신용', k: '회사채 신용 스프레드(BAA − 10년 국채) — 6개월 변화', now: `${f(N.CREDIT?.v, 2, '%p')} (${f(credit6, 2, '%p')})`, l: lvl(credit6, 0.3, 0.8), rule: '+0.3%p 주의 · +0.8%p 경고', why: '침체 유형은 하락장 동안 중간값 +1.6%p, 둔화·금리 인상 유형은 +0.03~0.2%p. 돈 빌리기 어려워지는지 보는 지표.' },
    { group: '신용', k: '하이일드(위험한 회사채) 스프레드 — 1년 최저 대비', now: `${f(N.BAMLH0A0HYM2?.v, 2, '%p')} (1년 최저 ${f(N.BAMLH0A0HYM2?.min12 as number, 2)}, ${f(hyUp, 2, '%p')})`, l: lvl(hyUp, 0.5, 1.5), rule: '+0.5%p 주의 · +1.5%p 경고', why: '드러켄밀러가 말한 "신용 스프레드 확대". FRED 공개 기록은 최근 3년치만 있다.' },
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

  const toc: [string, string][] = [['answer', '먼저 답부터'], ['types', '하락장 다섯 유형'], ['how', '유형을 가르는 법'], ['now', '지금 신호등'], ['given', '지금 낙폭에서 보면'], ['bottom', '바닥은 언제였나'], ['future', '미래를 알 수 있나'], ['all', '하락장 21개 전체'], ['charts', '그래프'], ['src', '데이터·출처']]

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

        <section id="types" className={box}>
          <h2 className={h2}>하락장 다섯 유형 — 1971년 이후 나스닥100 −15% 이상 21번</h2>
          <p className={small}>숫자는 유형별 중간값. TQ는 같은 기간 합성 TQQQ(나스닥100 3배, 비용·금리 반영) 낙폭. 유형은 원인을 보고 사람이 나눴다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-200 dark:border-gray-800">
                {['유형', '횟수', '나스닥100', '범위', 'TQ', '하락 기간', '회복까지', '실업률 상승', '신용 스프레드 상승', '금리 인상폭', '고점 때 CAPE', '바닥 뒤 TQ 3년'].map(h => <th key={h} className={th}>{h}</th>)}
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
                {['고점', '바닥', '유형', '원인', '나스닥100', 'TQ', '기간', '회복', '침체', '실업률', '신용', '금리 인상', 'CAPE', '바닥 뒤 TQ 3년·5년'].map(h => <th key={h} className={th}>{h}</th>)}
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
