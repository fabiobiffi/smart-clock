export interface SwipeSample {
  dx: number
  dy: number
  durationMs: number
  /** Container width, in px. */
  width: number
}

/** Minimum movement (px) before a gesture is considered a drag. */
export const DRAG_SLOP_PX = 12

/** The gesture is horizontal if it clearly dominates the vertical movement. */
export function isHorizontalIntent(dx: number, dy: number): boolean {
  return Math.abs(dx) > DRAG_SLOP_PX && Math.abs(dx) > Math.abs(dy) * 1.2
}

/**
 * Decides the page change on release.
 * Returns +1 (next page, swipe left), -1 (previous) or 0.
 * A tap or a small slow drag never changes the page.
 */
export function resolveSwipe({ dx, dy, durationMs, width }: SwipeSample): -1 | 0 | 1 {
  if (!isHorizontalIntent(dx, dy)) return 0
  const distance = Math.abs(dx)
  const velocity = distance / Math.max(durationMs, 1)
  const farEnough = distance > width * 0.2
  const flick = distance > 40 && velocity > 0.45
  if (!farEnough && !flick) return 0
  return dx < 0 ? 1 : -1
}

/** Bounded navigation (non-cyclic): stays within [0, count-1]. */
export function clampPage(index: number, count: number): number {
  return Math.min(Math.max(index, 0), count - 1)
}
