import { describe, expect, it } from 'vitest'
import { checkBodyRule, evaluateProbe, initialSnapshot } from '../../server/health/evaluate.ts'
import type { ServiceCheckConfig } from '../../server/health/types.ts'

const config: ServiceCheckConfig = {
  id: 'svc',
  name: 'svc.example',
  url: 'https://svc.example',
  expectedStatus: [200],
  timeoutMs: 10_000,
  degradedLatencyMs: 2_000,
  failureThreshold: 2,
}
const T = '2026-10-09T10:00:00.000Z'
const ok = { kind: 'response', httpStatus: 200, latencyMs: 120, body: null } as const

describe('evaluateProbe', () => {
  it('UP with expected response and normal latency', () => {
    const s = evaluateProbe(config, ok, initialSnapshot(config), T)
    expect(s).toMatchObject({ status: 'UP', httpStatus: 200, latencyMs: 120, lastSuccessAt: T, message: null, lastChangeAt: T })
  })

  it('DEGRADED if the response is slow', () => {
    const s = evaluateProbe(config, { ...ok, latencyMs: 2500 }, initialSnapshot(config), T)
    expect(s.status).toBe('DEGRADED')
    expect(s.message).toBe('Slow response')
  })

  it('a 200 is not enough if the body rule fails', () => {
    const withRule: ServiceCheckConfig = { ...config, bodyRule: { type: 'json-equals', path: 'checks.db', expected: 'ok' } }
    const s = evaluateProbe(withRule, { ...ok, body: '{"status":"ok","checks":{"db":"down"}}' }, initialSnapshot(config), T)
    expect(s.status).toBe('DEGRADED')
    expect(s.message).toContain('checks.db')
  })

  it('unexpected status code: confirming first, DOWN after the threshold', () => {
    const up = evaluateProbe(config, ok, initialSnapshot(config), T)
    const first = evaluateProbe(config, { ...ok, httpStatus: 503 }, up, T)
    expect(first.status).toBe('DEGRADED')
    expect(first.consecutiveFailures).toBe(1)
    const second = evaluateProbe(config, { ...ok, httpStatus: 503 }, first, T)
    expect(second.status).toBe('DOWN')
    expect(second.message).toBe('HTTP 503')
  })

  it('without history, a single error yields neither UP nor DOWN', () => {
    const s = evaluateProbe(config, { kind: 'network', message: 'DNS lookup failed' }, initialSnapshot(config), T)
    expect(s.status).toBe('UNKNOWN')
  })

  it('repeated timeouts lead to DOWN', () => {
    let s = initialSnapshot(config)
    s = evaluateProbe(config, { kind: 'timeout', latencyMs: 10_000 }, s, T)
    s = evaluateProbe(config, { kind: 'timeout', latencyMs: 10_000 }, s, T)
    expect(s.status).toBe('DOWN')
    expect(s.message).toBe('Timed out after 10 s')
  })

  it('monitor offline → the last known state is kept, without counting the failure or updating lastCheckedAt', () => {
    const up = evaluateProbe(config, ok, initialSnapshot(config), T)
    const s = evaluateProbe(config, { kind: 'monitor-offline' }, up, '2026-10-09T10:05:00.000Z')
    expect(s).toMatchObject({ status: 'UP', consecutiveFailures: 0, lastCheckedAt: T, latencyMs: 120 })
    expect(s.message).toBe('Monitor offline')
  })

  it('an unexpected status code on the first check is DEGRADED, not UNKNOWN', () => {
    const s = evaluateProbe(config, { ...ok, httpStatus: 502 }, initialSnapshot(config), T)
    expect(s.status).toBe('DEGRADED')
  })

  it('recovery resets the failures', () => {
    let s = evaluateProbe(config, { kind: 'timeout', latencyMs: 10_000 }, initialSnapshot(config), T)
    s = evaluateProbe(config, ok, s, T)
    expect(s).toMatchObject({ status: 'UP', consecutiveFailures: 0 })
  })
})

describe('checkBodyRule', () => {
  it('contains', () => {
    expect(checkBodyRule({ type: 'contains', value: 'ok' }, 'all ok')).toBeNull()
    expect(checkBodyRule({ type: 'contains', value: 'ok' }, 'fail')).not.toBeNull()
  })
  it('invalid JSON', () => {
    expect(checkBodyRule({ type: 'json-equals', path: 'a', expected: 1 }, '<html>')).toBe('Response is not JSON')
  })
})
