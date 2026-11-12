'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { buildRows, bucketStats, bucketOf, fmt, type Synthetic, type CycleRow } from './cycle'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-14 mb-4 text-gray-900 dark:text-white">{children}</h2>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}
function Callout({ color = 'blue', children }: { color?: 'blue' | 'yellow' | 'red' | 'green'; children: React.ReactNode }) {
  const styles = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${styles[color]}`}>{children}</div>
}
function DataLink({ b }: { b: string }) {
  return <Link href={`/posts/nasdaq-cycle/data?b=${b}`} className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap">데이터 →</Link>
}

type Now = { cagr: number; from: number; asOf: string } | null

export default function NasdaqCyclePage() {
  const [rows, setRows] = useState<CycleRow[] | null>(null)
  const [now, setNow] = useState<Now>(null)
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setPluginLoaded(true) })
    fetch('/data/synthetic_daily.json').then(r => r.json()).then((s: Synthetic) => setRows(buildRows(s))).catch(() => setRows([]))
    // 지금 위치: 매주 자동 갱신되는 나스닥100(QQQ) 10년 보유 데이터의 진행 중 구간
    fetch('/data/rolling/QQQ_rolling.json').then(r => r.json()).then(q => {
      const r = (q.rows10y ?? []).filter((x: any) => !x.isComplete && x.yearsActual >= 9).sort((a: any, b: any) => a.buyYear - b.buyYear)[0]
      if (r) setNow({ cagr: r.cagr, from: r.buyYear, asOf: r.sellDate })
    }).catch(() => {})
  }, [])
  const stats = useMemo(() => rows ? bucketStats(rows) : [], [rows])
  const nowB = now ? bucketOf(now.cagr) : null
  const nowS = nowB ? stats.find(s => s.key === nowB.key) : null

  const chart = useMemo(() => {
    if (!rows) return null
    const r = rows.filter(x => x.month >= '1981-01')
    return {
      data: {
        labels: r.map(x => x.month),
        datasets: [
          { label: '지난 10년 연평균 수익률', data: r.map(x => x.past), borderColor: 'rgba(59,130,246,0.9)', backgroundColor: 'rgba(59,130,246,0.9)', borderWidth: 1.6, pointRadius: 0 },
          { label: '그 시점부터 다음 10년', data: r.map(x => x.nextNdx), borderColor: 'rgba(16,185,129,0.9)', backgroundColor: 'rgba(16,185,129,0.9)', borderWidth: 1.6, pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false as const,
        interaction: { mode: 'index' as const, intersect: false },
        scales: {
          x: { ticks: { maxTicksLimit: 10, font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { callback: (v: any) => `${v}%`, font: { size: 10 } }, grid: { color: 'rgba(128,128,128,0.12)' } },
        },
        plugins: {
          legend: { position: 'bottom' as const, labels: { font: { size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${c.parsed.y == null ? '—' : fmt(c.parsed.y)}` } },
          zoom: pluginLoaded ? { pan: { enabled: true, mode: 'x' as const }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const } } : undefined,
        },
      },
    }
  }, [rows, pluginLoaded])

  const th = 'py-2 px-2 text-xs font-medium text-gray-400 dark:text-gray-500 text-right whitespace-nowrap'
  const td = 'py-2 px-2 text-sm tabular-nums text-right text-gray-700 dark:text-gray-200'

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">적립식</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">사이클</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3">나스닥 사이클 — 지금은 어디쯤인가</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">2026-11-12</p>
        </div>

        <P>
          나스닥은 크게 오르는 10년과 거의 제자리인 10년을 번갈아 겪었다. 1970년대와 2000년대가 그 &lsquo;긴 횡보장&rsquo;이었다.
          그렇다면 <b>지난 10년이 얼마나 좋았는지</b>를 보면 다음 10년을 짐작할 수 있을까? 1985년 이후 매달 시작한 경우를 모두 모아 확인했다.
        </P>

        {/* 지금 위치 */}
        <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-500/10 px-5 py-4 mb-8">
          <p className="text-xs font-semibold tracking-wide text-amber-700 dark:text-amber-300 mb-1">지금 위치 · 매주 자동 갱신</p>
          {now && nowS ? (
            <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
              나스닥100의 지난 약 10년({now.from}년 말 → {now.asOf}) 연평균 수익률 <b className="text-lg">{fmt(now.cagr)}</b> — 아래 표의 <b>&lsquo;{nowB!.label}&rsquo;</b> 구간.
              과거 이 구간에서 시작한 다음 10년은 나스닥100 <b>{fmt(nowS.ndxMed)}</b>(중간값, 범위 {fmt(nowS.ndxMin)}~{fmt(nowS.ndxMax)}),
              TQQQ를 그냥 들고 간 경우 <b>{fmt(nowS.tqqqMed)}</b>({nowS.count}번 중 {nowS.tqqqLoss}번 손실)였다.
            </p>
          ) : <p className="text-sm text-gray-500">불러오는 중…</p>}
        </div>

        <H2>지난 10년이 좋았던 만큼 다음 10년은 낮았다</H2>
        <P>1985년 이후 매월 첫 거래일에 시작했다고 보고, 그 시점까지의 <b>지난 10년 연평균 수익률</b>로 나눈 뒤 <b>그 시점부터 다음 10년</b>이 어땠는지 모았다(나스닥100 지수 가격 기준·배당 제외, TQQQ는 운용보수·차입 비용 반영 합성 가격).</P>
        <div className="overflow-x-auto mb-4">
          <table className="w-full">
            <thead><tr className="border-b border-gray-200 dark:border-gray-800">
              <th className={`${th} text-left`}>지난 10년</th><th className={th}>다음 10년 나스닥100</th><th className={th}>다음 10년 TQQQ</th><th className={th}></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.map(s => (
                <tr key={s.key} className={nowB?.key === s.key ? 'bg-amber-50 dark:bg-amber-500/10 font-semibold' : ''}>
                  <td className={`${td} text-left whitespace-nowrap`}>{s.label}{nowB?.key === s.key ? ' ← 지금' : ''}<div className="text-[10px] font-normal text-gray-400">{s.count}번 · {s.years}</div></td>
                  <td className={td}>{fmt(s.ndxMed)}<div className="text-[10px] font-normal text-gray-400">손실 {s.ndxLoss}번</div></td>
                  <td className={`${td} ${(s.tqqqMed ?? 0) < 0 ? 'text-red-500' : ''}`}>{fmt(s.tqqqMed)}<div className="text-[10px] font-normal text-gray-400">손실 {s.tqqqLoss}번</div></td>
                  <td className={td}><DataLink b={s.key} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">수익률은 다음 10년 연평균 수익률의 중간값. &lsquo;데이터 →&rsquo;를 누르면 그 구간의 시작 시점을 전부 볼 수 있다.</p>

        {chart && (
          <div className="relative mb-8">
            <button onClick={() => chartRef.current?.resetZoom()} className="absolute top-0 right-0 z-10 px-2 py-0.5 text-xs text-gray-400 border border-gray-200 dark:border-gray-700 rounded">줌 초기화</button>
            <div style={{ height: 320 }}><Line ref={chartRef} data={chart.data} options={chart.options as any} /></div>
            <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동</p>
          </div>
        )}
        <P>
          파란 선(지난 10년)이 높이 올라간 때 초록 선(다음 10년)은 낮았고, 파란 선이 바닥일 때 초록 선은 높았다. 대표적으로 2000년 초 지난 10년이 연 30% 넘던 때 다음 10년은 마이너스였고,
          2010년 초 지난 10년이 마이너스였던 때 다음 10년은 연 16% 안팎이었다.
        </P>

        <H2>그래도 조심해서 읽을 것</H2>
        <Callout color="yellow">
          <b>사례가 적다.</b> &lsquo;지난 10년 18~22%&rsquo; 구간은 거의 다 1996~1998년, 즉 닷컴 거품 한 번의 사례다. 1999년 나스닥은 이익이 거의 없는 회사들이 아주 비싸게 거래됐지만,
          지금의 대형 기술 기업은 실제로 이익을 크게 낸다. 같은 결과가 반복된다는 보장은 없다.
          이 표가 말해 주는 건 &ldquo;언제 빠진다&rdquo;가 아니라 <b>&ldquo;앞으로 10년의 평균 기대치가 낮아졌을 수 있다&rdquo;</b>는 정도다.
        </Callout>
        <P>
          <b>나스닥100 1배</b>는 지난 10년이 좋았던 어느 구간에서도 다음 10년 손실이 거의 없었다. 반면 <b>TQQQ를 사서 그냥 들고만 있으면</b> 지수가 느리게 오르거나 오르내리기만 해도
          비용과 변동성 때문에 크게 녹았다. 이 사이트가 TQQQ를 &lsquo;규칙과 함께&rsquo; 다루는 이유다 — 지수가 이동평균 아래로 내려가면 레버리지를 줄이는 신호 전략은 <Link href="/posts/strategy-abc" className="underline">전략 비교</Link>에 있다.
        </P>
        <Callout color="green">
          <b>반대로 가장 좋았던 출발점은 &lsquo;지난 10년이 나빴던 때&rsquo;</b>였다(5% 미만 구간 — 다음 10년 나스닥100 연 17% 안팎, TQQQ도 손실 없음).
          긴 횡보장이 다시 오더라도 그동안 꾸준히 적립한 돈은 다음 상승의 출발점이 된다. 적립을 멈추지 않는 것이 이 사이클에서 가장 확실한 대응이다.
        </Callout>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-10">
          데이터: 나스닥100·TQQQ 합성 일별 가격(1971~, 운용보수 0.88%·차입 비용 반영) — <Link href="/posts/synthetic-methodology" className="underline">합성 방법</Link>. 지금 위치는 나스닥100(QQQ) 실제 가격(배당 포함)으로 매주 갱신 — 표의 과거 값(배당 제외)보다 연 1%포인트 안팎 높게 나올 수 있다.
          과거 결과가 미래를 보장하지 않으며, 투자 판단과 책임은 본인에게 있다.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">시기별 종목 연구 노트는 멤버십 공간에 있다.</p>
      </main>
    </div>
  )
}
