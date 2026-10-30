// ① 지금 살 만한 최정예 13개 — 묶음 판정표(2026-10-30 기준 스냅샷). 매수 추천이 아니라 판단 근거 공유.
// 점수는 각 1~5점(높을수록 좋음). 근거 숫자는 dives.ts·deep.ts의 심층 분석과 같다.
export type ShortRow = {
  key: string; name: string
  moat: number; profit: number; price: number; risk: number   // 해자 · 이익 추세 · 값(평소 대비) · 위험(5 = 위험 작음)
  why: string        // 한 줄 근거
  wrong: string      // 판단이 틀렸다고 볼 숫자
}
export type ShortGroup = { id: 'A' | 'B' | 'C'; title: string; desc: string; rows: ShortRow[] }

export const SHORTLIST_AS_OF = '2026-10-30'

export const SHORTLIST: ShortGroup[] = [
  {
    id: 'A', title: '숫자가 가장 좋은 쪽',
    desc: '해자가 그대로이고, 이익이 늘거나 버티며, 값이 평소보다 싼 곳. 네 가지 기준에서 크게 걸리는 데가 없다.',
    rows: [
      { key: 'NFLX', name: '넷플릭스', moat: 4, profit: 5, price: 5, risk: 3,
        why: '매출 성장은 +12%로 느려졌지만 이익은 계속 사상 최고. PER 약 18배는 10년 평소(54배)의 3분의 1.',
        wrong: '회사 전체 매출 성장률이 **+8% 아래**로 내려가면' },
      { key: 'MCD', name: '맥도날드', moat: 5, profit: 3, price: 4, risk: 5,
        why: '미국 손님은 줄었지만 가맹 수수료 구조라 이익률은 올랐다. PER은 평소의 8할, 배당 3%대.',
        wrong: '미국 같은 매장 매출이 **2분기 연속 0% 아래**면' },
      { key: 'CPRT', name: '코파트', moat: 5, profit: 3, price: 4, risk: 4,
        why: '보험 물량이 줄었는데도 이익은 고점의 97%. 원인(보험료 급등)이 뚜렷하고 빚이 없다.',
        wrong: '서비스 매출이 **다시 마이너스**로 가고 미국 보험 물량 감소가 **2027년에도 −5% 이상**이면' },
      { key: 'LII', name: '레녹스', moat: 4, profit: 4, price: 5, risk: 3,
        why: '가정용 에어컨이 5분기 만에 플러스(+2.7%), 상업용 +24%. PER 약 15배는 평소의 6할.',
        wrong: '가정용 매출이 **다시 마이너스**로 돌아서면' },
      { key: 'IDXX', name: '아이덱스', moat: 5, profit: 4, price: 3, risk: 4,
        why: '동물병원 방문이 3년째 줄어도 검사 매출은 두 자릿수 안팎. PER은 높지만 평소의 76%.',
        wrong: '반려동물 진단 반복 매출(인수·환율 제외)이 **+6% 아래**면' },
    ],
  },
  {
    id: 'B', title: '확인이 필요한 쪽',
    desc: '사업은 좋지만 값이 평소 수준이거나 아직 비싸고, 또는 회복이 숫자로 확인되기 전인 곳.',
    rows: [
      { key: 'AZO', name: '오토존', moat: 5, profit: 3, price: 3, risk: 4,
        why: '정비소 고객 +8.6%로 성장, 개인 고객은 정체. PER은 평소 수준이라 "싸다"기보다 "제값".',
        wrong: '개인 고객 같은 매장 매출이 **−2% 아래**면' },
      { key: 'GOOGL', name: '알파벳', moat: 4, profit: 5, price: 3, risk: 3,
        why: '클라우드 +103%로 회사 전체가 빨라졌지만 검색은 +12%로 둔화. 지분 평가이익을 빼면 PER은 평소 수준.',
        wrong: '검색 매출 성장률이 **2분기 연속 +8% 아래**면' },
      { key: 'ISRG', name: '인튜이티브 서지컬', moat: 5, profit: 5, price: 2, risk: 3,
        why: '매출 +22%로 사업은 최상. 다만 PER 약 54배는 높은 성장을 전제로 한 값.',
        wrong: '미국 다빈치 수술 건수 증가율이 **+7% 아래**면' },
      { key: 'AMZN', name: '아마존', moat: 4, profit: 5, price: 3, risk: 3,
        why: 'AWS +39%·이익률 사상 최고. 그러나 설비투자로 잉여현금흐름 마이너스, 최근 EPS에 지분 평가이익이 섞였다.',
        wrong: 'AWS 성장률이 **+25% 아래**로 꺾이는데 투자는 그대로면' },
      { key: 'CMG', name: '치폴레', moat: 4, profit: 2, price: 4, risk: 3,
        why: '손님은 돌아오는 중(같은 매장 +2.1%)이지만 매장 이익률이 계속 내려간다. 값은 평소의 절반 수준.',
        wrong: '같은 매장 매출이 **0% 아래**로 돌아가거나 매장 이익률 **22% 아래가 2027년에도** 이어지면' },
    ],
  },
  {
    id: 'C', title: '싸 보이지만 이유가 있는 쪽',
    desc: '값이 싸 보이는 데에 실제 위험이 있거나, 주가는 빠졌어도 사실은 싸지 않은 곳.',
    rows: [
      { key: 'ADBE', name: '어도비', moat: 3, profit: 4, price: 5, risk: 2,
        why: '숫자(구독 +13.7%)는 좋고 값은 위대한 기업 중 가장 싸다. 그러나 AI 대체 위험과 CEO 교체는 실제 변수.',
        wrong: '구독 매출 성장률이 **2분기 연속 +10% 아래**면' },
      { key: 'TPL', name: '텍사스 퍼시픽 랜드', moat: 5, profit: 4, price: 1, risk: 2,
        why: '사업은 좋지만 PER 약 43배는 10년 평소(34배)보다 오히려 비싸다. 주가가 빠진 것이지 싸진 것은 아니다.',
        wrong: '로열티 생산량이 **2분기 연속 감소**하면. 반대로 PER이 34배 아래로 내려오면 "확인이 필요한 쪽"으로 올린다' },
      { key: 'ROL', name: '롤린스', moat: 4, profit: 2, price: 3, risk: 2,
        why: '가정용 신규 손님 유입이 막혔고(자체 성장 +2.3%) 원인이 회사가 통제하기 어려운 AI 검색 변화.',
        wrong: '가정용 자체 성장이 **+2% 아래로 계속**되면. 반대로 **+3% 이상**으로 돌아오면 "확인이 필요한 쪽"으로 올린다' },
    ],
  },
]
