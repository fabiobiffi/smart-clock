/**
 * Minimal local persistence on localStorage. Errors (quota, private
 * mode) are ignored: persistence is an enhancement, not a requirement.
 */
const PREFIX = 'clock-dashboard:'

export function loadJson<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* ignorato */
  }
}
