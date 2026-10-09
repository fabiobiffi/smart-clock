<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { clampPage, isHorizontalIntent, resolveSwipe } from '../lib/swipe.ts'
import type { DashboardDefinition } from '../types.ts'
import PageIndicator from './PageIndicator.vue'

/**
 * Horizontal pager with side-by-side pages. All dashboards stay mounted:
 * swiping only moves the track via transform (no widget re-renders).
 * Bounded, non-cyclic navigation: past the first/last page the
 * drag resists and snaps back.
 */
const props = defineProps<{ dashboards: readonly DashboardDefinition[] }>()
const index = defineModel<number>({ required: true })

const root = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const dragging = ref(false)
const count = computed(() => props.dashboards.length)

let gesture: { id: number; x: number; y: number; t: number; dx: number } | null = null
let frame = 0
/** After a swipe the synthetic click must not activate inner elements (e.g. cards). */
let suppressClick = false

const baseTransform = (dragPx = 0): string =>
  `translate3d(calc(${(-index.value * 100) / count.value}% + ${dragPx}px), 0, 0)`

const trackStyle = computed(() => ({
  width: `${count.value * 100}%`,
  transform: baseTransform(),
}))

function applyDrag(dx: number): void {
  const atEdge = (dx > 0 && index.value === 0) || (dx < 0 && index.value === count.value - 1)
  const offset = atEdge ? dx * 0.25 : dx
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(() => {
    if (track.value) track.value.style.transform = baseTransform(offset)
  })
}

function onPointerDown(event: PointerEvent): void {
  if (!event.isPrimary || event.button !== 0) return
  suppressClick = false
  // Inner elements can opt out of swipe handling.
  if ((event.target as Element | null)?.closest('[data-no-swipe]')) return
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now(), dx: 0 }
}

function onPointerMove(event: PointerEvent): void {
  if (!gesture || event.pointerId !== gesture.id) return
  const dx = event.clientX - gesture.x
  const dy = event.clientY - gesture.y
  if (!dragging.value) {
    if (!isHorizontalIntent(dx, dy)) return
    dragging.value = true
    try {
      root.value?.setPointerCapture(event.pointerId)
    } catch {
      /* pointer no longer active: continue without capture */
    }
  }
  gesture.dx = dx
  applyDrag(dx)
}

function finish(event: PointerEvent, cancelled: boolean): void {
  if (!gesture || event.pointerId !== gesture.id) return
  const wasDragging = dragging.value
  if (wasDragging && !cancelled) {
    const direction = resolveSwipe({
      dx: event.clientX - gesture.x,
      dy: event.clientY - gesture.y,
      durationMs: performance.now() - gesture.t,
      width: root.value?.clientWidth ?? window.innerWidth,
    })
    index.value = clampPage(index.value + direction, count.value)
  }
  gesture = null
  if (wasDragging) suppressClick = true
  dragging.value = false
  cancelAnimationFrame(frame)
  // Return to the position managed by Vue (with transition).
  if (wasDragging && track.value) track.value.style.transform = baseTransform()
}

function onClickCapture(event: MouseEvent): void {
  if (!suppressClick) return
  suppressClick = false
  event.stopPropagation()
  event.preventDefault()
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'ArrowRight') index.value = clampPage(index.value + 1, count.value)
  if (event.key === 'ArrowLeft') index.value = clampPage(index.value - 1, count.value)
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  cancelAnimationFrame(frame)
})
</script>

<template>
  <main
    ref="root"
    class="pager"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="finish($event, false)"
    @pointercancel="finish($event, true)"
    @click.capture="onClickCapture"
  >
    <div ref="track" class="pager__track" :class="{ 'is-dragging': dragging }" :style="trackStyle">
      <section
        v-for="(dashboard, i) in dashboards"
        :key="dashboard.id"
        class="pager__page"
        :aria-label="dashboard.label"
        :aria-hidden="i !== index"
        :inert="i !== index || undefined"
      >
        <slot :name="dashboard.id" />
      </section>
    </div>
    <PageIndicator :count="count" :index="index" :labels="dashboards.map((d) => d.label)" />
  </main>
</template>

<style scoped>
.pager {
  position: relative;
  width: 100%;
  height: var(--app-h);
  overflow: hidden;
  /*
   * Horizontal gestures are handled in JS (swipe); vertical pan is left to the browser
   * for inner scrollable lists (e.g. news). touch-action intersects
   * with that of ancestors, so it cannot be "none" here.
   */
  touch-action: pan-y;
}

.pager__track {
  display: flex;
  height: 100%;
  transition: transform var(--page-transition);
  will-change: transform;
}

.pager__track.is-dragging {
  transition: none;
}

.pager__page {
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}
</style>
