import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import { schedule } from '../core/scheduler.ts'
import { loadJson, saveJson } from '../services/storage.ts'
import type { FetchProblem } from '../types.ts'

export interface RemoteReportOptions<T> {
  /** Cache key in localStorage and task id in the scheduler. */
  key: string
  pollMs: number
  fetch: () => Promise<T>
  isValid: (value: unknown) => value is T
  /** If false, the new report is discarded and the previous one is kept (e.g. server without data). */
  accept?: (next: T, previous: T | null) => boolean
}

export interface RemoteReport<T> {
  report: ShallowRef<T | null>
  problem: Ref<FetchProblem>
  loading: Ref<boolean>
  /** Immediate refresh (e.g. when the request parameters change). */
  refresh: () => Promise<void>
}

/**
 * Report read periodically from a server endpoint, with a local cache:
 * at startup and while offline the last valid data stays visible. Polling goes
 * through the centralized scheduler.
 */
export function useRemoteReport<T>(options: RemoteReportOptions<T>): RemoteReport<T> {
  const cached = loadJson(options.key, options.isValid)
  const report = shallowRef<T | null>(cached)
  const problem = ref<FetchProblem>(null)
  const loading = ref(cached === null)
  let unschedule: (() => void) | null = null

  async function refresh(): Promise<void> {
    if (!navigator.onLine) {
      problem.value = 'offline'
      loading.value = false
      return
    }
    try {
      const next = await options.fetch()
      if (options.accept?.(next, report.value) ?? true) {
        report.value = next
        saveJson(options.key, next)
      }
      problem.value = null
    } catch {
      problem.value = 'unreachable'
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    unschedule = schedule(options.key, options.pollMs, refresh)
  })
  onBeforeUnmount(() => unschedule?.())

  return { report, problem, loading, refresh }
}
