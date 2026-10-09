<script setup lang="ts">
import { computed } from 'vue'
import { SERVICE_BRANDS } from '../config/serviceBrands.ts'
import { cardBackground } from '../lib/color.ts'
import { formatLatency, formatTimestamp } from '../lib/format.ts'
import type { ServiceView } from '../types.ts'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ service: ServiceView; now: Date; checking: boolean }>()
const emit = defineEmits<{ recheck: [] }>()

const checked = computed(() => formatTimestamp(props.service.lastCheckedAt, props.now))
const message = computed(() => props.service.message ?? (props.service.stale ? '' : 'No issues detected'))

const brand = computed(() => SERVICE_BRANDS[props.service.id] ?? null)

/** Brand CSS variables. Status is conveyed only by the badge and border. */
const brandStyle = computed(() => {
  const b = brand.value
  if (!b) return {}
  return {
    '--brand-bg': cardBackground(b.primary),
    '--brand-bg-2': cardBackground(b.secondary ?? b.primary, 0.025),
    '--brand-logo-bg': b.logoBackground,
  }
})
</script>

<template>
  <!-- Tap = immediate recheck of this service only (non-destructive action). -->
  <article
    class="card"
    :class="[`is-${service.status.toLowerCase()}`, { 'is-stale': service.stale, 'is-branded': brand, 'is-checking': checking }]"
    :style="brandStyle"
    role="button"
    tabindex="0"
    :aria-busy="checking"
    :aria-label="`${service.name}: ${service.status}. Tap to check now`"
    @click="emit('recheck')"
    @keydown.enter.prevent="emit('recheck')"
  >
    <header class="card__head">
      <img v-if="brand" class="card__logo" :src="brand.logo" alt="" width="48" height="48" decoding="async" />
      <h2 class="card__name">{{ service.name }}</h2>
      <span v-if="checking" class="card__spinner" role="status"><span class="visually-hidden">Checking</span></span>
      <StatusBadge :status="service.status" />
    </header>

    <p class="card__latency tabular">
      {{ formatLatency(service.latencyMs) }}
      <span v-if="service.httpStatus !== null" class="card__http">HTTP {{ service.httpStatus }}</span>
    </p>

    <footer class="card__foot">
      <p class="card__message" :class="{ 'is-empty': !service.message }">{{ message }}</p>
      <p class="card__checked tabular">
        <span v-if="service.stale" class="card__stale">Stale ·</span>
        {{ checked }}
      </p>
    </footer>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  min-height: 0;
  padding: calc(var(--u) * 3.6) calc(var(--u) * 4);
  border-radius: var(--radius);
  background: var(--surface-1);
  border: 1px solid var(--surface-1);
  transition: border-color 400ms ease, opacity 400ms ease, transform 120ms ease;
}

/*
 * Solid brand background: from the primary to the secondary color, both
 * darkened to the same luminance (see cardBackground). Dimmed at night.
 */
.card.is-branded {
  --text-2: var(--card-text-2);
  --text-3: var(--card-text-3);
  border-color: transparent;
}

.card.is-branded::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(135deg, var(--brand-bg) 0%, var(--brand-bg) 35%, var(--brand-bg-2) 100%);
  opacity: var(--brand-strength);
  pointer-events: none;
}

.card {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.card:active {
  transform: scale(0.985);
}

.card__spinner {
  flex: none;
  width: calc(var(--u) * 4.4);
  height: calc(var(--u) * 4.4);
  border-radius: 50%;
  border: calc(var(--u) * 0.6) solid rgba(255, 255, 255, 0.25);
  border-top-color: var(--text);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card__spinner {
    animation-duration: 2.4s;
  }
}

.card.is-down {
  border-color: var(--status-down);
  /* Thick ring: stays visible even on a red-branded card. */
  box-shadow: inset 0 0 0 calc(var(--u) * 0.6) var(--status-down);
}

.card.is-degraded {
  border-color: var(--border);
}

.card.is-stale {
  border-style: dashed;
  border-color: var(--status-degraded);
}

.card.is-checking .card__latency {
  opacity: 0.6;
}

.card.is-stale .card__head,
.card.is-stale .card__latency {
  opacity: 0.55;
}

.card__head {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 2.4);
  min-width: 0;
}

.card__logo {
  flex: none;
  width: calc(var(--u) * 9);
  height: calc(var(--u) * 9);
  border-radius: calc(var(--u) * 2);
  object-fit: contain;
  background: var(--brand-logo-bg);
  opacity: var(--brand-logo-opacity);
}

.card__name {
  flex: 1;
  min-width: 0;
  font-size: calc(var(--u) * 5.4);
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__latency {
  display: flex;
  align-items: baseline;
  gap: calc(var(--u) * 2.4);
  font-size: calc(var(--u) * 8);
  font-weight: 300;
  line-height: 1;
  color: var(--text);
}

.card__http {
  font-size: calc(var(--u) * 3.6);
  font-weight: 500;
  color: var(--text-3);
}

.card__foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: calc(var(--u) * 2);
  font-size: calc(var(--u) * 3.6);
}

.card__message {
  min-width: 0;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card__message.is-empty {
  color: var(--text-3);
}

.card__checked {
  flex: none;
  color: var(--text-3);
}

.card__stale {
  color: var(--status-degraded);
  font-weight: 600;
}
</style>
