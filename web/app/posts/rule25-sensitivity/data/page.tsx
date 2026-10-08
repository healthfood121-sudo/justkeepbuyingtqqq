'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface Market { starts: string[]; irr: Record<string, number[]>; dd: Record<string, number[]> }
interface Rows { ndx: Market; sp500: Market }
type M = 'ndx' | 'sp500'

// R25_15 → '−25% · 재매수 15일', S0_15 → 'S0 · 15일', W126 → '−25% · 최고가 6개월', SP25 → '−25% 룰'
function label(k: string): string {
  let m = k.match(/^R(\d+)_(\d+)$/)
  if (m) return `−${m[1]}% · 재매수 ${m[2]}일`
  m = k.match(/^S0_(\d+)$/)
  if (m) return `S0 · ${m[1]}일`
  if (k === 'W126') return '−25% · 최고가 6개월'
  if (k === 'W504') return '−25% · 최고가 2년'
  if (k === 'SP_S0') return 'S0 (200일선 15일)'
  if (k === 'SP_HOLD') return '신호 없이 보유'
  m = k.match(/^SP([\d.]+)$/)
  if (m) return `−${m[1]}% 룰`
  return k
}

const QUICK: Record<M, string[]> = {
  ndx:   ['R25_15', 'R20_15', 'R22_15', 'R23_15', 'R30_15', 'R40_15', 'R25_5', 'R25_30', 'S0_15', 'W126', 'W504'],
  sp500: ['SP25', 'SP20', 'SP30', 'SP35', 'SP_S0', 'SP_HOLD'],
}

function Viewer() {
  const params = useSearchParams()
  const router = useRouter()
  const [rows, setRows] = useState<Rows | null>(null)
  const m: M = params.get('m') === 'sp500' ? 'sp500' : 'ndx'
  const base = m === 'ndx' ? 'R25_15' : 'SP25'
  const k = params.get('k') ?? base
  const cmp = params.get('c') ?? (k === base ? (m === 'ndx' ? 'S0_15' : 'SP_S0') : base)
  const km = k.match(/^R(\d+)_(\d+)$/)
  const thr = km?.[1] ?? '25', days = km?.[2] ?? '15'

  useEffect(() => { fetch('/data/withdrawal_rule_sensitivity_rows.json').then(r => r.json()).then(setRows) }, [])

  const go = (o: { m?: M; k?: string; c?: string }) => {
    const nm = o.m ?? m
    const q = new URLSearchParams({ m: nm, k: o.k ?? k })
    if (o.c ?? params.get('c')) q.set('c', (o.c ?? params.get('c'))!)
    router.replace(`?${q.toString()}`, { scroll: false })
  }

  const mk = rows?.[m]
  const worst = mk?.irr[k] ? mk.irr[k].indexOf(Math.min(...mk.irr[k])) : -1

  if (!rows || !mk) return <p className="text-sm text-gray-400 py-10 text-center">불러오는 중…</p>
  if (!mk.irr[k]) return <p className="text-sm text-gray-400 py-10 text-center">없는 설정값입니다.</p>
  const a = mk.irr[k], b = mk.irr[cmp] ?? []
  const sorted = [...a].sort((x, y) => x - y)
  const med = sorted[Math.floor(sorted.length / 2)]
  const wins = b.length ? a.filter((v, i) => v > b[i]).length : 0
  const btn = (on: boolean) => `text-xs px-2.5 py-1 rounded-full border transition-colors ${on
    ? 'bg-blue-600 border-blue-600 text-white'
    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`

  return (
    <>
      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium w-fit mb-4">
        {(['ndx', 'sp500'] as M[]).map(x => (
          <button key={x} onClick={() => router.replace(`?m=${x}`, { scroll: false })}
            className={`px-3 py-1.5 ${m === x ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {x === 'ndx' ? '나스닥100 (1971~)' : 'S&P500 (1955~)'}
          </button>
        ))}
      </div>

      {m === 'ndx' && (
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-300">
          <span>매도 기준 −</span>
          <select value={thr} onChange={e => go({ k: `R${e.target.value}_${days}` })}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded px-1.5 py-1">
            {Array.from({ length: 26 }, (_, i) => String(15 + i)).map(t => <option key={t} value={t}>{t}%</option>)}
          </select>
          <span>· 재매수</span>
          <select value={days} onChange={e => go({ k: `R${thr}_${e.target.value}` })}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded px-1.5 py-1">
            {['5', '10', '15', '20', '30'].map(d => <option key={d} value={d}>{d}일</option>)}
          </select>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {QUICK[m].map(q => <button key={q} onClick={() => go({ k: q })} className={btn(k === q)}>{label(q)}</button>)}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs text-gray-500 dark:text-gray-400">
        <span>비교:</span>
        {QUICK[m].map(q => <button key={q} onClick={() => go({ c: q })} className={btn(cmp === q)}>{label(q)}</button>)}
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        <strong>{label(k)}</strong> — {a.length}가지 시작 시점 · 중간 {med}% · 최악 {sorted[0]}%
        {b.length > 0 && <> · <strong>{label(cmp)}</strong>보다 나은 경우 {Math.round(wins / a.length * 100)}%</>}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="py-2 px-2 text-left font-medium">진입 시점</th>
              <th className="py-2 px-2 text-left font-medium">{label(k)} 인출 포함 수익률</th>
              <th className="py-2 px-2 text-left font-medium">최대 낙폭</th>
              <th className="py-2 px-2 text-left font-medium">{label(cmp)} 인출 포함 수익률</th>
              <th className="py-2 px-2 text-left font-medium">차이</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {mk.starts.map((s, i) => {
              const d = b.length ? a[i] - b[i] : null
              return (
                <tr key={s} className={i === worst ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}>
                  <td className="py-1.5 px-2 font-mono">{s}</td>
                  <td className="py-1.5 px-2 font-mono">{a[i]}%</td>
                  <td className="py-1.5 px-2 font-mono text-gray-400">−{mk.dd[k][i]}%</td>
                  <td className="py-1.5 px-2 font-mono text-gray-500 dark:text-gray-400">{b.length ? `${b[i]}%` : '—'}</td>
                  <td className={`py-1.5 px-2 font-mono ${d === null ? '' : d >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {d === null ? '—' : `${d >= 0 ? '+' : ''}${d.toFixed(1)}%p`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
        인출 포함 수익률 = 10억을 넣고 매달 생활비(총자산의 0.3/0.5/0.7%)를 꺼내 쓰고 마지막 남은 자산까지 돌려받았을 때의 연 수익률.
        10년 이상 보유한 시작 시점만 · 빨간 줄 = 가장 나빴던 시작 시점 · 스왑금리·모든 매도 양도세·현금 이자 반영 · 신호 다음 거래일 매매.
      </p>
    </>
  )
}

export default function RuleSensitivityDataPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-6xl" />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <Link href="/posts/rule25-sensitivity" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">
          ← 글로 돌아가기
        </Link>
        <h1 className="text-2xl font-black mb-2">25% 룰 기준값 바꿔 보기 — 시작 시점별 데이터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">설정값마다 매달 시작한 모든 경우를 오늘까지 들고 간 결과</p>
        <Suspense fallback={null}><Viewer /></Suspense>
      </main>
    </div>
  )
}
