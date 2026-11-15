'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend)

// 프랑스 시장 PER(월별, worldperatio — EWQ 최근 12개월 이익 기준) vs 에르메스 PER(연말, 사이트 롤링 데이터)
// 데이터: /data/france_pe.json (scripts/export_france_pe.py), /data/rolling/RMS_rolling.json (epsDecomp의 peBuy·peSell, current.pe)
type Fr = { generated: string; fr: [string, number][]; world: [string, number][]; efa: [string, number][] }
type Roll = { current: { pe: number }; epsDecomp: { buyYear: number; sellYear: number; peBuy: number; peSell: number }[] }

const tx = (ym: string) => { const [y, m] = ym.split('-').map(Number); return y + (m - 1) / 12 }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN }

function FrancePeChart() {
  const [fr, setFr] = useState<Fr | null>(null)
  const [rms, setRms] = useState<Roll | null>(null)
  useEffect(() => {
    fetch('/data/france_pe.json').then(r => r.ok ? r.json() : null).then(setFr).catch(() => {})
    fetch('/data/rolling/RMS_rolling.json').then(r => r.ok ? r.json() : null).then(setRms).catch(() => {})
  }, [])
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setPluginLoaded(true) })
  }, [])
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])
  const [showWorld, setShowWorld] = useState(false)

  // 에르메스 연말 PER: 1993~2015년은 매수 시점(peBuy), 2016년부터는 10년 전 매수의 매도 시점(peSell), 마지막은 지금
  const herm = useMemo(() => {
    if (!rms) return [] as { y: number; pe: number; now?: boolean }[]
    const m = new Map<number, number>()
    for (const r of rms.epsDecomp) {
      if (r.peBuy) m.set(r.buyYear, r.peBuy)
      if (r.peSell && !m.has(r.sellYear)) m.set(r.sellYear, r.peSell)
    }
    const pts: { y: number; pe: number; now?: boolean }[] = [...m.entries()].sort((a, b) => a[0] - b[0]).map(([y, pe]) => ({ y, pe }))
    if (rms.current?.pe) pts.push({ y: new Date().getFullYear(), pe: rms.current.pe, now: true })
    return pts
  }, [rms])

  const stats = useMemo(() => {
    if (!fr || !herm.length) return null
    const vals = fr.fr.map(p => p[1])
    const dec = new Map(fr.fr.filter(p => p[0].endsWith('-12')).map(p => [Number(p[0].slice(0, 4)), p[1]]))
    const last = fr.fr[fr.fr.length - 1]
    const rows = herm.map(h => {
      const f = h.now ? last[1] : dec.get(h.y)
      return { y: h.y, h: h.pe, f, r: f ? h.pe / f : null, now: h.now }
    }).filter(r => r.f)
    const ratios = rows.filter(r => !r.now).map(r => r.r as number)
    const lo = fr.fr.reduce((a, b) => b[1] < a[1] ? b : a), hi = fr.fr.reduce((a, b) => b[1] > a[1] ? b : a)
    const rNow = rows[rows.length - 1]?.r as number
    // 지금 웃돈(에르메스 ÷ 프랑스)보다 작았던 마지막 연말 — 그 다음 해부터 지금이 가장 작다
    const prevLower = rows.filter(r => !r.now && (r.r as number) <= rNow).map(r => r.y)
    const since = prevLower.length ? Math.max(...prevLower) + 1 : null
    return { med: med(vals), last, lo, hi, rows, rMed: med(ratios), rNow, since, hMed: med(herm.filter(h => !h.now).map(h => h.pe)) }
  }, [fr, herm])

  const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const tick = dark ? '#9ca3af' : '#6b7280'
  const data = useMemo(() => {
    if (!fr) return { datasets: [] }
    const ds: any[] = [
      { label: '에르메스 PER(연말)', data: herm.map(h => ({ x: h.now ? h.y + new Date().getMonth() / 12 : h.y + 11 / 12, y: h.pe })), borderColor: '#ea580c', backgroundColor: '#ea580c', pointRadius: herm.map(h => h.now ? 5 : 2.5), borderWidth: 2, tension: 0.15 },
      { label: '프랑스 시장 PER(월)', data: fr.fr.map(p => ({ x: tx(p[0]), y: p[1] })), borderColor: '#2563eb', backgroundColor: '#2563eb', pointRadius: 0, borderWidth: 1.6, tension: 0.1 },
    ]
    if (showWorld) ds.push({ label: '전 세계 PER(월, VT)', data: fr.world.map(p => ({ x: tx(p[0]), y: p[1] })), borderColor: '#9ca3af', backgroundColor: '#9ca3af', pointRadius: 0, borderWidth: 1.2, borderDash: [4, 3], tension: 0.1 })
    return { datasets: ds }
  }, [fr, herm, showWorld])
  const options: any = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: { type: 'linear', min: 1995, max: 2027, ticks: { stepSize: 5, color: tick, callback: (v: number) => `${v}` }, grid: { color: grid } },
      y: { min: 0, ticks: { color: tick, callback: (v: number) => `${v}배` }, grid: { color: grid } },
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: tick, boxWidth: 10 } },
      tooltip: {
        callbacks: {
          title: (items: any[]) => { const it = items[0]; if (it.datasetIndex === 0) { const h = herm[it.dataIndex]; return h.now ? '지금' : `${h.y}년 말` } const x = it.parsed.x; const y = Math.floor(x + 1e-6); return `${y}년 ${Math.round((x - y) * 12) + 1}월` },
          label: (it: any) => `${it.dataset.label}: ${it.parsed.y.toFixed(1)}배`,
        },
      },
      ...(pluginLoaded ? { zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }, pan: { enabled: true, mode: 'x' } } } : {}),
    },
  }), [pluginLoaded, grid, tick, herm])

  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">프랑스 시장 PER vs 에르메스 PER — 30년</h3>
        <p className={small}>파란 선은 프랑스 주식 시장 전체(MSCI 프랑스를 따르는 ETF, 최근 12개월 이익 기준)의 월별 PER, 주황 선은 에르메스의 연말 PER이다. 에르메스는 늘 시장보다 비쌌다 — 그래서 &ldquo;시장보다 비싼가&rdquo;보다 &ldquo;평소보다 얼마나 더 비싼가&rdquo;를 본다.</p>
      </div>
      {!fr || !stats ? <p className={small}>불러오는 중…</p> : <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['프랑스 시장 지금', `${stats.last[1].toFixed(1)}배`, `${stats.last[0].replace('-', '년 ')}월`],
            ['프랑스 30년 중간값', `${stats.med.toFixed(1)}배`, `최저 ${stats.lo[1].toFixed(1)}배(${stats.lo[0].slice(0, 4)}) · 최고 ${stats.hi[1].toFixed(1)}배(${stats.hi[0].slice(0, 4)})`],
            ['에르메스 지금', `${herm[herm.length - 1].pe.toFixed(1)}배`, `연말 기준 중간값 ${stats.hMed.toFixed(1)}배`],
            ['에르메스 ÷ 프랑스', `${stats.rNow.toFixed(1)}배`, `30년 중간값 ${stats.rMed.toFixed(1)}배`],
          ].map(([k, v, s]) => (
            <div key={k} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2.5">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{k}</p>
              <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{v}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{s}</p>
            </div>
          ))}
        </div>
        <div className="relative">
          <button type="button" onClick={() => chartRef.current?.resetZoom()} className="absolute top-0 right-0 z-10 text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">줌 초기화</button>
          <div style={{ height: 320 }}><Line ref={chartRef} data={data as any} options={options} /></div>
          <div className="flex items-center justify-between mt-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><input type="checkbox" checked={showWorld} onChange={e => setShowWorld(e.target.checked)} /> 전 세계 PER도 보기</label>
            <p className="text-xs text-gray-400 dark:text-gray-600">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동</p>
          </div>
        </div>
        <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
          <li><b>프랑스 시장은 30년 동안 대체로 10~20배</b> 사이를 오갔다. 거품 꼭대기({stats.hi[0].slice(0, 4)}년) 약 {stats.hi[1].toFixed(0)}배, 금융위기·유럽 재정위기 바닥(2008·2011년) 약 7~8배. 지금({stats.last[1].toFixed(1)}배)은 중간값({stats.med.toFixed(1)}배)보다 조금 높다.</li>
          <li><b>에르메스는 시장의 약 {stats.rMed.toFixed(1)}배</b>(30년 중간값)에 거래돼 왔다. 지금은 {stats.rNow.toFixed(1)}배 — {stats.rNow < stats.rMed ? '평소보다 시장 대비 덜 비싼 쪽' : '평소보다 시장 대비 더 비싼 쪽'}이다. 2008·2011년과 2020~2022년엔 시장의 3.5~4배까지 벌어졌었다.</li>
          <li><b>시장이 폭락해도 에르메스는 별로 싸지지 않았다.</b> 2008년 말 프랑스 시장은 7.7배까지 내려갔지만 에르메스는 31배를 지켰다(시장의 약 4배). 2011년도 같다. 그래서 &ldquo;시장 폭락 때 에르메스를 아주 싸게 산다&rdquo;는 기대는 과거에 맞지 않았다 — 그래도 그때(2008~2011년) 산 사람의 10년 수익률은 연 19~23%였다. 비싸 보여도 이익이 빠르게 크면 결과가 좋았다.</li>
          {stats.since && <li><b>지금 시장 대비 웃돈은 {stats.since}년 이후 가장 작다</b>(에르메스 ÷ 프랑스 {stats.rNow.toFixed(1)}배). 프랑스 시장은 평소보다 조금 비싸고, 에르메스는 자기 평소 수준(30배 안팎)으로 내려왔기 때문이다.</li>}
        </ul>
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500">연말 숫자 표 (눌러서 펼치기)</summary>
          <table className="w-full mt-2 tabular-nums">
            <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1 font-medium">연말</th><th className="text-right py-1 font-medium">프랑스</th><th className="text-right py-1 font-medium">에르메스</th><th className="text-right py-1 font-medium">에르메스 ÷ 프랑스</th></tr></thead>
            <tbody>
              {[...stats.rows].reverse().map(r => (
                <tr key={r.y + (r.now ? 'n' : '')} className="border-b border-gray-100 dark:border-gray-900">
                  <td className="py-1">{r.now ? `지금(${stats.last[0].replace('-', '년 ')}월)` : r.y}</td>
                  <td className="py-1 text-right">{(r.f as number).toFixed(1)}배</td>
                  <td className="py-1 text-right">{r.h.toFixed(1)}배</td>
                  <td className="py-1 text-right font-semibold">{(r.r as number).toFixed(1)}배</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">출처: 프랑스 시장 — worldperatio.com(프랑스 주식 ETF EWQ의 최근 12개월 이익 기준, 1996년 상장 전은 사이트 추정, {fr.generated} 받음). 에르메스 — 사이트 롤링 데이터(연말 주가 ÷ 그해 주당이익). 계산 방식이 서로 달라 배수는 대략으로 볼 것.</p>
      </>}
    </section>
  )
}

export default memo(FrancePeChart)
