import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

import type { CacheKey, TabItem } from '@/types/tabs'
import { session, StorageKeys } from '@/utils/storage'

/** 序列化到 sessionStorage 的最小字段集合 */
interface PersistedTab {
  key: string
  name: string
  path: string
  fullPath: string
  title: string
  icon?: string
  affix: boolean
  keepAlive: boolean
}

/**
 * KeepAlive 的 include 会按逗号切分字符串，所以缓存 key 里不能出现逗号
 * （query 参数里带逗号的场景真实存在）。
 */
export function cacheKeyOf(tab: TabItem): CacheKey {
  return `${tab.key.replace(/,/g, '_')}::${tab.version}`
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([])
  const activeKey = ref('')

  /**
   * <KeepAlive :include> 使用的名单。
   * 这里放的是"缓存 key"而不是组件 name —— 页面渲染时会给每个标签套一层
   * 以 cacheKey 命名的壳组件（见 layout/components/PageContainer.vue），
   * 于是同一个路由的不同参数、以及刷新后的新实例都能被精确控制。
   */
  const cachedKeys = computed<CacheKey[]>(() =>
    tabs.value.filter((tab) => tab.keepAlive).map(cacheKeyOf),
  )

  const activeTab = computed(() => tabs.value.find((tab) => tab.key === activeKey.value))
  const activeIndex = computed(() => tabs.value.findIndex((tab) => tab.key === activeKey.value))

  function persist(): void {
    const payload: PersistedTab[] = tabs.value.map(({ version: _version, ...rest }) => rest)
    session.set(StorageKeys.TABS, { tabs: payload, activeKey: activeKey.value })
  }

  /** 从路由记录里收集固定标签（meta.affix），登录后先铺一遍 */
  function initAffixTabs(routes: RouteRecordRaw[], parentPath = ''): void {
    const walk = (list: RouteRecordRaw[], parent: string) => {
      list.forEach((route) => {
        const fullPath = route.path.startsWith('/')
          ? route.path
          : `${parent.replace(/\/+$/, '')}/${route.path}`
        if (route.meta?.affix && route.name) {
          upsert({
            key: fullPath,
            name: String(route.name),
            path: fullPath,
            fullPath,
            title: route.meta.title ?? '未命名',
            icon: route.meta.icon,
            affix: true,
            keepAlive: Boolean(route.meta.keepAlive),
            version: 0,
          })
        }
        if (route.children?.length) walk(route.children, fullPath)
      })
    }
    walk(routes, parentPath)
  }

  function upsert(tab: TabItem): void {
    const exist = tabs.value.find((item) => item.key === tab.key)
    if (exist) {
      // 同一路由的 query 变化只更新标题，不新建标签
      exist.title = tab.title
      exist.fullPath = tab.fullPath
      return
    }
    // 固定标签始终排在前面
    const lastAffix = tabs.value.filter((item) => item.affix).length
    if (tab.affix) tabs.value.splice(lastAffix, 0, tab)
    else tabs.value.push(tab)
  }

  /** 路由跳转成功后调用：新增或激活标签 */
  function addTab(route: RouteLocationNormalizedLoaded): void {
    if (route.meta?.hideTab || !route.name) return

    const key = route.fullPath
    upsert({
      key,
      name: String(route.name),
      path: route.path,
      fullPath: route.fullPath,
      title: route.meta.title ?? '未命名',
      icon: route.meta.icon,
      affix: Boolean(route.meta.affix),
      keepAlive: Boolean(route.meta.keepAlive),
      version: 0,
    })
    activeKey.value = key
    persist()
  }

  /**
   * 关闭标签，返回需要跳转到的目标标签（若关闭的是当前激活标签）。
   * 缓存随 cachedKeys 计算属性自动收缩，因此不需要额外清理动作。
   */
  function closeTab(key: string): TabItem | null {
    const index = tabs.value.findIndex((tab) => tab.key === key)
    if (index === -1) return null
    const target = tabs.value[index]!
    if (target.affix) return null

    const wasActive = activeKey.value === key
    tabs.value.splice(index, 1)

    let next: TabItem | null = null
    if (wasActive) {
      next = tabs.value[index] ?? tabs.value[index - 1] ?? null
      activeKey.value = next?.key ?? ''
    }
    persist()
    return wasActive ? next : null
  }

  function closeOthers(key: string): void {
    tabs.value = tabs.value.filter((tab) => tab.affix || tab.key === key)
    activeKey.value = key
    persist()
  }

  function closeSide(key: string, side: 'left' | 'right'): void {
    const index = tabs.value.findIndex((tab) => tab.key === key)
    if (index === -1) return
    tabs.value = tabs.value.filter((tab, i) => {
      if (tab.affix || i === index) return true
      return side === 'left' ? i > index : i < index
    })
    activeKey.value = key
    persist()
  }

  /** 关闭全部（固定标签保留），返回应跳转的标签 */
  function closeAll(): TabItem | null {
    tabs.value = tabs.value.filter((tab) => tab.affix)
    const next = tabs.value[tabs.value.length - 1] ?? null
    activeKey.value = next?.key ?? ''
    persist()
    return next
  }

  /**
   * 刷新标签：version 自增 → cacheKey 变化 → 旧缓存实例被 KeepAlive 丢弃，
   * 组件重新走一遍 setup / onMounted，等价于"重新加载这一页"。
   */
  function refreshTab(key = activeKey.value): void {
    const tab = tabs.value.find((item) => item.key === key)
    if (tab) tab.version += 1
  }

  function updateTitle(key: string, title: string): void {
    const tab = tabs.value.find((item) => item.key === key)
    if (tab) {
      tab.title = title
      persist()
    }
  }

  function clearAll(): void {
    tabs.value = []
    activeKey.value = ''
    session.remove(StorageKeys.TABS)
  }

  /** 刷新页面后恢复标签栏 */
  function restore(): void {
    const saved = session.get<{ tabs: PersistedTab[]; activeKey: string } | null>(
      StorageKeys.TABS,
      null,
    )
    if (!saved?.tabs?.length) return
    tabs.value = saved.tabs.map((tab) => ({ ...tab, version: 0 }))
    activeKey.value = saved.activeKey
  }

  return {
    tabs,
    activeKey,
    activeTab,
    activeIndex,
    cachedKeys,
    addTab,
    closeTab,
    closeOthers,
    closeSide,
    closeAll,
    refreshTab,
    updateTitle,
    clearAll,
    restore,
    initAffixTabs,
  }
})
