import Papa from 'papaparse'

export interface RawRow {
  Date: string
  Close: string
}

export interface PriceData {
  dates: Date[]
  rawPrices: Float64Array   // 원본 (splice 보정된)
  lev1: Float64Array
  lev2: Float64Array
  lev3: Float64Array
}

let ndxCache: PriceData | null = null
let sp5Cache: PriceData | null = null

async function loadCsv(url: string): Promise<{ dates: Date[]; closes: Float64Array }> {
  const res = await fetch(url)
  const text = await res.text()
  const result = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true })
  const rows = result.data.filter(r => r.Date && r.Close)
  const dates = rows.map(r => new Date(r.Date))
  const closes = new Float64Array(rows.map(r => parseFloat(r.Close)))
  return { dates, closes }
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

function makeSynthetic(rawPrices: Float64Array, leverage: number): Float64Array {
  const n = rawPrices.length
  const synth = new Float64Array(n)
  synth[0] = 100.0
  for (let i = 1; i < n; i++) {
    const ret = (rawPrices[i] - rawPrices[i - 1]) / rawPrices[i - 1]
    synth[i] = synth[i - 1] * (1 + ret * leverage)
  }
  return synth
}

export async function loadNdx(): Promise<PriceData> {
  if (ndxCache) return ndxCache
  const { dates, closes } = await loadCsv('/ndx.csv')
  const corrected = applySpliceCorrection(dates, closes)
  ndxCache = {
    dates,
    rawPrices: corrected,
    lev1: makeSynthetic(corrected, 1),
    lev2: makeSynthetic(corrected, 2),
    lev3: makeSynthetic(corrected, 3),
  }
  return ndxCache
}

export async function loadSp500(): Promise<PriceData> {
  if (sp5Cache) return sp5Cache
  const { dates, closes } = await loadCsv('/sp500.csv')
  // S&P500은 splice 보정 불필요
  sp5Cache = {
    dates,
    rawPrices: closes,
    lev1: makeSynthetic(closes, 1),
    lev2: closes,  // unused
    lev3: closes,  // unused
  }
  return sp5Cache
}
