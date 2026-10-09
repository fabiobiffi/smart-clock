<script setup lang="ts">
import type { WeatherIconName } from '../lib/weatherCodes.ts'

defineProps<{ name: WeatherIconName }>()
</script>

<template>
  <svg
    viewBox="0 0 48 48"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- Sun -->
    <g v-if="name === 'clear-day'">
      <circle cx="24" cy="24" r="8" />
      <path d="M24 6v4M24 38v4M6 24h4M38 24h4M11.3 11.3l2.8 2.8M33.9 33.9l2.8 2.8M11.3 36.7l2.8-2.8M33.9 14.1l2.8-2.8" />
    </g>
    <!-- Moon -->
    <path v-else-if="name === 'clear-night'" d="M33 30.5A12.5 12.5 0 0 1 19.5 13a12.5 12.5 0 1 0 13.5 17.5Z" />
    <!-- Sun + cloud -->
    <g v-else-if="name === 'partly-day'">
      <path d="M17 8v3M8.5 11.5l2 2M5 20h3M27 11.5l-2 2" />
      <path d="M11.5 22a7 7 0 0 1 12-6.5" />
      <path d="M16 38h18a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 16 38Z" />
    </g>
    <!-- Moon + cloud -->
    <g v-else-if="name === 'partly-night'">
      <path d="M22 13a7.5 7.5 0 0 1-9.5-7A8 8 0 1 0 22 17" />
      <path d="M16 38h18a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 16 38Z" />
    </g>
    <!-- Cloud -->
    <path v-else-if="name === 'cloudy'" d="M14 36h20a8 8 0 0 0 0-16 10 10 0 0 0-19.4 2.8A6.6 6.6 0 0 0 14 36Z" />
    <!-- Fog -->
    <g v-else-if="name === 'fog'">
      <path d="M14 26h20a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 14 26Z" />
      <path d="M8 32h32M12 38h24" />
    </g>
    <!-- Drizzle / rain -->
    <g v-else-if="name === 'drizzle' || name === 'rain'">
      <path d="M14 28h20a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 14 28Z" />
      <path v-if="name === 'drizzle'" d="M18 34v2M26 34v2M22 40v2M30 40v2" />
      <path v-else d="M18 33l-2 6M25 33l-2 6M32 33l-2 6" />
    </g>
    <!-- Snow -->
    <g v-else-if="name === 'snow'">
      <path d="M14 28h20a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 14 28Z" />
      <path d="M18 34v.01M24 37v.01M30 34v.01M21 42v.01M27 42v.01" stroke-width="3" />
    </g>
    <!-- Thunderstorm -->
    <g v-else-if="name === 'thunder'">
      <path d="M14 28h20a7 7 0 0 0 0-14 9 9 0 0 0-17.4 2.5A6 6 0 0 0 14 28Z" />
      <path d="M25 30l-4 7h6l-4 7" />
    </g>
    <!-- Unknown -->
    <g v-else>
      <circle cx="24" cy="24" r="14" />
      <path d="M20 20a4 4 0 1 1 5.5 3.7c-1 .4-1.5 1.3-1.5 2.3M24 31v.01" />
    </g>
  </svg>
</template>
