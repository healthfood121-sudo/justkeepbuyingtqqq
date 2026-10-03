'use client'

import { useEffect, useState } from 'react'

type Mode = 'loc' | 'next' | 'same'
type Horizon = 'today' | 'y30' | 'y20'

interface HStat { n: number; med_final: number; p10_final: number; n_below_init: number; win_vs_s0: number }
interface TStat { n: number; med_ann_pct: number; p10_ann_pct: number; n_below_init: number; cash_days_pct: number; trades_per_10y: number }
interface Row { name: string; y20: HStat; y30: HStat; today: TStat }
interface Robust { name: string; mode: Mode; d1: { med_ann_pct: number }; d2: { med_ann_pct: number }; d3: { med_ann_pct: number }; y20_med_by_delay: number[] }
interface Data { summary: Record<Mode, Row[]>; robust: Robust[] }

const LABEL: Record<string, string> = {
  S0:     'S0 — 200일선 15일',
  T25:    'T25 — 1년 고점 −25%',
  D10GK:  'D10GK — S0 + 조기 재매수',
  C50:    'S0 + 자산별 현금 비중',
  D10C50: 'D10GK + 자산별 현금 비중',
  Q50:    'DLEV — 자산 커지면 나스닥100',
}

const MODES: { key: Mode; label: string; note: string }[] = [
  { key: 'loc',  label: '실제로 가능한 방식', note: '신호는 다음 거래일에 매매. D10GK의 조기 재매수만 LOC 주문으로 당일 종가.' },
  { key: 'next', label: '전부 다음날',       note: '모든 매매를 신호 다음 거래일 종가에. D10GK도 LOC를 쓰지 않는 경우.' },
  { key: 'same', label: '신호 당일 (불가능)', note: '신호가 뜬 그날 종가에 매매. 종가가 확정돼야 신호를 알 수 있어 실제로는 불가능 — 초기 연구의 가정.' },
]

const HORIZONS: { key: Horizon; label: string }[] = [
  { key: 'today', label: '오늘까지 보유' },
  { key: 'y30',   label: '30년' },
  { key: 'y20',   label: '20년' },
]

function Seg<T extends string>({ items, value, onChange }: { items: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
      {items.map(it => (
        <button key={it.key} onClick={() => onChange(it.key)}
          className={`px-3 py-1.5 transition-colors ${value === it.key ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
          {it.label}
        </button>
      ))}
    </div>
  )
}

export default function WithdrawalExecTable() {
  const [data, setData] = useState<Data | null>(null)
  const [mode, setMode] = useState<Mode>('loc')
  const [hz, setHz] = useState<Horizon>('today')

  useEffect(() => {
    fetch('/data/withdrawal_exec_horizon_v2.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>

  const rows = [...data.summary[mode]].sort((a, b) =>
    hz === 'today' ? b.today.med_ann_pct - a.today.med_ann_pct : b[hz].med_final - a[hz].med_final)
  const n = hz === 'today' ? rows[0].today.n : rows[0][hz].n

  const headers = hz === 'today'
    ? ['전략', '연평균 수익률 (중간)', '하위 10%', '원금 미만', '현금 기간', '매매/10년']
    : ['전략', '최종 자산 (중간)', '하위 10%', '원금 미만', 'S0보다 나은 비율']

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap gap-2 mb-2">
        <Seg items={MODES} value={mode} onChange={setMode} />
        <Seg items={HORIZONS} value={hz} onChange={setHz} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {MODES.find(m => m.key === mode)!.note}{' '}
        {hz === 'today'
          ? `1971~2016년 매달 시작한 ${n}가지 경우를 2026-09까지 보유 (10년 이상 보유한 경우만).`
          : `${hz === 'y30' ? 30 : 20}년을 다 채운 ${n}가지 시작 시점.`}
        {' '}초기 10억 · 스왑금리 · 모든 매도 양도세 22% 반영.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map(h => <th key={h} className="py-2 px-2 text-left text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => {
              const t = r.today, h = hz === 'today' ? null : r[hz]
              return (
                <tr key={r.name}>
                  <td className="py-2 px-2 text-gray-800 dark:text-gray-200 whitespace-nowrap">{LABEL[r.name] ?? r.name}</td>
                  {h ? <>
                    <td className="py-2 px-2 font-mono font-bold text-gray-900 dark:text-white">{h.med_final.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억</td>
                    <td className="py-2 px-2 font-mono text-gray-600 dark:text-gray-300">{h.p10_final.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억</td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-300">{h.n_below_init}가지</td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-300">{r.name === 'S0' ? '—' : `${h.win_vs_s0}%`}</td>
                  </> : <>
                    <td className="py-2 px-2 font-mono font-bold text-gray-900 dark:text-white">{t.med_ann_pct}%</td>
                    <td className="py-2 px-2 font-mono text-gray-600 dark:text-gray-300">{t.p10_ann_pct}%</td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-300">{t.n_below_init}가지</td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-300">{t.cash_days_pct}%</td>
                    <td className="py-2 px-2 text-gray-600 dark:text-gray-300">{t.trades_per_10y}회</td>
                  </>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {hz === 'y20' && mode !== 'same' && (
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-3 leading-relaxed">
          20년 중간값은 매매를 하루 이틀 늦게 하는 것만으로도 크게 흔들린다 (예: T25 {data.robust.find(x => x.name === 'T25')?.y20_med_by_delay.map(v => `${Math.round(v)}억`).join(' / ')} — 1·2·3일 뒤 실행).
          여러 시작 시점이 같은 큰 폭락을 공유하기 때문이다. 전략 비교는 &lsquo;오늘까지 보유&rsquo;를 기준으로 보는 것이 안정적이다.
        </p>
      )}
      {hz === 'today' && mode !== 'same' && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
          매매를 1·2·3거래일 늦게 해도 연평균 수익률은 비슷하다:{' '}
          {data.robust.map(x => `${LABEL[x.name]?.split(' —')[0] ?? x.name} ${x.d1.med_ann_pct}/${x.d2.med_ann_pct}/${x.d3.med_ann_pct}%`).join(' · ')}.
          모든 금액은 물가 상승을 빼지 않은 금액이다.
        </p>
      )}
    </div>
  )
}
