import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'

export interface PollingOptions {
  /** 轮询间隔（ms） */
  interval?: number
  /** 挂载后立即执行一次 */
  immediate?: boolean
}

/**
 * 定时轮询。
 *
 * 三种情况会自动暂停，避免"看不见的页面还在打接口"：
 * - 浏览器标签被切到后台（visibilitychange）
 * - 组件被 KeepAlive 缓存（onDeactivated）
 * - 组件卸载（onBeforeUnmount）
 */
export function usePolling(task: () => void | Promise<void>, options: PollingOptions = {}) {
  const { interval = 5000, immediate = false } = options

  const active = ref(false)
  let timer = 0

  function stop(): void {
    if (timer) window.clearInterval(timer)
    timer = 0
    active.value = false
  }

  function start(): void {
    if (timer || document.hidden) return
    active.value = true
    timer = window.setInterval(() => void task(), interval)
  }

  function onVisibility(): void {
    if (document.hidden) stop()
    else start()
  }

  onMounted(() => {
    if (immediate) void task()
    start()
    document.addEventListener('visibilitychange', onVisibility)
  })

  onActivated(start)
  onDeactivated(stop)

  onBeforeUnmount(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return { active, start, stop }
}
