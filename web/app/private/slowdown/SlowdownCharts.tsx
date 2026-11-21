'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, LineElement, PointElement, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, LineElement, PointElement, Tooltip, Legend, Filler)

type Ser = { start: string; v: (number | null)[] }
const months = (s: Ser) => {
  const [y0, m0] = s.start.split('-').map(Number)
  return s.v.map((_, i) => { const t = y0 * 12 + (m0 - 1) + i; return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}` })
}

// 경기침체 기간(USREC=1)을 회색 배경으로
const recessionShade = (labels: string[], rec: Record<string, number>) => ({
  id: 'recShade',
  beforeDatasetsDraw(chart: ChartJS) {
    const { ctx, chartArea, scales } = chart
    const x = scales.x
    ctx.save()
    ctx.fillStyle = 'rgba(148,163,184,0.22)'
    let start: number | null = null
    labels.forEach((l, i) => {
      const on = rec[l] === 1
      if (on && start === null) start = i
      if ((!on || i === labels.length - 1) && start !== null) {
        const a = x.getPixelForValue(start), b = x.getPixelForValue(on ? i : i - 1)
        ctx.fillRect(a, chartArea.top, Math.max(2, b - a), chartArea.bottom - chartArea.top)
        start = null
      }
    })
    ctx.restore()
  },
})

function useZoom() {
  const [ok, setOk] = useState(false)
  useEffect(() => { import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setOk(true) }) }, [])
  return ok
}

export default function SlowdownCharts({ chart }: { chart: Record<string, Ser> }) {
  const pluginLoaded = useZoom()
  const r1 = useRef<ChartJS<'line'> | null>(null)
  const r2 = useRef<ChartJS<'line'> | null>(null)
  const r3 = useRef<ChartJS<'line'> | null>(null)
  const r4 = useRef<ChartJS<'line'> | null>(null)
  const [from, setFrom] = useState('1970')

  const { labels, get, rec } = useMemo(() => {
    const all: Record<string, Record<string, number | null>> = {}
    let lab = new Set<string>()
    for (const [k, s] of Object.entries(chart)) {
      const ms = months(s); all[k] = {}
      ms.forEach((m, i) => { all[k][m] = s.v[i]; lab.add(m) })
    }
    const labels = [...lab].sort().filter(m => m >= `${from}-01`)
    const get = (k: string) => labels.map(m => all[k]?.[m] ?? null)
    const rec: Record<string, number> = {}
    labels.forEach(m => { rec[m] = (all.USREC?.[m] ?? 0) as number })
    return { labels, get, rec }
  }, [chart, from])

  const zoom = pluginLoaded ? { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const }, pan: { enabled: true, mode: 'x' as const } } : undefined
  const base = (yTitle: string, log = false) => ({
    responsive: true, maintainAspectRatio: false, animation: false as const, spanGaps: true,
    interaction: { mode: 'index' as const, intersect: false },
    elements: { point: { radius: 0 }, line: { borderWidth: 1.5 } },
    scales: {
      x: { ticks: { maxTicksLimit: 12, autoSkip: true, font: { size: 10 } }, grid: { display: false } },
      y: { type: (log ? 'logarithmic' : 'linear') as 'linear', title: { display: true, text: yTitle, font: { size: 10 } }, ticks: { font: { size: 10 } } },
    },
    plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } }, ...(zoom ? { zoom } : {}) },
  })
  const shade = recessionShade(labels, rec)
  const btn = 'absolute top-0 right-0 z-10 text-[10px] px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
  const hint = <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동 &nbsp;|&nbsp; 회색 띠 = 경기침체 기간(미국 경제연구소 NBER)</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 text-xs">
        {['1970', '1990', '2005', '2015'].map(y => (
          <button key={y} onClick={() => setFrom(y)} className={`px-2 py-0.5 rounded border ${from === y ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>{y}년부터</button>
        ))}
      </div>

      <div className="relative">
        <button onClick={() => r1.current?.resetZoom()} className={btn}>줌 초기화</button>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">① 나스닥100(로그)과 경기침체 기간</p>
        <div style={{ height: 300 }}>
          <Line ref={r1} plugins={[shade]} data={{ labels, datasets: [
            { label: '나스닥100', data: get('NDX'), borderColor: 'rgb(37,99,235)' },
          ] }} options={base('지수(로그)', true)} />
        </div>
        {hint}
      </div>

      <div className="relative">
        <button onClick={() => r2.current?.resetZoom()} className={btn}>줌 초기화</button>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">② 금리: 기준금리 · 10년−3개월 금리차 · 신용 스프레드</p>
        <div style={{ height: 300 }}>
          <Line ref={r2} plugins={[shade]} data={{ labels, datasets: [
            { label: '기준금리(%)', data: get('FEDFUNDS'), borderColor: 'rgb(220,38,38)' },
            { label: '10년−3개월 금리차(%p)', data: get('CURVE'), borderColor: 'rgb(16,185,129)' },
            { label: '신용 스프레드 BAA−10년(%p)', data: get('CREDIT'), borderColor: 'rgb(245,158,11)' },
            { label: '하이일드 스프레드(%p)', data: get('BAMLH0A0HYM2'), borderColor: 'rgb(168,85,247)' },
          ] }} options={base('%')} />
        </div>
        {hint}
      </div>

      <div className="relative">
        <button onClick={() => r4.current?.resetZoom()} className={btn}>줌 초기화</button>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">④ 신용(1973년~): 연준 GZ 회사채 스프레드 · 초과 채권 프리미엄(EBP) · 12개월 침체 확률</p>
        <div style={{ height: 300 }}>
          <Line ref={r4} plugins={[shade]} data={{ labels, datasets: [
            { label: 'GZ 회사채 스프레드(%p)', data: get('GZ'), borderColor: 'rgb(168,85,247)' },
            { label: '초과 채권 프리미엄 EBP(%p)', data: get('EBP'), borderColor: 'rgb(245,158,11)' },
            { label: '12개월 침체 확률(×10, 0.5 = 5%)', data: get('EBPPROB').map(v => v == null ? null : Math.round(v * 1000) / 100), borderColor: 'rgb(220,38,38)', borderDash: [4, 3], borderWidth: 1 },
          ] }} options={base('%p')} />
        </div>
        {hint}
        <p className="text-xs text-gray-400 dark:text-gray-600">하이일드 스프레드의 옛 기록 대신 — 회사채 전체(우량~투기)의 부도 위험 웃돈. 바닥에서 눌려 있다가 침체 때 튀는 모양이 하이일드와 같다. 침체 확률 선은 ×10(예: 5 = 50%).</p>
      </div>

      <div className="relative">
        <button onClick={() => r3.current?.resetZoom()} className={btn}>줌 초기화</button>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">③ 실업률 · 삼 규칙 지표 · 물가</p>
        <div style={{ height: 300 }}>
          <Line ref={r3} plugins={[shade]} data={{ labels, datasets: [
            { label: '실업률(%)', data: get('UNRATE'), borderColor: 'rgb(37,99,235)' },
            { label: '삼 규칙 지표(%p, 0.5 넘으면 침체 신호)', data: get('SAHMREALTIME'), borderColor: 'rgb(220,38,38)' },
            { label: '물가 상승률(전년 대비, %)', data: get('INFL'), borderColor: 'rgb(107,114,128)' },
          ] }} options={base('%')} />
        </div>
        {hint}
      </div>
    </div>
  )
}

// 주간 그래프: 하이일드·BAA 스프레드(기준선 5·6·8%), 실업수당 신규 청구 4주 평균
const hLines = (ys: [number, string][]) => ({
  id: 'hLines',
  afterDraw(chart: ChartJS) {
    const { ctx, chartArea, scales } = chart
    const y = scales.y
    ctx.save()
    ys.forEach(([v, label]) => {
      if (v < y.min || v > y.max) return
      const py = y.getPixelForValue(v)
      ctx.strokeStyle = 'rgba(220,38,38,0.45)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(chartArea.left, py); ctx.lineTo(chartArea.right, py); ctx.stroke()
      ctx.setLineDash([]); ctx.fillStyle = 'rgba(220,38,38,0.8)'; ctx.font = '10px sans-serif'
      ctx.fillText(label, chartArea.left + 4, py - 3)
    })
    ctx.restore()
  },
})

export function WeeklyCharts({ hy, baa, wedge }: { hy: [string, number][]; baa: [string, number][]; wedge?: { anchorA: [string, number]; anchorB: [string, number] } | null }) {
  const pluginLoaded = useZoom()
  const a = useRef<ChartJS<'line'> | null>(null)
  const spread = useMemo(() => {
    const m1 = new Map(hy), m2 = new Map(baa)
    const labels = [...new Set([...hy.map(x => x[0]), ...baa.map(x => x[0])])].sort()
    // 위쪽 추세선(로그 직선): 두 기준 달의 월말 값을 잇는다
    const mi = (s: string) => Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7)) - 1 + (s.length > 7 ? (Number(s.slice(8, 10)) - 15) / 30 : 0)
    const line = wedge ? (() => { const [am, av] = wedge.anchorA, [bm, bv] = wedge.anchorB; const k = Math.log(bv / av) / (mi(bm) - mi(am)); return (s: string) => av * Math.exp(k * (mi(s) - mi(am))) })() : null
    return { labels, hy: labels.map(l => m1.get(l) ?? null), baa: labels.map(l => m2.get(l) ?? null), line: line ? labels.map(l => Math.round(line(l) * 100) / 100) : null }
  }, [hy, baa, wedge])
  const zoom = pluginLoaded ? { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const }, pan: { enabled: true, mode: 'x' as const } } : undefined
  const opt = (yTitle: string, min?: number) => ({
    responsive: true, maintainAspectRatio: false, animation: false as const, spanGaps: true,
    interaction: { mode: 'index' as const, intersect: false },
    elements: { point: { radius: 0 }, line: { borderWidth: 1.5 } },
    scales: { x: { ticks: { maxTicksLimit: 10, font: { size: 10 } }, grid: { display: false } }, y: { min, title: { display: true, text: yTitle, font: { size: 10 } }, ticks: { font: { size: 10 } } } },
    plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } }, ...(zoom ? { zoom } : {}) },
  })
  const btn = 'absolute top-0 right-0 z-10 text-[10px] px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
  return (
    <div className="space-y-6">
      <div className="relative">
        <button onClick={() => a.current?.resetZoom()} className={btn}>줌 초기화</button>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">하이일드 스프레드 · BAA 회사채 스프레드 (주말 값)</p>
        <div style={{ height: 260 }}>
          <Line ref={a} plugins={[hLines([[2.42, '2.42 2007년 바닥'], [2.62, '2.62 바닥대'], [3.94, '3.94 2025년 꼭대기'], [5.02, '5.02 첫 목표'], [6, '6% 경고']])]} data={{ labels: spread.labels, datasets: [
            { label: '하이일드 스프레드(%)', data: spread.hy, borderColor: 'rgb(168,85,247)' },
            { label: 'BAA − 10년 국채(%p)', data: spread.baa, borderColor: 'rgb(245,158,11)' },
            ...(spread.line ? [{ label: '위쪽 추세선(2020·2022·2025년 꼭대기)', data: spread.line, borderColor: 'rgb(236,72,153)', borderDash: [6, 4], borderWidth: 1.2 }] : []),
          ] }} options={opt('%', 0)} />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동 &nbsp;|&nbsp; 하이일드는 FRED 공개분(최근 3년)만</p>
      </div>
    </div>
  )
}


// 실업수당 신규 청구 — 1967년~ 4주 평균(로그 가능), 1년 최저선, 최저 +10%·+20% 돌파선, 침체 기간, 과거 +20% 신호 표시
export function ClaimsChart({ long, ccsa, rec, signals }: {
  long: [string, number, number][]; ccsa: [string, number][]; rec: { start: string; v: (number | null)[] } | undefined
  signals: [string, number, boolean, number][]
}) {
  const pluginLoaded = useZoom()
  const ref = useRef<ChartJS<'line'> | null>(null)
  const [from, setFrom] = useState('2019')
  const [log, setLog] = useState(true)
  const [showC, setShowC] = useState(false)
  const recSet = useMemo(() => {
    const s: Record<string, number> = {}
    if (rec) { const ms = months(rec); ms.forEach((m, i) => { s[m] = (rec.v[i] ?? 0) as number }) }
    return s
  }, [rec])
  const d = useMemo(() => {
    const rows = long.filter(r => r[0] >= `${from}-01-01`)
    const labels = rows.map(r => r[0])
    const cm = new Map(ccsa)
    const sig = new Map(signals.map(s => [s[0], s]))
    return {
      labels, ma: rows.map(r => r[1]), lo: rows.map(r => r[2]), lo10: rows.map(r => Math.round(r[2] * 1.1)), lo20: rows.map(r => Math.round(r[2] * 1.2)),
      cc: rows.map(r => cm.get(r[0]) ?? null),
      sig: rows.map(r => sig.has(r[0]) ? r[1] : null),
      sigColor: rows.map(r => sig.get(r[0])?.[2] ? 'rgb(220,38,38)' : 'rgb(107,114,128)'),
      recByLabel: Object.fromEntries(labels.map(l => [l, recSet[l.slice(0, 7)] ?? 0])) as Record<string, number>,
    }
  }, [long, ccsa, signals, from, recSet])
  const zoom = pluginLoaded ? { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const }, pan: { enabled: true, mode: 'x' as const } } : undefined
  const shade = recessionShade(d.labels, d.recByLabel)
  const btn = (on: boolean) => `px-2 py-0.5 rounded border ${on ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`
  const last = long[long.length - 1]
  return (
    <div className="relative space-y-2">
      <div className="flex flex-wrap items-center gap-1 text-xs">
        {[['1967', '1967년~'], ['2000', '2000년~'], ['2015', '2015년~'], ['2019', '2019년~'], ['2024', '최근 3년']].map(([y, l]) => (
          <button key={y} onClick={() => setFrom(y)} className={btn(from === y)}>{l}</button>
        ))}
        <span className="mx-1 text-gray-300">|</span>
        <button onClick={() => setLog(!log)} className={btn(log)}>로그 눈금</button>
        <button onClick={() => setShowC(!showC)} className={btn(showC)}>계속 청구 같이 보기</button>
        <button onClick={() => ref.current?.resetZoom()} className="ml-auto px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-500">줌 초기화</button>
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">실업수당 신규 청구 4주 평균 — 지금 {(last[1] / 10000).toFixed(1)}만 건, 1년 최저 {(last[2] / 10000).toFixed(1)}만 건, 경고선 {(last[2] * 1.2 / 10000).toFixed(1)}만 건</p>
      <div style={{ height: 340 }}>
        <Line ref={ref} plugins={[shade]} data={{ labels: d.labels, datasets: [
          { label: '4주 평균', data: d.ma, borderColor: 'rgb(37,99,235)', borderWidth: 1.6, yAxisID: 'y' },
          { label: '1년 최저(바닥선)', data: d.lo, borderColor: 'rgb(16,185,129)', borderWidth: 1, yAxisID: 'y' },
          { label: '바닥 +10%(주의선)', data: d.lo10, borderColor: 'rgb(245,158,11)', borderWidth: 1, borderDash: [4, 4], yAxisID: 'y' },
          { label: '바닥 +20%(돌파선·경고)', data: d.lo20, borderColor: 'rgb(220,38,38)', borderWidth: 1.2, borderDash: [6, 4], yAxisID: 'y' },
          { label: '과거 +20% 신호(빨강=침체, 회색=거짓 경보)', data: d.sig, borderColor: 'transparent', backgroundColor: d.sigColor, pointBackgroundColor: d.sigColor, pointRadius: 5, showLine: false, yAxisID: 'y' },
          ...(showC ? [{ label: '계속 청구(오른쪽 눈금)', data: d.cc, borderColor: 'rgb(168,85,247)', borderWidth: 1.2, yAxisID: 'y2' }] : []),
        ] }} options={{
          responsive: true, maintainAspectRatio: false, animation: false as const, spanGaps: true,
          interaction: { mode: 'index' as const, intersect: false },
          elements: { point: { radius: 0 } },
          scales: {
            x: { ticks: { maxTicksLimit: 10, font: { size: 10 } }, grid: { display: false } },
            y: { type: (log ? 'logarithmic' : 'linear') as 'linear', title: { display: true, text: '건(로그)', font: { size: 10 } }, ticks: { font: { size: 10 }, callback: (v: string | number) => `${Math.round(Number(v) / 1000)}천` }, ...(log ? {} : { max: 600000 }) },
            ...(showC ? { y2: { position: 'right' as const, grid: { display: false }, ticks: { font: { size: 10 }, callback: (v: string | number) => `${Math.round(Number(v) / 10000)}만` } } } : {}),
          },
          plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: (c: { dataset: { label?: string }; parsed: { y: number | null } }) => c.parsed.y == null ? '' : `${c.dataset.label}: ${Math.round(c.parsed.y).toLocaleString()}건` } }, ...(zoom ? { zoom } : {}) },
        }} />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-600">휠: 확대/축소 | 드래그: 이동 | 회색 띠 = 경기침체 | 파란 선이 빨간 점선(바닥 +20%)을 뚫고 몇 주 머물면 경고. 2020년 코로나 때는 600만 건대까지 튐(로그 눈금으로 보면 한 화면에 보인다).</p>
    </div>
  )
}
