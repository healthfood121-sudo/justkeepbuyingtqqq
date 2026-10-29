// 코스톨라니 책 2권(『돈, 뜨겁게 사랑하고 차갑게 다루어라』, 『실전 투자강의』) 독서모임 정리에서 뽑은 추가 섹션
// KostolanyEgg.tsx 안에 끼워 넣는다.

const card = 'bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8'
const h2 = 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1'
const sub = 'text-sm text-gray-500 dark:text-gray-400'
const p = 'text-sm text-gray-700 dark:text-gray-300 leading-relaxed'
const quote = 'text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed'

function Head({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="text-center mb-6">
      <h2 className={h2}>{title}</h2>
      <p className={sub}>{desc}</p>
    </div>
  )
}

// ── 2. 돈과 심리 2×2 ──────────────────────────────────────────────
const matrix = [
  { money: '돈 +', mind: '심리 +', result: '급격한 강세장', note: '살 마음도 있고 살 돈도 있다. 경제 뉴스가 나빠도 오른다.', cls: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600', tc: 'text-emerald-700 dark:text-emerald-300' },
  { money: '돈 +', mind: '심리 −', result: '지루한 횡보 → 결국 상승', note: '돈이 더 센 요소다. 돈이 넘치면 9~12개월 안에 심리도 따라 돌아선다.', cls: 'bg-lime-50 dark:bg-lime-900/20 border-lime-300 dark:border-lime-700', tc: 'text-lime-700 dark:text-lime-300' },
  { money: '돈 −', mind: '심리 +', result: '지루한 횡보 → 결국 하락', note: '기대는 높은데 새 돈이 안 들어온다. 좋은 소식에도 더 오르지 못한다.', cls: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700', tc: 'text-amber-700 dark:text-amber-300' },
  { money: '돈 −', mind: '심리 −', result: '급격한 약세장', note: '여론은 비관적이고, 돈은 채권·예금·부동산으로 빠져나갔다. 바닥까지 추락한다.', cls: 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600', tc: 'text-red-700 dark:text-red-300' },
]

export function MoneyMindMatrix() {
  return (
    <div className={card}>
      <Head title="돈 + 심리 = 추세" desc="중기 주가를 정하는 두 요소 — 둘의 조합으로 장세가 갈린다" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        {matrix.map(m => (
          <div key={m.money + m.mind} className={`rounded-xl border-2 p-4 ${m.cls}`}>
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200">{m.money}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200">{m.mind}</span>
            </div>
            <div className={`text-base font-black mb-1 ${m.tc}`}>{m.result}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{m.note}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">같은 금리 충격, 다른 결과 — 1987년과 1994년</p>
        <p className={p}>
          두 해 모두 금리가 비슷하게 치솟았다. 1987년은 &ldquo;샴페인 터지는 소리&rdquo;가 들리던 해였다 — 스물다섯 살 투자은행 직원이 포르셰를 샀다. 결과는 대폭락.
          1994년에는 주가가 최고점인데도 비관론자가 더 많았다. 증시 타격은 작았고, 돈이 다시 풀리자 곧 폭등했다.
        </p>
        <p className={quote}>&ldquo;돈이라는 요소에 증권시장이 얼마나 민감하게 반응하는지는 전부 대중의 심리에 달려 있다.&rdquo;</p>
      </div>
    </div>
  )
}

// ── 1. 실제 역사로 본 달걀 한 바퀴 ─────────────────────────────────
const eggDefs = [
  { ph: 'A1', name: '조정', vol: '적다', own: '적다', side: 'up' },
  { ph: 'A2', name: '동행', vol: '늘어난다', own: '늘어난다', side: 'up' },
  { ph: 'A3', name: '과장', vol: '폭증', own: '최대 (꼭대기)', side: 'up' },
  { ph: 'B1', name: '조정', vol: '줄어든다', own: '서서히 줄어든다', side: 'down' },
  { ph: 'B2', name: '동행', vol: '늘어난다', own: '계속 줄어든다', side: 'down' },
  { ph: 'B3', name: '과장', vol: '폭증', own: '최소 (바닥)', side: 'down' },
]

const eggHistory: Array<{ ph: string; when: string; what: string; act: string }> = [
  { ph: 'A1', when: '1982년', what: '"아무도 주식을 원하지 않는다"는 기사가 나오던 때. 그래도 월가에선 하루 5천만 주가 거래됐다 — 소신파가 헐값에 사고 있었다. 연말에 연준이 고금리의 고삐를 풀자 장기금리가 내려갔다.', act: '강력 매수' },
  { ph: 'A2', when: '1983~1986년', what: '유가 하락, 인플레이션 거의 0, 볼커 연준 의장의 연이은 금리 인하, 세제 개혁으로 기업 이익 급증. 주가는 뉴스와 나란히 오르내리며 올라갔다.', act: '보유' },
  { ph: 'A3', when: '1987년 초', what: '5년간 약 200% 상승. 언론과 사교 모임이 온통 주식 얘기. 주가지수 선물 증거금이 5%에 불과해 투기가 폭발했고, 다우지수를 콕 찍어 예언하는 "스승"이 유명해졌다.', act: '매도' },
  { ph: 'B1', when: '1987년 8월', what: '그린스펀 연준 의장이 연초부터 여러 차례 금리 인상, 장기금리 약 2%p 상승. 다우지수가 2,722에서 더 버티지 못했다.', act: '매도' },
  { ph: 'B2', when: '1987년 8~10월', what: '새 매수자가 없어 작은 매도에도 시세가 밀렸다. 미국·독일 무역 갈등으로 투자자들이 점점 예민해졌다.', act: '관망' },
  { ph: 'B3', when: '1987년 10월 19일', what: '베이커 재무장관이 달러를 더 떨어뜨리겠다고 위협하자 폭락(블랙 먼데이). 포트폴리오 보험의 기계적 매도가 하락을 키웠다 — "모두가 문 하나로 빠져나가려는 셈".', act: '매수 준비' },
  { ph: 'A1', when: '폭락 다음 날', what: '그린스펀: "모든 수단을 동원해 유동성을 늘리겠다." 돈이라는 요소가 다시 긍정으로 — 소신파에게 재진입 신호였다. 덤핑 가격에 산 것은 현금과 인내를 가진 소신파였다.', act: '매수' },
  { ph: 'A3→B', when: '1998년', what: '독일 벤처시장이 노름판이 됐다(A3). 동남아 외환위기, 러시아 재정 위기, 그린스펀의 투기 경고 — 세 개의 바늘이 풍선을 찔렀다(B1~B3).', act: '매도' },
  { ph: 'A1~A2', when: '1998년 말~1999년', what: '연준이 서둘러 돈을 풀었고 시세는 빠르게 회복. 저자는 1999년에 "지금은 2국면 끝자락, 3국면으로 접어들면 한 차례 후퇴는 피할 수 없다"고 썼다 — 그 뒤 닷컴 버블의 정점과 붕괴가 왔다.', act: '보유 → 경계' },
]

const actColor = (a: string) =>
  a.includes('매수') ? 'bg-emerald-500' : a.includes('매도') ? 'bg-red-500' : a.includes('경계') ? 'bg-amber-500' : 'bg-gray-400'

export function EggHistory() {
  return (
    <div className={card}>
      <Head title="실제 역사로 본 달걀 한 바퀴" desc="1982 바닥 → 1987 폭락 → 1998 위기 — 거래량과 주식 보유자 수로 국면을 읽는다" />
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-gray-400 dark:text-gray-500">
              <th className="py-1.5 px-2 text-left font-medium">국면</th>
              <th className="py-1.5 px-2 text-left font-medium break-keep">거래량</th>
              <th className="py-1.5 px-2 text-left font-medium break-keep">주식 보유자 수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {eggDefs.map(d => (
              <tr key={d.ph}>
                <td className="py-1.5 px-2 font-bold break-keep">
                  <span className={d.side === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>{d.ph}</span>
                  <span className="text-gray-600 dark:text-gray-300 font-medium"> {d.side === 'up' ? '상승' : '하락'} {d.name}</span>
                </td>
                <td className="py-1.5 px-2 text-gray-700 dark:text-gray-300 break-keep">{d.vol}</td>
                <td className="py-1.5 px-2 text-gray-700 dark:text-gray-300 break-keep">{d.own}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-2 space-y-4">
        {eggHistory.map((h, i) => (
          <li key={i} className="ml-4">
            <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-indigo-500" />
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{h.ph}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{h.when}</span>
              <span className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full ${actColor(h.act)}`}>{h.act}</span>
            </div>
            <p className={p}>{h.what}</p>
          </li>
        ))}
      </ol>
      <p className={`${quote} mt-5 text-center`}>&ldquo;붐 없이는 폭락도 없고, 폭락 없이는 붐도 없다. 이는 피할 수 없는 숙명이며 영원불변의 법칙이다.&rdquo;</p>
    </div>
  )
}

// ── 3~7. 기타 ─────────────────────────────────────────────────────
const assets = [
  { name: '주식', icon: '📈', verdict: '권장', vc: 'bg-emerald-500', text: '다른 투자보다 성공하기 어렵지 않다. 재산을 나누고, 크고 튼튼한 우량기업을 사고, 오르지 않아도 초조해하지 말고 기다린다. 배당을 재투자하면 복리로 자란다.' },
  { name: '채권', icon: '📜', verdict: '주식의 경쟁자', vc: 'bg-blue-500', text: '채권 이자가 높을수록 주식으로 들어가는 돈이 줄어든다. 이론 가치를 주식보다 정확히 계산할 수 있다. 저자는 평가절하된 국채(전후 독일, 구소련)로 큰 수익을 냈다.' },
  { name: '부동산', icon: '🏠', verdict: '살 집부터', vc: 'bg-teal-500', text: '유가물 중 유일하게 수익(집세)이 나온다. 스스로 살 집은 꼭 사라 — 오르는 집세와 집주인에게서 자유로워진다. "부동산 시장에는 도박꾼이 없다는 게 가장 마음에 든다."' },
  { name: '금·그림·골동품', icon: '🪙', verdict: '부적합', vc: 'bg-amber-500', text: '스스로 수익을 낳지 않는다. 하이퍼인플레이션이 아니면 투자 대상으로 적절하지 않다. 큰 흐름에 올라탔다면 어느 정도 벌고 재빨리 내려야 한다.' },
  { name: '원자재·상품 선물', icon: '🛢️', verdict: '피하라', vc: 'bg-red-500', text: '"카지노의 룰렛과 정확히 같다. 딸 수 있지만, 반드시 잃게 되는 게임이다." 저자도 모든 원자재 선물을 해봤지만 결국 손익이 0이었다. 원자재는 자기 공장에 쓸 사람에게 맞다.' },
  { name: '외환', icon: '💱', verdict: '왜곡된 게임', vc: 'bg-red-500', text: '담보금이 3%에 불과한, 왜곡된 게임 원리가 지배하는 곳이다.' },
]

const decisionSteps = ['주식인가, 장기 예금인가', '어느 나라 시장인가', '어느 업종인가', '어느 기업인가']

const habits = [
  { t: '저녁', d: '좋은 아이디어를 생각한다' },
  { t: '아침', d: '비판적인 자세로 다시 본다' },
  { t: '점심', d: '결정을 내린다' },
]

export function KostolanyExtra() {
  return (
    <>
      {/* 3. 새 주식이 쏟아질 때 */}
      <div className={card}>
        <Head title="새 주식이 쏟아질 때를 경계하라" desc="주가는 주식의 질이 아니라 수요와 공급의 강도로 정해진다" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 space-y-1.5">
            <p className="text-sm font-black text-red-700 dark:text-red-300">호황 → 주식 공급 증가</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">기업이 설비 투자 자금을 모으려고 증자·신규 상장에 나선다. 다른 회사 지분도 내다판다. 시장에 새 주식이 쏟아져 기존 주식의 경쟁자가 된다.</p>
          </div>
          <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-1.5">
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">불경기 → 주식 수요 증가</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">새 투자 대신 남는 돈으로 자사주를 산다. 불안한 사람들이 저축을 늘리고, 그 일부가 펀드를 통해 증시로 들어온다. 이익이 줄어도 주가가 오르는 이유다.</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
          <p className={quote}>&ldquo;새 주식이 만들어지는 동안 언론과 선전은 분위기를 낙관적으로 만든다. 낙관적일수록 대중은 빨리 새 주식을 삼킨다. 새 회사 설립이나 증자로 인한 주식 증가는 거의 항상 나중에 주가가 극적으로 떨어짐을 의미한다. 어느 순간 갑자기 바보들의 머릿수보다 주식 수가 많아진다.&rdquo;</p>
          <p className={quote}>&ldquo;투자 펀드에 아주 많은 돈이 몰리면, 상승의 제3단계가 곧 끝나간다는 징후다.&rdquo;</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            단, 상승 추세에서는 증자가 긍정적으로, 하락 추세에서는 부정적으로 작용한다. 지금이라면 초대형 상장(스페이스X·오픈AI·앤트로픽 등이 거론됨)이 줄줄이 몰리는 시기가 이 경고에 해당하는지 볼 일이다.
          </p>
        </div>
      </div>

      {/* 4. 전쟁과 주가 */}
      <div className={card}>
        <Head title="전쟁과 주가" desc="상황이 불확실할수록 주식을 안 사고, 확실해질수록 산다" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">① 전쟁이 예상될 때</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">영리하게 굴려는 모두가 판다. 그래서 전쟁 <b>전에</b> 바닥이 온다.</p>
          </div>
          <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">② 전쟁이 터지면</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">이미 다 팔렸고 남은 주식은 소신파 금고 안에 있다. 사려는 사람만 있고 팔 사람이 없어 오른다.</p>
          </div>
          <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">③ 예기치 못한 전쟁</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">아무도 대비하지 못했기에 파국적이다. 어느 나라 증권거래소든 공황에 빠진다.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">걸프전 (1990~1991)</p>
            <p className={p}>이라크의 쿠웨이트 침공 뒤 유가가 배럴당 20달러에서 40달러로 뛰었고 주가는 수개월 내렸다. 그런데 실제 전쟁이 시작돼 미국이 이기자 주가는 치솟고 유가는 거의 절반으로 떨어졌다.</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">아르헨티나</p>
            <p className={p}>이사벨 페론 집권 시절 누구도 아르헨티나 주식을 사지 않았고 아무 희망도 없어 보였다. 쿠데타로 그녀가 체포되자 거래소에 매수자가 몰렸고, 30일 뒤 다시 문을 열었을 때 주가는 100배, 200배씩 올라 있었다.</p>
          </div>
          <p className={quote}>&ldquo;국가 파산, 금융 위기? 아무것도 아닌 것을 가지고 소란을 떠는 것이다.&rdquo;</p>
        </div>
      </div>

      {/* 5. 투자 대상별 판단 */}
      <div className={card}>
        <Head title="투자 대상별 판단" desc="무엇이 돈을 낳고, 무엇이 낳지 않는가" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {assets.map(a => (
            <div key={a.name} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{a.name}</span>
                <span className={`ml-auto text-[11px] font-bold text-white px-2 py-0.5 rounded-full ${a.vc}`}>{a.verdict}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. 결정 순서와 생각하는 습관 */}
      <div className={card}>
        <Head title="결정 순서와 생각하는 습관" desc="오늘 살지 다음 주에 살지는 전술일 뿐 — 전략이 훨씬 중요하다" />
        <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-6">
          {decisionSteps.map((s, i) => (
            <div key={s} className="flex sm:flex-col items-center gap-2 flex-1">
              <div className="flex-1 w-full rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-3 py-3 text-center">
                <span className="block text-xs font-black text-indigo-500">{i + 1}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white break-keep">{s}</span>
              </div>
              {i < decisionSteps.length - 1 && <span className="text-gray-300 dark:text-gray-600 sm:hidden">↓</span>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {habits.map(h => (
            <div key={h.t} className="rounded-xl bg-slate-800 dark:bg-slate-700 text-white p-3 text-center">
              <div className="text-lg font-black text-yellow-400">{h.t}</div>
              <div className="text-xs text-slate-200 break-keep">{h.d}</div>
            </div>
          ))}
        </div>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
          <li>주말에 조용히 시장을 생각하라. 생각이 익은 뒤에 전략과 계획을 세운다.</li>
          <li>생각은 어디서든 된다 — 산책, 조깅, 비행기 안, 음악을 들으며. 전문 거래인 업무의 95%는 생각할 시간 없이 차트와 보고서만 읽는 시간 낭비다.</li>
          <li>깊이 생각하지 않고 행동하느니, 아무것도 하지 않고 깊이 생각하는 편이 낫다.</li>
          <li>팔지 말지는 산 가격과 아무 관계가 없다. 오직 앞으로의 전개를 어떻게 보느냐로 정한다.</li>
          <li>그 나라 말은커녕 알파벳도 모르는 나라에는 투자하지 않는다.</li>
        </ul>
      </div>

      {/* 7. 엔화로 빌린 돈이 풀릴 때 */}
      <div className={card}>
        <Head title="엔화로 빌린 돈이 한꺼번에 풀릴 때" desc="1999년에 쓴 경고가 2024년 8월에 그대로 나타났다" />
        <div className="flex flex-col gap-2 mb-5">
          {[
            ['평소', '금리가 낮은 엔화로 돈을 빌려, 금리가 높은 미국 채권 등에 투자해 이자 차익을 챙긴다.'],
            ['방아쇠', '엔화가 갑자기 급등하거나 일본은행이 금리를 올린다 — 이자 차익보다 환손실이 커진다.'],
            ['청산', '헤지펀드가 서둘러 보유 자산을 팔아 엔화 빚을 갚는다.'],
            ['결과', '"엔화 강세라는 한 가지 원인만으로 갑자기 시장 내 돈의 흐름이 막힌다."'],
          ].map(([k, v], i) => (
            <div key={k} className="flex items-start gap-3">
              <span className="shrink-0 w-14 text-xs font-black text-indigo-600 dark:text-indigo-400 pt-0.5">{i + 1}. {k}</span>
              <p className={p}>{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">2024년 8월 5일</p>
          <p className={p}>일본은행이 7월 31일 금리를 올린 뒤 엔화가 급등했고, 엔화로 빌린 돈의 청산이 몰리면서 일본 닛케이지수는 하루에 12% 넘게, 나스닥은 3% 넘게 떨어졌다. 25년 전 책이 말한 &ldquo;돈의 흐름이 갑자기 막히는&rdquo; 장면이다.</p>
        </div>
      </div>
    </>
  )
}
