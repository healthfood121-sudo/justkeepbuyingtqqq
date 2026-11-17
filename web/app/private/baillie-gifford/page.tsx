import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// 베일리 기퍼드(스코티시 모기지·LTGG) 심층 분석 — 누구인가, 성적, 철학, 종목별 매수·매도 기록, 실패, 버핏·멍거와 비교, 베낄 것.
// 숫자는 회사 발표·보도 기준(2026-11-17 정리). 확인하지 못한 것은 "약"·"보도"로 표시. 서버에서 로그인 확인 뒤에만 그린다.

type Row = { name: string; key?: string; buy: string; sell: string; why: string; out: string; result: string; tone?: 'win' | 'loss' | 'mid' }

const TRADES: Row[] = [
  { name: '아마존', key: 'AMZN', buy: '2003년(스코티시 모기지, 앤더슨) · 2004년(LTGG)', sell: '2020년 처음으로 "값 때문에" 일부 줄임 — 지금도 보유', why: '분기 실적보다 먼 미래에 투자하는 창업자(베조스 1997년 주주 서한). 이익이 23년 동안 연 약 41%씩 컸다(앤더슨 계산).', out: '시가총액 1.5조 달러가 되자 "앞으로 큰 수익을 내기가 더 어려워졌다"며 처음으로 비중을 줄였다.', result: '두 펀드의 최대 승자 중 하나. 2026년에도 스코티시 모기지 상위 보유.', tone: 'win' },
  { name: '테슬라', key: 'TSLA', buy: '2013년', sell: '2020년 40% 넘게 매도 → 2021년까지 약 80% 축소 → 2025년 1% 미만 → 2026년 4월 전량 매도', why: '배터리 성능이 해마다 15% 넘게 좋아지는 속도를 보고 "전기차가 언젠가 내연기관보다 좋고 싸지는 건 거의 필연"이라 판단. 오랫동안 테슬라의 유일한 대형 기관 주주였다.', out: '처음엔 한 종목 비중 한도(분산) 때문. 2025년엔 "근본 변화 없이 시가총액이 5천억 달러 늘었다", 마지막엔 "값이 미래 기회를 너무 많이 반영했다".', result: '약 4.7억 달러 투자 → 약 62억 달러 이익, 약 13배(보도). 13년 보유.', tone: 'win' },
  { name: '스페이스X (비상장 → 2026년 상장)', buy: '2018년 12월 첫 투자(기업가치 약 300억 달러), 2021년 8월까지 총 약 1.5억 파운드(약 2억 달러)', sell: '2026년 6월 12일 상장 후 매도 제한이 풀리는 대로 나눠 매도 — 비중 25%+ → 15%(9월) → 11.1%(11월 초)', why: '우주로 가는 길을 사실상 독점. 발사 비용 kg당 약 1.8만 달러 → 팰컨9 약 2,700달러 → 스타십 약 900달러. 스타링크가 연 매출 약 170억 달러, 1년에 약 70% 성장.', out: '확신이 줄어서가 아니라 한 종목이 펀드의 4분의 1이 되어서. 판 돈은 엔비디아·클라우드플레어·전력 회사 등으로.', result: '약 20배(상장 무렵 약 50억 달러). 1·3·5년 모두 최대 수익 기여 종목.', tone: 'win' },
  { name: '엔비디아', key: 'NVDA', buy: '2016년', sell: '2024년 일부 매도 → 2026년 다시 늘림', why: '2016년 실리콘밸리에서 엔비디아를 이기려는 AI 칩 신생 회사들을 만나며 엔비디아의 우위를 확인.', out: '2024년: 세계 1위 시가총액이 되자 "여기서 몇 배를 더 버는 시나리오가 어려워졌다", AI가 학습에서 추론 단계로 가면 경쟁이 늘 것. 2026년: "AI의 오래가는 승자는 앱이 아니라 칩 같은 병목"이라며 다시 추가.', result: '2016~2024년 약 86배(총수익 8,591%).', tone: 'win' },
  { name: '에르메스', key: 'RMS', buy: '2004년(LTGG)', sell: '보유 중 — 2026년 3분기 비중 약 1.66%(검색 요약)', why: '"브랜드의 역사와 수명은 흉내 낼 수는 있어도 복제할 수 없다 — 가장 좋은 경쟁 우위 중 하나이니 높게 평가해야 한다"(마크 어쿼트).', out: '—', result: '보유 기간 40배 넘음. 빠른 성장주가 아니라 "꾸준히 불어나는" 종목으로 분류.', tone: 'win' },
  { name: '텐센트', buy: '약 2008년(스코티시 모기지)', sell: '2023년 전량 매도(15년 보유)', why: '중국 인터넷 플랫폼의 대표 — 아마존과 함께 10년 넘게 수익을 낸 "소수의 큰 승자".', out: '"약한 내수, 불확실한 규제, 지정학 위험 때문에 중국 종목을 넣는 기준이 더 엄격해졌다. 텐센트는 앞으로 그 기준을 넘기 어렵다."', result: '오래 큰 승자였지만 마지막 몇 년은 규제로 부진.', tone: 'mid' },
  { name: '알리바바', buy: '2012년 상장 전 투자', sell: '2023~2024년 무렵 전량 매도(보도)', why: '중국 전자상거래의 지배자.', out: '중국 규제·지정학 위험, 집중된 포트폴리오에 자리가 없음. "다시 기회가 오면 기꺼이 — 절대 안 산다는 건 아니다."', result: '2020년 말 이후 중국 규제로 큰 손실(보도).', tone: 'loss' },
  { name: '일루미나', buy: '오래 보유(2022년 3월 비중 6.4%, 상위권)', sell: '2023년 전량 매도', why: '유전자 분석 장비의 독점적 지위.', out: '"실행이 더 좋았어야 했다. 수요를 키우고 비용을 낮추는 일이 한동안 어려울 것."', result: '최대 보유급에서 손실로 정리.', tone: 'loss' },
  { name: '모더나', buy: '상장 전부터 보유(보도), 코로나 때 최대 보유 종목', sell: '2021~2022년 급락 때 오히려 추가 매수', why: 'mRNA라는 새 플랫폼. 앤더슨은 모더나 의장의 "비합리적인 사람들을 받아들여야 놀라운 발견이 나온다"는 말을 마지막 편지에 인용.', out: '2024년 "코로나 백신 매출 감소, RSV 백신 고전 — 실망스럽다. 경영진과 실행 개선을 논의 중."', result: '2021년 9월~2022년 4월 약 −63%, 2024년 4월~2025년 3월 약 −74%. 큰 손실(보도).', tone: 'loss' },
  { name: '노스볼트 (비상장)', buy: '2020년(유럽 배터리)', sell: '2024년 파산', why: '유럽이 중국에 기대지 않는 배터리가 필요하고, 스웨덴 수력 전기로 탄소가 적다. 폭스바겐 등에서 400억 달러 주문.', out: '생산 확대 실행 실패, 서방 전기차 수요 둔화, 유럽 완성차의 부진.', result: '사실상 전액 손실. 2025년엔 전환사채 이자까지 손실 처리.', tone: 'loss' },
  { name: '페이스북(메타)', key: 'META', buy: '2010년대 초 보유', sell: '2020년 전량 매도 → 2024년 다시 비중 늘림', why: '2024년 재매수: "AI가 메타의 제품을 좋게 만들고, 사업이 컴퓨팅 비용을 감당할 돈을 벌어 준다."', out: '2020년엔 "거대 서구 플랫폼에서 더 크게 클 수 있는 디지털 회사로" 옮겨 가며 매도.', result: '팔았던 종목도 이유가 바뀌면 다시 산다는 사례.', tone: 'mid' },
  { name: '스포티파이', buy: '2015년(상장 전)', sell: '보유', why: '상장 전부터 알고 지내 더 큰 비중·더 강한 확신으로 들고 갈 수 있었다(번스).', out: '—', result: '스코티시 모기지 수익 상위 10개 중 하나(비상장으로 산 3개 중 하나: 스페이스X·와이즈·스포티파이).', tone: 'win' },
  { name: '넷플릭스', key: 'NFLX', buy: '오래 보유(시작 시점 미확인)', sell: '2026년 축소 → 스코티시 모기지는 전량 매도', why: '구독 스트리밍의 선두.', out: '"워너브러더스 인수 시도는 자체 성장이 어려워지고 비싸진다는 신호" — 성장이 성숙하고 확신이 줄었다.', result: '이익 성장 전망이 나빠지면 판다는 사례.', tone: 'mid' },
  { name: '포르쉐 · 버버리 · 케링', buy: '2004 · 2012 · 2008년(LTGG)', sell: '2013 · 2016 · 2024년 8월', why: '자동차보다 명품 브랜드로 봄 / 명품으로 올라서는 중 / 잡화 그룹에서 순수 명품 강자로 변신.', out: '핵심 자산이 폭스바겐 지분이 됨 / 경기에 너무 흔들리고 경영이 단기적 / 매출 절반이 구찌에 쏠리고 명품보다 유행 쪽으로, 핵심 CEO 은퇴 예정.', result: '"회사를 가질 이유는 바뀔 수 있다 — 브랜드가 여전히 존경받더라도."', tone: 'mid' },
  { name: '아틀라스콥코(스웨덴 산업 장비)', buy: '1980년대 후반 무렵', sell: '2014년 기준 25년 넘게 보유', why: '성장주가 꼭 기술주일 필요는 없다는 예 — "큰 승자는 에르메스·아틀라스콥코·텐센트처럼 다양하다".', out: '—', result: '오래 들고 간 산업주의 대표.', tone: 'win' },
]

const PHIL: { t: string; d: string; q?: string }[] = [
  { t: '1. 수익은 극소수의 큰 승자가 만든다', d: '헨드릭 베셈바인더 교수의 연구가 출발점. 1990년 이후 세계 증시의 초과 수익은 상장사의 1.3%에서 나왔고, 미국 100년 동안 늘어난 주주 재산의 절반은 46개 회사(0.16%)가 만들었다. 그래서 "평균적으로 괜찮은 회사"가 아니라 "극단적으로 커질 수 있는 회사"를 찾는 데 시간을 쓴다.', q: '"주식 수익은 종 모양이 아니라 한쪽으로 크게 쏠려 있다. 소수가 대부분의 부를 만들고, 다수는 별 일이 없고, 꽤 많은 회사는 돈을 잃게 만든다." — LTGG 2026년 1분기 편지' },
  { t: '2. 그 승자에게는 비싼 값도 치른다', d: '"성장에 터무니없는 값을 치른다(growth at an unreasonable price)"는 자기 표현. 잘된 회사는 지나고 보면 그 값이 아주 쌌던 것이고, 안 된 회사에선 돈을 잃는다 — 그 손실보다 승자의 수익이 훨씬 크다는 계산.', q: '"우리는 지금 이익의 높은 배수를 기꺼이 치러야 한다. 미래 수익의 크기가 너무 극적일 수 있기 때문이다. 번창하는 종목에서 그 값은 아주 낮았던 것으로 드러나고, 나머지에선 돈을 잃는다." — 제임스 앤더슨' },
  { t: '3. 10년을 본다 — "5년 뒤 이 회사는 어떤 모습일까"부터', d: '필립 피셔(버핏의 스승 중 한 명)의 영향. 연구를 "5년 뒤 회사의 모습"에서 시작하고, 보통 한 종목을 10년 들고 간다. 2004년 LTGG를 시작할 때 자기들의 투자 기간이 시장 평균의 약 10배였고, 지금은 100배일 수 있다고 본다(2003년엔 거래의 80%가 장기 투자자, 지금은 7%).' },
  { t: '4. 큰 하락은 정상이다', d: '"주가 하락은 정기적이고 심하다. 40%는 흔하다." LTGG의 수익 상위 5개 종목은 보유 기간에 30% 넘는 하락을 합쳐서 25번 겪었다. 2004년 이후 펀드 전체가 10% 넘게 빠진 적이 8번(약 3년에 한 번) — 그 뒤 5년 평균 수익은 200%가 넘었다.', q: '"왼쪽 아래에서 오른쪽 위로 쭉 올라가는 주가 그래프는, 나중에 보이는 것처럼 매끄럽고 쉬웠던 적이 없다." — 앤더슨' },
  { t: '5. "분기 자본주의"에서 자유로운 회사', d: '주당 이익을 분기마다 짜내기보다 먼 미래에 투자하는 창업자·회사를 선호(베조스의 1997년 주주 서한을 지금도 인용). 창업자·가문이 이끄는 회사(아마존·테슬라·에르메스·스페이스X)가 많은 이유.' },
  { t: '6. 큰 승자는 끝까지 달리게 둔다', d: '"우리는 큰 비중을 위험과 같은 것으로 보지 않는다. 큰 승자를 끝까지 달리게 해 그 수익을 다 잡는 게 우리 일이다"(톰 슬레이터, 2026년). 다만 한 종목이 너무 커지면(테슬라 10%+, 스페이스X 25%) 나눠서 줄인다.' },
  { t: '7. 비상장일 때 먼저 알아 둔다', d: '스코티시 모기지는 자산의 최대 30%를 비상장 회사에 넣을 수 있다(2026년 7월 기준 52개 회사, 23%). "상장 직전 투자설명회는 회사를 처음 만나기에 나쁜 자리다 — 약점은 말하지 않는다." 상장 전부터 알면 더 큰 비중과 확신으로 들고 갈 수 있고(스포티파이·메이퇀), 비상장 회사를 봐야 세상이 어떻게 바뀌는지 퍼즐이 맞춰진다.' },
  { t: '8. 변화의 속도를 이해하는 게 핵심', d: '"핵심은 성장 대 가치도, 시장 수준도, 경제 성장률도 아니라 변화를 이해하는 것 — 어떻게, 얼마나 일어나고 무슨 뜻인지." 테슬라 투자는 "매년 15% 넘게 좋아지는 기술이 2~3%씩 좋아지는 기술(내연기관)을 만나면 일어나는 일"이었다. 증권사·언론 대신 그 분야 전문가의 말을 듣는다.' },
  { t: '9. 큰 승자들의 네 가지 공통점(베셈바인더 연구 정리)', d: '① 현금을 많이 쌓는다 ② 인수가 아닌 자체 성장이 빠르다 ③ 직전 10년에 큰 하락을 겪은 적이 있다 ④ 연구개발 지출이 많다. (베일리 기퍼드 "Lessons from Bessembinder" 요약, 팟캐스트 인용)' },
  { t: '10. 2023년 이후 더한 것 — 회복력', d: '코로나·공급망·전쟁·미중 냉전 이후 "회사가 더 단단해야 포트폴리오에 남을 수 있다". 높은 이익률·튼튼한 재무 같은 숫자와, 다양한 사람이 섞인 조직 문화를 함께 본다. 그래서 중국 종목 기준을 높였고 텐센트·알리바바를 팔았다.' },
  { t: '11. 판단 기준은 결국 이익 성장', d: '"장기 주식 수익을 가장 꾸준히 결정하는 건 이익 성장이다." 포트폴리오를 볼 때 지수와의 차이가 아니라 "우리 회사들이 이익 성장 분포의 어디에 있나"를 본다 — 2026년 초 포트폴리오의 약 70%가 이익 성장 전망 상위 20% 안. 이익 전망이 나빠지면(넷플릭스) 줄이고 더 좋은 곳(삼사라)으로 옮긴다.' },
]

const RECORD: [string, string, string][] = [
  ['스코티시 모기지 — 앤더슨 재임(2000~2021년 5월)', '+1,586%', '같은 기간 세계 지수(FTSE All-World) +349%'],
  ['스코티시 모기지 — 2004~2014년 10년', '연 13.1%', '세계 지수 연 9.3% (월스트리트저널, 2014년)'],
  ['스코티시 모기지 — 2020년 3~9월(코로나)', '순자산 +76%', '지수 +24%'],
  ['스코티시 모기지 — 2021년 11월 고점 → 2022~2023년 바닥', '약 −50~60%', '주가 1,568.5펜스 → 약 616펜스(2023년 4월)'],
  ['스코티시 모기지 — 2025년 4월~2026년 3월', '순자산 +27.4%', '지수 +18% (스페이스X 상승이 큰 몫)'],
  ['스코티시 모기지 — 10년(~2026년 3월)', '순자산 +435%', '지수 +234%'],
  ['LTGG — 2004년 시작 ~ 2025년 말', '연 12.7%', '세계 지수(MSCI ACWI) 연 9.2% (달러, 보수 전)'],
  ['LTGG — 최근 5년(~2025년 말)', '연 2.8%', '지수 연 11.7% — 두 번의 큰 하락이 겹침'],
  ['LTGG — 최근 10년(~2025년 말)', '연 16.7%', '지수 연 12.3%'],
  ['LTGG — 5년 단위로 잘라 보면', '90% 넘는 구간에서 지수를 이김', '10년 단위로는 100% 이김'],
]

const COPY: { t: string; d: string }[] = [
  { t: '10년 시계로 산다', d: '사기 전에 "5년 뒤, 10년 뒤 이 회사는 어떤 모습일까"를 먼저 적어 본다. 다음 분기 실적은 그 그림이 맞는지 확인하는 재료일 뿐이다.' },
  { t: '하락을 미리 각오한다', d: '최고의 종목도 30~40% 하락을 여러 번 겪는다. 하락 자체는 팔 이유가 아니다 — 그들도 모더나·메이퇀이 빠질 때 더 샀다. 대신 "무엇이 바뀌면 판다"를 미리 적어 둔다.' },
  { t: '파는 이유는 "값"보다 "사업의 이유가 바뀔 때"', d: '포르쉐·버버리·케링·텐센트·일루미나·넷플릭스를 판 이유는 모두 사업의 변화(성장 둔화, 유행화, 경영 단기화, 규제)였다. 예외: 값이 미래를 거의 다 반영했을 때(테슬라 2025년, 엔비디아 2024년) — "여기서 몇 배를 더 벌 수 있나?"에 답이 안 나오면 줄인다.' },
  { t: '큰 승자는 성급히 팔지 않는다', d: '10배 오른 종목을 "많이 올랐으니" 파는 게 개인 투자자의 가장 흔한 실수. 그들은 비중 한도를 넘을 때만 나눠서 줄였다. 개인도 "한 종목 최대 비중"을 정해 두고 그 선만 지킨다.' },
  { t: '이익 성장 숫자로 확인한다', d: '이야기가 아니라 이익(또는 매출) 성장률이 계속 높은지 본다. 이 사이트의 이익 시계·연도별 숫자로 확인할 수 있다.' },
  { t: '다양한 곳에서 승자를 찾는다', d: '큰 승자는 기술주만이 아니다 — 에르메스(명품), 아틀라스콥코(산업), 텐센트(중국 인터넷). 이미 모두가 보는 곳보다 다음 10년을 이끌 곳을 찾는다.' },
  { t: '팔았던 종목도 다시 볼 수 있다', d: '메타를 2020년에 팔고 2024년에 다시 늘렸다. 한 번 판 결정에 묶이지 않는다.' },
]

const DONT: { t: string; d: string }[] = [
  { t: '비싼 성장주 몰빵 + 금리 상승 = 반토막', d: '2021~2023년 스코티시 모기지는 고점에서 약 50~60% 빠졌다. 이익이 아니라 미래 기대에 값을 치른 종목은 금리가 오르면 가장 크게 빠진다. 개인은 생활비·대출이 있어 이 하락을 펀드처럼 버티기 어렵다.' },
  { t: '그들의 무기 중 개인이 못 쓰는 것', d: '비상장 회사(스페이스X·스트라이프·바이트댄스·앤트로픽)를 일찍 살 수 없다. 펀드는 "닫힌 구조(투자신탁)"라 하락장에서 환매 압박 없이 버틸 수 있지만, 개인 계좌는 심리적으로 그렇지 않다.' },
  { t: '실패도 크다', d: '노스볼트(파산), 모더나(−60~70%대 두 번), 알리바바·텐센트(중국 규제), 일루미나. 소수 승자가 이 손실을 덮어야 하는 구조라, 종목 수가 적은 개인이 따라 하면 승자 없이 손실만 남을 수 있다.' },
  { t: '5년 넘게 지수에 질 수 있다', d: 'LTGG는 2021~2025년 5년 동안 연 2.8%로 지수(연 11.7%)에 크게 졌다. 이 기간을 견딜 수 없다면 이 방식은 맞지 않는다.' },
]

const COMPARE: [string, string, string, string][] = [
  ['기본 생각', '좋은 회사를 싸게(안전마진)', '극소수의 큰 승자를 일찍 찾아 끝까지', '같은 회사도 값이 맞을 때만 vs 값보다 성장의 크기'],
  ['값', 'PER 10~20배에 산 경우가 많음', '지금 이익의 수십~수백 배도 치름', '멍거: "에르메스는 싸면 산다" vs 베일리 기퍼드: 2004년 비싼 에르메스를 사서 40배'],
  ['보유 기간', '"영원히"', '10년 이상(평균 약 10년, 25년도)', '둘 다 매우 길다'],
  ['종목 수', '집중(상위 몇 개가 대부분)', '집중(30~100개, 상위 10개가 약 절반)', '둘 다 집중'],
  ['기술주', '오랫동안 피함(애플은 소비재로 보고 삼)', '핵심 무대(아마존·테슬라·엔비디아)', '앤더슨은 "버핏의 지나친 영향력" 때문에 많은 투자자가 성장주를 놓쳤다고 비판'],
  ['하락 대처', '현금을 쌓아 두었다가 폭락 때 산다', '하락은 정상, 확신 종목은 더 산다', '버핏은 현금 여력, 베일리 기퍼드는 버티는 체력'],
  ['약점', '큰 성장주를 놓침(아마존·구글을 늦게/못 삼)', '금리 상승기에 반토막, 큰 실패도 많음', '서로의 약점이 서로의 강점'],
]

export default async function BaillieGiffordPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')

  const box = 'rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 scroll-mt-20'
  const h2 = 'text-base font-bold text-gray-900 dark:text-white'
  const p = 'text-sm leading-relaxed text-gray-700 dark:text-gray-200'
  const th = 'text-left py-1.5 px-2 font-medium text-gray-400 dark:text-gray-500 break-keep'
  const td = 'py-1.5 px-2 align-top text-gray-700 dark:text-gray-200'
  const toc: [string, string][] = [['who', '누구인가'], ['record', '성적표'], ['phil', '투자 철학 11가지'], ['trades', '종목별 매수·매도 기록'], ['fail', '실패와 위기'], ['vs', '버핏·멍거와 비교'], ['copy', '베낄 것 / 베끼면 안 되는 것'], ['check', '내 종목 점검표'], ['src', '출처']]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-gray-400">투자 대가 연구 · 2026년 11월 17일 정리</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">베일리 기퍼드 — 극소수의 큰 승자를 일찍 찾아 끝까지 들고 가는 사람들</h1>
          <p className={p}>
            아마존(2003년)·테슬라(2013년)·엔비디아(2016년)·스페이스X(2018년)·에르메스(2004년)를 일찍 사서 10년 넘게 들고 간 스코틀랜드의 운용사.
            &ldquo;좋은 회사를 싸게&rdquo;의 버핏·멍거와 정반대로 <b>&ldquo;극단적으로 커질 회사라면 비싸도 산다&rdquo;</b>는 방식으로 20년 동안 지수를 이겼고, 그 대가로 2021~2023년엔 반토막도 겪었다.
          </p>
        </div>

        <nav className="flex flex-wrap gap-1.5">
          {toc.map(([id, t]) => <a key={id} href={`#${id}`} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">{t}</a>)}
        </nav>

        <section className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-2">
          <h2 className={h2}>한 줄 요약</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>무엇을 사나:</b> 10년 뒤 지금보다 몇 배 커질 수 있는, 창업자·가문이 먼 미래를 보고 이끄는 회사.</li>
            <li><b>값:</b> 상관을 덜 한다. 승자 한두 개가 나머지 실패를 다 덮는다는 계산(베셈바인더 연구).</li>
            <li><b>언제 파나:</b> 사업의 이유가 바뀔 때(규제·성장 둔화·유행화·경영 단기화), 또는 값이 미래를 거의 다 반영해 &ldquo;여기서 몇 배&rdquo;가 안 보일 때, 한 종목이 너무 커질 때.</li>
            <li><b>대가:</b> 금리가 오르면 크게 빠진다(2021~2023년 약 −50~60%). 5년 동안 지수에 지기도 한다.</li>
          </ul>
        </section>

        <section id="who" className={box}>
          <h2 className={h2}>1. 누구인가</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>베일리 기퍼드(Baillie Gifford):</b> 1908년 스코틀랜드 에든버러에서 시작. 상장하지 않은 동업자(파트너) 회사라 바깥 주주의 분기 실적 압박이 없다 — 그들은 이 구조를 &ldquo;장기 투자의 구조적 우위&rdquo;로 꼽는다. 운용 자산 약 2,210억 파운드(2024년).</li>
            <li><b>스코티시 모기지(Scottish Mortgage):</b> 1909년 고무 농장에 돈을 빌려주려고 만든 회사에서 시작한 투자신탁. 런던 증시 상장(FTSE 100), 자산 약 160억 파운드. 펀드 자체가 주식으로 거래되는 &ldquo;닫힌 구조&rdquo;라 하락장에도 환매 때문에 팔 필요가 없고, 자산의 최대 30%를 비상장 회사에 넣을 수 있다.</li>
            <li><b>LTGG(Long Term Global Growth):</b> 2004년 시작한 장기 세계 성장주 전략. 30~40개 종목만 담는다. 에르메스를 2004년부터 들고 있는 팀.</li>
            <li><b>제임스 앤더슨(James Anderson):</b> 2000~2022년 4월 스코티시 모기지 운용. 아마존·테슬라·텐센트·알리바바 투자를 이끈 사람. 영국에서 장기 투자를 촉구하는 &ldquo;투자자 포럼&rdquo; 설립에도 참여. 은퇴하며 &ldquo;기존 자산운용업은 돌이킬 수 없이 망가졌다&rdquo;는 마지막 편지를 남겼다.</li>
            <li><b>톰 슬레이터(Tom Slater) · 로런스 번스(Lawrence Burns):</b> 지금의 스코티시 모기지 운용역(2022년~). 번스는 2016년 실리콘밸리 출장에서 엔비디아의 우위를 확인한 사람.</li>
            <li><b>마크 어쿼트(Mark Urquhart):</b> LTGG를 함께 세우고 이끄는 사람. 2004년 &ldquo;비싸 보이던&rdquo; 에르메스 매수를 밀어붙였다.</li>
          </ul>
        </section>

        <section id="record" className={box}>
          <h2 className={h2}>2. 성적표 — 길게 보면 이겼고, 짧게 보면 크게 흔들렸다</h2>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800"><th className={th}>기간</th><th className={th}>성적</th><th className={th}>비교</th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {RECORD.map(r => <tr key={r[0]}><td className={`${td} break-keep`}>{r[0]}</td><td className={`${td} font-semibold whitespace-nowrap`}>{r[1]}</td><td className={td}>{r[2]}</td></tr>)}
            </tbody>
          </table></div>
          <p className={p}>
            <b>읽는 법:</b> 10년 이상으로 보면 거의 늘 지수를 이겼다. 하지만 2004년 이후 펀드 전체가 10% 넘게 빠진 게 8번(약 3년에 한 번)이고, 2021~2023년엔 반토막이 났다.
            그들은 &ldquo;큰 하락 뒤 5년 평균 수익은 200%가 넘었다 — 타이밍보다 머무는 시간&rdquo;이라고 말한다. 다만 이건 하락 뒤에도 같은 방식을 버리지 않았기 때문에 가능했다.
          </p>
        </section>

        <section id="phil" className={box}>
          <h2 className={h2}>3. 투자 철학 11가지</h2>
          <div className="space-y-3">
            {PHIL.map(x => (
              <div key={x.t} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{x.t}</p>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{x.d}</p>
                {x.q && <p className="text-xs italic text-gray-500 dark:text-gray-400 border-l-4 border-emerald-300 dark:border-emerald-700 pl-2">{x.q}</p>}
              </div>
            ))}
          </div>
        </section>

        <section id="trades" className={box}>
          <h2 className={h2}>4. 종목별 매수·매도 기록 — 왜 샀고, 왜 팔았나</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">초록 = 큰 성공, 빨강 = 손실, 회색 = 중간·교훈. 스코티시 모기지와 LTGG 기록을 섞었다. 날짜·배수는 회사 발표와 보도 기준이며 일부는 대략.</p>
          <div className="space-y-2">
            {TRADES.map(r => (
              <div key={r.name} className={`rounded-lg border p-3 space-y-1 ${r.tone === 'win' ? 'border-emerald-200 dark:border-emerald-900/60' : r.tone === 'loss' ? 'border-red-200 dark:border-red-900/60' : 'border-gray-200 dark:border-gray-800'}`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{r.name}</p>
                  {r.key && <Link href={`/private/sp500?s=${r.key}`} className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">사이트 분석 →</Link>}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
                  <p><span className="text-gray-400">산 때</span> {r.buy}</p>
                  <p><span className="text-gray-400">판·줄인 때</span> {r.sell}</p>
                  <p><span className="text-gray-400">산 이유</span> {r.why}</p>
                  <p><span className="text-gray-400">판 이유</span> {r.out}</p>
                </div>
                <p className={`text-xs font-semibold ${r.tone === 'win' ? 'text-emerald-700 dark:text-emerald-400' : r.tone === 'loss' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>결과: {r.result}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">매도 패턴 정리</p>
            <ul className="list-disc pl-5 text-xs leading-relaxed text-gray-700 dark:text-gray-200 space-y-0.5">
              <li><b>사업의 이유가 바뀜:</b> 포르쉐·버버리·케링·텐센트·알리바바·일루미나·넷플릭스 — 가장 많은 매도 이유.</li>
              <li><b>값이 미래를 다 반영:</b> 테슬라(2025~2026년), 엔비디아(2024년, 나중에 다시 추가), 아마존(2020년 일부).</li>
              <li><b>한 종목이 너무 커짐:</b> 테슬라(2020년), 스페이스X(2026년) — 확신과 무관한 비중 관리.</li>
              <li><b>하락만으로는 팔지 않음:</b> 모더나·메이퇀이 급락할 때 오히려 추가. (모더나는 결과적으로 큰 손실 — 이 원칙의 대가)</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">2026년 새로 산 것: 클라우드플레어·누뱅크·비스트라·EQT(AI 전력), 엔비디아 추가(&ldquo;AI의 오래가는 승자는 칩 같은 병목&rdquo;), LTGG는 삼사라·메이크마이트립(인도 여행)·앱러빈·레딧 추가.</p>
        </section>

        <section id="fail" className={box}>
          <h2 className={h2}>5. 실패와 위기 — 같은 방식의 어두운 면</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>2021~2023년 반토막:</b> 스코티시 모기지 주가가 2021년 11월 1,568.5펜스에서 2023년 4월 약 616펜스로(약 −60%). 금리가 급히 오르자 먼 미래 이익에 값을 치른 성장주가 가장 크게 빠졌다. 펀드 주가가 순자산보다 약 20% 싸게 거래될 만큼 투자자가 떠났다.</li>
            <li><b>중국:</b> 텐센트·알리바바·메이퇀 등 비중이 컸는데 2020년 말부터 규제와 미중 갈등으로 크게 빠졌다. 2022년 스스로 &ldquo;중국은 실수&rdquo;라고 인정했다는 보도. 2023년 텐센트를 15년 만에 팔았다.</li>
            <li><b>노스볼트 파산(2024년):</b> 유럽 배터리의 희망이던 비상장 투자가 사실상 0이 됐다.</li>
            <li><b>모더나:</b> 코로나 때 최대 종목이었다가 두 번의 큰 하락(약 −63%, 약 −74%). 하락 때 더 산 원칙이 이번엔 손실을 키웠다.</li>
            <li><b>앤더슨의 말:</b> 2020년 &ldquo;지난 15년 수많은 실수를 했지만 가장 큰 실수는 충분히 낙관적이지 않았던 것일지도&rdquo; → 그 직후 2021~2022년 폭락. 은퇴 편지에선 &ldquo;나의 가장 큰 잘못은 충분히 급진적이지 않았던 것&rdquo;이라고 썼다.</li>
            <li><b>회복:</b> 2024년부터 자사주를 16억 파운드 넘게 사 할인을 줄였고, 스페이스X 상승으로 2026년 3월까지 1년 +27%. 2026년 5월 주가는 2021년 고점 부근(약 15.25파운드)으로 돌아왔다.</li>
          </ul>
        </section>

        <section id="vs" className={box}>
          <h2 className={h2}>6. 버핏·멍거와 비교</h2>
          <div className="overflow-x-auto"><table className="w-full text-xs">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800"><th className={th}></th><th className={th}>버핏·멍거</th><th className={th}>베일리 기퍼드</th><th className={th}>한마디</th></tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {COMPARE.map(r => <tr key={r[0]}><td className={`${td} font-medium break-keep`}>{r[0]}</td><td className={td}>{r[1]}</td><td className={td}>{r[2]}</td><td className={`${td} text-gray-500 dark:text-gray-400`}>{r[3]}</td></tr>)}
            </tbody>
          </table></div>
          <p className={p}>
            <b>둘은 생각보다 가깝다:</b> 둘 다 집중하고, 아주 오래 들고, 경영진을 중시하고, 단기 시장 소음을 무시한다. 갈리는 지점은 단 하나 — <b>값을 얼마나 따지느냐</b>.
            멍거도 말년엔 &ldquo;훌륭한 브랜드 회사는 정말 쌀 때가 드물다&rdquo;고 했고(<Link href="/private/buffett/munger-2023" className="text-blue-600 dark:text-blue-400 hover:underline">멍거 2023년 인터뷰</Link>), 베일리 기퍼드도 2024~2026년엔 &ldquo;여기서 몇 배가 안 보이면&rdquo; 테슬라·엔비디아를 줄였다.
          </p>
        </section>

        <section id="copy" className={box}>
          <h2 className={h2}>7. 개인 투자자가 베낄 것 / 베끼면 안 되는 것</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 p-3 space-y-2">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">베낄 것</p>
              {COPY.map(x => <div key={x.t}><p className="text-sm font-semibold text-gray-900 dark:text-white">{x.t}</p><p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">{x.d}</p></div>)}
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 p-3 space-y-2">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">베끼면 안 되는 것</p>
              {DONT.map(x => <div key={x.t}><p className="text-sm font-semibold text-gray-900 dark:text-white">{x.t}</p><p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">{x.d}</p></div>)}
            </div>
          </div>
        </section>

        <section id="check" className={box}>
          <h2 className={h2}>8. 내 종목 점검표 — 베일리 기퍼드식 질문 (이 사이트 정리)</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">베일리 기퍼드가 공개한 글·인터뷰에서 반복되는 질문을 개인용으로 옮긴 것이다(그들의 공식 양식이 아니다).</p>
          <ol className="list-decimal pl-5 space-y-1 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            <li>10년 뒤 이 회사가 지금보다 <b>몇 배</b> 커질 수 있나? 그 그림을 한 문단으로 쓸 수 있나?</li>
            <li>그 성장이 <b>남이 따라 하기 어려운 이유</b>(브랜드·기술·네트워크·규모)는 무엇인가?</li>
            <li>경영진이 <b>분기 실적보다 10년</b>을 보나? 창업자·가문이 이끄나?</li>
            <li>이익(매출) 성장률이 실제로 <b>상위권</b>인가? 숫자로 확인했나?</li>
            <li>이 회사가 <b>30~40% 빠져도</b> 들고 있을 수 있나? 그때 살 돈이 있나?</li>
            <li>무엇이 바뀌면 파나? (규제·성장 둔화·유행화·경영 단기화를 <b>미리 적어 두기</b>)</li>
            <li>지금 값에서 <b>몇 배를 더 벌 시나리오</b>가 남아 있나? (없다면 테슬라 2025년처럼 줄일 때)</li>
            <li>이 종목이 내 계좌에서 너무 커지지 않았나? <b>한 종목 최대 비중</b>을 정했나?</li>
          </ol>
        </section>

        <section className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">에르메스와의 관계</p>
          <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            LTGG가 2004년 &ldquo;증권사 대부분이 눈이 튀어나올 만큼 비싸다&rdquo;던 에르메스를 사서 40배 넘게 벌었다. 2024년 PER 50배에도 &ldquo;시장 점유율이 10%까지 갈 수 있다&rdquo;며 들고 있었고, 2026년 3분기에도 보유(비중 약 1.66%).
            멍거·테리 스미스는 같은 회사를 &ldquo;값이 안 맞는다&rdquo;며 사지 않았다. → <Link href="/private/sp500?s=RMS" className="text-blue-600 dark:text-blue-400 hover:underline">에르메스 분석의 &ldquo;투자 대가들은 어떻게 봤나&rdquo;</Link>
          </p>
        </section>

        <section id="src" className={box}>
          <h2 className={h2}>출처</h2>
          <ul className="list-disc pl-5 space-y-0.5 text-xs text-gray-600 dark:text-gray-300 break-all">
            {[
              ['Trustnet — 앤더슨 마지막 편지 "투자 관리는 망가졌다"(2021)', 'https://www.trustnet.com/news/13259133/scottish-mortgages-anderson-investment-management-is-irretrievably-broken'],
              ['Jason Zweig — Stock Picking for the Long, Long, Long Haul(WSJ, 2014)', 'https://jasonzweig.com/stock-picking-for-the-long-long-long-haul/'],
              ['MoneyWeek — 앤더슨 "높은 배수를 치러야 한다"', 'https://moneyweek.com/investments/stocks-and-shares/tech-stocks/601978/james-anderson-investors-must-pay-high-multiples'],
              ['interactive investor — 페이스북 매도, 아마존·테슬라 축소(2020)', 'https://www.ii.co.uk/analysis-commentary/scottish-mortgage-sells-facebook-and-trims-amazon-and-tesla-ii514077'],
              ['interactive investor — 번스 인터뷰: 비상장·스페이스X·노스볼트(2024)', 'https://ii.co.uk/analysis-commentary/scottish-mortgage-elon-musk-private-firms-and-cutting-nvidia-ii533709'],
              ['Trustnet — 텐센트 매도, 회복력 강조(2024)', 'https://www.trustnet.com/news/13414897/scottish-mortgage-sells-tencent-warns-companies-need-to-be-more-resilient'],
              ['Scottish Financial Review — 엔비디아 이익 실현, 8,591%(2024)', 'https://scottishfinancialreview.com/2024/11/08/scot-mortgage-takes-nvidia-profit-amid-8591-return'],
              ['AIC — 테슬라 대폭 축소 이유(2025)', 'https://www.theaic.co.uk/aic/news/industry-news/why-scottish-mortgage-slashed-its-tesla-stake'],
              ['Scottish Financial Review — 2026년 3월 결산 +27%', 'https://scottishfinancialreview.com/2026/05/27/scottish-mortgage-returns-27-boosted-by-spacex/'],
              ['finews — 스페이스X 집중 문제(2026)', 'https://www.finews.com/news/english-news/73275-spacex-baillie-gifford-scottish-mortgage-concentration-risk'],
              ['Trustnet — 스페이스X 매도 자금으로 무엇을 사나(2026)', 'https://www.trustnet.com/news/13484692/what-scottish-mortgage-is-buying-with-its-spacex-profits'],
              ['Crypto Briefing — 테슬라 13년 만에 전량 매도(2026)', 'https://cryptobriefing.com/scottish-mortgage-cuts-spacex-exits-tesla/'],
              ['베일리 기퍼드 — LTGG 2026년 1분기 편지 "Different by design"', 'https://www.bailliegifford.com/en/uk/intermediaries/insights/ic-article/2026-q1-quarterly-letters-ltgg-different-by-design-10061937/'],
              ['베일리 기퍼드 — Enduring Icons(명품·에르메스)', 'https://transformations.bailliegifford.com/stories/enduring-icons'],
              ['베일리 기퍼드 — From handbags to outliers(2024년 3분기)', 'https://www.bailliegifford.com/en/ireland/professional-investor/insights/ic-article/2024-q3-reflections-from-handbags-to-outliers-10049607/'],
              ['베일리 기퍼드 — Lessons from Bessembinder(PDF)', 'https://media.bailliegifford.com/mws/affgqguh/20250512121028_lessons-from-bessembinder-pdf.pdf'],
              ['Wikipedia — Scottish Mortgage Investment Trust', 'https://en.wikipedia.org/wiki/Scottish_Mortgage_Investment_Trust'],
              ['The Motley Fool UK — 2021년 고점 대비 하락(2022·2023)', 'https://fool.co.uk/2023/04/28/the-scottish-mortgage-share-price-crashes-to-a-52-week-low-time-to-buy'],
            ].map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{t}</a></li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
