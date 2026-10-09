import type { HealthReport, NewsReport, StocksReport, WeatherReport } from '../../shared/types.ts'
import { APP_CONFIG } from '../config/app.ts'

export class RequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequestError'
  }
}

/** JSON request with timeout (AbortController for compatibility with older browsers). */
async function requestJson<T>(path: string, method: 'GET' | 'POST', timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(path, {
      method,
      signal: controller.signal,
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new RequestError(`HTTP ${response.status}`)
    return (await response.json()) as T
  } catch (error) {
    if (controller.signal.aborted) throw new RequestError('Timeout')
    throw error instanceof RequestError ? error : new RequestError('Network unavailable')
  } finally {
    window.clearTimeout(timer)
  }
}

const getJson = <T>(path: string): Promise<T> => requestJson<T>(path, 'GET', APP_CONFIG.requestTimeoutMs)

export const fetchHealthReport = (): Promise<HealthReport> => getJson<HealthReport>('/api/services')
/** Weather for the device coordinates, if known; otherwise for the default location. */
export const fetchWeatherReport = (coords?: { latitude: number; longitude: number } | null): Promise<WeatherReport> =>
  getJson<WeatherReport>(coords ? `/api/weather?lat=${coords.latitude}&lon=${coords.longitude}` : '/api/weather')
export const fetchNewsReport = (): Promise<NewsReport> => getJson<NewsReport>('/api/news')
export const fetchStocksReport = (): Promise<StocksReport> => getJson<StocksReport>('/api/stocks')

/** Immediate re-check of a single service; returns the updated report. */
export const requestServiceCheck = (id: string): Promise<HealthReport> =>
  requestJson<HealthReport>(`/api/services/${encodeURIComponent(id)}/check`, 'POST', APP_CONFIG.manualCheckTimeoutMs)

export function isHealthReport(value: unknown): value is HealthReport {
  const v = value as Partial<HealthReport> | null
  return !!v && typeof v.generatedAt === 'string' && Array.isArray(v.services)
}

export function isWeatherReport(value: unknown): value is WeatherReport {
  const v = value as Partial<WeatherReport> | null
  return !!v && typeof v.location === 'object' && v.location !== null && 'conditions' in v
}

export function isNewsReport(value: unknown): value is NewsReport {
  const v = value as Partial<NewsReport> | null
  return !!v && typeof v.source === 'string' && Array.isArray(v.items)
}

export function isStocksReport(value: unknown): value is StocksReport {
  const v = value as Partial<StocksReport> | null
  return !!v && Array.isArray(v.quotes)
}
