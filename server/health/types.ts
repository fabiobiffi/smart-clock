/** Optional rule on the response body (e.g. a JSON /health endpoint). */
export type BodyRule =
  | { type: 'contains'; value: string }
  | { type: 'json-equals'; path: string; expected: string | number | boolean }

/** Configuration of an HTTP check. */
export interface ServiceCheckConfig {
  id: string
  name: string
  url: string
  /** HTTP status codes considered valid (after any redirects). */
  expectedStatus: number[]
  timeoutMs: number
  /** Above this latency the service is DEGRADED. */
  degradedLatencyMs: number
  /** Consecutive failures required to declare DOWN. */
  failureThreshold: number
  bodyRule?: BodyRule
}

/** Raw outcome of a single probe, before evaluation. */
export type ProbeResult =
  | { kind: 'response'; httpStatus: number; latencyMs: number; body: string | null }
  | { kind: 'timeout'; latencyMs: number }
  | { kind: 'network'; message: string }
  /** The monitor itself has no connectivity: the service state cannot be verified. */
  | { kind: 'monitor-offline' }
