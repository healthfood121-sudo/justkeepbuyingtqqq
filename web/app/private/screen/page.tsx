'use client'

import { useEffect, useMemo, useState } from 'react'

// 숨은 알짜 찾기 — 나스닥 상장·러셀2000·나스닥100 종목을 숫자로 1차 선별한 순위표
// 데이터: /data/screen/universe.json (scripts/screen_universe.py, Actions '숨은 알짜 1차 선별')

type Row = {
  t: string; n: string; sec: string; f: string; mc: number; px: number; sc: number
  yrs: number; py: number; rg: number | null; eg: number | null; roic: number | null
  fpy: number | null; fcfm: number | null; nd: number | null; nc: boolean; dil: number | null
  pe: number | null; fy: number | null; pc: number | null; xs: number | null; sp: number; fyr: number
}
type Data = { asOf: string; minMcap: number; note: string; rows: Row[] }
type Key = 'sc' | 'mc' | 'py' | 'rg' | 'eg' | 'roic' | 'fcfm' | 'nd' | 'dil' | 'pe' | 'fy' | 'pc' | 'xs'

const pct = (v: number | null, d = 0) => v == null ? '–' : `${v >= 0 ? '' : '−'}${Math.abs(v * 100).toFixed(d)}%`
const tone = (v: number | null, good: number, bad: number, higherBetter = true) => {
  if (v == null) return 'text-gray-400'
  const g = higherBetter ? v >= good : v <= good
  const b = higherBetter ? v <= bad : v >= bad
  return g ? 'text-emerald-600 dark:text-emerald-400' : b ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
}

const COLS: Array<{ k: Key; label: string; tip: string }> = [
  { k: 'sc', label: '점수', tip: '꾸준한 흑자 20 · 매출 성장 15 · EPS 성장 15 · 투하자본이익률 20 · 잉여현금 10 · 재무 건전성 10 · 주식 수 희석 10 = 100점' },
  { k: 'mc', label: '시가총액', tip: '10억 달러 단위' },
  { k: 'py', label: '흑자 연도', tip: '최근 최대 10년 중 순이익이 흑자였던 해' },
  { k: 'rg', label: '매출 성장', tip: '연평균 매출 성장률(공시가 있는 기간)' },
  { k: 'eg', label: 'EPS 성장', tip: '연평균 주당순이익 성장률(처음·마지막 2년 평균 비교)' },
  { k: 'roic', label: '투하자본이익률', tip: '영업이익×(1−21%) ÷ (자기자본+빚−현금), 최근 3년 중간값. 은행·보험은 의미가 약하다' },
  { k: 'fcfm', label: '잉여현금 이익률', tip: '잉여현금흐름 ÷ 매출, 최근 3년 평균' },
  { k: 'nd', label: '순부채/영업현금', tip: '(빚−현금) ÷ 영업현금흐름. 순현금이면 "순현금"' },
  { k: 'dil', label: '주식 수 5년', tip: '희석 주식 수 5년 변화. 마이너스면 자사주로 줄인 것' },
  { k: 'pe', label: 'PER', tip: '주가 ÷ 최근 연간 EPS' },
  { k: 'fy', label: '잉여현금 수익률', tip: '최근 연간 잉여현금흐름 ÷ 시가총액' },
  { k: 'pc', label: '주가 연수익률', tip: '최근 최대 10년, 배당 포함 연평균' },
  { k: 'xs', label: 'S&P 500 대비', tip: '같은 기간 S&P 500(SPY) 연평균 대비 차이' },
]

export default function ScreenPage() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState(false)
  const [idx, setIdx] = useState<'all' | 'R' | 'N' | 'Q'>('all')
  const [hidePriv, setHidePriv] = useState(true)
  const [minSc, setMinSc] = useState(60)
  const [sec, setSec] = useState('')
  const [q, setQ] = useState('')
  const [sortK, setSortK] = useState<Key>('sc')
  const [asc, setAsc] = useState(false)
  const [limit, setLimit] = useState(100)

  useEffect(() => {
    fetch('/data/screen/universe.json').then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => setErr(true))
  }, [])

  const sectors = useMemo(() => [...new Set((data?.rows ?? []).map(r => r.sec).filter(Boolean))].sort(), [data])

  const rows = useMemo(() => {
    if (!data) return []
    const s = q.trim().toLowerCase()
    return data.rows.filter(r => {
      if (s) return r.t.toLowerCase().includes(s) || r.n.toLowerCase().includes(s)
      if (idx !== 'all' && !r.f.includes(idx)) return false
      if (hidePriv && r.f.includes('S')) return false
      if (r.sc < minSc) return false
      if (sec && r.sec !== sec) return false
      return true
    }).sort((a, b) => {
      const va = sortK === 'nd' && a.nc ? -99 : a[sortK], vb = sortK === 'nd' && b.nc ? -99 : b[sortK]
      if (va == null || vb == null) return va == null && vb == null ? 0 : va == null ? 1 : -1
      return asc ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
  }, [data, q, idx, hidePriv, minSc, sec, sortK, asc])

  const clickSort = (k: Key) => { if (k === sortK) setAsc(!asc); else { setSortK(k); setAsc(k === 'nd' || k === 'dil' || k === 'pe') } }

  const sel = 'text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1'
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">숨은 알짜 찾기</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          나스닥 상장·러셀2000(미국 소형주)·나스닥100 종목 중 시가총액 3억 달러 이상인 회사를 10년 재무로 1차 선별했다.
          숫자만 본 순위라 사업의 질은 아직 판단 전 — 상위 종목은 하나씩 깊게 보고 &lsquo;위대한 기업&rsquo; 표에 추가한다.
          {data && <> · 기준일 {data.asOf} · {data.rows.length.toLocaleString()}개</>}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">읽는 법</p>
        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          · <b>점수</b>는 &lsquo;오래, 꾸준히, 돈을 잘 버는가&rsquo;만 본다: 10년 중 흑자 연도, 매출·EPS 성장, 투하자본이익률, 잉여현금, 빚, 주식 수 희석. 값이 싼지는 PER·잉여현금 수익률로 따로 본다.
          <br />· 숨은 알짜 후보 = 점수 높음 + 주가 연수익률이 S&amp;P 500보다 높음 + 아직 &lsquo;위대한 기업&rsquo; 표에 없음.
          <br />· 한계: SEC 공시 숫자를 달력 연도로 맞춘 근사값이다. 은행·보험·리츠는 투하자본이익률이 맞지 않고, 인수로 커진 회사는 성장률이 부풀려질 수 있다.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} value={idx} onChange={e => setIdx(e.target.value as typeof idx)}>
          <option value="all">전체</option>
          <option value="R">러셀2000</option>
          <option value="N">나스닥100</option>
          <option value="Q">나스닥 상장</option>
        </select>
        <select className={sel} value={minSc} onChange={e => setMinSc(Number(e.target.value))}>
          {[0, 50, 60, 70, 80].map(v => <option key={v} value={v}>점수 {v}점 이상</option>)}
        </select>
        <select className={sel} value={sec} onChange={e => setSec(e.target.value)}>
          <option value="">모든 업종</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
          <input type="checkbox" checked={hidePriv} onChange={e => setHidePriv(e.target.checked)} />이미 분석한 종목 빼기
        </label>
        <input className={`${sel} w-32`} placeholder="티커·이름 검색" value={q} onChange={e => setQ(e.target.value)} />
        <span className="text-xs text-gray-400">{rows.length.toLocaleString()}개</span>
      </div>

      {err && <p className="text-sm text-gray-500">아직 선별 데이터가 없습니다.</p>}
      {!data && !err && <p className="text-sm text-gray-500">불러오는 중…</p>}

      {data && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-1 pr-2 font-medium">#</th>
                <th className="text-left py-1 pr-2 font-medium">종목</th>
                {COLS.map(c => (
                  <th key={c.k} title={c.tip} onClick={() => clickSort(c.k)}
                    className={`text-right py-1 px-1.5 font-medium whitespace-nowrap cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-100 ${sortK === c.k ? 'bg-blue-50 dark:bg-blue-900/25' : ''}`}>
                    {c.label}<span className="ml-0.5 inline-block w-2.5 text-center text-[10px]">{sortK === c.k ? (asc ? '▲' : '▼') : ''}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={r.t} className="border-b border-gray-100 dark:border-gray-900 text-gray-700 dark:text-gray-200">
                  <td className="py-1 pr-2 text-gray-400">{i + 1}</td>
                  <td className="py-1 pr-2 max-w-[180px]">
                    <div className="font-semibold">{r.t}
                      {r.f.includes('R') && <span className="ml-1 text-[10px] text-gray-400">러셀</span>}
                      {r.f.includes('N') && <span className="ml-1 text-[10px] text-gray-400">NDX100</span>}
                      {r.f.includes('S') && <span className="ml-1 text-[10px] text-blue-500">분석됨</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate" title={r.n}>{r.n}{r.sec ? ` · ${r.sec}` : ''}</div>
                  </td>
                  <td className="text-right px-1.5 font-semibold">{r.sc.toFixed(0)}</td>
                  <td className="text-right px-1.5">{r.mc >= 10 ? r.mc.toFixed(0) : r.mc.toFixed(1)}</td>
                  <td className={`text-right px-1.5 ${tone(r.py / r.yrs, 0.95, 0.7)}`}>{r.py}/{r.yrs}</td>
                  <td className={`text-right px-1.5 ${tone(r.rg, 0.1, 0)}`}>{pct(r.rg)}</td>
                  <td className={`text-right px-1.5 ${tone(r.eg, 0.12, 0)}`}>{pct(r.eg)}</td>
                  <td className={`text-right px-1.5 ${tone(r.roic, 0.2, 0.08)}`}>{pct(r.roic)}</td>
                  <td className={`text-right px-1.5 ${tone(r.fcfm, 0.15, 0)}`}>{pct(r.fcfm)}</td>
                  <td className={`text-right px-1.5 ${r.nc ? 'text-emerald-600 dark:text-emerald-400' : tone(r.nd, 1, 3, false)}`}>{r.nc ? '순현금' : r.nd == null ? '–' : `${r.nd.toFixed(1)}배`}</td>
                  <td className={`text-right px-1.5 ${tone(r.dil, -0.05, 0.1, false)}`}>{pct(r.dil)}</td>
                  <td className="text-right px-1.5">{r.pe == null ? '–' : `${r.pe.toFixed(0)}배`}</td>
                  <td className={`text-right px-1.5 ${tone(r.fy, 0.05, 0)}`}>{pct(r.fy, 1)}</td>
                  <td className={`text-right px-1.5 ${tone(r.pc, 0.12, 0)}`}>{pct(r.pc)}<span className="text-[10px] text-gray-400"> {r.sp.toFixed(0)}년</span></td>
                  <td className={`text-right px-1.5 ${tone(r.xs, 0.03, -0.03)}`}>{r.xs == null ? '–' : `${r.xs >= 0 ? '+' : '−'}${Math.abs(r.xs * 100).toFixed(0)}%p`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > limit && (
            <button onClick={() => setLimit(limit + 100)} className="mt-3 text-xs px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
              100개 더 보기 ({limit}/{rows.length})
            </button>
          )}
          <p className="mt-2 text-[11px] text-gray-400">{data.note} 열 제목을 누르면 정렬, 제목 위에 손가락을 올리면 설명.</p>
        </div>
      )}
    </main>
  )
}
