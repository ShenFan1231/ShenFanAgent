<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'brand' | 'violet' | 'success' | 'warning' | 'danger' | 'auto'

const props = withDefaults(
  defineProps<{
    /** 0 ~ 100 */
    value: number
    tone?: Tone
    height?: number
    /** 顶部流光扫过效果 */
    animated?: boolean
    showLabel?: boolean
  }>(),
  { tone: 'brand', height: 6, animated: false, showLabel: false },
)

/** auto: 按数值高低自动变色，用于资源占用这类"越高越危险"的指标 */
const resolvedTone = computed<Exclude<Tone, 'auto'>>(() => {
  if (props.tone !== 'auto') return props.tone
  if (props.value >= 85) return 'danger'
  if (props.value >= 70) return 'warning'
  return 'brand'
})

const GRADIENT: Record<Exclude<Tone, 'auto'>, string> = {
  brand: 'linear-gradient(90deg, rgb(var(--c-brand) / 0.55), rgb(var(--c-brand)))',
  violet: 'linear-gradient(90deg, rgb(var(--c-violet) / 0.55), rgb(var(--c-violet)))',
  success: 'linear-gradient(90deg, rgb(var(--c-success) / 0.55), rgb(var(--c-success)))',
  warning: 'linear-gradient(90deg, rgb(var(--c-warning) / 0.55), rgb(var(--c-warning)))',
  danger: 'linear-gradient(90deg, rgb(var(--c-danger) / 0.55), rgb(var(--c-danger)))',
}

const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
</script>

<template>
  <div class="flex items-center gap-2.5">
    <div
      class="relative flex-1 overflow-hidden rounded-full bg-line/40"
      :style="{ height: `${height}px` }"
    >
      <div
        class="relative h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :style="{ width: `${clamped}%`, background: GRADIENT[resolvedTone] }"
      >
        <span
          v-if="animated"
          class="absolute inset-y-0 w-8 bg-white/25 blur-[3px]"
          style="animation: sweep-x 2.6s var(--ease-in-out-soft) infinite"
        />
      </div>
    </div>
    <span v-if="showLabel" class="tabular w-9 text-right text-[11px] text-text-dim">
      {{ Math.round(clamped) }}%
    </span>
  </div>
</template>
