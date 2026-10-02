'use client'

import { useState, useEffect } from 'react'

type MetricKey = 'survival' | 'avg_wd' | 'med' | 'avg_cagr'

interface VrRow {
  g: number; p: number; r: number
  survival: number; insolvent: number
  med: number; avg: number; p25: number; p75: number
  avg_wd: number; avg_cagr: number
}

interface S0Stats {
  survival: number; insolvent: number
  med: number; avg: number; p25: number; p75: number
  avg_wd: number; avg_cagr: number
}

interface VrSweepData {
  meta: {
    n_cohorts: number
    g_values: number[]
    p_ratios: number[]
    monthly_rates: number[]
  }
  s0: S0Stats
  vr: VrRow[]
}

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'survival', label: '인출 유지율',      unit: '%' },
  { key: 'avg_wd',   label: '평균 인출 총액',   unit: '억' },
  { key: 'med',      label: '중앙값 최종 자산', unit: '억' },
  { key: 'avg_cagr', label: '연평균 수익률',    unit: '%' },
]

const RATE_LABELS: Record<number, string> = {
  5:  '월 0.5% (연 6%)',
  10: '월 1.0% (연 12%)',
  15: '월 1.5% (연 18%)',
}

// 값 → 배경 RGBA (빨강→노랑→초록)
function heatColor(pct: number): string {
  const p = Math.min(1, Math.max(0, pct))
  let r: number, g: number
  if (p < 0.5) {
    r = 210; g = Math.round(180 * p * 2)
  } else {
    r = Math.round(210 * (1 - p) * 2); g = 150
  }
  const alpha = 0.2 + p * 0.4
  return `rgba(${r}, ${g}, 30, ${alpha})`
}

export default function VrHeatmap() {
  const [data, setData]     = useState<VrSweepData | null>(null)
  const [rate, setRate]     = useState(10)
  const [metric, setMetric] = useState<MetricKey>('survival')

  useEffect(() => {
    fetch('/data/vr_sweep.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return <div className="py-12 text-center text-sm text-gray-400">데이터 로딩 중...</div>
  }

  const { g_values, p_ratios } = data.meta
  const s0 = data.s0

  const getCell = (g: number, p: number) =>
    data.vr.find(x => x.g === g && x.p === p && x.r === rate)

  // 현재 인출률 + 지표에서 최댓값 (색상 기준)
  const maxVal = (() => {
    if (metric === 'survival') return 100
    const vals = data.vr.filter(x => x.r === rate).map(x => x[metric] as number)
    return Math.max(...vals, 1)
  })()

  const s0Val = s0[metric] as number

  const fmtVal = (v: number) =>
    metric === 'survival' || metric === 'avg_cagr'
      ? `${v.toFixed(0)}%`
      : `${v.toFixed(0)}`

  const metaInfo = METRICS.find(m => m.key === metric)!

  return (
    <div>
      {/* 인출률 탭 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {data.meta.monthly_rates.map(r => (
          <button
            key={r}
            onClick={() => setRate(r)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              rate === r
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            {RATE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* 지표 선택 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              metric === m.key
                ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* EMA200 기준선 */}
      <div className="mb-5 text-sm bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg px-4 py-2.5 inline-block">
        <span className="text-gray-500 dark:text-gray-400">EMA200 기준선:</span>{' '}
        <strong className="text-blue-700 dark:text-blue-300">
          {fmtVal(s0Val)}{metaInfo.unit}
        </strong>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
          (히트맵 색상 기준 = 이 수치 대비)
        </span>
      </div>

      {/* 히트맵 */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-gray-400 dark:text-gray-500 font-medium min-w-[64px]">
                P ↓ / G →
              </th>
              {g_values.map(g => (
                <th
                  key={g}
                  className="px-2 py-2 text-gray-500 dark:text-gray-400 font-normal text-center min-w-[52px]"
                >
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...p_ratios].reverse().map(p => (
              <tr key={p}>
                <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                  P={p}%
                </td>
                {g_values.map(g => {
                  const cell = getCell(g, p)
                  if (!cell) return (
                    <td key={g} className="px-2 py-1.5 text-center text-gray-300 dark:text-gray-700">—</td>
                  )
                  const val = cell[metric] as number
                  const bg  = heatColor(val / maxVal)
                  return (
                    <td
                      key={g}
                      className="px-2 py-1.5 text-center font-mono text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800/60"
                      style={{ backgroundColor: bg }}
                      title={[
                        `G=${g}, P=${p}%, ${RATE_LABELS[rate]}`,
                        `인출 유지율: ${cell.survival}%`,
                        `인출 총액(평균): ${cell.avg_wd}억`,
                        `중앙값 최종: ${cell.med}억`,
                        `연평균 수익률: ${cell.avg_cagr}%`,
                      ].join('\n')}
                    >
                      {fmtVal(val)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        행 = 초기 Pool 비율(P), 열 = G 설정값 | 마우스를 셀 위에 올리면 전체 지표 표시
      </p>

      {/* 요약 테이블 */}
      <div className="mt-8 overflow-x-auto">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
          인출률 {RATE_LABELS[rate]} — 전체 72가지 조합 요약
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {['G', 'Pool', '인출유지율', '인출총액', '중앙값', '연수익률'].map(h => (
                <th key={h} className="py-2 px-3 text-left text-gray-500 dark:text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.vr
              .filter(x => x.r === rate)
              .sort((a, b) => b.survival - a.survival || b.med - a.med)
              .slice(0, 15)
              .map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-1.5 px-3 font-mono text-gray-600 dark:text-gray-400">{row.g}</td>
                  <td className="py-1.5 px-3 font-mono text-gray-600 dark:text-gray-400">{row.p}%</td>
                  <td className="py-1.5 px-3 font-mono text-gray-700 dark:text-gray-300">{row.survival}%</td>
                  <td className="py-1.5 px-3 font-mono text-gray-700 dark:text-gray-300">{row.avg_wd}억</td>
                  <td className="py-1.5 px-3 font-mono text-gray-700 dark:text-gray-300">{row.med}억</td>
                  <td className="py-1.5 px-3 font-mono text-gray-700 dark:text-gray-300">{row.avg_cagr}%</td>
                </tr>
              ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">인출 유지율 높은 순, 상위 15개 표시</p>
      </div>
    </div>
  )
}
