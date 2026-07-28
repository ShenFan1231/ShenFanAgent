<script setup lang="ts">
/**
 * 环形仪表盘（纯 SVG）。
 * 用 stroke-dashoffset 过渡而不是重绘 canvas，数值变化时是连续动画。
 */
import { computed, toRef } from 'vue'

import { useCountUp } from '@/composables/useCountUp'

const props = withDefaults(
  defineProps<{
    /** 0 ~ 100 */
    value: number
    label?: string
    detail?: string
    size?: number
    thickness?: number
    tone?: 'auto' | 'brand' | 'violet' | 'success' | 'warning' | 'danger'
  }>(),
  { size: 108, thickness: 7, tone: 'auto' },
)

const resolvedTone = computed(() => {
  if (props.tone !== 'auto') return props.tone
  if (props.value >= 85) return 'danger'
  if (props.value >= 70) return 'warning'
  return 'brand'
})

const COLOR: Record<string, string> = {
  brand: 'rgb(var(--c-brand))',
  violet: 'rgb(var(--c-violet))',
  success: 'rgb(var(--c-success))',
  warning: 'rgb(var(--c-warning))',
  danger: 'rgb(var(--c-danger))',
}

const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
/** 留 25% 缺口做成 270° 表盘，比整圆更像仪表 */
const arcRatio = 0.75
const dashArray = computed(() => `${circumference.value * arcRatio} ${circumference.value}`)
const dashOffset = computed(
  () => circumference.value * arcRatio * (1 - Math.min(100, Math.max(0, props.value)) / 100),
)

const { displayed } = useCountUp(toRef(props, 'value'), { duration: 1200, precision: 0 })
const gradientId = computed(() => `gauge-${props.label ?? 'x'}-${resolvedTone.value}`)
</script>

<template>
  <div class="flex flex-col items-center gap-1.5">
    <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg
        :width="size"
        :height="size"
        :viewBox="`0 0 ${size} ${size}`"
        class="-rotate-[225deg]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" :stop-color="COLOR[resolvedTone]" stop-opacity="0.45" />
            <stop offset="100%" :stop-color="COLOR[resolvedTone]" />
          </linearGradient>
        </defs>

        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          stroke="rgb(var(--c-line) / 0.55)"
          :stroke-width="thickness"
          :stroke-dasharray="dashArray"
          stroke-linecap="round"
        />
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          :stroke="`url(#${gradientId})`"
          :stroke-width="thickness"
          :stroke-dasharray="dashArray"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          class="gauge-arc"
          :style="{ filter: `drop-shadow(0 0 6px ${COLOR[resolvedTone]}66)` }"
        />
      </svg>

      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="tabular text-[19px] font-semibold leading-none">
          {{ Math.round(displayed) }}<span class="ml-0.5 text-[11px] text-text-dim">%</span>
        </span>
        <span v-if="label" class="mt-1 text-[11px] text-text-dim">{{ label }}</span>
      </div>
    </div>
    <p v-if="detail" class="text-center text-[11px] text-text-dim">{{ detail }}</p>
  </div>
</template>

<style scoped>
.gauge-arc {
  transition: stroke-dashoffset 1.1s var(--ease-out-expo);
}

@media (prefers-reduced-motion: reduce) {
  .gauge-arc {
    transition: none;
  }
}
</style>
