import type { Directive } from 'vue'

import { prefersReducedMotion } from '@/composables/useReducedMotion'

interface RippleEl extends HTMLElement {
  __rippleCleanup?: () => void
}

/** 点击涟漪：给操作一个明确的落点反馈，动画结束即移除节点 */
export const vRipple: Directive<RippleEl> = {
  mounted(el) {
    if (prefersReducedMotion()) return
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
    el.style.overflow = 'hidden'

    const onPointerDown = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2
      const ripple = document.createElement('span')
      ripple.className = 'ripple-wave'
      ripple.style.width = ripple.style.height = `${size}px`
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`
      el.appendChild(ripple)
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.__rippleCleanup = () => el.removeEventListener('pointerdown', onPointerDown)
  },

  unmounted(el) {
    el.__rippleCleanup?.()
    delete el.__rippleCleanup
  },
}
