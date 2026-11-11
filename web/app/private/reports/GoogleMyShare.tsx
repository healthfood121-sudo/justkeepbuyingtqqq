'use client'

import { useState, type ReactNode } from 'react'

// 구글이 하는 모든 사업 — 무엇을 하고 어떻게 버나(회사 전체 숫자·출처). "내 몫" 숫자는 화면 위 주주 카드(OwnerCard) 한 곳에 모았다.

type Item = {
  group: string
  name: string
  what: string
  money: string                 // 어떻게 돈을 버나 / 어느 매출에 들어가나
  usage?: { perYear: number; unit: string; label: string; src: string; grade: 'A' | 'B' | 'C' }
  rev?: { perYear: number; label: string }   // 최근 4분기 매출(달러)
  pm?: number                                // 세후 이익률 추정(%) — 매출 중 이익으로 남는 몫
  fun?: (my: number) => string               // 재미있는 환산 한 줄
  usage2?: { perYear: number; unit: string; label: string; src: string; grade: 'A' | 'B' | 'C' } // 두 번째 사용량(예: 웨이모 이동 거리)
  stakes?: { label: string; v: number; note: string }[]   // 지분·기업가치(달러) — 내 몫으로 환산
}

const ITEMS: Item[] = [
  { group: '광고', name: '구글 검색(지도·쇼핑 포함)', what: '검색 결과·AI 답변 옆에 붙는 광고. 구글 지도·쇼핑 탭도 여기에 들어간다.',
    money: '광고주가 클릭·노출마다 낸다. 회사 매출의 약 53%.',
    usage: { perYear: 5e12, unit: '회', label: '검색', src: '구글 공식 "1년 5조 회 이상"(2024년 기준, 지금은 더 많을 것)', grade: 'A' },
    rev: { perYear: 250.1e9, label: '검색 광고 매출' }, pm: 35,
    fun: my => `검색 1번당 광고 매출 약 5센트 — 내 몫 검색이 하루 ${Math.round(my / 365).toLocaleString()}번 일어나는 셈. 광고 클릭 수 자체는 공개하지 않지만 증가율은 분기 보고서에 매번 나온다(2026년 3분기 유료 클릭 +8%, 클릭당 단가 +4%) — 그래서 1번당 값은 검색 횟수로 본다.` },
  { group: '광고', name: '유튜브 광고', what: '영상·쇼츠·TV 화면 유튜브에 붙는 광고. 유튜브는 지금 미국 TV 시청 시간 1위 플랫폼.',
    money: '광고주가 낸다. 회사 매출의 약 9%.',
    usage: { perYear: 1e9 * 365, unit: '시간', label: '시청', src: '유튜브 공식 "하루 10억 시간 이상"을 최소값으로 사용(TV 화면에서만 하루 10억 시간 넘는다는 발표도 있어 실제는 더 많다. 외부 추정 하루 20억 시간 안팎)', grade: 'B' },
    rev: { perYear: 43.5e9, label: '유튜브 광고 매출' }, pm: 35,
    fun: my => `남들이 유튜브를 보는 동안 내 몫으로 하루 ${(my / 365).toFixed(1)}시간 시청이 일어난다 — 시청 1시간당 광고 매출 약 ${(43.5e9 / (1e9 * 365) * 100).toFixed(0)}센트` },
  { group: '광고', name: '구글 네트워크(애드센스·애드몹·애드매니저)', what: '다른 웹사이트·앱에 구글이 대신 광고를 붙여 주는 사업.',
    money: '광고비의 대부분을 사이트 주인에게 나눠 줘서 남는 게 적다. 성장도 가장 느리다(+1%).',
    rev: { perYear: 29.6e9, label: '네트워크 매출' }, pm: 35 },
  { group: '구독·플랫폼·기기', name: '유료 구독(유튜브 프리미엄·뮤직·TV, 구글 원, AI 요금제)', what: '광고 없는 유튜브, 저장 공간(구글 원), 제미나이 고급 요금제 등.',
    money: '매달 받는 구독료. 광고보다 빨리 큰다.',
    usage: { perYear: 350e6, unit: '건', label: '유료 구독', src: '회사 발표 3.5억 건(2026년 1분기, 연간 누적이 아니라 지금 가입 수)', grade: 'A' } },
  { group: '구독·플랫폼·기기', name: '안드로이드·플레이스토어', what: '세계 스마트폰 대부분의 운영체제. 앱을 팔면 플레이스토어가 수수료를 받는다.',
    money: '플레이스토어 앱·게임 결제 수수료(15~30%). 안드로이드 자체는 무료로 주고 검색·광고로 회수.',
    usage: { perYear: 3e9, unit: '대', label: '안드로이드 기기', src: '구글 발표 "30억 대 이상"(2021년, 지금은 더 많다는 보도)', grade: 'B' } },
  { group: '구독·플랫폼·기기', name: '기기(픽셀폰·네스트·핏빗)', what: '구글이 직접 만드는 폰·스피커·스마트워치.',
    money: '기기 판매. 위 구독·플랫폼과 합쳐 매출 약 532억 달러(최근 1년).', rev: { perYear: 53.2e9, label: '구독·플랫폼·기기 합계 매출' }, pm: 35 },
  { group: 'AI', name: '제미나이 앱', what: '구글의 AI 비서(챗GPT의 경쟁자). 안드로이드·크롬·지메일 안에도 들어간다.',
    money: '지금은 무료 + 고급 요금제(구독에 포함). 앞으로 AI 답변 광고의 무대.',
    usage: { perYear: 1e9, unit: '명', label: '월 사용자', src: '회사 발표 월 10억 명 이상(2026년 3분기 실적, 1년 전 약 6.5억 → +54%). 하루 사용자 수·하루 질문 수는 공개하지 않는다(증가율만 — "하루 사용자 1년 새 3배"). 개발자·기업 API 사용량은 1분에 약 320억 토큰', grade: 'A' } },
  { group: 'AI', name: '검색 AI 모드·AI 개요', what: '검색 결과 맨 위에 AI가 답을 요약해 주는 기능.',
    money: '검색 광고 안에 포함. AI 답변 광고 단가가 일반 검색과 비슷하다는 회사 설명.',
    usage: { perYear: 1e9, unit: '명', label: '월 사용자', src: '회사 발표 "AI 모드 월 10억 명 이상"(2026년)', grade: 'A' } },
  { group: 'AI', name: 'AI 토큰 처리(구글 전체)', what: '제미나이·검색 AI·유튜브·워크스페이스·클라우드 API가 처리하는 AI 글자 조각(토큰) 전체. AI가 실제로 얼마나 일하는지 보여 준다.',
    money: '검색·구독·클라우드 매출 안에 나뉘어 들어간다(따로 매출 없음).',
    usage: { perYear: 3.2e15 * 12, unit: '토큰', label: 'AI 토큰 처리', src: '피차이 CEO "한 달 3.2경(3,200조) 토큰 이상"(2026년 5월 구글 I/O) × 12. 2025년 약 480조 → 1년 새 약 7배', grade: 'B' },
    fun: my => `토큰 = AI가 읽고 쓰는 글자 조각(한국어 1~2글자, 영어 단어 약 0.75개). 질문 하나에 질문+답 약 1,000토큰으로 치면, 내 몫으로 하루 약 ${Math.round(my / 365 / 1000).toLocaleString()}번의 AI 질문·답이 처리되는 셈(1초 약 ${(my / SEC_Y).toFixed(0)}토큰 ≈ 한국어 짧은 문장 2~3개). 긴 문서를 읽거나 "생각하는" AI는 한 번에 1만 토큰 넘게 쓰기도 하고, 유튜브 영상 분석·기업 AI 작업도 포함된 숫자라 감을 잡기 위한 환산이다.` },
  { group: '클라우드', name: '구글 클라우드(서버·TPU·워크스페이스·제미나이 기업용)', what: '기업에 서버·AI 칩(TPU)·AI 모델을 빌려주고, 지메일·문서도구(워크스페이스) 기업판을 판다.',
    money: '사용량·좌석 요금. 최근 분기 +103%, 영업이익률 36%. 수주 잔고 5,610억 달러.',
    rev: { perYear: 93.2e9, label: '클라우드 매출' }, pm: 28,
    fun: my => `클라우드는 사용량 숫자를 공개하지 않아 "돈"으로 본다 — 내 몫 수주 잔고(앞으로 받을 계약) 약 $${Math.round(561e9 * my / 93.2e9).toLocaleString()}, 1년 매출의 약 6배.` },
  { group: '기타 사업(아직 적자)', name: '웨이모(자율주행 택시)', what: '운전자 없는 택시. 미국 여러 도시에서 유료 운행.',
    money: '탑승 요금. 아직 적자지만 회사가 가장 기대하는 새 사업.',
    usage: { perYear: 500e3 * 52, unit: '회', label: '탑승', src: '회사 발표 주 50만 회 이상(2026년 3월) × 52주. 회사 목표는 2026년 말 주 100만 회', grade: 'A' },
    usage2: { perYear: 4e6 * 1.609 * 52, unit: 'km', label: '무인 주행', src: '"매주 400만 마일 넘게 무인 주행"(2026년 5월, 웨이모 임원 발언을 2차 출처가 전한 숫자 — 회사 공식 자료로 확인 못 함) × 1.609km × 52주', grade: 'C' },
    rev: { perYear: 500e3 * 52 * 20, label: '웨이모 요금 매출(추정)' },
    stakes: [{ label: '웨이모 기업가치', v: 126e9, note: '2026년 2월 160억 달러 투자 유치 때 1,260억 달러. 알파벳 지분율은 비공개(대주주) — 내 몫은 이보다 작다' }],
    fun: () => `회사는 웨이모 매출을 따로 공개하지 않는다 — 탑승 1회 평균 요금을 약 20달러로 가정한 추정(외부 추정 연 3.5~4억 달러). 아직 적자라 이익은 없다.` },
  { group: '기타 사업(아직 적자)', name: '그 밖의 실험(베릴리·캘리코·윙·아이소모픽 랩스·X)', what: '생명과학(베릴리), 노화 연구(캘리코), 드론 배송(윙), AI 신약 개발(아이소모픽 랩스), 문샷 연구소(X).',
    money: '대부분 매출이 거의 없다. "기타 사업" 매출 최근 1년 약 15억 달러, 손실이 더 크다(2026년 1분기 손실 21억 달러). 윙은 월마트 270곳 넘게(2027년까지)로 확대 중.', rev: { perYear: 1.5e9, label: '기타 사업 매출' } },
  { group: '투자 지분', name: '스페이스X·앤트로픽 등 지분', what: '스페이스X 약 4.9%, AI 회사 앤트로픽 등에 투자.',
    money: '가치가 오르면 순이익에 평가이익으로 잡힌다(현금은 아님). 그래서 공시 PER(약 14배)이 실제(약 26배)보다 낮게 보인다. 2026년 2분기 EPS 9.11달러 중 6.26달러가 이런 평가이익(보도).',
    stakes: [
      { label: '스페이스X 지분', v: 94e9, note: '2026년 6월 말 공정가치 약 940억 달러(지분 약 4.9%)' },
      { label: '비상장 지분(대부분 앤트로픽)', v: 124.3e9, note: '2026년 6월 말 장부가 1,243억 달러 — 대부분 앤트로픽으로 보도. 앤트로픽 상장 신청 보도' },
    ] },
  { group: '미래 옵션(아직 매출 거의 없음)', name: 'TPU 외부 판매(자체 AI 칩)', what: '구글이 만든 AI 칩을 다른 회사에 빌려주거나 판다. 앤트로픽 최대 100만 개, 메타 임대(2027년부터 구매 선택권, 보도), 사용 고객 약 100곳.',
    money: '클라우드 매출 안에 섞여 따로 공개하지 않는다. 블룸버그 인텔리전스 추정 외부 판매 2026년 약 120억 → 2028년 1,350억 달러.',
    stakes: [{ label: '2028년 TPU 외부 판매(추정)', v: 135e9, note: '블룸버그 인텔리전스 추정 — 회사 발표 아님' }] },
  { group: '미래 옵션(아직 매출 거의 없음)', name: '아이소모픽 랩스(AI 신약 개발)', what: '딥마인드의 단백질 구조 AI(알파폴드)로 신약을 설계. 일라이 릴리·노바티스·존슨앤드존슨과 협력.',
    money: '2026년 5월 21억 달러 투자 유치, 약 50억 달러 추가 협의 중(블룸버그). 아직 사람 대상 임상 없음 — 신약 매출은 2030년대.' },
  { group: '미래 옵션(아직 매출 거의 없음)', name: '로봇(제미나이 로보틱스)', what: '휴머노이드 로봇 몸 전체를 움직이는 AI 모델(2026년 7~8월 2세대). 앱트로닉·보스턴 다이내믹스와 협력, 로봇 소프트웨어 인트린식을 구글 안으로 흡수.',
    money: '로봇 회사에 AI 모델 사용료 — 2028년 이후(추정).' },
  { group: '미래 옵션(아직 매출 거의 없음)', name: 'AI 안경·의료 AI·양자·우주', what: '안드로이드 XR 안경(2026년 가을, 와비파커·젠틀몬스터·삼성). 의료 AI(AMIE 진료 상담 검증, MedGemma). 양자칩 윌로(특정 계산 1만 3천 배). 우주 데이터센터 위성 시제품(2027년).',
    money: '모두 매출이 거의 없다. 안경은 제미나이 사용처, 양자·우주는 2030년대 이야기. 베릴리(생명과학)는 2026년 구글이 대주주에서 빠졌다.' },
]

const fmt = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}백만` : v >= 1e4 ? `${(v / 1e4).toFixed(1)}만` : v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(2)
const SEC_Y = 365 * 86400
const isStock = (u: { unit: string; label: string }) => u.unit === '명' || u.label.includes('기기') || u.label === '유료 구독'
const G: Record<string, string> = { A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', B: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', C: 'bg-gray-100 text-gray-600' }

// 마우스를 올리면(휴대폰은 누르면) 설명이 뜨는 칸
function Tip({ children, text }: { children: ReactNode; text: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block group/tip" onClick={() => setOpen(o => !o)}>
      <span className="border-b border-dotted border-gray-400 cursor-help">{children}</span>
      <span className={`absolute left-0 top-full mt-1 z-50 w-64 max-w-[75vw] rounded-md bg-gray-900 text-white text-xs leading-relaxed px-2.5 py-2 shadow-lg font-normal ${open ? 'block' : 'hidden group-hover/tip:block'}`}>{text}</span>
    </span>
  )
}

export default function GoogleMyShare() {
  const groups = [...new Set(ITEMS.map(i => i.group))]
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  return (
    <details className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
      <summary className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">구글이 하는 모든 사업 — 무엇을 하고 어떻게 버나 (눌러서 펼치기)</summary>
      <div className="mt-3 space-y-4">
      <p className={small}>회사 전체 숫자와 출처. 내 주식 몫(1초·하루·1년, 사업부별, 검색·유튜브·AI·웨이모 환산)은 <a href="#owner-card" className="text-blue-600 dark:text-blue-400 underline">맨 위 주주 카드</a>에 있다.</p>
      {groups.map(g => (
        <div key={g} className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{g}</p>
          {ITEMS.filter(i => i.group === g).map(i => (
            <div key={i.name} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{i.name}</p>
              <p className={small}>{i.what} <span className="text-gray-500">돈: {i.money}</span></p>
              {(i.usage || i.usage2 || i.rev) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700 dark:text-gray-200">
                  {i.usage && <span>{i.usage.label} <b className="tabular-nums">{fmt(i.usage.perYear)}{i.usage.unit}</b>{isStock(i.usage) ? '' : '/년'} <span className={`inline-block px-1 rounded text-[10px] font-semibold ${G[i.usage.grade]}`}>{i.usage.grade}</span></span>}
                  {i.usage2 && <span>{i.usage2.label} <b className="tabular-nums">{fmt(i.usage2.perYear)}{i.usage2.unit}</b>/년 <span className={`inline-block px-1 rounded text-[10px] font-semibold ${G[i.usage2.grade]}`}>{i.usage2.grade}</span></span>}
                  {i.rev && <span>{i.rev.label}(1년) <b className="tabular-nums">{Math.round(i.rev.perYear / 1e8).toLocaleString()}억 달러</b></span>}
                </div>
              )}
              {i.stakes && i.stakes.map(st => <p key={st.label} className="text-xs text-gray-700 dark:text-gray-200"><Tip text={st.note}>{st.label}</Tip> {Math.round(st.v / 1e8).toLocaleString()}억 달러</p>)}
              {i.fun && i.name.startsWith('웨이모') && <p className="text-xs text-gray-500">{i.fun(0)}</p>}
              {i.usage && <p className="text-[11px] text-gray-400">{i.usage.src}</p>}
              {i.usage2 && <p className="text-[11px] text-gray-400">{i.usage2.src}</p>}
            </div>
          ))}
        </div>
      ))}
      <p className="text-[11px] text-gray-400">매출은 최근 4분기(2025년 4분기~2026년 3분기) 회사 공시 기준. 신뢰 등급: A = 회사 공식 발표, B = 회사 발표지만 오래됐거나 최소값, C = 2차 출처. 사용자·기기·구독 수는 1년 누적이 아니라 지금 쓰는 수.</p>
      </div>
    </details>
  )
}
