<script setup lang="ts">
import { computed } from 'vue'

import type { RegionRank, TrafficSource } from '@/api/types/dashboard'
import BaseChart from '@/components/charts/BaseChart.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import type { ECOption } from '@/utils/echarts'
import { formatCompact } from '@/utils/format'

const props = defineProps<{
  sources?: TrafficSource[]
  regions?: RegionRank[]
  loading: boolean
}>()

const { palette } = useChartTheme()

const total = computed(() => (props.sources ?? []).reduce((sum, item) => sum + item.value, 0))

const option = computed<ECOption>(() => {
  const colors = palette.value
  return {
    animationDuration: 1100,
    animationEasing: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 14, 26, 0.92)',
      borderColor: colors.line,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 12 },
      valueFormatter: (value: unknown) => formatCompact(Number(value)),
    },
    series: [
      {
        type: 'pie',
        // 玫瑰环：半径差异让占比对比更明显，也比标准饼图更有设计感
        radius: ['58%', '86%'],
        center: ['50%', '52%'],
        startAngle: 210,
        itemStyle: {
          borderColor: 'transparent',
          borderWidth: 3,
          borderRadius: 6,
        },
        label: { show: false },
        emphasis: {
          scaleSize: 6,
          itemStyle: { shadowBlur: 18, shadowColor: colors.brand },
        },
        color: colors.series,
        data: (props.sources ?? []).map((item) => ({ name: item.name, value: item.value })),
      },
    ],
  } as ECOption
})
</script>

<template>
  <GlassPanel
    variant="default"
    title="流量结构"
    subtitle="渠道来源与地域分布"
    icon="i-lucide-pie-chart"
    padding="none"
    class="flex h-full flex-col"
  >
    <div class="relative px-3">
      <BaseChart :option="option" :loading="loading" height="184px" />
      <!-- 圆环中心的汇总数字：图表与文字分层，避免 ECharts 富文本的排版限制 -->
      <div class="pointer-events-none absolute inset-0 flex-center flex-col">
        <span class="text-[10.5px] text-text-dim">总访问</span>
        <span class="tabular text-[19px] font-semibold leading-tight">
          {{ formatCompact(total) }}
        </span>
      </div>
    </div>

    <ul class="space-y-2 px-5 pb-2 pt-1">
      <li v-for="(item, index) in regions ?? []" :key="item.region" class="group">
        <div class="flex-between text-[11.5px]">
          <span class="flex items-center gap-1.5 text-text-soft">
            <span class="size-1.5 rounded-full" :style="{ background: palette.series[index % 5] }" />
            {{ item.region }}
          </span>
          <span class="tabular text-text-dim">{{ formatCompact(item.value) }}</span>
        </div>
        <div class="mt-1 h-1 overflow-hidden rounded-full bg-line/40">
          <div
            class="h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :style="{
              width: `${item.ratio * 100}%`,
              background: `linear-gradient(90deg, transparent, ${palette.series[index % 5]})`,
              transitionDelay: `${index * 90}ms`,
            }"
          />
        </div>
      </li>
    </ul>
  </GlassPanel>
</template>
