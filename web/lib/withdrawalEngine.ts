// 인출 시뮬레이션 엔진 — scripts/withdrawal_cash_tier.py run_sim 을 그대로 옮긴 것
// (현금 쪽 규칙·세금·외화RP·신호 다음 거래일 매매·상한 없는 동적 인출).
// 시작 금액만 자유롭게 바꿀 수 있다. 10억 시작은 withdrawal_full_period.json 과 같은 값이 나와야 한다
// (scripts/check_withdrawal_engine.mjs 로 668가지 시작 시점 전부 대조).
//
// D10GK: RSI(14)<30 & EMA200 대비 -10% 이하 조기재진입 + Guyton-Klinger 인출 조정
// QLD:   QLD(2x 레버리지) 계속 보유 (운용보수 0.95%, 스왑금리 1×FFR)

export const TAX_RATE  = 0.22
export const DEDUCTION = 2_500_000
export const RP_SPREAD = 0.004
export const RP_TAX_R  = 0.154
export const FEE_RATE  = 0.0007
export const BAND      = 0.05
export const DYN_RATES = [0.003, 0.005, 0.007] as const
export const DYN_THRS  = [1_000_000_000, 2_000_000_000] as const
export const EXP_3X = 0.0088
export const EXP_2X = 0.0095  // QLD expense ratio
export const EXP_1X = 0.0020

export type StratKey = 'RULE25' | 'S0' | 'HOLD3' | 'D10GK' | 'QLD'

export interface StratDef {
  label:  string
  trail:  number   // 트레일링 스탑 비율 (0=비활성, 0.25=25%)
  days:   number   // EMA200 연속 일수 필터
  hold:   boolean  // 계속 보유 (매매 없음)
  rsiThr: number   // RSI 조기재진입 임계값 (0=비활성)
  divThr: number   // 이격도 임계값 (음수, 기본 -0.10)
  useGk:  boolean  // Guyton-Klinger 인출 조정
  useQld: boolean  // QLD(2x) 사용 (false=TQQQ)
}

export const STRATS: Record<StratKey, StratDef> = {
  RULE25: { label: '25% 룰 (권장)',      trail: 0.25, days: 15, hold: false, rsiThr:  0, divThr: -0.10, useGk: false, useQld: false },
  S0:     { label: 'S0 (200일선 15일)',  trail: 0,    days: 15, hold: false, rsiThr:  0, divThr: -0.10, useGk: false, useQld: false },
  HOLD3:  { label: 'TQQQ 계속 보유',    trail: 0,    days: 15, hold: true,  rsiThr:  0, divThr: -0.10, useGk: false, useQld: false },
  D10GK:  { label: 'D10GK',             trail: 0,    days: 15, hold: false, rsiThr: 30, divThr: -0.10, useGk: true,  useQld: false },
  QLD:    { label: 'QLD(2x) 계속 보유', trail: 0,    days: 15, hold: true,  rsiThr:  0, divThr: -0.10, useGk: false, useQld: true  },
}

export interface Market {
  dates:  string[]        // YYYY-MM-DD
  closes: Float64Array    // 나스닥100 (1985-10-01 이음 보정)
  ema:    Float64Array    // 200일 지수이동평균 (앞 199일 NaN)
  peaks:  Float64Array    // 최근 252거래일 최고 종가
  rp:     Float64Array    // 외화RP 일 이자율 (세후)
  tqSwap: Float64Array    // TQQQ 합성가 (운용보수 + 스왑금리)
  tqFee:  Float64Array    // TQQQ 합성가 (운용보수만)
  qlSwap: Float64Array    // QLD 합성가 (운용보수 + 스왑금리)
  qlFee:  Float64Array    // QLD 합성가 (운용보수만)
  rsi:    Float64Array    // RSI(14) Wilder — 앞 13일 NaN
}

// ndx.csv 종가 + 월별 기준금리(%) 로 시장 데이터 구성 — withdrawal_cash_tier.load_data 와 동일
export function buildMarket(dates: string[], rawCloses: number[], fed: Record<string, number>): Market {
  const n = rawCloses.length
  const closes = Float64Array.from(rawCloses)
  const si = dates.indexOf('1985-10-01')
  if (si > 0) {
    const k = closes[si - 1] / closes[si]
    for (let i = si; i < n; i++) closes[i] *= k
  }
  const tqSwap = new Float64Array(n), tqFee = new Float64Array(n)
  const qlSwap = new Float64Array(n), qlFee = new Float64Array(n)
  const rp = new Float64Array(n)
  const ema = new Float64Array(n).fill(NaN), peaks = new Float64Array(n)
  tqSwap[0] = tqFee[0] = 100
  qlSwap[0] = qlFee[0] = 100
  for (let i = 0; i < n; i++) {
    const ym = dates[i].slice(0, 7)
    const ffr = (fed[ym] ?? 0) / 100
    rp[i] = Math.max(0, (fed[ym] ?? 3.0) / 100 - RP_SPREAD) / 252 * (1 - RP_TAX_R)
    if (i > 0) {
      const ret = (closes[i] - closes[i - 1]) / closes[i - 1]
      tqSwap[i] = tqSwap[i - 1] * (1 + 3 * ret - 2 * ffr / 252) * (1 - EXP_3X / 252)
      tqFee[i]  = tqFee[i - 1]  * (1 + 3 * ret) * (1 - EXP_3X / 252)
      qlSwap[i] = qlSwap[i - 1] * (1 + 2 * ret -     ffr / 252) * (1 - EXP_2X / 252)
      qlFee[i]  = qlFee[i - 1]  * (1 + 2 * ret)                 * (1 - EXP_2X / 252)
    }
  }
  if (n > 200) {
    let s = 0
    for (let i = 0; i < 200; i++) s += closes[i]
    ema[199] = s / 200
    const a = 2 / 201
    for (let i = 200; i < n; i++) ema[i] = closes[i] * a + ema[i - 1] * (1 - a)
  }
  // 252일 이동 최고값 (단조 덱)
  const dq: number[] = []
  for (let i = 0; i < n; i++) {
    while (dq.length && closes[dq[dq.length - 1]] <= closes[i]) dq.pop()
    dq.push(i)
    if (dq[0] <= i - 252) dq.shift()
    peaks[i] = closes[dq[0]]
  }
  // RSI(14) — Wilder smoothing (파이썬 compute_rsi 와 동일)
  const rsi = new Float64Array(n).fill(NaN)
  if (n > 15) {
    const P = 14
    let ag = 0, al = 0
    for (let i = 1; i <= P; i++) {
      const d = closes[i] - closes[i - 1]
      if (d > 0) ag += d / P; else al += (-d) / P
    }
    rsi[P] = al < 1e-10 ? 100 : 100 - 100 / (1 + ag / al)
    for (let i = P + 1; i < n; i++) {
      const d = closes[i] - closes[i - 1]
      ag = (ag * (P - 1) + Math.max(0,  d)) / P
      al = (al * (P - 1) + Math.max(0, -d)) / P
      rsi[i] = al < 1e-10 ? 100 : 100 - 100 / (1 + ag / al)
    }
  }
  return { dates, closes, ema, peaks, rp, tqSwap, tqFee, qlSwap, qlFee, rsi }
}

export interface MonthPoint { date: string; total: number; living: number; invested: boolean }
export interface Trade { date: string; action: 'S' | 'B'; total: number }
export interface SimResult {
  final: number; withdrawn: number; maxDD: number; years: number
  months: MonthPoint[]; trades: Trade[]
}

export function runWithdrawal(m: Market, start: number, initial: number, key: StratKey, withSwap = true): SimResult {
  const p = STRATS[key]
  const tq = p.useQld
    ? (withSwap ? m.qlSwap : m.qlFee)
    : (withSwap ? m.tqSwap : m.tqFee)
  const n = m.closes.length
  const simLen = n - start

  let sh = 0, cost = 0          // TQQQ/QLD 주수, 평균단가
  let cash = initial
  let yearGain = 0, taxDue = 0
  let curYear = Number(m.dates[start].slice(0, 4))
  let withdrawn = 0
  let peakTot = initial, maxDD = 0
  const months: MonthPoint[] = []
  const trades: Trade[] = []

  // Guyton-Klinger 상태
  let gkMult = 1.0, gkInitCap = 0, gkOn = false
  let gkYrStart = initial, gkLastCap = 0

  const val = (ci: number) => sh * tq[ci]
  const total = (ci: number) => cash + val(ci)
  const buy = (amount: number, ci: number) => {
    amount = Math.min(amount, cash)
    if (amount <= 0) return
    const net = amount * (1 - FEE_RATE)
    const s = net / tq[ci]
    cost = (sh * cost + net) / (sh + s)
    sh += s
    cash -= amount
  }
  const sell = (amount: number, ci: number) => {
    amount = Math.min(amount, val(ci))
    if (amount <= 0) return
    const s = amount / tq[ci]
    yearGain += amount - s * cost
    sh -= s
    if (sh < 1e-9) { sh = 0; cost = 0 }
    cash += amount * (1 - FEE_RATE)
  }
  const raiseCash = (need: number, ci: number) => {
    const short = need - cash
    if (short > 0) sell(short / (1 - FEE_RATE), ci)
  }
  const rebalance = (ci: number, force: boolean) => {
    const tot = total(ci)
    if (tot <= 0) return
    const cw = val(ci) / tot
    if (!force && Math.abs(cw - 1) <= BAND) return
    const diff = val(ci) - tot
    if (diff > 0) sell(diff, ci)
    else buy(-diff, ci)
  }

  const e0 = m.ema[start]
  let invested = p.hold || !(!Number.isNaN(e0) && m.closes[start] < e0)
  if (invested) buy(total(start), start)

  let below = 0, above = 0
  let pend: 'sell' | 'buy' | null = null
  let pendAt = 0
  let lastMon = ''
  let living = 0

  for (let j = 0; j < simLen; j++) {
    const ci = start + j
    const d = m.dates[ci]
    const mon = d.slice(0, 7)
    if (mon !== lastMon) {
      lastMon = mon
      const yr = Number(d.slice(0, 4))
      if (yr !== curYear) {
        // GK 연간 조정 (파이썬 withdrawal_cash_tier.py 와 동일 순서)
        if (p.useGk && gkOn && gkInitCap > 0) {
          const now = total(ci)
          const yrRet = gkYrStart > 0 ? (now - gkYrStart) / gkYrStart : 0
          const ratio = gkLastCap / gkInitCap  // 직전 달 cap / 최초 cap
          if (ratio > 1.20) {
            gkMult = Math.max(0.50, gkMult * 0.80)
          } else if (ratio < 0.80 && yrRet >= 0) {
            gkMult = Math.min(1.50, gkMult * 1.10)
          }
          gkYrStart = now
        } else if (p.useGk) {
          gkYrStart = total(ci)
        }
        taxDue += Math.max(0, yearGain - DEDUCTION) * TAX_RATE
        yearGain = 0
        curYear = yr
      }
      if (taxDue > 0) {
        raiseCash(taxDue, ci)
        const pay = Math.min(taxDue, cash)
        cash -= pay
        taxDue -= pay
      }
      living = 0
      if (j > 0) {
        const tot = total(ci)
        const rate = tot < DYN_THRS[0] ? DYN_RATES[0] : tot < DYN_THRS[1] ? DYN_RATES[1] : DYN_RATES[2]
        const cap = tot * rate * (p.useGk ? gkMult : 1)
        gkLastCap = cap
        if (invested) {
          living = cap
          if (p.useGk && !gkOn && cap > 0) { gkInitCap = cap; gkOn = true }
        } else {
          const yc = cap * 12
          const lr = yc <= 0 || cash / yc >= 2 ? 1 : cash / yc >= 1 ? 0.7 : cash / yc >= 0.5 ? 0.5 : 0.3
          living = cap * lr
        }
        raiseCash(living, ci)
        living = Math.min(living, cash)
        cash -= living
        withdrawn += living
      }
      if (invested) rebalance(ci, false)
    }

    const e = m.ema[ci]
    if (!Number.isNaN(e) && e > 0) {
      const c = m.closes[ci]
      if (c < e) { below++; above = 0 }
      else if (c > e) { above++; below = 0 }
      else { below = above = 0 }
      let sellSig = below >= p.days
      if (p.trail > 0) sellSig = c < m.peaks[ci] * (1 - p.trail)
      if (p.hold) sellSig = false
      let buySig = above >= p.days
      // RSI 조기재진입 (D10GK) — 현금 상태에서 RSI<30 & 이격도≤-10%
      if (!invested && !buySig && p.rsiThr > 0 && !Number.isNaN(m.rsi[ci])) {
        if (m.rsi[ci] < p.rsiThr && (c - e) / e <= p.divThr) buySig = true
      }
      // 신호 다음 거래일 종가에 실행
      let fireSell = false, fireBuy = false
      if (pend !== null && j >= pendAt) {
        fireSell = pend === 'sell' && invested
        fireBuy = pend === 'buy' && !invested
        pend = null
      }
      if (pend === null && !(fireSell || fireBuy)) {
        if (invested && sellSig) { pend = 'sell'; pendAt = j + 1 }
        else if (!invested && buySig) { pend = 'buy'; pendAt = j + 1 }
      }
      sellSig = fireSell; buySig = fireBuy
      if (invested && sellSig) {
        sell(val(ci), ci)
        invested = false
        below = 0
        trades.push({ date: d, action: 'S', total: total(ci) })
      } else if (!invested && buySig) {
        rebalance(ci, true)
        invested = true
        above = 0
        trades.push({ date: d, action: 'B', total: total(ci) })
      }
    }

    cash += cash * m.rp[ci]
    const tot = total(ci)
    // 월말 총자산과 그 달 생활비 기록 (그래프용)
    if (mon !== (m.dates[ci + 1] ?? '').slice(0, 7)) months.push({ date: mon, total: tot, living, invested })
    peakTot = Math.max(peakTot, tot)
    if (peakTot > 0) maxDD = Math.max(maxDD, 1 - tot / peakTot)
    if (tot <= 0) break
  }

  return { final: total(start + simLen - 1), withdrawn, maxDD, years: simLen / 252, months, trades }
}
