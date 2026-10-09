import type { ServiceView } from '../types.ts'

export interface AlertTransition {
  kind: 'down' | 'recovered'
  service: ServiceView
}

/**
 * Compares the set of DOWN services with the new state and returns the
 * transitions to notify. Services with stale data do not change state:
 * an unreachable monitor must generate neither alerts nor false recoveries.
 */
export function detectTransitions(
  previouslyDown: ReadonlySet<string>,
  services: readonly ServiceView[],
): { down: Set<string>; transitions: AlertTransition[] } {
  const down = new Set(previouslyDown)
  const transitions: AlertTransition[] = []
  for (const service of services) {
    if (service.stale) continue
    const isDown = service.status === 'DOWN'
    const wasDown = previouslyDown.has(service.id)
    if (isDown && !wasDown) {
      down.add(service.id)
      transitions.push({ kind: 'down', service })
    } else if (!isDown && wasDown) {
      down.delete(service.id)
      transitions.push({ kind: 'recovered', service })
    }
  }
  // Services removed from the configuration: they do not stay "down" forever.
  const known = new Set(services.map((s) => s.id))
  for (const id of down) if (!known.has(id)) down.delete(id)
  return { down, transitions }
}
