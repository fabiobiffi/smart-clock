import type { MarketState, StockQuote, StocksReport } from '../shared/types.ts'
import { createPolledSource } from './polled.ts'

/** Public (unofficial) Yahoo Finance endpoint: no key required. */
const CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/'
const TIMEOUT_MS = 10_000

export interface StockConfig {
  symbol: string
  name: string
}

interface TradingPeriod {
  start?: number
  end?: number
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string
        currency?: string
        regularMarketPrice?: number
        chartPreviousClose?: number
        previousClose?: number
        regularMarketTime?: number
        currentTradingPeriod?: { pre?: TradingPeriod; regular?: TradingPeriod; post?: TradingPeriod }
      }
      timestamp?: number[]
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }> | null
    error?: { description?: string } | null
  }
}

const within = (t: number, p?: TradingPeriod): boolean =>
  p?.start !== undefined && p.end !== undefined && t >= p.start && t < p.end

/** Converts the /v8/finance/chart response; null if essential data is missing. */
export function parseYahooChart(data: YahooChartResponse, config: StockConfig, nowSeconds: number): StockQuote | null {
  const result = data.chart?.result?.[0]
  const meta = result?.meta
  const price = meta?.regularMarketPrice
  const previousClose = meta?.chartPreviousClose ?? meta?.previousClose
  if (!meta || typeof price !== 'number' || typeof previousClose !== 'number' || previousClose === 0) return null

  const periods = meta.currentTradingPeriod
  const marketState: MarketState = within(nowSeconds, periods?.regular)
    ? 'open'
    : within(nowSeconds, periods?.pre)
      ? 'pre'
      : within(nowSeconds, periods?.post)
        ? 'post'
        : 'closed'

  const closes = result?.indicators?.quote?.[0]?.close ?? []
  return {
    symbol: config.symbol,
    name: config.name,
    currency: meta.currency ?? 'USD',
    price,
    previousClose,
    changePercent: ((price - previousClose) / previousClose) * 100,
    marketTime: new Date((meta.regularMarketTime ?? nowSeconds) * 1000).toISOString(),
    marketState,
    series: closes.filter((v): v is number => typeof v === 'number' && Number.isFinite(v)),
  }
}

async function fetchQuote(config: StockConfig): Promise<StockQuote> {
  const url = `${CHART_URL}${encodeURIComponent(config.symbol)}?range=1d&interval=15m`
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': 'Mozilla/5.0 (clock-dashboard)', accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const quote = parseYahooChart((await response.json()) as YahooChartResponse, config, Date.now() / 1000)
  if (!quote) throw new Error('Incomplete provider response')
  return quote
}

export function createStocksService(stocks: StockConfig[], refreshMs: number) {
  /** Last valid quote per symbol: a failing ticker does not wipe the others. */
  const lastGood = new Map<string, StockQuote>()

  const source = createPolledSource(async () => {
    const results = await Promise.allSettled(stocks.map(fetchQuote))
    let failures = 0
    results.forEach((result, i) => {
      const symbol = stocks[i]?.symbol
      if (result.status === 'fulfilled' && symbol) lastGood.set(symbol, result.value)
      else failures += 1
    })
    if (failures === stocks.length) throw new Error('Provider unreachable')
    return { failures }
  }, refreshMs)

  return {
    start: source.start,
    stop: source.stop,
    getReport(): StocksReport {
      const { data, fetchedAt, error } = source.getState()
      const partial = data && data.failures > 0 ? `${data.failures} quote(s) not updated` : null
      return {
        quotes: stocks.map((s) => lastGood.get(s.symbol)).filter((q): q is StockQuote => q !== undefined),
        fetchedAt,
        error: error ?? partial,
      }
    },
  }
}
