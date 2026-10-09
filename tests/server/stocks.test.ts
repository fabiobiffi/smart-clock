import { describe, expect, it } from 'vitest'
import { parseYahooChart } from '../../server/stocks.ts'

const REGULAR = { start: 1_000_000, end: 1_023_400 }
const sample = {
  chart: {
    result: [
      {
        meta: {
          symbol: 'META',
          currency: 'USD',
          regularMarketPrice: 718.67,
          chartPreviousClose: 720.89,
          regularMarketTime: 1_023_400,
          currentTradingPeriod: { pre: { start: 980_000, end: 1_000_000 }, regular: REGULAR, post: { start: 1_023_400, end: 1_037_800 } },
        },
        indicators: { quote: [{ close: [719, null, 721.5, 718.67] }] },
      },
    ],
  },
}

describe('parseYahooChart', () => {
  it('computes change, market state and series without missing values', () => {
    const q = parseYahooChart(sample, { symbol: 'META', name: 'Meta' }, 1_010_000)
    expect(q).toMatchObject({ symbol: 'META', name: 'Meta', price: 718.67, previousClose: 720.89, marketState: 'open' })
    expect(q?.changePercent).toBeCloseTo(-0.308, 2)
    expect(q?.series).toEqual([719, 721.5, 718.67])
  })

  it('recognizes pre-market, after-hours and closed market', () => {
    const cfg = { symbol: 'META', name: 'Meta' }
    expect(parseYahooChart(sample, cfg, 990_000)?.marketState).toBe('pre')
    expect(parseYahooChart(sample, cfg, 1_030_000)?.marketState).toBe('post')
    expect(parseYahooChart(sample, cfg, 2_000_000)?.marketState).toBe('closed')
  })

  it('does not invent data if price or previous close is missing', () => {
    expect(parseYahooChart({ chart: { result: [{ meta: { regularMarketPrice: 1 } }] } }, { symbol: 'X', name: 'X' }, 0)).toBeNull()
    expect(parseYahooChart({ chart: { result: null } }, { symbol: 'X', name: 'X' }, 0)).toBeNull()
  })
})
