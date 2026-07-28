<script setup lang="ts">
import { ref, watch } from 'vue'

import { useECharts } from '@/composables/useECharts'
import type { ECOption } from '@/utils/echarts'
import AppSkeleton from '../ui/AppSkeleton.vue'

const props = withDefaults(
  defineProps<{
    option: ECOption
    height?: string
    loading?: boolean
    /** 首屏之外的图表建议保持 lazy，进入视口才创建实例 */
    lazy?: boolean
  }>(),
  { height: '300px', loading: false, lazy: true },
)

const containerRef = ref<HTMLElement | null>(null)
const { setOption, isReady } = useECharts(containerRef, { lazy: props.lazy })

watch(
  () => props.option,
  (option) => {
    if (option) setOption(option)
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <div class="relative w-full" :style="{ height }">
    <div ref="containerRef" class="size-full" />

    <!-- 实例创建 / 数据加载期间用骨架占位，避免容器塌陷导致的布局跳动 -->
    <Transition name="fade">
      <div v-if="loading || !isReady" class="absolute inset-0 flex items-end">
        <AppSkeleton variant="chart" :height="height" />
      </div>
    </Transition>
  </div>
</template>
