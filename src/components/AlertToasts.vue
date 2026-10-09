<script setup lang="ts">
import { computed } from 'vue'
import { formatTimestamp } from '../lib/format.ts'
import type { ServiceAlertsState } from '../composables/useServiceAlerts.ts'

const props = defineProps<{ alerts: ServiceAlertsState; now: Date }>()

const MAX_VISIBLE = 3
const visible = computed(() => props.alerts.toasts.slice(0, MAX_VISIBLE))
const hidden = computed(() => Math.max(0, props.alerts.toasts.length - MAX_VISIBLE))
</script>

<template>
  <div class="toasts burn-in-shift" role="region" aria-label="Service alerts" aria-live="assertive">
    <TransitionGroup name="toast">
      <button
        v-for="toast in visible"
        :key="toast.key"
        type="button"
        class="toast"
        :class="`is-${toast.kind}`"
        @click="alerts.dismiss(toast.key)"
      >
        <span class="toast__icon" aria-hidden="true" />
        <span class="toast__body">
          <span class="toast__title">
            {{ toast.kind === 'down' ? `${toast.name} is down` : `${toast.name} is back online` }}
          </span>
          <span class="toast__detail">
            <template v-if="toast.message">{{ toast.message }} · </template>
            {{ toast.kind === 'down' ? 'since' : 'at' }} {{ formatTimestamp(toast.at, now) }}
            <template v-if="toast.kind === 'down' && alerts.soundBlocked"> · tap once to enable sound</template>
          </span>
        </span>
      </button>
    </TransitionGroup>
    <p v-if="hidden" class="toast__more">+{{ hidden }} more</p>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: calc(var(--u) * 3);
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--u) * 1.6);
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 2.6);
  max-width: 76%;
  padding: calc(var(--u) * 2.2) calc(var(--u) * 4) calc(var(--u) * 2.2) calc(var(--u) * 3);
  border: 1px solid var(--toast-color);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.toast.is-down {
  --toast-color: var(--status-down);
}

.toast.is-recovered {
  --toast-color: var(--status-up);
}

/* Shapes as in the badges: square = down, circle = online. */
.toast__icon {
  flex: none;
  width: calc(var(--u) * 2.8);
  height: calc(var(--u) * 2.8);
  border-radius: 2px;
  background: var(--toast-color);
}

.is-recovered .toast__icon {
  border-radius: 50%;
}

.toast__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.toast__title {
  font-size: calc(var(--u) * 4.4);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast__detail {
  font-size: calc(var(--u) * 3.4);
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast__more {
  font-size: calc(var(--u) * 3.4);
  color: var(--text-2);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--page-transition), transform var(--page-transition);
}

.toast-leave-active {
  /* Out of the flow: the remaining toasts move to the top immediately. */
  position: absolute;
}

.toast-move {
  transition: transform var(--page-transition);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(calc(var(--u) * -3));
}
</style>
