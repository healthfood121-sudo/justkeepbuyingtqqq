'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import CostToggle from '@/components/CostToggle'

// ─── 타입 ────────────────────────────────────────────────────

// [실행일, 'S'(매도)|'B'(매수), 나스닥100 종가, 200일 지수이동평균, 1년 최고 종가, 거래 직후 총자산(억)]
type Trade = [string, 'S' | 'B', number, number, number, number]

interface CohortData {
  s:     string
  inv:   boolean
  final: number
  wd:    number
  yrs:   number
  dd:    number
  t:     Trade[]
}

interface Meta {
  generated:        string
  strategy:         string
  desc:             string
  conditions:       string
  n_cohorts:        number
  median_final_10y: number
  median_wd_10y:    number
  avg_trades:       number
}

interface TradelogData {
  meta:    Meta
  cohorts: CohortData[]
}

const STRATS = [
  { key: 't25', label: '25% 룰 (권장)' },
  { key: 's0',  label: 'S0 (200일선 15일)' },
]

// ─── 유틸 ────────────────────────────────────────────────────

function fmt억(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}조`
  return `${v.toFixed(1)}억`
}

function fmtPct(v: number) {
  const sign = v >= 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}%`
}

// ─── 내부 컴포넌트 ────────────────────────────────────────────

function TradelogInner() {
  const params  = useSearchParams()
  const router  = useRouter()

  const [data,    setData]    = useState<TradelogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const strat         = params.get('st') === 's0' ? 's0' : 't25'
  const withCosts     = params.get('fee') !== '1'
  const selectedStart = params.get('start') ?? ''

  const go = (o: { st?: string; fee?: boolean; start?: string }) => {
    const st = o.st ?? strat
    const fee = o.fee ?? !withCosts
    const start = o.start ?? selectedStart
    const q = new URLSearchParams()
    if (st !== 't25') q.set('st', st)
    if (fee) q.set('fee', '1')
    if (start) q.set('start', start)
    router.replace(`?${q.toString()}`, { scroll: false })
  }

  useEffect(() => {
    setLoading(true)
    fetch(`/data/withdrawal_tradelog_${strat}${withCosts ? '' : '_fee'}.json`)
      .then(r => r.json())
      .then((d: TradelogData) => { setData(d); setLoading(false) })
  }, [strat, withCosts])

  const filteredCohorts = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.cohorts
    return data.cohorts.filter(c => c.s.includes(search.trim()))
  }, [data, search])

  const activeCohort = useMemo(
    () => data?.cohorts.find(c => c.s === selectedStart) ?? data?.cohorts[0] ?? null,
    [data, selectedStart]
  )

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">데이터 로딩 중…</p>
      </div>
    )
  }
  if (!data || !activeCohort) return null
  const isT25 = data.meta.strategy === 'T25'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-7xl" />

      <main className="max-w-7xl mx-auto px-4 py-10">

        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/posts/withdrawal-guide"
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-block">
            ← 인출 방법론으로
          </Link>
          <h1 className="text-2xl font-bold mb-1">인출 전략 거래 로그 전체 공개</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            초기 10억 · 1971년 이후 매달 시작한 {data.meta.n_cohorts}가지 경우 · 시작부터 오늘까지 보유
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium">
              {STRATS.map(s => (
                <button key={s.key} onClick={() => go({ st: s.key })}
                  className={`px-3 py-1.5 transition-colors ${strat === s.key ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {s.label}
                </button>
              ))}
            </div>
            <CostToggle withCosts={withCosts} onChange={wc => go({ fee: !wc })} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <strong className="text-gray-700 dark:text-gray-200">{isT25 ? '25% 룰' : data.meta.strategy}</strong>: {data.meta.desc}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{data.meta.conditions}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* 왼쪽: 시작 시점 목록 */}
          <div className="lg:w-52 shrink-0">
            <div className="sticky top-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                시작 시점 선택 ({data.meta.n_cohorts}개)
              </p>
              <input
                type="text"
                placeholder="예: 2000-03"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full mb-2 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                  {filteredCohorts.map(c => {
                    const isActive = c.s === activeCohort.s
                    return (
                      <button
                        key={c.s}
                        onClick={() => go({ start: c.s })}
                        className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span>{c.s}</span>
                        <span className="ml-1 text-[10px] text-gray-400 dark:text-gray-600">{c.yrs.toFixed(0)}년</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 거래 로그 */}
          <div className="flex-1 min-w-0">

            {/* 시작 시점 요약 */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-4 mb-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {activeCohort.s} 시작
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {activeCohort.yrs.toFixed(1)}년 보유 (오늘까지)
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  !activeCohort.inv
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  시작 포지션: {activeCohort.inv ? '투자 (200일선 위)' : '현금 (200일선 아래)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">남은 자산</p>
                  <p className={`font-bold text-base ${
                    activeCohort.final < 10 ? 'text-red-500' :
                    activeCohort.final >= 1000 ? 'text-green-600 dark:text-green-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {fmt억(activeCohort.final)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">꺼내 쓴 돈</p>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">{fmt억(activeCohort.wd)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">매매 횟수</p>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">{activeCohort.t.length}회</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">최대 낙폭</p>
                  <p className="font-semibold text-base text-gray-900 dark:text-white">−{activeCohort.dd.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">남은 자산 중간값</p>
                  <p className="font-semibold text-base text-blue-600 dark:text-blue-400" title="10년 이상 보유한 경우 기준">
                    {fmt억(data.meta.median_final_10y)}
                  </p>
                </div>
              </div>
            </div>

            {activeCohort.t.length === 0 && (
              <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center border border-gray-100 dark:border-gray-800 rounded-xl">
                이 시작 시점에서는 오늘까지 매수/매도 신호가 발생하지 않았습니다.
              </div>
            )}

            {activeCohort.t.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {['#', '실행일', '신호', '나스닥100 종가', '1년 최고 종가 대비', '200일선 대비', '거래 후 총자산'].map(h => (
                        <th key={h} className="py-2 px-3 text-left text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {activeCohort.t.map(([date, act, ndx, ema, peak, port], i) => {
                      const isSell = act === 'S'
                      const vsPeak = (ndx / peak - 1) * 100
                      const vsEma  = (ndx / ema - 1) * 100
                      return (
                        <tr key={i} className={isSell
                          ? 'bg-red-50/60 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'bg-green-50/60 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20'}>
                          <td className="py-2 px-3 text-xs text-gray-400 dark:text-gray-600 font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{date}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isSell
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                                : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                            }`}>
                              {isSell ? '매도' : '매수'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-gray-700 dark:text-gray-300 text-right">{ndx.toLocaleString()}</td>
                          <td className={`py-2 px-3 font-mono text-xs text-right ${isT25 && isSell ? 'font-semibold text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {fmtPct(vsPeak)}
                          </td>
                          <td className={`py-2 px-3 font-mono text-xs text-right ${!isT25 || !isSell ? 'font-semibold' : ''} ${
                            vsEma < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {fmtPct(vsEma)}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-right font-semibold text-gray-800 dark:text-gray-200">{fmt억(port)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 범례 */}
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 space-y-1">
              <p>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400 mr-1.5 align-middle" />
                매도 = {isT25
                  ? '나스닥100 종가가 1년 최고 종가보다 25% 이상 낮게 끝난 다음 거래일 종가에 전량 현금 전환'
                  : '나스닥100이 200일 지수이동평균 아래에서 15거래일 연속 끝난 다음 거래일 종가에 전량 현금 전환'}
              </p>
              <p>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 mr-1.5 align-middle" />
                매수 = 나스닥100이 200일 지수이동평균 위에서 15거래일 연속 끝난 다음 거래일 종가에 전액 재매수
              </p>
              <p className="mt-1">
                &lsquo;1년 최고 종가 대비&rsquo;·&lsquo;200일선 대비&rsquo; = 실행일 종가가 각 기준보다 몇 % 높거나 낮은지.
                신호는 전날 종가로 확정되므로 실행일 값은 기준선을 조금 넘나들 수 있다.
              </p>
              <p>거래 후 총자산 = 매매 직후 TQQQ + 현금(외화RP) 합계 (억 원). 생활비 인출·양도세 납부 후 금액.</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default function TradelogPage() {
  return (
    <Suspense>
      <TradelogInner />
    </Suspense>
  )
}
