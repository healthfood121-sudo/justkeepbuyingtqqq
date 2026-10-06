// 웹 인출 시뮬레이터 엔진(web/lib/withdrawalEngine.ts) 검증 — 탐색용 (출력만)
// 10억 시작 × 668가지 시작 시점 × RULE25·S0·HOLD3 × 비용 2종을 withdrawal_full_period(_fee).json 과 대조한다.
// 실행: node --experimental-strip-types scripts/check_withdrawal_engine.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMarket, runWithdrawal } from '../web/lib/withdrawalEngine.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rows = fs.readFileSync(path.join(ROOT, 'data/ndx_1971_now.csv'), 'utf8').trim().split('\n').slice(1)
  .map(l => l.split(',')).filter(r => r[0] && r[1])
const fed = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fed_funds_rate.json'), 'utf8'))
  .map(r => [r.date.slice(0, 7), Number(r.rate)]))
const m = buildMarket(rows.map(r => r[0]), rows.map(r => Number(r[1])), fed)
const starts = []
for (let i = 0, last = ''; i < m.dates.length; i++) {
  const ym = m.dates[i].slice(0, 7)
  if (ym !== last) { starts.push(i); last = ym }
}

let worst = 0, n = 0
for (const [suffix, swap] of [['', true], ['_fee', false]]) {
  const fp = JSON.parse(fs.readFileSync(path.join(ROOT, `web/public/data/withdrawal_full_period${suffix}.json`), 'utf8'))
  for (const key of ['RULE25', 'S0', 'HOLD3']) {
    let bad = 0
    fp.cohorts.forEach((c, k) => {
      const r = runWithdrawal(m, starts[k], 1e9, key, swap)
      const f = r.final / 1e8, w = r.withdrawn / 1e8
      // JSON은 0.01억 단위 반올림 → 반올림 오차(0.005억) 안이면 같은 값
      const err = Math.max(Math.abs(f - c[key].f), Math.abs(w - c[key].w))
      worst = Math.max(worst, err); n++
      if (err > 0.0051) { bad++; if (bad <= 3) console.log('  불일치', suffix || 'swap', key, c.s, f.toFixed(2), c[key].f, w.toFixed(2), c[key].w) }
    })
    console.log(`${swap ? '스왑금리' : '운용보수만'} ${key}: ${fp.cohorts.length}개 중 불일치 ${bad}`)
  }
}
console.log(`전체 ${n}건 · 최대 차이 ${worst.toFixed(4)}억 (JSON 반올림 단위 0.01억)`)

// 거래 날짜도 거래 로그(withdrawal_tradelog_{rule25,s0}.json)와 대조
for (const key of ['RULE25', 'S0']) {
  const tl = JSON.parse(fs.readFileSync(path.join(ROOT, `web/public/data/withdrawal_tradelog_${key.toLowerCase()}.json`), 'utf8'))
  let bad = 0
  tl.cohorts.forEach((c, k) => {
    const r = runWithdrawal(m, starts[k], 1e9, key, true)
    const a = r.trades.map(t => t.date + t.action).join(','), b = c.t.map(t => t[0] + t[1]).join(',')
    if (a !== b) bad++
  })
  console.log(`거래 날짜 ${key}: ${tl.cohorts.length}개 중 불일치 ${bad}`)
}
