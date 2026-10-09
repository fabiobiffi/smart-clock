import type { ServiceSnapshot, ServiceStatus } from '../../shared/types.ts'
import type { BodyRule, ProbeResult, ServiceCheckConfig } from './types.ts'

export function initialSnapshot(config: ServiceCheckConfig): ServiceSnapshot {
  return {
    id: config.id,
    name: config.name,
    status: 'UNKNOWN',
    httpStatus: null,
    latencyMs: null,
    lastCheckedAt: null,
    lastSuccessAt: null,
    lastChangeAt: null,
    message: 'Waiting for first check',
    consecutiveFailures: 0,
  }
}

function readJsonPath(value: unknown, path: string): unknown {
  let current: unknown = value
  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/** Returns null if the rule is satisfied, otherwise the reason. */
export function checkBodyRule(rule: BodyRule, body: string | null): string | null {
  if (body === null) return 'Empty response body'
  if (rule.type === 'contains') {
    return body.includes(rule.value) ? null : 'Expected content not found'
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return 'Response is not JSON'
  }
  const actual = readJsonPath(parsed, rule.path)
  return actual === rule.expected ? null : `${rule.path} = ${JSON.stringify(actual) ?? 'missing'}`
}

/**
 * Applies the healthcheck rules to the outcome of a probe.
 *
 * - Expected response, body rule ok, latency normal → UP
 * - Expected response but slow, or body rule not satisfied → DEGRADED
 * - Unexpected status code, timeout, network error → failure: DOWN only after
 *   `failureThreshold` consecutive failures; until then it stays DEGRADED (if it
 *   was reachable) or UNKNOWN (if there is no previous data).
 * - Monitor without connectivity → last known state unchanged (becomes stale),
 *   without counting the failure.
 */
export function evaluateProbe(
  config: ServiceCheckConfig,
  probe: ProbeResult,
  previous: ServiceSnapshot,
  checkedAt: string,
): ServiceSnapshot {
  const base = { ...previous, id: config.id, name: config.name, lastCheckedAt: checkedAt }

  const withStatus = (status: ServiceStatus, patch: Partial<ServiceSnapshot>): ServiceSnapshot => ({
    ...base,
    ...patch,
    status,
    lastChangeAt: status !== previous.status ? checkedAt : previous.lastChangeAt,
  })

  const failure = (message: string, patch: Partial<ServiceSnapshot>): ServiceSnapshot => {
    const failures = previous.consecutiveFailures + 1
    if (failures >= config.failureThreshold) {
      return withStatus('DOWN', { ...patch, message, consecutiveFailures: failures })
    }
    // An HTTP status code is still a definite response: DEGRADED even without history.
    const reachable = previous.status === 'UP' || previous.status === 'DEGRADED' || patch.httpStatus != null
    return withStatus(reachable ? 'DEGRADED' : 'UNKNOWN', {
      ...patch,
      message: `${message} · confirming`,
      consecutiveFailures: failures,
    })
  }

  switch (probe.kind) {
    case 'monitor-offline':
      // No new information: the last known state is kept, without advancing
      // lastCheckedAt, so the client shows it as stale.
      return { ...previous, message: 'Monitor offline' }
    case 'timeout':
      return failure(`Timed out after ${Math.round(probe.latencyMs / 1000)} s`, { httpStatus: null, latencyMs: null })
    case 'network':
      return failure(probe.message, { httpStatus: null, latencyMs: null })
    case 'response': {
      const latencyMs = Math.round(probe.latencyMs)
      if (!config.expectedStatus.includes(probe.httpStatus)) {
        return failure(`HTTP ${probe.httpStatus}`, { httpStatus: probe.httpStatus, latencyMs })
      }
      const reachable = {
        httpStatus: probe.httpStatus,
        latencyMs,
        lastSuccessAt: checkedAt,
        consecutiveFailures: 0,
      }
      const bodyProblem = config.bodyRule ? checkBodyRule(config.bodyRule, probe.body) : null
      if (bodyProblem) return withStatus('DEGRADED', { ...reachable, message: bodyProblem })
      if (latencyMs > config.degradedLatencyMs) {
        return withStatus('DEGRADED', { ...reachable, message: 'Slow response' })
      }
      return withStatus('UP', { ...reachable, message: null })
    }
  }
}
