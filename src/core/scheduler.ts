/**
 * Centralized scheduler for all periodic network updates.
 *
 * - A task is never run twice in parallel.
 * - The next run is scheduled only when the previous one finishes.
 * - When the page returns to the foreground or the network is restored, overdue tasks
 *   are run immediately instead of waiting for the timer (which in the background
 *   may be throttled or suspended by the browser).
 */
interface Task {
  intervalMs: number
  run: () => Promise<void>
  timer: number | null
  running: boolean
  active: boolean
  cancel: () => void
  lastRunAt: number
}

const tasks = new Map<string, Task>()
let listening = false

async function execute(task: Task): Promise<void> {
  if (task.running) return
  if (task.timer !== null) window.clearTimeout(task.timer)
  task.timer = null
  task.running = true
  try {
    await task.run()
  } catch (error) {
    console.warn('[scheduler] task failed', error)
  } finally {
    task.running = false
    task.lastRunAt = Date.now()
    if (task.active) task.timer = window.setTimeout(() => void execute(task), task.intervalMs)
  }
}

function runOverdue(force: boolean): void {
  const now = Date.now()
  for (const task of tasks.values()) {
    if (force || now - task.lastRunAt >= task.intervalMs) void execute(task)
  }
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') runOverdue(false)
}

function onOnline(): void {
  runOverdue(true)
}

function ensureListeners(): void {
  if (listening) return
  listening = true
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('online', onOnline)
}

/** Registers a periodic task and runs it immediately. Returns the removal function. */
export function schedule(id: string, intervalMs: number, run: () => Promise<void>): () => void {
  ensureListeners()
  tasks.get(id)?.cancel()
  const task: Task = {
    intervalMs,
    run,
    timer: null,
    running: false,
    active: true,
    lastRunAt: 0,
    cancel() {
      task.active = false
      if (task.timer !== null) window.clearTimeout(task.timer)
      task.timer = null
      if (tasks.get(id) === task) tasks.delete(id)
    },
  }
  tasks.set(id, task)
  void execute(task)
  return task.cancel
}
