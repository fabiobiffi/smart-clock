/**
 * Types shared between server (monitor/weather) and frontend.
 * This file must stay free of Node or DOM dependencies.
 */

/** Status of a monitored service. */
export type ServiceStatus = 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN'

/** Last known state of a service, as exposed by /api/services. */
export interface ServiceSnapshot {
  id: string
  name: string
  status: ServiceStatus
  /** HTTP status code of the last response, if there was one. */
  httpStatus: number | null
  /** Response time (up to the headers) of the last check, in ms. */
  latencyMs: number | null
  /** ISO 8601: time of the last check performed. */
  lastCheckedAt: string | null
  /** ISO 8601: last check in which the service responded as expected. */
  lastSuccessAt: string | null
  /** ISO 8601: last status change. */
  lastChangeAt: string | null
  /** Short message (error or reason for the degradation). */
  message: string | null
  consecutiveFailures: number
}

export interface HealthReport {
  /** ISO 8601: time at which the server generated the report. */
  generatedAt: string
  checkIntervalMs: number
  /** ISO 8601: next scheduled check (full round or confirmation check). */
  nextCheckAt: string | null
  services: ServiceSnapshot[]
}

export interface WeatherLocation {
  name: string
  latitude: number
  longitude: number
}

export interface WeatherConditions {
  temperatureC: number
  /** WMO code returned by the provider. */
  weatherCode: number
  isDay: boolean
  minC: number | null
  maxC: number | null
  /** ISO 8601: time the observation refers to. */
  observedAt: string
}

export interface WeatherReport {
  location: WeatherLocation
  /** null if the provider has never responded successfully. */
  conditions: WeatherConditions | null
  /** ISO 8601: last successful fetch from the provider. */
  fetchedAt: string | null
  /** Error of the last attempt, if it failed. */
  error: string | null
}

export interface NewsItem {
  title: string
  summary: string | null
  link: string
  /** ISO 8601, if present in the feed. */
  publishedAt: string | null
}

export interface NewsReport {
  source: string
  items: NewsItem[]
  /** ISO 8601: last successful fetch. */
  fetchedAt: string | null
  error: string | null
}

export type MarketState = 'pre' | 'open' | 'post' | 'closed'

export interface StockQuote {
  symbol: string
  name: string
  currency: string
  price: number
  previousClose: number
  /** Percentage change from the previous close. */
  changePercent: number
  /** ISO 8601: time of the last price. */
  marketTime: string
  marketState: MarketState
  /** Intraday prices (chronological order) for the day's chart. */
  series: number[]
}

export interface StocksReport {
  quotes: StockQuote[]
  fetchedAt: string | null
  error: string | null
}
