export interface SparklineGeometry {
  /** `points` attribute of a <polyline>. */
  points: string
  /** y coordinate of the reference line (previous close). */
  baselineY: number
}

/**
 * Coordinates of the intraday mini chart. The scale includes the previous
 * close, so the reference line is always visible and the position
 * of the curve relative to it immediately shows a rise or a fall.
 */
export function sparkline(values: readonly number[], baseline: number, width: number, height: number, padding = 1): SparklineGeometry | null {
  if (values.length < 2) return null
  const min = Math.min(baseline, ...values)
  const max = Math.max(baseline, ...values)
  const range = max - min || 1
  const y = (v: number): number => padding + (1 - (v - min) / range) * (height - padding * 2)
  const step = (width - padding * 2) / (values.length - 1)
  const points = values.map((v, i) => `${(padding + i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return { points, baselineY: Number(y(baseline).toFixed(1)) }
}
