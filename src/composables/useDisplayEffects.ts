import { computed, watchEffect, type Ref } from 'vue'
import { APP_CONFIG } from '../config/app.ts'
import { burnInOffset, isNightHour } from '../lib/burnIn.ts'

/**
 * Display effects derived from the current time, with no timers of their own:
 * - visual night mode (data-night on <html>, reduced contrast);
 * - anti burn-in shift of a few pixels (CSS variables --shift-x/--shift-y).
 */
export function useDisplayEffects(now: Readonly<Ref<Date>>): { isNight: Readonly<Ref<boolean>> } {
  const root = document.documentElement
  const isNight = computed(() =>
    isNightHour(now.value.getHours(), APP_CONFIG.night.startHour, APP_CONFIG.night.endHour),
  )
  const offset = computed(() =>
    burnInOffset(now.value, APP_CONFIG.burnIn.everyMinutes, APP_CONFIG.burnIn.maxOffsetPx),
  )

  watchEffect(() => {
    root.dataset.night = String(isNight.value)
  })
  watchEffect(() => {
    root.style.setProperty('--shift-x', `${offset.value.x}px`)
    root.style.setProperty('--shift-y', `${offset.value.y}px`)
  })

  return { isNight }
}
