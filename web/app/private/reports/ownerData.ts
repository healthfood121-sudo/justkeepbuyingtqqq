// 주주 카드 데이터 — "내 주식 몫으로 1초에 얼마를 벌고, 무엇이 얼마나 팔리나".
// 종목 화면의 주주 카드와 메인(홈) 화면의 내 포트폴리오가 같은 데이터·같은 보유 주식 칸을 쓴다.
// 내 몫 = 회사 전체 숫자 × (내 주식 수 ÷ 전체 주식 수). 1년 값은 가장 최근 분기(반기)를 1년으로 늘린 값.

export type OwnerSeg = {
  name: string
  rev: number          // 1년 매출(통화 단위)
  profit: number       // 1년 세후 이익(추정)
  color: string
  note: string
}
export type OwnerFun = {
  label: string        // 예: '구글 검색'
  perYear: number      // 회사 전체 1년 양
  unit: string         // '번', '시간', '개 값'
  note: string         // 계산·출처
  grade: 'A' | 'B' | 'C'
  per?: 'sec' | 'day'  // 보여 줄 기본 단위(없으면 자동)
}
export type OwnerStake = { label: string; v: number; note: string }
export type OwnerFact = { label: string; value: string; note: string }
export type OwnerProfile = {
  key: string
  name: string
  cur: '$' | '€'
  sharesOut: number
  storageKey: string   // 보유 주식 수 저장 칸(종목 화면 이익 시계와 공유)
  period: string       // 기준 기간
  src: string
  segs: OwnerSeg[]
  fun: OwnerFun[]
  stakes?: OwnerStake[]
  facts?: OwnerFact[]  // 외워 둘 한 줄 숫자 (예: 검색 1번당 매출, 버킨 하나 팔면 남는 돈)
  dps: number          // 1주 1년 배당(실제로 받는 돈)
  how: string          // 이익을 나눈 방법
  cash: string         // 이 돈이 어디로 가나
}

const Y = (q: number, days: number) => q * 365 / days

// ── 구글: 2026년 3분기(7~9월, 92일) 회사 발표를 1년으로 늘림. 이익은 구글 서비스 영업이익을 매출 비중대로 나눈 추정, 세금 17% 뺌
const GQ = 92
const GS_OP = 39.157e9, GS_REV = 96.302e9, G_TAX = 0.83
export const GOOGL_OWNER: OwnerProfile = {
  key: 'GOOGL', name: '구글', cur: '$', sharesOut: 12.368e9, storageKey: 'clock-shares-GOOGL',
  period: '2026년 3분기(7~9월)를 1년으로 늘림', src: '2026-10-28 회사 실적 발표·분기 보고서',
  segs: [
    { name: '검색 광고', rev: Y(63.35e9, GQ), profit: Y(GS_OP * 63.35 / 96.302 * G_TAX, GQ), color: '#3b82f6', note: '검색·지도·쇼핑에 붙는 광고. +12%(둔화).' },
    { name: '클라우드', rev: Y(30.709e9, GQ), profit: Y(11.121e9 * G_TAX, GQ), color: '#0ea5e9', note: '서버·TPU·AI 모델을 기업에 빌려줌. +103%, 영업이익률 36%. 이익은 회사가 따로 공개.' },
    { name: '구독·플레이·기기', rev: Y(14.29e9, GQ), profit: Y(GS_OP * 14.29 / 96.302 * G_TAX, GQ), color: '#22c55e', note: '유튜브 프리미엄·구글 원·AI 요금제·플레이스토어 수수료·픽셀. +11%.' },
    { name: '유튜브 광고', rev: Y(11.21e9, GQ), profit: Y(GS_OP * 11.21 / 96.302 * G_TAX, GQ), color: '#ef4444', note: '영상·쇼츠·TV 화면 광고. +9%.' },
    { name: '네트워크 광고', rev: Y(7.455e9, GQ), profit: Y(GS_OP * 7.455 / 96.302 * G_TAX, GQ), color: '#f59e0b', note: '다른 사이트·앱에 대신 붙이는 광고. +1%. 대부분 사이트 주인 몫이라 실제 이익은 이보다 적을 것.' },
    { name: '웨이모 등 기타', rev: Y(0.372e9, GQ), profit: Y(-1.8e9 * G_TAX, GQ), color: '#9ca3af', note: '자율주행 택시·생명과학 등. 아직 적자(분기 손실 약 18억 달러로 가정).' },
    { name: '공통 비용(AI 연구 등)', rev: 0, profit: Y(-5.7e9 * G_TAX, GQ), color: '#d1d5db', note: '딥마인드 AI 연구·본사 비용 등 사업부에 안 나눈 비용(2분기 수준으로 가정).' },
  ],
  fun: [
    { label: '구글 검색', perYear: 5e12, unit: '번', grade: 'A', note: '구글 공식 "1년 5조 회 이상"(2024년, 지금은 더 많을 것). 검색 1번당 광고 매출 약 5센트.' },
    { label: '유튜브 시청', perYear: 1e9 * 365 * 3600, unit: '초', grade: 'B', per: 'sec', note: '유튜브 공식 "하루 10억 시간 이상"(최소값). 내가 1초 사는 동안 누군가 내 몫으로 이만큼 본다.' },
    { label: 'AI 질문·답', perYear: 3.2e15 * 12 / 1000, unit: '번', grade: 'B', note: '구글 전체 AI 토큰 한 달 3.2경(2026년 5월 CEO 발표) ÷ 질문 1번 1,000토큰 가정. 감을 잡기 위한 환산.' },
    { label: '픽셀폰 판매', perYear: 15e6, unit: '대', grade: 'C', note: '구글은 픽셀 판매 대수를 공개하지 않는다. 2024년 약 1,200만 대 × 2025년 +25%(카운터포인트)로 계산한 2차 추정 약 1,500만 대. 세계 스마트폰의 약 1.1%(IDC, 2026년 2분기). 픽셀 매출은 "구독·플레이·기기" 안에 섞여 따로 공개되지 않는다.' },
    { label: '웨이모 탑승', perYear: 500e3 * 52, unit: '번', grade: 'A', note: '회사 발표 주 50만 회 이상(2026년 3월) × 52주.' },
    { label: '웨이모 무인 주행', perYear: 4e6 * 1.609 * 52 * 1000, unit: 'm', grade: 'C', note: '"매주 400만 마일 무인 주행"(2026년 5월, 2차 출처). 회사 공식 자료로 확인 못 함.' },
  ],
  stakes: [
    { label: '스페이스X 지분', v: 94e9, note: '2026년 6월 말 공정가치 약 940억 달러(지분 약 4.9%)' },
    { label: '앤트로픽 등 비상장 지분', v: 124.3e9, note: '2026년 6월 말 장부가 1,243억 달러 — 대부분 앤트로픽으로 보도' },
    { label: '클라우드 수주 잔고', v: 561e9, note: '앞으로 받을 클라우드 계약(2026년 3분기 말). 내 몫으로 들어올 미래 매출' },
  ],
  facts: [
    { label: '검색 1번당 매출', value: '약 5.0센트', note: '검색 광고 매출 ÷ 검색 수(회사 발표 연 5조 회). 검색 수는 2024년 기준이라 실제 1번당 값은 이보다 조금 작다.' },
    { label: '검색 1번당 이익', value: '약 1.7센트', note: '검색 광고 세후 이익(추정) ÷ 같은 검색 수.' },
    { label: '유튜브 시청 1시간당 광고 매출', value: '약 12센트', note: '유튜브 광고 매출 1년 약 435억 달러 ÷ 시청 1년 3,650억 시간(하루 10억 시간, 최소값).' },
    { label: '클라우드 영업이익률', value: '36.2%', note: '2026년 3분기. 1년 전 약 24%에서 크게 올랐다(매출 +103%).' },
  ],
  dps: 0.88,
  how: '이익은 회사가 ‘구글 서비스’·‘클라우드’·‘기타 사업’으로만 공개한다. 구글 서비스 영업이익을 네 사업에 매출 비중대로 나누고 세금 17%를 뺀 추정. 지분 평가손익(스페이스X·앤트로픽 값 변동)은 현금이 아니라 뺐다.',
  cash: '구글은 배당을 아주 조금(분기 0.22달러, 1년 1주 0.88달러)만 준다. 나머지는 AI 데이터센터·자사주 매입에 쓰여 “내 주식 1주의 가치가 커지는 방식”으로 돌아온다.',
}

// ── 에르메스: 2026년 상반기(1~6월, 181일) 회사 발표를 1년으로 늘림. 이익 = 영업이익률 41% × (1 − 세율 28%)를 매출 비중대로
const RQ = 181, R_PM = 0.41 * 0.72
const BIRKIN = 10600
export const RMS_OWNER: OwnerProfile = {
  key: 'RMS', name: '에르메스', cur: '€', sharesOut: 104.5e6, storageKey: 'rms-shares',
  period: '2026년 상반기(1~6월)를 1년으로 늘림', src: '2026-07-29 회사 반기 실적 발표',
  segs: [
    { name: '가죽·마구(버킨·켈리)', rev: Y(3761e6, RQ), profit: Y(3761e6 * R_PM, RQ), color: '#f97316', note: '매출의 46%, +9.8%. 실제 이익률은 다른 사업보다 높을 가능성이 크다(회사 미공개).' },
    { name: '의류·액세서리', rev: Y(2198e6, RQ), profit: Y(2198e6 * R_PM, RQ), color: '#0ea5e9', note: '옷·신발·벨트. +2.0%.' },
    { name: '보석·홈·시계 등', rev: Y(1502e6, RQ), profit: Y(1502e6 * R_PM, RQ), color: '#9ca3af', note: '보석·그릇·가구·시계·기타.' },
    { name: '실크·스카프', rev: Y(469e6, RQ), profit: Y(469e6 * R_PM, RQ), color: '#ec4899', note: '까레 스카프·넥타이. +9.7%.' },
    { name: '향수·뷰티', rev: Y(233e6, RQ), profit: Y(233e6 * R_PM, RQ), color: '#8b5cf6', note: '향수·립스틱 등.' },
  ],
  fun: [
    { label: '버킨 30 값', perYear: Y(3761e6, RQ) / BIRKIN, unit: '개 값', grade: 'B', note: `가죽 제품 매출 ÷ 버킨 30 유럽 정가 €${BIRKIN.toLocaleString()}. 실제 버킨 판매 개수가 아니라 크기를 느끼기 위한 단위(회사는 버킨 판매 수를 공개하지 않는다).` },
    { label: '까레 스카프 값', perYear: Y(469e6, RQ) / 530, unit: '장 값', grade: 'B', note: '실크 매출 ÷ 까레 90(€530).' },
    { label: '오란 샌들 값', perYear: Y(2198e6, RQ) / 635, unit: '켤레 값', grade: 'B', note: '의류·액세서리 매출 ÷ 오란 샌들(€635).' },
    { label: '향수 값', perYear: Y(233e6, RQ) / 128, unit: '병 값', grade: 'B', note: '향수·뷰티 매출 ÷ 떼르 데르메스 100ml(약 €128).' },
  ],
  facts: [
    { label: '버킨 하나 팔면 남는 돈', value: '약 €3,100', note: '버킨 30 유럽 정가(€10,600) × 세후 영업이익률(약 29.5% = 영업이익률 41% × (1 − 세율 약 28%)). 가죽 이익률이 더 높다면 실제로는 이보다 많다.' },
    { label: '영업이익률', value: '41.0%', note: '2026년 상반기. 매출 100유로 중 41유로가 영업이익으로 남는다(세계 명품 회사 중 최고 수준).' },
    { label: '가죽 제품 매출 하루', value: `약 €${(Y(3761e6, RQ) / 365 / 1e6).toFixed(1)}백만`, note: '버킨·켈리가 속한 가죽·마구 매출(상반기 37.6억 유로)을 하루로 나눈 값. 회사 매출의 46%.' },
  ],
  dps: 26.75,
  how: '에르메스는 사업별 이익을 공개하지 않는다. 상반기 영업이익률 41%에서 세금 약 28%를 뺀 이익을 사업별 매출 비중대로 나눈 추정(모든 사업 이익률이 같다고 가정).',
  cash: '에르메스는 이익의 약 60%를 배당으로 준다(1주 1년 약 €26.75, 2025년 정규 배당 기준). 나머지는 순현금(약 128억 유로)으로 쌓인다.',
}

export const OWNERS: Record<string, OwnerProfile> = { GOOGL: GOOGL_OWNER, RMS: RMS_OWNER }

// 내 포트폴리오(홈 화면) — 종목 목록만 저장하고, 주식 수는 각 종목의 storageKey에 저장한다(종목 화면과 같은 칸)
export const PORTFOLIO_KEY = 'private_portfolio'
