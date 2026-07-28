import { useThrottleFn } from '@vueuse/core'
import { onActivated, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

import { echarts, type ECOption, type EChartsInstance } from '@/utils/echarts'
import { prefersReducedMotion } from './useReducedMotion'

interface UseEChartsOptions {
  /** 容器进入视口后再初始化，首屏只渲染看得见的图表 */
  lazy?: boolean
  /** 自适应节流间隔 */
  resizeThrottle?: number
}

/**
 * ECharts 生命周期托管。
 *
 * 负责的事情：
 * - 懒初始化（IntersectionObserver），避免首屏一次性创建多个 canvas
 * - ResizeObserver + 节流 的响应式尺寸适配
 * - KeepAlive 激活时补一次 resize（隐藏期间容器尺寸可能变了）
 * - 组件卸载时 dispose，杜绝 canvas 与事件泄漏
 */
export function useECharts(target: Ref<HTMLElement | null>, options: UseEChartsOptions = {}) {
  const { lazy = true, resizeThrottle = 120 } = options

  const isReady = ref(false)
  let chart: EChartsInstance | null = null
  let resizeObserver: ResizeObserver | null = null
  let intersectionObserver: IntersectionObserver | null = null
  let cachedOption: ECOption | null = null

  const resize = useThrottleFn(() => {
    if (!chart || chart.isDisposed()) return
    chart.resize({ animation: { duration: prefersReducedMotion() ? 0 : 240 } })
  }, resizeThrottle)

  function init(): void {
    if (chart || !target.value) return
    const el = target.value
    if (el.clientWidth === 0 || el.clientHeight === 0) return

    chart = echarts.init(el, undefined, { renderer: 'canvas' })
    isReady.value = true

    if (cachedOption) chart.setOption(cachedOption, { notMerge: true })

    resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(el)
  }

  function setOption(option: ECOption, notMerge = true): void {
    cachedOption = option
    if (!chart) {
      init()
      return
    }
    chart.setOption(option, { notMerge, lazyUpdate: true })
  }

  function showLoading(): void {
    chart?.showLoading('default', { maskColor: 'transparent', text: '', spinnerRadius: 12 })
  }

  function hideLoading(): void {
    chart?.hideLoading()
  }

  function dispose(): void {
    resizeObserver?.disconnect()
    resizeObserver = null
    intersectionObserver?.disconnect()
    intersectionObserver = null
    if (chart && !chart.isDisposed()) chart.dispose()
    chart = null
    isReady.value = false
  }

  onMounted(() => {
    if (!lazy || !('IntersectionObserver' in window)) {
      init()
      return
    }
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          init()
          intersectionObserver?.disconnect()
          intersectionObserver = null
        }
      },
      { rootMargin: '120px' },
    )
    if (target.value) intersectionObserver.observe(target.value)
  })

  onActivated(() => {
    if (!chart) init()
    else resize()
  })

  onBeforeUnmount(dispose)

  return {
    isReady,
    setOption,
    resize,
    showLoading,
    hideLoading,
    getInstance: () => chart,
  }
}
