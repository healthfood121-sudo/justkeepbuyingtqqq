// 횡보장 공부방(/private/cycles) 데이터 — 롤링 JSON(매주 자동 갱신)에서 계산해 app/private/cycles/study.json 으로 쓴다.
// next build 직전(prebuild)에 자동 실행 → 배포할 때마다 "지금" 칸이 최신 가격으로 다시 계산된다.
// 질문: 직전 10년이 좋았던(잘나가던) 종목과 나빴던(바닥에 기던) 종목 중 어느 쪽이 다음 10년에 더 벌었나
import fs from 'node:fs'
import path from 'node:path'
const root = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const dir = path.join(root, 'public/data/rolling')
const out = path.join(root, 'app/private/cycles/study.json')

const stocks = []
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('_rolling.json'))) {
  let d
  try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } catch { continue }
  if (d.type === 'etf') continue
  const key = f.replace('_rolling.json', '')
  const rows = new Map((d.rows10y ?? []).map(r => [r.buyYear, r]))
  stocks.push({ key, name: d.name ?? key, rows, cur: d.current ?? {} })
}
const med = a => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null }
const r1 = v => v == null ? null : Math.round(v * 10) / 10

// 매수 해 B: 직전 10년(B-10 매수 행) 수익률로 5등분 → 다음 10년(B 매수 행, 완결) 수익률
function quintiles(B) {
  const a = stocks.map(s => {
    const n = s.rows.get(B), p = s.rows.get(B - 10)
    if (!n?.isComplete || !p?.isComplete) return null
    return { key: s.key, name: s.name, prior: p.cagr, next: n.cagr, pe: n.peBuy ?? null }
  }).filter(Boolean).sort((x, y) => x.prior - y.prior)
  const n = a.length
  if (n < 50) return null
  const q = [0, 1, 2, 3, 4].map(i => a.slice(Math.floor(i * n / 5), Math.floor((i + 1) * n / 5)))
  return {
    year: B, n,
    q: q.map(g => ({ lo: r1(g[0].prior), hi: r1(g[g.length - 1].prior), med: r1(med(g.map(x => x.next))), loss: g.filter(x => x.next < 0).length, over10: g.filter(x => x.next >= 10).length, size: g.length })),
    bottomWin: q[0].filter(x => x.next >= 15).sort((x, y) => y.next - x.next).slice(0, 12).map(x => ({ k: x.key, nm: x.name, prior: r1(x.prior), next: r1(x.next) })),
    bottomLose: q[0].filter(x => x.next < 0).map(x => ({ k: x.key, nm: x.name, prior: r1(x.prior), next: r1(x.next) })),
    topHot: [...q[4]].sort((x, y) => y.prior - x.prior).slice(0, 14).map(x => ({ k: x.key, nm: x.name, prior: r1(x.prior), next: r1(x.next) })),
    topWin: q[4].filter(x => x.next >= 10).map(x => ({ k: x.key, nm: x.name, prior: r1(x.prior), next: r1(x.next) })),
  }
}
const years = [1990, 1995, 1999, 2000, 2003, 2005, 2008, 2010, 2013, 2015].map(quintiles).filter(Boolean)

// 1970년대: 직전 10년 데이터가 없어 다음 10년 승자·패자만
function decade(B) {
  const a = stocks.map(s => { const n = s.rows.get(B); return n?.isComplete ? { k: s.key, nm: s.name, next: r1(n.cagr) } : null }).filter(Boolean).sort((x, y) => y.next - x.next)
  return { year: B, n: a.length, med: r1(med(a.map(x => x.next))), loss: a.filter(x => x.next < 0).length, top: a.slice(0, 8), bottom: a.slice(-8).reverse() }
}
const seventies = [1972, 1973].map(decade)

// 지금: 진행 중인 가장 오래된 구간(9년 이상 경과)의 수익률 = "지난 약 10년"
const ys = stocks.flatMap(s => [...s.rows.values()].filter(r => !r.isComplete && r.yearsActual >= 9).map(r => r.buyYear))
const curBuy = ys.length ? Math.min(...ys) : null
// 품질·값 지표는 사이트 펀더멘털 파일(SEC 공시 기반, 자동 갱신)에서
const fdir = path.join(root, 'public/data/fundamentals')
const fund = k => { try { return JSON.parse(fs.readFileSync(path.join(fdir, k + '.json'), 'utf8')).metrics ?? null } catch { return null } }
const now = stocks.map(s => {
  const r = s.rows.get(curBuy)
  if (!r || r.isComplete || r.yearsActual < 9) return null
  const m = fund(s.key)
  const pe = m?.pe ?? null, peMed = m?.peMed10 ?? null
  const ok = m ? {
    profit: m.ttmEps != null && m.ttmEps > 0,
    roic: m.roic5 != null ? m.roic5 >= 10 : null,
    cheap: pe != null && peMed != null && pe > 0 ? pe < peMed : null,
    epsOk: m.epsVsPeak != null ? m.epsVsPeak >= 0.75 : null,   // 지금 이익 ÷ 10년 고점 이익(비율)
  } : null
  const pass = ok ? ok.profit && ok.roic === true && ok.cheap === true && ok.epsOk !== false : false
  return { k: s.key, nm: s.name, pos: ownPos(s.key), prior: r1(r.cagr), pe: pe != null ? r1(pe) : null, peMed: peMed != null ? r1(peMed) : null, roic5: m?.roic5 ?? null, epsVsPeak: m?.epsVsPeak != null ? Math.round(m.epsVsPeak * 100) : null, div: m?.divYield ?? null, pass, sellDate: r.sellDate }
}).filter(Boolean).sort((x, y) => x.prior - y.prior)
const nN = now.length
const nowQ = [0, 1, 2, 3, 4].map(i => now.slice(Math.floor(i * nN / 5), Math.floor((i + 1) * nN / 5)))
// 같은 종목, 언제 샀으면 좋았나 — Y0~2015년 매수가 모두 완결된 종목(역사가 길수록 종목 수는 줄어든다)
function sameStockStudy(Y0, Y1 = 2015) {
  const full = stocks.filter(s => { for (let y = Y0; y <= Y1; y++) if (!s.rows.get(y)?.isComplete) return false; return true })
  const bestCount = {}, worstCount = {}
  const own = []
  const perStock = full.map(s => {
    let b = Y0, w = Y0
    for (let y = Y0; y <= Y1; y++) { if (s.rows.get(y).cagr > s.rows.get(b).cagr) b = y; if (s.rows.get(y).cagr < s.rows.get(w).cagr) w = y }
    bestCount[b] = (bestCount[b] ?? 0) + 1; worstCount[w] = (worstCount[w] ?? 0) + 1
    const pr = []
    for (let y = Y0; y <= Y1; y++) { const p = s.rows.get(y - 10); if (p?.isComplete) pr.push([p.cagr, s.rows.get(y).cagr]) }
    let lo = null, hi = null
    if (pr.length >= 12) {
      pr.sort((x, y) => x[0] - y[0]); const n = pr.length
      lo = med(pr.slice(0, Math.floor(n / 3)).map(x => x[1])); hi = med(pr.slice(n - Math.floor(n / 3)).map(x => x[1]))
      own.push([lo, hi])
    }
    const prior = y => s.rows.get(y - 10)?.isComplete ? r1(s.rows.get(y - 10).cagr) : null
    return { k: s.key, nm: s.name, best: b, bestR: r1(s.rows.get(b).cagr), bestPrior: prior(b), worst: w, worstR: r1(s.rows.get(w).cagr), worstPrior: prior(w), lo: r1(lo), hi: r1(hi) }
  }).sort((x, y) => (y.bestR - y.worstR) - (x.bestR - x.worstR))
  const byYear = []
  for (let y = Y0; y <= Y1; y++) byYear.push({ y, best: bestCount[y] ?? 0, worst: worstCount[y] ?? 0, med: r1(med(full.map(s => s.rows.get(y).cagr))) })
  return {
    from: Y0, n: full.length, byYear, perStock,
    ownN: own.length, ownLo: r1(med(own.map(x => x[0]))), ownHi: r1(med(own.map(x => x[1]))), ownLoWins: own.filter(x => x[0] > x[1]).length,
    spreadMed: r1(med(perStock.map(x => x.bestR - x.worstR))),
  }
}
const sameStocks = [1972, 1980, 1990].map(y => sameStockStudy(y))

// 지금 각 종목이 "자기 역사" 대비 어디인가 — 진행 중 지난 약 10년 수익률이 과거 완결 10년 수익률 중 몇 % 위치
function ownPos(k) {
  const s = stocks.find(x => x.key === k); if (!s) return null
  const r = [...s.rows.values()].filter(r => !r.isComplete && r.yearsActual >= 9).sort((a, b) => a.buyYear - b.buyYear)[0]
  const past = [...s.rows.values()].filter(r => r.isComplete).map(r => r.cagr)
  if (!r || past.length < 10) return null
  return Math.round(100 * past.filter(v => v < r.cagr).length / past.length)
}

// 나스닥100(QQQ) 지난 약 10년 — 매주 자동 갱신되는 롤링 데이터의 진행 중 구간
let ndx = null
try {
  const q = JSON.parse(fs.readFileSync(path.join(dir, 'QQQ_rolling.json'), 'utf8'))
  const r = (q.rows10y ?? []).filter(r => !r.isComplete && r.yearsActual >= 9).sort((a, b) => a.buyYear - b.buyYear)[0]
  if (r) ndx = { buyYear: r.buyYear, cagr: r1(r.cagr), asOf: r.sellDate, years: r.yearsActual }
} catch {}
// 지난 약 10년 대형 기술주 수익은 어디서 왔나(펀더멘털 파일의 수익률 분해: 이익 성장 vs PER 변화)
const techSrc = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'].map(k => {
  try {
    const f = JSON.parse(fs.readFileSync(path.join(fdir, k + '.json'), 'utf8'))
    const r = (f.decomp ?? []).find(d => d.buyYear === curBuy)
    return r ? { k, nm: f.name ?? k, total: r1(r.totalCagr), eps: r1(r.epsGrowthCagr), pe: r1(r.peCagr), peBuy: r1(r.peBuy), peSell: r1(r.peSell) } : null
  } catch { return null }
}).filter(Boolean)

// 같은 해에 산 종목끼리: 자기 역사 바닥 vs 자기 역사 고점 (시장 타이밍 효과를 뺀 비교)
// 매수 해 B에 알 수 있던 것만 사용: 직전 10년(B-10 매수, B에 끝남)이 그때까지 끝난 자기 10년 수익률들 중 몇 % 위치인지
function ownYear(B) {
  const g = []
  for (const s of stocks) {
    const n = s.rows.get(B), c = s.rows.get(B - 10)
    if (!n?.isComplete || !c?.isComplete) continue
    const past = [...s.rows.values()].filter(r => r.isComplete && r.buyYear <= B - 10).map(r => r.cagr)
    if (past.length < 8) continue
    const pos = past.filter(v => v < c.cagr).length / (past.length - 1)
    g.push({ k: s.key, nm: s.name, p: Math.round(pos * 100), prior: r1(c.cagr), next: r1(n.cagr), lo: r1(Math.min(...past)), hi: r1(Math.max(...past)), m: past.length })
  }
  if (g.length < 30) return null
  const lo = g.filter(x => x.p <= 15).sort((a, b) => b.next - a.next), hi = g.filter(x => x.p >= 85).sort((a, b) => b.next - a.next)
  if (lo.length < 5 || hi.length < 5) return null
  const sum = a => ({ n: a.length, med: r1(med(a.map(x => x.next))), loss: a.filter(x => x.next < 0).length })
  return { year: B, n: g.length, all: sum(g), lo: sum(lo), hi: sum(hi), loList: lo, hiList: hi }
}
const ownYears = []
for (let B = 1985; B <= 2020; B++) { const r = ownYear(B); if (r) ownYears.push(r) }
const pool = k => ownYears.flatMap(y => y[k + 'List'].map(x => x.next))
const ownSum = { years: ownYears.length, loWins: ownYears.filter(y => y.lo.med > y.hi.med).length,
  lo: { n: pool('lo').length, med: r1(med(pool('lo'))), loss: pool('lo').filter(v => v < 0).length },
  hi: { n: pool('hi').length, med: r1(med(pool('hi'))), loss: pool('hi').filter(v => v < 0).length } }
fs.mkdirSync(path.join(root, 'app/private/cycles/own'), { recursive: true })
fs.writeFileSync(path.join(root, 'app/private/cycles/own/own.json'), JSON.stringify({ sum: ownSum, years: ownYears }))
const study = {
  ndx, techSrc,
  generated: new Date().toISOString().slice(0, 10),
  note: '사이트 종목(지금 지수에 들어 있는 회사 중심)의 배당 포함 10년 보유 수익률. 망하거나 사라진 회사는 빠져 있어(생존 편향) 실제보다 좋아 보인다.',
  years, seventies, sameStocks,
  ownSum, ownYears: ownYears.map(({ loList, hiList, ...r }) => r),
  now: curBuy == null ? null : {
    buyYear: curBuy, asOf: now[0]?.sellDate ?? null, n: nN,
    q: nowQ.map(g => ({ lo: g[0]?.prior, hi: g[g.length - 1]?.prior, size: g.length })),
    bottom: nowQ[0].concat(nowQ[1]).map(x => ({ ...x, q: nowQ[0].includes(x) ? 1 : 2 })),
    top: [...nowQ[4]].sort((x, y) => y.prior - x.prior).slice(0, 30),
    watch: ['GOOGL', 'MSFT', 'AAPL', 'AMZN', 'META', 'NVDA', 'RMS', 'COST', 'KO', 'NKE'].map(k => { const x = now.find(z => z.k === k); return x ? { k, nm: x.nm, prior: x.prior, pos: x.pos } : null }).filter(Boolean),
  },
}
fs.writeFileSync(out, JSON.stringify(study))
console.log('own-history years:', ownYears.length, ownSum)
console.log('cycle study:', years.length, 'years,', nN, 'stocks now, bottom', nowQ[0].length)
