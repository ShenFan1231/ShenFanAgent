import { onScopeDispose, ref, watch, type Ref } from 'vue'

import { prefersReducedMotion } from './useReducedMotion'

export interface CountUpOptions {
  duration?: number
  /** 小数位 */
  precision?: number
  delay?: number
  /** 起始值，默认 0；后续变化时从上一个值滚动 */
  from?: number
}

/** easeOutExpo：开头快、结尾稳，数字滚动看起来最"贵" */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t)
}

/**
 * requestAnimationFrame 数字滚动。
 * - 目标值变化时从当前显示值继续滚动，不会跳回 0
 * - 组件卸载 / scope 销毁时取消 rAF，避免泄漏
 * - prefers-reduced-motion 下直接落到终值
 */
export function useCountUp(target: Ref<number>, options: CountUpOptions = {}) {
  const { duration = 1400, precision = 0, delay = 0, from = 0 } = options

  const displayed = ref(from)
  let frame = 0
  let timer = 0

  function stop(): void {
    if (frame) cancelAnimationFrame(frame)
    if (timer) window.clearTimeout(timer)
    frame = 0
    timer = 0
  }

  function run(to: number): void {
    stop()
    if (prefersReducedMotion() || duration <= 0) {
      displayed.value = to
      return
    }

    const start = displayed.value
    const diff = to - start
    if (Math.abs(diff) < 10 ** -precision) {
      displayed.value = to
      return
    }

    const begin = performance.now() + delay
    const tick = (now: number) => {
      if (now < begin) {
        frame = requestAnimationFrame(tick)
        return
      }
      const progress = Math.min((now - begin) / duration, 1)
      displayed.value = start + diff * easeOutExpo(progress)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else displayed.value = to
    }
    frame = requestAnimationFrame(tick)
  }

  watch(target, (value) => run(value), { immediate: true })
  onScopeDispose(stop)

  return { displayed, stop, replay: () => run(target.value) }
}
