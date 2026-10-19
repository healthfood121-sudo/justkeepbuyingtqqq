'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import nkeData   from '@/public/data/rolling/NKE_rolling.json'
import rmsData   from '@/public/data/rolling/RMS_rolling.json'
import aaplData  from '@/public/data/rolling/AAPL_rolling.json'
import costData  from '@/public/data/rolling/COST_rolling.json'
import koData    from '@/public/data/rolling/KO_rolling.json'
import googlData from '@/public/data/rolling/GOOGL_rolling.json'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

type StockData = typeof nkeData

const STOCKS: Array<{ key: string; data: StockData }> = [
  { key: 'AAPL',  data: aaplData  as StockData },
  { key: 'RMS',   data: rmsData   as StockData },
  { key: 'COST',  data: costData  as StockData },
  { key: 'GOOGL', data: googlData as StockData },
  { key: 'NKE',   data: nkeData   as StockData },
  { key: 'KO',    data: koData    as StockData },
]

// ── 색상 유틸 ───────────────────────────────────────────────
function cagrBarColor(cagr: number, isComplete: boolean) {
  if (!isComplete) return 'rgba(148,163,184,0.35)'
  if (cagr < 0)  return 'rgba(239,68,68,0.75)'
  if (cagr < 10) return 'rgba(249,115,22,0.75)'
  if (cagr < 15) return 'rgba(234,179,8,0.75)'
  if (cagr < 20) return 'rgba(16,185,129,0.75)'
  return 'rgba(59,130,246,0.85)'
}
function cagrTextColor(cagr: number, isComplete: boolean) {
  if (!isComplete) return 'text-gray-400 dark:text-gray-500'
  if (cagr < 0)  return 'text-red-500'
  if (cagr < 10) return 'text-orange-500'
  if (cagr < 15) return 'text-yellow-600 dark:text-yellow-400'
  if (cagr < 20) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-blue-600 dark:text-blue-400'
}
function fmtTotalReturn(multiple: number) {
  const pct = (multiple - 1) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`
}
function epsGrowthColor(pct: number) {
  if (pct >= 15) return 'text-blue-600 dark:text-blue-400'
  if (pct >= 10) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 5)  return 'text-yellow-600 dark:text-yellow-400'
  if (pct >= 0)  return 'text-orange-500 dark:text-orange-400'
  return 'text-red-500 dark:text-red-400'
}

// ── 롤링 차트 ────────────────────────────────────────────────
function RollingChart({ data }: { data: StockData }) {
  const chartRef = useRef<ChartJS | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)

  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => {
      ChartJS.register(z)
      setPluginLoaded(true)
    })
  }, [])

  const rows = data.rows10y.filter(r => r.isComplete || r.yearsActual >= 9)
  const labels = rows.map(r => String(r.buyYear))
  const barColors = rows.map(r => cagrBarColor(r.cagr, r.isComplete))

  const sp500Points = rows.map(r =>
    'benchCagr' in r && r.benchCagr != null ? (r as any).benchCagr : null
  )

  // 가로선 플러그인 (0%, 10%, 15%, 20%)
  const refLinesPlugin = {
    id: 'refLines',
    afterDraw(chart: ChartJS) {
      const { ctx, scales: { y }, chartArea } = chart as any
      const lines = [
        { val: 0,  color: 'rgba(100,100,100,0.5)', dash: [4,4],  label: '0%' },
        { val: 10, color: 'rgba(16,185,129,0.4)',  dash: [3,3],  label: '10%' },
        { val: 15, color: 'rgba(234,179,8,0.4)',   dash: [3,3],  label: '15%' },
        { val: 20, color: 'rgba(59,130,246,0.4)',  dash: [3,3],  label: '20%' },
      ]
      ctx.save()
      lines.forEach(({ val, color, dash, label }) => {
        const yPx = y.getPixelForValue(val)
        if (yPx < chartArea.top || yPx > chartArea.bottom) return
        ctx.beginPath()
        ctx.setLineDash(dash)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.moveTo(chartArea.left, yPx)
        ctx.lineTo(chartArea.right, yPx)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = color.replace('0.4', '0.7').replace('0.5', '0.7')
        ctx.font = '10px sans-serif'
        ctx.fillText(label, chartArea.right + 4, yPx + 3)
      })
      ctx.restore()
    },
  }

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: data.ticker,
        data: rows.map(r => r.cagr),
        backgroundColor: barColors,
        borderColor: barColors.map(c => c.replace(/[\d.]+\)$/, '1)')),
        borderWidth: 0.5,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'S&P 500',
        data: sp500Points,
        borderColor: 'rgba(249,115,22,0.9)',
        backgroundColor: 'rgba(249,115,22,0.9)',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 1.5,
        spanGaps: false,
        order: 1,
      },
    ],
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 32 } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxRotation: 45 },
      },
      y: {
        ticks: {
          font: { size: 11 },
          callback: (v: number) => `${v}%`,
        },
        grid: { color: 'rgba(128,128,128,0.1)' },
      },
    },
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}%`,
          afterLabel: (ctx: any) => {
            const r = rows[ctx.dataIndex]
            if (ctx.datasetIndex === 0) {
              const extra = r.isComplete
                ? `${r.buyYear}→${r.sellYear}  ${fmtTotalReturn(r.multiple)}`
                : `진행 중 (${r.yearsActual}년 경과)`
              return extra
            }
            return ''
          },
        },
      },
      zoom: pluginLoaded ? {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      } : {},
    },
    plugins_extra: [refLinesPlugin],
  }

  return (
    <div className="relative">
      <button
        onClick={() => (chartRef.current as any)?.resetZoom?.()}
        className="absolute top-0 right-0 z-10 px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded"
      >
        줌 초기화
      </button>
      <div style={{ height: 320 }}>
        <Chart
          ref={chartRef as any}
          type="bar"
          data={chartData}
          options={options}
          plugins={[refLinesPlugin]}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">
        휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동
      </p>
    </div>
  )
}

// ── 요약 카드 ────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2.5">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  )
}

// ── 롤링 테이블 ──────────────────────────────────────────────
function RollingTable({ data }: { data: StockData }) {
  const rows = [
    ...data.rows10y.filter(r => r.isComplete),
    ...data.rows10y.filter(r => !r.isComplete && r.yearsActual >= 9),
  ]
  const s = data.stats
  const epsDecomp = (data as any).epsDecomp as Array<{
    buyYear: number; epsGrowthCagr: number; peSell: number; note: string | null
  }>
  const epsNote: string | undefined = (data as any).epsNote
  const epsMap = new Map(epsDecomp?.map(e => [e.buyYear, e]) ?? [])

  return (
    <div className="space-y-5">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <StatCard label="완결 구간" value={`${s.n}개`} />
        <StatCard label="중앙값 CAGR" value={`${s.median}%`} />
        <StatCard label="최저" value={`${s.min}% (${s.minBuy}년)`} />
        <StatCard label="최고" value={`${s.max}% (${s.maxBuy}년)`} />
        <StatCard label="손실 구간" value={`${s.losses}개`} />
        <StatCard label="연 10% 초과" value={`${s.over10}%`} />
        <StatCard label="연 15% 초과" value={`${s.over15}%`} />
        <StatCard label="연 20% 초과" value={`${s.over20}%`} />
        {s.beatBench != null && (
          <StatCard label="S&P 500 초과" value={`${s.beatBench} / ${s.beatTotal}개`} />
        )}
        <StatCard
          label="전체 기간"
          value={`${data.fullPeriod.cagr}% · ${data.fullPeriod.multiple}x`}
        />
      </div>

      {data.note && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2">
          ⚠ {data.note}
        </p>
      )}

      {/* 완결 구간 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
              <th className="text-left py-2 pr-3 font-medium">매수</th>
              <th className="text-left py-2 pr-3 font-medium">평가</th>
              <th className="text-right py-2 pr-3 font-medium">연복리<br/><span className="font-normal opacity-60">(배당포함)</span></th>
              <th className="text-right py-2 pr-3 font-medium">누적 수익률</th>
              <th className="text-right py-2 pr-3 font-medium">EPS 성장<br/><span className="font-normal opacity-60">(연복리)</span></th>
              <th className="text-right py-2 pr-3 font-medium">매수 PER</th>
              <th className="text-right py-2 pr-3 font-medium">매도 PER</th>
              <th className="text-right py-2 pr-3 font-medium">S&P 500<br/><span className="font-normal opacity-60">(배당포함)</span></th>
              <th className="text-right py-2 font-medium">차이</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map(r => {
              const diff    = 'diff' in r ? (r as any).diff as number : null
              const bc      = 'benchCagr' in r ? (r as any).benchCagr as number : null
              const peBuy   = 'peBuy' in r ? (r as any).peBuy as number : null
              const eps     = epsMap.get(r.buyYear)
              const inProg  = !r.isComplete
              return (
                <tr key={r.buyYear} className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 ${inProg ? 'opacity-50' : ''}`}>
                  <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-300 tabular-nums">
                    {r.buyYear}
                    {eps?.note && <span title={eps.note} className="ml-1 text-amber-500 cursor-help text-xs">⚠</span>}
                  </td>
                  <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-300 tabular-nums">
                    {inProg ? <span className="italic text-gray-400 dark:text-gray-500">진행 중</span> : r.sellYear}
                  </td>
                  <td className={`py-1.5 pr-3 text-right font-semibold tabular-nums ${cagrTextColor(r.cagr, !inProg)}`}>
                    {r.cagr.toFixed(1)}%
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                    {fmtTotalReturn(r.multiple)}
                  </td>
                  <td className={`py-1.5 pr-3 text-right tabular-nums ${eps ? epsGrowthColor(eps.epsGrowthCagr) : 'text-gray-300 dark:text-gray-600'}`}>
                    {eps ? `+${eps.epsGrowthCagr.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-400 dark:text-gray-500">
                    {peBuy != null ? `${peBuy.toFixed(0)}x` : '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-400 dark:text-gray-500">
                    {eps ? `${eps.peSell.toFixed(0)}x` : '—'}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-gray-400 dark:text-gray-500">
                    {bc != null ? `${bc.toFixed(1)}%` : '—'}
                  </td>
                  <td className={`py-1.5 text-right tabular-nums font-medium ${diff == null ? 'text-gray-400' : diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}pp` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>


      {/* EPS 주석 */}
      {epsNote && (
        <p className="text-xs text-gray-300 dark:text-gray-600">{epsNote}</p>
      )}

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-blue-600 dark:text-blue-400">■ 20%+</span>
        <span className="text-emerald-600 dark:text-emerald-400">■ 15~20%</span>
        <span className="text-yellow-600 dark:text-yellow-400">■ 10~15%</span>
        <span className="text-orange-500 dark:text-orange-400">■ 0~10%</span>
        <span className="text-red-500 dark:text-red-400">■ 손실</span>
      </div>
    </div>
  )
}


// ── 미래 수익률 시나리오 테이블 ──────────────────────────────
function ScenarioTable({ data }: { data: StockData }) {
  const c = data.current as { price: number; pe: number; divYield: number; eps: number }
  const [pe,  setPE]  = useState(c.pe ?? 20)
  const [div, setDiv] = useState(c.divYield ?? 1)

  const growthRates = [0, 3, 5, 8, 10, 12, 15, 20]
  const endPEs      = [15, 20, 25, 30, 35, 40, 50]

  // 10년 연환산 CAGR 계산
  // Total 10yr multiple = (1+g)^10 × (endPE/startPE) × (1+div/100)^10
  // div_yield는 대략 일정하다고 가정 (배당이 이익과 같이 성장)
  function calcCAGR(g: number, endPE: number): number {
    const priceFactor = Math.pow(1 + g / 100, 10) * (endPE / pe)
    const totalFactor = priceFactor * Math.pow(1 + div / 100, 10)
    return (Math.pow(totalFactor, 1 / 10) - 1) * 100
  }

  function cellColor(cagr: number): string {
    if (cagr < 0)  return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    if (cagr < 5)  return 'bg-orange-50 dark:bg-orange-900/15 text-orange-600 dark:text-orange-400'
    if (cagr < 10) return 'bg-yellow-50 dark:bg-yellow-900/15 text-yellow-700 dark:text-yellow-400'
    if (cagr < 15) return 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400'
    if (cagr < 20) return 'bg-blue-50 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400'
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold'
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
          지금 사서 10년 보유 시 예상 수익률
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          현재 P/E와 배당수익률을 기준으로, EPS 성장률과 10년 후 P/E에 따른 연환산 수익률
        </p>
      </div>

      {/* 입력값 */}
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-xs">현재 P/E</span>
          <input
            type="number"
            step="0.5"
            value={pe}
            onChange={e => setPE(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right"
          />
          <span className="text-gray-400 text-xs">x</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-xs">배당수익률</span>
          <input
            type="number"
            step="0.1"
            value={div}
            onChange={e => setDiv(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right"
          />
          <span className="text-gray-400 text-xs">%</span>
        </label>
        {c.eps != null && c.price != null && (
          <span className="text-xs text-gray-400 self-center">
            참고: TTM EPS {c.eps} {data.currency} · 주가 {c.price} {data.currency}
          </span>
        )}
      </div>

      {/* 시나리오 테이블 */}
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr className="text-gray-400 dark:text-gray-500">
              <th className="text-left py-1.5 pr-3 font-medium whitespace-nowrap">EPS 성장률 ↓ / 10년 후 P/E →</th>
              {endPEs.map(ep => (
                <th key={ep} className={`text-right py-1.5 px-2 font-medium ${ep === pe ? 'text-blue-500' : ''}`}>
                  {ep}x{ep === Math.round(pe) ? ' ★' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {growthRates.map(g => (
              <tr key={g} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                  연 {g}% 성장
                </td>
                {endPEs.map(ep => {
                  const cagr = calcCAGR(g, ep)
                  return (
                    <td key={ep} className={`py-1.5 px-2 text-right tabular-nums rounded ${cellColor(cagr)}`}>
                      {cagr.toFixed(1)}%
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        계산식: 연환산 수익률 = [(1+EPS성장)^10 × (목표P/E÷현재P/E) × (1+배당수익률)^10]^(1/10) − 1<br />
        배당이 이익과 같이 성장한다고 가정. 참고용 추정치이며 미래 보장 없음.
      </p>
    </div>
  )
}

// ── 범용 Range Bar ───────────────────────────────────────────
function RangeBar({
  mn, med, mx,
  vMin, vMax,
  refVal, refLabel,
  barColor = 'bg-blue-200 dark:bg-blue-900',
  markerColor = 'bg-blue-500 dark:bg-blue-400',
  refColor = 'bg-blue-400 dark:bg-blue-500',
  unit = '%',
  sign = false,
}: {
  mn: number; med: number; mx: number
  vMin: number; vMax: number
  refVal: number; refLabel: string
  barColor?: string; markerColor?: string; refColor?: string
  unit?: string; sign?: boolean
}) {
  const toX = (v: number) =>
    `${Math.max(0, Math.min(100, (v - vMin) / (vMax - vMin) * 100)).toFixed(2)}%`
  const refPct = ((refVal - vMin) / (vMax - vMin) * 100).toFixed(2)
  const fmt = (v: number) => `${sign && v > 0 ? '+' : ''}${v.toFixed(1)}${unit}`

  return (
    <div className="relative group flex items-center" style={{ width: 180, height: 44 }}>
      {/* 배경 트랙 */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-gray-100 dark:bg-gray-800 rounded-full" />
      {/* min~max 구간 바 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 h-3 rounded-full ${barColor}`}
        style={{ left: toX(mn), right: `${(100 - parseFloat(toX(mx))).toFixed(2)}%` }}
      />
      {/* 기준선 */}
      <div
        className={`absolute top-0 h-full w-0.5 opacity-70 ${refColor}`}
        style={{ left: `${refPct}%` }}
      />
      {/* 중앙값 마커 */}
      <div
        className={`absolute top-1/2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-950 ${markerColor}`}
        style={{ left: toX(med), transform: 'translateX(-50%) translateY(-50%)' }}
      />
      {/* 툴팁 — 위쪽으로 표시, overflow 문제 없도록 fixed */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                      invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2
                      whitespace-nowrap shadow-lg pointer-events-none">
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">최솟값</span>
            <span className="font-semibold">{fmt(mn)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">중앙값 ●</span>
            <span className="font-semibold">{fmt(med)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">최댓값</span>
            <span className="font-semibold">{fmt(mx)}</span>
          </div>
          <div className="border-t border-gray-600 pt-1 text-gray-400">
            세로선 | = {refLabel}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 종목 비교 개요 ───────────────────────────────────────────
function median(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b)
  return s.length % 2 === 0
    ? (s[s.length / 2 - 1] + s[s.length / 2]) / 2
    : s[Math.floor(s.length / 2)]
}

function diffColor(v: number) {
  if (v >= 10) return 'text-blue-600 dark:text-blue-400'
  if (v >= 5)  return 'text-emerald-600 dark:text-emerald-400'
  if (v >= 0)  return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

function OverviewTable({
  activeStock,
  setActiveStock,
}: {
  activeStock: number
  setActiveStock: (i: number) => void
}) {
  const rows = STOCKS.map((s, i) => {
    const completed  = s.data.rows10y.filter((r: any) => r.isComplete)
    const recent     = completed.slice(-10)
    const cagrs      = recent.map((r: any) => r.cagr as number)
    const cagrMn     = Math.min(...cagrs)
    const cagrMx     = Math.max(...cagrs)
    const cagrMed    = median(cagrs)
    const withDiff   = recent.filter((r: any) => r.diff != null)
    const diffs      = withDiff.map((r: any) => r.diff as number)
    const diffMn     = diffs.length ? Math.min(...diffs) : null
    const diffMx     = diffs.length ? Math.max(...diffs) : null
    const diffMed    = diffs.length ? median(diffs) : null
    return { i, s, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx }
  })

  return (
    <div>
      <table className="text-sm">
        <thead>
          <tr className="text-xs text-gray-400 dark:text-gray-500">
            <th className="text-left pb-1 pr-4" rowSpan={2}>종목</th>
            <th className="text-right pb-1 pr-4" rowSpan={2}>전체 기간<br/><span className="font-normal opacity-60">연평균</span></th>
            <th colSpan={4} className="text-center pb-1 px-3 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              절대 수익률 <span className="font-normal opacity-60">(배당 포함)</span>
            </th>
            <th colSpan={4} className="text-center pb-1 px-3 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold">
              S&P 500 대비 초과수익
            </th>
          </tr>
          <tr className="text-xs text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-1 px-3 font-medium">분포</th>
            <th className="text-right py-1 pr-3 font-medium">최솟값</th>
            <th className="text-right py-1 pr-3 font-medium">중앙값</th>
            <th className="text-right py-1 pr-4 font-medium">최댓값</th>
            <th className="text-left py-1 px-3 font-medium">분포</th>
            <th className="text-right py-1 pr-3 font-medium">최솟값</th>
            <th className="text-right py-1 pr-3 font-medium">중앙값</th>
            <th className="text-right py-1 font-medium">최댓값</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map(({ i, s, cagrMn, cagrMed, cagrMx, diffMn, diffMed, diffMx }) => {
            const isActive = activeStock === i
            return (
              <tr
                key={s.key}
                onClick={() => setActiveStock(i)}
                className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                  isActive ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''
                }`}
              >
                <td className="py-3 pr-4">
                  <span className="font-semibold text-gray-900 dark:text-white">{s.data.ticker}</span>
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">{s.data.name}</span>
                </td>
                <td className={`py-3 pr-4 text-right tabular-nums font-medium ${cagrTextColor(s.data.fullPeriod.cagr, true)}`}>
                  {s.data.fullPeriod.cagr}%
                </td>
                {/* 절대 수익률 섹션 */}
                <td className="py-3 px-3">
                  <RangeBar mn={cagrMn} med={cagrMed} mx={cagrMx}
                    vMin={0} vMax={35} refVal={20} refLabel="연 20% 기준" />
                </td>
                <td className={`py-3 pr-3 text-right tabular-nums ${cagrTextColor(cagrMn, true)}`}>
                  {cagrMn.toFixed(1)}%
                </td>
                <td className={`py-3 pr-3 text-right tabular-nums font-semibold ${cagrTextColor(cagrMed, true)}`}>
                  {cagrMed.toFixed(1)}%
                </td>
                <td className={`py-3 pr-4 text-right tabular-nums ${cagrTextColor(cagrMx, true)}`}>
                  {cagrMx.toFixed(1)}%
                </td>
                {/* S&P500 초과수익 섹션 */}
                <td className="py-3 px-3">
                  {diffMn != null && diffMed != null && diffMx != null ? (
                    <RangeBar mn={diffMn} med={diffMed} mx={diffMx}
                      vMin={-15} vMax={25} refVal={0} refLabel="0pp = S&P500과 동일"
                      barColor="bg-emerald-200 dark:bg-emerald-900"
                      markerColor="bg-emerald-600 dark:bg-emerald-400"
                      refColor="bg-gray-400 dark:bg-gray-500"
                      sign unit="pp" />
                  ) : <span className="text-gray-300 dark:text-gray-600 text-xs pl-3">—</span>}
                </td>
                <td className={`py-3 pr-3 text-right tabular-nums ${diffMn != null ? diffColor(diffMn) : 'text-gray-300'}`}>
                  {diffMn != null ? `${diffMn > 0 ? '+' : ''}${diffMn.toFixed(1)}pp` : '—'}
                </td>
                <td className={`py-3 pr-3 text-right tabular-nums font-semibold ${diffMed != null ? diffColor(diffMed) : 'text-gray-300'}`}>
                  {diffMed != null ? `${diffMed > 0 ? '+' : ''}${diffMed.toFixed(1)}pp` : '—'}
                </td>
                <td className={`py-3 text-right tabular-nums ${diffMx != null ? diffColor(diffMx) : 'text-gray-300'}`}>
                  {diffMx != null ? `${diffMx > 0 ? '+' : ''}${diffMx.toFixed(1)}pp` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        행 클릭 시 상세 보기 · 바의 세로선: 절대수익 = 연 20%, 초과수익 = 0pp(S&P500 동일) · 최근 10개 완결 구간 기준
      </p>
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────
export default function PrivatePage() {
  const [activeStock, setActiveStock] = useState(0)
  const current = STOCKS[activeStock]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* 헤더 */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">위대한 기업</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            연말 매수 기준 10년 보유 연환산 수익률
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
            ★ 모든 수익률은 배당 재투자 포함 총수익률 (Yahoo Finance 수정주가 기준)
          </p>
        </div>

        {/* 종목 비교 개요 */}
        <OverviewTable activeStock={activeStock} setActiveStock={setActiveStock} />

        {/* 종목 탭 */}
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 flex-wrap">
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
              {s.data.ticker}
              <span className="text-xs font-normal opacity-60 ml-1">({s.data.name})</span>
            </button>
          ))}
          <span className="ml-2 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-600 border border-dashed border-gray-300 dark:border-gray-700 rounded cursor-default">
            + 종목 추가 예정
          </span>
        </div>

        {/* 종목명 */}
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {current.data.name} ({current.data.ticker})
          </h2>
          <span className="text-xs text-gray-400">{current.data.currency} · 벤치마크: {current.data.benchmark}</span>
        </div>

        {/* 차트 */}
        <RollingChart key={current.key} data={current.data} />

        {/* 롤링 테이블 */}
        <RollingTable data={current.data} />

        {/* 구분선 */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-2" />

        {/* 시나리오 테이블 */}
        <ScenarioTable key={`scenario-${current.key}`} data={current.data} />

      </div>
    </div>
  )
}
