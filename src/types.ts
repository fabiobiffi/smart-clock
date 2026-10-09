import type { ServiceSnapshot } from '../shared/types.ts'

export type DashboardId = 'clock' | 'services' | 'markets'

export interface DashboardDefinition {
  id: DashboardId
  label: string
}

/** Local preferences persisted in localStorage. */
export interface LocalPreferences {
  lastDashboard: DashboardId
}

/** Source of a client-side refresh error. */
export type FetchProblem = 'offline' | 'unreachable' | null

/** Snapshot enriched with client-computed information. */
export interface ServiceView extends ServiceSnapshot {
  stale: boolean
}
