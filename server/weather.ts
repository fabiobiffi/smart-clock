import type { WeatherConditions, WeatherLocation, WeatherReport } from '../shared/types.ts'
import { createPolledSource, describeFetchError } from './polled.ts'

const PROVIDER_URL = 'https://api.open-meteo.com/v1/forecast'
const TIMEOUT_MS = 10_000

interface OpenMeteoResponse {
  current?: { time?: string; temperature_2m?: number; weather_code?: number; is_day?: number }
  daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] }
  utc_offset_seconds?: number
}

/** Converts the Open-Meteo response; null if essential data is missing. */
export function parseOpenMeteo(data: OpenMeteoResponse): WeatherConditions | null {
  const current = data.current
  if (!current || typeof current.temperature_2m !== 'number' || typeof current.weather_code !== 'number') {
    return null
  }
  // With timezone=auto the time is local, without offset: we reconstruct it.
  const offset = data.utc_offset_seconds ?? 0
  const observedAt =
    current.time !== undefined
      ? new Date(Date.parse(`${current.time}Z`) - offset * 1000).toISOString()
      : new Date().toISOString()
  return {
    temperatureC: current.temperature_2m,
    weatherCode: current.weather_code,
    isDay: current.is_day !== 0,
    minC: data.daily?.temperature_2m_min?.[0] ?? null,
    maxC: data.daily?.temperature_2m_max?.[0] ?? null,
    observedAt,
  }
}

async function fetchConditions(latitude: number, longitude: number): Promise<WeatherConditions> {
  const url = new URL(PROVIDER_URL)
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: '1',
  }).toString()
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const conditions = parseOpenMeteo((await response.json()) as OpenMeteoResponse)
  if (!conditions) throw new Error('Incomplete provider response')
  return conditions
}

/** Valid coordinates? (null if missing or out of range) */
export function parseCoordinates(lat: string | null, lon: string | null): { latitude: number; longitude: number } | null {
  if (lat === null || lon === null || lat === '' || lon === '') return null
  const latitude = Number(lat)
  const longitude = Number(lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  // ~1 km: enough for weather, reduces the precision shared and improves caching.
  return { latitude: Math.round(latitude * 100) / 100, longitude: Math.round(longitude * 100) / 100 }
}

interface CachedReport {
  report: WeatherReport
  fetchedAtMs: number
  pending: Promise<WeatherReport> | null
}

const MAX_LOCATIONS = 8

/**
 * Weather for the default location (refreshed in the background) and, on request,
 * for arbitrary coordinates sent by the client (geolocation), with a per-location
 * cache and the last valid data kept on error.
 */
export function createWeatherService(
  defaultLocation: WeatherLocation,
  refreshMs: number,
  resolveName: (latitude: number, longitude: number) => Promise<string | null>,
) {
  const source = createPolledSource(() => fetchConditions(defaultLocation.latitude, defaultLocation.longitude), refreshMs)
  const byLocation = new Map<string, CachedReport>()

  async function refreshLocation(key: string, latitude: number, longitude: number, entry: CachedReport | undefined): Promise<WeatherReport> {
    const previous = entry?.report
    const name = previous && previous.location.name !== 'Current location' ? previous.location.name : await resolveName(latitude, longitude)
    const location: WeatherLocation = { name: name ?? 'Current location', latitude, longitude }
    let report: WeatherReport
    try {
      const conditions = await fetchConditions(latitude, longitude)
      report = { location, conditions, fetchedAt: new Date().toISOString(), error: null }
    } catch (error) {
      report = { location, conditions: previous?.conditions ?? null, fetchedAt: previous?.fetchedAt ?? null, error: describeFetchError(error) }
    }
    if (!byLocation.has(key) && byLocation.size >= MAX_LOCATIONS) byLocation.delete(byLocation.keys().next().value ?? '')
    byLocation.set(key, { report, fetchedAtMs: report.error ? (entry?.fetchedAtMs ?? 0) : Date.now(), pending: null })
    return report
  }

  return {
    start: source.start,
    stop: source.stop,
    getReport(): WeatherReport {
      const { data, fetchedAt, error } = source.getState()
      return { location: defaultLocation, conditions: data, fetchedAt, error }
    },
    /** Weather for specific coordinates; concurrent requests share the same call. */
    async getReportFor(latitude: number, longitude: number): Promise<WeatherReport> {
      const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`
      const entry = byLocation.get(key)
      if (entry?.pending) return entry.pending
      if (entry && !entry.report.error && Date.now() - entry.fetchedAtMs < refreshMs) return entry.report
      const pending = refreshLocation(key, latitude, longitude, entry)
      if (entry) entry.pending = pending
      else byLocation.set(key, { report: { location: { name: 'Current location', latitude, longitude }, conditions: null, fetchedAt: null, error: null }, fetchedAtMs: 0, pending })
      return pending
    },
  }
}
