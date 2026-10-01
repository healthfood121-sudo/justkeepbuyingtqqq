import type { BacktestSummary } from '@/lib/types'

interface Props {
  summaries: { A: BacktestSummary; B: BacktestSummary; C: BacktestSummary }
}

const strategyInfo = {
  A: { label: 'A전략', desc: '한도 후 중단', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  B: { label: 'B전략', desc: '거치+계속 적립', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  C: { label: 'C전략', desc: '거치없이 계속', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
}

export default function StrategySummaryRow({ summaries }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(['A', 'B', 'C'] as const).map(s => {
        const sum = summaries[s]
        const info = strategyInfo[s]
        return (
          <div key={s} className={`rounded-xl p-4 border ${info.bg}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-lg font-bold ${info.color}`}>{info.label}</span>
              <span className="text-xs text-gray-400">{info.desc}</span>
            </div>
            <div className="space-y-2">
              <Stat label="완료율" value={`${sum.completionRate.toFixed(1)}%`} />
              <Stat label="평균 소요" value={sum.avgYears ? `${sum.avgYears.toFixed(1)}년` : '—'} />
              <Stat label="중간값" value={sum.medianYears ? `${sum.medianYears.toFixed(1)}년` : '—'} />
              <Stat label="최장" value={sum.maxYears ? `${sum.maxYears.toFixed(1)}년` : '—'} highlight />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-red-400' : 'text-white'}`}>{value}</span>
    </div>
  )
}
