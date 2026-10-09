<script setup lang="ts">
import { computed } from 'vue'
import { formatTemperature, formatTimestamp } from '../lib/format.ts'
import { describeWeather } from '../lib/weatherCodes.ts'
import type { WeatherState } from '../composables/useWeather.ts'
import WeatherIcon from './WeatherIcon.vue'

const props = defineProps<{ weather: WeatherState; now: Date }>()

const descriptor = computed(() => {
  const c = props.weather.conditions
  return c ? describeWeather(c.weatherCode, c.isDay) : null
})

/** Status line: location and data freshness, or the reason it is missing. */
const statusLine = computed(() => {
  const w = props.weather
  if (!w.conditions) {
    if (w.loading) return 'Loading weather…'
    if (w.problem === 'offline') return 'Weather unavailable · offline'
    return 'Weather unavailable'
  }
  const when = formatTimestamp(w.fetchedAt, props.now)
  if (w.stale) return `${w.location} · not updated (${when})`
  return `${w.location} · ${when}`
})
</script>

<template>
  <div class="weather" :class="{ 'is-stale': weather.stale && weather.conditions }">
    <template v-if="weather.conditions && descriptor">
      <div class="weather__main">
        <WeatherIcon class="weather__icon" :name="descriptor.icon" />
        <span class="weather__temp tabular">{{ formatTemperature(weather.conditions.temperatureC) }}</span>
      </div>
      <p class="weather__label">{{ descriptor.label }}</p>
      <p class="weather__range tabular">
        <span><span class="visually-hidden">Low </span>↓ {{ formatTemperature(weather.conditions.minC) }}</span>
        <span><span class="visually-hidden">High </span>↑ {{ formatTemperature(weather.conditions.maxC) }}</span>
      </p>
    </template>
    <p class="weather__meta" :class="{ 'is-warning': weather.stale && weather.conditions }">
      <svg v-if="weather.geolocated && weather.conditions" class="weather__pin" viewBox="0 0 12 16" aria-label="Current location">
        <path d="M6 15s5-5.2 5-9A5 5 0 0 0 1 6c0 3.8 5 9 5 9Z" fill="none" stroke="currentColor" stroke-width="1.5" />
        <circle cx="6" cy="6" r="1.8" fill="currentColor" />
      </svg>
      {{ statusLine }}
    </p>
  </div>
</template>

<style scoped>
.weather {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 1.4);
  min-width: 0;
}

.weather.is-stale .weather__main,
.weather.is-stale .weather__label,
.weather.is-stale .weather__range {
  opacity: 0.55;
}

.weather__main {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 3);
}

.weather__icon {
  width: calc(var(--u) * 14);
  height: calc(var(--u) * 14);
  flex: none;
  color: var(--accent);
}

.weather__temp {
  font-size: calc(var(--u) * 16);
  font-weight: 300;
  line-height: 1;
  color: var(--text);
}

.weather__label {
  font-size: calc(var(--u) * 5.2);
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weather__range {
  display: flex;
  gap: calc(var(--u) * 4);
  font-size: calc(var(--u) * 4.8);
  color: var(--text-2);
}

.weather__meta {
  margin-top: calc(var(--u) * 1);
  font-size: calc(var(--u) * 3.6);
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.weather__pin {
  width: 0.75em;
  height: 1em;
  margin-right: 0.2em;
  vertical-align: -0.12em;
}

.weather__meta.is-warning {
  color: var(--status-degraded);
}
</style>
