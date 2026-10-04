'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import WithdrawalYearsChart, { SERIES_COLORS, fmtMan } from '@/components/charts/WithdrawalYearsChart'
import { useTheme } from '@/components/ThemeProvider'
import CostToggle from '@/components/CostToggle'

interface YearStat { n: number; med_final: number; p10_final: number; worst_final: number; n_below_init: number; med_withdrawn: number; p10_withdrawn: number; med_total: number; p10_total: number; med_living_man: number; p10_living_man: number; win_vs_s0: number }
interface Full { n: number; med_irr_pct: number; p10_irr_pct: number; worst_irr_pct: number; med_withdrawn: number; n_below_init: number; med_max_dd: number; worst_max_dd: number; cash_days_pct: number; trades_per_10y: number; quick_resell_pct: number }
interface Row { name: string; desc: string; group: string; by_year: Record<string, YearStat>; full: Full }
interface Cell { i: number | null }
interface Data {
  meta: { years: number[]; episodes: { start: string; note: string }[] }
  summary: Row[]
  cohorts: ({ s: string } & Record<string, Cell | string | number>)[]
}

export const LABELS: Record<string, string> = {
  HOLD3: 'TQQQ 계속 보유', HOLD2: 'QLD 계속 보유', HOLD1: '나스닥100 계속 보유',
  E1: '200일선 1일', S0: 'S0 (200일선 15일)', S4: 'S0 + 인출 조절(GK)',
  S7: 'S0 + RSI 조기 재매수', D10GK: 'D10GK',
  T15: 'T15 (고점 −15%)', T20: 'T20 (고점 −20%)', T25: 'T25 (고점 −25%)', T30: 'T30 (고점 −30%)',
  DLEV: 'DLEV (자산별 나스닥100)', C50: 'S0 + 자산별 현금', D10C50: 'D10GK + 자산별 현금', T25C50: 'T25 + 자산별 현금',
}

const CHARTABLE = ['T25', 'T30', 'D10GK', 'S0', 'C50', 'DLEV', 'HOLD3', 'HOLD1']
const fmt = (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString('ko-KR', { maximumFractionDigits: v < 10 ? 1 : 0 })}억`

function DataLink({ s, fee }: { s: string; fee?: boolean }) {
  return (
    <Link href={`/posts/withdrawal-full-period/data?s=${s}&y=full${fee ? '&fee=1' : ''}`}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>
  )
}

export default function WithdrawalFullPeriodExplorer() {
  const { theme } = useTheme()
  const [data, setData] = useState<Data | null>(null)
  const [view, setView] = useState<string>('full')
  const [chartSel, setChartSel] = useState<string[]>(['T25', 'D10GK', 'S0', 'HOLD3'])
  const [metric, setMetric] = useState<'med_total' | 'p10_total' | 'med_living_man' | 'p10_living_man'>('med_total')

  const [withCosts, setWithCosts] = useState(true)

  useEffect(() => {
    fetch(`/data/withdrawal_full_period${withCosts ? '' : '_fee'}.json`).then(r => r.json()).then(setData)
  }, [withCosts])
  if (!data) return <div className="text-xs text-gray-400 py-10 text-center">불러오는 중…</div>

  const rows = [...data.summary].sort((a, b) => view === 'full'
    ? b.full.med_irr_pct - a.full.med_irr_pct
    : (b.by_year[view]?.med_total ?? 0) - (a.by_year[view]?.med_total ?? 0))
  const n = view === 'full' ? data.summary[0].full.n : data.summary[0].by_year[view].n
  const btn = (on: boolean) => `px-3 py-1.5 transition-colors ${on ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`

  return (
    <div>
      <CostToggle withCosts={withCosts} onChange={setWithCosts} />
      {/* ── 표 ── */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
          {['full', ...data.meta.years.map(String)].map(y => (
            <button key={y} onClick={() => setView(y)} className={btn(view === y)}>{y === 'full' ? '오늘까지' : `${y}년 시점`}</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {view === 'full'
          ? `1971~2016년에 시작해 2026-09까지 보유한 ${n}가지 경우 (10년 이상 보유). 인출 포함 연 수익률 = 10억을 넣고 매달 생활비를 꺼내 쓰고 마지막에 남은 자산까지 돌려받았을 때의 연 수익률.`
          : `시작 후 ${view}년이 지난 시점. ${view}년을 다 채운 ${n}가지 경우 (1971~${2026 - Number(view)}년 시작). 월 생활비는 그 시점에 매달 꺼내 쓰는 금액.`}
      </p>
      <div className="overflow-x-auto mb-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <th className="py-2 px-2 text-left font-medium">전략</th>
              {view === 'full' ? <>
                <th className="py-2 px-2 text-left font-medium">인출 포함 연 수익률</th>
                <th className="py-2 px-2 text-left font-medium">하위 10%</th>
                <th className="py-2 px-2 text-left font-medium">최악</th>
                <th className="py-2 px-2 text-left font-medium">남은 자산 10억 미만</th>
                <th className="py-2 px-2 text-left font-medium">최대 낙폭 (중간)</th>
                <th className="py-2 px-2 text-left font-medium">현금 기간</th>
                <th className="py-2 px-2 text-left font-medium">매매/10년</th>
                <th className="py-2 px-2 text-left font-medium">매수 직후 재매도</th>
              </> : <>
                <th className="py-2 px-2 text-left font-medium">꺼내 쓴 돈 + 남은 자산</th>
                <th className="py-2 px-2 text-left font-medium">하위 10%</th>
                <th className="py-2 px-2 text-left font-medium">꺼내 쓴 돈</th>
                <th className="py-2 px-2 text-left font-medium">남은 자산</th>
                <th className="py-2 px-2 text-left font-medium">그때 월 생활비</th>
                <th className="py-2 px-2 text-left font-medium">하위 10%</th>
                <th className="py-2 px-2 text-left font-medium">S0보다 나은 비율</th>
              </>}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => {
              const f = r.full, y = r.by_year[view]
              return (
                <tr key={r.name} className="text-gray-700 dark:text-gray-300">
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{LABELS[r.name]}</span>
                    <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">{r.group}</span>
                  </td>
                  {view === 'full' ? <>
                    <td className="py-2 px-2 font-mono font-bold text-gray-900 dark:text-white">{f.med_irr_pct}%</td>
                    <td className="py-2 px-2 font-mono">{f.p10_irr_pct}%</td>
                    <td className="py-2 px-2 font-mono">{f.worst_irr_pct}%</td>
                    <td className="py-2 px-2">{f.n_below_init}가지</td>
                    <td className="py-2 px-2 font-mono">−{f.med_max_dd}%</td>
                    <td className="py-2 px-2">{f.cash_days_pct}%</td>
                    <td className="py-2 px-2 whitespace-nowrap">{f.trades_per_10y}회</td>
                    <td className="py-2 px-2">{f.quick_resell_pct}%</td>
                  </> : <>
                    <td className="py-2 px-2 font-mono font-bold text-gray-900 dark:text-white">{fmt(y.med_total)}</td>
                    <td className="py-2 px-2 font-mono">{fmt(y.p10_total)}</td>
                    <td className="py-2 px-2 font-mono">{fmt(y.med_withdrawn)}</td>
                    <td className="py-2 px-2 font-mono">{fmt(y.med_final)}</td>
                    <td className="py-2 px-2 font-mono">{fmtMan(y.med_living_man)}</td>
                    <td className="py-2 px-2 font-mono">{fmtMan(y.p10_living_man)}</td>
                    <td className="py-2 px-2">{r.name === 'S0' ? '—' : `${y.win_vs_s0}%`}</td>
                  </>}
                  <td className="py-2 px-2"><DataLink s={r.name} fee={!withCosts} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-10">
        최대 낙폭 = 보유 기간 중 총자산이 그때까지의 최고점에서 가장 많이 줄어든 비율 (인출로 줄어든 것 포함). 매수 직후 재매도 = 매수 후 5거래일 안에 다시 판 비율.
        &lsquo;S0보다 나은 비율&rsquo;은 꺼내 쓴 돈 + 남은 자산 기준. 금액은 물가 상승을 빼지 않은 금액.
      </p>

      {/* ── 차트 ── */}
      <h3 className="text-base font-semibold mt-8 mb-2 text-gray-700 dark:text-gray-200">시간이 지나며 어떻게 벌어지나</h3>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {CHARTABLE.map(s => {
          const on = chartSel.includes(s)
          const c = SERIES_COLORS[s][theme === 'dark' ? 'dark' : 'light']
          return (
            <button key={s} onClick={() => setChartSel(on ? chartSel.filter(x => x !== s) : [...chartSel, s])}
              className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${on
                ? 'border-gray-400 dark:border-gray-500 text-gray-800 dark:text-gray-100'
                : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'}`}>
              <span className="inline-block w-3 h-0.5" style={{ background: on ? c : 'currentColor' }} />
              {LABELS[s]}
            </button>
          )
        })}
      </div>
      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium w-fit mb-2">
        <button onClick={() => setMetric('med_total')} className={btn(metric === 'med_total')}>꺼내 쓴 돈 + 남은 자산 (중간)</button>
        <button onClick={() => setMetric('p10_total')} className={btn(metric === 'p10_total')}>(하위 10%)</button>
        <button onClick={() => setMetric('med_living_man')} className={btn(metric === 'med_living_man')}>월 생활비 (중간)</button>
        <button onClick={() => setMetric('p10_living_man')} className={btn(metric === 'p10_living_man')}>(하위 10%)</button>
      </div>
      <WithdrawalYearsChart
        years={data.meta.years}
        metric={metric}
        unit={metric.includes('living') ? 'man' : 'eok'}
        series={chartSel.map(s => ({ name: s, label: LABELS[s], byYear: data.summary.find(r => r.name === s)!.by_year }))}
      />
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 mb-10">
        시작 후 N년이 지난 시점 (로그 눈금). 50년 시점은 1971~1976년 시작분 68가지뿐이라 참고만 할 것.
      </p>

      {/* ── 주요 시작 시점 ── */}
      <h3 className="text-base font-semibold mt-8 mb-2 text-gray-700 dark:text-gray-200">특정 시점에 시작했다면 — 오늘까지 인출 포함 연 수익률</h3>
      <div className="overflow-x-auto mb-2">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="py-2 px-2 text-left font-medium">시작</th>
              {['HOLD3', 'S0', 'D10GK', 'T25', 'T30', 'C50', 'T25C50'].map(s => (
                <th key={s} className="py-2 px-2 text-left font-medium whitespace-nowrap">{LABELS[s]}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.meta.episodes.map(e => {
              const c = data.cohorts.find(x => x.s === e.start)!
              const vals = ['HOLD3', 'S0', 'D10GK', 'T25', 'T30', 'C50', 'T25C50'].map(s => (c[s] as Cell).i ?? 0)
              const best = Math.max(...vals)
              return (
                <tr key={e.start} className="text-gray-700 dark:text-gray-300">
                  <td className="py-1.5 px-2 whitespace-nowrap"><span className="font-mono">{e.start}</span> <span className="text-gray-400">{e.note}</span></td>
                  {vals.map((v, i) => (
                    <td key={i} className={`py-1.5 px-2 font-mono ${v === best ? 'font-bold text-gray-900 dark:text-white' : ''}`}>{v}%</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">굵은 글씨 = 그 시작 시점에서 가장 높은 전략.</p>
    </div>
  )
}
