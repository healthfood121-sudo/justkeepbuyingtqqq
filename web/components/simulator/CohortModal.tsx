'use client'

import { useState } from 'react'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { CohortDetail } from '@/lib/backtest'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const STRATEGY_COLORS = { A: '#10b981', B: '#f59e0b', C: '#3b82f6' }
const STRATEGY_LABELS = { A: 'A전략 (계속적립)', B: 'B전략 (매입액한도)', C: 'C전략 (3년분할)' }

export default function CohortModal({
  details,
  targetAmount,
  initialVis,
  onClose,
}: {
  details: { A: CohortDetail; B: CohortDetail; C: CohortDetail }
  targetAmount: number
  initialVis: Record<'A' | 'B' | 'C', boolean>
  onClose: () => void
}) {
  const [vis, setVis] = useState<Record<'A' | 'B' | 'C', boolean>>(initialVis)
  const toggleVis = (s: 'A' | 'B' | 'C') => setVis(prev => ({ ...prev, [s]: !prev[s] }))

  const startDate = details.A.startDate
  const fmt = (v: number) => v >= 1e8 ? `${(v / 1e8).toFixed(1)}억` : `${Math.round(v / 1e4).toLocaleString()}만`
  const fmtY = (y: number | null) => y == null ? '진행중' : `${y.toFixed(1)}년`

  const maxLen = Math.max(details.A.snapshots.length, details.B.snapshots.length, details.C.snapshots.length)
  const labels = Array.from({ length: maxLen }, (_, i) =>
    i % 12 === 0 ? `${i / 12}년` : ''
  )

  const datasets = (['A', 'B', 'C'] as const)
    .filter(s => vis[s])
    .map(s => ({
      label: STRATEGY_LABELS[s],
      data: details[s].snapshots.map(p => p.value / 1e8),
      borderColor: STRATEGY_COLORS[s],
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.1,
    }))

  const refStrategy = (['A', 'B', 'C'] as const).find(s => vis[s])
  if (refStrategy) {
    datasets.push({
      label: '누적 투자금',
      data: details[refStrategy].snapshots.map(p => p.cumInvest / 1e8),
      borderColor: '#d1d5db',
      backgroundColor: 'transparent',
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.1,
    } as any)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: {
        ticks: { color: '#6b7280', font: { size: 10 }, maxRotation: 0 },
        grid: { color: '#f3f4f6' },
      },
      y: {
        title: { display: true, text: '억원', color: '#9ca3af', font: { size: 11 } },
        ticks: { color: '#6b7280', font: { size: 11 } },
        grid: { color: '#f3f4f6' },
      },
    },
    plugins: {
      legend: { labels: { color: '#6b7280', font: { size: 11 }, usePointStyle: true } },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex ?? 0
            const snap = details.A.snapshots[idx]
            if (!snap) return ''
            const d = snap.date
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')} (${(idx/12).toFixed(1)}년차)`
          },
          label: (ctx: any) => {
            if (ctx.dataset.label?.includes('누적')) return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억`
            const s = (['A','B','C'] as const).find(k => STRATEGY_LABELS[k] === ctx.dataset.label)
            const detail = s ? details[s] : null
            const snap = detail?.snapshots[ctx.dataIndex]
            if (!snap) return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억`
            return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}억 (투자 ${(snap.cumInvest/1e8).toFixed(2)}억)`
          },
        },
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        titleColor: '#374151',
        bodyColor: '#374151',
        padding: 10,
      },
    },
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              코호트 상세 — {startDate.getFullYear()}-{String(startDate.getMonth()+1).padStart(2,'0')} 시작
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">목표: {fmt(targetAmount)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-light">✕</button>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(['A', 'B', 'C'] as const).map(s => {
              const d = details[s]
              const on = vis[s]
              return (
                <button
                  key={s}
                  onClick={() => toggleVis(s)}
                  className={`rounded-xl border px-3 py-3 text-center text-left transition-opacity cursor-pointer select-none ${on ? 'opacity-100' : 'opacity-35'}`}
                  style={{ borderColor: STRATEGY_COLORS[s] + '60', backgroundColor: STRATEGY_COLORS[s] + '10' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold" style={{ color: STRATEGY_COLORS[s] }}>{STRATEGY_LABELS[s]}</p>
                    {!on && <span className="text-xs text-gray-400">숨김</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">소요기간</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtY(d.yearsToTarget)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">총 투자금</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(d.accumulatedInvestment)}</p>
                  {d.endDate && (
                    <>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">달성일</p>
                      <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {d.endDate.getFullYear()}-{String(d.endDate.getMonth()+1).padStart(2,'0')}
                      </p>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ height: 300 }}>
            <Line data={{ labels, datasets }} options={options} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1 mb-2">
            회색 점선: 누적 투자금 · 목표 달성 시 해당 전략 선 종료
          </p>
        </div>
      </div>
    </div>
  )
}
