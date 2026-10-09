<script setup lang="ts">
import { ref, watch } from 'vue'
import DashboardPager from './components/DashboardPager.vue'
import ClockWeatherDashboard from './components/ClockWeatherDashboard.vue'
import ServiceHealthDashboard from './components/ServiceHealthDashboard.vue'
import AlertToasts from './components/AlertToasts.vue'
import NewsMarketsDashboard from './components/NewsMarketsDashboard.vue'
import { APP_CONFIG } from './config/app.ts'
import { useClock } from './composables/useClock.ts'
import { useDisplayEffects } from './composables/useDisplayEffects.ts'
import { useGeolocation } from './composables/useGeolocation.ts'
import { useNews, useStocks } from './composables/useNewsAndMarkets.ts'
import { useServiceAlerts } from './composables/useServiceAlerts.ts'
import { useServiceHealth } from './composables/useServiceHealth.ts'
import { useViewportHeight } from './composables/useViewportHeight.ts'
import { useWakeLock } from './composables/useWakeLock.ts'
import { useWeather } from './composables/useWeather.ts'
import { loadJson, saveJson } from './services/storage.ts'
import type { LocalPreferences } from './types.ts'

const dashboards = APP_CONFIG.dashboards

function isPreferences(value: unknown): value is LocalPreferences {
  const id = (value as Partial<LocalPreferences> | null)?.lastDashboard
  return dashboards.some((d) => d.id === id)
}

const prefs = loadJson('preferences', isPreferences)
const current = ref(Math.max(0, dashboards.findIndex((d) => d.id === prefs?.lastDashboard)))
watch(current, (index) => {
  const id = dashboards[index]?.id
  if (id) saveJson('preferences', { lastDashboard: id } satisfies LocalPreferences)
})

// Shared state, created once: the dashboards stay mounted
// during swiping and receive their data via props.
const now = useClock()
const { isNight } = useDisplayEffects(now)
useViewportHeight()
useWakeLock()
const { coords } = useGeolocation()
const weather = useWeather(now, coords)
const news = useNews(now)
const stocks = useStocks(now)
const health = useServiceHealth(now)
// Alerts visible on both dashboards.
const alerts = useServiceAlerts(health, isNight)
</script>

<template>
  <DashboardPager v-model="current" :dashboards="dashboards">
    <template #clock>
      <ClockWeatherDashboard :now="now" :weather="weather" :active="dashboards[current]?.id === 'clock'" />
    </template>
    <template #services>
      <ServiceHealthDashboard :now="now" :health="health" />
    </template>
    <template #markets>
      <NewsMarketsDashboard :now="now" :news="news" :stocks="stocks" />
    </template>
  </DashboardPager>
  <AlertToasts :alerts="alerts" :now="now" />
</template>
