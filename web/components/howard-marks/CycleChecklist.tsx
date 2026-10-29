'use client';

import { useState, useMemo } from 'react';

type StageType = 'bull1' | 'bull2' | 'bull3' | 'bear1' | 'bear2' | 'bear3' | null;
type VerdictKey = 'extreme_bull' | 'strong_bull' | 'weak_bull' | 'neutral' | 'weak_bear' | 'strong_bear' | 'extreme_bear';
type QuestionChoice = 'bull' | 'bear' | null;

interface VerdictInfo { label: string; action: string; desc: string; emoji: string; color: string }
interface QuestionItem { q: string; bull: string; bear: string }
interface FearGreedItem { label: string; desc: string }
interface CognitiveBiasItem { label: string; desc: string }
interface KeyPrincipleItem { label: string; desc: string }
interface InvestorTaskItem { step: string; task: string; desc: string }
interface QuoteItem { text: string; author: string }
interface SuccessElement { label: string; desc: string }
interface RiskTypeItem { label: string; desc: string }
interface MegaBullItem { no: string; title: string; desc: string }
interface ProbStep { step: string; title: string; desc: string }
interface HistoricalBubbleItem { period: string; name: string; desc: string }
interface PendulumItem { bull: string; bear: string; desc: string }

const VERDICT_COLOR_MAP: Record<VerdictKey, string> = {
  extreme_bull: 'red', strong_bull: 'orange', weak_bull: 'yellow',
  neutral: 'gray', weak_bear: 'blue', strong_bear: 'green', extreme_bear: 'green',
};

const VERDICT_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red:    { bg: 'bg-red-50 dark:bg-red-950/30',       border: 'border-red-200 dark:border-red-800',       text: 'text-red-700 dark:text-red-300',       badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
  gray:   { bg: 'bg-gray-50 dark:bg-gray-800/50',     border: 'border-gray-200 dark:border-gray-700',     text: 'text-gray-700 dark:text-gray-300',     badge: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-800',     text: 'text-blue-700 dark:text-blue-300',     badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  green:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', badge: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' },
};

function getVerdictKey(netScore: number): VerdictKey {
  if (netScore >= 60) return 'extreme_bull';
  if (netScore >= 30) return 'strong_bull';
  if (netScore >= 10) return 'weak_bull';
  if (netScore > -10) return 'neutral';
  if (netScore > -30) return 'weak_bear';
  if (netScore > -60) return 'strong_bear';
  return 'extreme_bear';
}


// ─── 하드코딩된 번역 데이터 ───
const CONST_BULLITEMS = ["경제가 성장하고 있으며, 경제상황이 긍정적이다.", "기업 이익이 증가하고 있으며 기대를 뛰어넘는다.", "매스컴은 좋은 뉴스만 전달한다.", "주식시장이 강화된다.", "투자자들이 점점 자신감을 가지고 낙관적인 성향을 갖는다.", "리스크를 드물고 대수롭지 않은 것처럼 여긴다.", "투자자들은 이익을 얻기 위해서는 당연히 위험을 수용해야 한다고 생각한다.", "탐욕이 행동에 동기를 부여한다.", "투자 기회에 대한 수요가 공급을 초과한다.", "자산가격이 내재가치 이상으로 오른다.", "자본시장이 열려 있어 자금 조달과 채무 롤오버가 쉽다.", "채무불이행이 거의 발생하지 않는다.", "회의론적인 시각이 적고, 신뢰도는 높다. 즉 위험한 거래가 이루어진다.", "아무도 상황이 잘못될 거라고 상상하지 못한다.", "모두가 상황이 영원히 좋을거라 생각한다.", "투자자들은 손실가능성을 무시한 채 기회를 놓치는것에 대해서만 염려한다.", "매수자가 매도자보다 많다.", "가격이 새로운 고점에 도달한다.", "투자자들은 도취되어 근심이 없어진다.", "방관자들이 후회하며, 항복하고 매수한다."];
const CONST_BEARITEMS = ["경제 발전이 둔화된다. 경제 상황이 부정적이다.", "기업 이익은 변동이 없거나 감소하며 예상치에 미치지 못한다.", "매스컴은 나쁜 뉴스만 보도한다.", "주식시장이 약화된다.", "투자자들은 걱정이 많아지고 침체된다.", "어디에나 리스크가 존재하는 것처럼 보인다.", "투자자들은 위험을 수용하면 돈을 잃는다고 여긴다.", "공포가 투자자 심리를 지배한다.", "주식 수요가 공급에 미치지 못한다.", "자산가격이 내재가치 이하로 떨어진다.", "자본시장이 경색되어 유가증권의 발행이나 부채 차환이 어려워진다.", "채무불이행이 급증한다.", "회의론적인 시각이 많고 신뢰도는 낮다. 즉 안전한 거래만 가능하고 거래가 아예 없을 수도 있다.", "아무도 개선이 가능하다고 생각하지 않고, 어떤 부정적인 결과도 일어날 수 있다고 여긴다.", "모두 상황이 영원히 악화될거라고 생각한다.", "투자자들은 기회를 놓칠 가능성은 무시하고 손실만 걱정한다.", "매도자가 매수자보다 많다.", "가격이 새로운 저점에 도달한다.", "투자자들은 침체되고 공황 상태에 빠진다.", "포기하고 낮은 가격에 매도하는 사람들이 하락세를 더욱 심화시킨다."];
const CONST_KEYQUESTIONS_ITEMS = [{"q": "투자자들의 전반적인 심리는?", "bull": "낙관적 · 자신감 넘침", "bear": "비관적 · 침체되어 있음"}, {"q": "미디어 전문가들의 조언 방향은?", "bull": "시장에 뛰어들라고 권유", "bear": "시장을 피하라고 경고"}, {"q": "새로운 투자 전략·금융 상품에 대한 반응은?", "bull": "쉽게 받아들이고 열광함", "bear": "회의적이고 묵살함"}, {"q": "신규 펀드·증권 상품의 인식은?", "bull": "부자가 될 기회로 여김", "bear": "잠재적 위험으로 인식"}, {"q": "신용 시장 (자본 접근성)은?", "bull": "자금 조달이 쉽고 신용 완화", "bear": "자금 조달 어렵고 신용 경색"}, {"q": "현재 주가수익비율(PER) 수준은?", "bull": "역사적으로 높음 (고평가)", "bear": "역사적으로 낮음 (저평가)"}, {"q": "수익률 스프레드(국채 vs 회사채)는?", "bull": "좁음 (신용 안정, 낮은 리스크 프리미엄)", "bear": "넓음 (신용 불안, 높은 리스크 프리미엄)"}];
const CONST_CREDITCYCLE_EASYITEMS = ["기회를 놓칠까봐 두려워하는 분위기 (FOMO)", "위험회피 성향과 회의주의가 감소함", "지나치게 많은 자금이 소수의 거래를 좇음", "자격 미달 차용자에게도 대출이 이루어짐", "높은 자산 가격, 낮은 수익률, 낮은 리스크 프리미엄"];
const CONST_CREDITCYCLE_TIGHTITEMS = ["손실에 대한 두려움이 지배적", "위험회피 성향과 회의주의가 고조됨", "가치와 관계없이 대출 및 투자를 꺼림", "도처에서 자본이 부족하고 차환이 어려움", "낮은 자산 가격, 높은 잠재 수익률, 과도한 리스크 프리미엄"];
const CONST_BUBBLERALLY_ITEMS = ["긍정적인 경제 소식", "우호적인 기사와 책들", "걱정 없고 위험을 의식하지 못하는 투자자의 행동", "이례적으로 높은 투자수익률", "역사적 수치에 비해 극도로 높은 밸류에이션"];
const CONST_BUBBLERALLY_WARNINGITEMS = ["분석적으로 정당화 할 수 없는 가격을 지불하려는 광범위한 의사", "멈추지 않는 영구기관에 대한 믿음", "거품을 이끈 진실 한 조각이 영원히 지속될 수 있다는 믿음이 광범위하게 수용된다.", "가격 상승의 이유를 '이번에는 다르다'는 말로 설명한다.", "금융 재앙의 기억이 빠르게 잊히고, 신세대는 같은 상황을 혁신적 발견으로 맞이한다."];
const CONST_STAGES_BULL_STAGES = [{"step": "1단계", "desc": "소수의 통찰력 있는 투자자들만 상황이 좋아질 것이라고 믿는 시기"}, {"step": "2단계", "desc": "대부분의 투자자들이 개선이 실제로 일어나고 있다는 사실을 깨달은 시기"}, {"step": "3단계", "desc": "모든 사람들이 상황이 영원히 나아질 것이라고 확신하는 시기"}];
const CONST_STAGES_BEAR_STAGES = [{"step": "1단계", "desc": "몇몇 신중한 투자자들만 상황이 언제나 좋을 수는 없다는 사실을 인식하는 시기"}, {"step": "2단계", "desc": "대부분의 투자자들이 상황이 나빠지고 있음을 인식하는 시기"}, {"step": "3단계", "desc": "모든 사람들이 상황이 더 나빠지기만 할 것이라고 확신하는 시기"}];
const CONST_ENVCHECKLIST_POSITIVEITEMS = ["일반적으로 좋은 뉴스가 들려온다", "발생하는 사건들에 대해 만족스럽다", "매스컴이 한결같이 긍정적으로 보도한다", "낙관적인 이야기를 의심 없이 수용한다", "회의주의가 감소하고 있다", "위험회피 성향이 부족해지고 있다", "신용시장이 완화되고 있다", "전반적으로 분위기가 긍정적이다"];
const CONST_ENVCHECKLIST_NEGATIVEITEMS = ["일반적으로 나쁜 뉴스가 들려온다", "발생하는 사건들에 대한 경고가 나온다", "매스컴이 매우 부정적으로 보도한다", "나쁜 이야기를 전면적으로 수용한다", "회의주의가 상당히 확대되고 있다", "위험회피 성향이 상당히 증가하고 있다", "신용시장이 경색되고 있다", "전반적으로 분위기가 침체되어 있다"];
const CONST_RISKATTITUDE_OPTIMISTICITEMS = ["환경이 긍정적으로 느껴지고, 투자 과정에 주의를 덜 기울인다.", "투자가 더 이상 위험하다고 생각하지 않으므로 공들여 분석할 필요성을 느끼지 못한다.", "더 관대한 가정을 하기 쉽고, 회의주의를 믿음으로 바꾼다.", "안전마진이 감소했어도 기꺼이 투자하려고 한다.", "위험을 덜 걱정하기 때문에 리스크 프리미엄을 충분히 요구하지 않는다.", "위험한 투자에 끌리고 리스크에 덜 민감하기 때문에 까다롭게 행동하지 않는다."];
const CONST_RISKATTITUDE_PESSIMISTICITEMS = ["최근 투자 실패 때문에 투자 과정에 깐깐하게 주의를 기울인다.", "이익보다 손실을 더 고려하기 때문에 기회보다 손실 회피에 집중한다.", "실패 가능성을 최대한 배제하기 위해 극단적인 회의주의를 적용한다.", "충분한 안전마진을 제공하는 투자처를 발견하는 것은 불가능하다고 생각한다.", "모든 곳에서 위험을 발견하므로 현재의 높은 리스크 프리미엄도 불충분하다고 생각한다.", "위험회피도가 높아져 저점에서 매도한다. (매수는 결코 하지 않는다.)"];
const CONST_PSYCHMECHANISM_FEARGREED_ITEMS = [{"label": "공포", "desc": "위험회피, 손실회피, 불확실성과 무작위성 중시"}, {"label": "탐욕", "desc": "열망, 공격성, 욕심"}];
const CONST_PSYCHMECHANISM_BULLCHAIN_STEPS = ["긍정적인 사건 발생", "낙관주의 상승", "위험수용도 상승", "더 낮은 리스크 프리미엄 요구", "위험자산 요구 수익률 하락", "자산가격 상승 → 훨씬 더 위험해짐 ⚠️ (단, 가격 상승을 노리는 '모멘텀 투자자'들의 추가 매수를 유도하기도 한다)"];
const CONST_PSYCHMECHANISM_BEARCHAIN_STEPS = ["부정적인 사건 발생", "비관주의 상승", "위험회피 성향 상승", "더 높은 리스크 프리미엄 요구", "위험자산 요구 수익률 상승", "자산가격 하락 → 더 안전해짐 💎"];
const CONST_POSITIONING_OFFENSIVEITEMS = ["투자자본 확대", "위험한 자산 보유", "유리한 거시적 결과에 더 의지한 투자", "금융 레버리지 활용", "고베타 자산 (변동성이 큰 자산)"];
const CONST_POSITIONING_DEFENSIVEITEMS = ["투자자본 축소 및 현금 보유", "안전자산 강조", "호황이 아니더라도 좋은 성과를 낼 수 있는 자산 매수", "레버리지 회피", "저베타 자산 (변동성이 작은 자산)"];
const CONST_POSITIONING_RESOURCES_ITEMS = ["투자할 돈", "그것을 투자할 용기", "신중함", "보수성", "위험통제", "절제력", "선택능력", "인내심"];
const CONST_COGNITIVEBIAS_ITEMS = [{"label": "선택적 지각 & 편향된 해석", "desc": "현재 진행 중인 상황에 대해 왜곡된 견해를 갖는 경향"}, {"label": "확증 편향 & 손실회피", "desc": "자신의 주장을 옹호하는 증거는 받아들이고 반증은 부정한다. 1달러 손실을 1달러 수익보다 더 크게 느끼는 비선형적 효용"}, {"label": "수용성 & 과도한 회의주의", "desc": "좋은 시기엔 근거 없는 이야기도 받아들이고, 나쁜 시기엔 이익의 모든 가능성을 거부한다"}, {"label": "FOMO (기회 손실 공포)", "desc": "다른 사람들이 자신은 거부했던 일을 해서 돈을 버는 모습을 지켜볼 때 생기는 극도의 불편감"}, {"label": "돈의 심리적 복잡성", "desc": "더 많은 것을 얻고자 하는 욕심, 타인의 이익에 대한 질투, 손실에 대한 두려움이라는 강력한 감정 요소"}];
const CONST_KEYPRINCIPLES_ITEMS = [{"label": "역발상 투자 원칙", "desc": "다른 사람들이 신중하지 못할수록 우리는 더 신중하게 해야 한다. 반대로 다른 투자자들이 공황 상태에 빠져있다면 우리는 공격적으로 변해야 한다."}, {"label": "회의주의 ≠ 비관주의", "desc": "낙관이 지나칠 때는 회의에 비관이 더해져야 하며, 비관이 지나칠 때는 회의에 낙관이 더해져야 한다."}, {"label": "투자 결과의 결정 요인", "desc": "투자 결과를 결정하는 것은 무엇을 사느냐가 아니라 그것을 사기 위해 얼마를 지불하느냐다."}, {"label": "\"이번에는 다르다\"를 경계하라", "desc": "고점에서 자산가격이 내재가치를 벗어날 때 이유는 주로 '이번에는 다르다'는 말로 시작된다. 기꺼이 의심을 보류하는 이 불길한 신호를 조심해야 한다."}, {"label": "생존이 먼저다", "desc": "비결은 가장 핫한 종목 발굴가나 성공적인 예측가, 깔끔한 모델의 개발자가 되는 것이 아니다. 이러한 승리는 일시적이다. 비결은 살아남는 것이다. 이를 위해 틀리는 것에 대한 강한 배짱이 있어야 한다. 미래는 알 수 없고 우리 모두는 예상보다 더 자주 틀린다. 하지만 틀리는 것은 불가피하고 정상적인 것이지, 대부분의 경우 지독한 비극이나 끔찍한 논리적 결함이 아니다."}, {"label": "호황과 불황의 속도 차이", "desc": "고점에 도달한 직후 하락세가 시작될 수도 있고, 조정이 시작되기 전까지 오랫동안 고점이 유지될 수도 있다. 무엇보다 중요한 점은 호황은 완성되는 데 몇 년이 걸릴 수도 있지만 뒤따라오는 불황은 고속화물 열차처럼 들이닥칠 수 있다는 것이다."}, {"label": "사이클은 스스로 전환한다", "desc": "사이클이 한 방향으로 영원히 가지 않고 전환하는 이유는 추세 자체가 스스로 전환에 대한 이유를 만들어내기 때문이다."}, {"label": "성공의 정의", "desc": "성공하기 위해 반드시 맞아야 할 필요는 없다. 다른 사람들보다 덜 틀리면 된다."}, {"label": "영원한 것은 없다", "desc": "투자에서 중요한 것은 직관에 반한다. 모두가 무언가가 영원할 거라고 확신하게 될 때, 그때가 바로 영원하지 않을 것이 확실해지는 때다."}, {"label": "인간의 지각과 사이클의 비대칭성", "desc": "인간의 지각이라는 렌즈를 통해 보았을 때, 사이클은 종종 실제보다 덜 대칭적으로 보인다. 고점에서는 하락을 과소평가하고, 저점에서는 회복을 과소평가한다."}, {"label": "투자자 항복의 역설", "desc": "사람들은 마켓 사이클의 바닥에서 '투자자 항복'을 말하지만, 나는 이전의 신중한 투자자들이 패배를 인정하고 매수하는 꼭지에서 항복을 본다. 진짜 항복은 바닥이 아니라 고점에서 일어난다."}, {"label": "과도함 이후의 뉘우침 사이클", "desc": "투자자들은 과도함의 잘못을 저지르고 하락세에서 돈을 잃은 후에야, 욕심이 지나쳤고 너무 쉽게 믿었다고 스스로를 책망한다. 다시는 그렇게 하지 않겠다고 맹세한다. 하지만 이 사이클은 반복된다."}];
const CONST_CYCLESELFCHECK_ITEMS = ["지금은 상승 국면의 초입인가, 막바지인가?", "특정 사이클이 한동안 상승해왔다면, 현재 위험한 국면인가?", "투자자들의 행동이 욕심에 의한 것인가, 두려움에 의한 것인가?", "투자자들은 적절하게 위험을 회피하고 있는가? 아니면 무모하게 위험을 감수하고 있는가?", "사이클에 따라 일어난 일 때문에 시장이 과열되었는가, 냉각되었는가?", "모두 고려했을 때, 현재 포지션은 방어에 중심을 두어야 하는가, 공격에 중심을 두어야 하는가?"];
const CONST_INVESTORTASKS_ITEMS = [{"step": "1", "task": "자산가격을 논하기", "desc": "현재 자산가격이 내재가치에 비해 높은가, 낮은가를 분석하라"}, {"step": "2", "task": "현재 위치 평가하기", "desc": "사이클에서 현재 어느 위치에 있는지 파악하라"}, {"step": "3", "task": "앞으로의 변화 판단하기", "desc": "가격이 앞으로 어떻게 변할지 판단하라"}];
const CONST_CYCLECHAIN_NODES = ["경제", "기업 이익", "투자자 태도", "시장", "신용 가용성"];
const CONST_KEYQUOTES_ITEMS = [{"text": "세상에서 가장 위험한 것은 리스크가 없다는 믿음이다.", "author": "하워드 막스"}, {"text": "매수하기에 가장 안전한 시기는 대개 모두가 희망이 없다고 확신할 때이다.", "author": "하워드 막스"}, {"text": "사이클을 무시하고 추세를 추정하는 것은 투자자가 할 수 있는 가장 위험한 일 중 하나다.", "author": "하워드 막스"}, {"text": "붐비지 않는 분야에 투자하면 큰 이점이 있다. 모두가 돈을 쏟아붓는 분야에 동참하는 것은 재앙을 만드는 공식이다.", "author": "하워드 막스"}, {"text": "상승장에서 얻은 수익을 자신의 실력이라 착각하지 마라.", "author": "투자 격언"}, {"text": "바닥에서 팔아치워 하락 변동의 기회를 영구적인 손실로 날려버리는 것이 가장 끔찍한 실수다.", "author": "하워드 막스"}, {"text": "시장은 투자자들이 지불 능력을 갖고 있는 기간보다 더 오랫동안 비이성적으로 움직일 수 있다.", "author": "케인즈"}, {"text": "지금 붐비는 분야에 늦게 진입한 사람은 '태초의 현자'가 될 수 없다. '마지막 바보'가 될 가능성이 높다.", "author": "하워드 막스"}, {"text": "금융기억의 극단적인 단기성 때문에 시장 참여자들은 패턴의 반복성을 인지하지 못하고, 그 결과 패턴의 필연성을 깨닫지 못한다. 불과 몇 년이 지나지 않아 똑같거나 비슷한 상황이 다시 발생하면, 젊고 늘 확신에 차 있는 신세대는 이 상황을 금융계에서 엄청나게 혁신적인 발견인 양 맞이한다.", "author": "존 케네스 갤브레이스 (하워드 막스 인용)"}, {"text": "광범위한 위험수용, 즉 투자자가 위험을 편안하게 느끼는 현상은 시장 하락의 가장 큰 징조이다.", "author": "하워드 막스"}];
const CONST_SUCCESSFORMULA_ELEMENTS = [{"label": "공격성", "desc": "저점 근처에서 과감하게 투자자본을 확대하는 능력"}, {"label": "타이밍", "desc": "사이클 위치를 파악하여 적절한 시기를 선택하는 능력"}, {"label": "기술", "desc": "좋은 자산을 선별하고 알파를 창출하는 능력"}];
const CONST_SUCCESSFORMULA_FORMULA = ["사이클 포지셔닝", "자산 선택", "공격성 (투자자본 확대, 위험자산, 레버리지, 고베타)", "방어성 (자본 축소, 현금, 안전자산, 저베타)", "기술 (+알파)", "운"];
const CONST_RISKANDVALUE_RISKTYPES = [{"label": "자본 손실 위험", "desc": "자본을 영구적으로 손실할 가능성. 하워드 막스가 가장 중요하게 생각하는 리스크"}, {"label": "기회 위험", "desc": "잠재적 이익을 놓칠 가능성. 과도한 위험회피로 인해 좋은 기회를 놓치는 것"}];
const CONST_RISKANDVALUE_VALUEITEMS = ["가장 높은 상승 잠재력을 가진 자산에 투자", "상승 가능성이 하락 위험보다 높은 자산에 투자"];
const CONST_RISKANDVALUE_QUALITYITEMS = ["외부 영향에 흔들리지 않는 심리적 안정", "감정적으로 균형을 유지하는 능력", "긍정적·부정적 사건을 모두 인식하고 객관적으로 저울질", "사이클에 대한 통찰력을 실행에 옮기는 배짱", "타인의 행동이 아닌 현재 관찰에 근거한 판단"];
const CONST_RISKANDVALUE_WARNINGWORDS = ["절대", "항상", "영원히", "할 수 없다", "아닐 것이다", "그럴 것이다", "해야만 한다"];
const CONST_PERSONALFEARGREED_PENDULUMITEMS = [{"bull": "도취감", "bear": "침체", "desc": "시장 전체의 분위기 — 도취감이 퍼지면 자산이 너무 비싸지고, 침체가 퍼지면 너무 싸진다"}, {"bull": "탐욕", "bear": "공포", "desc": "개인 투자자의 행동 동기 — 탐욕은 무모한 매수를, 공포는 바닥에서의 매도를 유발한다"}, {"bull": "낙관론", "bear": "비관론", "desc": "미래에 대한 기대감의 방향 — 낙관론이 지배하면 나쁜 뉴스도 무시되고, 비관론이 지배하면 좋은 뉴스도 무시된다"}, {"bull": "위험수용", "bear": "위험회피", "desc": "투자자가 감수하려는 리스크의 정도 — 위험수용이 광범위할 때가 시장 하락의 가장 큰 징조다"}, {"bull": "신뢰", "bear": "회의", "desc": "시장 참가자들의 신뢰 수준 — 신뢰가 높으면 위험한 거래가 이루어지고, 회의가 높으면 안전한 거래만 가능하다"}, {"bull": "미래가치에 대한 믿음", "bear": "현재의 명확한 가치 주장", "desc": "가치 평가의 기준 — 장밋빛 미래를 믿을 때 가격이 내재가치를 크게 초과한다"}, {"bull": "매수하려는 조급함", "bear": "매도하려는 패닉", "desc": "행동의 긴박성 — 둘 다 잘못된 시기에 잘못된 행동이다. 극단에서의 감정적 행동이 가장 큰 실수를 만든다"}];
const CONST_PERSONALFEARGREED_GREEDITEMS = ["돈 버는게 너무 쉽다고 생각한다", "매일 투자가 기대되고 설렌다", "언제든지 일을 관둘 수 있다는 생각에 일이 즐겁다", "공부를 게을리 하게 된다", "기분이 좋아서 짜증이 없어진다", "추가 매수를 하고 싶어진다", "몰빵하고 싶은 충동이 생긴다", "오랜만에 지인에게 연락해서 투자를 물어본다", "사치스러운 소비를 하게 된다 (비싼 것을 먹거나 사는 등)", "매수하려고 조급해진다"];
const CONST_PERSONALFEARGREED_FEARITEMS = ["투자 결정이 후회된다", "과거로 돌아가고 싶다", "일하는게 싫어진다 (돈 못 벌어서)", "나는 바보 같다는 생각이 든다", "공부를 갑자기 열심히 하게 된다", "짜증이 많아지고 남탓을 한다", "위험을 무조건 회피하려고 한다", "돈을 더 잃을까봐 겁이 나서 매도하고 싶다"];
const CONST_MEGABULLCONDITIONS_ITEMS = [{"no": "1", "title": "금리인하 사이클 진입 (유동성 확장)", "desc": "연준을 포함한 중앙은행들이 금리를 인하하여 시중에 돈이 풀리는 국면. 자본의 공급이 늘어난다."}, {"no": "2", "title": "경기침체 없음 (심리적 안정)", "desc": "경제가 연착륙하거나 성장을 유지하여 투자자들의 심리가 안정적인 상태. 공포 없이 탐욕이 지배."}, {"no": "3", "title": "지정학적 위험 완화 (세계 평화)", "desc": "전쟁이나 지정학적 갈등이 종료·완화되어 글로벌 불확실성이 줄고 투자 심리가 개선."}, {"no": "4", "title": "전 세계적 FOMO 심리 확산", "desc": "일반 대중까지 투자 열풍에 합류하는 대규모 포모(기회 손실 공포) 현상. 코인·주식 관련 대화가 일상에 넘친다."}, {"no": "5", "title": "주식·코인이 압도적 최고 수익률 자산", "desc": "부동산, 채권, 예금 등 다른 투자처 대비 주식·코인의 수익률이 압도적으로 높아 보여 모든 유동성이 집중."}];
const CONST_PROBABILISTICTHINKING_STEPS = [{"step": "1단계", "title": "미래를 확률분포로 보기", "desc": "일어날 일을 하나로 단정짓는 대신, '어떤 결과들이 가능한가?'와 '각각의 확률은?'을 질문한다. 결과는 다양하지만 실제로 일어나는 일은 딱 하나다."}, {"step": "2단계", "title": "여러 시나리오 작성하기", "desc": "상승 시나리오 / 중립 시나리오 / 하락 시나리오를 각각 작성하고 확률을 배분한다. 예: 낙관 40% / 중립 30% / 비관 30%"}, {"step": "3단계", "title": "예측 + 그 예측이 맞을 가능성 모두 고려", "desc": "앞으로 일어날 일에 대한 판단 외에, 그 판단이 맞을 가능성에 대해서도 생각해야 한다. 확신의 정도도 투자 크기에 반영하라."}, {"step": "4단계", "title": "확률에 따라 포지션 조정", "desc": "사이클 안의 위치가 바뀌면 확률도 변한다. 확률이 나에게 유리할 때 더 공격적으로, 불리할 때 더 방어적으로 투자한다."}];
const CONST_HISTORICALBUBBLES_ITEMS = [{"period": "1989~1992", "name": "미국 부동산 거품", "desc": "부동산 과잉 공급과 저축대부조합(S&L) 위기. 상업용 부동산 가격 급락, 금융기관 수백 곳 파산"}, {"period": "1994~1998", "name": "신흥시장(이머징마켓) 위기", "desc": "태국·인도네시아 등 동남아, 러시아, 남미의 연쇄 금융위기. 달러 강세와 자본 이탈로 통화 폭락"}, {"period": "1998", "name": "롱텀캐피털 매니지먼트(LTCM) 붕괴", "desc": "노벨경제학상 수상자가 참여한 헤지펀드의 파산. 과도한 레버리지와 이머징마켓 채무불이행이 원인"}, {"period": "1999~2001", "name": "닷컴 버블", "desc": "인터넷 기업에 대한 근거 없는 낙관. 나스닥 78% 폭락. '이번에는 다르다'는 믿음의 전형적 사례"}, {"period": "2000~2001", "name": "벤처캐피털 & 통신 거품", "desc": "통신 인프라 과잉 투자와 벤처캐피털 붐의 붕괴. 수조 달러 자금이 사라짐"}, {"period": "2007~2009", "name": "글로벌 금융위기 (서브프라임)", "desc": "주택 담보대출 증권화의 실패와 신용 사이클의 극단적 확장. 리먼브라더스 파산, 전 세계 금융 시스템 마비"}, {"period": "2021~2022", "name": "코로나 이후 자산 버블", "desc": "제로금리 시대의 유동성 폭발. 주식·코인·부동산 동반 급등 후 2022년 연준 금리인상으로 급락"}];
const VERDICT_LEVELS: Record<VerdictKey, VerdictInfo> = {
  "extreme_bull": {
    "label": "강세장 극단 (최고조)",
    "action": "주의를 기울여야 할 때",
    "desc": "강세장 신호가 압도적으로 많습니다. 하워드 막스의 말처럼 '지금이 주의해야 할 때'입니다. 잠재 수익률은 낮고 리스크는 높습니다.",
    "emoji": "⚠️",
    "color": "red"
  },
  "strong_bull": {
    "label": "강세장 진행 중",
    "action": "리스크 관리 시작",
    "desc": "강세장이 한창 진행 중입니다. 수익을 일부 실현하고 리스크 관리를 시작할 시기를 고려하세요.",
    "emoji": "📈",
    "color": "orange"
  },
  "weak_bull": {
    "label": "약한 강세 / 전환기",
    "action": "방향성 주시",
    "desc": "강세 신호가 우세하지만 불확실성이 존재합니다. 사이클의 전환 여부를 주의 깊게 관찰하세요.",
    "emoji": "🔍",
    "color": "yellow"
  },
  "neutral": {
    "label": "중립 / 전환기",
    "action": "방향성 불분명",
    "desc": "강세와 약세 신호가 혼재합니다. 사이클의 전환점일 수 있습니다. 추가 데이터와 신호를 관찰하세요.",
    "emoji": "⚖️",
    "color": "gray"
  },
  "weak_bear": {
    "label": "약한 약세 / 전환기",
    "action": "점진적 매수 검토",
    "desc": "약세 신호가 우세합니다. 현금을 확보하면서 점진적인 매수 기회를 탐색할 수 있습니다.",
    "emoji": "🔍",
    "color": "blue"
  },
  "strong_bear": {
    "label": "약세장 진행 중",
    "action": "분할 매수 고려",
    "desc": "약세장이 진행 중입니다. 두려움이 지배하는 시장입니다. 내재 가치 대비 가격을 확인하며 분할 매수를 고려하세요.",
    "emoji": "📉",
    "color": "green"
  },
  "extreme_bear": {
    "label": "약세장 극단 (최저점)",
    "action": "공격적 매수 기회",
    "desc": "약세장 신호가 압도적으로 많습니다. 하워드 막스의 말처럼 '지금이야말로 공격적이어야 할 때'입니다. 잠재 수익률은 높고 리스크는 낮습니다.",
    "emoji": "💎",
    "color": "green"
  }
};

export default function CycleChecklist() {

  const bullItems = CONST_BULLITEMS as string[];
  const bearItems = CONST_BEARITEMS as string[];
  const questionItems = CONST_KEYQUESTIONS_ITEMS as QuestionItem[];
  const creditEasyItems = CONST_CREDITCYCLE_EASYITEMS as string[];
  const creditTightItems = CONST_CREDITCYCLE_TIGHTITEMS as string[];
  const bubbleItems = CONST_BUBBLERALLY_ITEMS as string[];
  const bubbleWarningItems = CONST_BUBBLERALLY_WARNINGITEMS as string[];
  const bullStageItems = CONST_STAGES_BULL_STAGES as Array<{ step: string; desc: string }>;
  const bearStageItems = CONST_STAGES_BEAR_STAGES as Array<{ step: string; desc: string }>;
  const envPositiveItems = CONST_ENVCHECKLIST_POSITIVEITEMS as string[];
  const envNegativeItems = CONST_ENVCHECKLIST_NEGATIVEITEMS as string[];
  const riskOptimisticItems = CONST_RISKATTITUDE_OPTIMISTICITEMS as string[];
  const riskPessimisticItems = CONST_RISKATTITUDE_PESSIMISTICITEMS as string[];
  const fearGreedItems = CONST_PSYCHMECHANISM_FEARGREED_ITEMS as FearGreedItem[];
  const bullChainSteps = CONST_PSYCHMECHANISM_BULLCHAIN_STEPS as string[];
  const bearChainSteps = CONST_PSYCHMECHANISM_BEARCHAIN_STEPS as string[];
  const offensiveItems = CONST_POSITIONING_OFFENSIVEITEMS as string[];
  const defensiveItems = CONST_POSITIONING_DEFENSIVEITEMS as string[];
  const resourceItems = CONST_POSITIONING_RESOURCES_ITEMS as string[];
  const cognitiveBiasItems = CONST_COGNITIVEBIAS_ITEMS as CognitiveBiasItem[];
  const keyPrincipleItems = CONST_KEYPRINCIPLES_ITEMS as KeyPrincipleItem[];
  const cycleSelfCheckItems = CONST_CYCLESELFCHECK_ITEMS as string[];
  const investorTaskItems = CONST_INVESTORTASKS_ITEMS as InvestorTaskItem[];
  const cycleChainNodes = CONST_CYCLECHAIN_NODES as string[];
  const keyQuoteItems = CONST_KEYQUOTES_ITEMS as QuoteItem[];
  const successElements = CONST_SUCCESSFORMULA_ELEMENTS as SuccessElement[];
  const successFormulaItems = CONST_SUCCESSFORMULA_FORMULA as string[];
  const riskTypeItems = CONST_RISKANDVALUE_RISKTYPES as RiskTypeItem[];
  const valueItems = CONST_RISKANDVALUE_VALUEITEMS as string[];
  const qualityItems = CONST_RISKANDVALUE_QUALITYITEMS as string[];
  const warningWords = CONST_RISKANDVALUE_WARNINGWORDS as string[];
  const pendulumItems = CONST_PERSONALFEARGREED_PENDULUMITEMS as PendulumItem[];
  const greedItems = CONST_PERSONALFEARGREED_GREEDITEMS as string[];
  const fearItems = CONST_PERSONALFEARGREED_FEARITEMS as string[];
  const megaBullItems = CONST_MEGABULLCONDITIONS_ITEMS as MegaBullItem[];
  const probSteps = CONST_PROBABILISTICTHINKING_STEPS as ProbStep[];
  const historicalBubbleItems = CONST_HISTORICALBUBBLES_ITEMS as HistoricalBubbleItem[];

  const [bullChecked, setBullChecked] = useState<boolean[]>(() => Array(bullItems.length).fill(false));
  const [bearChecked, setBearChecked] = useState<boolean[]>(() => Array(bearItems.length).fill(false));
  const [questionChoices, setQuestionChoices] = useState<QuestionChoice[]>(() => Array(questionItems.length).fill(null));
  const [creditEasyChecked, setCreditEasyChecked] = useState<boolean[]>(() => Array(creditEasyItems.length).fill(false));
  const [creditTightChecked, setCreditTightChecked] = useState<boolean[]>(() => Array(creditTightItems.length).fill(false));
  const [bubbleChecked, setBubbleChecked] = useState<boolean[]>(() => Array(bubbleItems.length).fill(false));
  const [bubbleWarningChecked, setBubbleWarningChecked] = useState<boolean[]>(() => Array(bubbleWarningItems.length).fill(false));
  const [envPositiveChecked, setEnvPositiveChecked] = useState<boolean[]>(() => Array(envPositiveItems.length).fill(false));
  const [envNegativeChecked, setEnvNegativeChecked] = useState<boolean[]>(() => Array(envNegativeItems.length).fill(false));
  const [riskOptimisticChecked, setRiskOptimisticChecked] = useState<boolean[]>(() => Array(riskOptimisticItems.length).fill(false));
  const [riskPessimisticChecked, setRiskPessimisticChecked] = useState<boolean[]>(() => Array(riskPessimisticItems.length).fill(false));
  const [selectedStage, setSelectedStage] = useState<StageType>(null);
  const [greedChecked, setGreedChecked] = useState<boolean[]>(() => Array(greedItems.length).fill(false));
  const [fearChecked, setFearChecked] = useState<boolean[]>(() => Array(fearItems.length).fill(false));

  // Score calculation
  const bullCount = bullChecked.filter(Boolean).length;
  const bearCount = bearChecked.filter(Boolean).length;
  const qBullCount = questionChoices.filter(c => c === 'bull').length;
  const qBearCount = questionChoices.filter(c => c === 'bear').length;
  const creditBullCount = creditEasyChecked.filter(Boolean).length;
  const creditBearCount = creditTightChecked.filter(Boolean).length;
  const envBullCount = envPositiveChecked.filter(Boolean).length;
  const envBearCount = envNegativeChecked.filter(Boolean).length;
  const riskBullCount = riskOptimisticChecked.filter(Boolean).length;
  const riskBearCount = riskPessimisticChecked.filter(Boolean).length;

  // Total bull vs bear across all sections
  const totalBull = bullCount + qBullCount + creditBullCount + envBullCount + riskBullCount;
  const totalBear = bearCount + qBearCount + creditBearCount + envBearCount + riskBearCount;
  const totalMax = bullItems.length + questionItems.length + creditEasyItems.length + envPositiveItems.length + riskOptimisticItems.length;
  const totalChecked = totalBull + totalBear;

  const bullPct = totalMax > 0 ? Math.round((totalBull / totalMax) * 100) : 0;
  const bearPct = totalMax > 0 ? Math.round((totalBear / totalMax) * 100) : 0;
  const netScore = bullPct - bearPct;

  const verdictKey = useMemo<VerdictKey | null>(() => {
    if (totalChecked === 0) return null;
    return getVerdictKey(netScore);
  }, [netScore, totalChecked]);

  const verdict = useMemo<VerdictInfo | null>(() => {
    if (!verdictKey) return null;
    return VERDICT_LEVELS[verdictKey];
  }, [verdictKey, t]);

  const verdictColor = verdictKey ? VERDICT_COLORS[VERDICT_COLOR_MAP[verdictKey]] : null;
  const meterPos = Math.min(100, Math.max(0, ((netScore + 100) / 200) * 100));

  const bubbleCount = bubbleChecked.filter(Boolean).length;
  const bubbleWarningCount = bubbleWarningChecked.filter(Boolean).length;

  function handleReset() {
    setBullChecked(Array(bullItems.length).fill(false));
    setBearChecked(Array(bearItems.length).fill(false));
    setQuestionChoices(Array(questionItems.length).fill(null));
    setCreditEasyChecked(Array(creditEasyItems.length).fill(false));
    setCreditTightChecked(Array(creditTightItems.length).fill(false));
    setBubbleChecked(Array(bubbleItems.length).fill(false));
    setBubbleWarningChecked(Array(bubbleWarningItems.length).fill(false));
    setEnvPositiveChecked(Array(envPositiveItems.length).fill(false));
    setEnvNegativeChecked(Array(envNegativeItems.length).fill(false));
    setRiskOptimisticChecked(Array(riskOptimisticItems.length).fill(false));
    setRiskPessimisticChecked(Array(riskPessimisticItems.length).fill(false));
    setSelectedStage(null);
    setGreedChecked(Array(greedItems.length).fill(false));
    setFearChecked(Array(fearItems.length).fill(false));
  }

  function toggleQuestion(i: number, choice: 'bull' | 'bear') {
    setQuestionChoices(prev => prev.map((v, idx) => idx === i ? (v === choice ? null : choice) : v));
  }

  function getSelectedStageDesc(): string {
    if (!selectedStage) return '';
    const idx = Number(selectedStage.slice(-1)) - 1;
    return selectedStage.startsWith('bull') ? bullStageItems[idx]?.desc ?? '' : bearStageItems[idx]?.desc ?? '';
  }

  function stageButtonClass(key: StageType) {
    return `w-full text-left p-3 rounded-lg border transition-all text-sm ${
      selectedStage === key
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
    }`;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium mb-2">
          <span>📚</span>
          <span>{"하워드 막스 '투자와 마켓 사이클의 법칙' 기반"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{"시장 사이클 체크리스트"}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">{"현재 시장 상황에 해당하는 항목을 체크하세요. 강세장 신호와 약세장 신호의 비율로 지금 사이클의 위치를 진단합니다."}</p>
      </div>

      {/* Quote */}
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg">
        <p className="text-sm italic text-blue-800 dark:text-blue-200">"{"사이클에서 자신이 서 있는 위치를 간과하는 투자자는 예외 없이 심각한 결과를 겪게 된다."}"</p>
        <cite className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">— {"하워드 막스, '투자와 마켓 사이클의 법칙'"}</cite>
      </blockquote>

      {/* Score Meter */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">{"사이클 위치 진단"}</h2>
          <button onClick={handleReset} className="text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {"초기화"}
          </button>
        </div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-red-600 dark:text-red-400 font-medium">🐃 {"강세장 신호"}: {totalBull}</span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">🐻 {"약세장 신호"}: {totalBear}</span>
        </div>
        <div className="relative h-5 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-gray-300 to-red-500 dark:from-blue-600 dark:via-gray-600 dark:to-red-600">
          <div className="absolute top-0 bottom-0 w-1 bg-white dark:bg-gray-900 shadow-md rounded-full transition-all duration-500" style={{ left: `calc(${meterPos}% - 2px)` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>{"약세장 극단"}</span>
          <span>{"중립"}</span>
          <span>{"강세장 극단"}</span>
        </div>
        {totalChecked > 0 && (
          <div className="mt-3 flex items-center justify-center gap-3 text-xs">
            <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold">{"강세"} {bullPct}%</span>
            <span className="text-gray-400">{"vs"}</span>
            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">{"약세"} {bearPct}%</span>
          </div>
        )}
      </div>

      {/* Verdict */}
      {verdict && verdictColor && (
        <div className={`rounded-xl border ${verdictColor.border} ${verdictColor.bg} p-5`}>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">{"진단 결과"}</h2>
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <span className="text-3xl">{verdict.emoji}</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-lg font-bold ${verdictColor.text}`}>{verdict.label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verdictColor.badge}`}>{verdict.action}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{verdict.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 1: Bull / Bear Checklist ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bull */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900 shadow-sm overflow-hidden">
          <div className="bg-red-50 dark:bg-red-950/40 px-4 py-3 border-b border-red-200 dark:border-red-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐃</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 text-sm">{"강세장 신호"}</h3>
                <span className="text-xs text-red-600 dark:text-red-400">{"상승세"}</span>
              </div>
            </div>
            <span className="text-sm font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
              {bullCount} / {bullItems.length}
            </span>
          </div>
          <div className="p-3 space-y-1">
            {bullItems.map((item, i) => (
              <label key={i} className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${bullChecked[i] ? 'bg-red-50 dark:bg-red-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <input type="checkbox" checked={bullChecked[i]} onChange={() => setBullChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                <span className={`text-xs leading-relaxed flex-1 ${bullChecked[i] ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                <span className={`flex-shrink-0 w-4 h-4 rounded border mt-0.5 transition-all ${bullChecked[i] ? 'bg-red-500 border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                  {bullChecked[i] && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Bear */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-950/40 px-4 py-3 border-b border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐻</span>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">{"약세장 신호"}</h3>
                <span className="text-xs text-blue-600 dark:text-blue-400">{"하락세"}</span>
              </div>
            </div>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
              {bearCount} / {bearItems.length}
            </span>
          </div>
          <div className="p-3 space-y-1">
            {bearItems.map((item, i) => (
              <label key={i} className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${bearChecked[i] ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <input type="checkbox" checked={bearChecked[i]} onChange={() => setBearChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                <span className={`text-xs leading-relaxed flex-1 ${bearChecked[i] ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                <span className={`flex-shrink-0 w-4 h-4 rounded border mt-0.5 transition-all ${bearChecked[i] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                  {bearChecked[i] && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Key Questions ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"핵심 판단 질문"}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"각 질문에서 현재 시장 상황에 해당하는 쪽을 선택하세요. 결과는 전체 점수에 반영됩니다."}</p>
          </div>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {qBullCount + qBearCount} / {questionItems.length}
          </span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {questionItems.map((item, i) => (
            <div key={i} className="p-3 sm:p-4">
              <div className="flex items-start gap-2.5 mb-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.q}</span>
              </div>
              <div className="flex gap-2 ml-7">
                <button
                  onClick={() => toggleQuestion(i, 'bull')}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg border transition-all font-medium ${
                    questionChoices[i] === 'bull'
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                  }`}
                >
                  🐃 {item.bull}
                </button>
                <button
                  onClick={() => toggleQuestion(i, 'bear')}
                  className={`flex-1 text-xs py-2 px-3 rounded-lg border transition-all font-medium ${
                    questionChoices[i] === 'bear'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                  }`}
                >
                  🐻 {item.bear}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2.5: Market Environment Checklist ───────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-teal-200 dark:border-teal-900 shadow-sm overflow-hidden">
        <div className="bg-teal-50 dark:bg-teal-950/30 px-4 py-3 border-b border-teal-200 dark:border-teal-900 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-teal-800 dark:text-teal-200">{"시장 환경 체크리스트"}</h2>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{"긍정적·부정적 환경의 8가지 특징 — 체크한 항목이 전체 점수에 반영됩니다"}</p>
          </div>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50 px-2 py-0.5 rounded-full">
            {envBullCount + envBearCount} / {envPositiveItems.length + envNegativeItems.length}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
          <div className="p-4">
            <h3 className="text-xs font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-1.5">
              <span>🐃</span> {"긍정적 환경 (강세 신호)"}
              <span className="ml-auto font-normal text-gray-400">{envBullCount}/{envPositiveItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {envPositiveItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${envPositiveChecked[i] ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={envPositiveChecked[i]} onChange={() => setEnvPositiveChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${envPositiveChecked[i] ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${envPositiveChecked[i] ? 'bg-red-500 border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {envPositiveChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-1.5">
              <span>🐻</span> {"부정적 환경 (약세 신호)"}
              <span className="ml-auto font-normal text-gray-400">{envBearCount}/{envNegativeItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {envNegativeItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${envNegativeChecked[i] ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={envNegativeChecked[i]} onChange={() => setEnvNegativeChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${envNegativeChecked[i] ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${envNegativeChecked[i] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {envNegativeChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Credit Cycle ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"신용 사이클 체크리스트"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"책 p.201~235 기반 — 신용 완화와 신용 경색의 특징을 체크하세요"}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
          <div className="p-4">
            <h3 className="text-xs font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-1.5">
              <span>🐃</span> {"신용 완화 (강세 신호)"}
              <span className="ml-auto font-normal text-gray-400">{creditBullCount}/{creditEasyItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {creditEasyItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${creditEasyChecked[i] ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={creditEasyChecked[i]} onChange={() => setCreditEasyChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${creditEasyChecked[i] ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${creditEasyChecked[i] ? 'bg-red-500 border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {creditEasyChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-1.5">
              <span>🐻</span> {"신용 경색 (약세 신호)"}
              <span className="ml-auto font-normal text-gray-400">{creditBearCount}/{creditTightItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {creditTightItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${creditTightChecked[i] ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={creditTightChecked[i]} onChange={() => setCreditTightChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${creditTightChecked[i] ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${creditTightChecked[i] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {creditTightChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3.5: Risk Attitude Checklist ─────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-900 shadow-sm overflow-hidden">
        <div className="bg-indigo-50 dark:bg-indigo-950/30 px-4 py-3 border-b border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">{"리스크 태도 체크리스트"}</h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{"낙관적·비관적 환경에서 나타나는 투자자 심리 — 체크한 항목이 전체 점수에 반영됩니다"}</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
            {riskBullCount + riskBearCount} / {riskOptimisticItems.length + riskPessimisticItems.length}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
          <div className="p-4">
            <h3 className="text-xs font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-1.5">
              <span>🐃</span> {"낙관적 환경 투자 행동 (강세 신호)"}
              <span className="ml-auto font-normal text-gray-400">{riskBullCount}/{riskOptimisticItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {riskOptimisticItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${riskOptimisticChecked[i] ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={riskOptimisticChecked[i]} onChange={() => setRiskOptimisticChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${riskOptimisticChecked[i] ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${riskOptimisticChecked[i] ? 'bg-red-500 border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {riskOptimisticChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-1.5">
              <span>🐻</span> {"비관적 환경 투자 행동 (약세 신호)"}
              <span className="ml-auto font-normal text-gray-400">{riskBearCount}/{riskPessimisticItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {riskPessimisticItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${riskPessimisticChecked[i] ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={riskPessimisticChecked[i]} onChange={() => setRiskPessimisticChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${riskPessimisticChecked[i] ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${riskPessimisticChecked[i] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {riskPessimisticChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Bubble Rally Conditions ───────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden">
        <div className="bg-purple-50 dark:bg-purple-950/30 px-4 py-3 border-b border-purple-200 dark:border-purple-900">
          <h2 className="text-sm font-semibold text-purple-800 dark:text-purple-200">{"거품(버블)의 특징"}</h2>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{"책 p.299 기반 — 닷컴버블 당시 나타난 상승 요소들"}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
          {/* 버블 랠리 조건 */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-1.5">
              <span>📈</span> {"거품 상승 요소"}
              <span className="ml-auto font-normal text-gray-400">{bubbleCount}/{bubbleItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {bubbleItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${bubbleChecked[i] ? 'bg-purple-50 dark:bg-purple-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={bubbleChecked[i]} onChange={() => setBubbleChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${bubbleChecked[i] ? 'text-purple-700 dark:text-purple-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${bubbleChecked[i] ? 'bg-purple-500 border-purple-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {bubbleChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
            {bubbleCount >= 4 && (
              <div className="mt-3 p-2.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-xs text-purple-700 dark:text-purple-300 font-medium">
                🚨 {`${bubbleCount}/5 해당 — 거품(버블) 특징이 뚜렷하게 나타나고 있습니다.`}
              </div>
            )}
          </div>
          {/* 버블 종료 신호 */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-1.5">
              <span>⚠️</span> {"거품 종료 신호"}
              <span className="ml-auto font-normal text-gray-400">{bubbleWarningCount}/{bubbleWarningItems.length}</span>
            </h3>
            <div className="space-y-1.5">
              {bubbleWarningItems.map((item, i) => (
                <label key={i} className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${bubbleWarningChecked[i] ? 'bg-orange-50 dark:bg-orange-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <input type="checkbox" checked={bubbleWarningChecked[i]} onChange={() => setBubbleWarningChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                  <span className={`text-xs leading-relaxed flex-1 ${bubbleWarningChecked[i] ? 'text-orange-700 dark:text-orange-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                  <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${bubbleWarningChecked[i] ? 'bg-orange-500 border-orange-500' : 'border-gray-300 dark:border-gray-600'}`}>
                    {bubbleWarningChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </span>
                </label>
              ))}
            </div>
            {bubbleWarningCount >= 3 && (
              <div className="mt-3 p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-xs text-orange-700 dark:text-orange-300 font-medium">
                🔔 {`${bubbleWarningCount}/5 해당 — 거품 종료 신호가 감지됩니다.`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 4.5: Mega Bull Conditions ───────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-900 shadow-sm overflow-hidden">
        <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-3 border-b border-amber-200 dark:border-amber-900">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">{"대형 버블 랠리의 5가지 필요조건"}</h2>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{"주식·코인에서 폭발적인 상승장이 오려면 이 5가지가 동시에 맞아떨어져야 한다"}</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {megaBullItems.map((item, i) => (
              <div key={i} className="relative p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.no}</span>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-tight">{item.title}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">⚠️ {"이 5가지가 동시에 충족될 때 마지막 버블 랠리로 이어질 가능성이 높다. 단, 이 조건이 완성될 때가 가장 위험한 시기이기도 하다 — 이때 매도를 고민해야 한다."}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 5: 3 Stages ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">{"현재 강세/약세장 단계"}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{"하워드 막스가 정의한 강세장·약세장의 3단계 중 현재 어느 단계에 해당하는지 선택하세요"}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2 flex items-center gap-1.5">
              <span>🐃</span> {"강세장 3단계"}
            </h3>
            <div className="space-y-2">
              {bullStageItems.map((stage, i) => {
                const key = `bull${i + 1}` as StageType;
                return (
                  <button key={i} onClick={() => setSelectedStage(selectedStage === key ? null : key)} className={stageButtonClass(key)}>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${selectedStage === key ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{stage.step}</span>
                      <span className="leading-relaxed">{stage.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
              <span>🐻</span> {"약세장 3단계"}
            </h3>
            <div className="space-y-2">
              {bearStageItems.map((stage, i) => {
                const key = `bear${i + 1}` as StageType;
                return (
                  <button key={i} onClick={() => setSelectedStage(selectedStage === key ? null : key)} className={stageButtonClass(key)}>
                    <div className="flex items-start gap-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${selectedStage === key ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{stage.step}</span>
                      <span className="leading-relaxed">{stage.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {selectedStage && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-semibold">
                {selectedStage.startsWith('bull') ? `🐃 ${"강세장"}` : `🐻 ${"약세장"}`} {selectedStage.slice(-1)}{"단계 선택됨"}
              </span>
              {' '}— {getSelectedStageDesc()}
            </p>
          </div>
        )}
      </div>

      {/* ── SECTION 6: Psychology Mechanism ─────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"심리 메커니즘 & 리스크 태도"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"하워드 막스가 설명하는 사이클을 움직이는 심리적 연쇄 반응"}</p>
        </div>
        <div className="p-4 space-y-4">
          {/* Fear & Greed */}
          <div>
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{"공포와 탐욕"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fearGreedItems.map((item, i) => (
                <div key={i} className={`p-2.5 rounded-lg border ${i === 0 ? 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'}`}>
                  <span className={`text-xs font-bold ${i === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>{item.label}</span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Bull & Bear Chains side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bull Chain */}
            <div>
              <h3 className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">🐃 {"낙관론 → 위험수용도 상승 연쇄 반응"}</h3>
              <div className="space-y-1">
                {bullChainSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                      {i < bullChainSteps.length - 1 && <span className="w-0.5 h-3 bg-red-200 dark:bg-red-800 mt-0.5" />}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 pt-0.5 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Bear Chain */}
            <div>
              <h3 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2">🐻 {"비관론 → 위험회피 상승 연쇄 반응"}</h3>
              <div className="space-y-1">
                {bearChainSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                      {i < bearChainSteps.length - 1 && <span className="w-0.5 h-3 bg-blue-200 dark:bg-blue-800 mt-0.5" />}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 pt-0.5 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Note */}
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">💡 {"광범위한 위험수용, 즉 투자자가 위험을 편안하게 느끼는 현상은 시장 하락의 가장 큰 징조이다. 반대로, 위험을 불안하게 느끼는 현상은 시장 상승의 가장 큰 징조다."}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 6.5: Psychological Pendulum Spectrum (p.129) ────────── */}
      {(() => {
        const greedCount = greedChecked.filter(Boolean).length;
        const fearCount = fearChecked.filter(Boolean).length;
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-pink-200 dark:border-pink-900 shadow-sm overflow-hidden">
            <div className="bg-pink-50 dark:bg-pink-950/30 px-4 py-3 border-b border-pink-200 dark:border-pink-900">
              <h2 className="text-sm font-semibold text-pink-800 dark:text-pink-200">{"심리의 시계추 스펙트럼 (p.129)"}</h2>
              <p className="text-xs text-pink-600 dark:text-pink-400 mt-0.5">{"하워드 막스 p.129 — 시장은 두 극단 사이를 시계추처럼 오간다. 지금 어느 쪽에 가까운가?"}</p>
            </div>
            <div className="p-4 space-y-4">
              {/* p.129 인용 */}
              <blockquote className="border-l-4 border-pink-400 dark:border-pink-700 pl-3 py-1">
                <p className="text-xs italic text-pink-700 dark:text-pink-300">"{"긍정적인 발전을 축하하는 것과 부정적인 것에 집착하는 것 사이. 그러므로 너무 비싸지는 것과 너무 싸지는 것 사이."}"</p>
              </blockquote>
              {/* 시계추 스펙트럼 */}
              <div className="space-y-2">
                {pendulumItems.map((item, i) => (
                  <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex-shrink-0 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] font-bold">{item.bull}</span>
                      <div className="flex-1 h-1 rounded-full bg-gradient-to-r from-red-300 via-gray-300 to-blue-300 dark:from-red-700 dark:via-gray-600 dark:to-blue-700" />
                      <span className="flex-shrink-0 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">{item.bear}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              {/* 핵심 교훈 */}
              <div className="p-2.5 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900">
                <p className="text-xs text-pink-700 dark:text-pink-300 italic">💡 {"뛰어난 투자자는 이 두 극단 사이의 균형을 맞춘다. 하지만 대부분은 잘못된 시기에 극단으로 이동한다 — 탐욕일 때 고점에서 매수하고, 공포일 때 저점에서 매도한다."}</p>
              </div>
              {/* 나만의 자가 체크 */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-0.5">{"나만의 탐욕·침체 신호 (내면 자가 체크)"}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{"p.129 독서 노트 — 현재 어느 상태에 있는지 체크하세요"}</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 탐욕 */}
                  <div>
                    <h4 className="text-xs font-bold text-red-700 dark:text-red-300 mb-1.5 flex items-center gap-1.5">
                      <span>🔥</span> {"탐욕 상태일 때 나의 신호"}
                      <span className="ml-auto font-normal text-gray-400">{greedCount}/{greedItems.length}</span>
                    </h4>
                    {greedCount >= 5 && (
                      <div className="mb-2 p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-xs text-red-700 dark:text-red-300 font-medium">
                        ⚠️ {"탐욕 신호가 많을수록 → 매수 자제, 리스크 점검 시작"}
                      </div>
                    )}
                    <div className="space-y-1">
                      {greedItems.map((item, i) => (
                        <label key={i} className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${greedChecked[i] ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 text-red-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <input type="checkbox" checked={greedChecked[i]} onChange={() => setGreedChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                          <span className={`text-xs leading-relaxed flex-1 ${greedChecked[i] ? 'text-red-700 dark:text-red-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                          <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${greedChecked[i] ? 'bg-red-500 border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {greedChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* 침체/공포 */}
                  <div>
                    <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1.5 flex items-center gap-1.5">
                      <span>❄️</span> {"침체(공포) 상태일 때 나의 신호"}
                      <span className="ml-auto font-normal text-gray-400">{fearCount}/{fearItems.length}</span>
                    </h4>
                    {fearCount >= 4 && (
                      <div className="mb-2 p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-xs text-blue-700 dark:text-blue-300 font-medium">
                        💎 {"공포 신호가 많을수록 → 오히려 분할 매수 기회일 수 있음"}
                      </div>
                    )}
                    <div className="space-y-1">
                      {fearItems.map((item, i) => (
                        <label key={i} className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${fearChecked[i] ? 'bg-blue-50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <input type="checkbox" checked={fearChecked[i]} onChange={() => setFearChecked(prev => prev.map((v, idx) => idx === i ? !v : v))} className="sr-only" />
                          <span className={`text-xs leading-relaxed flex-1 ${fearChecked[i] ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{item}</span>
                          <span className={`flex-shrink-0 w-3.5 h-3.5 rounded border mt-0.5 ${fearChecked[i] ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {fearChecked[i] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-pink-700 dark:text-pink-300 italic border-l-4 border-pink-400 dark:border-pink-700 pl-3 mt-3">
                  💡 {"탐욕과 공포는 항상 잘못된 시기에 온다. 탐욕을 느낄 때 조심하고, 공포를 느낄 때 공격적으로."}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── SECTION 7: Cycle Positioning Strategy ───────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"사이클 포지셔닝 전략"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"사이클 위치에 따라 공격성과 방어성 사이에서 포지션을 조정하라"}</p>
        </div>
        <div className="p-4 space-y-4">
          {/* Peak / Trough focus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">⚠️ {"고점 근처 → 돈을 잃을 가능성에 집중"}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">💎 {"저점 근처 → 기회를 놓칠 가능성에 집중"}</p>
            </div>
          </div>
          {/* Offensive vs Defensive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">📈 {"공격적 포지셔닝 (저점 근처)"}</h3>
              <ul className="space-y-1">
                {offensiveItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">🛡️ {"방어적 포지셔닝 (고점 근처)"}</h3>
              <ul className="space-y-1">
                {defensiveItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* 8 Resources */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{"투자에 필요한 8가지 자원"}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{"하워드 막스가 뛰어난 성과를 위해 필요하다고 꼽은 요소"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {resourceItems.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 8: Cognitive Biases ──────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"투자자 인지 편향 5가지"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"심리적 불완전성이 주가를 움직인다 — 하워드 막스"}</p>
        </div>
        <div className="p-4 space-y-2">
          {cognitiveBiasItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 8.5: Probabilistic Thinking ─────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-cyan-200 dark:border-cyan-900 shadow-sm overflow-hidden">
        <div className="bg-cyan-50 dark:bg-cyan-950/30 px-4 py-3 border-b border-cyan-200 dark:border-cyan-900">
          <h2 className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">{"확률적 사고 훈련"}</h2>
          <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">{"미래는 하나의 고정된 결과가 아닌, 다양한 가능성과 확률분포다 — 하워드 막스"}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {probSteps.map((step, i) => (
              <div key={i} className="relative p-3 rounded-lg border border-cyan-200 dark:border-cyan-900 bg-cyan-50/50 dark:bg-cyan-950/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-500 text-white text-[10px] font-bold flex-shrink-0">{step.step}</span>
                  <p className="text-xs font-bold text-cyan-800 dark:text-cyan-200">{step.title}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">💡 "{"큰 이익은 다른 사람들보다 현상을 더 잘 보는 데서 온다. 사이클이 완전히 예측 가능하다면 아무런 우위도 없을 것이다."}"</p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">📌 "{"싸게 샀을 때는 공격적이어야 하지만, 비싸게 샀을 때는 후퇴해야 한다."}"</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 9: Secondary Thinking ────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"1차적 사고 vs 2차적 사고"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"역발상 투자의 핵심 — 비인기 자산의 저점 매수"}</p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{"1차적 사고 (군중 심리)"}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{"저조한 성과 → 비인기 → 계속 저조한 성과"}</p>
          </div>
          <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">{"2차적 사고 (역발상 투자자)"}</p>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-semibold">{"저조한 성과 → 비인기 · 낮은 가격 → 좋은 성과"}</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic border-l-4 border-gray-300 dark:border-gray-600 pl-3">
            {"인기가 없는 종목을 싸게 매수하고, 회복될 때까지 잠재적으로 긴 시간을 견뎌야 한다."}
          </p>
        </div>
      </div>

      {/* ── SECTION 10: Cycle Self-Check Questions ──────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"사이클 위치 자가진단 질문"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"현재 사이클의 위치를 파악하기 위한 핵심 질문들"}</p>
        </div>
        <div className="p-4 space-y-2">
          {cycleSelfCheckItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center mt-0.5">Q{i + 1}</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">{item}</p>
            </div>
          ))}
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 mt-1">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 italic">💡 "{"우리는 미래를 추측하지 않고 현재에 대한 관찰을 기초로 훌륭한 투자 결정을 내릴 수 있다."}"</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 11: Key Principles ───────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"하워드 막스 핵심 원칙"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"반드시 새겨야 할 투자 철학과 격언"}</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {keyPrincipleItems.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col gap-1.5">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 12: Investor's 3 Tasks ───────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"투자자가 해야 할 3가지"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"하워드 막스가 정의한 투자자의 핵심 역할"}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {investorTaskItems.map((item, i) => (
              <div key={i} className="relative p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 flex flex-col gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</span>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{item.task}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                {i < investorTaskItems.length - 1 && (
                  <span className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 text-base z-10">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">💡 {"사이클 안의 포지션이 바뀌면 확률도 변한다. 상황 변화에 따라 투자 견해를 바꾸지 않으면 사이클에 수동적으로 대처할 수밖에 없고, 확률을 내 편으로 만들 기회를 놓쳐버린다. 반면, 사이클에 대한 통찰력이 있으면 확률이 유리할 때 투자금을 늘려 더 공격적으로, 불리할 때에는 자금을 회수하고 방어력을 높일 수 있다."}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 13: Cycle Chain ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"사이클 연쇄 고리"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"경제 사이클은 다른 사이클에 연쇄적으로 영향을 미치며 순환한다"}</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-1">
            {cycleChainNodes.map((node, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-800 dark:text-blue-200 text-center">{node}</div>
                {i < cycleChainNodes.length - 1 && <span className="text-gray-400 dark:text-gray-500 text-sm font-bold">→</span>}
              </div>
            ))}
            <div className="flex items-center gap-1">
              <span className="text-gray-400 dark:text-gray-500 text-sm font-bold">→</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 italic font-medium">{"↩ 다시 경제로"}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
              <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">📈 {"상승 사이클"}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{"경제 호조 → 이익 증가 → 낙관론 → 시장 상승 → 신용 완화 → 추가 성장"}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">📉 {"하락 사이클"}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{"경제 둔화 → 이익 감소 → 비관론 → 시장 하락 → 신용 경색 → 추가 위축"}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic border-l-4 border-gray-300 dark:border-gray-600 pl-3">{"어느 한 영역에서 전개된 사이클이 다른 영역의 사이클에도 영향을 미친다. 이 순환 고리는 영원히 반복된다."}</p>
        </div>
      </div>

      {/* ── SECTION 14: Key Quotes ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"주요 명언 & 경고"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"하워드 막스와 투자 선현들의 핵심 경구"}</p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {keyQuoteItems.map((item, i) => (
            <blockquote key={i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border-l-4 border-amber-400 dark:border-amber-600 flex flex-col gap-1.5">
              <p className="text-xs italic text-gray-700 dark:text-gray-300 leading-relaxed">"{item.text}"</p>
              <cite className="text-[10px] text-gray-500 dark:text-gray-400 not-italic font-semibold">— {item.author}</cite>
            </blockquote>
          ))}
        </div>
      </div>

      {/* ── SECTION 14.5: Historical Bubbles ────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-rose-200 dark:border-rose-900 shadow-sm overflow-hidden">
        <div className="bg-rose-50 dark:bg-rose-950/30 px-4 py-3 border-b border-rose-200 dark:border-rose-900">
          <h2 className="text-sm font-semibold text-rose-800 dark:text-rose-200">{"역사적 거품·위기 연표 (암기)"}</h2>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{"금융기억의 단기성을 극복하라 — 역사는 반복되며, 잊는 자가 피해자가 된다"}</p>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {historicalBubbleItems.map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-rose-100 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/10">
                <div className="flex items-start gap-2 mb-1">
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-bold whitespace-nowrap">{item.period}</span>
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-200 leading-tight">{item.name}</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 mt-2">
            <p className="text-xs text-rose-800 dark:text-rose-200 italic">📜 {"이 사건들은 매번 '이번에는 다르다'는 믿음 속에 일어났다. 불과 몇 년이 지나지 않아 같은 상황이 반복될 때, 신세대는 이를 혁신적 발견으로 맞이한다. — 하워드 막스"}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION 15: Success Formula ─────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"투자 성공의 3요소"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"적절한 시기에 충분히 공격적이라면, 그렇게 많은 기술이 필요하지 않다"}</p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {successElements.map((el, i) => (
              <div key={i} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-center">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-1">{el.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{el.desc}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{"성공적인 투자 공식 6가지 구성요소"}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {successFormulaItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 16: Risk & Value ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{"리스크 이해 & 가치투자 핵심"}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{"하워드 막스가 정의하는 리스크와 우수한 투자자의 자질"}</p>
        </div>
        <div className="p-4 space-y-4">
          <blockquote className="border-l-4 border-orange-400 dark:border-orange-600 pl-3 py-1 bg-orange-50/50 dark:bg-orange-950/10 rounded-r-lg">
            <p className="text-xs italic text-orange-800 dark:text-orange-200 leading-relaxed">"{"내 생각에 리스크는 주로 자본을 영구적으로 손실할 가능성이다. 한편 잠재적 이익을 놓칠 가능성인 기회위험도 있다. 두 가지를 합쳐보면 리스크는 우리가 원하는 대로 되지 않을 가능성이다."}"</p>
            <cite className="text-[10px] text-orange-600 dark:text-orange-400 mt-0.5 block not-italic font-semibold">— Howard Marks</cite>
          </blockquote>
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{"리스크의 2가지 종류"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {riskTypeItems.map((item, i) => (
                <div key={i} className={`p-3 rounded-lg border ${i === 0 ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20' : 'border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20'}`}>
                  <p className={`text-xs font-bold mb-1 ${i === 0 ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>{item.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{"가치투자의 직접적 목표"}</p>
            <div className="space-y-1">
              {valueItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">{"우수한 투자자의 자질"}</p>
            <div className="space-y-1">
              {qualityItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
            <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ {"사이클의 필연성을 위배하는 단어들"}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {warningWords.map((word, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold line-through">{word}</span>
              ))}
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">{"사이클의 필연성을 믿는다면 이 단어들을 투자 어휘에서 제외해야 한다."}</p>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 p-4">
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1 flex items-center gap-1.5">
          <span>💡</span> {"사용 방법"}
        </h3>
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">{"현재 시장에서 실제로 나타나고 있는 현상을 체크하세요. 뉴스, 투자자 분위기, 자산 가격, 신용 시장 상황 등을 종합적으로 판단하여 체크하면 더 정확한 진단이 가능합니다."}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">{"강세 신호와 약세 신호가 모두 클수록 혼재 구간입니다. 한 방향으로만 신호가 몰릴수록 극단에 가깝습니다."}</p>
      </div>
    </div>
  );
}
