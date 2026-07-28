<script setup lang="ts">
import { computed, ref } from 'vue'

import type { RangeKey } from '@/api/types/common'
import type { TrendChartData } from '@/api/types/dashboard'
import BaseChart from '@/components/charts/BaseChart.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import type { ECOption } from '@/utils/echarts'
import { formatCompact, formatCurrency } from '@/utils/format'

const props = defineProps<{
  data?: TrendChartData
  loading: boolean
  range: RangeKey
}>()

const emit = defineEmits<{ 'update:range': [value: RangeKey] }>()

const { palette, areaGradient } = useChartTheme()

const RANGES = [
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '近 90 天', value: '90d' },
]

type MetricView = 'traffic' | 'revenue' | 'users'

const view = ref<MetricView>('traffic')
const VIEWS = [
  { label: '流量', value: 'traffic', icon: 'i-lucide-activity' },
  { label: '收入', value: 'revenue', icon: 'i-lucide-wallet-minimal' },
  { label: '用户', value: 'users', icon: 'i-lucide-users-round' },
]

/** 每个视角取哪两条序列，以及各自的颜色与格式化方式 */
const VIEW_CONFIG: Record<MetricView, { keys: [string, string]; currency?: boolean }> = {
  traffic: { keys: ['visits', 'uv'] },
  revenue: { keys: ['revenue', 'visits'], currency: true },
  users: { keys: ['newUsers', 'activeUsers'] },
}

const summary = computed(() => {
  const config = VIEW_CONFIG[view.value]
  const series = props.data?.series.find((item) => item.key === config.keys[0])
  if (!series?.data.length) return { total: 0, peak: 0, avg: 0, currency: config.currency }
  const total = series.data.reduce((sum, value) => sum + value, 0)
  return {
    total,
    peak: Math.max(...series.data),
    avg: Math.round(total / series.data.length),
    currency: config.currency,
  }
})

function money(value: number, currency?: boolean): string {
  return currency ? formatCurrency(value) : formatCompact(value)
}

const option = computed<ECOption>(() => {
  const colors = palette.value
  const config = VIEW_CONFIG[view.value]
  const categories = props.data?.categories ?? []
  const picked = config.keys
    .map((key) => props.data?.series.find((item) => item.key === key))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const accents = [colors.brand, colors.violet]

  return {
    // 首次绘制自左向右推进，之后的数据切换用 UniversalTransition 平滑过渡
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    animationDelay: (index: number) => index * 22,
    grid: { top: 28, right: 18, bottom: 24, left: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 26, 0.92)',
      borderColor: colors.line,
      borderWidth: 1,
      padding: [10, 12],
      textStyle: { color: colors.text, fontSize: 12 },
      axisPointer: {
        type: 'line',
        lineStyle: { color: colors.brand, width: 1, type: [4, 4] },
      },
      valueFormatter: (value: unknown) => money(Number(value), config.currency),
    },
    legend: {
      show: true,
      right: 0,
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
      icon: 'roundRect',
      textStyle: { color: colors.textDim, fontSize: 11 },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories,
      axisLine: { lineStyle: { color: colors.line } },
      axisTick: { show: false },
      axisLabel: { color: colors.textDim, fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: colors.line, type: 'dashed', opacity: 0.55 } },
      axisLabel: {
        color: colors.textDim,
        fontSize: 11,
        formatter: (value: number) => formatCompact(value),
      },
    },
    series: picked.map((item, index) => ({
      id: item.key,
      name: item.name,
      type: 'line',
      smooth: 0.35,
      showSymbol: false,
      symbolSize: 7,
      sampling: 'lttb',
      lineStyle: {
        width: index === 0 ? 2.4 : 1.6,
        color: accents[index],
        shadowColor: accents[index],
        shadowBlur: index === 0 ? 12 : 0,
        shadowOffsetY: 6,
        type: index === 0 ? 'solid' : 'dashed',
      },
      itemStyle: { color: accents[index], borderWidth: 2, borderColor: colors.surface },
      areaStyle: index === 0 ? { color: areaGradient(accents[index]!, 0.3) } : undefined,
      emphasis: { focus: 'series', scale: 1.2 },
      markLine:
        index === 0
          ? {
              silent: true,
              symbol: 'none',
              label: {
                formatter: '均值',
                position: 'insideEndTop',
                color: colors.textDim,
                fontSize: 10,
              },
              lineStyle: { color: colors.textDim, type: 'dotted', opacity: 0.6 },
              data: [{ type: 'average' }],
            }
          : undefined,
      data: item.data,
      universalTransition: { enabled: true },
    })),
  } as ECOption
})
</script>

<template>
  <GlassPanel variant="raised" padding="none" edge class="flex h-full flex-col">
    <div class="flex flex-wrap items-start justify-between gap-3 px-5 pt-4.5">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-[14.5px] font-semibold tracking-tight">业务趋势</h3>
          <AppTag tone="brand" size="xs" icon="i-lucide-radio">实时</AppTag>
        </div>
        <p class="mt-0.5 text-xs text-text-dim">按天聚合，数据来自实时计算集群</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppSegmented v-model="view" :options="VIEWS" size="sm" />
        <AppSegmented
          :model-value="range"
          :options="RANGES"
          size="sm"
          @update:model-value="emit('update:range', $event as RangeKey)"
        />
      </div>
    </div>

    <!-- 概览数字与图表共享同一份数据，切换视角时一起变化 -->
    <div class="grid grid-cols-3 gap-3 px-5 pt-4">
      <div v-for="item in [
          { label: '区间累计', value: summary.total },
          { label: '峰值', value: summary.peak },
          { label: '日均', value: summary.avg },
        ]" :key="item.label" class="rounded-xl border border-line/50 bg-elevated/35 px-3 py-2">
        <p class="truncate text-[10.5px] text-text-dim">{{ item.label }}</p>
        <p class="tabular mt-0.5 truncate text-[15px] font-semibold">
          {{ money(item.value, summary.currency) }}
        </p>
      </div>
    </div>

    <div class="min-h-0 flex-1 px-2 pb-2 pt-1">
      <BaseChart :option="option" :loading="loading" height="286px" :lazy="false" />
    </div>
  </GlassPanel>
</template>
