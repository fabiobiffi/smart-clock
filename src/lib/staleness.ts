/** true if the timestamp is missing or older than maxAgeMs relative to now. */
export function isOlderThan(iso: string | null, now: Date, maxAgeMs: number): boolean {
  if (!iso) return true
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return true
  return now.getTime() - time > maxAgeMs
}
