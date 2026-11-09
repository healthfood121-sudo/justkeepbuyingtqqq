'use client'

import { useState } from 'react'

// 엄선 7종목 비교 — 각 종목 리포트의 미래 모델(시나리오·가능성)을 한곳에 모았다.
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
]
const ev = (c: Co) => (c.good.p * c.good.r + c.base.p * c.base.r + c.bad.p * c.bad.r) / 100
const loss = (c: Co) => [c.good, c.base, c.bad].filter(s => s.r < 0).reduce((a, s) => a + s.p, 0)
const f1 = (v: number) => `${v.toFixed(1)}%`
const DEF: Record<string, number> = { RMS: 25, MSFT: 20, GOOGL: 15, AMZN: 15, META: 10, AAPL: 5, NKE: 10 }

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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">엄선 7종목 — 한눈에 비교 (10년, 추정)</h3>
        <p className={small}>에르메스·마이크로소프트·구글·아마존·메타·애플·나이키 — 각 종목 리포트의 미래 모델(시나리오·가능성)을 모았다. 수익률 = 이익 성장 + PER 변화 + 배당(세전). 종목 이름을 누르면 그 페이지로 간다. 2026-11-09 기준, 투자 추천이 아니다.</p>
      </div>

      <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-2.5">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 mb-1.5">가능성 반영 기대 순위</p>
        <div className="space-y-1">
          {rank.map(c => {
            const v = ev(c)
            return (
              <button key={c.key} onClick={() => onPick(c.key)} className="w-full flex items-center gap-2 text-xs text-left hover:bg-white/60 dark:hover:bg-gray-800/60 rounded px-1">
                <span className="w-24 shrink-0 text-gray-700 dark:text-gray-200">{c.name}</span>
                <span className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden"><span className={`block h-full ${c.color}`} style={{ width: `${Math.max(0, v) / 13 * 100}%` }} /></span>
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
        <p className={small}><b>왜 섞으면 좋은가:</b> 흔들리는 이유가 다르다 — 에르메스는 부자들의 소비, 마이크로소프트·구글·아마존·메타는 AI 투자 회수와 광고 경기, 애플은 값과 규제, 나이키는 브랜드 경쟁. 기본 비중(에르메스 25·마이크로소프트 20·구글 15·아마존 15·메타 10·나이키 10·애플 5%)이면 모두 나쁜 그림이어도 손실이 크지 않다. 다만 빅테크 넷은 같은 AI 흐름을 타므로 서로 완전히 다르지 않다는 점을 기억할 것. 비중은 예시이고, 지수(S&amp;P 500 등)와 함께 담는 편이 더 안전하다.</p>
      </div>
      <p className="text-[11px] text-gray-400">세후 배당은 미국 배당 15%, 프랑스 배당 약 12.8~15% 원천징수를 뺀 대략값(개인 상황에 따라 다르다). 시나리오 수익률은 각 종목 리포트의 미래 이익 모델 값(본업 이익 기준). 가능성(%)은 판단이며 신호가 나오면 다시 매긴다.</p>
    </section>
  )
}
