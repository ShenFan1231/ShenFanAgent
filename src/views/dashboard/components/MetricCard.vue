<script setup lang="ts">
import { computed } from 'vue'

import type { MetricCard, MetricKey } from '@/api/types/dashboard'
import SparkLine from '@/components/charts/SparkLine.vue'
import CountUp from '@/components/ui/CountUp.vue'
import { vSpotlight } from '@/directives'
import { formatCompact, formatCurrency } from '@/utils/format'

const props = defineProps<{
  metric: MetricCard
  /** 用于错开描线动画的起始时间 */
  index: number
}>()

type Tone = 'brand' | 'violet' | 'success' | 'warning'

const META: Record<MetricKey, { icon: string; tone: Tone }> = {
  users: { icon: 'i-lucide-users-round', tone: 'brand' },
  visits: { icon: 'i-lucide-mouse-pointer-click', tone: 'violet' },
  revenue: { icon: 'i-lucide-wallet-minimal', tone: 'success' },
  orders: { icon: 'i-lucide-package', tone: 'warning' },
}

const ACCENT: Record<Tone, string> = {
  brand: 'text-brand bg-brand/12 ring-brand/22',
  violet: 'text-violet bg-violet/12 ring-violet/22',
  success: 'text-success bg-success/12 ring-success/22',
  warning: 'text-warning bg-warning/12 ring-warning/22',
}

/** 静态映射而不是拼类名：UnoCSS 是静态提取，拼出来的类名不会被生成 */
const BAR: Record<Tone, string> = {
  brand: 'bg-[linear-gradient(90deg,rgb(var(--c-brand)/0.4),rgb(var(--c-brand)))]',
  violet: 'bg-[linear-gradient(90deg,rgb(var(--c-violet)/0.4),rgb(var(--c-violet)))]',
  success: 'bg-[linear-gradient(90deg,rgb(var(--c-success)/0.4),rgb(var(--c-success)))]',
  warning: 'bg-[linear-gradient(90deg,rgb(var(--c-warning)/0.4),rgb(var(--c-warning)))]',
}

const meta = computed(() => META[props.metric.key])
const isUp = computed(() => props.metric.direction === 'up')

const comparison = computed(() => {
  const prev = props.metric.prevValue
  return props.metric.unit === 'currency' ? formatCurrency(prev) : formatCompact(prev)
})
</script>

<template>
  <article
    v-spotlight.tilt="4"
    class="metric-card group/metric relative overflow-hidden rounded-2xl border border-line/65 bg-surface/60 p-4.5 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-brand/40"
  >
    <!-- 悬浮时从左上扫过的高光 -->
    <span class="metric-card__sheen" />

    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="truncate text-[12.5px] text-text-dim">{{ metric.label }}</p>
        <p class="mt-1.5 text-[26px] font-semibold leading-none tracking-tight">
          <CountUp
            :value="metric.value"
            :format="metric.unit === 'currency' ? 'currency' : 'compact'"
            :delay="160 + index * 90"
            :duration="1600"
          />
        </p>
      </div>
      <span
        class="flex-center size-9 shrink-0 rounded-xl ring-1 transition-transform duration-400 group-hover/metric:scale-110 group-hover/metric:rotate-6"
        :class="ACCENT[meta.tone]"
      >
        <i :class="[meta.icon, 'text-[17px]']" />
      </span>
    </header>

    <div class="mt-3 flex items-center gap-2 text-[11.5px]">
      <span
        class="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium tabular"
        :class="isUp ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'"
      >
        <i :class="isUp ? 'i-lucide-trending-up' : 'i-lucide-trending-down'" class="text-[12px]" />
        {{ Math.abs(metric.delta).toFixed(1) }}%
      </span>
      <span class="truncate text-text-dim">较昨日 {{ comparison }}</span>
    </div>

    <div class="-mx-1 mt-3">
      <SparkLine
        :data="metric.sparkline"
        :tone="meta.tone"
        :height="42"
        :animate="1300 + index * 160"
      />
    </div>

    <footer class="mt-2 flex items-center justify-between text-[10.5px] text-text-dim">
      <span>月度目标</span>
      <span class="tabular">{{ Math.round(metric.target * 100) }}%</span>
    </footer>
    <div class="mt-1 h-0.75 overflow-hidden rounded-full bg-line/45">
      <div
        class="h-full rounded-full transition-[width] duration-1200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :class="BAR[meta.tone]"
        :style="{ width: `${metric.target * 100}%`, transitionDelay: `${300 + index * 90}ms` }"
      />
    </div>
  </article>
</template>

<style scoped>
.metric-card__sheen {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(115deg, transparent 30%, rgb(var(--c-brand) / 0.1), transparent 70%);
  opacity: 0;
  transform: translateX(-30%);
  transition:
    opacity 420ms ease,
    transform 620ms var(--ease-out-expo);
  pointer-events: none;
}

.metric-card:hover .metric-card__sheen {
  opacity: 1;
  transform: translateX(0);
}
</style>
