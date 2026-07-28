<script setup lang="ts">
/** 数据分析：集中展示不同图表类型与统一配色的适配能力。 */
import { computed, ref } from 'vue'

import { dashboardApi } from '@/api'
import type { RangeKey } from '@/api/types/common'
import BaseChart from '@/components/charts/BaseChart.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppTag from '@/components/ui/AppTag.vue'
import CountUp from '@/components/ui/CountUp.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useChartTheme } from '@/composables/useChartTheme'
import { useEnterMotion } from '@/composables/useEnterMotion'
import type { ECOption } from '@/utils/echarts'
import { formatCompact } from '@/utils/format'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.07 })

const { palette, areaGradient } = useChartTheme()

const range = ref<RangeKey>('30d')
const RANGES = [
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '近 90 天', value: '90d' },
]

const trend = useAsyncData(() => dashboardApi.trend(range.value), { watchSource: range })
const sources = useAsyncData(() => dashboardApi.trafficSources(), { initialData: [] })
const regions = useAsyncData(() => dashboardApi.regions(), { initialData: [] })

const categories = computed(() => trend.data.value?.categories ?? [])
function seriesOf(key: string): number[] {
  return trend.data.value?.series.find((item) => item.key === key)?.data ?? []
}

const totals = computed(() => {
  const visits = seriesOf('visits')
  const revenue = seriesOf('revenue')
  const newUsers = seriesOf('newUsers')
  const sum = (list: number[]) => list.reduce((acc, value) => acc + value, 0)
  return { visits: sum(visits), revenue: sum(revenue), newUsers: sum(newUsers) }
})

/** 柱状 + 折线组合：收入用柱、访问用折线，双轴 */
const comboOption = computed<ECOption>(() => {
  const colors = palette.value
  return {
    animationDuration: 1000,
    animationDelay: (index: number) => index * 18,
    grid: { top: 30, right: 12, bottom: 24, left: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 14, 26, 0.92)',
      borderColor: colors.line,
      borderWidth: 1,
      textStyle: { color: colors.text, fontSize: 12 },
    },
    legend: { top: 0, right: 0, textStyle: { color: colors.textDim, fontSize: 11 }, icon: 'roundRect' },
    xAxis: {
      type: 'category',
      data: categories.value,
      axisLine: { lineStyle: { color: colors.line } },
      axisTick: { show: false },
      axisLabel: { color: colors.textDim, fontSize: 11, hideOverlap: true },
    },
    yAxis: [
      {
        type: 'value',
        splitLine: { lineStyle: { color: colors.line, type: 'dashed', opacity: 0.5 } },
        axisLabel: { color: colors.textDim, fontSize: 11, formatter: (v: number) => formatCompact(v) },
      },
      {
        type: 'value',
        splitLine: { show: false },
        axisLabel: { color: colors.textDim, fontSize: 11, formatter: (v: number) => formatCompact(v) },
      },
    ],
    series: [
      {
        name: '收入',
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: colors.violet },
              { offset: 1, color: 'rgba(120, 100, 255, 0.12)' },
            ],
          },
        },
        data: seriesOf('revenue'),
      },
      {
        name: '访问量',
        type: 'line',
        yAxisIndex: 1,
        smooth: 0.4,
        showSymbol: false,
        lineStyle: { width: 2.2, color: colors.brand, shadowColor: colors.brand, shadowBlur: 10 },
        areaStyle: { color: areaGradient(colors.brand, 0.22) },
        data: seriesOf('visits'),
      },
    ],
  } as ECOption
})

/** 雷达图：渠道质量多维评估 */
const radarOption = computed<ECOption>(() => {
  const colors = palette.value
  return {
    animationDuration: 1200,
    tooltip: { backgroundColor: 'rgba(10, 14, 26, 0.92)', borderColor: colors.line, textStyle: { color: colors.text, fontSize: 12 } },
    radar: {
      center: ['50%', '54%'],
      radius: '66%',
      splitNumber: 4,
      axisName: { color: colors.textDim, fontSize: 11 },
      axisLine: { lineStyle: { color: colors.line } },
      splitLine: { lineStyle: { color: colors.line, opacity: 0.6 } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      indicator: [
        { name: '转化率', max: 100 },
        { name: '客单价', max: 100 },
        { name: '留存', max: 100 },
        { name: '获客成本', max: 100 },
        { name: '活跃度', max: 100 },
      ],
    },
    series: [
      {
        type: 'radar',
        symbolSize: 5,
        data: [
          {
            name: '本月',
            value: [86, 72, 64, 58, 91],
            lineStyle: { color: colors.brand, width: 2 },
            itemStyle: { color: colors.brand },
            areaStyle: { color: 'rgba(52, 224, 214, 0.18)' },
          },
          {
            name: '上月',
            value: [72, 66, 58, 70, 78],
            lineStyle: { color: colors.violet, width: 1.5, type: 'dashed' },
            itemStyle: { color: colors.violet },
            areaStyle: { color: 'rgba(141, 118, 255, 0.12)' },
          },
        ],
      },
    ],
  } as ECOption
})

/** 横向条形：渠道排行 */
const rankOption = computed<ECOption>(() => {
  const colors = palette.value
  const list = [...(sources.data.value ?? [])].sort((a, b) => a.value - b.value)
  return {
    animationDuration: 900,
    grid: { top: 8, right: 40, bottom: 4, left: 8, containLabel: true },
    tooltip: { trigger: 'item', backgroundColor: 'rgba(10, 14, 26, 0.92)', borderColor: colors.line, textStyle: { color: colors.text, fontSize: 12 } },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: list.map((item) => item.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: colors.textSoft, fontSize: 11.5 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        itemStyle: {
          borderRadius: 6,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: 'rgba(52, 224, 214, 0.25)' },
              { offset: 1, color: colors.brand },
            ],
          },
        },
        label: {
          show: true,
          position: 'right',
          color: colors.textDim,
          fontSize: 11,
          formatter: ({ value }: { value: number }) => formatCompact(value),
        },
        data: list.map((item) => item.value),
      },
    ],
  } as ECOption
})

/** 仪表盘：目标完成度 */
const gaugeOption = computed<ECOption>(() => {
  const colors = palette.value
  return {
    animationDuration: 1400,
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        radius: '92%',
        center: ['50%', '58%'],
        progress: { show: true, width: 12, roundCap: true, itemStyle: { color: colors.brand } },
        axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(120,140,180,0.18)']] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, 0],
          fontSize: 26,
          fontWeight: 600,
          color: colors.text,
          formatter: '{value}%',
        },
        data: [{ value: 78 }],
      },
    ],
  } as ECOption
})
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1680px] space-y-4">
    <PageHeader
      data-motion
      title="数据分析"
      description="经营指标的多维交叉分析"
      icon="i-lucide-chart-spline"
    >
      <template #actions>
        <AppSegmented
          :model-value="range"
          :options="RANGES"
          @update:model-value="range = $event as RangeKey"
        />
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3" data-motion>
      <GlassPanel
        v-for="item in [
          { label: '区间访问量', value: totals.visits, icon: 'i-lucide-activity', tone: 'brand' },
          { label: '区间收入', value: totals.revenue, icon: 'i-lucide-wallet-minimal', tone: 'success' },
          { label: '新增用户', value: totals.newUsers, icon: 'i-lucide-user-plus', tone: 'violet' },
        ]"
        :key="item.label"
        padding="sm"
        glow
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[11.5px] text-text-dim">{{ item.label }}</p>
            <p class="mt-1 text-[21px] font-semibold leading-none">
              <CountUp :value="item.value" format="compact" />
            </p>
          </div>
          <i :class="[item.icon, 'text-[20px] text-brand/70']" />
        </div>
      </GlassPanel>
    </div>

    <GlassPanel
      data-motion
      variant="raised"
      title="收入与流量对照"
      subtitle="柱状为收入，折线为访问量（双轴）"
      icon="i-lucide-bar-chart-3"
      edge
    >
      <template #extra>
        <AppTag tone="brand" size="xs">{{ range }}</AppTag>
      </template>
      <BaseChart :option="comboOption" :loading="trend.loading.value" height="320px" :lazy="false" />
    </GlassPanel>

    <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
      <GlassPanel
        data-motion
        class="lg:col-span-5"
        title="渠道质量雷达"
        subtitle="本月 vs 上月"
        icon="i-lucide-radar"
      >
        <BaseChart :option="radarOption" height="300px" />
      </GlassPanel>

      <GlassPanel
        data-motion
        class="lg:col-span-4"
        title="渠道排行"
        subtitle="按访问量排序"
        icon="i-lucide-list-ordered"
      >
        <BaseChart :option="rankOption" :loading="sources.loading.value" height="300px" />
      </GlassPanel>

      <GlassPanel
        data-motion
        class="lg:col-span-3"
        title="季度目标"
        subtitle="截至今日完成度"
        icon="i-lucide-target"
        variant="gradient"
      >
        <BaseChart :option="gaugeOption" height="200px" />
        <ul class="mt-1 space-y-1.5">
          <li
            v-for="item in regions.data.value ?? []"
            :key="item.region"
            class="flex-between text-[11.5px]"
          >
            <span class="text-text-dim">{{ item.region }}</span>
            <span class="tabular text-text-soft">{{ formatCompact(item.value) }}</span>
          </li>
        </ul>
      </GlassPanel>
    </div>
  </div>
</template>
