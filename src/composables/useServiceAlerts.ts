import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch, type Ref } from 'vue'
import { APP_CONFIG } from '../config/app.ts'
import { detectTransitions } from '../lib/alerts.ts'
import { isAudioReady, playChime, unlockAudio } from '../services/sound.ts'
import type { ServiceView } from '../types.ts'
import type { ServiceHealthState } from './useServiceHealth.ts'

export interface AlertToast {
  key: string
  kind: 'down' | 'recovered'
  serviceId: string
  name: string
  message: string | null
  /** ISO 8601: when the service went down / came back online. */
  at: string | null
}

/**
 * In-app alerts (not system notifications) when a service goes DOWN or comes back
 * online, visible on any dashboard and accompanied by a discreet sound.
 * The DOWN alert stays until the problem persists or until it is tapped.
 */
export function useServiceAlerts(health: ServiceHealthState, isNight: Readonly<Ref<boolean>>) {
  const down = shallowRef<ReadonlySet<string>>(new Set())
  const dismissed = ref(new Set<string>())
  const recoveries = ref<AlertToast[]>([])
  /** true if a sound was not played because audio is not yet unlocked. */
  const soundBlocked = ref(false)
  const timers = new Set<number>()

  function chime(kind: 'alert' | 'recovery'): void {
    const volume = isNight.value ? APP_CONFIG.alertVolume.night : APP_CONFIG.alertVolume.day
    if (!playChime(kind, volume)) soundBlocked.value = true
  }

  watch(
    () => health.services,
    (services: ServiceView[]) => {
      const { down: next, transitions } = detectTransitions(down.value, services)
      down.value = next
      for (const { kind, service } of transitions) {
        if (kind === 'down') {
          dismissed.value.delete(service.id)
          recoveries.value = recoveries.value.filter((r) => r.serviceId !== service.id)
        } else {
          const toast: AlertToast = {
            key: `recovered-${service.id}-${Date.now()}`,
            kind,
            serviceId: service.id,
            name: service.name,
            message: null,
            at: service.lastChangeAt,
          }
          recoveries.value = [...recoveries.value.filter((r) => r.serviceId !== service.id), toast]
          const timer = window.setTimeout(() => {
            timers.delete(timer)
            dismiss(toast.key)
          }, APP_CONFIG.recoveryToastMs)
          timers.add(timer)
        }
      }
      if (transitions.some((t) => t.kind === 'down')) chime('alert')
      else if (transitions.length > 0) chime('recovery')
    },
    { immediate: true },
  )

  const downToasts = computed<AlertToast[]>(() =>
    health.services
      .filter((s) => down.value.has(s.id) && !dismissed.value.has(s.id))
      .map((s) => ({ key: `down-${s.id}`, kind: 'down', serviceId: s.id, name: s.name, message: s.message, at: s.lastChangeAt })),
  )

  function dismiss(key: string): void {
    const toast = [...downToasts.value, ...recoveries.value].find((t) => t.key === key)
    if (!toast) return
    if (toast.kind === 'down') dismissed.value = new Set([...dismissed.value, toast.serviceId])
    else recoveries.value = recoveries.value.filter((t) => t.key !== key)
  }

  // Unlock audio on the first interaction (a browser requirement).
  async function onInteraction(): Promise<void> {
    if (await unlockAudio()) {
      soundBlocked.value = false
      window.removeEventListener('pointerdown', onInteraction)
      window.removeEventListener('keydown', onInteraction)
    }
  }

  onMounted(() => {
    if (isAudioReady()) return
    window.addEventListener('pointerdown', onInteraction)
    window.addEventListener('keydown', onInteraction)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', onInteraction)
    window.removeEventListener('keydown', onInteraction)
    for (const timer of timers) window.clearTimeout(timer)
  })

  return reactive({
    toasts: computed(() => [...downToasts.value, ...recoveries.value]),
    soundBlocked,
    dismiss,
  })
}

export type ServiceAlertsState = ReturnType<typeof useServiceAlerts>
