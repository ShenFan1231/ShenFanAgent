import { onScopeDispose, ref } from 'vue'

/**
 * 全局共享的一个时钟。
 * 多个组件同时显示时间也只跑一个 interval，页面隐藏时自动暂停。
 */
const now = ref(new Date())
let timer = 0
let refCount = 0

function tick(): void {
  now.value = new Date()
}

function start(): void {
  if (timer) return
  timer = window.setInterval(tick, 1000)
}

function stop(): void {
  if (!timer) return
  window.clearInterval(timer)
  timer = 0
}

function onVisibilityChange(): void {
  if (document.hidden) {
    stop()
  } else if (refCount > 0) {
    tick()
    start()
  }
}

export function useNow() {
  refCount += 1
  if (refCount === 1) {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  tick()
  start()

  onScopeDispose(() => {
    refCount -= 1
    if (refCount <= 0) {
      refCount = 0
      stop()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })

  return now
}
