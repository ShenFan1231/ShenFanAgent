<script setup lang="ts">
import { computed } from 'vue'

import type { ServiceStatus, SystemStatusData } from '@/api/types/dashboard'
import RadialGauge from '@/components/charts/RadialGauge.vue'
import SparkLine from '@/components/charts/SparkLine.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import { formatDuration } from '@/utils/format'

const props = defineProps<{
  data?: SystemStatusData
  loading: boolean
  /** 轮询是否在运行，用于标题上的状态点 */
  live: boolean
}>()

const STATUS_META: Record<ServiceStatus['status'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  healthy: { label: '正常', tone: 'success' },
  degraded: { label: '降级', tone: 'warning' },
  down: { label: '故障', tone: 'danger' },
}

/** CPU / 内存用仪表盘，磁盘 / 网络用条形，避免四个一样的图形 */
const gauges = computed(() =>
  (props.data?.resources ?? []).filter((item) => item.key === 'cpu' || item.key === 'memory'),
)
const bars = computed(() =>
  (props.data?.resources ?? []).filter((item) => item.key === 'disk' || item.key === 'network'),
)
</script>

<template>
  <GlassPanel variant="gradient" padding="none" class="flex h-full flex-col">
    <div class="flex-between gap-3 px-5 pt-4.5">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="text-[14.5px] font-semibold tracking-tight">系统状态</h3>
          <AppTag :tone="live ? 'success' : 'neutral'" :dot="live" size="xs">
            {{ live ? '5s 自动刷新' : '已暂停' }}
          </AppTag>
        </div>
        <p class="mt-0.5 text-xs text-text-dim">
          已稳定运行 {{ data ? formatDuration(data.uptimeSeconds) : '—' }}
        </p>
      </div>
      <span class="flex-center size-8 rounded-xl bg-brand/12 text-brand ring-1 ring-brand/20">
        <i class="i-lucide-cpu" />
      </span>
    </div>

    <div v-if="loading && !data" class="px-5 py-5">
      <AppSkeleton variant="card" height="240px" />
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 gap-2 px-5 pt-4">
        <RadialGauge
          v-for="item in gauges"
          :key="item.key"
          :value="item.usage"
          :label="item.label"
          :detail="item.detail"
          :size="102"
        />
      </div>

      <div class="space-y-3 px-5 pt-4">
        <div v-for="item in bars" :key="item.key">
          <div class="flex-between text-[11.5px]">
            <span class="text-text-soft">{{ item.label }}</span>
            <span class="tabular text-text-dim">{{ item.detail }}</span>
          </div>
          <AppProgress :value="item.usage" tone="auto" animated class="mt-1.5" show-label />
          <div class="-mb-1 mt-0.5 opacity-70">
            <SparkLine :data="item.history" tone="violet" :height="22" :dot="false" :animate="900" />
          </div>
        </div>
      </div>

      <div class="mt-4 border-t border-line/50 px-5 py-3.5">
        <p class="mb-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-dim">
          服务健康度
        </p>
        <ul class="space-y-1.5">
          <li
            v-for="service in data.services"
            :key="service.id"
            class="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-elevated/60"
          >
            <span
              class="size-1.5 shrink-0 rounded-full"
              :class="{
                'bg-success shadow-[0_0_8px_rgb(var(--c-success))]': service.status === 'healthy',
                'bg-warning shadow-[0_0_8px_rgb(var(--c-warning))]': service.status === 'degraded',
                'bg-danger shadow-[0_0_8px_rgb(var(--c-danger))]': service.status === 'down',
              }"
            />
            <span class="min-w-0 flex-1 truncate text-[12.5px] text-text-soft">
              {{ service.name }}
            </span>
            <span class="tabular shrink-0 text-[11px] text-text-dim">{{ service.latency }}ms</span>
            <AppTag :tone="STATUS_META[service.status].tone" size="xs">
              {{ STATUS_META[service.status].label }}
            </AppTag>
          </li>
        </ul>
      </div>
    </template>
  </GlassPanel>
</template>
