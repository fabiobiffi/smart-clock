import { computed, reactive, watch, type Ref } from 'vue'
import { APP_CONFIG } from '../config/app.ts'
import { isOlderThan } from '../lib/staleness.ts'
import { fetchWeatherReport, isWeatherReport } from '../services/api.ts'
import type { Coordinates } from './useGeolocation.ts'
import { useRemoteReport } from './useRemoteReport.ts'

/**
 * Weather read from /api/weather (the server queries the provider), for the
 * device location if available, otherwise for the server's
 * default location. Shows the last valid data available and marks it as
 * stale; never generates data when there is no response.
 */
export function useWeather(now: Readonly<Ref<Date>>, coords: Readonly<Ref<Coordinates | null>>) {
  const { report, problem, loading, refresh } = useRemoteReport({
    key: 'weather-report',
    pollMs: APP_CONFIG.weatherPollMs,
    fetch: () => fetchWeatherReport(coords.value),
    isValid: isWeatherReport,
    // If the server has no data yet, the last valid local data is kept.
    accept: (next, previous) => next.conditions !== null || !previous?.conditions,
  })

  // New location: weather refreshed immediately, without waiting for the next poll.
  watch(coords, () => void refresh())

  return reactive({
    conditions: computed(() => report.value?.conditions ?? null),
    location: computed(() => report.value?.location.name ?? null),
    /** true if the weather refers to the location detected by the device. */
    geolocated: computed(() => {
      const c = coords.value
      const l = report.value?.location
      return !!c && !!l && Math.abs(l.latitude - c.latitude) < 0.006 && Math.abs(l.longitude - c.longitude) < 0.006
    }),
    fetchedAt: computed(() => report.value?.fetchedAt ?? null),
    providerError: computed(() => report.value?.error ?? null),
    stale: computed(() => isOlderThan(report.value?.fetchedAt ?? null, now.value, APP_CONFIG.weatherStaleAfterMs)),
    problem,
    loading,
  })
}

export type WeatherState = ReturnType<typeof useWeather>
