import Header from '@/components/Header'
import Link from 'next/link'
import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: '연도별 수익률 비교',
  description: 'TQQQ·QLD·QQQ·VOO 2010년부터 현재까지 연도별 실제 수익률 비교표. 좋은 해와 나쁜 해의 극단적 차이, 레버리지의 의미.',
}

// VOO는 S&P500 지수 종가 기준 (배당 미포함). real_vs_synthetic.json에 없으므로 별도 관리.
const VOO_YEARS: Record<number, number> = {
  2010: 12.8, 2011: -0.0, 2012: 13.4, 2013: 29.6, 2014: 11.4,
  2015: -0.7, 2016:  9.5, 2017: 19.4, 2018: -6.2, 2019: 28.9,
  2020: 16.3, 2021: 26.9, 2022:-19.4, 2023: 24.2, 2024: 23.3,
  2025: 16.4, 2026: 13.4,
}

interface YearEntry { year: number; real: number; real_close?: number; partial: boolean }
interface EtfData   { yearly: YearEntry[] }
interface RVSData   { asof: string; etfs: { TQQQ: EtfData; QLD: EtfData; QQQ: EtfData } }

interface RowData {
  year:    number
  tqqq:    number | null
  qld:     number | null
  qqq:     number | null
  voo:     number | null
  note?:   string
  partial: boolean
}

function loadRows(): { rows: RowData[]; asof: string } {
  const filePath = path.join(process.cwd(), 'public', 'data', 'real_vs_synthetic.json')
  const raw: RVSData = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const tqqqMap = Object.fromEntries(raw.etfs.TQQQ.yearly.map(e => [e.year, e]))
  const qldMap  = Object.fromEntries(raw.etfs.QLD.yearly.map(e => [e.year, e]))
  const qqqMap  = Object.fromEntries(raw.etfs.QQQ.yearly.map(e => [e.year, e]))

  const years = Array.from(new Set([
    ...Object.keys(tqqqMap),
    ...Object.keys(qldMap),
    ...Object.keys(qqqMap),
  ].map(Number))).filter(y => y >= 2010).sort((a, b) => a - b)

  const asofDate = new Date(raw.asof)
  const asofMonth = `${asofDate.getMonth() + 1}월`

  const rows: RowData[] = years.map(year => {
    const tqqq = tqqqMap[year]
    const qld  = qldMap[year]
    const qqq  = qqqMap[year]
    const partial = !!(tqqq?.partial || qld?.partial || qqq?.partial)

    let note: string | undefined
    if (year === 2010 && tqqq?.partial) note = 'TQQQ 2월 상장'
    else if (partial) note = `연중 (${asofMonth} 기준)`

    // real_close(Close 기준 주가수익률)가 있으면 우선 사용 — 트레이딩뷰·증권사 기준과 일치
    return {
      year,
      tqqq: tqqq ? (tqqq.real_close ?? tqqq.real) : null,
      qld:  qld  ? (qld.real_close  ?? qld.real)  : null,
      qqq:  qqq  ? (qqq.real_close  ?? qqq.real)  : null,
      voo:  VOO_YEARS[year] ?? null,
      note,
      partial,
    }
  })

  return { rows, asof: raw.asof }
}

function RetCell({ v, base }: { v: number | null; base?: boolean }) {
  if (v === null) return <td className="py-2.5 px-3 text-gray-300 dark:text-gray-700 text-center">—</td>
  const isPos = v > 0
  const abs = Math.abs(v)

  let bg = ''
  if (isPos) {
    if (abs >= 100) bg = 'bg-green-700 dark:bg-green-600 text-white'
    else if (abs >= 50) bg = 'bg-green-600 dark:bg-green-700 text-white'
    else if (abs >= 20) bg = 'bg-green-500 dark:bg-green-700 text-white'
    else if (abs >= 10) bg = 'bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-200'
    else bg = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
  } else {
    if (abs >= 50) bg = 'bg-red-700 dark:bg-red-600 text-white'
    else if (abs >= 30) bg = 'bg-red-600 dark:bg-red-700 text-white'
    else if (abs >= 15) bg = 'bg-red-400 dark:bg-red-800 text-white'
    else if (abs >= 5)  bg = 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200'
    else bg = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }

  return (
    <td className={`py-2.5 px-3 text-center font-mono text-sm font-semibold ${bg} ${base ? 'opacity-80' : ''}`}>
      {v > 0 ? '+' : ''}{v.toFixed(1)}%
    </td>
  )
}

// 연평균 수익률 계산 (기하평균)
function cagr(data: number[]): number {
  const product = data.reduce((acc, v) => acc * (1 + v / 100), 1)
  return (Math.pow(product, 1 / data.length) - 1) * 100
}

// 누적 성장 (배수)
function cumGrowth(data: number[]): number {
  return data.reduce((acc, v) => acc * (1 + v / 100), 1)
}

export default function AnnualReturnsPage() {
  const { rows, asof } = loadRows()

  const fullRows  = rows.filter(r => !r.partial)
  const tqqqFull  = fullRows.filter(r => r.tqqq !== null).map(r => r.tqqq!)
  const qldFull   = fullRows.filter(r => r.qld  !== null).map(r => r.qld!)
  const qqqFull   = fullRows.map(r => r.qqq!)
  const vooFull   = fullRows.filter(r => r.voo  !== null).map(r => r.voo!)

  const firstFull = fullRows[0]?.year ?? 2011
  const lastFull  = fullRows[fullRows.length - 1]?.year ?? 2025

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-12">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">연도별 수익률 비교</h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            2010년부터 현재까지 TQQQ·QLD·QQQ·VOO의 연도별 실제 수익률.
            레버리지가 클수록 좋은 해는 극단적으로 좋고, 나쁜 해는 극단적으로 나쁘다.
          </p>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'TQQQ', cagr_v: cagr(tqqqFull), cum: cumGrowth(tqqqFull), color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30' },
            { label: 'QLD',  cagr_v: cagr(qldFull),  cum: cumGrowth(qldFull),  color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/30' },
            { label: 'QQQ',  cagr_v: cagr(qqqFull),  cum: cumGrowth(qqqFull),  color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30' },
            { label: 'VOO',  cagr_v: cagr(vooFull),  cum: cumGrowth(vooFull),  color: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {s.cagr_v >= 0 ? '+' : ''}{s.cagr_v.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">연평균</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                {s.cum.toFixed(1)}배
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">누적</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 -mt-4">
          {firstFull}~{lastFull}년 (완전한 연도 기준) · TQQQ·QLD·QQQ: 실제 ETF 종가 수익률 · VOO: S&P500 종가 기준 (배당 미포함 — 실제 VOO는 연 1.5%p 정도 높음)
        </p>

        {/* 수익률 표 */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">연도</th>
                <th className="py-3 px-3 text-center text-xs font-medium text-red-600 dark:text-red-400">TQQQ (3x)</th>
                <th className="py-3 px-3 text-center text-xs font-medium text-orange-600 dark:text-orange-400">QLD (2x)</th>
                <th className="py-3 px-3 text-center text-xs font-medium text-blue-600 dark:text-blue-400">QQQ (1x)</th>
                <th className="py-3 px-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400">VOO (S&P500)</th>
                <th className="py-3 px-3 text-left text-xs font-medium text-gray-400 dark:text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.year} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                  <td className="py-2.5 px-3 font-mono font-semibold text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {row.year}
                  </td>
                  <RetCell v={row.tqqq} />
                  <RetCell v={row.qld} />
                  <RetCell v={row.qqq} />
                  <RetCell v={row.voo} base />
                  <td className="py-2.5 px-3 text-xs text-gray-400 dark:text-gray-600 whitespace-nowrap">
                    {row.note ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 인사이트 */}
        <div className="space-y-4 mb-10">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-xl px-5 py-4 text-sm text-green-900 dark:text-green-200 leading-relaxed">
            <strong>좋은 해의 TQQQ:</strong> 2013년 +139.7%, 2017년 +118.1%, 2019년 +133.8%, 2020년 +110.1%, 2023년 +198%.
            VOO가 +25% 하는 해에 TQQQ는 +100%를 넘길 수 있다.
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl px-5 py-4 text-sm text-red-900 dark:text-red-200 leading-relaxed">
            <strong>나쁜 해의 TQQQ:</strong> 2022년 −79.1%. 10억이 2억 1천만원이 됐다.
            VOO −19.4%로 끝난 해에 TQQQ는 −79%였다. 다음 해(2023) TQQQ는 +198%로 회복했지만, 2022년 하락 전에 팔지 않았어야 한다.
          </div>
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl px-5 py-4 text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
            <strong>레버리지의 핵심:</strong> 나쁜 해를 버티면 좋은 해의 극단적 수익이 손실을 훨씬 초과한다.
            2022년 −79.1%를 버티고 2023년 +198%를 맞이한 경우, 2022년 초 10억 → 2억1천 → 2024년 초 6억3천 → 현재 9억3천.
            중간에 팔았다면 다시는 못 들어왔을 수익이다.
          </div>
        </div>

        {/* 관련 링크 */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-2 text-sm">
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">더 읽어볼 것</p>
          {[
            { href: '/posts/real-vs-synthetic', label: '백테스트 합성 가격은 실제와 얼마나 다른가', desc: '2010년 이후 실제 ETF와 직접 비교' },
            { href: '/posts/tqqq-cost', label: 'TQQQ 비용의 전부', desc: '운용보수 + 스왑금리 — 고금리 구간에서 연 11%+' },
            { href: '/posts/market-history', label: '조정장 역사서', desc: '1871년부터 481개 하락 사건 — S&P500 장기 차트 + 전체 목록' },
            { href: '/simulator/custom', label: '백테스트 시뮬레이터', desc: '내 금액, 종목으로 전체 기간 돌려보기' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="flex items-baseline gap-2 group">
              <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:underline whitespace-nowrap">{l.label} →</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{l.desc}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-xs text-gray-400 dark:text-gray-600 space-y-1">
          <p>TQQQ·QLD·QQQ 수익률: 실제 ETF 연간 종가 기준 (연초 첫 거래일 → 연말 마지막 거래일). 2010년 TQQQ는 2월 상장이므로 부분 연도. 가장 최근 연도는 연중 수익률.</p>
          <p>VOO 수익률: S&P500 지수 종가 기준 (배당 미포함). 실제 VOO는 배당(약 연 1.3~1.5%)이 추가로 있어 더 높다.</p>
          <p className="text-gray-300 dark:text-gray-700">데이터 기준: {asof}</p>
        </div>
      </main>
    </div>
  )
}
