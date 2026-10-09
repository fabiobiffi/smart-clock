<script setup lang="ts">
import type { ServiceStatus } from '../../shared/types.ts'

defineProps<{ status: ServiceStatus }>()
</script>

<template>
  <span class="badge" :class="`is-${status.toLowerCase()}`">
    <span class="badge__dot" aria-hidden="true" />
    <span class="badge__label">{{ status }}</span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u) * 1.6);
  font-size: calc(var(--u) * 3.8);
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--badge-color);
  /* Dark pill: readable on any card background. */
  padding: calc(var(--u) * 0.9) calc(var(--u) * 2.2);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
}

.badge__dot {
  width: calc(var(--u) * 2.4);
  height: calc(var(--u) * 2.4);
  border-radius: 50%;
  background: var(--badge-color);
}

/* Distinct shapes in addition to color: UP filled, DEGRADED diamond, DOWN square, UNKNOWN ring. */
.is-up { --badge-color: var(--status-up); }
.is-degraded { --badge-color: var(--status-degraded); }
.is-degraded .badge__dot { border-radius: 2px; transform: rotate(45deg) scale(0.85); }
.is-down { --badge-color: var(--status-down); }
.is-down .badge__dot { border-radius: 2px; }
.is-unknown { --badge-color: var(--status-unknown); }
.is-unknown .badge__dot { background: transparent; box-shadow: inset 0 0 0 2px var(--badge-color); }
</style>
