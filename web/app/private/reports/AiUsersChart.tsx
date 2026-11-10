'use client'

import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip, Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend)

// AI 비서 사용자 수 추이 — 회사가 발표한 날짜의 숫자만 점으로 찍는다(월·일 단위 연속 자료는 없다).
// 제미나이 = 월 사용자(MAU), 챗GPT = 주 사용자(WAU) — 기준이 달라 같은 숫자라도 챗GPT 쪽이 더 크다(주 사용자 ≤ 월 사용자).
type Pt = { d: string; v: number; src: string; g: 'A' | 'B' }   // v = 백만 명
const GEMINI: Pt[] = [
  { d: '2024-10', v: 90, src: '미국 법무부 재판 자료(보도)', g: 'B' },
  { d: '2025-03', v: 350, src: '재판 자료(보도)', g: 'B' },
  { d: '2025-05', v: 400, src: '구글 I/O 발표', g: 'A' },
  { d: '2025-07', v: 450, src: '2025년 2분기 실적 발표', g: 'A' },
  { d: '2025-10', v: 650, src: '2025년 3분기 실적 발표', g: 'A' },
  { d: '2026-02', v: 750, src: '2025년 4분기 실적 발표', g: 'A' },
  { d: '2026-05', v: 900, src: '구글 I/O 2026 무대 발언(보도)', g: 'B' },
  { d: '2026-07', v: 950, src: '2026년 2분기 실적 발표', g: 'A' },
  { d: '2026-10', v: 1000, src: '2026년 3분기 실적 발표 "10억 명 이상"(8월 11일 돌파 보도)', g: 'A' },
]
const CHATGPT: Pt[] = [
  { d: '2023-11', v: 100, src: '오픈AI 데브데이', g: 'A' },
  { d: '2024-08', v: 200, src: '오픈AI 발표', g: 'A' },
  { d: '2024-12', v: 300, src: '오픈AI 발표', g: 'A' },
  { d: '2025-02', v: 400, src: '오픈AI 발표', g: 'A' },
  { d: '2025-04', v: 500, src: '오픈AI 발표(3월 말)', g: 'A' },
  { d: '2025-08', v: 700, src: '오픈AI 발표', g: 'A' },
  { d: '2025-10', v: 800, src: '오픈AI 데브데이 2025', g: 'A' },
  { d: '2026-02', v: 900, src: '오픈AI 발표(2월 27일)', g: 'A' },
  { d: '2026-08', v: 1000, src: '"주 10억 명 넘었다"(보도)', g: 'B' },
  { d: '2026-09', v: 1200, src: '오픈AI 데브데이 2026 발표 화면(보도 — 여러 서비스 합산 표현이라는 지적도)', g: 'B' },
]
const t = (d: string) => { const [y, m] = d.split('-').map(Number); return y + (m - 0.5) / 12 }
const lab = (d: string) => `${d.slice(0, 4)}년 ${Number(d.slice(5))}월`
const won = (v: number) => v >= 100 ? `${(v / 100).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억 명` : `${v.toLocaleString()}백만 명`

function AiUsersChart() {
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const [pluginLoaded, setPluginLoaded] = useState(false)
  useEffect(() => {
    import('chartjs-plugin-zoom').then(({ default: z }) => { ChartJS.register(z); setPluginLoaded(true) })
  }, [])
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')) }, [])
  const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const tick = dark ? '#9ca3af' : '#6b7280'
  const ds = (name: string, pts: Pt[], color: string) => ({
    label: name, data: pts.map(p => ({ x: t(p.d), y: p.v })), borderColor: color, backgroundColor: color,
    pointRadius: pts.map(p => p.g === 'A' ? 4 : 3), pointStyle: pts.map(p => p.g === 'A' ? 'circle' : 'rectRot'),
    borderWidth: 2, tension: 0.2,
  })
  const data = useMemo(() => ({ datasets: [ds('제미나이 — 월 사용자', GEMINI, '#2563eb'), ds('챗GPT — 주 사용자', CHATGPT, '#10b981')] }), [])
  const options: any = useMemo(() => ({
    responsive: true, maintainAspectRatio: false, animation: false,
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: { type: 'linear', min: 2023.5, max: 2027, ticks: { stepSize: 0.5, color: tick, callback: (v: number) => Number.isInteger(v) ? `${v}년` : '' }, grid: { color: grid } },
      y: { min: 0, ticks: { color: tick, callback: (v: number) => v === 0 ? '0' : `${v / 100}억` }, grid: { color: grid } },
    },
    plugins: {
      legend: { position: 'bottom', labels: { color: tick, boxWidth: 10 } },
      tooltip: {
        callbacks: {
          title: (items: any[]) => {
            const it = items[0]; const pts = it.datasetIndex === 0 ? GEMINI : CHATGPT
            return lab(pts[it.dataIndex].d)
          },
          label: (it: any) => {
            const pts = it.datasetIndex === 0 ? GEMINI : CHATGPT; const p = pts[it.dataIndex]
            return `${it.dataset.label}: ${won(p.v)} (${p.src})`
          },
        },
      },
      ...(pluginLoaded ? { zoom: { zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }, pan: { enabled: true, mode: 'x' } } } : {}),
    },
  }), [pluginLoaded, grid, tick])
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  const g0 = GEMINI.find(p => p.d === '2025-10')!, g1 = GEMINI[GEMINI.length - 1]
  const c0 = CHATGPT.find(p => p.d === '2025-10')!, c1 = CHATGPT[CHATGPT.length - 1]
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI 비서 사용자 수 — 제미나이 vs 챗GPT (vs 클로드)</h3>
        <p className={small}>회사가 발표한 날의 숫자만 점으로 이었다. 월별·일별로 꾸준히 나오는 공식 자료는 없다(하루 사용자 수는 세 회사 모두 숫자를 공개하지 않음 — 구글은 &ldquo;제미나이 하루 사용자 1년 새 3배&rdquo;처럼 증가율만).</p>
      </div>
      <div className="relative">
        <button type="button" onClick={() => chartRef.current?.resetZoom()} className="absolute top-0 right-0 z-10 text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">줌 초기화</button>
        <div style={{ height: 300 }}><Line ref={chartRef} data={data as any} options={options} /></div>
        <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">휠: 확대/축소 &nbsp;|&nbsp; 드래그: 이동</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 p-2.5">
          <p className="font-semibold text-gray-900 dark:text-white">제미나이 (월 사용자)</p>
          <p className="text-gray-700 dark:text-gray-200 tabular-nums">{won(g0.v)} → <b>{won(g1.v)} 이상</b> (1년 +{Math.round((g1.v / g0.v - 1) * 100)}%)</p>
          <p className="text-gray-500">안드로이드·크롬·지메일 안에 기본으로 들어가 &lsquo;쓰게 되는&rsquo; 사용자가 많다. 하루 사용자는 1년 새 3배(회사 발표, 숫자는 비공개).</p>
        </div>
        <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 p-2.5">
          <p className="font-semibold text-gray-900 dark:text-white">챗GPT (주 사용자)</p>
          <p className="text-gray-700 dark:text-gray-200 tabular-nums">{won(c0.v)} → <b>약 {won(c1.v)}</b> (1년 +{Math.round((c1.v / c0.v - 1) * 100)}%)</p>
          <p className="text-gray-500">&lsquo;주&rsquo; 기준이라 같은 숫자면 제미나이보다 더 자주 쓰는 사람들이다. 월 사용자로 바꾸면 더 크다(센서타워 추정 2026년 5월 월 11억 명 이상).</p>
        </div>
        <div className="rounded-lg bg-orange-50/70 dark:bg-orange-950/20 p-2.5">
          <p className="font-semibold text-gray-900 dark:text-white">클로드 (공식 숫자 없음)</p>
          <p className="text-gray-700 dark:text-gray-200 tabular-nums">2026년 5월 추정: 앱 월 약 1억 명(시밀러웹) · 웹·앱 합계 약 2.45억 명(센서타워 모델)</p>
          <p className="text-gray-500">앤트로픽은 사용자 수를 발표하지 않는다. 추정 회사마다 숫자가 몇 배씩 달라 선으로 그리지 않았다. 사용자보다 기업·개발자(API·코딩) 매출 중심.</p>
        </div>
      </div>
      <p className={small}><b>구글 주주에게 의미:</b> 제미나이는 챗GPT보다 늦게 출발했지만 1년 증가율은 비슷하거나 더 빠르다 — 안드로이드·검색이라는 유통망 덕분. 다만 &lsquo;월&rsquo; 대 &lsquo;주&rsquo; 기준 차이 때문에 실제로 자주 쓰는 사람 수는 아직 챗GPT가 많을 가능성이 크다. 앤트로픽은 구글이 지분을 가진 회사라(주주 카드 &lsquo;이익에 안 잡히는 내 몫&rsquo;) 클로드가 커져도 구글 주주에게 득이 된다(TPU 고객이기도 하다).</p>
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500">발표 숫자 표 (눌러서 펼치기)</summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {([['제미나이 — 월 사용자', GEMINI], ['챗GPT — 주 사용자', CHATGPT]] as [string, Pt[]][]).map(([n, pts]) => (
            <table key={n} className="w-full">
              <thead><tr className="text-gray-400 border-b border-gray-200 dark:border-gray-800"><th className="text-left py-1 font-medium" colSpan={3}>{n}</th></tr></thead>
              <tbody>
                {pts.map(p => (
                  <tr key={p.d} className="border-b border-gray-100 dark:border-gray-900">
                    <td className="py-1 pr-2 tabular-nums whitespace-nowrap">{lab(p.d)}</td>
                    <td className="py-1 pr-2 tabular-nums font-semibold whitespace-nowrap">{won(p.v)}</td>
                    <td className="py-1 text-gray-500">{p.src}{p.g === 'B' ? ' ◆' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-1">● 회사 공식 발표 · ◆ 보도·재판 자료 등 2차 출처(덜 확실). 2026년 9월 챗GPT 12억 명은 발표 화면을 전한 보도 기준.</p>
      </details>
    </section>
  )
}

// 화면의 다른 시계가 0.1초마다 다시 그려도 차트는 다시 그리지 않게
export default memo(AiUsersChart)
