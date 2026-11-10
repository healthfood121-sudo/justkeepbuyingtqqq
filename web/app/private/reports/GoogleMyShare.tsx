'use client'

import { useEffect, useState, type ReactNode } from 'react'

// 구글의 모든 사업 + "내 주식 몫"으로 환산한 사용량·매출.
// 내 몫 = 회사 전체 숫자 × (내 주식 수 ÷ 전체 주식 수). 보유 주식 수는 이익 시계와 같은 칸(clock-shares-GOOGL)을 쓴다.
const SHARES_OUT = 12.368e9 // 2026-09-30 SEC 공시 발행 주식(클래스 A·B·C 합)
const KEY = 'clock-shares-GOOGL'

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
}

const ITEMS: Item[] = [
  { group: '광고', name: '구글 검색(지도·쇼핑 포함)', what: '검색 결과·AI 답변 옆에 붙는 광고. 구글 지도·쇼핑 탭도 여기에 들어간다.',
    money: '광고주가 클릭·노출마다 낸다. 회사 매출의 약 53%.',
    usage: { perYear: 5e12, unit: '회', label: '검색', src: '구글 공식 "1년 5조 회 이상"(2024년 기준, 지금은 더 많을 것)', grade: 'A' },
    rev: { perYear: 250.1e9, label: '검색 광고 매출' }, pm: 35,
    fun: my => `검색 1번당 광고 매출 약 5센트 — 내 몫 검색이 하루 ${Math.round(my / 365).toLocaleString()}번 일어나는 셈. 광고 클릭 수는 회사가 공개하지 않는다(증가율만 발표) — 그래서 검색 횟수로 본다.` },
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
    usage: { perYear: 950e6, unit: '명', label: '월 사용자', src: '회사 발표 월 9.5억 명(2026년 2분기 콜)', grade: 'A' } },
  { group: 'AI', name: '검색 AI 모드·AI 개요', what: '검색 결과 맨 위에 AI가 답을 요약해 주는 기능.',
    money: '검색 광고 안에 포함. AI 답변 광고 단가가 일반 검색과 비슷하다는 회사 설명.',
    usage: { perYear: 1e9, unit: '명', label: '월 사용자', src: '회사 발표 "AI 모드 월 10억 명 이상"(2026년)', grade: 'A' } },
  { group: 'AI', name: 'AI 토큰 처리(구글 전체)', what: '제미나이·검색 AI·유튜브·워크스페이스·클라우드 API가 처리하는 AI 글자 조각(토큰) 전체. AI가 실제로 얼마나 일하는지 보여 준다.',
    money: '검색·구독·클라우드 매출 안에 나뉘어 들어간다(따로 매출 없음).',
    usage: { perYear: 3.2e15 * 12, unit: '토큰', label: 'AI 토큰 처리', src: '피차이 CEO "한 달 3.2경(3,200조) 토큰 이상"(2026년 5월 구글 I/O) × 12. 2025년 약 480조 → 1년 새 약 7배', grade: 'B' } },
  { group: '클라우드', name: '구글 클라우드(서버·TPU·워크스페이스·제미나이 기업용)', what: '기업에 서버·AI 칩(TPU)·AI 모델을 빌려주고, 지메일·문서도구(워크스페이스) 기업판을 판다.',
    money: '사용량·좌석 요금. 최근 분기 +103%, 영업이익률 36%. 수주 잔고 5,610억 달러.',
    rev: { perYear: 93.2e9, label: '클라우드 매출' }, pm: 28,
    fun: my => `클라우드는 사용량 숫자를 공개하지 않아 "돈"으로 본다 — 내 몫 수주 잔고(앞으로 받을 계약) 약 $${Math.round(561e9 * my / 93.2e9).toLocaleString()}, 1년 매출의 약 6배.` },
  { group: '기타 사업(아직 적자)', name: '웨이모(자율주행 택시)', what: '운전자 없는 택시. 미국 여러 도시에서 유료 운행.',
    money: '탑승 요금. 아직 적자지만 회사가 가장 기대하는 새 사업.',
    usage: { perYear: 500e3 * 52, unit: '회', label: '탑승', src: '회사 발표 주 50만 회 이상(2026년 3월) × 52주. 회사 목표는 2026년 말 주 100만 회', grade: 'A' },
    usage2: { perYear: 4e6 * 1.609 * 52, unit: 'km', label: '무인 주행', src: '"매주 400만 마일 넘게 무인 주행"(2026년 5월, 웨이모 임원 발언을 2차 출처가 전한 숫자 — 회사 공식 자료로 확인 못 함) × 1.609km × 52주', grade: 'C' },
    rev: { perYear: 500e3 * 52 * 20, label: '웨이모 요금 매출(추정)' },
    fun: () => `회사는 웨이모 매출을 따로 공개하지 않는다 — 탑승 1회 평균 요금을 약 20달러로 가정한 추정. 아직 적자라 이익은 없다.` },
  { group: '기타 사업(아직 적자)', name: '그 밖의 실험(베릴리·캘리코·윙·아이소모픽 랩스·X)', what: '생명과학(베릴리), 노화 연구(캘리코), 드론 배송(윙), AI 신약 개발(아이소모픽 랩스), 문샷 연구소(X).',
    money: '대부분 매출이 거의 없다. "기타 사업" 매출 최근 1년 약 15억 달러, 손실이 더 크다.', rev: { perYear: 1.5e9, label: '기타 사업 매출' } },
  { group: '투자 지분', name: '스페이스X·앤트로픽 등 지분', what: '스페이스X 약 4.9%, AI 회사 앤트로픽 등에 투자.',
    money: '가치가 오르면 순이익에 평가이익으로 잡힌다(현금은 아님). 그래서 공시 PER(약 14배)이 실제(약 26배)보다 낮게 보인다.' },
]

const fmt = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}백만` : v >= 1e4 ? `${(v / 1e4).toFixed(1)}만` : v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(2)
const usd = (v: number) => `$${v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2)}`
const SEC_Y = 365 * 86400
const isStock = (u: { unit: string; label: string }) => u.unit === '명' || u.label.includes('기기') || u.label === '유료 구독'
// 1초당 돈(센트)
const perSec = (yearUsd: number) => { const c = yearUsd / SEC_Y * 100; return `${c.toFixed(c < 0.01 ? 4 : c < 1 ? 3 : 1)}센트` }
const perN = (v: number) => v >= 100 ? Math.round(v).toLocaleString() : v >= 1 ? v.toFixed(1) : v.toFixed(3)
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
  const [txt, setTxt] = useState('')
  useEffect(() => { try { const v = Number(localStorage.getItem(KEY)); if (v > 0) setTxt(String(v)) } catch {} }, [])
  const save = (t: string) => { const c = t.replace(/[^0-9.]/g, ''); setTxt(c); try { if (Number(c) > 0) localStorage.setItem(KEY, c); else localStorage.removeItem(KEY) } catch {} }
  const shares = Number(txt) > 0 ? Number(txt) : 1
  const ratio = shares / SHARES_OUT
  const yt = 1e9 * 365 * ratio
  const groups = [...new Set(ITEMS.map(i => i.group))]
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  return (
    <div className="rounded-xl border-2 border-red-200 dark:border-red-900/60 p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">구글이 하는 모든 사업 — 그리고 내 주식 몫</h3>
        <p className={small}>남들은 검색하고 유튜브를 보며 시간을 쓰지만, 주주는 그만큼의 사용량을 &ldquo;가진&rdquo; 셈이다. <b>내 몫 = 회사 전체 숫자 × (내 주식 수 ÷ 전체 주식 {(SHARES_OUT / 1e8).toFixed(1)}억 주)</b>.</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-300">내 구글 주식</span>
          <input inputMode="decimal" value={txt} onChange={e => save(e.target.value)} placeholder="예: 652"
            className="w-28 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-right tabular-nums" />
          <span className="text-gray-500">주 {txt ? '' : '(비어 있으면 1주로 계산)'}</span>
        </label>
        <p className="text-[11px] text-gray-400">이익 시계의 보유 주식 칸과 같은 값을 쓴다(이 기기에만 저장).</p>
      </div>

      <div className="rounded-lg bg-red-50/70 dark:bg-red-950/20 p-3 space-y-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">유튜브로 환산하면 — 내 주식 {shares.toLocaleString()}주, <u>1년 → 하루 → 1초</u></p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            ['내 몫 시청 시간 (1년)', `${fmt(yt)}시간`, <>전 세계 유튜브 시청 1년 약 3,650억 시간(하루 10억 시간 × 365일) × 내 비율({shares.toLocaleString()}주 ÷ {(SHARES_OUT / 1e8).toFixed(1)}억 주 = {Math.round(1 / ratio).toLocaleString()}분의 1). 실제로 누가 내 몫을 보는 게 아니라, 전체를 내 지분만큼 잘라 본 크기.</>],
            ['하루로 나누면', `${(yt / 365).toFixed(1)}시간 = ${(yt / 365 / 24).toFixed(1)}명이 24시간 내내`, <>1년 내 몫 시청 시간 ÷ 365일. 한 사람이 하루 24시간 내내 봐도 24시간이니, 그 사람 수로 바꾸면 이만큼.</>],
            ['내 1초마다', `${(yt * 3600 / 365 / 86400).toFixed(2)}초`, <>하루 내 몫 시청 시간({(yt / 365).toFixed(1)}시간)을 초로 바꿔(× 3,600) 하루 86,400초로 나눈 값. <b>내가 1초를 사는 동안 전 세계 누군가가 내 몫으로 유튜브를 이만큼 본다.</b></>],
            ['내가 자는 8시간 동안', `${(yt / 365 / 3).toFixed(1)}시간`, <>하루 내 몫 시청 시간 ÷ 3(하루 24시간 중 8시간).</>],
            ['시청 1시간당 광고 매출', '약 12센트', <>유튜브 광고 매출 1년 435억 달러 ÷ 시청 3,650억 시간. 누군가 유튜브를 1시간 볼 때 그 사이 광고로 구글이 평균 버는 돈.</>],
            ['내 몫 광고 매출 (1년)', usd(43.5e9 * ratio), <>유튜브 광고 매출 435억 달러 × 내 비율. = 내 몫 시청 시간 × 12센트. <b>매출이다 — 비용을 빼기 전 금액.</b></>],
            ['내 몫 이익 (1년, 추정)', usd(43.5e9 * ratio * 0.35), <>매출 × 세후 이익률 약 35%(구글 서비스 영업이익률 약 42% × 세금 뺀 0.83). 사업부별 이익은 회사가 공개하지 않아 나눠 추정한 대략값.</>],
            ['1주당 시청 시간 (1년)', `${(1e9 * 365 / SHARES_OUT).toFixed(1)}시간`, <>주식 1주에 해당하는 1년 시청 시간.</>],
          ] as [string, string, ReactNode][]).map(([k, v, t]) => (
            <div key={k}><p className="text-[11px] text-gray-500 dark:text-gray-400"><Tip text={t}>{k}</Tip></p><p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{v}</p></div>
          ))}
        </div>
        <p className={small}><b>이 돈은 내 통장으로 들어오지 않는다.</b> 구글은 이익을 배당으로 거의 나눠 주지 않고(배당 약 0.3%) AI 투자·자사주 매입에 쓴다. 그래서 내 몫 이익은 <b>&ldquo;내 주식 1주의 가치가 커지는 방식&rdquo;</b>으로 돌아온다. 시청 시간은 공식 최소값 기준이라 실제는 더 많을 가능성이 크다. 유튜브 프리미엄 등 구독료는 빠졌다. 칸 이름에 마우스를 올리면(휴대폰은 누르면) 계산 방법이 나온다.</p>
      </div>

      {(() => {
        const rv = ITEMS.filter(i => i.rev && !i.name.startsWith('웨이모')).reduce((a, i) => a + i.rev!.perYear, 0) * ratio
        const pf = ITEMS.filter(i => i.rev && i.pm != null).reduce((a, i) => a + i.rev!.perYear * i.pm! / 100, 0) * ratio
        const rows: [string, string, string][] = [
          ['매출', perSec(rv), `하루 ${usd(rv / 365)} · 1년 ${usd(rv)}`],
          ['이익(추정)', perSec(pf), `하루 ${usd(pf / 365)} · 1년 ${usd(pf)}`],
          ['검색', `${perN(5e12 * ratio / SEC_Y)}번`, `하루 ${Math.round(5e12 * ratio / 365).toLocaleString()}번`],
          ['유튜브 시청', `${perN(1e9 * 365 * ratio * 3600 / SEC_Y)}초`, `하루 ${(1e9 * ratio).toFixed(1)}시간`],
          ['AI 토큰', `${perN(3.2e15 * 12 * ratio / SEC_Y)}개`, `하루 ${Math.round(3.2e15 * 12 * ratio / 365).toLocaleString()}개`],
          ['웨이모 이동', `${perN(4e6 * 1.609 * 52 * ratio / SEC_Y * 1000)}m`, `하루 ${(4e6 * 1.609 * 52 * ratio / 365).toFixed(2)}km(덜 확실)`],
        ]
        return (
          <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/20 p-3 space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">구글 전체 — 내 1초마다 (내 주식 {shares.toLocaleString()}주)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rows.map(([k, v, d]) => (
                <div key={k}><p className="text-[11px] text-gray-500 dark:text-gray-400">{k}</p><p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{v}</p><p className="text-[11px] text-gray-400 tabular-nums">{d}</p></div>
              ))}
            </div>
            <p className={small}>매출 = 검색·유튜브·네트워크·구독·클라우드·기타 사업 매출(최근 1년, 회사 공시) × 내 비율 ÷ 1년(3,153만 6천 초). 이익은 사업별 세후 이익률 추정을 곱한 대략값(웨이모·기타 사업 적자는 반영 안 함). 검색 광고 클릭 수는 회사가 공개하지 않아 검색 횟수로 대신 본다. 웨이모 이동 거리는 2차 출처 숫자라 덜 확실하다.</p>
          </div>
        )
      })()}

      {groups.map(g => (
        <div key={g} className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{g}</p>
          {ITEMS.filter(i => i.group === g).map(i => {
            const myU = i.usage ? i.usage.perYear * ratio : null
            return (
              <div key={i.name} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{i.name}</p>
                <p className={small}>{i.what} <span className="text-gray-500">돈: {i.money}</span></p>
                {(i.usage || i.rev) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {i.usage && <span className="text-gray-700 dark:text-gray-200"><Tip text={<>회사 전체 숫자 × 내 비율({Math.round(1 / ratio).toLocaleString()}분의 1). {i.usage.unit === '명' || i.usage.label.includes('기기') || i.usage.label === '유료 구독' ? '사용자·기기·구독 수는 1년 누적이 아니라 지금 쓰고 있는 수다.' : '1년 동안 일어나는 양이다.'} 출처: {i.usage.src}</>}>전체 {i.usage.label}</Tip> <b className="tabular-nums">{fmt(i.usage.perYear)}{i.usage.unit}</b>{i.usage.unit === '명' || i.usage.label.includes('기기') || i.usage.label === '유료 구독' ? '' : '/년'} → <b className="text-red-600 dark:text-red-400 tabular-nums">내 몫 {fmt(myU!)}{i.usage.unit}</b> <span className={`inline-block px-1 rounded text-[10px] font-semibold ${G[i.usage.grade]}`}>{i.usage.grade}</span></span>}
                    {i.rev && <span className="text-gray-700 dark:text-gray-200"><Tip text={<>회사 {i.rev.label} 최근 1년 {Math.round(i.rev.perYear / 1e8).toLocaleString()}억 달러 × 내 비율({Math.round(1 / ratio).toLocaleString()}분의 1). 비용을 빼기 전 매출이다.</>}>{i.rev.label}(1년)</Tip> {Math.round(i.rev.perYear / 1e8).toLocaleString()}억 달러 → <b className="text-red-600 dark:text-red-400 tabular-nums">내 몫 매출 {usd(i.rev.perYear * ratio)}</b></span>}
                    {i.rev && i.pm != null && <span className="text-gray-700 dark:text-gray-200"><Tip text={<>내 몫 매출 × 세후 이익률 약 {i.pm}%(회사가 사업부별 이익을 일부만 공개해 나눠 추정). 현금으로 받는 돈이 아니라 주식 가치로 돌아온다.</>}>내 몫 이익(1년, 추정)</Tip> <b className="tabular-nums">{usd(i.rev.perYear * ratio * i.pm / 100)}</b></span>}
                  </div>
                )}
                {((i.usage && !isStock(i.usage)) || i.usage2 || i.rev) && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 tabular-nums">
                    <b>내 1초마다:</b>{' '}
                    {[
                      i.usage && !isStock(i.usage) ? `${i.usage.label} ${perN(i.usage.perYear * ratio / SEC_Y)}${i.usage.unit}` : null,
                      i.usage2 ? `${i.usage2.label} ${perN(i.usage2.perYear * ratio / SEC_Y * (i.usage2.unit === 'km' ? 1000 : 1))}${i.usage2.unit === 'km' ? 'm' : i.usage2.unit}` : null,
                      i.rev ? `매출 ${perSec(i.rev.perYear * ratio)}` : null,
                      i.rev && i.pm != null ? `이익 ${perSec(i.rev.perYear * ratio * i.pm / 100)}` : null,
                    ].filter(Boolean).join(' · ')}
                    {i.rev && <span className="text-gray-400"> (하루 매출 {usd(i.rev.perYear * ratio / 365)})</span>}
                  </p>
                )}
                {i.usage2 && <p className="text-xs text-gray-700 dark:text-gray-200">전체 {i.usage2.label} <b className="tabular-nums">{fmt(i.usage2.perYear)}{i.usage2.unit}</b>/년 → <b className="text-red-600 dark:text-red-400 tabular-nums">내 몫 {fmt(i.usage2.perYear * ratio)}{i.usage2.unit}</b> <span className={`inline-block px-1 rounded text-[10px] font-semibold ${G[i.usage2.grade]}`}>{i.usage2.grade}</span> <span className="text-[11px] text-gray-400">{i.usage2.src}</span></p>}
                {i.fun && <p className="text-xs text-red-700 dark:text-red-300">{i.fun(myU ?? (i.rev ? i.rev.perYear * ratio : 0))}</p>}
                {i.usage && <p className="text-[11px] text-gray-400">{i.usage.src}</p>}
              </div>
            )
          })}
        </div>
      ))}
      <p className="text-[11px] text-gray-400">매출은 최근 4분기(2025년 4분기~2026년 3분기) 회사 공시 기준. 사용량 신뢰 등급: A = 회사 공식 발표, B = 회사 발표지만 오래됐거나 최소값, C = 2차 출처라 덜 확실. &ldquo;명&rdquo;(사용자 수)은 1년 누적이 아니라 지금 쓰는 사람 수의 내 몫이다. 크롬·지메일·지도 사용자 수는 회사가 최근 공식 숫자를 내지 않아 뺐다.</p>
    </div>
  )
}
