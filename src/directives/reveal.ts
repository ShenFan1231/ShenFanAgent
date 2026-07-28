import type { Directive } from 'vue'

import { prefersReducedMotion } from '@/composables/useReducedMotion'

interface RevealEl extends HTMLElement {
  __revealObserver?: IntersectionObserver
}

/**
 * 滚动进入视口时揭示元素。
 * 单个 IntersectionObserver 触发一次即断开，长页面滚动没有额外监听成本。
 * `v-reveal="120"` 可指定延迟毫秒数。
 */
export const vReveal: Directive<RevealEl, number | undefined> = {
  mounted(el, binding) {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      el.classList.add('is-revealed')
      return
    }

    el.classList.add('reveal-init')
    if (binding.value) el.style.transitionDelay = `${binding.value}ms`

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          el.classList.add('is-revealed')
          observer.disconnect()
          delete el.__revealObserver
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(el)
    el.__revealObserver = observer
  },

  unmounted(el) {
    el.__revealObserver?.disconnect()
    delete el.__revealObserver
  },
}
