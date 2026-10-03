'use client'

// 운용보수만 / + 스왑금리 비용 토글 — 다른 데이터 페이지와 같은 모양
export default function CostToggle({ withCosts, onChange }: { withCosts: boolean; onChange: (v: boolean) => void }) {
  const btn = (on: boolean) =>
    `px-3 py-1.5 transition-colors ${on ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`
  return (
    <div className="flex flex-wrap items-center gap-2 my-3">
      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
        <button onClick={() => onChange(false)} className={btn(!withCosts)}>운용보수만</button>
        <button onClick={() => onChange(true)} className={btn(withCosts)}>+ 스왑금리</button>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {withCosts ? 'TQQQ 운용보수 + 스왑금리비용(기준금리 × 2) 반영' : '운용보수만 반영 · 스왑금리비용 미반영 (이론치)'}
      </span>
    </div>
  )
}
