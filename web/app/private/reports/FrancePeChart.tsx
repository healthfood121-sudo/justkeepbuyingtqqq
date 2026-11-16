'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend)

// 프랑스 시장 PER(월별, worldperatio — EWQ 최근 12개월 이익 기준) vs 에르메스 PER(연말, 사이트 롤링 데이터)
// 데이터: /data/france_pe.json (scripts/export_france_pe.py), /data/rolling/RMS_rolling.json (epsDecomp의 peBuy·peSell, current.pe)
type Fr = { generated: string; fr: [string, number][]; world: [string, number][]; efa: [string, number][]; us?: [string, number][] }
type Roll = { current: { pe: number }; epsDecomp: { buyYear: number; sellYear: number; peBuy: number; peSell: number }[] }

// 미국(S&P500)이 크게 빠진 구간 — 시작(고점 무렵 월말) ~ 끝(바닥 무렵 월말)
const CRASHES: [string, string, string, string?][] = [
  ['2000-08', '2002-09', '닷컴 붕괴'],
  ['2007-10', '2009-02', '금융위기'],
  ['2011-04', '2011-09', '유럽 재정위기', '이때 에르메스는 실적 호조와 LVMH와의 지분 다툼 속에 올랐다'],
  ['2015-05', '2016-02', '중국 위안화 충격'],
  ['2018-09', '2018-12', '금리 인상 공포'],
  ['2020-01', '2020-03', '코로나'],
  ['2021-12', '2022-09', '금리 급등'],
  ['2025-01', '2025-04', '관세 충격'],
]
const tx = (ym: string) => { const [y, m] = ym.split('-').map(Number); return y + (m - 1) / 12 }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN }

function FrancePeChart() {
  const [fr, setFr] = useState<Fr | null>(null)
  const [rms, setRms] = useState<Roll | null>(null)
  const [px, setPx] = useState<{ sp: Map<string, number>; rm: Map<string, number> } | null>(null)
  useEffect(() => {
    fetch('/data/france_pe.json').then(r => r.ok ? r.json() : null).then(setFr).catch(() => {})
    fetch('/data/rolling/RMS_rolling.json').then(r => r.ok ? r.json() : null).then(setRms).catch(() => {})
    Promise.all([fetch('/data/sp500_monthly.json').then(r => r.json()), fetch('/data/rolling/RMS_monthly_price.json').then(r => r.json())])
      .then(([sp, rm]) => setPx({ sp: new Map((sp as { d: string; p: number }[]).map(x => [x.d, x.p])), rm: new Map((rm.rows as { d: string; c: number }[]).map(x => [x.d.slice(0, 7), x.c])) }))
      .catch(() => {})
  }, [])
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setPluginLoaded(true) })
  }, [])
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])
  const [showWorld, setShowWorld] = useState(false)
  const [showUs, setShowUs] = useState(true)
  const [longUs, setLongUs] = useState(false)

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
    // 미국과 같은 방향인가 — 같은 달 상관계수, 해마다(12월→12월) 오르내린 방향이 같았던 해
    const us = new Map(fr.us ?? [])
    const both = fr.fr.filter(p => us.has(p[0]))
    let corr = NaN, same = 0, yrs = 0, diff: number[] = [], usNow = NaN, usMed = NaN, usFr = NaN, usFrMed = NaN
    if (both.length > 24) {
      const a = both.map(p => p[1]), b = both.map(p => us.get(p[0]) as number)
      const ma = a.reduce((x, y) => x + y, 0) / a.length, mb = b.reduce((x, y) => x + y, 0) / b.length
      let sab = 0, saa = 0, sbb = 0
      a.forEach((x, i) => { sab += (x - ma) * (b[i] - mb); saa += (x - ma) ** 2; sbb += (b[i] - mb) ** 2 })
      corr = sab / Math.sqrt(saa * sbb)
      const decs = both.filter(p => p[0].endsWith('-12'))
      for (let i = 1; i < decs.length; i++) {
        const df = decs[i][1] - decs[i - 1][1], du = (us.get(decs[i][0]) as number) - (us.get(decs[i - 1][0]) as number)
        yrs++; if (df * du > 0) same++; else diff.push(Number(decs[i][0].slice(0, 4)))
      }
      usNow = us.get(last[0]) ?? NaN; usMed = med(b); usFr = usNow / last[1]; usFrMed = med(b.map((x, i) => x / a[i]))
    }
    return { med: med(vals), last, lo, hi, rows, rMed: med(ratios), rNow, since, hMed: med(herm.filter(h => !h.now).map(h => h.pe)), corr, same, yrs, diff, usNow, usMed, usFr, usFrMed }
  }, [fr, herm])

  const crash = useMemo(() => {
    if (!px) return []
    return CRASHES.filter(([a, b]) => px.sp.has(a) && px.sp.has(b) && px.rm.has(a) && px.rm.has(b)).map(([a, b, n, note]) => {
      const ks = [...px.rm.keys()].filter(k => k >= a && k <= b)
      const sp = (px.sp.get(b)! / px.sp.get(a)! - 1) * 100
      const rm = (px.rm.get(b)! / px.rm.get(a)! - 1) * 100
      const worst = (Math.min(...ks.map(k => px.rm.get(k)!)) / px.rm.get(a)! - 1) * 100
      return { a, b, n, note, sp, rm, worst }
    })
  }, [px])

  const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const tick = dark ? '#9ca3af' : '#6b7280'
  const data = useMemo(() => {
    if (!fr) return { datasets: [] }
    const ds: any[] = [
      { label: '에르메스 PER(연말)', data: herm.map(h => ({ x: h.now ? h.y + new Date().getMonth() / 12 : h.y + 11 / 12, y: h.pe })), borderColor: '#ea580c', backgroundColor: '#ea580c', pointRadius: herm.map(h => h.now ? 5 : 2.5), borderWidth: 2, tension: 0.15 },
      { label: '프랑스 시장 PER(월)', data: fr.fr.map(p => ({ x: tx(p[0]), y: p[1] })), borderColor: '#2563eb', backgroundColor: '#2563eb', pointRadius: 0, borderWidth: 1.6, tension: 0.1 },
    ]
    if (showUs && fr.us?.length) ds.push({ label: '미국 시장 PER(월)', data: fr.us.filter(p => longUs || p[0] >= '1995').map(p => ({ x: tx(p[0]), y: p[1] })), borderColor: '#16a34a', backgroundColor: '#16a34a', pointRadius: 0, borderWidth: 1.4, tension: 0.1 })
    if (showWorld) ds.push({ label: '전 세계 PER(월, VT)', data: fr.world.map(p => ({ x: tx(p[0]), y: p[1] })), borderColor: '#9ca3af', backgroundColor: '#9ca3af', pointRadius: 0, borderWidth: 1.2, borderDash: [4, 3], tension: 0.1 })
    return { datasets: ds }
  }, [fr, herm, showWorld, showUs, longUs])
  const options: any = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: { type: 'linear', min: longUs ? 1871 : 1995, max: 2027, ticks: { stepSize: longUs ? 20 : 5, color: tick, callback: (v: number) => `${v}` }, grid: { color: grid } },
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
  }), [pluginLoaded, grid, tick, herm, longUs])

  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">프랑스·미국 시장 PER vs 에르메스 PER — 30년</h3>
        <p className={small}>파란 선은 프랑스 주식 시장 전체(MSCI 프랑스를 따르는 ETF, 최근 12개월 이익 기준)의 월별 PER, 초록 선은 같은 방식으로 잰 미국 시장, 주황 선은 에르메스의 연말 PER이다. 에르메스는 늘 시장보다 비쌌다 — 그래서 &ldquo;시장보다 비싼가&rdquo;보다 &ldquo;평소보다 얼마나 더 비싼가&rdquo;를 본다.</p>
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
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><input type="checkbox" checked={showUs} onChange={e => setShowUs(e.target.checked)} /> 미국</label>
              <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><input type="checkbox" checked={longUs} onChange={e => { setLongUs(e.target.checked); if (e.target.checked) setShowUs(true); chartRef.current?.resetZoom() }} /> 미국 1871년부터</label>
              <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><input type="checkbox" checked={showWorld} onChange={e => setShowWorld(e.target.checked)} /> 전 세계</label>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-600">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동</p>
          </div>
        </div>
        <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
          <li><b>프랑스 시장은 30년 동안 대체로 10~20배</b> 사이를 오갔다. 거품 꼭대기({stats.hi[0].slice(0, 4)}년) 약 {stats.hi[1].toFixed(0)}배, 금융위기·유럽 재정위기 바닥(2008·2011년) 약 7~8배. 지금({stats.last[1].toFixed(1)}배)은 중간값({stats.med.toFixed(1)}배)보다 조금 높다.</li>
          <li><b>에르메스는 시장의 약 {stats.rMed.toFixed(1)}배</b>(30년 중간값)에 거래돼 왔다. 지금은 {stats.rNow.toFixed(1)}배 — {stats.rNow < stats.rMed ? '평소보다 시장 대비 덜 비싼 쪽' : '평소보다 시장 대비 더 비싼 쪽'}이다. 2008·2010·2011년과 2020~2022년엔 시장의 4~4.8배까지 벌어졌었다.</li>
          <li><b>시장이 폭락해도 에르메스는 별로 싸지지 않았다.</b> 2008년 말 프랑스 시장은 7.7배까지 내려갔지만 에르메스는 36배를 지켰다(시장의 약 4.8배). 2011년도 같다. 그래서 &ldquo;시장 폭락 때 에르메스를 아주 싸게 산다&rdquo;는 기대는 과거에 맞지 않았다 — 그래도 그때(2008~2011년) 산 사람의 10년 수익률은 연 19~23%였다. 비싸 보여도 이익이 빠르게 크면 결과가 좋았다.</li>
          {!isNaN(stats.corr) && <li><b>미국과 프랑스는 같은 방향으로 움직였다.</b> 같은 달끼리 비교한 상관계수 {stats.corr.toFixed(2)}(1이면 완전히 같이 움직임), 해마다 PER이 오르내린 방향이 {stats.yrs}년 중 <b>{stats.same}년</b> 같았다{stats.diff.length ? `(다른 해: ${stats.diff.join('·')}년)` : ''}. 거품(2000년)·금융위기(2008년)·유럽 재정위기(2011년)·금리 급등(2022년) 모두 함께 내려갔다. 차이는 <b>높이</b>다 — 미국은 보통 프랑스의 약 {stats.usFrMed.toFixed(1)}배(중간값), 지금은 {stats.usFr.toFixed(2)}배(미국 {stats.usNow.toFixed(1)}배 vs 프랑스 {stats.last[1].toFixed(1)}배)로 평소보다 미국이 더 비싸다.</li>}
          {stats.since && <li><b>지금 시장 대비 웃돈은 {stats.since}년 이후 가장 작다</b>(에르메스 ÷ 프랑스 {stats.rNow.toFixed(1)}배). 프랑스 시장은 평소보다 조금 비싸고, 에르메스는 자기 평소 수준(35배 안팎)보다도 낮은 30배 안팎으로 내려왔기 때문이다.</li>}
        </ul>
        {crash.length > 0 && <div className="space-y-2 pt-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">미국이 빠질 때 에르메스는? — 과거 {crash.length}번</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1 font-medium">미국이 빠진 구간</th><th className="text-right py-1 font-medium">S&amp;P500</th><th className="text-right py-1 font-medium">에르메스</th><th className="text-right py-1 font-medium">에르메스 최대 하락</th></tr></thead>
              <tbody>
                {crash.map(c => (
                  <tr key={c.a} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="py-1 pr-2"><span className="text-gray-900 dark:text-white">{c.n}</span> <span className="text-gray-400 whitespace-nowrap">{c.a.replace('-', '.')}~{c.b.replace('-', '.')}</span>{c.note && <span className="block text-[11px] text-gray-400">{c.note}</span>}</td>
                    <td className={`py-1 text-right font-semibold ${c.sp < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{c.sp > 0 ? '+' : ''}{c.sp.toFixed(0)}%</td>
                    <td className={`py-1 text-right font-semibold ${c.rm < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{c.rm > 0 ? '+' : ''}{c.rm.toFixed(0)}%</td>
                    <td className="py-1 text-right text-gray-600 dark:text-gray-300">{c.worst.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-xs leading-relaxed text-gray-700 dark:text-gray-200">
            <li><b>같이 빠진 적이 대부분이다</b> — {crash.length}번 중 {crash.filter(c => c.rm < 0).length}번. 시장 전체가 공포에 빠지면 좋은 회사도 함께 팔린다.</li>
            <li><b>큰 폭락일수록 덜 빠졌다.</b> 미국이 30% 넘게 빠진 {crash.filter(c => c.sp <= -30).length}번(닷컴·금융위기)엔 에르메스가 미국의 절반쯤만 빠졌고, 코로나 때도 훨씬 덜 빠졌다 — 할인하지 않고, 빚이 없고, 손님이 부자라 이익이 거의 안 꺾였기 때문.</li>
            <li><b>작은 충격엔 비슷하거나 더 빠지기도 했다</b>(2015·2018·2022·2025년) — 중국 손님과 비싼 PER에 민감할 때. 2022년엔 에르메스 PER이 60배대로 비쌌던 탓에 한때 −30% 넘게 빠졌다.</li>
            <li><b>가장 큰 하락은 자기 사정에서 왔다.</b> 2024~2026년 하락 때 미국 시장은 오히려 올랐다 — 명품 불황·중국 둔화·PER 정상화. 지금은 PER이 평소(30배 안팎)로 내려와 2022년보다 빠질 거품이 적다.</li>
          </ul>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">월말 가격 기준(달 중간 최저점은 빠짐). 에르메스는 유로·배당 미반영, S&amp;P500은 달러·배당 미반영. 구간은 미국 고점·바닥 무렵 월말로 잡았다. 표본이 {crash.length}번뿐이라 앞으로도 같다는 보장은 없다.</p>
        </div>}
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
        <p className="text-[11px] text-gray-400 dark:text-gray-500">출처: 프랑스·미국 시장 — worldperatio.com(프랑스는 주식 ETF EWQ의 최근 12개월 이익 기준, 1996년 상장 전은 사이트 추정 · 미국은 같은 사이트의 미국 시장 PER, 1871년부터의 장기 값도 같은 사이트 제공 — 실러 교수 장기 자료로 보임, {fr.generated} 받음). 에르메스 — 사이트 롤링 데이터(연말 주가 ÷ 그해 주당이익). 계산 방식이 서로 달라 배수는 대략으로 볼 것.</p>
      </>}
    </section>
  )
}

export default memo(FrancePeChart)
