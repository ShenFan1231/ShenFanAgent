import gsap from 'gsap'
import { onMounted, onUnmounted, type Ref } from 'vue'

import { prefersReducedMotion } from './useReducedMotion'

export interface EnterMotionOptions {
  /** 选择器，默认取容器内所有 [data-motion] 元素 */
  selector?: string
  y?: number
  scale?: number
  duration?: number
  stagger?: number
  delay?: number
}

/**
 * 页面分层入场动画。
 *
 * 用 gsap.context 把所有补间绑定到容器上，卸载时 revert() 一次性回收 —— 这是
 * 避免"路由切走了动画还在跑"这类内存泄漏最稳的方式。
 * 只动 transform / opacity，动画结束后 clearProps 把内联样式清掉，
 * 不影响后续 hover 等交互的 transform。
 */
export function useEnterMotion(scope: Ref<HTMLElement | null>, options: EnterMotionOptions = {}) {
  const {
    selector = '[data-motion]',
    y = 26,
    scale = 0.985,
    duration = 0.78,
    stagger = 0.055,
    delay = 0.04,
  } = options

  let ctx: gsap.Context | null = null

  function play(): void {
    if (!scope.value) return
    ctx?.revert()
    if (prefersReducedMotion()) return

    ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(selector)
      if (!targets.length) return
      gsap.from(targets, {
        opacity: 0,
        y,
        scale,
        duration,
        delay,
        ease: 'expo.out',
        stagger: { each: stagger, from: 'start' },
        clearProps: 'transform,opacity',
      })
    }, scope.value)
  }

  onMounted(play)
  onUnmounted(() => {
    ctx?.revert()
    ctx = null
  })

  return { play }
}
