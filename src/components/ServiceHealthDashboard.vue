<script setup lang="ts">
import { computed } from 'vue'
import { formatDateTime, formatTimestamp } from '../lib/format.ts'
import type { ServiceHealthState } from '../composables/useServiceHealth.ts'
import ServiceCard from './ServiceCard.vue'

const props = defineProps<{ now: Date; health: ServiceHealthState }>()

/** Grid tuned for 16:9 landscape: 2 columns up to 4 services, then 3. */
const gridStyle = computed(() => {
  const n = Math.max(props.health.services.length, 1)
  const columns = n <= 2 ? n : n <= 4 ? 2 : 3
  return { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.ceil(n / columns)}, minmax(0, 1fr))` }
})

const summary = computed(() => {
  const { counts, services } = props.health
  if (services.length === 0) return ''
  const parts: string[] = []
  if (counts.DOWN) parts.push(`${counts.DOWN} down`)
  if (counts.DEGRADED) parts.push(`${counts.DEGRADED} degraded`)
  if (counts.UNKNOWN) parts.push(`${counts.UNKNOWN} unknown`)
  const text = parts.length ? parts.join(' · ') : `${counts.UP}/${services.length} up`
  return props.health.problem ? `${text} (last known)` : text
})

const allGood = computed(
  () => !props.health.problem && props.health.services.length > 0 && props.health.counts.UP === props.health.services.length,
)

const connectionNote = computed(() => {
  const h = props.health
  if (h.problem === 'offline') return 'Device offline · data not updated'
  if (h.problem === 'unreachable') return 'Monitor unreachable · data not updated'
  return h.nextCheckAt ? `next ${formatTimestamp(h.nextCheckAt, props.now)}` : ''
})
</script>

<template>
  <div class="health burn-in-shift">
    <header class="health__head">
      <h1 class="health__title">Services</h1>
      <p class="health__summary" :class="{ 'is-ok': allGood }">{{ summary }}</p>
      <p class="health__updated tabular">
        Last check <span class="health__updated-time">{{ formatDateTime(health.lastCheckAt) }}</span>
        <span v-if="connectionNote" class="health__note" :class="{ 'is-warning': health.problem }">· {{ connectionNote }}</span>
      </p>
    </header>

    <div v-if="health.services.length" class="health__grid" :style="gridStyle">
      <ServiceCard
        v-for="service in health.services"
        :key="service.id"
        :service="service"
        :now="now"
        :checking="health.checking.has(service.id)"
        @recheck="health.recheck(service.id)"
      />
    </div>
    <div v-else class="health__empty">
      <p class="health__empty-status">UNKNOWN</p>
      <p>{{ health.loading ? 'Loading service status…' : 'No data from the monitor yet' }}</p>
    </div>
  </div>
</template>

<style scoped>
.health {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: calc(var(--gutter) * 0.8) var(--gutter) calc(var(--gutter) * 1.3);
  gap: calc(var(--u) * 3.2);
}

.health__head {
  display: flex;
  align-items: baseline;
  gap: calc(var(--u) * 3);
  min-width: 0;
}

.health__title {
  font-size: calc(var(--u) * 6);
  font-weight: 600;
  color: var(--text);
}

.health__summary {
  font-size: calc(var(--u) * 4.4);
  font-weight: 500;
  color: var(--text-2);
}

.health__summary.is-ok {
  color: var(--status-up);
}

.health__updated {
  margin-left: auto;
  min-width: 0;
  font-size: calc(var(--u) * 3.6);
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.health__updated-time {
  color: var(--text-2);
}

.health__note {
  margin-left: 0.3em;
  color: var(--text-3);
}

.health__note.is-warning {
  color: var(--status-degraded);
}

.health__grid {
  flex: 1;
  min-height: 0;
  display: grid;
  gap: calc(var(--u) * 3);
}

.health__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u) * 2);
  font-size: calc(var(--u) * 4.4);
  color: var(--text-2);
}

.health__empty-status {
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--status-unknown);
}
</style>
