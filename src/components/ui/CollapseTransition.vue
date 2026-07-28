<script setup lang="ts">
/**
 * 高度自适应的折叠过渡。
 *
 * CSS 无法对 auto 高度做动画，因此用 JS 钩子在进入 / 离开时把 scrollHeight
 * 写成显式像素值。`:css="false"` 模式下必须自己调用 done，否则离开的节点
 * 永远不会被移除 —— 这里用与过渡等长的定时器收尾，并在提前打断时清理。
 */
const props = withDefaults(defineProps<{ duration?: number }>(), { duration: 280 })

const timers = new WeakMap<HTMLElement, number>()

function applyTransition(node: HTMLElement): void {
  node.style.transition = `height ${props.duration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${props.duration}ms ease`
  node.style.overflow = 'hidden'
}

function schedule(node: HTMLElement, done: () => void): void {
  const previous = timers.get(node)
  if (previous) window.clearTimeout(previous)
  timers.set(
    node,
    window.setTimeout(() => {
      timers.delete(node)
      done()
    }, props.duration),
  )
}

function reset(node: HTMLElement): void {
  const timer = timers.get(node)
  if (timer) {
    window.clearTimeout(timer)
    timers.delete(node)
  }
  node.style.transition = ''
  node.style.overflow = ''
  node.style.height = ''
  node.style.opacity = ''
}

function onEnter(el: Element, done: () => void): void {
  const node = el as HTMLElement
  applyTransition(node)
  node.style.height = '0'
  node.style.opacity = '0'
  const target = node.scrollHeight
  requestAnimationFrame(() => {
    node.style.height = `${target}px`
    node.style.opacity = '1'
  })
  schedule(node, done)
}

function onLeave(el: Element, done: () => void): void {
  const node = el as HTMLElement
  applyTransition(node)
  node.style.height = `${node.scrollHeight}px`
  node.style.opacity = '1'
  requestAnimationFrame(() => {
    node.style.height = '0'
    node.style.opacity = '0'
  })
  schedule(node, done)
}
</script>

<template>
  <Transition
    :css="false"
    @enter="onEnter"
    @after-enter="reset($event as HTMLElement)"
    @enter-cancelled="reset($event as HTMLElement)"
    @leave="onLeave"
    @after-leave="reset($event as HTMLElement)"
    @leave-cancelled="reset($event as HTMLElement)"
  >
    <slot />
  </Transition>
</template>
