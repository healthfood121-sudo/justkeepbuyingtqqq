import Papa from 'papaparse'

export interface RawRow {
  Date: string
  Close: string
}

export interface PriceData {
  dates: Date[]
  rawPrices: Float64Array   // 원본 (splice 보정된)
  lev1: Float64Array        // 운용보수만 반영
  lev2: Float64Array        // 운용보수만 반영
  lev3: Float64Array        // 운용보수만 반영
  lev1c: Float64Array       // 운용보수 + 스왑금리 반영
  lev2c: Float64Array       // 운용보수 + 스왑금리 반영
  lev3c: Float64Array       // 운용보수 + 스왑금리 반영
}

// 연간 운용보수
const EXP_3X = 0.0088
const EXP_2X = 0.0095
const EXP_1X = 0.0020

let ndxCache: PriceData | null = null
let sp5Cache: PriceData | null = null
let fedCache: Float64Array | null = null  // 날짜 인덱스별 daily fed rate (연율/100/252)

async function loadCsv(url: string): Promise<{ dates: Date[]; closes: Float64Array }> {
  const res = await fetch(url)
  const text = await res.text()
  const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true })
  const rows = result.data.filter(r => r.Date && r.Close)
  const dates = rows.map(r => new Date(r.Date))
  const closes = new Float64Array(rows.map(r => parseFloat(r.Close)))
  return { dates, closes }
}

// fed_funds_rate.json 로드 → YYYY-MM → rate(%) Map
async function loadFedMap(): Promise<Map<string, number>> {
  const res = await fetch('/data/fed_funds_rate.json')
  const data: { date: string; rate: number }[] = await res.json()
  const map = new Map<string, number>()
  for (const { date, rate } of data) {
    map.set(date, rate)
  }
  return map
}

// dates 배열에 맞게 daily fed rate 배열 생성 (연율% → /100/252)
// fed 데이터가 없는 구간(1971 이전 등)은 0으로 처리
function buildFedDaily(dates: Date[], fedMap: Map<string, number>): Float64Array {
  const arr = new Float64Array(dates.length)
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i]
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const rate = fedMap.get(ym) ?? 0
    arr[i] = rate / 100 / 252
  }
  return arr
}

function applySpliceCorrection(dates: Date[], closes: Float64Array): Float64Array {
  // NDX: 1985-10-01에 가짜 -60% 급락 → 비율보정
  const target = new Date('1985-10-01').getTime()
  const corrected = new Float64Array(closes)
  let spliceIdx = -1
  for (let i = 1; i < dates.length; i++) {
    if (dates[i].getTime() === target) {
      spliceIdx = i
      break
    }
  }
  if (spliceIdx >= 0) {
    const scale = corrected[spliceIdx - 1] / corrected[spliceIdx]
    for (let i = spliceIdx; i < corrected.length; i++) {
      corrected[i] *= scale
    }
  }
  return corrected
}

// 운용보수만 반영 (스왑금리 없음)
function makeSynthetic(rawPrices: Float64Array, leverage: number, expRatio: number): Float64Array {
  const n = rawPrices.length
  const synth = new Float64Array(n)
  synth[0] = 100.0
  const dailyExp = expRatio / 252
  for (let i = 1; i < n; i++) {
    const ret = (rawPrices[i] - rawPrices[i - 1]) / rawPrices[i - 1]
    synth[i] = synth[i - 1] * (1 + ret * leverage) * (1 - dailyExp)
  }
  return synth
}

// 운용보수 + 스왑금리 반영 (3x: 2×fed, 2x: 1×fed, 1x: 없음)
function makeSyntheticWithCosts(
  rawPrices: Float64Array,
  leverage: number,
  expRatio: number,
  fedDaily: Float64Array,
  swapMult: number   // 3x→2, 2x→1, 1x→0
): Float64Array {
  const n = rawPrices.length
  const synth = new Float64Array(n)
  synth[0] = 100.0
  const dailyExp = expRatio / 252
  for (let i = 1; i < n; i++) {
    const ret = (rawPrices[i] - rawPrices[i - 1]) / rawPrices[i - 1]
    synth[i] = synth[i - 1] * (1 + ret * leverage - swapMult * fedDaily[i]) * (1 - dailyExp)
  }
  return synth
}

export async function loadNdx(): Promise<PriceData> {
  if (ndxCache) return ndxCache
  const [{ dates, closes }, fedMap] = await Promise.all([
    loadCsv('/ndx.csv'),
    loadFedMap(),
  ])
  const corrected = applySpliceCorrection(dates, closes)
  const fedDaily = buildFedDaily(dates, fedMap)
  ndxCache = {
    dates,
    rawPrices: corrected,
    lev1:  makeSynthetic(corrected, 1, EXP_1X),
    lev2:  makeSynthetic(corrected, 2, EXP_2X),
    lev3:  makeSynthetic(corrected, 3, EXP_3X),
    lev1c: makeSyntheticWithCosts(corrected, 1, EXP_1X, fedDaily, 0),
    lev2c: makeSyntheticWithCosts(corrected, 2, EXP_2X, fedDaily, 1),
    lev3c: makeSyntheticWithCosts(corrected, 3, EXP_3X, fedDaily, 2),
  }
  return ndxCache
}

export async function loadSp500(): Promise<PriceData> {
  if (sp5Cache) return sp5Cache
  const { dates, closes } = await loadCsv('/sp500.csv')
  // S&P500: 레버리지 없음 → 스왑금리 없음, 운용보수도 standard와 동일 처리
  const lev1 = makeSynthetic(closes, 1, EXP_1X)
  sp5Cache = {
    dates,
    rawPrices: closes,
    lev1,
    lev2: closes,
    lev3: closes,
    lev1c: lev1,
    lev2c: closes,
    lev3c: closes,
  }
  return sp5Cache
}
