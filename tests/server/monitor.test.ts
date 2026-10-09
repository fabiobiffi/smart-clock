import { describe, expect, it, vi } from 'vitest'
import { createHealthMonitor } from '../../server/health/monitor.ts'
import type { ProbeResult, ServiceCheckConfig } from '../../server/health/types.ts'

const make = (id: string): ServiceCheckConfig => ({
  id,
  name: id,
  url: `https://${id}.example`,
  expectedStatus: [200],
  timeoutMs: 1000,
  degradedLatencyMs: 500,
  failureThreshold: 1,
})

describe('createHealthMonitor', () => {
  it('if the monitor has no network, failures become UNKNOWN, not DOWN', async () => {
    const monitor = createHealthMonitor([make('a'), make('b')], {
      intervalMs: 30_000,
      probe: async () => ({ kind: 'network', message: 'Network error' }),
      connectivity: async () => false,
    })
    await monitor.runRound()
    expect(monitor.getReport().services.map((s) => s.status)).toEqual(['UNKNOWN', 'UNKNOWN'])
  })

  it('with network available, a failure stays a failure', async () => {
    const monitor = createHealthMonitor([make('a'), make('b')], {
      intervalMs: 30_000,
      probe: async (c): Promise<ProbeResult> =>
        c.id === 'a' ? { kind: 'response', httpStatus: 200, latencyMs: 50, body: null } : { kind: 'network', message: 'x' },
      connectivity: async () => true,
    })
    await monitor.runRound()
    expect(monitor.getReport().services.map((s) => s.status)).toEqual(['UP', 'DOWN'])
  })

  it('if a service responds, connectivity is not even checked', async () => {
    const connectivity = vi.fn(async () => false)
    const monitor = createHealthMonitor([make('a'), make('b')], {
      intervalMs: 30_000,
      probe: async (c): Promise<ProbeResult> =>
        c.id === 'a' ? { kind: 'response', httpStatus: 200, latencyMs: 50, body: null } : { kind: 'timeout', latencyMs: 1000 },
      connectivity,
    })
    await monitor.runRound()
    expect(connectivity).not.toHaveBeenCalled()
    expect(monitor.getReport().services[1]?.status).toBe('DOWN')
  })

  it('does not overlap rounds', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const probe = vi.fn(async (): Promise<ProbeResult> => {
      await gate
      return { kind: 'response', httpStatus: 200, latencyMs: 10, body: null }
    })
    const monitor = createHealthMonitor([make('a')], { intervalMs: 30_000, probe })
    const first = monitor.runRound()
    const second = monitor.runRound()
    release()
    await Promise.all([first, second])
    expect(probe).toHaveBeenCalledTimes(1)
  })
})

describe('scheduling', () => {
  it('re-checks only the failed service after retryMs, then the full round after intervalMs', async () => {
    vi.useFakeTimers()
    try {
      const calls: string[] = []
      const config = (id: string): ServiceCheckConfig => ({ ...make(id), failureThreshold: 2 })
      const monitor = createHealthMonitor([config('a'), config('b')], {
        intervalMs: 300_000,
        retryMs: 30_000,
        probe: async (c): Promise<ProbeResult> => {
          calls.push(c.id)
          return c.id === 'a' ? { kind: 'response', httpStatus: 200, latencyMs: 10, body: null } : { kind: 'timeout', latencyMs: 1000 }
        },
      })
      monitor.start()
      await vi.advanceTimersByTimeAsync(0)
      expect(calls).toEqual(['a', 'b'])

      await vi.advanceTimersByTimeAsync(30_000)
      expect(calls).toEqual(['a', 'b', 'b'])
      expect(monitor.getReport().services[1]?.status).toBe('DOWN')

      // DOWN confirmed: no more retries, the next check is the full round.
      await vi.advanceTimersByTimeAsync(200_000)
      expect(calls).toHaveLength(3)
      await vi.advanceTimersByTimeAsync(70_000)
      expect(calls).toEqual(['a', 'b', 'b', 'a', 'b'])
      expect(monitor.getReport().nextCheckAt).not.toBeNull()
      monitor.stop()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('checkNow', () => {
  it('checks only the requested service', async () => {
    const calls: string[] = []
    const monitor = createHealthMonitor([make('a'), make('b')], {
      intervalMs: 300_000,
      probe: async (c): Promise<ProbeResult> => {
        calls.push(c.id)
        return { kind: 'response', httpStatus: 200, latencyMs: 10, body: null }
      },
    })
    expect(await monitor.checkNow('b')).toBe(true)
    expect(calls).toEqual(['b'])
    expect(monitor.getReport().services.map((s) => s.status)).toEqual(['UNKNOWN', 'UP'])
    expect(await monitor.checkNow('nope')).toBe(false)
  })

  it('does not duplicate a check already in flight for the same service', async () => {
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    const probe = vi.fn(async (): Promise<ProbeResult> => {
      await gate
      return { kind: 'response', httpStatus: 200, latencyMs: 10, body: null }
    })
    const monitor = createHealthMonitor([make('a')], { intervalMs: 300_000, probe })
    const round = monitor.runRound()
    const manual = monitor.checkNow('a')
    release()
    await Promise.all([round, manual])
    expect(probe).toHaveBeenCalledTimes(1)
  })

  it('ignores requests in quick succession', async () => {
    const probe = vi.fn(async (): Promise<ProbeResult> => ({ kind: 'response', httpStatus: 200, latencyMs: 10, body: null }))
    const monitor = createHealthMonitor([make('a')], { intervalMs: 300_000, probe, manualMinIntervalMs: 3_000 })
    await monitor.checkNow('a')
    await monitor.checkNow('a')
    expect(probe).toHaveBeenCalledTimes(1)
  })
})
