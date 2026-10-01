interface Props {
  label: string
  value: string | null
  sub?: string
  highlight?: boolean
  color?: 'yellow' | 'blue' | 'green' | 'red'
}

const colorMap = {
  yellow: 'text-yellow-400',
  blue:   'text-blue-400',
  green:  'text-emerald-400',
  red:    'text-red-400',
}

export default function StatCard({ label, value, sub, highlight, color = 'blue' }: Props) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-gray-700 ring-1 ring-blue-500' : 'bg-gray-800'}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>
        {value ?? '—'}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
