'use client'

import { useState } from 'react'
import Link from 'next/link'
import nkeData from '@/public/data/rolling/NKE_rolling.json'
import rmsData from '@/public/data/rolling/RMS_rolling.json'

type StockData = typeof nkeData

const STOCKS = [
  { key: 'NKE', data: nkeData as StockData },
  { key: 'RMS', data: rmsData as StockData },
]

function cagrColor(cagr: number, isComplete: boolean) {
  if (!isComplete) return 'text-gray-400 dark:text-gray-500'
  if (cagr < 0)  return 'text-red-500 dark:text-red-400'
  if (cagr < 10) return 'text-orange-500 dark:text-orange-400'
  if (cagr < 15) return 'text-yellow-600 dark:text-yellow-400'
  if (cagr < 20) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-blue-600 dark:text-blue-400'
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

function RollingTable({ data }: { data: StockData }) {
  const rows = data.rows10y
  const comp = rows.filter(r => r.isComplete)
  const prog = rows.filter(r => !r.isComplete)
  const s = data.stats

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="완결 구간" value={`${s.n}개`} />
        <StatCard label="중앙값 CAGR" value={`${s.median}%`} />
        <StatCard label="최저" value={`${s.min}% (${s.minBuy}년)`} />
        <StatCard label="최고" value={`${s.max}% (${s.maxBuy}년)`} />
        <StatCard label="연 10% 초과" value={`${s.over10}%`} />
        <StatCard label="연 15% 초과" value={`${s.over15}%`} />
        <StatCard label="연 20% 초과" value={`${s.over20}%`} />
        <StatCard label="손실 구간" value={`${s.losses}개`} />
        {s.beatBench != null && (
          <StatCard label="S&P 500 이긴 구간" value={`${s.beatBench} / ${s.beatTotal}개`} />
        )}
        <StatCard
          label="전체 기간 CAGR"
          value={`${data.fullPeriod.cagr}% (${data.fullPeriod.multiple}x)`}
        />
      </div>

      {data.note && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2">
          ⚠ {data.note}
        </p>
      )}

      {/* 완결 구간 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <th className="text-left py-2 pr-4 font-medium">매수 연도</th>
              <th className="text-left py-2 pr-4 font-medium">평가 연도</th>
              <th className="text-right py-2 pr-4 font-medium">CAGR</th>
              <th className="text-right py-2 pr-4 font-medium">배수</th>
              <th className="text-right py-2 pr-4 font-medium">S&P 500</th>
              <th className="text-right py-2 font-medium">차이</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {comp.map(r => (
              <tr key={r.buyYear} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-1.5 pr-4 text-gray-700 dark:text-gray-300">{r.buyYear}</td>
                <td className="py-1.5 pr-4 text-gray-700 dark:text-gray-300">{r.sellYear}</td>
                <td className={`py-1.5 pr-4 text-right font-semibold tabular-nums ${cagrColor(r.cagr, true)}`}>
                  {r.cagr.toFixed(1)}%
                </td>
                <td className="py-1.5 pr-4 text-right tabular-nums text-gray-600 dark:text-gray-400">
                  {r.multiple.toFixed(1)}x
                </td>
                <td className="py-1.5 pr-4 text-right tabular-nums text-gray-500 dark:text-gray-500">
                  {'benchCagr' in r ? `${(r as any).benchCagr.toFixed(1)}%` : '—'}
                </td>
                <td className={`py-1.5 text-right tabular-nums font-medium ${'diff' in r ? ((r as any).diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400') : 'text-gray-400'}`}>
                  {'diff' in r ? `${(r as any).diff > 0 ? '+' : ''}${(r as any).diff.toFixed(1)}pp` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 진행 중 구간 */}
      {prog.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">
            진행 중 (10년 미완료)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {prog.map(r => (
                  <tr key={r.buyYear} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-1.5 pr-4 text-gray-400 dark:text-gray-500">
                      {r.buyYear} → {r.sellDate.slice(0, 7)} ({r.yearsActual}년)
                    </td>
                    <td className={`py-1.5 pr-4 text-right font-semibold tabular-nums ${cagrColor(r.cagr, false)}`}>
                      {r.cagr.toFixed(1)}%
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-gray-400 dark:text-gray-500">
                      {r.multiple.toFixed(2)}x
                    </td>
                    <td className="py-1.5 pr-4 text-right tabular-nums text-gray-400">
                      {'benchCagr' in r ? `S&P ${(r as any).benchCagr.toFixed(1)}%` : ''}
                    </td>
                    <td className={`py-1.5 text-right tabular-nums ${'diff' in r ? ((r as any).diff > 0 ? 'text-emerald-500' : 'text-red-400') : 'text-gray-400'}`}>
                      {'diff' in r ? `${(r as any).diff > 0 ? '+' : ''}${(r as any).diff.toFixed(1)}pp` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 색상 범례 */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-blue-600 dark:text-blue-400">■ 20%+</span>
        <span className="text-emerald-600 dark:text-emerald-400">■ 15~20%</span>
        <span className="text-yellow-600 dark:text-yellow-400">■ 10~15%</span>
        <span className="text-orange-500 dark:text-orange-400">■ 0~10%</span>
        <span className="text-red-500 dark:text-red-400">■ 손실</span>
        <span className="text-gray-400 dark:text-gray-500">■ 진행 중</span>
      </div>
    </div>
  )
}

export default function PrivatePage() {
  const [activeStock, setActiveStock] = useState(0)
  const current = STOCKS[activeStock]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            개별 종목 분석
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            10년 보유 시 연환산 수익률 (연말 매수 기준, 배당 재투자)
          </p>
        </div>

        {/* 종목 탭 + 추가 버튼 */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
          {STOCKS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setActiveStock(i)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeStock === i
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {s.data.ticker} <span className="text-xs font-normal opacity-70">({s.data.name})</span>
            </button>
          ))}
          <span className="ml-2 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-600 border border-dashed border-gray-300 dark:border-gray-700 rounded cursor-default">
            + 종목 추가 예정
          </span>
        </div>

        {/* 종목 이름 + 화폐 */}
        <div className="flex items-baseline gap-2 mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {current.data.name} ({current.data.ticker})
          </h2>
          <span className="text-xs text-gray-400">{current.data.currency}</span>
          <span className="text-xs text-gray-400">벤치마크: {current.data.benchmark}</span>
        </div>

        <RollingTable data={current.data} />

      </div>
    </div>
  )
}
