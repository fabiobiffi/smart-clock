/** "#rrggbb" → "rgba(r, g, b, alpha)". */
export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Luminanza relativa (0–1) secondo WCAG. */
export function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(value.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Darkens a color by mixing it with black: factor 1 = full color, 0 = black. */
export function mixWithBlack(hex: string, factor: number): string {
  const value = hex.replace('#', '')
  const channel = (i: number): string =>
    Math.round(parseInt(value.slice(i, i + 2), 16) * factor)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(0)}${channel(2)}${channel(4)}`
}

/**
 * Solid card background derived from the brand color: the hue stays
 * recognizable but the luminance is brought down to a low level, the same for
 * all brands (yellow and white included), so white text always has
 * high contrast and the AMOLED panel stays mostly unlit.
 */
export function cardBackground(hex: string, maxLuminance = 0.05): string {
  let factor = 0.6
  while (factor > 0.05 && relativeLuminance(mixWithBlack(hex, factor)) > maxLuminance) factor -= 0.02
  return mixWithBlack(hex, factor)
}

/** WCAG contrast ratio between two colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}
