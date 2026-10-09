/**
 * Path of small shifts (fractions of maxOffset) that never returns to
 * the same point in consecutive steps. Deterministic: depends only on the time,
 * so no dedicated timer is needed.
 */
const PATH: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [0.6, -0.4], [1, 0.3], [0.3, 1], [-0.5, 0.6],
  [-1, -0.2], [-0.4, -1], [0.4, -0.8], [0.8, 0.8], [-0.8, 0.9],
]

export function burnInOffset(date: Date, everyMinutes: number, maxOffsetPx: number): { x: number; y: number } {
  const minutesOfDay = date.getHours() * 60 + date.getMinutes()
  const step = Math.floor(minutesOfDay / everyMinutes) % PATH.length
  const [fx, fy] = PATH[step] ?? [0, 0]
  return { x: Math.round(fx * maxOffsetPx), y: Math.round(fy * maxOffsetPx) }
}

/** true if the hour falls within the night window [startHour, endHour), even when it spans midnight. */
export function isNightHour(hour: number, startHour: number, endHour: number): boolean {
  return startHour > endHour ? hour >= startHour || hour < endHour : hour >= startHour && hour < endHour
}
