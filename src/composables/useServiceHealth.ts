import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, type Ref } from 'vue'
import type { HealthReport, ServiceStatus } from '../../shared/types.ts'
import { APP_CONFIG } from '../config/app.ts'
import { schedule } from '../core/scheduler.ts'
import { isOlderThan } from '../lib/staleness.ts'
import { fetchHealthReport, isHealthReport, requestServiceCheck } from '../services/api.ts'
import { loadJson, saveJson } from '../services/storage.ts'
import type { FetchProblem, ServiceView } from '../types.ts'

const CACHE_KEY = 'health-report'

/**
 * Service status read from the monitor (/api/services).
 * If the browser is offline or the monitor does not respond, the last known
 * report stays visible, marked as stale: it is never turned into DOWN.
 */
export function useServiceHealth(now: Readonly<Ref<Date>>) {
  const cached = loadJson(CACHE_KEY, isHealthReport)
  const report = shallowRef<HealthReport | null>(cached)
  const problem = ref<FetchProblem>(null)
  const loading = ref(cached === null)
  /** Istante (orologio locale) dell'ultima risposta del monitor. */
  const receivedAt = ref<number | null>(null)
  /** Services with a manual check in progress. */
  const checking = ref(new Set<string>())

  function accept(next: HealthReport): void {
    report.value = next
    receivedAt.value = Date.now()
    problem.value = null
    saveJson(CACHE_KEY, next)
  }
  let unschedule: (() => void) | null = null

  async function refresh(): Promise<void> {
    if (!navigator.onLine) {
      problem.value = 'offline'
      loading.value = false
      return
    }
    try {
      accept(await fetchHealthReport())
    } catch {
      problem.value = 'unreachable'
    } finally {
      loading.value = false
    }
  }

  const services = computed<ServiceView[]>(() => {
    const current = report.value
    if (!current) return []
    const maxAge = current.checkIntervalMs * APP_CONFIG.healthStaleIntervals
    // Check age measured only with the server clock (generatedAt),
    // report age only with the local one: immune to misaligned clocks.
    const serverNow = new Date(current.generatedAt)
    const pollMaxAge = APP_CONFIG.healthPollMs * APP_CONFIG.healthPollStaleIntervals
    const reportStale =
      problem.value !== null || receivedAt.value === null || now.value.getTime() - receivedAt.value > pollMaxAge
    return current.services.map((s) => ({
      ...s,
      stale: reportStale || isOlderThan(s.lastCheckedAt, serverNow, maxAge),
    }))
  })

  const counts = computed(() => {
    const result: Record<ServiceStatus, number> = { UP: 0, DEGRADED: 0, DOWN: 0, UNKNOWN: 0 }
    for (const s of services.value) result[s.status] += 1
    return result
  })

  /** Manual re-check of a service (tap on the card). Ignored if already in progress. */
  async function recheck(id: string): Promise<void> {
    if (checking.value.has(id)) return
    checking.value = new Set([...checking.value, id])
    const minSpinner = new Promise((resolve) => window.setTimeout(resolve, APP_CONFIG.manualCheckMinSpinnerMs))
    try {
      if (!navigator.onLine) {
        problem.value = 'offline'
        return
      }
      accept(await requestServiceCheck(id))
    } catch {
      problem.value = 'unreachable'
    } finally {
      await minSpinner
      const next = new Set(checking.value)
      next.delete(id)
      checking.value = next
    }
  }

  onMounted(() => {
    unschedule = schedule('health', APP_CONFIG.healthPollMs, refresh)
  })
  onBeforeUnmount(() => unschedule?.())

  return reactive({
    services,
    counts,
    problem,
    loading,
    checking,
    recheck,
    /** Last check performed by the monitor (the most recent among the services). */
    lastCheckAt: computed(() => {
      const times = report.value?.services.map((s) => s.lastCheckedAt).filter((t): t is string => t !== null) ?? []
      return times.length ? times.reduce((a, b) => (a > b ? a : b)) : null
    }),
    nextCheckAt: computed(() => report.value?.nextCheckAt ?? null),
  })
}

export type ServiceHealthState = ReturnType<typeof useServiceHealth>
