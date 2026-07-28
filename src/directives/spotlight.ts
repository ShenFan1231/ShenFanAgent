import type { Directive } from 'vue'

import { prefersReducedMotion } from '@/composables/useReducedMotion'

interface SpotlightEl extends HTMLElement {
  __spotlightCleanup?: () => void
}

/**
 * 光标跟随高光 + 轻微 3D 倾斜。
 *
 * - 指针位置写进 CSS 变量（--mx/--my），渐变由 CSS 负责，JS 不碰样式计算
 * - 每帧最多更新一次，rAF 合并高频 pointermove
 * - `v-spotlight.tilt` 才启用倾斜；纯高光的开销几乎为零
 */
export const vSpotlight: Directive<SpotlightEl> = {
  mounted(el, binding) {
    el.classList.add('spotlight')
    if (prefersReducedMotion()) return

    const tilt = Boolean(binding.modifiers.tilt)
    const strength = Number(binding.value ?? 6)
    let frame = 0
    let nextX = 0
    let nextY = 0

    const apply = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const px = (nextX - rect.left) / rect.width
      const py = (nextY - rect.top) / rect.height
      el.style.setProperty('--mx', `${px * 100}%`)
      el.style.setProperty('--my', `${py * 100}%`)
      if (tilt) {
        const rx = (0.5 - py) * strength
        const ry = (px - 0.5) * strength
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`
      }
    }

    const onMove = (event: PointerEvent) => {
      nextX = event.clientX
      nextY = event.clientY
      if (!frame) frame = requestAnimationFrame(apply)
    }

    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      el.style.removeProperty('--mx')
      el.style.removeProperty('--my')
      if (tilt) el.style.transform = ''
    }

    if (tilt) el.style.transition = 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)'
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)

    el.__spotlightCleanup = () => {
      if (frame) cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  },

  unmounted(el) {
    el.__spotlightCleanup?.()
    delete el.__spotlightCleanup
  },
}
