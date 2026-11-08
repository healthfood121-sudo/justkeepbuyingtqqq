'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PB, HISTORY, CALLS, COST } from './cocoData'

// 바이타 코코(COCO) 심층 리포트 — 종목 분석 화면(PrivateApp) 안에 함께 보여 준다.
// "유행으로 끝날 음료인가, 오래 살아남을 음료인가"
// 숫자 출처: 회사 실적 발표·SEC 공시(매출총이익률 2021~2024), 컨퍼런스콜(2026년 2·3분기), CAGNY 2026 발표 보도.
// 2025년 매출총이익률은 외부 집계 자료라 '약'으로 표시. 시나리오 숫자는 추정.

type Light = 'g' | 'y' | 'r'
const LIGHT: Record<Light, { dot: string; txt: string }> = {
  g: { dot: 'bg-emerald-500', txt: '좋음' },
  y: { dot: 'bg-amber-400', txt: '지켜볼 것' },
  r: { dot: 'bg-red-500', txt: '약점' },
}

const PLAN: { q: string; why: string; how: string; now: string; l: Light }[] = [
  { q: '① 코코넛워터라는 범주 자체가 계속 커지나?', why: '1위 회사도 범주가 줄면 같이 줄어든다(탄산수·오렌지주스 사례).', how: '시장 크기와 소매 판매 성장률, 몇 년째 이어지는지.',
    now: '미국 코코넛워터 소매 시장 약 16억 달러, 2026년 판매액 +28%·유럽 +66%. 2000년대 중반 거의 없던 범주가 20년 동안 커졌다.', l: 'g' },
  { q: '② 아직 안 마셔 본 사람이 많은가?', why: '유행은 "살 사람은 다 샀을 때" 꺾인다. 새 고객이 계속 들어오는지가 핵심.', how: '가구 침투율(한 번이라도 사는 집 비율), 성장 중 새 가구 비중.',
    now: '미국 브랜드 성장의 절반~3분의 2가 새로 사는 가구에서 나온다(회사 발표). 회사가 마지막으로 숫자를 밝힌 2022년 기준 바이타 코코를 사는 집은 미국 가구의 약 11%(해마다 +1.7%포인트) — 회사는 오렌지·크랜베리 주스보다 훨씬 낮다고 강조한다. 넓어질 여지가 크다.', l: 'g' },
  { q: '③ 한 번 산 사람이 계속 사나?', why: '유행 음료는 첫 구매는 많고 재구매가 약하다(비욘드미트·블루에이프런과 같은 함정).', how: '기존 가구의 구매 빈도, 재구매율.',
    now: '성장의 약 3분의 1은 기존 가구가 더 자주 사서 나온다. 다만 회사가 재구매율 숫자를 자세히 공개하지 않아 확인이 제한적.', l: 'y' },
  { q: '④ 왜 마시나 — 이유가 일상적인가?', why: '"갈증·수분·카페인"처럼 매일 반복되는 이유는 오래 가고, "SNS에서 유명해서"는 금방 식는다.', how: '소비 이유(수분 보충, 운동, 천연, 칵테일·요리 재료), 마시는 상황이 넓어지는지.',
    now: '수분·전해질 보충(스포츠 음료 대체), 짧은 성분표의 천연 음료, 운동 뒤 회복 — 모두 반복되는 일상 수요. 아이용·스포츠 맛 제품으로 마시는 상황을 넓히는 중.', l: 'g' },
  { q: '⑤ 그 범주에서 1위가 얼마나 단단한가?', why: '범주가 커져도 1위가 밀리면 소용없다.', how: '점유율 추이, 유통사 자체 브랜드(PB)와의 관계.',
    now: '미국 점유율 43%(2021년 초) → 49%(2021년 말) → 51%(2022년, 회사 발표). 2026년 투자 설명회 보도는 약 42%(집계 기준 차이일 수 있어 추이 확인 필요). 영국은 80% 넘음(2025년 콜). PB가 크지만 바이타 코코가 그 PB를 만들어 납품한다 — 범주가 커지면 어느 쪽으로 팔려도 몫을 가져간다.', l: 'y' },
  { q: '⑥ 거대 음료 회사가 들어오면?', why: '작은 브랜드가 무너지는 가장 흔한 길.', how: '과거 대형사 진입 때 무슨 일이 있었나.',
    now: '이미 한 번 이겼다. 2009~2013년 펩시(원)·코카콜라(지코)가 들어왔지만, 코카콜라는 2020년 지코를 접었고 바이타 코코는 1위를 지켰다. 2017년엔 펩시가 인수를 타진했다.', l: 'g' },
  { q: '⑦ 원가와 공급이 버티나?', why: '좋은 브랜드도 원가 구조가 약하면 이익이 흔들린다.', how: '매출총이익률 변동, 원료 산지·운임·설비.',
    now: '가장 큰 약점. 원료가 코코넛 하나이고 산지(필리핀·브라질·태국)에서 배로 실어 온다. 2022년 운임 폭등 때 매출총이익률 24%, EPS 0.14달러로 무너졌다. 설비는 늘 수요보다 늦다.', l: 'r' },
  { q: '⑧ 경영진과 돈 쓰는 방식은?', why: '창업자가 남아 있고 빚 없이 자사주를 사는 회사가 위기에 강하다.', how: '부채, 자사주, 인수의 질, 창업자 지분.',
    now: '창업자 마이크 커번이 회장, 맥주 회사(보스턴 비어) CEO 출신 마틴 로퍼가 CEO. 빚 없음, 2026년 자사주 7,000만 달러, 첫 대형 인수(코프라)는 지금까지 계획대로.', l: 'g' },
  { q: '⑨ 값은 적정한가?', why: '좋은 회사도 비싸게 사면 나쁜 투자.', how: 'PER과 평소 PER, 이익 성장 대비 값.',
    now: '주가 약 62달러, PER 31.5배(평소 39배), 3년 고점 대비 −26%. 싸진 편이지만 음료 회사치고는 여전히 높은 기대가 들어 있다.', l: 'y' },
]

const NUM: { y: string; rev: string; gm: string; eps: string }[] = [
  { y: '2020', rev: '3.11', gm: '—', eps: '0.56' },
  { y: '2021', rev: '약 3.8', gm: '29.8%', eps: '0.35' },
  { y: '2022', rev: '4.28', gm: '24.2%', eps: '0.14' },
  { y: '2023', rev: '4.94', gm: '36.6%', eps: '0.79' },
  { y: '2024', rev: '5.16', gm: '39%', eps: '0.94' },
  { y: '2025', rev: '6.10', gm: '약 36~37%', eps: '1.19' },
  { y: '2026(전망)', rev: '8.1~8.2', gm: '약 40%(2분기 관세 환급 포함)', eps: '최근 1년 1.98' },
]

const PEERS: { name: string; fate: string; why: string; l: Light }[] = [
  { name: '게토레이(스포츠 음료)', fate: '1965년 대학 연구실에서 시작 → 60년 동안 스포츠 음료의 표준.', why: '운동 중 수분·전해질이라는 매일 반복되는 이유. 범주를 처음 만든 1위가 끝까지 지켰다.', l: 'g' },
  { name: '레드불·몬스터(에너지 음료)', fate: '1990년대 "이상한 음료"에서 시작 → 거대 범주로.', why: '카페인이라는 습관성 수요. 1위들이 범주를 키우며 가격 결정력을 가졌다.', l: 'g' },
  { name: '라크로이(탄산수)', fate: '2010년대 폭발적 인기 → 범주는 남았지만 1위 브랜드는 몇 년째 매출 정체(내셔널 베버리지).', why: '범주가 "일상"이 되자 경쟁 브랜드·PB가 쉽게 따라 했다. 범주가 산다고 1위가 계속 크는 건 아니다.', l: 'y' },
  { name: '비타민워터', fate: '코카콜라가 2007년 약 41억 달러에 인수 → 설탕 논란 뒤 판매 감소.', why: '"건강해 보이는 설탕물"이라는 인식이 퍼지자 이유가 사라졌다. 건강 이미지가 핵심인 음료는 성분 논란에 약하다.', l: 'r' },
  { name: '프라임(인플루언서 이온음료)', fate: '2022년 출시 직후 품절 대란 → 2024년부터 판매 급감 보도.', why: '수요의 이유가 "유명인이 만들어서"였다. 전형적인 유행.', l: 'r' },
  { name: '오렌지주스', fate: '수십 년 동안 일상 음료 → 2000년대부터 미국 소비가 꾸준히 감소.', why: '원료가 곧 범주인 음료도 "당이 많다"는 인식이 바뀌면 줄어든다. 코코넛워터에도 천연 당이 있다는 점을 기억할 것.', l: 'y' },
]

const SCEN: { name: string; l: Light; story: string; eps: string; pe: string; ret: string }[] = [
  { name: '좋은 그림', l: 'g', story: '미국 가구 침투율이 10%대에서 주스류 수준으로 올라가고, 유럽(미국보다 약 10년 뒤처진 시장)이 미국의 길을 따라온다. 설비가 수요를 따라잡고 운임은 평소 수준. "코코넛워터의 몬스터"가 되는 길.', eps: 'EPS 연 15% → 10년 뒤 약 8달러', pe: 'PER 30배', ret: '연 약 14%' },
  { name: '기본 그림', l: 'y', story: '범주는 계속 크지만 속도가 한 자릿수 후반으로 느려지고, PB가 몫을 늘린다. 운임에 따라 이익이 해마다 들쭉날쭉.', eps: 'EPS 연 10% → 약 5.1달러', pe: 'PER 25배', ret: '연 약 7~8%' },
  { name: '나쁜 그림', l: 'r', story: '탄산수처럼 범주가 "흔한 음료"가 되며 가격 경쟁, PB가 브랜드를 잠식. 또는 당·성분 논란으로 건강 이미지가 흔들린다. 운임 충격이 반복된다.', eps: 'EPS 연 3% → 약 2.7달러', pe: 'PER 15배', ret: '연 약 −4%' },
]

const WARN: { k: string; ok: string; bad: string }[] = [
  { k: '바이타 코코 브랜드 판매량(상자 기준)', ok: '연 +8% 이상', bad: '두 분기 연속 +5% 아래 → 범주 포화 신호' },
  { k: '성장 중 새 가구 비중', ok: '절반 이상', bad: '새 가구가 거의 늘지 않는다 → "살 사람은 다 샀다"' },
  { k: '미국 점유율', ok: '40% 안팎 유지', bad: '35% 아래로 → 1위가 밀린다' },
  { k: 'PB(유통사 자체 브랜드) 비중', ok: '25~30% 안팎', bad: '빠르게 커지며 브랜드 매출 감소 → 가격 결정력 약화' },
  { k: '매출총이익률', ok: '35~40%', bad: '30% 아래가 두 분기 넘게 → 원가 구조 문제' },
  { k: '가격 인상 뒤 판매량', ok: '인상 뒤에도 판매량 증가', bad: '판매량 감소 → 수요가 생각보다 약하다' },
  { k: '해외(영국·독일) 성장', ok: '+20% 이상', bad: '한 자릿수 → 미국 밖 확장 실패' },
  { k: '경영진 행동', ok: '자사주 매입, 창업자 지분 유지', bad: '창업자·경영진의 대량 매도, 무리한 대형 인수' },
]

const sec = 'space-y-2'
const h2 = 'text-base font-semibold text-gray-900 dark:text-white'
const p = 'text-sm leading-relaxed text-gray-700 dark:text-gray-200'
const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
const B = ({ t }: { t: string }) => <>{t.split(/\*\*(.+?)\*\*/g).map((x, i) => i % 2 ? <b key={i}>{x}</b> : x)}</>
const CH: Record<string, string> = { start: 'bg-gray-400', crisis: 'bg-red-500', win: 'bg-emerald-500', now: 'bg-blue-500' }
const CHL: Record<string, string> = { start: '시작', crisis: '난관', win: '돌파', now: '지금' }
const Dot = ({ l }: { l: Light }) => <span className={`inline-block w-2.5 h-2.5 rounded-full ${LIGHT[l].dot} shrink-0 mt-1`} title={LIGHT[l].txt} />

export default function CocoReport() {
  const [openQ, setOpenQ] = useState<string | null>('2026년 3분기')
  const [allQ, setAllQ] = useState(false)
  return (
    <div id="coco-report" className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 scroll-mt-20">
      <article className="px-3 sm:px-5 py-6 space-y-10">
        <header className="space-y-2">
          <p className="text-xs text-gray-400">심층 리포트 · 2026-11-08 기준</p>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">바이타 코코(COCO) — 유행으로 끝날까, 오래 살아남을까?</h2>
          <p className={p}>
            음료는 수천 가지가 나왔다 사라진다. 이 리포트는 &ldquo;바이타 코코가 좋은 회사인가&rdquo;보다 먼저 <b>&ldquo;코코넛워터가 10년 뒤에도 사람들이 마시는 음료일까&rdquo;</b>를 따진다.
            아래 9가지 질문으로 쪼개서 답하고, 20년 역사(어떻게 경쟁에서 이기고 위기를 넘었나)와 상장 뒤 21개 분기의 실적·컨퍼런스콜을 모두 훑은 다음, 비슷한 음료들이 걸어간 길과 비교해 10년 시나리오와 &ldquo;유행이 꺼지는 신호&rdquo; 체크리스트로 마무리한다.
          </p>
        </header>

        {/* 결론 먼저 */}
        <section className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-2">
          <h2 className={h2}>결론 먼저</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>잠깐 유행하다 사라질 제품일 가능성은 낮다.</b> 20년 동안 범주가 커져 왔고, 2010년대 초 코카콜라·펩시가 들어왔다 나간 뒤에도 1위를 지켰다. 지금도 성장의 절반 이상이 처음 사는 가구에서 나오고, 사는 집은 아직 미국 가구의 10%대로 추정된다 — 유행 정점의 모습이 아니다.</li>
            <li><b>그렇다고 코카콜라 같은 거대 복리 기업이 될 가능성도 낮다.</b> 원료가 코코넛 하나, 산지는 바다 건너, 매대에서는 유통사 PB와 경쟁한다. 이익이 운임 하나에 크게 흔들린다(2022년 EPS 0.14달러).</li>
            <li><b>그래서 판단은 &ldquo;커지는 범주의 1위 소비재 성장주&rdquo;.</b> 비중은 작게, 운임 충격이나 공급 문제로 주가가 빠질 때 나눠 담고, 분기마다 아래 &ldquo;유행 경고 신호&rdquo; 8가지를 확인한다.</li>
          </ul>
        </section>


        <nav className="flex flex-wrap gap-1.5 text-xs">
          {[['#pb', 'PB란?'], ['#plan', '분석 계획 9가지'], ['#history', '20년 역사'], ['#how', '어떻게 이겼나'], ['#peers', '유행일까?'], ['#cost', '운임·원료 분석'], ['#calls', '전 분기 실적·콜'], ['#why15', '왜 15%로 보나'], ['#scen', '10년 시나리오'], ['#warn', '유행 경고 신호']].map(([h, t]) => (
            <a key={h} href={h} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">{t}</a>
          ))}
        </nav>

        <section id="pb" className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-2 scroll-mt-20">
          <h2 className={h2}>{PB.title}</h2>
          <ul className="space-y-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {PB.lines.map((l, i) => <li key={i}><B t={l} /></li>)}
          </ul>
        </section>

        {/* 분석 계획 */}
        <section id="plan" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>1. 분석 계획 — 음료 회사를 볼 때 던질 9가지 질문</h2>
          <p className={small}>음료가 오래 살아남는지는 &ldquo;맛있다&rdquo;보다 <b>범주 크기·새 고객·재구매·마시는 이유·1위의 힘·원가</b>가 정한다. 질문마다 왜 중요한지, 무엇으로 확인하는지, 지금 답이 무엇인지 적었다.</p>
          <div className="space-y-2">
            {PLAN.map(x => (
              <div key={x.q} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex gap-2"><Dot l={x.l} /><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{x.q} <span className="text-[11px] font-normal text-gray-400">{LIGHT[x.l].txt}</span></h3></div>
                <p className={`${small} mt-1`}><b>왜 중요한가:</b> {x.why}</p>
                <p className={small}><b>무엇으로 확인하나:</b> {x.how}</p>
                <p className="text-xs leading-relaxed text-gray-800 dark:text-gray-100 mt-0.5"><b>지금 답:</b> {x.now}</p>
              </div>
            ))}
          </div>
          <p className={small}>정리하면 초록 5개, 노랑 3개, 빨강 1개(원가·공급). <b>수요 쪽은 튼튼하고, 약점은 공급 쪽</b>에 있다 — 유행 음료와는 반대 모습이다. 유행 음료는 보통 수요가 약하고 공급은 쉽다.</p>
        </section>

        {/* 20년 역사와 숫자 */}
        <section id="history" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>2. 20년 역사 — 바에서 시작해 범주의 주인이 되기까지</h2>
          <p className={small}>창업 이야기와 경쟁, 위기와 회복을 시기별로 나눴다. 빨간 점은 난관, 초록 점은 돌파.</p>
          <div className="space-y-3">
            {HISTORY.map(c => (
              <div key={c.years} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${CH[c.kind]}`} />
                  <span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400">{c.years}</span>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                  <span className="text-[10px] text-gray-400">{CHL[c.kind]}</span>
                </div>
                {c.story.map((t, i) => <p key={i} className={small}>{t}</p>)}
                <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300"><b>교훈:</b> {c.lesson}</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 pt-1">숫자로 본 상장 전후</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-1">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1.5 px-2 font-medium">연도</th><th className="text-right py-1.5 px-2 font-medium">매출(억 달러)</th><th className="text-right py-1.5 px-2 font-medium">매출총이익률</th><th className="text-right py-1.5 px-2 font-medium">EPS(달러)</th></tr></thead>
              <tbody>
                {NUM.map(r => (
                  <tr key={r.y} className="border-b border-gray-100 dark:border-gray-900 text-gray-700 dark:text-gray-200">
                    <td className="py-1.5 px-2">{r.y}</td><td className="py-1.5 px-2 text-right tabular-nums">{r.rev}</td><td className="py-1.5 px-2 text-right tabular-nums">{r.gm}</td><td className="py-1.5 px-2 text-right tabular-nums">{r.eps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400">매출 2020~2024년과 매출총이익률 2021~2024년은 회사 발표, 2025년 매출은 분기 공시 합계, 2025년 매출총이익률은 외부 집계(약), 2026년은 회사 전망(코프라 인수 포함).</p>
          <p className={small}><b>숫자가 말하는 것:</b> 매출은 4년 만에 약 2배(인수 포함). 그런데 매출총이익률이 24%와 39% 사이를 오간다 — 브랜드 음료 회사치고 이례적으로 크게 흔들린다. <b>수요가 아니라 운임이 이익을 정하는 회사</b>라는 뜻이다.</p>
        </section>

        <section id="how" className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2 scroll-mt-20">
          <h2 className={h2}>2-1. 어떻게 이겼고, 어떻게 헤쳐 나갔나</h2>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">경쟁에서 이긴 방법</p>
          <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>먼저, 많이 맛보게 했다:</b> 범주가 생기던 시기에 창업자가 직접 가게를 돌며 시음 — 1위는 범주 초기에 정해진다.</li>
            <li><b>한 가지에만 집중했다:</b> 코카콜라(지코)·펩시(원)에게 코코넛워터는 수백 개 중 하나였고, 바이타 코코에게는 전부였다. 결국 코카콜라가 먼저 손을 뗐다(2020년).</li>
            <li><b>경쟁자(PB)를 직접 만들었다:</b> 유통사 자체 브랜드를 적으로 두지 않고 대신 만들어 납품 — 범주가 어느 쪽으로 커지든 몫을 가져간다.</li>
            <li><b>범주를 키우는 데 돈을 썼다:</b> "스포츠 음료보다 전해질 3.5배, 나무에서 나온 천연"이라는 이야기로 새 음용 상황(운동·아이 음료)을 만들었다. 1위는 범주가 커질수록 가장 많이 가져간다.</li>
            <li><b>나라별로 1위를 굳혔다:</b> 영국 80% 넘는 점유율 — 한때 10~20%였던 이노센트를 한 자릿수로 밀어냈다.</li>
          </ul>
          <p className="text-sm font-semibold text-gray-900 dark:text-white pt-1">난관을 헤쳐 나간 방법</p>
          <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>2012 성분 표시 소송:</b> 빠르게 합의하고 표시를 고쳤다 — 건강 음료의 생명인 신뢰를 지켰다.</li>
            <li><b>2022 운임 폭등:</b> 비싼 장기 운임 계약을 서두르지 않고 가격을 두 번 올렸다. 운임이 내려오자 이익률이 24% → 37%로 빠르게 회복.</li>
            <li><b>2024 컨테이너 부족·월마트 매대 축소:</b> 재고를 다시 쌓고, 판매 데이터로 월마트를 설득해 2025년 11월 잃은 자리보다 더 넓은 매대를 되찾았다.</li>
            <li><b>2025 관세:</b> 원가의 약 60%에 관세가 붙자 두 차례 가격 인상 — 그래도 브랜드 판매량은 +20~30%로 빨라졌다.</li>
            <li><b>2025 PB 지역 상실:</b> 입찰에서 잃은 지역을 2026년 되찾고 새 유통사·코프라 인수로 PB를 키웠다.</li>
            <li><b>2026 물량 부족:</b> 증설을 앞당기고 산지를 넓히는 중(필리핀·브라질 의존을 줄이는 게 과제).</li>
          </ul>
          <p className={small}><b>공통점:</b> 위기는 거의 모두 <b>공급·원가</b>(운임·컨테이너·관세·물량)에서 왔고, <b>수요</b>가 꺾여서 온 위기는 한 번도 없었다. 유행 음료는 보통 그 반대다.</p>
        </section>

        {/* 유행인가 — 비교 */}
        <section id="peers" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>3. 유행일까? — 비슷한 음료들이 걸어간 길</h2>
          <p className={small}>음료의 운명을 가른 건 대부분 <b>&ldquo;마시는 이유가 매일 반복되는가&rdquo;</b>와 <b>&ldquo;그 이유가 사라질 수 있는가&rdquo;</b>였다.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {PEERS.map(x => (
              <div key={x.name} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex gap-2"><Dot l={x.l} /><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{x.name}</h3></div>
                <p className={`${small} mt-1`}>{x.fate}</p>
                <p className="text-xs leading-relaxed text-gray-800 dark:text-gray-100 mt-0.5"><b>이유:</b> {x.why}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">코코넛워터는 어느 쪽에 가까운가</p>
            <p className={small}><b>게토레이 쪽 닮은 점:</b> 마시는 이유가 &ldquo;수분·전해질 보충&rdquo; — 매일 반복되는 생리적 수요다. 회사는 &ldquo;스포츠 음료보다 전해질(칼륨) 3.5배, 나무에서 나온 천연&rdquo;을 내세워 훨씬 큰 스포츠 음료 시장을 노린다.</p>
            <p className={small}><b>프라임과 다른 점:</b> 유명인 이름으로 팔린 게 아니라 20년 동안 매장 시음과 입소문으로 천천히 컸다. 열풍 뒤 급감이 아니라 계단식 성장.</p>
            <p className={small}><b>라크로이·오렌지주스에서 배울 점:</b> ① 범주가 일상이 되면 PB와 경쟁 브랜드가 쉽게 따라온다 — 바이타 코코는 PB를 직접 만들어 이 위험을 일부 피한다. ② 코코넛워터에도 <b>천연 당</b>이 있다. &ldquo;당은 다 나쁘다&rdquo;는 인식이 강해지면 건강 이미지가 흔들릴 수 있다 — 비타민워터가 걸린 함정.</p>
            <p className={small}><b>또 하나의 차이 — &ldquo;원료가 곧 범주&rdquo;:</b> 코코넛워터는 한 회사의 발명품이 아니라 커피·차·오렌지주스처럼 <b>원료 이름이 범주</b>인 음료다. 이런 음료는 브랜드 유행보다 오래 가는 경향이 있다. 대신 바이타 코코가 범주를 독점할 수도 없다 — 1위의 몫(지금 미국 약 42%)을 지키는 게 과제.</p>
          </div>
        </section>

        {/* 수요 */}
        <section className={sec}>
          <h2 className={h2}>4. 왜 마시나 — 수요의 네 기둥과 각각의 위험</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1.5 px-2 font-medium">마시는 이유</th><th className="text-left py-1.5 px-2 font-medium">왜 오래 갈 수 있나</th><th className="text-left py-1.5 px-2 font-medium">무엇이 깰 수 있나</th></tr></thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">수분·전해질 보충</td><td className="py-1.5 px-2">운동·더위·숙취 — 매일 반복. 스포츠 음료라는 훨씬 큰 시장의 대체재.</td><td className="py-1.5 px-2">가루형 전해질(리퀴드IV 등)·대형 스포츠 음료의 &ldquo;무설탕·천연&rdquo; 신제품.</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">천연·짧은 성분표</td><td className="py-1.5 px-2">가공식품을 피하는 흐름은 20년째 강해지는 중.</td><td className="py-1.5 px-2">천연 당 논란, 성분·원산지 문제(위생·농약) 사고.</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">아이·가족 음료</td><td className="py-1.5 px-2">아이용 맛(파랑·초록·빨강)과 청소년 스포츠 후원 — 어릴 때 익숙해진 음료는 오래 마신다.</td><td className="py-1.5 px-2">아이 음료의 당 규제, 맛이 장벽(회사도 인정).</td></tr>
                <tr><td className="py-1.5 px-2 font-medium">재료(칵테일·스무디·커피)</td><td className="py-1.5 px-2">마시는 상황이 넓어진다 — 카페 메뉴, 매장 진열이 음료 코너 밖으로.</td><td className="py-1.5 px-2">재료 수요는 가격 경쟁이 심하다(PB가 유리).</td></tr>
              </tbody>
            </table>
          </div>
          <p className={small}><b>판단:</b> 네 기둥 모두 &ldquo;SNS 화제성&rdquo;이 아니라 생활 습관에 기대고 있다. 가장 큰 위험은 경쟁보다 <b>&ldquo;건강 음료라는 이미지가 흔들리는 사건&rdquo;</b>(당·위생)이다.</p>
        </section>

        {/* 경쟁 */}
        <section className={sec}>
          <h2 className={h2}>5. 경쟁 구도 — 브랜드·PB·대형사</h2>
          <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>브랜드 1위:</b> 미국 약 42~51%(집계 기준에 따라), 영국 80% 넘음 — 영국에선 한때 10~20%를 가졌던 이노센트의 코코넛워터가 한 자릿수 초반으로 밀려났다(2025년 콜).</li>
            <li><b>PB(유통사 자체 브랜드):</b> 코스트코·월마트 같은 유통사가 싼 PB를 키운다. 그런데 바이타 코코는 이 PB를 만들어 납품한다(2026년 3분기 PB 납품 +152%, 코프라 인수 효과 포함). 브랜드가 밀려도 범주 성장의 몫을 가져가는 <b>&ldquo;무기상&rdquo; 전략</b>. 대신 PB 이익률은 브랜드보다 낮다.</li>
            <li><b>대형 음료사:</b> 코카콜라·펩시는 한 번 들어왔다 나갔다. 범주가 그들에겐 작고, 열대 원료 조달·품질 관리가 까다로웠던 것으로 보인다. 범주가 훨씬 커지면 다시 올 수 있다 — 그땐 인수 후보가 될 가능성도 있다(2017년 펩시 인수 타진).</li>
            <li><b>대체재:</b> 전해질 가루·스포츠 음료·기능성 물. 코코넛워터만의 경쟁이 아니라 &ldquo;수분 보충 음료&rdquo; 전체와 싸운다.</li>
          </ul>
        </section>

        {/* 원가 */}
        <section id="cost" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>6. 가장 큰 약점 — 운임과 원료, 어떻게 헤쳐 나가나</h2>
          <p className={small}>이익이 왜 해마다 출렁이는지, 그 원인을 하나씩 뜯어 본다: 원가가 무엇으로 이뤄졌나 → 운임은 왜 오르나 → 원가가 코코넛 값을 따르나 → 회사의 대응 무기 → 투자자가 볼 숫자.</p>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-1">6-1. 원가는 무엇으로 이뤄졌나</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {COST.structure.map(x => (
              <div key={x.k} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{x.k}</p>
                <p className={`${small} mt-0.5`}><B t={x.v} /></p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-2">6-2. 운임은 왜 오르나 — 네 가지 원인</h3>
          <p className={small}>해상 컨테이너 운임은 &ldquo;배(공급)&rdquo;와 &ldquo;실을 짐(수요)&rdquo;의 균형, 그리고 기름값으로 정해진다. 바이타 코코는 여기에 &ldquo;환적&rdquo;이라는 자기만의 사정이 더해진다.</p>
          <div className="space-y-1.5">
            {COST.freightWhy.map(x => (
              <div key={x.k} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{x.k}</p>
                <p className={`${small} mt-0.5`}><B t={x.v} /></p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mt-1">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1.5 px-2 font-medium">시기</th><th className="text-left py-1.5 px-2 font-medium">무슨 일이</th><th className="text-left py-1.5 px-2 font-medium">매출총이익률</th><th className="text-left py-1.5 px-2 font-medium">회사의 대응</th></tr></thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {COST.history.map(r => <tr key={r.y} className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium whitespace-nowrap">{r.y}</td><td className="py-1.5 px-2">{r.freight}</td><td className="py-1.5 px-2 tabular-nums whitespace-nowrap">{r.gm}</td><td className="py-1.5 px-2">{r.how}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className={small}><b>읽는 법:</b> 운임이 오르면 이익률은 <b>3~4개월 뒤</b> 내려간다 — 비싸게 실어 온 재고가 팔릴 때 비용으로 잡히기 때문. 반대로 운임이 내려가면 몇 달 뒤 이익률이 빠르게 오른다(2023년).</p>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-2">6-3. 원가는 코코넛 값을 따르나?</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            {COST.coconut.map((t, i) => <li key={i}><B t={t} /></li>)}
          </ul>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-2">6-4. 어떻게 헤쳐 나가나 — 회사의 여섯 가지 무기</h3>
          <div className="space-y-1.5">
            {COST.tools.map(x => (
              <div key={x.k} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex gap-2"><Dot l={x.l} /><p className="text-xs font-semibold text-gray-900 dark:text-white">{x.k} <span className="font-normal text-gray-400">{LIGHT[x.l].txt}</span></p></div>
                <p className={`${small} mt-0.5`}>{x.v}</p>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 dark:text-white pt-2">6-5. 투자자가 미리 볼 수 있는 숫자</h3>
          <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            {COST.watch.map(x => <li key={x.k}><b>{x.k}:</b> {x.why}</li>)}
          </ul>
          <p className={small}><b>판단:</b> 이 약점은 &ldquo;회사가 망할&rdquo; 약점이 아니라 <b>&ldquo;이익이 해마다 출렁이는&rdquo;</b> 약점이다. 운임·코코넛 값은 회사가 통제할 수 없지만, 가격 인상과 산지 분산으로 1~2년 안에 대부분 넘겨 왔다. 투자자 입장에선 운임 충격으로 주가가 빠질 때가 오히려 사는 기회였다(2022년 저점 → 이후 몇 배 상승). 세계 운임 지수가 이미 꺾이기 시작했다면(2026년 10~11월 하락 중) 몇 달 뒤 이익률 회복을 기대할 수 있다.</p>
        </section>

        {/* 코카콜라 비교 */}
        <section className={sec}>
          <h2 className={h2}>7. 코카콜라와 무엇이 다른가 — 해자의 폭</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1.5 px-2 font-medium"></th><th className="text-left py-1.5 px-2 font-medium">코카콜라</th><th className="text-left py-1.5 px-2 font-medium">바이타 코코</th></tr></thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">파는 것</td><td className="py-1.5 px-2">농축액 — 전 세계 병입 회사가 현지에서 물을 섞어 만든다</td><td className="py-1.5 px-2">완제품 — 열대에서 짜서 배로 실어 온다</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">매출총이익률</td><td className="py-1.5 px-2">60% 안팎, 안정</td><td className="py-1.5 px-2">24~39%, 운임에 출렁</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">범주</td><td className="py-1.5 px-2">탄산·물·주스·스포츠·커피 등 수백 브랜드</td><td className="py-1.5 px-2">코코넛 음료 하나</td></tr>
                <tr><td className="py-1.5 px-2 font-medium">닮고 싶은 모델</td><td className="py-1.5 px-2">—</td><td className="py-1.5 px-2">한 범주를 키우며 그 1위를 오래 지킨 몬스터·레드불</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="calls" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>7-1. 상장 뒤 전 분기 실적·컨퍼런스콜 ({CALLS.length}분기)</h2>
          <p className={small}>2021년 10월 상장 이후 모든 분기를 모았다. 2025년 2분기부터는 컨퍼런스콜 녹취록 전문을 읽고 요약했고, 그 전 분기는 녹취록을 구할 수 없어 회사가 SEC에 낸 실적 발표문(숫자와 경영진 발언)으로 정리했다. 제목을 누르면 펼쳐진다.</p>
          <div className="space-y-1.5">
            {[...CALLS].reverse().filter((c, i) => allQ || i < 8).map(c => {
              const on = openQ === c.q
              return (
                <div key={c.q} className={`rounded-lg border ${on ? 'border-blue-400 dark:border-blue-700' : 'border-gray-200 dark:border-gray-800'}`}>
                  <button onClick={() => setOpenQ(on ? null : c.q)} className="w-full text-left px-3 py-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{c.q}</span>
                    <span className="text-[11px] text-gray-400 tabular-nums">{c.date}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.src === 'call' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{c.src === 'call' ? '콜 녹취록' : '실적 발표문'}</span>
                    <span className="basis-full text-xs text-gray-700 dark:text-gray-200">{c.head}</span>
                  </button>
                  {on && (
                    <div className="px-3 pb-3 space-y-1.5 text-xs leading-relaxed">
                      <ul className="list-disc pl-4 space-y-0.5 text-gray-700 dark:text-gray-200">{c.nums.map(n => <li key={n}>{n}</li>)}</ul>
                      {c.said && <p className="italic text-purple-700 dark:text-purple-300 border-l-2 border-purple-300 dark:border-purple-700 pl-2">{c.said}</p>}
                      <p className="text-emerald-800 dark:text-emerald-300"><b>의미:</b> {c.note}</p>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-[11px] text-gray-400 hover:underline">원문 보기 →</a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {!allQ && <button onClick={() => setAllQ(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">2021~2024년 분기도 모두 보기 ({CALLS.length - 8}개 더) ↓</button>}
          <p className={small}><b>21분기를 이어 보면:</b> 브랜드 매출이 줄어든 분기는 한 번도 없다. 이익률은 20%(2022년 1분기)에서 42%(2024년 1분기) 사이를 오갔고, 흔들릴 때마다 원인은 운임·컨테이너·관세였다. 2025년부터는 성장이 오히려 빨라졌다(브랜드 +25% → +42%).</p>
        </section>

        <section id="why15" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>7-2. 주가는 해마다 40%씩 올랐는데, 왜 앞으로는 EPS 연 15% 안팎으로 보나</h2>
          <p className={small}><b>주가 수익률 = EPS 성장 + PER 변화.</b> 상장(2021년 말) 뒤 주가는 연 약 43% 올랐는데, 같은 기간 EPS도 연 약 43% 늘었고 PER은 32배 → 31배로 거의 그대로였다. 즉 <b>주가는 이익만큼 정확히 올랐다.</b> 문제는 그 이익 성장이 앞으로도 반복될 수 있는 종류인가다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1.5 px-2 font-medium"></th><th className="text-right py-1.5 px-2 font-medium">2022년</th><th className="text-right py-1.5 px-2 font-medium">최근 1년(2026년 3분기까지)</th><th className="text-right py-1.5 px-2 font-medium">배수</th></tr></thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">매출</td><td className="py-1.5 px-2 text-right tabular-nums">4.28억 달러</td><td className="py-1.5 px-2 text-right tabular-nums">약 7.7억 달러</td><td className="py-1.5 px-2 text-right tabular-nums">약 1.8배</td></tr>
                <tr className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">순이익률(순이익÷매출)</td><td className="py-1.5 px-2 text-right tabular-nums">약 2%</td><td className="py-1.5 px-2 text-right tabular-nums">약 15%</td><td className="py-1.5 px-2 text-right tabular-nums">약 8배</td></tr>
                <tr><td className="py-1.5 px-2 font-medium">EPS</td><td className="py-1.5 px-2 text-right tabular-nums">0.14달러</td><td className="py-1.5 px-2 text-right tabular-nums">1.98달러</td><td className="py-1.5 px-2 text-right tabular-nums">약 14배</td></tr>
              </tbody>
            </table>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>이익이 14배 된 이유의 대부분은 "이익률 회복"이다.</b> 2022년은 운임 폭등으로 이익이 거의 사라진 해(매출총이익률 24%)였다. 운임이 정상화되며 이익률이 원래 자리(37~40%)로 돌아오자 이익이 8배로 뛰었다. 이건 <b>한 번뿐인 회복</b>이다 — 이익률이 다시 24%에서 40%로 올라갈 일은 없다.</li>
            <li><b>매출 자체는 연 약 17~19% 늘었다.</b> 이게 반복 가능한 성장에 가깝다. 그런데 2026년 매출 +30%대에는 코프라 인수(약 1억 달러)·월마트 매대 탈환·가격 인상 같은 <b>해마다 반복되지 않는 효과</b>가 섞여 있다.</li>
            <li><b>최근 1년 EPS 1.98달러에도 일회성이 있다.</b> 2026년 2분기 관세 환급 1,560만 달러(세후 주당 약 0.2달러)를 빼면 바탕 이익은 1.8달러 안팎이다.</li>
            <li><b>그래서 앞으로는:</b> 매출 연 12~15%(회사의 장기 목표가 "매출 연 10%대 중반 성장") + 이익률은 대체로 유지 + 자사주로 주식 수 조금 감소 → <b>EPS 연 13~17%</b>가 기본 가정. 이게 15%의 근거다.</li>
          </ul>
          <p className={small}><b>더 빠를 수는 없나?</b> 가까운 1~2년은 15%보다 빠를 수 있다 — 범주가 미국 +28%·유럽 +66%로 크고, 2027년 하반기 증설과 가격 인상이 있다. 예를 들어 <b>3년 동안 연 25%, 이후 7년 연 12%</b>로 가정해도 10년 뒤 EPS는 약 8.5달러로, 리포트의 &ldquo;좋은 그림&rdquo;(연 15% → 약 8달러)과 비슷한 곳에 도착한다. 고성장은 대개 처음 몇 년에 몰리고 회사가 커질수록 느려지기 때문에, <b>10년 평균</b>으로는 15% 안팎이 현실적인 눈높이다.</p>
          <p className={small}><b>주가에 주는 뜻:</b> 앞으로 주가가 다시 연 40%씩 오르려면 이익이 연 40%씩 늘거나, PER이 31배에서 더 올라가야 한다. 이익률 회복이 끝난 지금 둘 다 쉽지 않다. 지난 4년의 40%는 <b>&ldquo;무너진 이익이 정상으로 돌아온 효과 + 매출 성장&rdquo;</b>이었고, 앞으로 기대할 수 있는 건 주로 <b>매출 성장분</b>이다.</p>
        </section>

        {/* 시나리오 */}
        <section id="scen" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>8. 10년 시나리오(추정)</h2>
          <p className={small}>출발점: 주가 약 62달러, 최근 1년 EPS 1.98달러, 배당 없음. 아래 수익률은 &ldquo;10년 뒤 EPS × 그때 PER&rdquo;을 지금 주가와 비교한 대략값이다.</p>
          <div className="grid sm:grid-cols-3 gap-2">
            {SCEN.map(s => (
              <div key={s.name} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
                <div className="flex gap-2"><Dot l={s.l} /><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</h3></div>
                <p className={small}>{s.story}</p>
                <p className="text-xs text-gray-800 dark:text-gray-100"><b>{s.eps}</b>, {s.pe}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.ret}</p>
              </div>
            ))}
          </div>
          <p className={small}><b>읽는 법:</b> 좋은 그림과 나쁜 그림의 차이가 크다 — 결과가 넓게 퍼진 종목이라는 뜻. 그래서 한 번에 크게 사기보다 &ldquo;유행 경고 신호&rdquo;를 확인하며 나눠 담는 게 맞다.</p>
        </section>

        {/* 체크리스트 */}
        <section id="warn" className={`${sec} scroll-mt-20`}>
          <h2 className={h2}>9. 분기마다 확인할 &ldquo;유행 경고 신호&rdquo; 8가지</h2>
          <p className={small}>실패 공부방의 유행 의존 사례(펠로톤·비욘드미트·그루폰)는 모두 이 숫자들이 먼저 꺾였다. 실적 발표 때 이 표만 다시 보면 된다.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1.5 px-2 font-medium">숫자</th><th className="text-left py-1.5 px-2 font-medium">괜찮은 범위</th><th className="text-left py-1.5 px-2 font-medium">경고</th></tr></thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {WARN.map(w => (
                  <tr key={w.k} className="border-b border-gray-100 dark:border-gray-900"><td className="py-1.5 px-2 font-medium">{w.k}</td><td className="py-1.5 px-2 text-emerald-700 dark:text-emerald-400">{w.ok}</td><td className="py-1.5 px-2 text-red-600 dark:text-red-400">{w.bad}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={small}><b>지금(2026년 3분기) 상태:</b> 브랜드 매출 +15%(판매량은 물량 부족으로 눌림), 새 가구가 성장의 절반 이상, 미국 점유율 약 42%(보도), 해외 +48%, 매출총이익률 38%(4분기 33% 예상 — 경고선 근처지만 원인은 운임), 자사주 매입 중. <b>8개 중 7개가 괜찮은 범위, 1개(이익률)가 주의.</b></p>
        </section>

        {/* 마무리 */}
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
          <h2 className={h2}>10. 정리 — 어떻게 들고 갈까</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>사는 이유:</b> 수요가 유행이 아니라 습관에 기대고, 범주가 아직 넓어지는 중이며, 그 범주의 1위다. 빚이 없고 자사주를 산다.</li>
            <li><b>조심할 이유:</b> 이익이 운임에 흔들리고, 원료가 하나이며, PB와 경쟁한다. PER 30배대는 성장이 꺾이면 크게 내려갈 수 있다.</li>
            <li><b>방법:</b> 포트폴리오에서 작은 비중(소비재 성장주 한 칸). 운임 충격·물량 부족 뉴스로 빠질 때 나눠 담는다. 위 8가지 신호 중 3개 이상이 두 분기 연속 경고면 줄인다.</li>
            <li><b>다음 확인:</b> 2027년 초 가격 인상 뒤 판매량, 하반기 증설, 4분기 매출총이익률.</li>
          </ul>
          <p className="text-[11px] text-gray-400">함께 보면 좋은 곳: <Link href="/private/failures" className="hover:underline">실패 공부방(유행 의존 사례)</Link> · <Link href="/private/r2k?s=FIZZ" className="hover:underline">내셔널 베버리지(라크로이)</Link> · <Link href="/private/sp500?s=MNST" className="hover:underline">몬스터 베버리지</Link> · <Link href="/private/sp500?s=KO" className="hover:underline">코카콜라</Link></p>
          <p className="text-[11px] text-gray-400">매수·매도 추천이 아니다. 시장 점유율·가구 침투율은 회사 발표를 전한 보도 기준이고, 시나리오는 추정이다.</p>
        </section>
      </article>
    </div>
  )
}
