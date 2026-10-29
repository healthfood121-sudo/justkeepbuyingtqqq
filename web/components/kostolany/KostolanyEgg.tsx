'use client'

import Image from 'next/image'
import { useState } from 'react'
import { MoneyMindMatrix, EggHistory, KostolanyExtra } from './KostolanyBook'

interface RateStep { phase: string; desc: string }
interface InvestorType { no: string; label: string; badge: string; icon: string; color: string; tagline: string; desc: string }
interface Comparison { key: string; strong: string; weak: string }
interface FourG { letter: string; german: string; korean: string; desc: string }
interface Melody { no: string; label: string; icon: string; color: string; factor: string; result: string; detail: string }
interface EggPhaseAction { phase: string; label: string; action: string; icon: string; color: string; tip: string }
interface KeyQuote { category: string; text: string }
interface VolumeSignal { volume: string; price: string; meaning: string; signal: string; icon: string }

const inflationSteps: string[] = ['호황 지속','수요 증가','가격 상승','원자재 상승','물가 상승','임금 인상 요구','생산원가 재상승','가격 재상승','인플레이션']
const successSteps: RateStep[] = [
  { phase: '주가 급등', desc: '경기 과열, 인플레이션 기미 발생' },
  { phase: '금리 인상', desc: '중앙은행 금리 몇 차례 인상' },
  { phase: '증시 대폭락', desc: '주가 급락 — 절호의 기회!' },
  { phase: '금리 인하', desc: '뉴스는 비관적이지만 무조건 매수' },
  { phase: '최고점 경신 후 추가 상승', desc: '주가 반등, 사상 최고점 경신 후 한참 더 상승' },
]
const failureSteps: RateStep[] = [
  { phase: '경고 무시', desc: '금리 인상에도 주가 계속 상승 (경고 신호 무시)' },
  { phase: '인플레이션 통제 불능', desc: '인플레이션 걷잡을 수 없이 심화, 경제 위기' },
  { phase: '금리 대폭 인상', desc: '은행 예금 급증, 통화 급격 감소 → 주식시장 암흑기' },
  { phase: '금리 인하해도 소용없음', desc: '임금·가격 이미 오를 대로 올라 효과 없음' },
  { phase: '장기 하락·경제 위기 악화', desc: '성공해도 결국 폭락장은 반드시 온다' },
]
const investorTypeItems: InvestorType[] = [
  { no: '10', label: '단기 투자자', badge: '주의', icon: '⚠️', color: 'red', tagline: '주식시장의 사기꾼', desc: '장기적으로 망할 것이 틀림없다. 80년간 투자 세계에 몸담아 왔지만 장기적으로 성공한 단기 투자자를 본 적 없다. 은행과 브로커들은 고객을 단기 투자자로 만들기 위해 별의별 수단을 다 쓴다.' },
  { no: '11', label: '장기 투자자', badge: '권장', icon: '🏃', color: 'blue', tagline: '주식시장의 마라토너', desc: '몇 십 년 뒤 노후 대책이나 유산으로 주식을 산다. 장기 투자는 모든 주식 거래 중 최고의 결과를 낳는 방법이다. 적은 액수의 돈으로 백만장자가 될 수 있는 가장 효율적인 방법이다.' },
  { no: '12', label: '순종 투자자', badge: '목표', icon: '🎯', color: 'emerald', tagline: '장기적 전략가 — 우리의 목표', desc: '모든 뉴스에 관심을 가지지만 반응하지 않는다. 자신의 판단 기초가 흔들릴 때만 비로소 움직인다. 자신만의 아이디어와 스타일을 가지며, 투자에서 중요한 것은 지식이 아니라 생각이다.' },
]
const soshinpaComparisons: Comparison[] = [
  { key: '좋은 소식 반응', strong: '반응 ✓', weak: '무반응 ✗' },
  { key: '나쁜 소식 반응', strong: '무반응 ✓', weak: '민감 반응 ✗' },
  { key: '대표 사례', strong: '확신 있는 장기 투자자', weak: '펀드매니저·기관투자자' },
  { key: '장기 결과', strong: '승자', weak: '패자' },
]
const fourGItems: FourG[] = [
  { letter: 'G', german: 'Geld', korean: '돈', desc: '충분한 여유 자금. 빚 없이 투자하라' },
  { letter: 'G', german: 'Gedanken', korean: '생각', desc: '자신만의 투자 철학과 독자적 판단' },
  { letter: 'G', german: 'Geduld', korean: '인내', desc: '결과를 기다리는 끈기와 침착함' },
  { letter: 'G', german: 'Glück', korean: '행운', desc: '준비된 자에게 찾아오는 기회' },
]
const melodyItems: Melody[] = [
  { no: '1', label: '장기 멜로디', icon: '🌏', color: 'blue', factor: '전쟁 & 평화 / 경제 발전', result: '장기 우상향', detail: '평화가 유지된다면 경제는 장기적으로 발전하며 주식시장은 우상향한다. 성공하려면 우량주에 투자한 뒤 수면제를 먹고 몇 년 동안 잠들어 있으면 된다.' },
  { no: '2', label: '중기 멜로디', icon: '💰', color: 'amber', factor: '돈(유동성) + 심리', result: '9~12개월 후 반영', detail: '유동자금이 넘쳐흘러도 주식에 부정적 생각을 가지고 있다면, 그 자금은 9~12개월 사이에 주식시장으로 들어온다. 돈이 먼저고 그다음 경기 전망이 나오는 것이지, 경기 전망이 먼저가 아니다.' },
  { no: '3', label: '단기 멜로디', icon: '⚖️', color: 'purple', factor: '공급과 수요', result: '매도자 vs 매수자의 긴박감', detail: '주가의 흐름은 매도자가 매수자보다 더 급박함을 느끼는가 안 느끼는가에 달려 있다. 모든 것은 공급과 수요에 달려 있다. 내 모든 주식투자 이론은 여기에서 세워졌다고 해도 과언이 아니다.' },
]
const eggGuidePhases: EggPhaseAction[] = [
  { phase: 'A 단계', label: '금리 고점', action: '매수 시작', icon: '🛒', color: 'orange', tip: '소신파들이 조용히 주식을 축적하기 시작. 대중은 아직 비관적이며 뉴스는 부정적' },
  { phase: 'B 단계', label: '버블 최고점', action: '매도 준비', icon: '🚨', color: 'red', tip: '자산 가격 급등, 투기 만연. 조금씩 수익 실현 시작. 대중이 열광할 때 주의' },
  { phase: 'C 단계', label: '경제 위기', action: '현금 보유', icon: '💵', color: 'yellow', tip: '패닉 매도 시기. 절대 같이 팔지 말고 현금 보유하며 기다려라' },
  { phase: 'D 단계', label: '금리 저점', action: '무조건 매수', icon: '🎯', color: 'green', tip: '금리를 인하했다면 무조건 주식시장에 뛰어들어야 한다! 절호의 기회' },
  { phase: 'E 단계', label: '경기 회복', action: '계속 보유', icon: '📈', color: 'blue', tip: '경기 회복 신호. 우량주는 계속 보유하며 상승세를 누려라' },
  { phase: 'F 단계', label: '호황', action: '매도 준비', icon: '⚠️', color: 'purple', tip: '낙관론 만연. 주변 사람들이 주식 이야기를 시작하면 슬슬 팔 준비를 하라' },
]
const rulesList: string[] = [
  '매입 시기라고 생각되면 어느 업종의 주식을 매입할 것인지 결정하라',
  '압박감에 시달리지 않도록 충분한 돈을 가지고 행동하라',
  '모든 일이 생각과 다르게 진행될 수 있다는 것을 명심하고 반드시 인내하라',
  '확신이 있으면 강하고 고집스럽게 밀어붙여라',
  '유연하게 행동하고 자신의 생각이 잘못될 수 있음을 인정하라',
  '완전히 새로운 상황이 전개되면 즉시 팔아라',
  '때때로 보유 종목 리스트를 보고 지금이라도 역시 살 것인지 검토하라',
  '대단한 가능성을 예견할 수 있을 경우에만 사라',
  '계속해서 예측할 수 없는 위험도 항상 염두에 두라',
  '자신의 주장이 옳다라도 겸손하라',
]
const taboosList: string[] = [
  '추천 종목을 따르지 말며 비밀스러운 소문에 귀 기울이지 말라',
  '파는 사람이 왜 파는지, 사는 사람이 왜 사는지 알고 있다고 생각하지 말라',
  '손실을 다시 회복하려고 하지 마라',
  '지난 시세에 연연하지 마라',
  '주식을 사 놓은 뒤 언젠가 오를 것이라는 희망 속에 잊고 지내지 마라',
  '시세 변화에 민감하게 반응하지 마라',
  '어디서 수익 혹은 손실이 있었는지 계속해서 계산하지 마라',
  '단기 수익을 얻기 위해 달리지 마라',
  '정치적 성향(지지나 반대)에 의해 심리적 영향을 받지 마라',
  '이익을 보았다고 해서 오만해지지 마라',
]
const keyQuoteItems: KeyQuote[] = [
  { category: '재정적 독립', text: '재정적 독립은 건강 다음으로 중요한 최고의 선이며 가장 귀한 것이다. 돈이 아무리 많아도 독립을 이루지 못한 부자는 진정한 부자가 아니다.' },
  { category: '돈을 대하는 자세', text: '돈을 사랑하면서도 차갑게 버릴 수 있는 사람이 부를 누릴 수 있다. 잃어버릴 수도 있다는 것을 상상하며 투자해야 건강한 투자를 할 수 있다.' },
  { category: '투자의 역설', text: '돈이 많은 사람은 투자를 할 수 있다. 돈이 조금밖에 없는 사람은 투자를 해선 안 된다. 그러나 돈이 전혀 없는 사람은 반드시 투자해야 한다.' },
  { category: '경제와 주식시장', text: '주인이 1km를 걷는 동안 개는 앞서가다 돌아오다를 반복하면서 4km를 걷게 된다. 여기서 주인은 경제이고 개는 주식시장이다. 장기적으로는 같은 방향으로 가지만 단기적으로는 다른 방향으로 간다.' },
  { category: '강세장의 비밀', text: '돈이 먼저고 그다음 경기 전망이 나오는 것이지, 경기 전망이 먼저 나오는 것이 아니다. 경제 상황이 낙관적이고 충분한 유동자금이 있다면 이것이 강세장이 형성되는 비밀이다.' },
  { category: '인내', text: '주식은 머리로 보는 것이 아니라 엉덩이로 본다. 투자해서 얻은 돈은 고통의 대가로 받는 돈이다. 투자라는 건물의 기초가 튼튼하고 올바르면 모든 것은 시간 문제다.' },
  { category: '역발상', text: '시장의 악재에도 더 이상 하락하지 않는다면 그것은 시장이 과잉매도 상태라는 이야기다. 반대로 호재에도 더 이상 상승하지 않는다면 그것은 시장이 과잉매수 상태다.' },
  { category: '거래량 신호', text: '주가가 하락해도 거래량이 많다면 이것은 부화뇌동파에서 소신파로 주식이 넘어가고 있음을 의미한다. 거래량이 증가함에도 주가가 계속 떨어진다면 이것은 강력한 상승 운동의 전조이다.' },
  { category: '공시와 실적', text: '공시와 실적 발표를 보고 투자하지 마라. 이미 선반영된 사실이다. 이미 알려진 사실로 접근해서는 절대 안 된다.' },
  { category: '독자적 사고', text: '누구든 자신의 판단에 따라 독자적으로 생각하기만 한다면 그는 일하는 시간에 상관없이 이미 90%의 동료를 앞서 나가는 것이다. 계속 끊임없이 생각하라.' },
  { category: '붐과 폭락', text: '붐과 폭락은 분리할 수 없는 쌍둥이다. 붐 없는 폭락 없고 폭락 없이는 붐 없다. 400여 년에 이르는 주식시장의 역사는 붐과 폭락의 반복이었다.' },
  { category: '손실 처리', text: '손실을 보았다면 즉시 그것을 받아들이고 0부터 다시 시작하라. 절대 잃어버린 돈을 찾고자 애쓰지 말라.' },
  { category: '참된 지식', text: '참된 주식거래 지식은 모든 상세한 것을 잊어버렸을 때 남는 그것이다. 모든 것을 알아야 하는 게 아니라 그것을 이해하고 상관관계를 파악하며 그에 맞게 행동할 줄 알아야 하는 것이다.' },
]
const volumeSignalItems: VolumeSignal[] = [
  { volume: '거래량 증가', price: '주가 하락 지속', meaning: '강력한 상승 운동의 전조. 소신파가 헐값에 매집 중', signal: 'strong_buy', icon: '📈' },
  { volume: '거래량 적음', price: '주가 서서히 상승', meaning: '아주 긍정적 신호. 시장 분위기가 안 좋다면 더욱 좋음', signal: 'buy', icon: '✅' },
  { volume: '거래량 적음', price: '주가 계속 하락', meaning: '좋지 않은 신호. 매수세 없는 하락', signal: 'bad', icon: '⚠️' },
  { volume: '거래량 폭증', price: '주가 급등', meaning: '위험 신호. 일반적으로 좋다고 여기지만 코스톨라니는 반대로 봄. 제3국면 끝자락 가능성', signal: 'danger', icon: '🚨' },
  { volume: '거래량 보통', price: '상승 또는 하락', meaning: '현재 흐름이 지속된다는 신호', signal: 'neutral', icon: '➡️' },
]

const investorTypeColors = [
  { border: 'border-red-300 dark:border-red-700', bg: 'bg-red-50 dark:bg-red-900/20', badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300', tagline: 'text-red-600 dark:text-red-400' },
  { border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20', badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300', tagline: 'text-blue-600 dark:text-blue-400' },
  { border: 'border-emerald-300 dark:border-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300', tagline: 'text-emerald-600 dark:text-emerald-400' },
]
const melodyColors = [
  { border: 'border-blue-200 dark:border-blue-800', bg: 'bg-blue-50 dark:bg-blue-900/20', accent: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  { border: 'border-amber-200 dark:border-amber-800', bg: 'bg-amber-50 dark:bg-amber-900/20', accent: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' },
  { border: 'border-purple-200 dark:border-purple-800', bg: 'bg-purple-50 dark:bg-purple-900/20', accent: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
]
const phaseActionColors = [
  { border: 'border-orange-300 dark:border-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/20', action: 'text-orange-600 dark:text-orange-400' },
  { border: 'border-red-300 dark:border-red-700', bg: 'bg-red-50 dark:bg-red-900/20', action: 'text-red-600 dark:text-red-400' },
  { border: 'border-yellow-300 dark:border-yellow-700', bg: 'bg-yellow-50 dark:bg-yellow-900/20', action: 'text-yellow-600 dark:text-yellow-400' },
  { border: 'border-green-300 dark:border-green-700', bg: 'bg-green-50 dark:bg-green-900/20', action: 'text-green-600 dark:text-green-400' },
  { border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20', action: 'text-blue-600 dark:text-blue-400' },
  { border: 'border-purple-300 dark:border-purple-700', bg: 'bg-purple-50 dark:bg-purple-900/20', action: 'text-purple-600 dark:text-purple-400' },
]
const quoteBorderColors = [
  'border-l-blue-500','border-l-purple-500','border-l-emerald-500',
  'border-l-orange-500','border-l-red-500','border-l-amber-500',
  'border-l-blue-500','border-l-purple-500','border-l-emerald-500',
  'border-l-orange-500','border-l-red-500','border-l-amber-500',
  'border-l-blue-500',
]

export default function KostolanyEgg() {
  const [modalImage, setModalImage] = useState<string | null>(null)

  return (
    <div className="w-full space-y-8">
      {/* 헤더 */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
          코스톨라니 달걀 모형
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
          앙드레 코스톨라니의 주식 시장 사이클 이론
        </p>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
          코스톨라니 달걀은 투자의 대가 앙드레 코스톨라니가 제시한 주식 시장의 심리 사이클 모형입니다. 달걀 모양의 곡선으로 시장 참여자들의 감정 변화와 주가 움직임의 패턴을 설명합니다.
        </p>
      </div>

      {/* 이미지 비교 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          달걀 모형 비교
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">코스톨라니 달걀 모형 1</h3>
            <div
              className="relative w-full aspect-[4/3] bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
              onClick={() => setModalImage('/images/cycles/kostolany-egg-1.jpg')}
            >
              <Image src="/images/cycles/kostolany-egg-1.jpg" alt="코스톨라니 달걀 모형 1" fill className="object-contain" priority unoptimized />
              <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-10 transition-all flex items-center justify-center pointer-events-none">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg pointer-events-auto">클릭하여 확대</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">코스톨라니 달걀 모형 2</h3>
            <div
              className="relative w-full aspect-[4/3] bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
              onClick={() => setModalImage('/images/cycles/kostolany-egg-2.png')}
            >
              <Image src="/images/cycles/kostolany-egg-2.png" alt="코스톨라니 달걀 모형 2" fill className="object-contain" priority unoptimized />
              <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-10 transition-all flex items-center justify-center pointer-events-none">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-lg pointer-events-auto">클릭하여 확대</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 금리와 주식시장 */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">금리와 주식시장</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">「돈 뜨겁게 사랑하고 차갑게 다루어라」 — 앙드레 코스톨라니</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 bg-red-100 dark:bg-red-900/40 px-5 py-3">
              <span className="text-2xl">📈</span>
              <span className="font-black text-red-700 dark:text-red-300 text-base">금리 인상 → 주가 하락</span>
              <span className="ml-auto px-2.5 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full whitespace-nowrap">시간 문제</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed px-5 py-4">중앙은행이 금리를 인상하면 주가가 하락하는 것은 시간 문제다. 이전에 주식시장 분위기가 과열됐다면 그만큼 떨어지는 폭이 크다. 이 차이를 아는 사람은 적시에 빠져나올 수 있다.</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900/40 px-5 py-3">
              <span className="text-2xl">📉</span>
              <span className="font-black text-emerald-700 dark:text-emerald-300 text-base">금리 인하 → 주식 매수</span>
              <span className="ml-auto px-2.5 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full whitespace-nowrap">무조건</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed px-5 py-4">금리를 인하했다면 무조건 주식시장에 뛰어들어야 한다. 주가가 바닥일 때 시장에 들어온 투자자는 큰 부를 축적할 수 있다.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">인플레이션 발생 메커니즘</h3>
          <div className="space-y-2">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-stretch gap-1.5">
                {inflationSteps.slice(row * 3, row * 3 + 3).map((step, col) => {
                  const idx = row * 3 + col
                  const isLast = idx === inflationSteps.length - 1
                  return (
                    <div key={col} className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className={`flex-1 min-w-0 rounded-lg py-2 px-2.5 text-center ${isLast ? 'bg-red-500 text-white font-bold shadow-md' : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300'}`}>
                        <div className={`text-[10px] mb-0.5 font-bold ${isLast ? 'text-red-200' : 'text-orange-400 dark:text-orange-500'}`}>{idx + 1}</div>
                        <div className="text-xs sm:text-sm font-semibold leading-tight">{step}</div>
                      </div>
                      {col < 2 && <span className="text-orange-400 dark:text-orange-500 font-black text-sm flex-shrink-0">→</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-relaxed">인플레이션이 아니라 고금리 정책이 주식시장에 해를 입히는 요인이다. 금리가 주가에 가장 큰 영향을 미치는 요소다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
            <div className="bg-emerald-500 px-5 py-3">
              <h3 className="text-sm font-bold text-white">✅ 조치 성공 시나리오</h3>
            </div>
            <div className="p-5 relative">
              <div className="absolute left-[28px] top-5 bottom-5 w-0.5 bg-emerald-100 dark:bg-emerald-900/40" />
              <div className="space-y-3">
                {successSteps.map((step, i) => {
                  const isOpportunity = i === 2
                  return (
                    <div key={i} className="flex gap-3 items-start relative">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center z-10 ring-2 ${isOpportunity ? 'bg-yellow-400 text-yellow-900 ring-yellow-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 ring-white dark:ring-gray-800'}`}>{i + 1}</div>
                      <div className={`flex-1 rounded-xl px-3 py-2.5 ${isOpportunity ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700' : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700'}`}>
                        <p className={`text-sm font-bold leading-tight mb-0.5 ${isOpportunity ? 'text-yellow-800 dark:text-yellow-300' : 'text-gray-800 dark:text-gray-200'}`}>{step.phase} {isOpportunity && '⭐'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
            <div className="bg-red-500 px-5 py-3">
              <h3 className="text-sm font-bold text-white">❌ 조치 실패 시나리오</h3>
            </div>
            <div className="p-5 relative">
              <div className="absolute left-[28px] top-5 bottom-5 w-0.5 bg-red-100 dark:bg-red-900/40" />
              <div className="space-y-3">
                {failureSteps.map((step, i) => {
                  const isOpportunity = i === failureSteps.length - 1
                  return (
                    <div key={i} className="flex gap-3 items-start relative">
                      <div className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-black flex items-center justify-center z-10 ring-2 ${isOpportunity ? 'bg-yellow-400 text-yellow-900 ring-yellow-300' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 ring-white dark:ring-gray-800'}`}>{i + 1}</div>
                      <div className={`flex-1 rounded-xl px-3 py-2.5 ${isOpportunity ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700' : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700'}`}>
                        <p className={`text-sm font-bold leading-tight mb-0.5 ${isOpportunity ? 'text-yellow-800 dark:text-yellow-300' : 'text-gray-800 dark:text-gray-200'}`}>{step.phase} {isOpportunity && '⭐'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
          <div className="text-center space-y-2">
            <p className="text-base sm:text-lg font-black tracking-wide">&ldquo;위 상황은 계속 반복된다. 이것은 영원불변의 법칙이다.&rdquo;</p>
            <div className="w-12 h-0.5 bg-slate-500 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">금리를 인하했을 때가 절호의 기회. 폭락장은 반드시 오고 반드시 끝난다.</p>
          </div>
        </div>
      </div>

      {/* 돈의 법칙: 9~12개월 시차 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">돈의 법칙: 9~12개월 시차</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">주가는 경기 전망이 아니라 유동성이 결정한다</p>
        </div>
        <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-5">
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300 leading-relaxed">돈이 먼저고 그 다음 경기 전망이 나온다. 경기 전망이 나오고 돈이 나오는 게 아니다.</p>
        </div>
        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center bg-slate-800 dark:bg-slate-700 text-white rounded-2xl px-8 py-3">
            <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-0.5">시차</span>
            <span className="text-3xl font-black text-yellow-400">9 ~ 12개월</span>
            <span className="text-xs text-slate-300 mt-0.5">유동성 변화가 주식시장에 반영되는 시간</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl overflow-hidden">
            <div className="bg-emerald-500 px-4 py-2.5"><h3 className="text-sm font-black text-white">💰 유동성 과잉</h3></div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2"><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">① 발단</span><p className="text-sm text-gray-700 dark:text-gray-300">시중에 돈이 넘쳐흐름</p></div>
              <div className="flex items-center gap-2 text-emerald-400"><div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800" /><span className="text-xs font-bold whitespace-nowrap">9 ~ 12개월 후</span><div className="flex-1 h-px bg-emerald-200 dark:bg-emerald-800" /></div>
              <div className="flex items-start gap-2"><span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">② 과정</span><p className="text-sm text-gray-700 dark:text-gray-300">주식에 부정적이어도 유동자금은 결국 주식시장으로 유입</p></div>
              <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-lg px-3 py-2"><p className="text-sm font-black text-emerald-700 dark:text-emerald-300">→ 강세장 형성</p></div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">첫 매수는 완전한 바닥에서 시작, 서서히 상승</p>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl overflow-hidden">
            <div className="bg-red-500 px-4 py-2.5"><h3 className="text-sm font-black text-white">📉 유동성 부족</h3></div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2"><span className="text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">① 발단</span><p className="text-sm text-gray-700 dark:text-gray-300">채권금리 상승 → 자금이 채권으로 이동</p></div>
              <div className="flex items-center gap-2 text-red-400"><div className="flex-1 h-px bg-red-200 dark:bg-red-800" /><span className="text-xs font-bold whitespace-nowrap">9 ~ 12개월 후</span><div className="flex-1 h-px bg-red-200 dark:bg-red-800" /></div>
              <div className="flex items-start gap-2"><span className="text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">② 과정</span><p className="text-sm text-gray-700 dark:text-gray-300">주식 유입 자금 감소, 좋은 경제 소식도 무력화</p></div>
              <div className="bg-red-100 dark:bg-red-900/40 rounded-lg px-3 py-2"><p className="text-sm font-black text-red-700 dark:text-red-300">→ 투자심리 부정적 전환</p></div>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">돈이 새로 유입되지 않으면 주가는 오르지 않는다</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-center">아무리 좋은 경제 소식이 많아도 자금이 새로 유입되지 않는다면 주가는 오르지 않는다. 반대로 아무리 비관적이어도 돈이 넘치면 결국 9~12개월 내에 주식시장으로 들어온다.</p>
        </div>
      </div>

      <MoneyMindMatrix />

      {/* 투자자 3가지 유형 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">투자자 3가지 유형</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">당신은 어떤 투자자인가?</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {investorTypeItems.map((type, i) => (
            <div key={i} className={`rounded-xl p-5 border-2 ${investorTypeColors[i].border} ${investorTypeColors[i].bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{type.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${investorTypeColors[i].badge}`}>{type.badge}</span>
                <span className="ml-auto text-xs text-gray-400">No.{type.no}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{type.label}</h3>
              <p className={`text-sm font-semibold ${investorTypeColors[i].tagline} mb-3`}>{type.tagline}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{type.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 소신파 vs 부화뇌동파 + 4G */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">소신파 vs 부화뇌동파</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">당신은 어느 쪽인가?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 items-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 text-center">
              <h3 className="text-emerald-700 dark:text-emerald-400 font-bold mb-2">소신파 (Hartgesottene)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">진정한 투자자. 장기적으로 승자에 속한다.</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-3xl font-black text-gray-300 dark:text-gray-600">VS</span>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 text-center">
              <h3 className="text-red-700 dark:text-red-400 font-bold mb-2">부화뇌동파 (Zittrige)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">주식으로 도박을 하는 사람들. 결국 손해를 본다.</p>
            </div>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-900 text-xs font-bold p-2.5 border-b border-gray-200 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400">항목</div>
              <div className="text-center text-emerald-600 dark:text-emerald-400">소신파</div>
              <div className="text-center text-red-600 dark:text-red-400">부화뇌동파</div>
            </div>
            {soshinpaComparisons.map((comp, i) => (
              <div key={i} className={`grid grid-cols-3 text-sm p-2.5 ${i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
                <div className="text-gray-700 dark:text-gray-300 font-medium">{comp.key}</div>
                <div className="text-center text-emerald-700 dark:text-emerald-400">{comp.strong}</div>
                <div className="text-center text-red-700 dark:text-red-400">{comp.weak}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white">
          <h3 className="text-xl font-bold text-center mb-1">소신파의 4G 원칙</h3>
          <p className="text-sm text-center text-slate-400 mb-6">부채가 없는 상태가 돈이 있는 상태다. 절대 빚내서 투자하지 말라.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {fourGItems.map((g, i) => (
              <div key={i} className="text-center bg-slate-700/50 rounded-xl p-4">
                <div className="text-3xl font-black text-blue-400 mb-1">{g.letter}</div>
                <div className="text-base font-bold text-white mb-0.5">{g.korean}</div>
                <div className="text-xs text-slate-400 italic mb-2">{g.german}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 시장의 3가지 멜로디 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">주식시장의 3가지 멜로디</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">주식시장의 기본 멜로디를 알아들을 수 있는 안테나를 가져라</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {melodyItems.map((melody, i) => (
            <div key={i} className={`rounded-xl p-5 border ${melodyColors[i].border} ${melodyColors[i].bg}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{melody.icon}</span>
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${melodyColors[i].badge}`}>{melody.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-sm mb-3">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{melody.factor}</span>
                <span className="text-gray-400">→</span>
                <span className={`font-bold ${melodyColors[i].accent}`}>{melody.result}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{melody.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 거래량으로 시장 읽기 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">거래량으로 시장 읽기</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">코스톨라니의 거래량 해석법 — 암기 수준으로 익혀라</p>
        </div>
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5">
          <span className="text-xl flex-shrink-0">💡</span>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 leading-relaxed">주가가 하락할 때 거래량이 많다면, 부화뇌동파에서 소신파로 주식이 넘어가고 있다는 신호다.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {volumeSignalItems.map((sig, i) => {
            const styles = {
              strong_buy: { card: 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600', badge: 'bg-emerald-500 text-white', label: '강력 매집 신호', labelColor: 'text-emerald-700 dark:text-emerald-400' },
              buy:        { card: 'bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700', badge: 'bg-green-500 text-white', label: '긍정 신호', labelColor: 'text-green-700 dark:text-green-400' },
              bad:        { card: 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700', badge: 'bg-orange-500 text-white', label: '부정 신호', labelColor: 'text-orange-700 dark:text-orange-400' },
              danger:     { card: 'bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600', badge: 'bg-red-500 text-white', label: '위험 신호', labelColor: 'text-red-700 dark:text-red-400' },
              neutral:    { card: 'bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700', badge: 'bg-gray-400 text-white', label: '중립 신호', labelColor: 'text-gray-600 dark:text-gray-400' },
            }[sig.signal] ?? { card: 'bg-gray-50 border-2 border-gray-200', badge: 'bg-gray-400 text-white', label: '신호', labelColor: 'text-gray-600' }
            return (
              <div key={i} className={`rounded-xl p-4 ${styles.card}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{sig.icon}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>{styles.label}</span>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-xs"><span className="text-gray-400 dark:text-gray-500 flex-shrink-0">거래량</span><span className="font-bold text-gray-800 dark:text-gray-200">{sig.volume}</span></div>
                  <div className="flex items-center gap-1.5 text-xs"><span className="text-gray-400 dark:text-gray-500 flex-shrink-0">주 가</span><span className="font-bold text-gray-800 dark:text-gray-200">{sig.price}</span></div>
                </div>
                <p className={`text-xs leading-relaxed font-medium ${styles.labelColor}`}>{sig.meaning}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 달걀 6국면 행동 가이드 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">달걀 6국면 행동 가이드</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">주식시장을 보는 기술의 핵심은 현재 시장이 어디에 위치하고 있는지 정확히 아는 데 있다</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {eggGuidePhases.map((p, i) => (
            <div key={i} className={`rounded-xl p-4 border-2 ${phaseActionColors[i].border} ${phaseActionColors[i].bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{p.phase}</span>
                <span className="text-xl">{p.icon}</span>
              </div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{p.label}</div>
              <div className={`text-lg font-black ${phaseActionColors[i].action} mb-2`}>{p.action}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{p.tip}</p>
            </div>
          ))}
        </div>
      </div>

      <EggHistory />

      <KostolanyExtra />

      {/* 10가지 수칙 & 금기사항 */}
      <div className="space-y-2">
        <div className="text-center mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">10가지 수칙 &amp; 10가지 금기사항</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mb-4">✅ 10가지 투자 수칙</h3>
            <ol className="space-y-2.5">
              {rulesList.map((rule, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h3 className="text-base font-bold text-red-600 dark:text-red-400 mb-4">❌ 10가지 금기사항</h3>
            <ol className="space-y-2.5">
              {taboosList.map((taboo, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{taboo}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* 핵심 명언 카드 */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">핵심 명언</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">앙드레 코스톨라니의 투자 철학</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyQuoteItems.map((quote, i) => (
            <div key={i} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border-l-4 ${quoteBorderColors[i % quoteBorderColors.length]}`}>
              <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{quote.category}</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">&ldquo;{quote.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      {/* 명언 */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 sm:p-12 text-white">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">💡</div>
          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-bold italic">
            &ldquo;주식 시장은 2+2=5-1과 같다. 결과는 4로 정확하지만, 과정은 결코 직선이 아니다.&rdquo;
          </blockquote>
          <p className="text-lg sm:text-xl opacity-90">— 앙드레 코스톨라니</p>
        </div>
      </div>

      {/* 코스톨라니 소개 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">앙드레 코스톨라니</h2>
          <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">투자의 대가</p>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            앙드레 코스톨라니(1906-1999)는 독일의 전설적인 투자자이자 작가입니다. 70년 이상의 투자 경험을 바탕으로 시장 심리와 사이클에 대한 깊은 통찰을 제공했으며, &lsquo;달걀 모형&rsquo;은 그의 가장 유명한 이론 중 하나입니다.
          </p>
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4" onClick={() => setModalImage(null)}>
          <button onClick={() => setModalImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image src={modalImage} alt="확대된 코스톨라니 달걀 모형" fill className="object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  )
}
