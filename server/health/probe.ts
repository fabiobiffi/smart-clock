import type { ProbeResult, ServiceCheckConfig } from './types.ts'

const MAX_BODY_CHARS = 64 * 1024
const USER_AGENT = 'clock-dashboard-monitor/1.0'

const NETWORK_MESSAGES: Record<string, string> = {
  ENOTFOUND: 'DNS lookup failed',
  EAI_AGAIN: 'DNS unavailable',
  ECONNREFUSED: 'Connection refused',
  ECONNRESET: 'Connection reset',
  EHOSTUNREACH: 'Host unreachable',
  ENETUNREACH: 'Network unreachable',
  CERT_HAS_EXPIRED: 'TLS certificate expired',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'Invalid TLS certificate',
  ERR_TLS_CERT_ALTNAME_INVALID: 'Invalid TLS certificate',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'Invalid TLS certificate',
}

function describeNetworkError(error: unknown): string {
  const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined
  const code = typeof cause?.code === 'string' ? cause.code : undefined
  return (code && NETWORK_MESSAGES[code]) ?? 'Network error'
}

/** Performs an HTTP GET request with a timeout. TLS verification stays enabled. */
export async function httpProbe(config: ServiceCheckConfig): Promise<ProbeResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.timeoutMs)
  const started = performance.now()
  try {
    const response = await fetch(config.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: '*/*' },
      cache: 'no-store',
    })
    const latencyMs = performance.now() - started
    let body: string | null = null
    if (config.bodyRule) {
      body = (await response.text()).slice(0, MAX_BODY_CHARS)
    } else {
      await response.body?.cancel()
    }
    return { kind: 'response', httpStatus: response.status, latencyMs, body }
  } catch (error) {
    if (controller.signal.aborted) {
      return { kind: 'timeout', latencyMs: performance.now() - started }
    }
    return { kind: 'network', message: describeNetworkError(error) }
  } finally {
    clearTimeout(timer)
  }
}

/** true if the monitor has Internet access (any HTTP response will do). */
export async function hasConnectivity(url: string, timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal, cache: 'no-store' })
    await response.body?.cancel()
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
