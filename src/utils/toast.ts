import { shallowReactive } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  title: string
  description?: string
  duration: number
}

/**
 * 极简全局提示队列。
 * 放在 utils 而不是 store，是为了让请求层（非组件上下文）也能直接调用。
 * 渲染由 components/feedback/ToastHost.vue 负责。
 */
export const toasts = shallowReactive<ToastItem[]>([])

let seed = 0
const timers = new Map<number, number>()

export function dismissToast(id: number): void {
  const index = toasts.findIndex((t) => t.id === id)
  if (index > -1) toasts.splice(index, 1)
  const timer = timers.get(id)
  if (timer) {
    window.clearTimeout(timer)
    timers.delete(id)
  }
}

function push(type: ToastType, title: string, description?: string, duration = 3200): number {
  const id = ++seed
  toasts.push({ id, type, title, description, duration })
  // 最多保留 4 条，避免堆叠遮挡内容
  while (toasts.length > 4) dismissToast(toasts[0]!.id)
  if (duration > 0) {
    timers.set(
      id,
      window.setTimeout(() => dismissToast(id), duration),
    )
  }
  return id
}

export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error: (title: string, description?: string) => push('error', title, description, 4200),
  warning: (title: string, description?: string) => push('warning', title, description),
  info: (title: string, description?: string) => push('info', title, description),
}
