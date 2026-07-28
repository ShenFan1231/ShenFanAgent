import { useThrottleFn } from '@vueuse/core'
import { onBeforeUnmount, onMounted } from 'vue'

import { useAppStore, type DeviceType } from '@/stores/app'

const MOBILE_MAX = 768
const TABLET_MAX = 1200

function detect(width: number): DeviceType {
  if (width < MOBILE_MAX) return 'mobile'
  if (width < TABLET_MAX) return 'tablet'
  return 'desktop'
}

/**
 * 视口宽度 → 设备类型。
 * resize 事件节流到 150ms，避免拖窗口时反复触发布局计算。
 */
export function useDeviceWatcher() {
  const appStore = useAppStore()

  const sync = useThrottleFn(
    () => appStore.setDevice(detect(window.innerWidth)),
    150,
    true,
  )

  onMounted(() => {
    appStore.setDevice(detect(window.innerWidth))
    window.addEventListener('resize', sync, { passive: true })
    document.addEventListener('fullscreenchange', appStore.syncFullscreenState)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', sync)
    document.removeEventListener('fullscreenchange', appStore.syncFullscreenState)
  })
}
