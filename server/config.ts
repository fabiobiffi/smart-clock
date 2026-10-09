import type { WeatherLocation } from '../shared/types.ts'
import type { ServiceCheckConfig } from './health/types.ts'
import type { StockConfig } from './stocks.ts'

/**
 * Single place to configure the monitored services.
 * To add a service: add an entry to SERVICES and rebuild the
 * image (`make dev-up-build`). See the README for details.
 */
const DEFAULT_CHECK = {
  expectedStatus: [200],
  timeoutMs: 10_000,
  degradedLatencyMs: 2_000,
  failureThreshold: 2,
} satisfies Partial<ServiceCheckConfig>

export const SERVICES: ServiceCheckConfig[] = [
  { ...DEFAULT_CHECK, id: 'onlite', name: 'onlite.it', url: 'https://onlite.it' },
  { ...DEFAULT_CHECK, id: 'fabiobiffi', name: 'fabiobiffi.com', url: 'https://fabiobiffi.com' },
  { ...DEFAULT_CHECK, id: 'jiptv', name: 'jiptv.net', url: 'https://jiptv.net' },
  // Responds 301 → /it/: redirects are followed and the final status code counts.
  { ...DEFAULT_CHECK, id: 'gioca', name: 'gioca.cloud', url: 'https://gioca.cloud' },
]

/** Tickers shown in the news and markets dashboard (Yahoo Finance symbols). */
export const STOCKS: StockConfig[] = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'META', name: 'Meta' },
]

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  const value = raw === undefined || raw === '' ? NaN : Number(raw)
  return Number.isFinite(value) ? value : fallback
}

export const SERVER_CONFIG = {
  port: numberFromEnv('PORT', 8080),
  /** One round of checks every 5 minutes. */
  healthIntervalMs: Math.max(5_000, numberFromEnv('HEALTH_INTERVAL_MS', 5 * 60_000)),
  /** Confirmation check after a failure, for that service only (0 = disabled). */
  healthRetryMs: Math.max(0, numberFromEnv('HEALTH_RETRY_MS', 30_000)),
  /**
   * Used only when ALL checks fail due to network/timeout, to tell
   * "services down" apart from "monitor offline". Hostname-based: also covers DNS failures.
   */
  connectivityProbeUrl: process.env.CONNECTIVITY_PROBE_URL ?? 'https://www.cloudflare.com/cdn-cgi/trace',
  weatherRefreshMs: 15 * 60_000,
  /** News RSS feed (default: ANSA "Latest news"). */
  newsFeedUrl: process.env.NEWS_RSS_URL || 'https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml',
  newsSourceName: process.env.NEWS_SOURCE_NAME || 'ANSA',
  newsRefreshMs: 10 * 60_000,
  stocksRefreshMs: Math.max(60_000, numberFromEnv('STOCKS_REFRESH_MS', 5 * 60_000)),
  weatherLocation: {
    name: process.env.WEATHER_LOCATION_NAME || 'Mezzago',
    latitude: numberFromEnv('WEATHER_LATITUDE', 45.62898),
    longitude: numberFromEnv('WEATHER_LONGITUDE', 9.44485),
  } satisfies WeatherLocation,
}
