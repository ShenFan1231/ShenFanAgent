<script setup lang="ts">
/**
 * 迷你走势图。
 * 指标卡里有 4 张，用 SVG 手绘比起 4 个 ECharts 实例便宜太多；
 * 描线动画用 stroke-dashoffset，完全走 GPU。
 */
import { computed } from 'vue'

type Tone = 'brand' | 'violet' | 'success' | 'warning' | 'danger'

const props = withDefaults(
  defineProps<{
    data: number[]
    tone?: Tone
    height?: number
    /** 面积填充 */
    filled?: boolean
    /** 末端高亮点 */
    dot?: boolean
    /** 描线动画时长（ms），0 表示不播 */
    animate?: number
  }>(),
  { tone: 'brand', height: 44, filled: true, dot: true, animate: 1400 },
)

const VIEW_W = 100
const VIEW_H = 34

const COLOR: Record<Tone, string> = {
  brand: 'rgb(var(--c-brand))',
  violet: 'rgb(var(--c-violet))',
  success: 'rgb(var(--c-success))',
  warning: 'rgb(var(--c-warning))',
  danger: 'rgb(var(--c-danger))',
}

const points = computed(() => {
  const data = props.data.length > 1 ? props.data : [0, 0]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const stepX = VIEW_W / (data.length - 1)

  return data.map((value, index) => ({
    x: index * stepX,
    // 上下各留 3 的呼吸空间，端点不会被裁掉
    y: VIEW_H - 3 - ((value - min) / span) * (VIEW_H - 6),
  }))
})

/** Catmull-Rom 简化版平滑：相邻点中点做控制点，曲线不会过冲 */
const linePath = computed(() => {
  const list = points.value
  if (list.length < 2) return ''
  let path = `M ${list[0]!.x.toFixed(2)} ${list[0]!.y.toFixed(2)}`
  for (let i = 1; i < list.length; i++) {
    const prev = list[i - 1]!
    const curr = list[i]!
    const cx = (prev.x + curr.x) / 2
    path += ` C ${cx.toFixed(2)} ${prev.y.toFixed(2)}, ${cx.toFixed(2)} ${curr.y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
  }
  return path
})

const areaPath = computed(() =>
  linePath.value ? `${linePath.value} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z` : '',
)

const last = computed(() => points.value[points.value.length - 1])
const gradientId = computed(() => `spark-${props.tone}-${props.data.length}-${Math.round(props.height)}`)
</script>

<template>
  <svg
    :viewBox="`0 0 ${VIEW_W} ${VIEW_H}`"
    :style="{ height: `${height}px`, '--spark-color': COLOR[tone], '--spark-duration': `${animate}ms` }"
    class="w-full overflow-visible"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="COLOR[tone]" stop-opacity="0.34" />
        <stop offset="100%" :stop-color="COLOR[tone]" stop-opacity="0" />
      </linearGradient>
    </defs>

    <path v-if="filled" :d="areaPath" :fill="`url(#${gradientId})`" class="spark-area" />
    <path
      :d="linePath"
      fill="none"
      :stroke="COLOR[tone]"
      stroke-width="1.6"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
      class="spark-line"
      :class="animate > 0 ? 'spark-line--draw' : ''"
    />
    <circle
      v-if="dot && last"
      :cx="last.x"
      :cy="last.y"
      r="1.9"
      :fill="COLOR[tone]"
      class="spark-dot"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<style scoped>
.spark-line--draw {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: spark-draw var(--spark-duration) var(--ease-out-expo) forwards;
}

.spark-area {
  opacity: 0;
  animation: spark-fade 900ms ease 320ms forwards;
}

.spark-dot {
  opacity: 0;
  animation: spark-fade 500ms ease calc(var(--spark-duration) * 0.72) forwards;
  filter: drop-shadow(0 0 4px var(--spark-color));
}

@keyframes spark-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes spark-fade {
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spark-line--draw,
  .spark-area,
  .spark-dot {
    animation: none;
    stroke-dashoffset: 0;
    opacity: 1;
  }
}
</style>
