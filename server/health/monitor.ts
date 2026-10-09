import type { HealthReport, ServiceSnapshot } from '../../shared/types.ts'
import { evaluateProbe, initialSnapshot } from './evaluate.ts'
import type { ProbeResult, ServiceCheckConfig } from './types.ts'

export interface HealthMonitorOptions {
  /** Interval between two full rounds of checks. */
  intervalMs: number
  /**
   * After a failure that is not yet confirmed, re-checks ONLY that service
   * after retryMs, to reach DOWN early without waiting for the next
   * round. 0 = disabled.
   */
  retryMs?: number
  probe: (config: ServiceCheckConfig) => Promise<ProbeResult>
  /** Monitor connectivity check; if absent, the monitor is assumed to be connected. */
  connectivity?: () => Promise<boolean>
  now?: () => Date
  /** Minimum interval between two manual checks of the same service. */
  manualMinIntervalMs?: number
}

/**
 * Runs checks in rounds: a round starts only after the previous one has finished
 * (setTimeout, not setInterval). Each service has at most one check in
 * flight: rounds, confirmation checks and manual refreshes that request it
 * while it is already being checked wait for the existing one instead of duplicating it.
 */
export function createHealthMonitor(services: ServiceCheckConfig[], options: HealthMonitorOptions) {
  const now = options.now ?? (() => new Date())
  const retryMs = options.retryMs ?? 0
  const snapshots = new Map<string, ServiceSnapshot>(services.map((s) => [s.id, initialSnapshot(s)]))
  let timer: ReturnType<typeof setTimeout> | null = null
  const inFlight = new Map<string, Promise<void>>()
  let stopped = true
  let lastFullRoundAt = 0
  let nextCheckAt: number | null = null

  async function probeAndEvaluate(targets: ServiceCheckConfig[]): Promise<void> {
    const results = await Promise.all(targets.map(async (config) => ({ config, probe: await options.probe(config) })))
    const unreachable = results.some((r) => r.probe.kind === 'timeout' || r.probe.kind === 'network')
    // If at least one service responded, the monitor is certainly online;
    // otherwise connectivity is checked before declaring failures.
    const anyResponse = results.some((r) => r.probe.kind === 'response')
    const online = !unreachable || anyResponse || !options.connectivity || (await options.connectivity())
    const checkedAt = now().toISOString()
    for (const { config, probe } of results) {
      const effective: ProbeResult =
        !online && (probe.kind === 'timeout' || probe.kind === 'network') ? { kind: 'monitor-offline' } : probe
      const previous = snapshots.get(config.id) ?? initialSnapshot(config)
      snapshots.set(config.id, evaluateProbe(config, effective, previous, checkedAt))
    }
  }

  async function runRound(targets: ServiceCheckConfig[] = services): Promise<void> {
    const waiting: Promise<void>[] = []
    const fresh: ServiceCheckConfig[] = []
    for (const target of targets) {
      const pending = inFlight.get(target.id)
      if (pending) waiting.push(pending)
      else fresh.push(target)
    }
    if (fresh.length > 0) {
      const group = probeAndEvaluate(fresh)
      for (const target of fresh) inFlight.set(target.id, group)
      waiting.push(
        group.finally(() => {
          for (const target of fresh) if (inFlight.get(target.id) === group) inFlight.delete(target.id)
        }),
      )
    }
    await Promise.all(waiting)
  }

  /** Services with a failure not yet confirmed (below the DOWN threshold). */
  function pendingConfirmation(): ServiceCheckConfig[] {
    return services.filter((s) => {
      const failures = snapshots.get(s.id)?.consecutiveFailures ?? 0
      return failures > 0 && failures < s.failureThreshold
    })
  }

  function scheduleNext(): void {
    if (stopped) return
    if (timer) clearTimeout(timer)
    const untilFullRound = Math.max(0, lastFullRoundAt + options.intervalMs - Date.now())
    const pending = pendingConfirmation()
    if (retryMs > 0 && pending.length > 0 && retryMs < untilFullRound) {
      nextCheckAt = Date.now() + retryMs
      timer = setTimeout(() => {
        void runRound(pending).finally(scheduleNext)
      }, retryMs)
      return
    }
    nextCheckAt = Date.now() + untilFullRound
    timer = setTimeout(() => {
      lastFullRoundAt = Date.now()
      void runRound().finally(scheduleNext)
    }, untilFullRound)
  }

  /**
   * Manual check of a single service. Returns false if the service
   * does not exist. Requests in quick succession (< manualMinIntervalMs since the last
   * check) do not trigger a new call.
   */
  async function checkNow(id: string): Promise<boolean> {
    const config = services.find((s) => s.id === id)
    if (!config) return false
    const lastChecked = snapshots.get(id)?.lastCheckedAt
    const minInterval = options.manualMinIntervalMs ?? 3_000
    const recent = lastChecked !== null && lastChecked !== undefined && now().getTime() - Date.parse(lastChecked) < minInterval
    if (recent && !inFlight.has(id)) return true
    await runRound([config])
    // A newly detected failure must be confirmed: recompute the schedule.
    scheduleNext()
    return true
  }

  return {
    runRound,
    checkNow,
    start(): void {
      if (!stopped) return
      stopped = false
      lastFullRoundAt = Date.now()
      void runRound().finally(scheduleNext)
    },
    stop(): void {
      stopped = true
      if (timer) clearTimeout(timer)
      timer = null
      nextCheckAt = null
    },
    getReport(): HealthReport {
      return {
        generatedAt: now().toISOString(),
        checkIntervalMs: options.intervalMs,
        nextCheckAt: nextCheckAt === null ? null : new Date(nextCheckAt).toISOString(),
        services: services.map((s) => snapshots.get(s.id) ?? initialSnapshot(s)),
      }
    },
  }
}
