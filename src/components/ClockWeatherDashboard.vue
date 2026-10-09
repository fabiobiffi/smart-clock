<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatTime, formatWeekday } from '../lib/format.ts'
import { describeWeather, type WeatherIconName } from '../lib/weatherCodes.ts'
import { SCENE_NAMES } from '../lib/weatherScene.ts'
import type { WeatherState } from '../composables/useWeather.ts'
import WeatherBackdrop from './WeatherBackdrop.vue'
import WeatherPanel from './WeatherPanel.vue'

const props = defineProps<{ now: Date; weather: WeatherState; active: boolean }>()

/** Preview a scene without waiting for the right weather: ?weather=rain, ?weather=snow, … */
const previewScene = ((): WeatherIconName | null => {
  const value = new URLSearchParams(window.location.search).get('weather')
  return SCENE_NAMES.find((name) => name === value) ?? null
})()

const scene = computed<WeatherIconName | null>(() => {
  if (previewScene) return previewScene
  const c = props.weather.conditions
  return c ? describeWeather(c.weatherCode, c.isDay).icon : null
})

const time = computed(() => formatTime(props.now))
const weekday = computed(() => formatWeekday(props.now))
const date = computed(() => formatDate(props.now))
</script>

<template>
  <div class="clock-page">
    <WeatherBackdrop :icon="scene" :active="active" />
    <div class="clock-dashboard burn-in-shift">
      <div class="clock">
        <time class="clock__time tabular" :datetime="now.toISOString()">{{ time }}</time>
      </div>
      <aside class="side">
        <div class="date">
          <p class="date__weekday">{{ weekday }}</p>
          <p class="date__full">{{ date }}</p>
        </div>
        <WeatherPanel :weather="weather" :now="now" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.clock-page {
  position: relative;
  height: 100%;
}

.clock-dashboard {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  align-items: center;
  height: 100%;
  padding: var(--gutter) calc(var(--gutter) * 1.2) calc(var(--gutter) * 1.4);
  column-gap: calc(var(--gutter) * 1.2);
}

.clock {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.clock__time {
  font-size: calc(var(--u) * 37);
  font-weight: 200;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--text);
  white-space: nowrap;
}

.side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: calc(var(--u) * 6);
  min-width: 0;
}

.date__weekday {
  font-size: calc(var(--u) * 7.4);
  font-weight: 500;
  line-height: 1.1;
  color: var(--text);
}

.date__full {
  margin-top: calc(var(--u) * 1);
  font-size: calc(var(--u) * 5.2);
  font-weight: 400;
  color: var(--text-2);
}
</style>
