'use client'

import { useState } from 'react'

// 엄선 42종목 비교 — 각 종목 리포트의 미래 모델(시나리오·가능성)을 한곳에 모았다.
type Sc = { p: number; r: number }
type Co = { key: string; name: string; price: string; pe: string; earn: string; div: number; divNet: number
  good: Sc; base: Sc; bad: Sc; risk: string; next: string; signal: string; color: string; one: string }

const COS: Co[] = [
  { key: 'RMS', name: '에르메스', price: '약 1,290~1,360유로', pe: '약 31배 (2021~2023년 45~66배)', earn: '보합 — 성장 둔화(2026년 3분기 +4.3%)', div: 1.3, divNet: 1.1,
    good: { p: 20, r: 14.9 }, base: { p: 55, r: 10.4 }, bad: { p: 25, r: 4.0 },
    risk: '성장 속도 — 중국 부자 소비, 공방·장인 증가 속도(가죽 생산 연 5~7% 상한)', next: '2027년 2월 연간 실적', signal: '가죽 성장 +8% 이상, 아시아(일본 제외) 플러스 복귀', color: 'bg-orange-500',
    one: '바닥이 가장 높다 — 세 그림 모두 플러스. 대신 위쪽도 낮다.' },
  { key: 'MSFT', name: '마이크로소프트', price: '약 526달러', pe: '본업 약 30배 (10년 평소 36배)', earn: '증가 — 매출 +19%, 애저 +48%', div: 0.7, divNet: 0.6,
    good: { p: 25, r: 18.0 }, base: { p: 55, r: 11.7 }, bad: { p: 20, r: 0.3 },
    risk: '오픈AI 한 고객 의존(수주 잔고의 큰 몫), 설비투자 회수', next: '2027년 1월 실적', signal: '애저 +45% 이상, 오픈AI 제외 수주 잔고 +20% 이상', color: 'bg-sky-500',
    one: '빅테크 중 바닥이 가장 높다 — 오피스·윈도가 받친다. 값도 평소보다 싸다.' },
  { key: 'GOOGL', name: '구글(알파벳)', price: '약 283달러', pe: '본업 약 26배 (10년 평소 26.5배)', earn: '증가 — 매출 +25%, 클라우드 +103%', div: 0.3, divNet: 0.26,
    good: { p: 25, r: 19.1 }, base: { p: 55, r: 11.7 }, bad: { p: 20, r: -4.1 },
    risk: 'AI 답변이 검색 광고를 잠식, 규제(애플 검색 계약), 설비투자 회수', next: '2027년 2월 실적', signal: '검색 +10% 이상, 클라우드 +30% 이상, 2027년 설비투자 규모', color: 'bg-blue-500',
    one: '이익이 이미 늘고 클라우드가 두 번째 엔진. AI가 검색을 갉아먹으면 손실.' },
  { key: 'AMZN', name: '아마존', price: '약 246달러', pe: '본업 약 34배 (10년 평소 75배 — 과거엔 이익이 작았다)', earn: '증가 — AWS +39%, 그러나 잉여현금 −424억 달러', div: 0, divNet: 0,
    good: { p: 25, r: 20.7 }, base: { p: 50, r: 13.9 }, bad: { p: 25, r: -0.5 },
    risk: '연 2,000억 달러대 투자의 회수 — 잉여현금 마이너스, AI 수요 둔화', next: '2027년 2월 실적', signal: 'AWS +35% 이상, 2027~2028년 잉여현금 플러스 회복', color: 'bg-amber-500',
    one: '기대값이 가장 높고 결과의 폭도 가장 넓다 — AWS 투자 회수에 거는 몫.' },
  { key: 'META', name: '메타', price: '약 630달러', pe: '본업 약 20배 (10년 평소 26배)', earn: '증가 — 매출 +26%, 투자비 매출의 약 55%', div: 0.3, divNet: 0.26,
    good: { p: 25, r: 18.7 }, base: { p: 50, r: 11.8 }, bad: { p: 25, r: -0.6 },
    risk: '광고 하나 의존 + 투자비(클라우드가 없어 남는 컴퓨팅을 팔 곳이 없다) + 청소년 소송', next: '2027년 1월 말 실적', signal: '광고 +15% 이상, 2027년 잉여현금 플러스, 뮤즈 세계 출시', color: 'bg-indigo-500',
    one: '빅테크 중 가장 싸고 광고는 가장 빠르다. 대신 2022년처럼 한 해 −64%가 될 수 있다.' },
  { key: 'AAPL', name: '애플', price: '약 350달러', pe: '약 40배 (10년 평소 28배)', earn: '증가 — 매출 +15%, 메모리 비용 압박', div: 0.3, divNet: 0.26,
    good: { p: 25, r: 9.1 }, base: { p: 50, r: 4.6 }, bad: { p: 25, r: -3.1 },
    risk: '비싼 값(PER이 평소로 돌아가면 수익률이 깎인다), 서비스 규제, AI 의존(구글)', next: '2027년 1월 말 실적', signal: 'PER 28배 근처(약 250달러), 매출총이익률 46% 이상', color: 'bg-gray-500',
    one: '사업은 가장 확실, 값은 가장 비싸다 — 지금은 기다리는 종목.' },
  { key: 'NKE', name: '나이키', price: '약 38달러', pe: '18배 (10년 평소 32배, 내년 이익 기준 약 30배)', earn: '감소 — 바닥은 2027 회계연도(회사 전망)', div: 4.3, divNet: 3.7,
    good: { p: 25, r: 19.1 }, base: { p: 45, r: 10.9 }, bad: { p: 30, r: -0.6 },
    risk: '브랜드 회복 실패 — 온·호카 등에 러닝·젊은 층을 계속 빼앗김, 중국', next: '11월 16~17일 투자자의 날(5년 목표), 12월 실적', signal: '분기 매출 플러스, 공식몰 할인 비중 50% → 40% 아래, 매출총이익률 회복', color: 'bg-gray-800',
    one: '회복 베팅 + 배당 4.3%. 이익이 아직 바닥 전(실제 기대 8.5~9.5%).' },
  { key: 'V', name: '비자', price: '약 410달러', pe: '조정 약 31배 (10년 평소 33배)', earn: '증가 — 순매출·조정 EPS 모두 +10%대', div: 0.8, divNet: 0.65,
    good: { p: 25, r: 16.1 }, base: { p: 55, r: 11.5 }, bad: { p: 20, r: 3.4 },
    risk: '규제(미국 직불 소송·수수료 상한), 스테이블코인·실시간 계좌이체 같은 우회로', next: '2027년 1월 말 실적', signal: '해외 결제 +10% 이상, 부가 서비스 +20% 안팎', color: 'bg-yellow-500',
    one: '결제 통행료 — 나쁜 그림에서도 플러스. 엄선 핵심 중 가장 안정적인 축.' },
  { key: 'MA', name: '마스터카드', price: '약 636달러', pe: '조정 약 32배 (10년 평소 37배)', earn: '증가 — 순매출 +10%대, 서비스가 더 빠르다', div: 0.6, divNet: 0.5,
    good: { p: 25, r: 16.2 }, base: { p: 55, r: 11.7 }, bad: { p: 20, r: 2.9 },
    risk: '비자와 같은 규제·우회로 위험, 해외 비중이 더 커서 환율', next: '2027년 1월 실적', signal: '서비스 매출 +15% 이상, 해외 결제 증가', color: 'bg-red-500',
    one: '비자와 거의 같은 그림 — 둘 중 하나만 담아도 충분하다.' },
  { key: 'SPGI', name: 'S&P 글로벌', price: '약 459달러', pe: '조정 약 26배 (10년 평소 33배)', earn: '증가 — 2026년 조정 EPS 17.70~17.95달러(분사 뒤)', div: 0.9, divNet: 0.75,
    good: { p: 25, r: 15.2 }, base: { p: 55, r: 10.3 }, bad: { p: 20, r: 1.6 },
    risk: 'AI가 금융 데이터를 싸게 만들 위험, 채권 발행 경기', next: '2027년 2월 실적', signal: '캐피털 IQ 검토 결과, 지수 사업 +10% 이상', color: 'bg-rose-700',
    one: '신용평가 + S&P 500 지수 — 무디스·MSCI보다 사업이 넓고 값은 싸다.' },
  { key: 'MCO', name: '무디스', price: '약 483달러', pe: '조정 약 29배 (10년 평소 35배)', earn: '증가 — 신용평가 +20%대(AI 데이터센터 발행)', div: 0.9, divNet: 0.75,
    good: { p: 25, r: 13.3 }, base: { p: 55, r: 8.8 }, bad: { p: 20, r: 0.2 },
    risk: '채권 발행 경기(2022년 이익 −37%), AI가 분석 사업을 대체할 위험', next: '2027년 2월 실적', signal: '발행 전망, 분석 부문 반복 매출 +8% 이상', color: 'bg-teal-600',
    one: '신용평가 과점이지만 경기를 크게 탄다 — 이 묶음 중 기대가 낮은 편.' },
  { key: 'MSCI', name: 'MSCI', price: '약 615달러', pe: '조정 약 32배 (10년 평소 39배)', earn: '증가 — 지수 구독·ETF 연동 수수료 증가', div: 1.3, divNet: 1.1,
    good: { p: 25, r: 18.4 }, base: { p: 55, r: 12.7 }, bad: { p: 20, r: 2.2 },
    risk: '긴 약세장(ETF 연동 수수료 감소), ESG 사업 후퇴, 지수 수수료 인하 압박', next: '2027년 1월 실적', signal: '지수 구독 +10% 이상, ETF 자산 증가', color: 'bg-violet-500',
    one: '핵심 복리 묶음 중 기대가 가장 높다 — 지수 투자가 커질수록 자동으로 번다.' },
  { key: 'ADP', name: 'ADP', price: '약 286달러', pe: '약 25배 (10년 평소 31배)', earn: '증가 — 2027 회계연도 조정 EPS +10~12% 전망', div: 2.4, divNet: 2.0,
    good: { p: 20, r: 14.7 }, base: { p: 60, r: 10.1 }, bad: { p: 20, r: 1.8 },
    risk: 'AI가 사무직을 줄여 고객사 직원 수 감소, 금리 인하(예치금 이자), 고용 둔화', next: '2027년 1월 말 실적', signal: '급여 대상 직원 수 +1% 이상, 유지율 91% 이상', color: 'bg-green-600',
    one: '바꾸기 어려운 급여 업무 + 배당 2.4%. AI 공포로 싸진 조용한 복리.' },
  { key: 'SYK', name: '스트라이커', price: '약 311달러', pe: '조정 약 22배 (2019~2025년 25~30배)', earn: '증가 — 그러나 2026년 전망 하향(조정 EPS 14.80~14.90달러)', div: 1.1, divNet: 0.95,
    good: { p: 20, r: 14.9 }, base: { p: 60, r: 10.0 }, bad: { p: 20, r: 2.0 },
    risk: '관절 시장 둔화(보험 부담), 2026년 해킹·SAP 같은 실행 사고, CEO 교체', next: '2027년 1월 실적·전망', signal: '자체 성장 6% 이상, 미국 무릎·엉덩이 +4% 이상 회복', color: 'bg-amber-700',
    one: '마코 로봇 해자 + 고령화. 사고의 해 뒤라 2019년 이후 가장 싸다.' },
  { key: 'GGG', name: '그레이코', price: '약 68달러', pe: '조정 약 22배 (10년 평소 30배)', earn: '회복 중 — 자체 성장 −6%(1분기) → +4%(3분기)', div: 1.7, divNet: 1.5,
    good: { p: 20, r: 14.9 }, base: { p: 60, r: 10.1 }, bad: { p: 20, r: 2.2 },
    risk: '미국 주택·중국 산업 경기, 발코 멜턴 인수 실행', next: '2027년 1월 실적', signal: '주문·잔고 증가, 자체 성장 +2% 이상', color: 'bg-lime-600',
    one: '산업재 최상위 이익률(약 27%) + 순현금. 3년 정체 끝의 회복 베팅.' },
  { key: 'DCI', name: '도널드슨', price: '약 84달러', pe: '조정 약 21배 (10년 평소 28배)', earn: '증가 — 2027 회계연도 조정 EPS 4.22~4.38달러 전망', div: 1.5, divNet: 1.3,
    good: { p: 20, r: 13.8 }, base: { p: 60, r: 9.1 }, bad: { p: 20, r: -0.5 },
    risk: '트럭·건설 장비 경기, 전기차(엔진 필터 감소), 퍼싯 인수 실행', next: '12월 초 2027 회계연도 1분기 실적', signal: '교체 필터 +5% 이상, 조정 영업이익률 16% 이상', color: 'bg-cyan-700',
    one: '교체 필터 반복 매출, 70년 배당. 망가지기도 빨리 크기도 어려운 사업.' },
  { key: 'FICO', name: 'FICO', price: '약 688달러', pe: '조정 약 16배 (10년 평소 공시 약 53배)', earn: '흔들림 — 2027 회계연도 전망 미제시, 주택담보 점수 가격 압박', div: 0, divNet: 0,
    good: { p: 20, r: 23.1 }, base: { p: 50, r: 13.3 }, bad: { p: 30, r: -0.8 },
    risk: '정부가 미는 경쟁 점수(밴티지스코어)로 주택담보 점수 독점·가격이 무너짐', next: '2027년 1월 말 1분기 실적', signal: '주택담보 점수 단가·물량 유지, 자사주 재개', color: 'bg-fuchsia-600',
    one: '대출 심사의 공용어. 가격 인상 반납까진 반영, 독점 붕괴까진 아님 — 작게 담는 옵션.' },
  { key: 'INTU', name: '인튜이트', price: '약 329달러', pe: '조정 약 14배 (10년 평소 공시 약 51배)', earn: '둔화 — 전망 하향, 터보택스 +2~3%, 퀵북스는 +20%', div: 1.6, divNet: 1.35,
    good: { p: 20, r: 22.0 }, base: { p: 55, r: 15.3 }, bad: { p: 25, r: 0.9 },
    risk: 'AI가 세금 신고·장부 정리를 대신해 터보택스 고객 이탈', next: '11월 말 1분기, 진짜 시험은 2027년 5월 세금 시즌', signal: '터보택스 고객 수 유지, 퀵북스 +15% 이상', color: 'bg-emerald-600',
    one: '퀵북스는 아직 +20%. 터보택스 공포가 값을 10년 평소의 절반 아래로 눌렀다.' },
  { key: 'ADBE', name: '어도비', price: '약 247달러', pe: '조정 약 10배 (10년 평소 공시 약 45배)', earn: '증가 — 매출 +10%대 초반, 그러나 신규 반복 매출 둔화', div: 0, divNet: 0,
    good: { p: 20, r: 22.9 }, base: { p: 50, r: 15.2 }, bad: { p: 30, r: -0.8 },
    risk: 'AI 이미지·영상 도구가 포토샵·프리미어를 대체, CEO 교체', next: '12월 중순 4분기 실적', signal: '2027년 반복 매출 목표, 무료 → 유료 전환 숫자', color: 'bg-red-700',
    one: '이익은 꺾이지 않았는데 값은 3분의 1. "AI에 지지 않는다"에 거는 몫.' },
  { key: 'CPRT', name: '코파트', price: '약 29달러', pe: '약 19배 (10년 평소 약 32배)', earn: '정체 — 미국 보험 사고차 물량 감소, 자사주 재개', div: 0, divNet: 0,
    good: { p: 25, r: 13.3 }, base: { p: 55, r: 8.1 }, bad: { p: 20, r: -0.5 },
    risk: '보험 물량 감소 지속, 이자 수익 감소, ACV 인수(약 19억 달러) 실행', next: '11월 말~12월 초 1분기 실적', signal: '미국 보험 물량 반등, 대당 비용 안정', color: 'bg-stone-600',
    one: '빚 없는 사고차 경매 독점. 과거 10년 보유 22번 모두 이겼다 — 복리 기계가 다시 도는지 확인하며 산다.' },
  { key: 'ZTS', name: '조에티스', price: '약 78달러', pe: '조정 약 12배 (10년 평소 약 36배)', earn: '감소 — 반려동물 약 역성장, 가축용은 +7~12%', div: 2.6, divNet: 2.2,
    good: { p: 20, r: 19.7 }, base: { p: 50, r: 12.0 }, bad: { p: 30, r: 1.3 },
    risk: '피부병 약 경쟁 심화, 관절 주사(리브렐라) 안전성 논란, 동물병원 방문 감소', next: '2027년 2월 4분기 실적', signal: '2027년 매출 전망 플러스, 피부약 하락 멈춤', color: 'bg-purple-700',
    one: '세계 1위 동물 약. 이익보다 값이 받치는 구조 — PER이 평소의 3분의 1.' },
  { key: 'NFLX', name: '넷플릭스', price: '약 62달러', pe: '약 21배, 위약금 제외 (10년 평소 약 54배)', earn: '증가 — 매출 +12%, 이익 +20~30%', div: 0, divNet: 0,
    good: { p: 20, r: 21.4 }, base: { p: 55, r: 14.1 }, bad: { p: 25, r: 0.4 },
    risk: '시청 시간 감소, 가격 인상 한계, 광고 목표 지연', next: '2027년 1월 4분기 서한', signal: '2027년 이익률 전망 상향, 광고 매출 목표 달성', color: 'bg-red-600',
    one: '성장 대비 싼 값. 대신 한 해 −75%도 가능한 종목 — "흔들리며 가는 12%".' },
  { key: 'BKNG', name: '부킹', price: '약 149달러', pe: '조정 약 14.5배 (10년 평소 약 30배)', earn: '증가 — 이익 사상 최고, 4분기 매출 전망 0~2%로 둔화', div: 1.1, divNet: 0.95,
    good: { p: 25, r: 21.6 }, base: { p: 50, r: 14.9 }, bad: { p: 25, r: 1.8 },
    risk: 'AI 여행 비서가 부킹을 건너뜀, 전쟁·고유가 여행 둔화', next: '2027년 2월 4분기 실적', signal: '객실 예약 +5% 이상 회복, AI 제휴 숫자', color: 'bg-blue-800',
    one: '싼 값 + 해마다 주식 4~7% 줄이는 자사주. 이익이 7%만 늘어도 주당이익은 11%.' },
  { key: 'IDXX', name: 'IDEXX', price: '약 574달러', pe: '약 39배 (10년 평소 약 53배)', earn: '증가 — 2026년 매출 +10% 안팎, 전망 상향', div: 0, divNet: 0,
    good: { p: 25, r: 13.9 }, base: { p: 55, r: 9.0 }, bad: { p: 20, r: 0.5 },
    risk: '동물병원 방문 감소, 높은 PER이 내려오는 몫', next: '2027년 2월 4분기 실적', signal: '2027년 자체 성장 +8% 이상, 인뷰 Dx 설치 증가', color: 'bg-pink-600',
    one: '동물 진단의 표준, 사업의 질은 최상위. 값이 높아 기대는 에르메스와 비슷.' },
  { key: 'LII', name: '레녹스', price: '약 340달러', pe: '조정 약 15배 (10년 평소 약 26배)', earn: '정체 — 이익 2년째 제자리, 2027년 상반기 더 어렵다(회사)', div: 1.5, divNet: 1.3,
    good: { p: 20, r: 18.1 }, base: { p: 55, r: 11.3 }, bad: { p: 25, r: -2.2 },
    risk: '가격 결정력 상실(해외 저가 경쟁), 주택 경기, 관세', next: '2027년 1월 말 4분기 실적·전망', signal: '2027년 가격 인상이 먹힘, 가정용 물량 반등', color: 'bg-orange-700',
    one: '설치 업체 직판망을 가진 냉난방. 싼 값이 "싼 이유"일 수 있다 — 가격 결정력 회복이 열쇠.' },
  { key: 'BR', name: '브로드리지', price: '약 177달러', pe: '조정 약 18배 (10년 평소 약 33배)', earn: '증가 — 조정 이익 매년 사상 최고(디지털 자산 손익은 별도)', div: 2.5, divNet: 2.1,
    good: { p: 20, r: 17.2 }, base: { p: 60, r: 12.3 }, bad: { p: 20, r: 3.4 },
    risk: '전자 발송 규칙 변경으로 반복 매출 성장 소폭 역풍, 금융 뒤편 업무 AI 공포', next: '2027년 2월 2분기 실적', signal: '반복 매출 +5% 이상, 토큰화 거래량 증가', color: 'bg-slate-600',
    one: '규제로 보호된 주주총회 발송 독점. 나쁜 그림에서도 플러스 — 이번 묶음에서 에르메스와 가장 닮았다.' },
  { key: 'LVMH', name: 'LVMH', price: '약 409유로', pe: '약 19배 (10년 평소 약 25배)', earn: '감소 — 2023년 정점 뒤 2년 연속 이익 감소', div: 3.2, divNet: 2.7,
    good: { p: 20, r: 16.0 }, base: { p: 50, r: 10.6 }, bad: { p: 30, r: -1.8 },
    risk: '중국·중산층 명품 수요 부진 지속, 루이비통 가격 저항', next: '2027년 1월 말 2026년 연간 실적', signal: '패션·가죽 자체 성장 플러스 전환, 중국 회복', color: 'bg-amber-900',
    one: '명품 경기 회복에 거는 몫. 에르메스와 같이 담으면 명품 위험이 겹친다.' },
  { key: 'NVDA', name: '엔비디아', price: '약 214달러', pe: '약 31배, 주식 보상 포함 (10년 평소 44배, 2028 전망 기준 약 14배)', earn: '급증 — 매출 +106%, 2028 회계연도 +70% 전망', div: 0.5, divNet: 0.4,
    good: { p: 25, r: 16.7 }, base: { p: 45, r: 7.9 }, bad: { p: 30, r: -8.8 },
    risk: 'AI 투자 사이클 꺾임, 고객 자체 칩, 고객에게 돈을 대 주는 구조, 메모리 원가', next: '11월 하순 3분기 실적', signal: '데이터센터 +40% 이상, 매출총이익률 72% 이상', color: 'bg-green-800',
    one: 'AI 시대 최강 사업, 하지만 정점 이익일 수 있다 — 결과 폭이 가장 넓다.' },
  { key: 'AVGO', name: '브로드컴', price: '약 345달러', pe: '조정 약 35배 (공시 44배, 2028 전망 기준 약 12배)', earn: '급증 — AI 반도체 +221%, 2028 회계연도 AI 2,300억 전망', div: 0.75, divNet: 0.65,
    good: { p: 25, r: 15.7 }, base: { p: 45, r: 7.5 }, bad: { p: 30, r: -6.6 },
    risk: 'AI 고객 6곳 집중, AI 연구소 금융 구조, 빚 600억, 이익률 희석', next: '12월 중순 4분기 실적', signal: '2027 회계연도 AI 1,150억 유지, 조정 영업이익률 65% 이상', color: 'bg-red-900',
    one: '빅테크 자체 AI 칩의 설계자. 엔비디아와 같은 AI 위험, 소프트웨어가 바닥을 조금 받친다.' },
  { key: 'ISRG', name: '인튜이티브 서지컬', price: '약 448달러', pe: '약 49배, 합의금 제외 (10년 평소 70배)', earn: '증가 — 매출 +22%, 수술 +15%', div: 0, divNet: 0,
    good: { p: 25, r: 14.3 }, base: { p: 50, r: 8.1 }, bad: { p: 25, r: -1.6 },
    risk: '2027년 기구 가격 인하(1건당 −3~5%), 경쟁 로봇·중국, 높은 PER', next: '2027년 1월 하순 4분기 실적', signal: '다빈치 수술 +12% 이상, 가격 인하 뒤 기구 매출 +15%', color: 'bg-sky-700',
    one: '수술 로봇의 표준. 질은 최상위, 값이 기대를 누른다 — IDEXX와 비슷한 성격.' },
  { key: 'TDG', name: '트랜스다임', price: '약 1,181달러', pe: '약 32배, 순이익 기준 (10년 평소 44배)', earn: '증가 — 매출 +23%, 자체 성장 +13%', div: 2.0, divNet: 1.7,
    good: { p: 25, r: 17.7 }, base: { p: 50, r: 11.8 }, bad: { p: 25, r: -2.9 },
    risk: '빚 337억·금리, 정부 가격 감시·인수 규제, 항공 수요 충격', next: '11월 12일께 4분기 실적', signal: '자체 성장 +8% 이상, 순부채/EBITDA 7배 아래', color: 'bg-zinc-600',
    one: '인증으로 지켜지는 비행기 부품 독점 + 빚으로 굴리는 기계. AI와 무관.' },
  { key: 'NOW', name: '서비스나우', price: '약 111달러', pe: '조정 약 29배, 주식 보상 포함 약 52배 (10년 평소 90배)', earn: '증가 — 구독 +21%, AI 계약 17억 달러 목표', div: 0, divNet: 0,
    good: { p: 20, r: 20.7 }, base: { p: 50, r: 11.6 }, bad: { p: 30, r: -4.4 },
    risk: 'AI가 사용자 수를 줄이는 위험, 마이크로소프트·오픈AI, 큰 주식 보상', next: '2027년 1월 하순 4분기 실적', signal: 'cRPO +18% 이상, AI 계약 목표 달성', color: 'bg-indigo-700',
    one: '구독 +21%를 지키는데 −53%. 인튜이트·어도비와 같은 "AI 공포 소프트웨어".' },
  { key: 'MELI', name: '메르카도리브레', price: '약 1,510달러', pe: '약 40배 (정상 이익률이면 약 25배, 10년 평소 51배)', earn: '이익률 투자 중 — 매출 +45%, 영업이익률 6.3%', div: 0, divNet: 0,
    good: { p: 25, r: 26.2 }, base: { p: 50, r: 14.4 }, bad: { p: 25, r: -8.7 },
    risk: '대출 180억 신용 위험, 쇼피·아마존, 환율·아르헨티나 정치', next: '2027년 2월 하순 4분기 실적', signal: '영업이익률 8% 이상 회복, 연체율 7% 안팎', color: 'bg-yellow-600',
    one: '중남미의 아마존+페이팔. 이익률을 일부러 깎은 상태라 회복 몫이 크다 — 결과 폭도 크다.' },
  { key: 'TXRH', name: '텍사스 로드하우스', price: '약 184달러', pe: '약 29배 (10년 평소 27배)', earn: '회복 중 — 매출 +9.5%, EPS +8.6%(3분기)', div: 1.6, divNet: 1.4,
    good: { p: 25, r: 15.8 }, base: { p: 55, r: 10.2 }, bad: { p: 20, r: -3.8 },
    risk: '소고기 값, 외식 경기, 인건비', next: '2027년 2월 중순 4분기 실적', signal: '매장 이익률 15% 이상, 원재료 물가 4% 아래', color: 'bg-orange-900',
    one: '외식 불황에도 손님이 느는 가성비 스테이크. 매장 +5%의 꾸준한 복리, AI와 무관.' },
  { key: 'PG', name: 'P&G', price: '약 159달러', pe: '약 23배', earn: '느린 증가 — 자체 성장 +2% 안팎', div: 2.7, divNet: 2.3,
    good: { p: 20, r: 10.4 }, base: { p: 60, r: 7.0 }, bad: { p: 20, r: 1.4 },
    risk: '물량 정체, 원가·관세, 신흥국 통화', next: '2027년 1월 하순 2분기 실적', signal: '자체 성장 +3% 이상, 물량 플러스', color: 'bg-blue-950',
    one: '매일 쓰는 물건을 조금씩 더 비싸게. 나쁜 그림에서도 플러스인 방어의 기준.' },
  { key: 'KO', name: '코카콜라', price: '약 92달러', pe: '약 28배', earn: '느린 증가 — 판매량 +1~2%', div: 2.3, divNet: 2.0,
    good: { p: 20, r: 9.0 }, base: { p: 60, r: 5.9 }, bad: { p: 20, r: 1.0 },
    risk: '설탕·비만약 수요 변화, 국세청 세금 소송, 환율', next: '2027년 2월 4분기 실적', signal: '판매량 +2% 이상, 조정 영업이익률 31% 이상', color: 'bg-red-400',
    one: '세계 최강 브랜드지만 값이 이미 높다. 손실은 거의 없고 기대도 연 5~6%.' },
  { key: 'PEP', name: '펩시코', price: '약 133달러', pe: '약 16배 (최근 수년 대비 싸다)', earn: '정체 — 북미 과자 물량 회복이 관건', div: 4.4, divNet: 3.7,
    good: { p: 20, r: 15.1 }, base: { p: 55, r: 10.7 }, bad: { p: 25, r: 4.1 },
    risk: '북미 과자 물량 감소, 비만약, 구조 개편 지연', next: '2027년 2월 초 4분기 실적', signal: '북미 과자 물량 증가, 핵심 EPS +4% 이상', color: 'bg-blue-600',
    one: '이익 성장보다 싼 값과 배당 4.4%로 기대를 만든다. 구조 개편이 되면 회복 몫이 크다.' },
  { key: 'MCD', name: '맥도날드', price: '약 256달러', pe: '약 20배', earn: '느린 증가 — 회원 매출·신규 매장', div: 3.0, divNet: 2.6,
    good: { p: 20, r: 12.5 }, base: { p: 60, r: 9.4 }, bad: { p: 20, r: 3.3 },
    risk: '저소득층 손님 감소, 가격 반감, 가맹점 수익성', next: '2027년 2월 4분기 실적', signal: '미국 같은 매장 매출 +2% 이상, 손님 수 플러스', color: 'bg-amber-300',
    one: '부동산+로열티 구조라 손님이 줄어도 이익이 버틴다. 방어주 중 기대 상위.' },
  { key: 'CL', name: '콜게이트', price: '약 92달러', pe: '약 24배', earn: '느린 증가 — 신흥국이 성장 담당', div: 2.3, divNet: 2.0,
    good: { p: 20, r: 10.2 }, base: { p: 60, r: 6.9 }, bad: { p: 20, r: 0.9 },
    risk: '북미 부진, 신흥국 통화 위기, 원가', next: '2027년 1월 말 4분기 실적', signal: '자체 매출 +3% 이상, 매출총이익률 60% 이상', color: 'bg-rose-600',
    one: '치약 세계 1위. P&G와 거의 같은 위험 — 둘 중 하나면 충분.' },
  { key: 'CME', name: 'CME 그룹', price: '약 295달러', pe: '약 24배', earn: '증가 — 시장이 흔들릴수록 거래 증가', div: 3.6, divNet: 3.1,
    good: { p: 20, r: 11.2 }, base: { p: 60, r: 8.3 }, bad: { p: 20, r: 2.3 },
    risk: '조용한 시장(거래 감소), 새 거래소 경쟁, 금리 하락', next: '2026년 12월 변동 배당 / 2027년 2월 실적', signal: '하루 거래 2,500만 계약 이상, 계약당 수수료 유지', color: 'bg-slate-700',
    one: '나쁜 시장에 오히려 버는 거래소 독점. 다른 종목과 반대로 움직여 섞기 좋다.' },
  { key: 'PGR', name: '프로그레시브', price: '약 229달러', pe: '약 11.5배', earn: '꼭대기 근처 — 이익률이 내려오는 중', div: 1.5, divNet: 1.3,
    good: { p: 20, r: 12.6 }, base: { p: 55, r: 7.2 }, bad: { p: 25, r: -1.6 },
    risk: '보험 이익률 하락(가격 경쟁), 대형 재해, 자동차 사고 비용', next: '매달 실적 발표', signal: '합산비율 92 이하, 보험료 +5% 이상', color: 'bg-cyan-500',
    one: '최고의 자동차 보험사지만 사이클 꼭대기. 싸 보이는 PER은 이익이 높은 탓.' },
  { key: 'RSG', name: '리퍼블릭 서비스', price: '약 234달러', pe: '약 32배', earn: '꾸준한 증가 — 가격 +5%, 물량 보합', div: 1.1, divNet: 0.9,
    good: { p: 20, r: 10.2 }, base: { p: 60, r: 6.7 }, bad: { p: 20, r: 0.5 },
    risk: '물량 감소(주택·건설 경기), 비싼 값, 인수 실패', next: '2027년 2월 4분기 실적', signal: '핵심 가격 인상 +5% 이상, 물량 플러스', color: 'bg-lime-800',
    one: '매립지라는 대체 불가 자산으로 해마다 값을 올린다. 사업은 완벽, 값이 비싸다.' },
]
const ev = (c: Co) => (c.good.p * c.good.r + c.base.p * c.base.r + c.bad.p * c.bad.r) / 100
const loss = (c: Co) => [c.good, c.base, c.bad].filter(s => s.r < 0).reduce((a, s) => a + s.p, 0)
const f1 = (v: number) => `${v.toFixed(1)}%`
const DEF: Record<string, number> = { RMS: 25, MSFT: 20, GOOGL: 15, AMZN: 15, META: 10, AAPL: 5, NKE: 10, V: 0, MA: 0, SPGI: 0, MCO: 0, MSCI: 0, ADP: 0, SYK: 0, GGG: 0, DCI: 0, FICO: 0, INTU: 0, ADBE: 0, CPRT: 0, ZTS: 0, NFLX: 0, BKNG: 0, IDXX: 0, LII: 0, BR: 0, LVMH: 0, NVDA: 0, AVGO: 0, ISRG: 0, TDG: 0, NOW: 0, MELI: 0, TXRH: 0, PG: 0, KO: 0, PEP: 0, MCD: 0, CL: 0, CME: 0, PGR: 0, RSG: 0 }

export default function TrioCompare({ onPick }: { onPick: (key: string) => void }) {
  const [w, setW] = useState<Record<string, number>>(DEF)
  const tot = COS.reduce((a, c) => a + (w[c.key] ?? 0), 0) || 1
  const mix = (f: (c: Co) => number) => COS.reduce((a, c) => a + f(c) * (w[c.key] ?? 0), 0) / tot
  const rank = [...COS].sort((a, b) => ev(b) - ev(a))
  const th = 'py-1.5 px-2 font-medium text-gray-400 text-left whitespace-nowrap'
  const td = 'py-1.5 px-2 text-gray-700 dark:text-gray-200 align-top min-w-[8.5rem]'
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  return (
    <section className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 p-3 sm:p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">엄선 42종목 — 한눈에 비교 (10년, 추정)</h3>
        <p className={small}>에르메스·빅테크 5개·나이키에 핵심 복리 9종목(비자·마스터카드·S&amp;P 글로벌·무디스·MSCI·ADP·스트라이커·그레이코·도널드슨)과 지금 싼 알짜 11종목(FICO·인튜이트·어도비·코파트·조에티스·넷플릭스·부킹·IDEXX·레녹스·브로드리지·LVMH), 고성장 7종목(엔비디아·브로드컴·인튜이티브 서지컬·트랜스다임·서비스나우·메르카도리브레·텍사스 로드하우스), 방어 8종목(P&amp;G·코카콜라·펩시코·맥도날드·콜게이트·CME·프로그레시브·리퍼블릭 서비스)을 더했다. 각 종목 리포트의 미래 모델(시나리오·가능성)을 모았다. 수익률 = 이익 성장 + PER 변화 + 배당(세전). 종목 이름을 누르면 그 페이지로 간다. 2026-11-10 기준, 투자 추천이 아니다.</p>
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-2.5">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-1.5">가능성 반영 기대 순위</p>
        <div className="space-y-1">
          {rank.map(c => {
            const v = ev(c)
            return (
              <button key={c.key} onClick={() => onPick(c.key)} className="w-full flex items-center gap-2 text-xs text-left hover:bg-white/60 dark:hover:bg-gray-800/60 rounded px-1">
                <span className="w-24 shrink-0 text-gray-700 dark:text-gray-200">{c.name}</span>
                <span className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden"><span className={`block h-full ${c.color}`} style={{ width: `${Math.min(100, Math.max(0, v) / 14 * 100)}%` }} /></span>
                <span className="w-14 text-right font-semibold text-gray-900 dark:text-white">연 {v.toFixed(1)}%</span>
                <span className="w-16 text-right text-gray-400">{loss(c) ? `손실 ${loss(c)}%` : '손실 없음'}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto"><table className="w-full text-xs">
        <thead><tr className="border-b border-gray-200 dark:border-gray-800"><th className={th}></th>{COS.map(c => <th key={c.key} className={th}><button onClick={() => onPick(c.key)} className="hover:underline text-blue-600 dark:text-blue-400">{c.name}</button></th>)}</tr></thead>
        <tbody>
          {([
            ['한 줄 요약', (c: Co) => c.one],
            ['지금 값', (c: Co) => c.price], ['PER', (c: Co) => c.pe], ['이익 방향', (c: Co) => c.earn],
            ['배당 (세후, 한국 거주자 대략)', (c: Co) => c.div ? `${c.div}% (약 ${c.divNet}%)` : '없음'],
            ['좋은 그림', (c: Co) => `연 ${f1(c.good.r)} (${c.good.p}%)`], ['기본 그림', (c: Co) => `연 ${f1(c.base.r)} (${c.base.p}%)`], ['나쁜 그림', (c: Co) => `연 ${f1(c.bad.r)} (${c.bad.p}%)`],
            ['가능성 반영 기대', (c: Co) => `연 약 ${ev(c).toFixed(1)}%`], ['손실 가능성', (c: Co) => loss(c) ? `약 ${loss(c)}%` : '없음'],
            ['가장 큰 위험', (c: Co) => c.risk], ['다음 확인', (c: Co) => c.next], ['좋아진다는 신호', (c: Co) => c.signal],
          ] as [string, (c: Co) => string][]).map(([k, fn]) => (
            <tr key={k} className="border-b border-gray-100 dark:border-gray-900">
              <td className={`${td} font-medium whitespace-nowrap text-gray-500 min-w-0`}>{k}</td>
              {COS.map(c => <td key={c.key} className={`${td} ${k === '가능성 반영 기대' ? 'font-semibold' : ''}`}>{fn(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table></div>
      <p className="text-[11px] text-gray-400">표는 옆으로 밀어서 본다.</p>

      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-orange-50/70 dark:bg-orange-950/20 p-2.5"><b>바닥이 높은 쪽(에르메스·마이크로소프트):</b> 나쁜 그림에서도 손실이 거의 없다. 포트폴리오의 중심.</div>
        <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 p-2.5"><b>기대가 높은 쪽(아마존·구글·메타):</b> 연 10~12%대 기대, 대신 손실 가능성 20~25%. 모두 AI 투자 회수에 걸려 있다 — 셋을 다 많이 담으면 같은 위험을 겹쳐 사는 셈.</div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800/60 p-2.5"><b>값이 문제인 쪽(애플):</b> 사업은 가장 확실하지만 PER 40배라 기대가 연 4% 안팎. 약 250달러(PER 28배)면 연 8%대.</div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800/60 p-2.5"><b>회복 베팅(나이키):</b> 배당 4.3%가 받치는 반등 몫. 투자자의 날·분기 매출 신호를 보며 나눠 산다.</div>
        <div className="rounded-lg bg-yellow-50/70 dark:bg-yellow-950/20 p-2.5"><b>통행료형(비자·마스터카드·S&amp;P 글로벌·MSCI):</b> 기대 연 10~12%, 나쁜 그림에서도 대체로 플러스. 빅테크와 흔들리는 이유(규제·금융 경기)가 달라 섞기 좋다. 비자·마스터카드는 거의 같은 위험이라 하나면 충분.</div>
        <div className="rounded-lg bg-green-50/70 dark:bg-green-950/20 p-2.5"><b>싸진 복리형(ADP·스트라이커·그레이코·도널드슨):</b> 모두 평소보다 20~30% 싸고 기대 연 8~9.5%. 각자 걱정(AI·관절 둔화·주택·전기차)이 있어 값이 눌렸다 — 걱정이 숫자로 안 나타나면 다시 오를 몫. 무디스는 경기를 크게 타서 기대가 연 8% 안팎.</div>
        <div className="rounded-lg bg-purple-50/70 dark:bg-purple-950/20 p-2.5"><b>공포로 반값 된 쪽(인튜이트·어도비·넷플릭스·부킹):</b> PER이 10년 평소의 3분의 1~절반이라 기대가 연 12~13%로 가장 높다. 대신 넷 다 "AI가 우리를 건너뛰나"라는 같은 질문에 걸려 있다 — 함께 담으면 같은 위험을 겹쳐 사는 셈.</div>
        <div className="rounded-lg bg-rose-50/70 dark:bg-rose-950/20 p-2.5"><b>나쁜 그림이 무거운 쪽(FICO·어도비·LVMH·레녹스):</b> 손실 가능성 25~30%. FICO는 독점 붕괴, LVMH는 명품 경기, 레녹스는 가격 결정력이 갈림길. 작게 담는 몫.</div>
        <div className="rounded-lg bg-teal-50/70 dark:bg-teal-950/20 p-2.5"><b>바닥이 단단한 싼 쪽(브로드리지·조에티스):</b> 나쁜 그림에서도 플러스, 배당 2.5% 안팎. 브로드리지는 규제 독점, 조에티스는 평소의 3분의 1 값이 받친다.</div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800/60 p-2.5"><b>질은 최상, 값은 보통(IDEXX·코파트):</b> 사업은 엄선 최상위권이지만 기대는 연 8% 안팎(IDEXX 8.5%, 코파트 7.7%). 더 빠지면 비중을 늘릴 후보.</div>
        <div className="rounded-lg bg-green-50/70 dark:bg-green-950/20 p-2.5"><b>AI 투자에 거는 쪽(엔비디아·브로드컴):</b> 지금 가장 강한 사업이지만 기대는 연 5% 안팎 — 이익이 정점일 수 있고 나쁜 그림 확률 30%에 손실이 크다(연 −7~−9%). 같은 고객·같은 돈에 걸려 있어 둘을 합쳐 비중을 본다. 빅테크와도 위험이 겹친다.</div>
        <div className="rounded-lg bg-yellow-50/70 dark:bg-yellow-950/20 p-2.5"><b>AI와 무관한 고성장(트랜스다임·메르카도리브레·텍사스 로드하우스):</b> 기대 연 9~12%. 비행기 부품·중남미 소비·스테이크 — AI 주식이 흔들릴 때 다른 이유로 움직인다. 트랜스다임은 빚, 메르카도리브레는 환율·신용이 결과 폭을 키운다.</div>
        <div className="rounded-lg bg-sky-50/70 dark:bg-sky-950/20 p-2.5"><b>질 좋은 성장, 값이 걸림돌(인튜이티브 서지컬·서비스나우):</b> 인튜이티브는 PER 49배라 연 7% 안팎, 서비스나우는 "AI가 사용자 수를 줄이나"라는 질문에 연 9% 안팎. 서비스나우는 인튜이트·어도비와 같은 위험 묶음.</div>
        <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 p-2.5"><b>매일 쓰는 물건(P&amp;G·코카콜라·콜게이트):</b> 기대 연 5.5~6.5%, 나쁜 그림에서도 플러스. 경기와 거의 무관해 하락장의 완충재지만 기대가 낮다. 셋은 같은 위험이라 하나면 충분.</div>
        <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/20 p-2.5"><b>싸서 기대가 높은 방어(펩시코·맥도날드):</b> 기대 연 9~10%로 방어주 중 가장 높고 나쁜 그림도 연 3~4%. 이익 성장이 아니라 싸진 값과 배당 3~4.4%가 만든다.</div>
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800/60 p-2.5"><b>사이클·값이 걸린 독점(CME·프로그레시브·리퍼블릭):</b> CME는 시장이 흔들릴 때 버는 반대 방향 종목(연 약 7.7%). 프로그레시브는 보험 사이클 꼭대기라 손실 가능성 25%, 리퍼블릭은 사업은 최상이지만 PER 32배라 연 6% 안팎.</div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">섞으면 — 비중을 바꿔 보기</p>
        <div className="flex flex-wrap gap-3">
          {COS.map(c => (
            <label key={c.key} className="flex items-center gap-1.5 text-xs">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.color}`} />{c.name}
              <input type="number" min={0} max={100} value={w[c.key]} onChange={e => setW({ ...w, [c.key]: Math.max(0, Number(e.target.value) || 0) })}
                className="w-14 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 py-0.5 text-right" />%
            </label>
          ))}
          <button onClick={() => setW(DEF)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">기본 비중</button>
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden">{COS.map(c => <div key={c.key} className={c.color} style={{ width: `${(w[c.key] ?? 0) / tot * 100}%` }} />)}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[['가능성 반영 기대', `연 약 ${mix(ev).toFixed(1)}%`], ['모두 좋은 그림', `연 약 ${mix(c => c.good.r).toFixed(1)}%`], ['모두 기본 그림', `연 약 ${mix(c => c.base.r).toFixed(1)}%`], ['모두 나쁜 그림(최악)', `연 약 ${mix(c => c.bad.r).toFixed(1)}%`]].map(([k, v]) => (
            <div key={k}><p className="text-[11px] text-gray-400">{k}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{v}</p></div>
          ))}
        </div>
        <p className={small}><b>왜 섞으면 좋은가:</b> 흔들리는 이유가 다르다 — 에르메스는 부자들의 소비, 마이크로소프트·구글·아마존·메타는 AI 투자 회수와 광고 경기, 애플은 값과 규제, 나이키는 브랜드 경쟁. 기본 비중(에르메스 25·마이크로소프트 20·구글 15·아마존 15·메타 10·나이키 10·애플 5%, 나머지 9종목은 0%에서 시작 — 직접 넣어 보면 된다)이면 모두 나쁜 그림이어도 손실이 크지 않다. 다만 빅테크 넷은 같은 AI 흐름을 타므로 서로 완전히 다르지 않다는 점을 기억할 것. 비중은 예시이고, 지수(S&amp;P 500 등)와 함께 담는 편이 더 안전하다.</p>
      </div>
      <p className="text-[11px] text-gray-400">세후 배당은 미국 배당 15%, 프랑스 배당 약 12.8~15% 원천징수를 뺀 대략값(개인 상황에 따라 다르다). 시나리오 수익률은 각 종목 리포트의 미래 이익 모델 값(본업 이익 기준). 가능성(%)은 판단이며 신호가 나오면 다시 매긴다.</p>
    </section>
  )
}
