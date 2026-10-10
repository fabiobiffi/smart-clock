<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DRAG_SLOP_PX, clampPage, isHorizontalIntent, resolveSwipe } from '../lib/swipe.ts'
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

function begin(id: number, x: number, y: number, target: EventTarget | null): void {
  suppressClick = false
  // Inner elements can opt out of swipe handling.
  if ((target as Element | null)?.closest?.('[data-no-swipe]')) return
  gesture = { id, x, y, t: performance.now(), dx: 0 }
}

/** Returns true while the gesture is a horizontal page drag. */
function move(id: number, x: number, y: number): boolean {
  if (!gesture || id !== gesture.id) return false
  const dx = x - gesture.x
  const dy = y - gesture.y
  if (!dragging.value) {
    if (!isHorizontalIntent(dx, dy)) {
      // Clearly vertical: leave the gesture to the native scroll (e.g. news list).
      if (Math.hypot(dx, dy) > DRAG_SLOP_PX) gesture = null
      return false
    }
    dragging.value = true
  }
  gesture.dx = dx
  applyDrag(dx)
  return true
}

function finish(id: number, x: number, y: number, cancelled: boolean): void {
  if (!gesture || id !== gesture.id) return
  const wasDragging = dragging.value
  if (wasDragging && !cancelled) {
    const direction = resolveSwipe({
      dx: x - gesture.x,
      dy: y - gesture.y,
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

/*
 * Mouse/pen use pointer events. Touch uses touch events instead: inside a native
 * scroller (news list) the browser fires pointercancel as soon as it claims the
 * gesture, killing the swipe; touchmove keeps flowing and, being non-passive,
 * lets us block the native scroll once the gesture is clearly horizontal.
 */
function onPointerDown(event: PointerEvent): void {
  if (event.pointerType === 'touch' || !event.isPrimary || event.button !== 0) return
  begin(event.pointerId, event.clientX, event.clientY, event.target)
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType === 'touch') return
  const wasDragging = dragging.value
  if (move(event.pointerId, event.clientX, event.clientY) && !wasDragging) {
    try {
      root.value?.setPointerCapture(event.pointerId)
    } catch {
      /* pointer no longer active: continue without capture */
    }
  }
}

function onPointerEnd(event: PointerEvent, cancelled: boolean): void {
  if (event.pointerType === 'touch') return
  finish(event.pointerId, event.clientX, event.clientY, cancelled)
}

function onTouchStart(event: TouchEvent): void {
  // Multi-touch is never a page swipe.
  if (event.touches.length > 1) {
    if (gesture) finish(gesture.id, gesture.x, gesture.y, true)
    return
  }
  const touch = event.changedTouches[0]
  if (touch) begin(touch.identifier, touch.clientX, touch.clientY, event.target)
}

function onTouchMove(event: TouchEvent): void {
  if (!gesture) return
  const touch = Array.from(event.changedTouches).find((t) => t.identifier === gesture?.id)
  if (touch && move(touch.identifier, touch.clientX, touch.clientY) && event.cancelable) event.preventDefault()
}

function onTouchEnd(event: TouchEvent, cancelled: boolean): void {
  if (!gesture) return
  const touch = Array.from(event.changedTouches).find((t) => t.identifier === gesture?.id)
  if (touch) finish(touch.identifier, touch.clientX, touch.clientY, cancelled)
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
    @pointerup="onPointerEnd($event, false)"
    @pointercancel="onPointerEnd($event, true)"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd($event, false)"
    @touchcancel="onTouchEnd($event, true)"
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
