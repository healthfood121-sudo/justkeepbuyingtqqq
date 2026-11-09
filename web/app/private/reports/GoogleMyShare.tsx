'use client'

import { useEffect, useState } from 'react'

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
  fun?: (my: number) => string               // 재미있는 환산 한 줄
}

const ITEMS: Item[] = [
  { group: '광고', name: '구글 검색(지도·쇼핑 포함)', what: '검색 결과·AI 답변 옆에 붙는 광고. 구글 지도·쇼핑 탭도 여기에 들어간다.',
    money: '광고주가 클릭·노출마다 낸다. 회사 매출의 약 53%.',
    usage: { perYear: 5e12, unit: '회', label: '검색', src: '구글 공식 "1년 5조 회 이상"(2024년 기준, 지금은 더 많을 것)', grade: 'A' },
    rev: { perYear: 250.1e9, label: '검색 광고 매출' },
    fun: my => `검색 1번당 광고 매출 약 5센트 — 내 몫 검색이 하루 ${Math.round(my / 365).toLocaleString()}번 일어나는 셈` },
  { group: '광고', name: '유튜브 광고', what: '영상·쇼츠·TV 화면 유튜브에 붙는 광고. 유튜브는 지금 미국 TV 시청 시간 1위 플랫폼.',
    money: '광고주가 낸다. 회사 매출의 약 9%.',
    usage: { perYear: 1e9 * 365, unit: '시간', label: '시청', src: '유튜브 공식 "하루 10억 시간 이상"을 최소값으로 사용(TV 화면에서만 하루 10억 시간 넘는다는 발표도 있어 실제는 더 많다. 외부 추정 하루 20억 시간 안팎)', grade: 'B' },
    rev: { perYear: 43.5e9, label: '유튜브 광고 매출' },
    fun: my => `남들이 유튜브를 보는 동안 내 몫으로 하루 ${(my / 365).toFixed(1)}시간 시청이 일어난다 — 시청 1시간당 광고 매출 약 ${(43.5e9 / (1e9 * 365) * 100).toFixed(0)}센트` },
  { group: '광고', name: '구글 네트워크(애드센스·애드몹·애드매니저)', what: '다른 웹사이트·앱에 구글이 대신 광고를 붙여 주는 사업.',
    money: '광고비의 대부분을 사이트 주인에게 나눠 줘서 남는 게 적다. 성장도 가장 느리다(+1%).',
    rev: { perYear: 29.6e9, label: '네트워크 매출' } },
  { group: '구독·플랫폼·기기', name: '유료 구독(유튜브 프리미엄·뮤직·TV, 구글 원, AI 요금제)', what: '광고 없는 유튜브, 저장 공간(구글 원), 제미나이 고급 요금제 등.',
    money: '매달 받는 구독료. 광고보다 빨리 큰다.',
    usage: { perYear: 350e6, unit: '건', label: '유료 구독', src: '회사 발표 3.5억 건(2026년 1분기, 연간 누적이 아니라 지금 가입 수)', grade: 'A' } },
  { group: '구독·플랫폼·기기', name: '안드로이드·플레이스토어', what: '세계 스마트폰 대부분의 운영체제. 앱을 팔면 플레이스토어가 수수료를 받는다.',
    money: '플레이스토어 앱·게임 결제 수수료(15~30%). 안드로이드 자체는 무료로 주고 검색·광고로 회수.',
    usage: { perYear: 3e9, unit: '대', label: '안드로이드 기기', src: '구글 발표 "30억 대 이상"(2021년, 지금은 더 많다는 보도)', grade: 'B' } },
  { group: '구독·플랫폼·기기', name: '기기(픽셀폰·네스트·핏빗)', what: '구글이 직접 만드는 폰·스피커·스마트워치.',
    money: '기기 판매. 위 구독·플랫폼과 합쳐 매출 약 532억 달러(최근 1년).', rev: { perYear: 53.2e9, label: '구독·플랫폼·기기 합계 매출' } },
  { group: 'AI', name: '제미나이 앱', what: '구글의 AI 비서(챗GPT의 경쟁자). 안드로이드·크롬·지메일 안에도 들어간다.',
    money: '지금은 무료 + 고급 요금제(구독에 포함). 앞으로 AI 답변 광고의 무대.',
    usage: { perYear: 950e6, unit: '명', label: '월 사용자', src: '회사 발표 월 9.5억 명(2026년 2분기 콜)', grade: 'A' } },
  { group: 'AI', name: '검색 AI 모드·AI 개요', what: '검색 결과 맨 위에 AI가 답을 요약해 주는 기능.',
    money: '검색 광고 안에 포함. AI 답변 광고 단가가 일반 검색과 비슷하다는 회사 설명.',
    usage: { perYear: 1e9, unit: '명', label: '월 사용자', src: '회사 발표 "AI 모드 월 10억 명 이상"(2026년)', grade: 'A' } },
  { group: '클라우드', name: '구글 클라우드(서버·TPU·워크스페이스·제미나이 기업용)', what: '기업에 서버·AI 칩(TPU)·AI 모델을 빌려주고, 지메일·문서도구(워크스페이스) 기업판을 판다.',
    money: '사용량·좌석 요금. 최근 분기 +103%, 영업이익률 36%. 수주 잔고 5,610억 달러.',
    rev: { perYear: 93.2e9, label: '클라우드 매출' },
    fun: my => `내 몫 수주 잔고(앞으로 받을 계약) 약 $${Math.round(561e9 * my / 93.2e9).toLocaleString()}` },
  { group: '기타 사업(아직 적자)', name: '웨이모(자율주행 택시)', what: '운전자 없는 택시. 미국 여러 도시에서 유료 운행.',
    money: '탑승 요금. 아직 적자지만 회사가 가장 기대하는 새 사업.',
    usage: { perYear: 500e3 * 52, unit: '회', label: '탑승', src: '회사 발표 주 50만 회 이상(2026년 1분기) × 52주', grade: 'A' } },
  { group: '기타 사업(아직 적자)', name: '그 밖의 실험(베릴리·캘리코·윙·아이소모픽 랩스·X)', what: '생명과학(베릴리), 노화 연구(캘리코), 드론 배송(윙), AI 신약 개발(아이소모픽 랩스), 문샷 연구소(X).',
    money: '대부분 매출이 거의 없다. "기타 사업" 매출 최근 1년 약 15억 달러, 손실이 더 크다.', rev: { perYear: 1.5e9, label: '기타 사업 매출' } },
  { group: '투자 지분', name: '스페이스X·앤트로픽 등 지분', what: '스페이스X 약 4.9%, AI 회사 앤트로픽 등에 투자.',
    money: '가치가 오르면 순이익에 평가이익으로 잡힌다(현금은 아님). 그래서 공시 PER(약 14배)이 실제(약 26배)보다 낮게 보인다.' },
]

const fmt = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}백만` : v >= 1e4 ? `${(v / 1e4).toFixed(1)}만` : v >= 10 ? Math.round(v).toLocaleString() : v.toFixed(2)
const usd = (v: number) => `$${v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2)}`
const G: Record<string, string> = { A: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', B: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', C: 'bg-gray-100 text-gray-600' }

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

      <div className="rounded-lg bg-red-50/70 dark:bg-red-950/20 p-3 space-y-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">유튜브로 환산하면 — 내 주식 {shares.toLocaleString()}주</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[['내 몫 시청 시간: 1년', `${fmt(yt)}시간`], ['하루', `${(yt / 365).toFixed(1)}시간`], ['1주당 1년', `${(1e9 * 365 / SHARES_OUT).toFixed(1)}시간`], ['내 몫 유튜브 광고 매출: 1년', usd(43.5e9 * ratio)]].map(([k, v]) => (
            <div key={k}><p className="text-[11px] text-gray-500 dark:text-gray-400">{k}</p><p className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">{v}</p></div>
          ))}
        </div>
        <p className={small}>사람이 하루 {(yt / 365 / 24).toFixed(1)}명분(24시간 내내) 유튜브를 보는 만큼의 시청이 내 몫으로 매일 일어난다. 시청 시간은 공식 최소값(하루 10억 시간) 기준이라 실제는 이보다 많을 가능성이 크다. 매출은 광고만 — 유튜브 프리미엄 등 구독료는 빠졌다.</p>
      </div>

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
                    {i.usage && <span className="text-gray-700 dark:text-gray-200">전체 {i.usage.label} <b className="tabular-nums">{fmt(i.usage.perYear)}{i.usage.unit}</b>{i.usage.unit === '명' || i.usage.label.includes('기기') || i.usage.label === '유료 구독' ? '' : '/년'} → <b className="text-red-600 dark:text-red-400 tabular-nums">내 몫 {fmt(myU!)}{i.usage.unit}</b> <span className={`inline-block px-1 rounded text-[10px] font-semibold ${G[i.usage.grade]}`}>{i.usage.grade}</span></span>}
                    {i.rev && <span className="text-gray-700 dark:text-gray-200">{i.rev.label} {Math.round(i.rev.perYear / 1e8).toLocaleString()}억 달러 → <b className="text-red-600 dark:text-red-400 tabular-nums">내 몫 1년 {usd(i.rev.perYear * ratio)}</b></span>}
                  </div>
                )}
                {i.fun && <p className="text-xs text-red-700 dark:text-red-300">{i.fun(myU ?? (i.rev ? i.rev.perYear * ratio : 0))}</p>}
                {i.usage && <p className="text-[11px] text-gray-400">{i.usage.src}</p>}
              </div>
            )
          })}
        </div>
      ))}
      <p className="text-[11px] text-gray-400">매출은 최근 4분기(2025년 4분기~2026년 3분기) 회사 공시 기준. 사용량 신뢰 등급: A = 회사 공식 발표, B = 회사 발표지만 오래됐거나 최소값. &ldquo;명&rdquo;(사용자 수)은 1년 누적이 아니라 지금 쓰는 사람 수의 내 몫이다. 크롬·지메일·지도 사용자 수는 회사가 최근 공식 숫자를 내지 않아 뺐다.</p>
    </div>
  )
}
