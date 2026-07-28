<script setup lang="ts">
/**
 * 主内容区：路由过渡 + KeepAlive + 每个标签独立的滚动位置。
 *
 * KeepAlive 的关键点在于"缓存身份"：
 * `<KeepAlive :include>` 匹配的是组件 name，而路由组件的 name 与标签是一对多的
 * （同一个页面可以带不同参数开多个标签），直接用组件 name 会出现"关掉一个标签
 * 把同名的全部缓存都清掉"的问题。
 *
 * 这里的做法是给每个标签动态生成一层壳组件，name 就是标签的缓存 key
 * （`fullPath::version`）：
 * - 关闭标签  → cachedKeys 收缩 → 精确销毁那一个实例
 * - 刷新标签  → version 自增 → 缓存 key 变化 → 旧实例被丢弃、组件重新挂载
 * - 壳组件本身按 key 缓存在 Map 里，标签关闭时一并清理，不会无限增长
 */
import { computed, defineComponent, h, markRaw, ref, watch, type Component, type VNode } from 'vue'
import { useRoute } from 'vue-router'

import { useAppStore } from '@/stores/app'
import { cacheKeyOf, useTabsStore } from '@/stores/tabs'

const route = useRoute()
const appStore = useAppStore()
const tabsStore = useTabsStore()

const scrollerRef = ref<HTMLElement | null>(null)
const wrappers = new Map<string, Component>()
const scrollPositions = new Map<string, number>()

const currentTab = computed(() => tabsStore.tabs.find((tab) => tab.key === route.fullPath))
const cacheKey = computed(() =>
  currentTab.value?.keepAlive ? cacheKeyOf(currentTab.value) : '',
)

const transitionName = computed(() =>
  appStore.routeTransition === 'none' ? 'none' : appStore.routeTransition,
)

/**
 * 需要缓存时返回壳组件，否则原样返回 RouterView 给出的 vnode。
 * 壳组件渲染的是 vnode.type（异步路由组件本身，引用稳定），
 * 而不是 clone vnode —— 后者会把 el / component 一起复制，容易踩到重复 patch。
 */
function resolveView(vnode: VNode): Component | VNode {
  const key = cacheKey.value
  if (!key) return vnode

  let wrapper = wrappers.get(key)
  if (!wrapper) {
    const type = vnode.type as Component
    // name 决定它是否被 include 命中，因此必须等于缓存 key
    wrapper = markRaw(defineComponent({ name: key, render: () => h(type) }))
    wrappers.set(key, wrapper)
  }
  return wrapper
}

// 标签关闭后回收壳组件，避免 Map 随会话无限膨胀
watch(
  () => tabsStore.cachedKeys,
  (keys) => {
    const alive = new Set(keys)
    wrappers.forEach((_value, key) => {
      if (!alive.has(key)) wrappers.delete(key)
    })
  },
  { deep: false },
)

// 切走之前记下滚动位置（此时 DOM 还是旧页面）
watch(
  () => route.fullPath,
  (_to, from) => {
    if (from && scrollerRef.value) scrollPositions.set(from, scrollerRef.value.scrollTop)
  },
  { flush: 'pre' },
)

function restoreScroll(): void {
  const scroller = scrollerRef.value
  if (!scroller) return
  scroller.scrollTop = scrollPositions.get(route.fullPath) ?? 0
}
</script>

<template>
  <main
    ref="scrollerRef"
    class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
    :class="appStore.compact ? 'px-3 py-3 sm:px-4 sm:py-4' : 'px-3 py-4 sm:px-5 sm:py-5'"
  >
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName" mode="out-in" @after-enter="restoreScroll">
        <KeepAlive :include="tabsStore.cachedKeys" :max="16">
          <component
            v-if="Component"
            :is="resolveView(Component)"
            :key="cacheKey || route.fullPath"
          />
        </KeepAlive>
      </Transition>
    </RouterView>
  </main>
</template>
