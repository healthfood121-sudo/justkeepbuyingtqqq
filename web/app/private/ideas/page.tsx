'use client'

import { useEffect, useMemo, useState } from 'react'
import PrivateTabs from '@/components/PrivateTabs'
import { EXTRA_METRICS, PICKS, PICKS_AS_OF, PICK_SECTIONS } from './picks'
import {
  classify, GROUPS, GRADE_LABEL, gradeColor, groupColor, qualityScore, fmt, fmtSgn, LENSES,
  type GroupKey, type LensKey, type Metrics, type Quality,
} from '@/lib/ideas'

type Row = Metrics & { q?: Quality; group: GroupKey | null; score: number; great: boolean }
type SortKey = 'score' | 'pe' | 'peVsMed' | 'epsCagr10' | 'epsVsPeak' | 'fromHigh3y' | 'roll10Median' | 'expRet10' | 'name'

export default function IdeasPage() {
  const [base, setBase] = useState<Array<Metrics & { q?: Quality }> | null>(null)
  const [lens, setLens] = useState<LensKey>('moat')
  const [generated, setGenerated] = useState('')
  const [grade, setGrade] = useState<'all' | 'great' | 'AB'>('great')
  const [group, setGroup] = useState<'all' | GroupKey>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'expRet10', desc: true })

  useEffect(() => {
    Promise.all([
      fetch('/data/fundamentals/_summary.json').then(r => r.json()),
      fetch('/data/fundamentals/_quality.json').then(r => r.json()),
    ]).then(([s, q]) => {
      const qs = q.stocks as Record<string, Quality>
      setGenerated(s.generated)
      setBase([...(s.stocks as Metrics[]), ...EXTRA_METRICS].map(m => ({ ...m, q: qs[m.key] })))
    }).catch(() => setBase([]))
  }, [])

  // 선택한 '위대한 기업' 기준으로 분류를 다시 계산
  const rows = useMemo<Row[] | null>(() => base && base.map(m => ({
    ...m,
    group: classify(m, m.q, lens),
    score: qualityScore(m.q),
    great: !!m.q && LENSES[lens].test(m.q, m.key),
  })), [base, lens])

  const byKey = useMemo(() => new Map((rows ?? []).map(r => [r.key, r])), [rows])

  const filtered = useMemo(() => {
    if (!rows) return []
    const ql = query.trim().toLowerCase()
    const list = rows.filter(r =>
      (grade === 'all' || (grade === 'great' ? r.great : r.q?.grade === 'A' || r.q?.grade === 'B')) &&
      (group === 'all' || r.group === group) &&
      (!ql || r.key.toLowerCase().includes(ql) || (r.name ?? '').toLowerCase().includes(ql)))
    const val = (r: Row): number | string | null => sort.key === 'name' ? r.name : (r as any)[sort.key]
    return [...list].sort((a, b) => {
      const va = val(a), vb = val(b)
      if (va == null) return 1
      if (vb == null) return -1
      const c = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
      return sort.desc ? -c : c
    })
  }, [rows, grade, group, query, sort])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    rows?.forEach(r => { if (r.group) c[r.group] = (c[r.group] ?? 0) + 1 })
    return c
  }, [rows])

  const th = 'py-2 px-2 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap'
  const td = 'py-1.5 px-2 tabular-nums text-gray-700 dark:text-gray-200 whitespace-nowrap'
  const SortTh = ({ k, children, left }: { k: SortKey; children: React.ReactNode; left?: boolean }) => (
    <th
      onClick={() => setSort(s => ({ key: k, desc: s.key === k ? !s.desc : k !== 'name' }))}
      className={`${th} ${left ? 'text-left' : 'text-right'} cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${sort.key === k ? 'text-gray-800 dark:text-gray-100' : ''}`}
    >
      {children}{sort.key === k ? (sort.desc ? ' ↓' : ' ↑') : ''}
    </th>
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <PrivateTabs active="ideas" />

        {/* ── 사용 방법 ── */}
        <section className="rounded-xl border-2 border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">사용 방법 — 3단계로 보면 된다</h2>
          <ol className="space-y-2.5 text-sm text-gray-700 dark:text-gray-200">
            <li className="flex gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              <div>
                <b>아래 &lsquo;Claude가 고른 종목 정리&rsquo;부터 본다.</b>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  ⓪~⑤는 <b>지금 상황</b>별 묶음이다(⓪ 브랜드 기업이 싸진 경우 · ① 이익은 그대로인데 값만 내려옴 · ② 싸졌지만 이유가 있음 · ③ 값이 평소 수준 · ④ 이익이 줄어듦 · ⑤ 지금은 비쌈).
                  묶음 안의 <b>1위·2위</b>는 먼저 살 만한 순서다.
                </p>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <div>
                <b>카드의 배지로 회사 자체가 얼마나 좋은지 확인한다.</b>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="px-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">위대한 기업</span>(A) ·
                  <span className="px-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ml-1">좋은 기업</span>(B) ·
                  <span className="px-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 ml-1">보통</span>(C).
                  등급은 주가와 상관없이 사업만 보고 먼저 매긴 것이다. 카드의 <b>왜</b>는 고른 이유, <b className="text-red-500">볼 것</b>은 확인할 위험이다.
                </p>
              </div>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <div>
                <b>궁금한 종목은 위 &lsquo;위대한 기업&rsquo; 탭에서 종목을 골라 자세히 본다.</b>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  노란 박스(직접 쓴 분석) → 사업성 평가 → 지금 상태 요약 → 연도별 수익률 분해 → 시나리오 표 순서로 나온다.
                </p>
              </div>
            </li>
          </ol>
          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-blue-200 dark:border-blue-900/60 pt-2 space-y-1">
            <p><b>더 파고들고 싶다면:</b> 아래 &lsquo;자동 분류&rsquo;에서 위대한 기업의 기준(브랜드형·성장형·버핏형 등)을 바꿔 보고, &lsquo;전체 종목 표&rsquo;에서 열 제목을 눌러 정렬하거나 종목을 검색한다.</p>
            <p><b>숫자 읽는 법:</b> PER/10년 중간 100% 미만이면 평소보다 싸다는 뜻. 이익/고점 100%면 이익이 최고 수준, 85% 미만이면 이익이 꺾인 상태.</p>
          </div>
        </section>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">종목 아이디어</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rows ? `${rows.length}개 종목` : '전 종목'}을 같은 기준으로 훑었다. 사업이 좋은가(정성 평가) × 지금 값이 어떤가(PER·이익 흐름)를 함께 본다.
          </p>
          {generated && <p className="text-xs text-gray-400">숫자 데이터 {generated} · 정성 평가·추천 {PICKS_AS_OF}</p>}
        </div>

        {/* ── 추천 정리 ── */}
        <section className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Claude가 고른 종목 정리</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              분류 안의 순위는 가격 매력(지금 PER과 자기 평소 PER), 이익 흐름(지금도 늘고 있나), 사업의 질, 투자 논리가 깨질 위험을 함께 본 판단이다.
              1위가 가장 먼저 살 만하다는 뜻이고, 숫자 하나로 정한 순위가 아니다.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              ⓪~⑤ 번호는 기업의 등급이 아니라 &lsquo;지금 어떤 상황인가&rsquo;(값이 싼지, 이익이 흔들리는지)에 따른 분류다. 기업 자체의 질은 카드의 등급 배지(위대한 기업·좋은 기업·보통)로 본다.
              대부분 위대한 기업(A)이지만 도미노·데커스·태피스트리·유나이티드헬스·가트너·블랙스톤은 좋은 기업(B), 나이키는 보통(C)이다.
            </p>
          </div>
          {PICK_SECTIONS.map(sec => {
            const picks = PICKS.filter(p => p.section === sec.key)
            if (!picks.length) return null
            return (
              <div key={sec.key} className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{sec.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sec.desc}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {picks.map((pk, idx) => {
                    const r = byKey.get(pk.key)
                    return (
                      <div key={pk.key} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-amber-400 text-white' : idx < 3 ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>{idx + 1}위</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{r?.name ?? pk.key}</span>
                          <span className="text-xs text-gray-400">{pk.key}</span>
                          {r?.q && <span className={`text-[11px] px-1.5 py-0.5 rounded ${gradeColor(r.q.grade)}`}>{GRADE_LABEL[r.q.grade]}</span>}
                        </div>
                        {r && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
                            <span>PER {fmt(r.pe)}배 (10년 중간 {fmt(r.peMed10)}배)</span>
                            <span>EPS 10년 {fmtSgn(r.epsCagr10)}/년</span>
                            <span>3년 고점 대비 {fmtSgn(r.fromHigh3y, 0)}</span>
                          </div>
                        )}
                        <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">{pk.why}</p>
                        {pk.rankNote && <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400"><b>이 순위인 이유:</b> {pk.rankNote}</p>}
                        <p className="text-xs leading-relaxed text-red-500/90"><b>볼 것:</b> {pk.watch}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>

        {/* ── 자동 선별 기준 ── */}
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">자동 분류 — &lsquo;위대한 기업&rsquo; 기준 고르기</h2>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(LENSES) as LensKey[]).map(k => (
              <button key={k} onClick={() => setLens(k)}
                className={`px-2.5 py-1 text-xs rounded-md border ${lens === k ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {LENSES[k].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            지금 기준: <b>{LENSES[lens].label}</b> — {LENSES[lens].desc}. 이 기준을 통과한 기업 {rows ? rows.filter(r => r.great).length : 0}개를 아래 네 가지로 나눴다.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {(Object.keys(GROUPS) as GroupKey[]).map(g => (
              <button
                key={g}
                onClick={() => setGroup(group === g ? 'all' : g)}
                className={`text-left rounded-lg border p-3 transition-colors ${group === g ? 'border-gray-900 dark:border-white' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${groupColor(g)}`}>{GROUPS[g].label}</span>
                  <span className="text-xs text-gray-400">{counts[g] ?? 0}개</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{GROUPS[g].desc}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            기준마다 &lsquo;위대한 기업&rsquo;이 달라진다. 예: 애플은 어느 기준이든 통과하지만 PER이 평소보다 40% 높아 &lsquo;지금은 비쌈&rsquo;으로 분류된다. 카드를 누르면 아래 표가 그 분류로 걸러진다.
          </p>
        </section>

        {/* ── 전체 표 ── */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">전체 종목 표</h2>
          <div className="flex flex-wrap gap-2 items-center text-xs">
            {([['great', '선택한 기준 통과'], ['AB', 'A·B 등급'], ['all', '전체']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setGrade(k)}
                className={`px-2.5 py-1 rounded-md border ${grade === k ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>
                {l}
              </button>
            ))}
            {group !== 'all' && (
              <button onClick={() => setGroup('all')} className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                분류: {GROUPS[group].short} ✕
              </button>
            )}
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="종목 검색"
              className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-32"
            />
            <span className="text-gray-400">{filtered.length}개</span>
          </div>

          {rows === null ? (
            <p className="text-xs text-gray-400">불러오는 중…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <SortTh k="name" left>종목</SortTh>
                    <th className={`${th} text-left`}>등급</th>
                    <SortTh k="score">사업성</SortTh>
                    <th className={`${th} text-left`}>분류</th>
                    <SortTh k="pe">PER</SortTh>
                    <SortTh k="peVsMed">PER/10년 중간</SortTh>
                    <SortTh k="epsCagr10">EPS 10년(연)</SortTh>
                    <SortTh k="epsVsPeak">이익/고점</SortTh>
                    <SortTh k="fromHigh3y">3년 고점 대비</SortTh>
                    <SortTh k="roll10Median">과거 10년 보유(중간)</SortTh>
                    <SortTh k="expRet10">단순 기대(연)</SortTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map(r => (
                    <tr key={r.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/40" title={r.q ? `${r.q.business}\n강점: ${r.q.strength}\n위험: ${r.q.risk}` : ''}>
                      <td className={`${td} text-left`}>
                        <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                        <span className="ml-1 text-gray-400">{r.key}</span>
                      </td>
                      <td className={td}>{r.q && <span className={`px-1.5 py-0.5 rounded ${gradeColor(r.q.grade)}`}>{r.q.grade}</span>}</td>
                      <td className={`${td} text-right`}>{r.score || '—'}</td>
                      <td className={td}>{r.group && <span className={`px-1.5 py-0.5 rounded ${groupColor(r.group)}`}>{GROUPS[r.group].short}</span>}</td>
                      <td className={`${td} text-right`}>{fmt(r.pe)}</td>
                      <td className={`${td} text-right ${r.peVsMed == null ? '' : r.peVsMed <= 0.85 ? 'text-emerald-600 dark:text-emerald-400' : r.peVsMed >= 1.3 ? 'text-red-500' : ''}`}>
                        {r.peVsMed != null ? `${(r.peVsMed * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td className={`${td} text-right`}>{fmtSgn(r.epsCagr10)}</td>
                      <td className={`${td} text-right ${r.epsVsPeak != null && r.epsVsPeak < 0.85 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {r.epsVsPeak != null ? `${(r.epsVsPeak * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td className={`${td} text-right`}>{fmtSgn(r.fromHigh3y, 0)}</td>
                      <td className={`${td} text-right`}>{fmt(r.roll10Median, 1, '%')}</td>
                      <td className={`${td} text-right font-semibold`}>{fmtSgn(r.expRet10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-[11px] text-gray-400 dark:text-gray-500 space-y-1">
            <p>사업성 = 경쟁우위·가격결정력·수익성·성장성·지속가능성 점수 합(25점 만점, Claude 정성 평가). 행에 마우스를 올리면 사업·강점·위험이 보인다.</p>
            <p>PER/10년 중간 = 현재 PER ÷ 최근 10년 연말 PER의 중간값. 이익/고점 = 최근 1년 EPS ÷ 최근 10년 연간 EPS 최고치.</p>
            <p>단순 기대(연) = EPS가 최근 5년·10년 성장률 중 낮은 값(최대 15%)으로 늘고, PER이 10년 중간값(최대 35배)으로 돌아가며, 배당이 유지된다는 가정의 10년 연평균. 일회성 손익·적자 이력이 있는 종목은 왜곡될 수 있다.</p>
            <p>EPS: SEC 공시(10-K, 희석 EPS, 분할 반영) · 주가: Yahoo Finance. 에르메스는 SEC 공시가 없어 위대한 기업 탭의 분석값을 직접 넣었다(3년 고점 대비는 연말 주가 기준 근사치). ETF는 표에서 빠진다.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
