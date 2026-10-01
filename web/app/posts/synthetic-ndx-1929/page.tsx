'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

function DataLink({ lev, beta }: { lev: '1x' | '3x'; beta: string }) {
  return (
    <Link
      href={`/posts/synthetic-ndx-1929/data?lev=${lev}&beta=${beta}`}
      className="text-xs text-blue-500 dark:text-blue-400 hover:underline whitespace-nowrap"
    >
      데이터 →
    </Link>
  )
}
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip,
  Legend, ReferenceLine, ReferenceArea, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, ZAxis,
} from 'recharts'

// ── 타입 ─────────────────────────────────────────────────

type CohortRow = { s: string; y: number | null }
type PriceRow  = { d: string; p: number }

type CohortJson = {
  real:  { '1x': CohortRow[]; '3x': CohortRow[] }
  synth: Record<string, { '1x': CohortRow[]; '3x': CohortRow[] }>
}
type PriceJson = {
  synth: Record<string, PriceRow[]>
}

type PricePoint  = { x: number; pt: number; rc: number; te: number; lt: number }
type ScatterDot  = { x: number; y: number }

// ── 유틸 ─────────────────────────────────────────────────

function ymToDecimal(ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  return y + (m - 0.5) / 12
}
function decimalToYM(x: number): string {
  const year  = Math.floor(x)
  const month = Math.round((x - year) * 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}
function fmtPrice(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`
  return String(Math.round(v))
}

// ── 공통 UI ──────────────────────────────────────────────

function Tag({ children }: { children: string }) {
  return (
    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
      {children}
    </span>
  )
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold mt-12 mb-4 text-gray-900 dark:text-white">{children}</h2>
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-8 mb-3 text-gray-700 dark:text-gray-200">{children}</h3>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
}
function Callout({
  color = 'blue', children,
}: {
  color?: 'blue' | 'yellow' | 'red' | 'green'
  children: React.ReactNode
}) {
  const s = {
    blue:   'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-500/10 dark:border-yellow-500/30 dark:text-yellow-200',
    red:    'bg-red-50 border-red-200 text-red-800 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
    green:  'bg-green-50 border-green-200 text-green-800 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
  }
  return (
    <div className={`border rounded-xl px-5 py-4 mb-6 text-sm leading-relaxed ${s[color]}`}>
      {children}
    </div>
  )
}
function Table({
  headers, rows, highlight,
}: {
  headers: string[]
  rows: (string | number | React.ReactNode)[][]
  highlight?: number[]
}) {
  return (
    <div className="overflow-x-auto mb-8">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-4 text-left text-gray-500 dark:text-gray-400 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`transition-colors ${highlight?.includes(i) ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
            >
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-gray-700 dark:text-gray-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
function ChartCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center leading-relaxed">
      {children}
    </p>
  )
}

// ── 차트 1: 가격 히스토리 ─────────────────────────────────

const PRICE_COLORS = {
  pt: '#9ca3af',   // gray    — pre-tech
  te: '#10b981',   // emerald — tech-era
  lt: '#a855f7',   // purple  — latest
  rc: '#3b82f6',   // blue    — recent (highlight)
}

function PriceHistoryChart({ chartData }: { chartData: PricePoint[] }) {
  if (!chartData.length) return (
    <div className="h-72 flex items-center justify-center text-sm text-gray-400">로딩 중...</div>
  )
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
        NDX 3x 합성 가격 지수 — 로그 스케일 (1927-12 = 100)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} />
          <XAxis
            dataKey="x"
            type="number"
            domain={[1927, 2027]}
            tickCount={11}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={String}
          />
          <YAxis
            scale="log"
            domain={['auto', 'auto']}
            tickFormatter={fmtPrice}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            width={48}
          />
          <ReTooltip
            formatter={(v, name) => {
              const label: Record<string, string> = {
                pt: 'β=0.767 pre-tech',
                rc: 'β=1.138 recent',
                te: 'β=1.244 tech-era',
                lt: 'β=1.294 latest',
              }
              return [fmtPrice(v as number), label[name as string] ?? name]
            }}
            labelFormatter={v => `${v}년`}
            contentStyle={{
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f3f4f6',
            }}
          />
          <Legend
            formatter={v => {
              const label: Record<string, string> = {
                pt: 'β=0.767 pre-tech',
                rc: 'β=1.138 recent',
                te: 'β=1.244 tech-era',
                lt: 'β=1.294 latest',
              }
              return <span style={{ fontSize: 11 }}>{label[v] ?? v}</span>
            }}
          />
          {/* 1929 대공황 */}
          <ReferenceArea x1={1929} x2={1933} fill="#ef4444" fillOpacity={0.08} />
          {/* 닷컴버블 */}
          <ReferenceArea x1={1999} x2={2003} fill="#3b82f6" fillOpacity={0.08} />
          {/* NDX 실측 시작 */}
          <ReferenceLine
            x={1971}
            stroke="#6b7280"
            strokeDasharray="4 3"
            label={{ value: '← NDX 실측', position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
          />
          <Line dataKey="pt" stroke={PRICE_COLORS.pt} strokeWidth={1.5} dot={false} name="pt" />
          <Line dataKey="te" stroke={PRICE_COLORS.te} strokeWidth={1.5} dot={false} name="te" />
          <Line dataKey="lt" stroke={PRICE_COLORS.lt} strokeWidth={1.5} dot={false} name="lt" />
          <Line dataKey="rc" stroke={PRICE_COLORS.rc} strokeWidth={2.5} dot={false} name="rc" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 차트 2: 코호트 소요기간 산점도 ───────────────────────

function CohortTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ScatterDot; name: string; color: string }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100">
      <p className="text-gray-400 mb-1">{decimalToYM(d.x)} 진입</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.payload.y === 'number' ? p.payload.y.toFixed(2) : '—'}년
        </p>
      ))}
    </div>
  )
}

function CohortScatterChart({
  pretechDots, recentDots, realDots,
}: {
  pretechDots: ScatterDot[]
  recentDots:  ScatterDot[]
  realDots:    ScatterDot[]
}) {
  if (!recentDots.length) return (
    <div className="h-72 flex items-center justify-center text-sm text-gray-400">로딩 중...</div>
  )
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-2">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
        진입 시점별 목표 달성 소요기간 — NDX 3x C전략 (일 20만원, 목표 10억)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.6} />
          <XAxis
            dataKey="x"
            type="number"
            domain={[1927, 2027]}
            ticks={[1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={String}
            name="진입년도"
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[0, 20]}
            ticks={[0, 4, 8, 12, 16, 20]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={v => `${v}년`}
            width={40}
            name="소요기간"
          />
          <ZAxis range={[16, 16]} />
          <ReTooltip content={<CohortTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {/* 1929 대공황 */}
          <ReferenceArea
            x1={1929} x2={1933}
            fill="#ef4444" fillOpacity={0.1}
            label={{ value: '대공황', position: 'insideTop', fontSize: 10, fill: '#ef4444' }}
          />
          {/* 닷컴버블 */}
          <ReferenceArea
            x1={1997} x2={2001}
            fill="#3b82f6" fillOpacity={0.1}
            label={{ value: '닷컴', position: 'insideTop', fontSize: 10, fill: '#3b82f6' }}
          />
          {/* BUFFER_REF=14 */}
          <ReferenceLine
            y={14}
            stroke="#f59e0b"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{ value: 'BUFFER=14', position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
          />
          <Scatter
            name="β=0.767 pre-tech (합성)"
            data={pretechDots}
            fill="#9ca3af"
            fillOpacity={0.35}
          />
          <Scatter
            name="β=1.138 recent (합성)"
            data={recentDots}
            fill="#3b82f6"
            fillOpacity={0.65}
          />
          <Scatter
            name="실제 NDX 3x (1971~)"
            data={realDots}
            fill="#f59e0b"
            fillOpacity={0.9}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────

export default function SyntheticNdx1929Post() {
  const [cohortJson, setCohortJson] = useState<CohortJson | null>(null)
  const [priceJson,  setPriceJson]  = useState<PriceJson  | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/synthetic_ndx_cohorts.json').then(r => r.json()),
      fetch('/data/synthetic_ndx_prices.json').then(r => r.json()),
    ]).then(([c, p]) => {
      setCohortJson(c)
      setPriceJson(p)
    })
  }, [])

  // ── 차트 데이터 계산 ────────────────────────────────────

  const priceChartData = useMemo<PricePoint[]>(() => {
    if (!priceJson) return []
    const ptArr = priceJson.synth['pre-tech']
    const rcArr = priceJson.synth['recent']
    const teArr = priceJson.synth['tech-era']
    const ltArr = priceJson.synth['latest']
    const out: PricePoint[] = []
    for (let i = 0; i < rcArr.length; i++) {
      if (!rcArr[i].d.endsWith('-01')) continue  // 연 1회 (1월)
      out.push({
        x:  parseInt(rcArr[i].d.split('-')[0]),
        pt: Math.round(ptArr[i]?.p ?? 0),
        rc: Math.round(rcArr[i].p),
        te: Math.round(teArr[i]?.p ?? 0),
        lt: Math.round(ltArr[i]?.p ?? 0),
      })
    }
    return out
  }, [priceJson])

  const pretechDots = useMemo<ScatterDot[]>(() => {
    if (!cohortJson) return []
    return cohortJson.synth['pre-tech']['3x']
      .filter(r => r.y !== null)
      .map(r => ({ x: ymToDecimal(r.s), y: r.y as number }))
  }, [cohortJson])

  const recentDots = useMemo<ScatterDot[]>(() => {
    if (!cohortJson) return []
    return cohortJson.synth['recent']['3x']
      .filter(r => r.y !== null)
      .map(r => ({ x: ymToDecimal(r.s), y: r.y as number }))
  }, [cohortJson])

  const realDots = useMemo<ScatterDot[]>(() => {
    if (!cohortJson) return []
    return cohortJson.real['3x']
      .filter(r => r.y !== null)
      .map(r => ({ x: ymToDecimal(r.s), y: r.y as number }))
  }, [cohortJson])

  // ── 렌더 ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" maxWidth="max-w-4xl" />

      <main className="max-w-3xl mx-auto px-6 py-16">

        {/* 헤더 */}
        <div className="mb-12">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 inline-block">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-black leading-tight mb-4">
            1929년 대공황 시나리오는 TQQQ에서 얼마나 걸릴까
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            NDX 데이터는 1971년부터만 존재한다. 대공황을 테스트하려면 SP500으로 가상 NDX를 만들어야 한다.
            베타를 어떻게 잡느냐에 따라 결과가 크게 달라지는데, 그 과정 전체를 기록한다.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">2026-10-01</span>
            {['C전략', '1929', '가상데이터', '베타', '백테스트'].map(t => <Tag key={t}>{t}</Tag>)}
          </div>
        </div>

        {/* ── 1. 왜 1929년인가 ── */}
        <H2>왜 1929년을 테스트해야 하는가</H2>
        <P>
          NDX 기반 백테스트는 1971년 2월부터 시작하는 모든 진입 시점을 다룬다. 현재 데이터 기준 worst-case는
          닷컴버블 직전인{' '}
          <strong className="text-gray-900 dark:text-white">1998년 6월 진입, 13.74년</strong>이다.
          여기서 인출식 현금 버퍼를 계산하는 기준인 BUFFER_REF=14가 나왔다.
        </P>
        <P>
          그런데 한 가지가 찜찜하다. 1929년 대공황은 어떨까?
          S&P500 기준 고점에서 −89%까지 빠졌고 실질 회복에 25년이 걸렸다.
          이 시나리오를 NDX 3배 레버리지에 그대로 적용하면 14년 버퍼로도 모자랄 수 있지 않을까?
        </P>
        <P>
          NDX는 1971년 이전 데이터가 없으므로 직접 테스트할 방법이 없다.
          그래서 SP500과 NDX의 통계적 관계에서 베타를 뽑아내어
          <strong className="text-gray-900 dark:text-white"> 가상의 pre-1971 NDX 수익률</strong>을 만들어봤다.
        </P>

        {/* ── 2. 합성 방법 ── */}
        <H2>합성 방법: SP500 수익률 × 베타</H2>
        <P>
          NDX 1x 가상 수익률을 만드는 공식은 단순하다.
        </P>
        <div className="bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 mb-6 font-mono text-sm text-gray-700 dark:text-gray-200 space-y-1">
          <div>NDX_daily_ret = β × SP500_daily_ret + α</div>
          <div className="text-gray-400 dark:text-gray-500 text-xs mt-2">
            β : NDX 수익률이 SP500 대비 얼마나 증폭되는가 (OLS 기울기)<br />
            α : SP500과 무관한 NDX 고유의 일별 초과수익 (OLS 절편)
          </div>
        </div>
        <P>
          β와 α를 실측 기간(1971~2026)의 일별 데이터로 OLS 회귀해서 구했다.
          이 계수를 1971년 이전 SP500 일별 수익률에 적용해 가상 NDX를 만들고,
          실제 NDX가 시작되는 1971년 2월 5일 시점에서 자연스럽게 접합했다.
        </P>

        {/* ── 3. 시대별 베타 ── */}
        <H2>베타는 시대에 따라 크게 달라진다</H2>
        <P>
          NDX와 SP500은 같은 미국 주식시장이지만, 나스닥에서 기술주가 차지하는 비중이
          시대별로 완전히 달랐다. 1971년 창설 초기에는 중소형주 위주였고,
          1990년대 이후 마이크로소프트·인텔·애플 등이 지수를 주도하면서 SP500과의 특성이 크게 벌어졌다.
        </P>

        <Table
          headers={['기간', 'β (기울기)', 'α (일별 초과수익)', '해석']}
          highlight={[1, 2]}
          rows={[
            ['1971–1990 (pre-tech)', '0.767', '거의 0', 'SP500보다 오히려 덜 움직임'],
            ['1991–2026 (tech-era)', '1.244', '+4.34%/년', '기술주 붐 이후 확실히 고변동'],
            ['2011–2026 (recent)', '1.138', '+4.45%/년', '최근 15년 실측치'],
            ['2021–2026 (latest)', '1.294', '−1.53%/년', '최근 5년, α가 오히려 마이너스'],
          ]}
        />

        <P>
          1971~1990년 베타(0.767)를 1929년에 적용하면 당시 나스닥이 기술주 중심이 아니었으므로
          보수적인(덜 변동하는) 합성 NDX가 만들어진다.
          최근 베타(1.14~1.29)를 소급 적용하는 것도 엄밀히는 틀린 가정이지만,
          <strong className="text-gray-900 dark:text-white"> 현재 NDX의 성격</strong>을 기준으로
          역사적 극단을 스트레스 테스트하는 데는 더 의미 있는 시나리오를 만든다.
          그래서 네 가지 베타를 모두 돌렸다.
        </P>

        {/* ── 차트 1: 가격 히스토리 ── */}
        <H3>베타별 합성 NDX 3x 가격 경로</H3>
        <P>
          아래 차트는 1927년 12월을 100으로 놓고, 베타마다 NDX 3x 합성 가격이 어떻게 달라지는지를 보여준다.
          수직 점선 오른쪽이 실제 NDX 데이터 구간이므로 네 선이 하나로 합쳐진다.
          1929 대공황(붉은 영역)에서 각 베타가 얼마나 깊이 빠지는지 차이를 볼 수 있다.
        </P>
        <PriceHistoryChart chartData={priceChartData} />
        <ChartCaption>
          붉은 영역: 1929 대공황(1929~1933) · 파란 영역: 닷컴버블(1999~2003) ·
          점선: NDX 실측 시작(1971) · β=1.138 recent(파란 굵은선) 기준으로 논의
        </ChartCaption>

        {/* ── 4. NDX 1x 결과 ── */}
        <H2>NDX 1x 합성 백테스트 — C전략 (일 20만원, 목표 10억)</H2>
        <P>
          먼저 레버리지 없는 1배 기준이다. 실제 NDX 1x C전략의 worst는 14.34년(1996-06)이다.
          합성 구간 포함 시 어떻게 달라지는지 확인했다.
        </P>
        <Table
          headers={['베타', '전체 worst', '진입 시점', '1929-01 진입', '']}
          highlight={[1, 2]}
          rows={[
            ['β=0.767  pre-tech',  '17.38년', '1960-07', '16.28년', <DataLink key="pt" lev="1x" beta="pre-tech" />],
            ['β=1.138  recent',    '15.38년', '1962-07', '14.33년', <DataLink key="rc" lev="1x" beta="recent" />],
            ['β=1.244  tech-era',  '15.37년', '1962-11', '14.40년', <DataLink key="te" lev="1x" beta="tech-era" />],
            ['β=1.294  latest',    '17.41년', '1927-12', '16.47년', <DataLink key="lt" lev="1x" beta="latest" />],
          ]}
        />
        <P>
          최근 베타 기준으로 1929-01 진입 시 14.3~14.4년이 나온다.
          전체 worst는 1962년 전후(15.3~15.4년)이고, 1929년 자체가 all-time worst는 아니다.
          pre-tech(0.767)로 가면 1929가 아니라 1960년대가 worst(17.4년)가 된다.
        </P>

        {/* ── 5. NDX 3x 결과 ── */}
        <H2>NDX 3x 합성 백테스트 — C전략</H2>
        <P>
          실제로 투자하는 TQQQ는 3배 레버리지다. 합성 1x 수익률에 3배를 적용해 같은 방식으로 테스트했다.
        </P>
        <Table
          headers={['베타', '전체 worst', '진입 시점', '1929-01 진입', '']}
          highlight={[1, 2]}
          rows={[
            ['β=0.767  pre-tech',  '17.32년', '1927-12', '16.31년', <DataLink key="pt" lev="3x" beta="pre-tech" />],
            ['β=1.138  recent',
              <strong key="w" className="text-green-600 dark:text-green-400">13.74년 (닷컴!)</strong>,
              '1998-06',
              <strong key="c" className="text-blue-500 dark:text-blue-400">7.76년</strong>,
              <DataLink key="rc" lev="3x" beta="recent" />],
            ['β=1.244  tech-era',
              <strong key="w" className="text-green-600 dark:text-green-400">13.74년 (닷컴!)</strong>,
              '1998-06',
              <strong key="c" className="text-blue-500 dark:text-blue-400">7.76년</strong>,
              <DataLink key="te" lev="3x" beta="tech-era" />],
            ['β=1.294  latest',  '17.69년', '1927-12', '16.68년', <DataLink key="lt" lev="3x" beta="latest" />],
          ]}
        />

        <Callout color="green">
          <strong>최근 베타(β=1.138, β=1.244) 기준: 전체 worst는 닷컴버블 13.74년이고,
          1929년 대공황 진입은 오히려 7.76년으로 훨씬 짧다.</strong>
        </Callout>

        {/* ── 차트 2: 코호트 산점도 ── */}
        <H3>진입 시점별 소요기간 전체 분포</H3>
        <P>
          아래 산점도는 1927년부터 2026년까지 매월 진입했을 때 10억 달성까지 걸린 시간을 점으로 찍은 것이다.
          회색 점이 pre-tech β=0.767, 파란 점이 recent β=1.138(합성),
          노란 점이 실제 NDX 3x(1971~) 데이터다.
        </P>
        <CohortScatterChart
          pretechDots={pretechDots}
          recentDots={recentDots}
          realDots={realDots}
        />
        <ChartCaption>
          붉은 영역: 1929 대공황 진입 시점 · 파란 영역: 닷컴버블 진입 시점 ·
          노란 점선: BUFFER_REF=14 · 파란 점(recent β)에서 대공황 구간이 8년 이하에 몰려 있음을 확인
        </ChartCaption>

        {/* ── 6. 왜 1929가 짧은가 ── */}
        <H2>왜 대공황 진입이 닷컴버블보다 짧게 나오는가</H2>
        <P>
          처음 보면 의아하다. 역사상 가장 심각한 폭락인데 왜 오히려 빠를까?
        </P>
        <P>
          핵심은 3배 레버리지의 수학적 특성이다.
          SP500 기준 −89% 하락이 일별 복리로 3배 적용되면 합성 가격은 사실상 극히 낮은 수준까지 내려간다.
          대공황 저점(1932~1933년)에서 TQQQ 합성가격이 매우 낮아지면,
          일 20만원으로 매일 사는 주수가 폭발적으로 늘어난다.
          이후 1940년대 회복장에서 수십 배가 된 보유량이 한꺼번에 불어나
          10억 달성이 예상 외로 빨리 이루어진다.
        </P>
        <P>
          <strong className="text-gray-900 dark:text-white">닷컴버블이 더 가혹한 이유</strong>는
          저점이 더 얕아서가 아니다.
          하락과 횡보가 <em>천천히, 길게</em> 이어진다는 점이다.
          1998년 6월 진입 시 2000년 3월까지 잠깐 급등했다가
          2002년까지 95%가 빠지고, 이후에도 2008년 금융위기가 겹친다.
          하락이 완만하게 진행되기 때문에 저가 매수 효과가 제한적으로 작동하고,
          결국 13.74년이 걸린다.
        </P>
        <P>
          차트에서도 확인할 수 있다. 파란 점(recent β) 기준으로 1929~1933년 진입 시점(붉은 영역)은
          모두 8년 이하에 몰려 있다. 반면 1997~2001년 진입 시점(파란 영역)은 10~14년에 분포한다.
          노란 점(실제 NDX)의 1998-06이 전체 최고점 13.74년이다.
        </P>

        {/* ── 7. 결론 ── */}
        <H2>결론: BUFFER_REF=14로 충분하다</H2>
        <ul className="list-none space-y-3 mb-8">
          {[
            {
              color: 'text-green-500 dark:text-green-400',
              text: '최근 베타(β=1.14~1.24) 기준, NDX 3x C전략의 전체 worst는 닷컴버블(1998-06, 13.74년)이다. 1929년 대공황은 3배 레버리지에서 7~8년 수준으로 단축된다.',
            },
            {
              color: 'text-blue-500 dark:text-blue-400',
              text: '닷컴버블 worst 13.74년 → BUFFER_REF=14 설정 근거. 합성 데이터로 확인한 1929 시나리오(14.3~14.4년, 1x 기준)도 여유 있게 대응 가능하다.',
            },
            {
              color: 'text-yellow-500 dark:text-yellow-400',
              text: 'pre-tech β=0.767이나 latest β=1.294를 쓰면 1927~1929 진입이 worst(17년+)가 된다. 하지만 pre-tech β는 현재 NDX 특성을 반영하지 못하고, latest β는 α가 음수여서 비현실적인 가정을 포함한다.',
            },
            {
              color: 'text-gray-400',
              text: '합성 데이터는 어디까지나 가상 시나리오다. 실측 데이터(1971~2026)의 worst-case인 닷컴버블이 가장 신뢰할 수 있는 기준점이다.',
            },
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-gray-600 dark:text-gray-300 text-sm">
              <span className={`${item.color} mt-0.5 shrink-0`}>→</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>

        <Callout color="blue">
          <strong>요약:</strong> SP500 + 베타 회귀로 가상 pre-1971 NDX를 합성해 1929년을 스트레스 테스트한 결과,
          최근 베타 기준으로는 닷컴버블(13.74년)이 더 힘든 시나리오였다.
          <strong> BUFFER_REF=14는 이 모든 시나리오를 커버한다.</strong>
        </Callout>

        {/* 캐비엇 */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed space-y-2 mt-8">
          <p className="font-semibold text-gray-700 dark:text-gray-300">캐비엇 및 한계</p>
          <p>
            SP500 데이터는 1927-12-30부터 사용했다. 이 기간의 SP500 자체도 현재와는 구성·거래 구조가 다르다.
          </p>
          <p>
            베타 회귀는 일별 수익률 OLS 기준이다. 실제로는 변동성 레짐, 금리 환경, 섹터 구성이
            모두 시대별로 다르기 때문에 어떤 단일 베타도 &ldquo;정답&rdquo;이 없다.
            다양한 베타를 비교한 것은 그 불확실성의 범위를 보기 위해서다.
          </p>
          <p>
            TQQQ/QLD 가격은 NDX 일별 수익률 × 레버리지로 합성한 이론치다.
            운용비용(TQQQ 0.88%/년)·추적오차는 미반영. 변동성 끌림은 일별 복리 계산에 자동 반영된다.
          </p>
          <p>
            이 분석의 목적은 BUFFER_REF 설정에 쓸 worst-case 추정치를 구하는 것이다.
            합성 데이터로 직접적인 투자 판단을 하는 데는 한계가 있음을 감안할 것.
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-16 pt-8 flex items-center justify-between text-sm text-gray-400">
          <Link href="/posts" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">← 글 목록</Link>
          <Link href="/simulator" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">시뮬레이터에서 직접 돌려보기 →</Link>
        </div>
      </main>
    </div>
  )
}
