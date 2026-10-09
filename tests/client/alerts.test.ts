import { describe, expect, it } from 'vitest'
import { detectTransitions } from '../../src/lib/alerts.ts'
import type { ServiceView } from '../../src/types.ts'
import type { ServiceStatus } from '../../shared/types.ts'

const svc = (id: string, status: ServiceStatus, stale = false): ServiceView => ({
  id,
  name: `${id}.example`,
  status,
  stale,
  httpStatus: null,
  latencyMs: null,
  lastCheckedAt: null,
  lastSuccessAt: null,
  lastChangeAt: null,
  message: null,
  consecutiveFailures: status === 'DOWN' ? 2 : 0,
})

describe('detectTransitions', () => {
  it('alerts when a service goes DOWN, only once', () => {
    const first = detectTransitions(new Set(), [svc('a', 'UP'), svc('b', 'DOWN')])
    expect(first.transitions.map((t) => [t.kind, t.service.id])).toEqual([['down', 'b']])
    const second = detectTransitions(first.down, [svc('a', 'UP'), svc('b', 'DOWN')])
    expect(second.transitions).toEqual([])
  })

  it('reports the return online', () => {
    const r = detectTransitions(new Set(['b']), [svc('b', 'UP')])
    expect(r.transitions.map((t) => t.kind)).toEqual(['recovered'])
    expect(r.down.size).toBe(0)
  })

  it('DEGRADED while verifying does not generate alerts', () => {
    expect(detectTransitions(new Set(), [svc('a', 'DEGRADED')]).transitions).toEqual([])
  })

  it('stale data generates neither alerts nor false recoveries', () => {
    expect(detectTransitions(new Set(), [svc('a', 'DOWN', true)]).transitions).toEqual([])
    const r = detectTransitions(new Set(['a']), [svc('a', 'UNKNOWN', true)])
    expect(r.transitions).toEqual([])
    expect(r.down.has('a')).toBe(true)
  })
})
