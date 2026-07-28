import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { local, StorageKeys } from '@/utils/storage'

export type ThemeMode = 'dark' | 'light'
export type DeviceType = 'desktop' | 'tablet' | 'mobile'

interface AppSettings {
  theme: ThemeMode
  sidebarCollapsed: boolean
  showTabs: boolean
  showBreadcrumb: boolean
  showBackground: boolean
  routeTransition: 'route' | 'fade' | 'none'
  compact: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  sidebarCollapsed: false,
  showTabs: true,
  showBreadcrumb: true,
  showBackground: true,
  routeTransition: 'route',
  compact: false,
}

function readSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...local.get<Partial<AppSettings>>(StorageKeys.APP, {}) }
}

export const useAppStore = defineStore('app', () => {
  const persisted = readSettings()

  const theme = ref<ThemeMode>(persisted.theme)
  const sidebarCollapsed = ref(persisted.sidebarCollapsed)
  const showTabs = ref(persisted.showTabs)
  const showBreadcrumb = ref(persisted.showBreadcrumb)
  const showBackground = ref(persisted.showBackground)
  const routeTransition = ref<AppSettings['routeTransition']>(persisted.routeTransition)
  const compact = ref(persisted.compact)

  const device = ref<DeviceType>('desktop')
  /** 窄屏下侧边栏以抽屉形式浮出 */
  const mobileSidebarOpen = ref(false)
  const isFullscreen = ref(false)
  const settingsPanelOpen = ref(false)
  /** 全局页面级 loading（登录、权限初始化等） */
  const globalLoading = ref(false)

  const isMobile = computed(() => device.value === 'mobile')
  const isDark = computed(() => theme.value === 'dark')
  /** 桌面端才使用折叠宽度；窄屏侧边栏是覆盖式抽屉 */
  const sidebarWidth = computed(() =>
    isMobile.value ? 0 : sidebarCollapsed.value ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)',
  )

  function persist(): void {
    local.set<AppSettings>(StorageKeys.APP, {
      theme: theme.value,
      sidebarCollapsed: sidebarCollapsed.value,
      showTabs: showTabs.value,
      showBreadcrumb: showBreadcrumb.value,
      showBackground: showBackground.value,
      routeTransition: routeTransition.value,
      compact: compact.value,
    })
  }

  function applyTheme(): void {
    document.documentElement.dataset.theme = theme.value
  }

  function setTheme(next: ThemeMode): void {
    theme.value = next
    applyTheme()
  }

  /**
   * 主题切换。支持 View Transitions 的浏览器会以点击点为圆心做一次遮罩扩散，
   * 不支持的浏览器直接切换，不做任何降级动画。
   */
  function toggleTheme(origin?: { x: number; y: number }): void {
    const next: ThemeMode = theme.value === 'dark' ? 'light' : 'dark'
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    type ViewTransitionDoc = Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> }
    }
    const doc = document as ViewTransitionDoc

    if (!origin || reduced || typeof doc.startViewTransition !== 'function') {
      setTheme(next)
      return
    }

    const transition = doc.startViewTransition(() => setTheme(next))
    void transition.ready.then(() => {
      const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
      )
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration: 520,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      )
    })
  }

  function toggleSidebar(value?: boolean): void {
    if (isMobile.value) {
      mobileSidebarOpen.value = value ?? !mobileSidebarOpen.value
      return
    }
    sidebarCollapsed.value = value ?? !sidebarCollapsed.value
  }

  function setDevice(next: DeviceType): void {
    if (device.value === next) return
    device.value = next
    if (next === 'mobile') {
      mobileSidebarOpen.value = false
    } else if (next === 'tablet') {
      sidebarCollapsed.value = true
    }
  }

  async function toggleFullscreen(): Promise<void> {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      /* 浏览器拒绝（非用户手势 / 权限）时忽略 */
    }
  }

  function syncFullscreenState(): void {
    isFullscreen.value = Boolean(document.fullscreenElement)
  }

  function resetSettings(): void {
    theme.value = DEFAULT_SETTINGS.theme
    sidebarCollapsed.value = DEFAULT_SETTINGS.sidebarCollapsed
    showTabs.value = DEFAULT_SETTINGS.showTabs
    showBreadcrumb.value = DEFAULT_SETTINGS.showBreadcrumb
    showBackground.value = DEFAULT_SETTINGS.showBackground
    routeTransition.value = DEFAULT_SETTINGS.routeTransition
    compact.value = DEFAULT_SETTINGS.compact
    applyTheme()
  }

  // 任何设置变化都落盘，刷新后保持一致
  watch(
    [theme, sidebarCollapsed, showTabs, showBreadcrumb, showBackground, routeTransition, compact],
    persist,
    { flush: 'post' },
  )

  applyTheme()

  return {
    theme,
    isDark,
    sidebarCollapsed,
    sidebarWidth,
    showTabs,
    showBreadcrumb,
    showBackground,
    routeTransition,
    compact,
    device,
    isMobile,
    mobileSidebarOpen,
    isFullscreen,
    settingsPanelOpen,
    globalLoading,
    setTheme,
    toggleTheme,
    toggleSidebar,
    setDevice,
    toggleFullscreen,
    syncFullscreenState,
    resetSettings,
  }
})
