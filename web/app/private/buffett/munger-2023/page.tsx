import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// 찰리 멍거 2023년 어콰이어드(Acquired) 인터뷰 — 주제별 우리말 정리 + 짧은 핵심 인용.
// 녹취 전문은 Acquired 사이트에 있다(저작권 때문에 전체 번역은 싣지 않고 원문 링크를 단다).
// 서버에서 로그인 확인 뒤에만 그린다.

const SRC = 'https://www.acquired.fm/episodes/charlie-munger'

type Q = { en: string; ko: string }
type Sec = { id: string; t: string; tag?: string; pts: string[]; q?: Q[]; link?: { href: string; label: string } }

const SECS: Sec[] = [
  {
    id: 'gamble', t: '도박과 주식 단타',
    pts: [
      '스포츠 베팅 광고가 넘쳐나는 게 미국에 좋냐는 질문에 "물론 아니다. 경마장·카지노도 마찬가지다. 그냥 인기가 많을 뿐"이라고 했다.',
      '버핏은 경마장에 가도 직접 걸지 않았다 — 확률이 자기 편이길 원했다. "손님이 아니라 하우스(도박장)가 되고 싶은 것."',
      '개인 투자자의 단타는 회사도 모르고 오르내림에 거는 도박이라며, 자기가 세상을 운영한다면 "단기 차익에 세금을 매기고 손실은 빼 주지 않겠다"고 했다.',
    ],
    q: [{ en: 'Warren wants the odds in his favor, not somebody else. … You want to be the house, not the punter.', ko: '워런은 확률이 남이 아니라 자기 편이길 원한다. 손님이 아니라 하우스가 되어야 한다.' }],
  },
  {
    id: 'quant', t: '퀀트(르네상스)',
    pts: [
      '르네상스의 첫 알고리즘은 단순했다 — 이틀 연속 오르거나 내리는 경우가 엇갈리는 경우보다 많다는 것(사람은 원래 추세를 따른다).',
      '지금은 이익 폭이 갈수록 작아져 거래량과 하루 중 지렛대(레버리지)를 키워서 버는 구조라, "이미 부자라면 미칠 노릇일" 위험이라 자기는 안 하겠다고 했다.',
    ],
  },
  {
    id: 'costco', t: '코스트코 — 인연과 "미덕 연설"', tag: '코스트코',
    pts: [
      '친구 소개로 창업자 솔 프라이스를 만나 매장을 둘러봤고, 프라이스클럽 주식을 시장에서 직접 샀다.',
      '짐 시네걸이 버핏에게 이사를 부탁했는데, 버핏이 "찰리에게 시켜라"고 해서 멍거가 코스트코 이사가 됐다(1997년).',
      '버핏은 소매업을 싫어한다 — 시어스·대형 백화점처럼 한때 강했던 소매업체가 거의 다 사라졌기 때문. 그래서 버크셔가 코스트코를 통째로 살 기회도 거절했다.',
      '평생 "확실히 맞고 정말 잘될 걸 아는" 기회는 대여섯 번뿐이고, 초반에 두세 번 성공한 사람은 쉬운 줄 알다가 망한다.',
      '코스트코가 그런 기회였던 이유: 누구보다 싸게, 크고 효율적인 매장에서 팔았다. 넓은 주차 칸, 많이 사는 회원에게 적립 혜택, 재고에 돈이 안 묶이는 구조(팔린 뒤 대금 지급).',
    ],
    q: [{ en: "There aren't many times in a lifetime when you know you're right … Maybe five or six times in a lifetime you get a chance to do it.", ko: '맞다는 걸 아는 때는 평생 많지 않다. 평생 대여섯 번쯤 기회가 온다.' }],
    link: { href: '/private/sp500?s=COST', label: '코스트코 분석 →' },
  },
  {
    id: 'bet', t: '확신이 있을 때는 크게',
    pts: [
      '"우위가 있다는 걸 알 때는 크게 걸어야 한다. 경영대학원은 이걸 안 가르치는데, 미친 짓이다."',
      '확신은 "많이 읽고, 생각하고, 찾아가 보는" 일로 쌓는다. 산 지 5년 뒤에야 확신이 생길 수도 있다.',
    ],
    q: [{ en: 'when you know you have an edge, you should bet heavily.', ko: '우위가 있다는 걸 알 때는 크게 걸어야 한다.' }],
  },
  {
    id: 'partner', t: '버핏과의 50년 동업',
    pts: [
      '둘 다 가족을 안전하게 지키고 투자자에게 잘하려는 비슷한 태도였고, 그건 끝까지 변하지 않았다.',
      '버핏은 지금도 무엇보다 버크셔 주주의 안전을 챙긴다. 빚을 조금 더 썼다면 세 배쯤 컸겠지만, 기본 안전을 망칠 가능성은 조금도 주고 싶지 않았다.',
      '오래가는 동업의 비결: 서로 좋아하고, 각자 잘하는 일을 자연스럽게 나눠 맡는 것.',
    ],
  },
  {
    id: 'vc', t: '벤처캐피털·운용 보수',
    pts: [
      '인기 있는 거래는 너무 빨리 결정해야 해서 다들 도박을 하는 셈이다. 사회에서 벤처캐피털의 역할은 "아주 형편없이" 수행되고 있다.',
      '현장에서 일하는 사람들은 대개 벤처캐피털을 싫어한다 — 함께 회사를 돕는 동업자가 아니라 자기 몫을 챙기는 사람으로 본다.',
      '버크셔는 괜찮은 사업이면 절대 팔지 않는다. 그 평판 덕에 좋은 회사가 버크셔를 찾는다.',
      '"2-20, 3-30" 같은 높은 보수는 정말 특별한 결과를 낼 때만 받아야 한다. 결과를 내는 척하는 건 실제로 내는 것보다 쉽다. 대학 기금들이 보수를 절반으로 깎기 시작했다.',
    ],
  },
  {
    id: 'btc', t: '비트코인과 달러',
    pts: ['세계에 공통 통화가 있는 건 좋은 일이지만, 그 역할은 영국 파운드에서 달러로 넘어갔고 지금도 달러다. 달러는 어디서든 바꿀 수 있다.'],
  },
  {
    id: 'opps', t: '기회는 점점 줄어든다 — 홈디포·월마트',
    pts: [
      '쉬운 기회는 갈수록 어렵다. 홈디포는 코스트코 모델을 집수리에 그대로 옮긴 것이고, 지금은 플로어앤데코(바닥재)가 따라 하는 중. 그런 기회는 아주 드물다.',
      '월마트가 코스트코를 못 이긴 이유: 땅값이 거의 0인 작은 도시에 큰 매장을 짓는 기존 공식에 갇혀, 비싼 부자 동네에 들어가지 못했다. 코스트코는 부자가 사는 좋은 자리만 골랐다 — "끔찍한 실수".',
    ],
  },
  {
    id: 'auto', t: '자동차·BYD·일본 상사',
    pts: [
      '자동차 산업은 전기차·막대한 투자·판매 방식 변화·강성 노조로 너무 어렵다 — "자동차 업종은 아예 안 본다". 현대차에 투자해 조금 잃었다.',
      'BYD는 기적: 왕촨푸는 남의 부품을 보고 만드는 법을 알아내는 천재 엔지니어이자 실행가. 일론 머스크보다 "실제로 만드는 데" 더 가깝다. 다만 너무 공격적이라 불안하다고도 했다.',
      '일본 종합상사 투자는 "생각할 필요도 없는" 기회 — 10년 동안 연 0.5%로 빌려 배당 5% 주식을 샀다. 버크셔의 신용이 있어야만 가능했고, 한 세기에 한두 번 오는 일.',
    ],
    q: [{ en: "That is a no-brainer. … You'll be lucky if you get one or two a century.", ko: '생각할 필요도 없는 일이다. 한 세기에 한두 번이면 운이 좋은 것.' }],
  },
  {
    id: 'brands', t: '나이키·에르메스·LVMH·브랜드', tag: '에르메스',
    pts: [
      '나이키는 "스타일 회사"라 싫다. "에르메스를 충분히 싼 값에 준다면 사겠지만, 그게 아니면 스타일 회사는 안 산다."',
      'LVMH 같은 회사를 또 만들려면 "평생, 아니 서너 번의 평생"이 걸린다. 에르메스 가문은 매일 회의하고 매장 자리를 하나하나 고른다 — "일이다".',
      '에르메스·LVMH가 오래가는 이유: "사람들이 깊이 믿는 브랜드. 만드는 데 100년이 걸렸다." 커클랜드는 세제 타이드 같은 브랜드, 에르메스는 "전혀 다른 종류의 브랜드".',
      '시즈캔디: 2천만 달러에 사서 40년 동안 매년 값을 10%씩 올렸는데 아무도 신경 쓰지 않았다. 새 자본도 거의 필요 없었다.',
      '"시즈나 에르메스 같은 회사"에 대해: "그런 회사를 살 확률은 너무 낮아서 찾아보지도 않겠다. 살 기회는 오지 않는다."',
      '하인즈는 케첩 맛 때문에 값을 올려도 되지만, 크래프트 치즈는 올리면 모두가 반발한다. 소스·코카콜라처럼 사람들이 익숙해지고 좋아하는 맛이 가격 결정력을 만든다.',
      '브랜드 상품 회사만 사는 투자자는 평균보다 2~3%포인트 나았을 뿐 "대박은 아니다".',
    ],
    q: [
      { en: 'They just got a brand people trust so much. It took them a century to do it.', ko: '사람들이 아주 깊이 믿는 브랜드를 가졌다. 만드는 데 100년이 걸렸다.' },
      { en: "I think your chances of buying one of them are so low, I wouldn't even look.", ko: '그런 회사를 살 확률은 너무 낮아서 찾아보지도 않겠다.' },
    ],
    link: { href: '/private/sp500?s=RMS', label: '에르메스 분석 →' },
  },
  {
    id: 'life', t: '99세가 돌아보는 투자',
    pts: [
      '70세 때도 투자가 어렵다는 걸 알았고, 지금은 얼마나 어려운지 더 잘 안다. 높은 보수를 받는 사람들은 쉽다고 말하다가 자기 말을 믿게 된다.',
      '다시 30대라면 투자를 하겠지만 남의 돈을 굴리는 일은 싫다. "부자가 되는 이유는 다른 사람이 필요 없게 되기 위해서다."',
      '지금 버핏과 30살로 다시 시작해도 버크셔 같은 걸 만들 수 없다 — 크게 성공한 사람은 머리·노력·운 세 가지가 다 있었다. 운을 만드는 법은 일찍 시작해 오래 시도하는 것.',
      '보험업은 아주 참을성 있는 사람에게 맞는다. 자기는 스스로 감당할 수 있게 된 뒤로 화재보험을 하나도 들지 않았다(자동차 보험은 의무라 든다).',
    ],
  },
  {
    id: 'apple', t: '애플과 빅테크', tag: '애플',
    pts: [
      '누구나 다른 모든 회사보다 잘하는 열두 개쯤의 회사 중 두세 개에는 상당한 몫을 가져야 한다. 애플은 당연한 후보였다.',
      '값 때문에 샀나? "그렇다, 싸졌다. 워런이 살 때 이익의 약 10배까지 내려갔다."',
      '연기금·대학 기금·퇴직연금이 모두 빅테크에 몰리는 건 사람의 본성과 경쟁이 만든 자연스러운 결과다.',
    ],
    q: [{ en: 'It got to about 10 times earnings when Warren bought in.', ko: '워런이 살 때 이익의 약 10배까지 내려갔다.' }],
    link: { href: '/private/sp500?s=AAPL', label: '애플 분석 →' },
  },
  {
    id: 'china', t: '중국',
    pts: [
      '중국 경제는 앞으로 20년 다른 큰 경제보다 전망이 좋고, 중국의 선두 기업은 어디보다 강하면서 훨씬 싸다. 그래서 멍거 가족 자산에 중국 위험을 18% 정도 갖고 있어도 괜찮다.',
      'TSMC는 애플처럼 "자기만의 진짜 소비자 브랜드가 있는 회사"만큼 좋아하지는 않는다.',
    ],
  },
  {
    id: 'two', t: '내가 보는 두 종류의 회사',
    pts: [
      '① 정말 싼 회사 — 벤 그레이엄을 따라 형편없는 회사라도 정말 싸면 산다. 하지만 그걸로 크게 번 건 평생 한두 번뿐.',
      '② 훌륭한 브랜드 회사 — "요령의 전부는 정말 싸지는 드문 기회에 사는 것." 지금 값의 코스트코는 "괜찮을 수도 있지만 점점 어려워진다". 사업의 다음 10년은 "꽤 잘할 것".',
    ],
    q: [{ en: "the whole trick is getting them on a few rare occasions when they're really cheap.", ko: '요령의 전부는 정말 싸지는 드문 기회에 사는 것이다.' }],
  },
  {
    id: 'now', t: '지금 시장과 젊은이에게',
    pts: [
      '"온 세상이 비싸 보이는데 가능한 일인가?" — "거의 그렇다. 가능한 정도가 아니라 실제로 그렇게 됐을 가능성이 크다."',
      '자본은 많고 기회는 적은 건 자연의 이치(치열한 경쟁). 그 끝은 "불쾌한 폭발" 같은 것일 수 있다.',
      '예전에도 쉬웠던 적은 없고 지금은 더 어렵다. 사람을 잘 대해 끝까지 좋은 평판을 남겨라.',
      '"부자는 한 번만 되면 된다. 이 산을 네 번 오를 필요는 없다."',
    ],
    q: [{ en: "The beauty of it is: you only have to get rich once.", ko: '좋은 점은, 부자는 한 번만 되면 된다는 것이다.' }],
  },
  {
    id: 'costco2', t: '저녁 식사 뒤 — 코스트코 이야기 더', tag: '코스트코',
    pts: [
      '방법은 뻔한데 왜 아무도 못 하나: "작정하고, 광적으로, 매일·매주·매년 40년 동안" 해야 한다. 문화 + 사업 모델 + 끈질긴 실행.',
      '핵심 원칙은 "시장 가격을 올리지 않는 것 — 낮게 정하고 영원히 거기 둔다". 핫도그 값을 안 올리는 게 그 상징이고, 시네걸이라면 값 인상을 분명히 막았을 것.',
      '성장이 연 10% 안팎인 건 돈이 아니라 매장을 1년에 너무 많이 열기 어려워서다(새 점장·새 문제).',
      '중국 첫 매장 때 3만 달러 뇌물을 요구받고 거절 — 시네걸은 그 뒤 30년 가까이 중국 얘기를 안 했다. 결국 이사회가 목소리를 내서 들어갔다.',
      '최저가인데 손님이 부유한 건 솔 프라이스가 처음부터 노린 것 — "아끼려는 부자", 까다로운 부자들.',
      '"젊은이는 규칙을 알고 노인은 예외를 안다"(피터 코프먼의 말). 그 예외의 예가 코스트코 핫도그.',
    ],
  },
  {
    id: 'byd2', t: 'BYD·100세 생일·위기의 기억',
    pts: [
      'BYD는 올해 최소 250만 대를 팔 것 — 벤츠·테슬라보다 많다. 진행자가 "2억 7천만 달러가 약 80억 달러가 된 투자"라고 하자 멍거는 "상장사였지만 벤처캐피털 같은 투자"였다고 했다. 처음엔 자동차 사업에 들어가지 말라고 말렸지만 왕촨푸는 듣지 않았고, 큰 실수들을 겪고도 결국 대성공했다.',
      '100세 생일(2024년 1월 1일)에는 캘리포니아 클럽에서 파티를 할 계획이었다(그는 2023년 11월 28일 세상을 떠났다).',
      '살로몬 브라더스 사태는 큰 손실이 날 뻔했지만 0이 됐어도 버크셔는 살아남았을 것. 버펄로 뉴스의 일요판 경쟁도 위험한 고비였다.',
      '이자·세금·감가상각 전 이익(EBITDA)을 이익처럼 말하는 건 "거짓말" — 트럭 회사에서 트럭 감가상각을 빼면 이익을 속이는 것이다.',
    ],
  },
  {
    id: 'great', t: '가장 위대한 회사, 그리고 10년 뒤', tag: '에르메스',
    pts: [
      '"지금까지 본 가장 위대한 회사들은?" — "위대한 회사는 많다. 에르메스는 위대한 회사다. 전성기의 GM도 그랬지만 계약 하나하나를 거치며 서서히 망가졌다."',
      '대부분의 회사는 앞으로 변화와 위협을 많이 겪는다. 버크셔가 가진 특수 산업 회사들처럼 오래되고 평판이 좋아 경쟁에서 비켜선 곳도 있다.',
      '10년 뒤에도 지금만큼 좋을 거라고 자신할 회사? "좋은 회사는 많지만 무슨 일이 생길지 자신 있게 말할 수는 없다" — 경영자 한 명이 사업을 겉치레로 만들 수 있다.',
      '가족에 대해: 서로 힘든 때를 도와야 한다. 좋은 배우자를 얻는 법은 그럴 자격이 있는 사람이 되는 것.',
      '마지막 말: "잘 해내겠지만, 그렇게 쉽지는 않을 것이다."',
    ],
  },
]

export default async function Munger2023Page() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="space-y-2">
          <Link href="/private/buffett" className="text-xs text-gray-500 hover:underline">← 버핏·멍거의 회사들</Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">찰리 멍거 마지막 장편 인터뷰 (2023년 10월, 어콰이어드)</h1>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            멍거(당시 99세)가 세상을 떠나기 약 한 달 전, 로스앤젤레스 자택 저녁 자리에서 팟캐스트 어콰이어드(Acquired)의 벤 길버트·데이비드 로젠탈, 지인 앤드루 마크스와 나눈 대화. 그가 한 유일한 장편 팟캐스트 인터뷰다. 2023년 10월 30일 공개.
          </p>
          <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            아래는 녹취를 주제별로 우리말로 정리하고 핵심 문장만 원문과 함께 옮긴 것이다. 녹취 전문(영어)은 저작권이 Acquired에 있어 그대로 싣지 않았다 —{' '}
            <a href={SRC} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">전문(영어) 보기 ↗</a>
          </p>
        </div>

        <nav className="flex flex-wrap gap-1.5">
          {SECS.map(s => (
            <a key={s.id} href={`#${s.id}`} className={`text-xs px-2.5 py-1 rounded-full ${s.tag ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'} hover:opacity-80`}>{s.t}</a>
          ))}
        </nav>

        {SECS.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-20 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {i + 1}. {s.t}
              {s.tag && <span className="ml-2 align-middle text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{s.tag}</span>}
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
              {s.pts.map((p, k) => <li key={k}>{p}</li>)}
            </ul>
            {s.q && s.q.map((q, k) => (
              <blockquote key={k} className="border-l-4 border-emerald-300 dark:border-emerald-700 pl-3 py-0.5">
                <p className="text-xs italic text-gray-500 dark:text-gray-400">&ldquo;{q.en}&rdquo;</p>
                <p className="text-sm text-gray-800 dark:text-gray-100">→ {q.ko}</p>
              </blockquote>
            ))}
            {s.link && <Link href={s.link.href} className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline">{s.link.label}</Link>}
          </section>
        ))}

        <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          출처: Acquired, &ldquo;Charlie Munger&rdquo; (2023-10-30) 녹취. 숫자(BYD 투자액·판매 대수 등)는 인터뷰에서 나온 말 그대로이며 따로 확인하지 않았다.{' '}
          <a href={SRC} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">원문 녹취 ↗</a>
        </p>
      </div>
    </div>
  )
}
