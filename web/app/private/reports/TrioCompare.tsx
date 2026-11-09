'use client'

import { useState } from 'react'

// 에르메스·구글·나이키 3종목 비교 — 각 종목 페이지의 미래 모델(시나리오·가능성)을 한곳에 모았다.
type Sc = { p: number; r: number }
type Co = { key: string; name: string; price: string; pe: string; earn: string; div: number; divNet: number
  good: Sc; base: Sc; bad: Sc; risk: string; next: string; signal: string; color: string }

const COS: Co[] = [
  { key: 'RMS', name: '에르메스', price: '약 1,290~1,360유로', pe: '약 31배 (2021~2023년 45~66배)', earn: '보합 — 성장 둔화(2026년 3분기 +4.3%)', div: 1.3, divNet: 1.1,
    good: { p: 20, r: 14.9 }, base: { p: 55, r: 10.4 }, bad: { p: 25, r: 4.0 },
    risk: '성장 속도 — 중국 부자 소비, 공방·장인 증가 속도(가죽 생산 연 5~7% 상한)', next: '2027년 2월 연간 실적', signal: '가죽 성장 +8% 이상, 아시아(일본 제외) 플러스 복귀', color: 'bg-orange-500' },
  { key: 'GOOGL', name: '구글(알파벳)', price: '약 283달러', pe: '본업 약 26배 (10년 평소 26.5배)', earn: '증가 — 매출 +25%, 클라우드 +103%', div: 0.3, divNet: 0.26,
    good: { p: 25, r: 19.1 }, base: { p: 55, r: 11.7 }, bad: { p: 20, r: -4.1 },
    risk: 'AI 답변이 검색 광고를 잠식, 규제(애플 검색 계약), 설비투자 회수', next: '2027년 2월 실적', signal: '검색 +10% 이상, 클라우드 +30% 이상, 2027년 설비투자 규모', color: 'bg-blue-500' },
  { key: 'NKE', name: '나이키', price: '약 38달러', pe: '18배 (10년 평소 32배, 내년 이익 기준 약 30배)', earn: '감소 — 바닥은 2027 회계연도(회사 전망)', div: 4.3, divNet: 3.7,
    good: { p: 25, r: 19.1 }, base: { p: 45, r: 10.9 }, bad: { p: 30, r: -0.6 },
    risk: '브랜드 회복 실패 — 온·호카 등에 러닝·젊은 층을 계속 빼앗김, 중국', next: '11월 16~17일 투자자의 날(5년 목표), 12월 실적', signal: '분기 매출 플러스, 공식몰 할인 비중 50% → 40% 아래, 매출총이익률 회복', color: 'bg-gray-700' },
]
const ev = (c: Co) => (c.good.p * c.good.r + c.base.p * c.base.r + c.bad.p * c.bad.r) / 100
const loss = (c: Co) => [c.good, c.base, c.bad].filter(s => s.r < 0).reduce((a, s) => a + s.p, 0)
const f1 = (v: number) => `${v > 0 ? '' : ''}${v.toFixed(1)}%`

export default function TrioCompare({ onPick }: { onPick: (key: string) => void }) {
  const [w, setW] = useState<Record<string, number>>({ RMS: 35, GOOGL: 40, NKE: 25 })
  const tot = COS.reduce((a, c) => a + (w[c.key] ?? 0), 0) || 1
  const mix = (f: (c: Co) => number) => COS.reduce((a, c) => a + f(c) * (w[c.key] ?? 0), 0) / tot
  const th = 'py-1.5 px-2 font-medium text-gray-400 text-left whitespace-nowrap'
  const td = 'py-1.5 px-2 text-gray-700 dark:text-gray-200 align-top'
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  return (
    <section className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 p-3 sm:p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">에르메스 · 구글 · 나이키 — 한눈에 비교 (10년, 추정)</h3>
        <p className={small}>각 종목 페이지의 미래 모델(시나리오·가능성)을 모았다. 수익률 = 이익 성장 + PER 변화 + 배당(세전). 종목 이름을 누르면 그 페이지로 간다. 2026-11-09 기준, 투자 추천이 아니다.</p>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-xs">
        <thead><tr className="border-b border-gray-200 dark:border-gray-800"><th className={th}></th>{COS.map(c => <th key={c.key} className={th}><button onClick={() => onPick(c.key)} className="hover:underline text-blue-600 dark:text-blue-400">{c.name}</button></th>)}</tr></thead>
        <tbody>
          {([
            ['지금 값', (c: Co) => c.price], ['PER', (c: Co) => c.pe], ['이익 방향', (c: Co) => c.earn],
            ['배당 (세후, 한국 거주자 대략)', (c: Co) => `${c.div}% (약 ${c.divNet}%)`],
            ['좋은 그림', (c: Co) => `연 ${f1(c.good.r)} (${c.good.p}%)`], ['기본 그림', (c: Co) => `연 ${f1(c.base.r)} (${c.base.p}%)`], ['나쁜 그림', (c: Co) => `연 ${f1(c.bad.r)} (${c.bad.p}%)`],
            ['가능성 반영 기대', (c: Co) => `연 약 ${ev(c).toFixed(1)}%`], ['손실 가능성', (c: Co) => loss(c) ? `약 ${loss(c)}%` : '없음'],
            ['가장 큰 위험', (c: Co) => c.risk], ['다음 확인', (c: Co) => c.next], ['좋아진다는 신호', (c: Co) => c.signal],
          ] as [string, (c: Co) => string][]).map(([k, fn]) => (
            <tr key={k} className="border-b border-gray-100 dark:border-gray-900">
              <td className={`${td} font-medium whitespace-nowrap text-gray-500`}>{k}</td>
              {COS.map(c => <td key={c.key} className={`${td} ${k === '가능성 반영 기대' ? 'font-semibold' : ''}`}>{fn(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table></div>

      <div className="grid sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-orange-50/70 dark:bg-orange-950/20 p-2.5"><b>에르메스 = 바닥이 가장 높다.</b> 세 그림 모두 플러스. 대신 위쪽(좋은 그림)도 가장 낮다 — 확실성을 사는 몫.</div>
        <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 p-2.5"><b>구글 = 기대값이 가장 높다.</b> 이익이 이미 늘고 있어 기본 그림 가능성이 크다. 대신 AI가 검색을 갉아먹으면 손실.</div>
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800/60 p-2.5"><b>나이키 = 회복 베팅 + 배당.</b> 배당 4.3%가 바닥을 받친다. 이익이 아직 바닥 전이라 기본 그림 가능성이 가장 낮다(모델이 내년 바닥을 반영하지 않아 실제 기대는 8.5~9.5%).</div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">세 종목을 섞으면 — 비중을 바꿔 보기</p>
        <div className="flex flex-wrap gap-3">
          {COS.map(c => (
            <label key={c.key} className="flex items-center gap-1.5 text-xs">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.color}`} />{c.name}
              <input type="number" min={0} max={100} value={w[c.key]} onChange={e => setW({ ...w, [c.key]: Math.max(0, Number(e.target.value) || 0) })}
                className="w-14 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1 py-0.5 text-right" />%
            </label>
          ))}
        </div>
        <div className="flex h-2.5 rounded-full overflow-hidden">{COS.map(c => <div key={c.key} className={c.color} style={{ width: `${(w[c.key] ?? 0) / tot * 100}%` }} />)}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[['가능성 반영 기대', `연 약 ${mix(ev).toFixed(1)}%`], ['셋 다 좋은 그림', `연 약 ${mix(c => c.good.r).toFixed(1)}%`], ['셋 다 기본 그림', `연 약 ${mix(c => c.base.r).toFixed(1)}%`], ['셋 다 나쁜 그림(최악)', `연 약 ${mix(c => c.bad.r).toFixed(1)}%`]].map(([k, v]) => (
            <div key={k}><p className="text-[11px] text-gray-400">{k}</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{v}</p></div>
          ))}
        </div>
        <p className={small}><b>왜 섞으면 좋은가:</b> 세 회사는 흔들리는 이유가 다르다 — 에르메스는 부자들의 소비, 구글은 AI·광고 경기·규제, 나이키는 브랜드 경쟁. 셋이 동시에 나쁜 그림이 될 가능성은 낮고, 그래도 셋 다 나쁜 그림이면 기본 비중(구글 40·에르메스 35·나이키 25%)에서 연 약 −0.4%로 거의 본전이다. 기대값은 한 종목만 들 때와 비슷하면서 바닥이 올라간다. 나이키는 투자자의 날·분기 매출 신호를 보며 나눠 사는 몫으로 두는 것을 권한다. 비중은 예시이고, 지수(S&amp;P 500 등)와 함께 담는 편이 더 안전하다.</p>
      </div>
      <p className="text-[11px] text-gray-400">세후 배당은 미국 배당 15%, 프랑스 배당 약 12.8~15% 원천징수를 뺀 대략값(개인 상황에 따라 다르다). 시나리오 수익률은 각 종목 페이지의 미래 모델 값 — 구글은 지금 주가(약 283달러) 기준. 가능성(%)은 판단이며 신호가 나오면 다시 매긴다.</p>
    </section>
  )
}
