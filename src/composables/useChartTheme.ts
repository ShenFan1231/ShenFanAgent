import { computed, ref, watch } from 'vue'

import { useAppStore } from '@/stores/app'

export interface ChartPalette {
  brand: string
  violet: string
  success: string
  warning: string
  danger: string
  text: string
  textSoft: string
  textDim: string
  line: string
  surface: string
  /** 多序列默认取色顺序 */
  series: string[]
}

/**
 * 主题变量存的是裸通道值（如 `52 224 214`）。
 * 这里统一转成逗号写法 `rgb(52, 224, 214)`：ECharts 的渐变会在字符串上做
 * rgb→rgba 的替换，空格写法拼出来的 `rgba(52 224 214, .3)` 是非法颜色。
 */
function cssVar(styles: CSSStyleDeclaration, name: string): string {
  const raw = styles.getPropertyValue(name).trim()
  if (!raw) return '#888'
  return `rgb(${raw.split(/[\s,]+/).join(', ')})`
}

function readPalette(): ChartPalette {
  const styles = getComputedStyle(document.documentElement)
  const brand = cssVar(styles, '--c-brand')
  const violet = cssVar(styles, '--c-violet')
  const success = cssVar(styles, '--c-success')
  const warning = cssVar(styles, '--c-warning')
  const danger = cssVar(styles, '--c-danger')

  return {
    brand,
    violet,
    success,
    warning,
    danger,
    text: cssVar(styles, '--c-text'),
    textSoft: cssVar(styles, '--c-text-soft'),
    textDim: cssVar(styles, '--c-text-dim'),
    line: cssVar(styles, '--c-line'),
    surface: cssVar(styles, '--c-surface'),
    series: [brand, violet, success, warning, danger],
  }
}

/**
 * 图表配色跟随主题。
 * 直接读 CSS 变量，保证图表与界面永远是同一套色板（不会出现两处硬编码不一致）。
 */
export function useChartTheme() {
  const appStore = useAppStore()
  const palette = ref<ChartPalette>(readPalette())

  watch(
    () => appStore.theme,
    () => {
      // setTheme 已同步写入 data-theme，此处读到的就是新值
      palette.value = readPalette()
    },
  )

  const isDark = computed(() => appStore.isDark)

  /** 折线区域渐变：顶部亮、底部透明 */
  function areaGradient(color: string, topAlpha = 0.32) {
    return {
      type: 'linear' as const,
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: color.replace('rgb(', 'rgba(').replace(')', `, ${topAlpha})`) },
        { offset: 1, color: color.replace('rgb(', 'rgba(').replace(')', ', 0)') },
      ],
    }
  }

  return { palette, isDark, areaGradient }
}
