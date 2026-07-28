import { onScopeDispose, ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * 响应式的"减少动效"偏好。
 * 所有 JS 驱动的动画都先问一句它，命中时直接跳到终态而不是播动画。
 */
export function useReducedMotion() {
  const prefersReduced = ref(false)

  if (typeof window !== 'undefined' && window.matchMedia) {
    const media = window.matchMedia(QUERY)
    prefersReduced.value = media.matches
    const onChange = (event: MediaQueryListEvent) => (prefersReduced.value = event.matches)
    media.addEventListener('change', onChange)
    onScopeDispose(() => media.removeEventListener('change', onChange))
  }

  return prefersReduced
}

/** 非组件上下文里的一次性判断 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(QUERY).matches
    : false
}
