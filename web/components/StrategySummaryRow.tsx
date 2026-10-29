import type { BacktestSummary } from '@/lib/types'

interface Props {
  summaries: { A: BacktestSummary; B: BacktestSummary; C: BacktestSummary }
  show: Record<'A' | 'B' | 'C', boolean>
  onToggle: (s: 'A' | 'B' | 'C') => void
}

const strategyInfo = {
  A: { label: 'A전략', desc: '계속 적립', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-400/10 dark:border-emerald-400/30' },
  B: { label: 'B전략', desc: '매입액 한도', color: 'text-yellow-500 dark:text-yellow-400', bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-400/10 dark:border-yellow-400/30' },
  C: { label: 'C전략', desc: '5년 분할 거치', color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-400/10 dark:border-blue-400/30' },
}

export default function StrategySummaryRow({ summaries, show, onToggle }: Props) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">카드를 누르면 전략을 켜고 끌 수 있어요 · 켜진 전략만 아래 표·차트에 나옵니다</p>
      <div className="grid grid-cols-3 gap-3">
        {(['A', 'B', 'C'] as const).map(s => {
          const sum = summaries[s]
          const info = strategyInfo[s]
          const isOn = show[s]
          return (
            <button
              key={s}
              type="button"
              onClick={() => onToggle(s)}
              aria-pressed={isOn}
              title={isOn ? '눌러서 끄기' : '눌러서 켜기'}
              className={`rounded-xl p-4 border text-left transition-colors cursor-pointer select-none ${info.bg} ${isOn ? '' : 'hover:brightness-95 dark:hover:brightness-125'}`}
            >
              <div className="flex items-start gap-2 mb-3">
                <div className={`flex flex-wrap items-baseline gap-x-2 min-w-0 transition-opacity ${isOn ? 'opacity-100' : 'opacity-35'}`}>
                  <span className={`text-lg font-bold ${info.color}`}>{info.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{info.desc}</span>
                </div>
                <OnOffBadge on={isOn} />
              </div>
              <div className={`space-y-2 transition-opacity ${isOn ? 'opacity-100' : 'opacity-35'}`}>
                <Stat label="완료율" value={`${sum.completionRate.toFixed(1)}%`} />
                <Stat label="평균 소요" value={sum.avgYears ? `${sum.avgYears.toFixed(1)}년` : '—'} />
                <Stat label="중간값" value={sum.medianYears ? `${sum.medianYears.toFixed(1)}년` : '—'} />
                <Stat label="최장" value={sum.maxYears ? `${sum.maxYears.toFixed(1)}년` : '—'} highlight />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function OnOffBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`ml-auto shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide border ${
        on
          ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
          : 'bg-white border-gray-300 text-gray-500 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-white' : 'bg-gray-400 dark:bg-gray-500'}`} />
      {on ? 'ON' : 'OFF'}
    </span>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  )
}
