<script setup lang="ts">
import { computed, ref } from 'vue'

import { systemApi } from '@/api'
import type { OperationLevel } from '@/api/types/system'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTag from '@/components/ui/AppTag.vue'
import DataTable from '@/components/ui/DataTable.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import type { TableColumn } from '@/components/ui/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { formatDate } from '@/utils/format'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.07 })

const keyword = ref('')
const module = ref('')
const level = ref<OperationLevel | ''>('')
const page = ref(1)
const pageSize = ref(20)

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  keyword: keyword.value,
  module: module.value,
  level: level.value,
}))

const { data, loading, refresh } = useAsyncData(() => systemApi.operationLogs(query.value), {
  watchSource: query,
  initialData: { list: [], total: 0, page: 1, pageSize: 20 },
})

const MODULE_OPTIONS = [
  { label: '全部模块', value: '' },
  { label: '认证', value: 'auth' },
  { label: '系统', value: 'system' },
  { label: '订单', value: 'orders' },
  { label: '项目', value: 'projects' },
  { label: '通知', value: 'notifications' },
]

const LEVEL_OPTIONS = [
  { label: '全部级别', value: '' },
  { label: '信息', value: 'info' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' },
]

const LEVEL_META: Record<
  OperationLevel,
  { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }
> = {
  info: { label: '信息', tone: 'neutral' },
  success: { label: '成功', tone: 'success' },
  warning: { label: '警告', tone: 'warning' },
  danger: { label: '危险', tone: 'danger' },
}

const columns: TableColumn[] = [
  { key: 'createdAt', title: '时间', width: '150px' },
  { key: 'operator', title: '操作人' },
  { key: 'summary', title: '操作摘要' },
  { key: 'module', title: '模块', align: 'center' },
  { key: 'level', title: '结果', align: 'center' },
  { key: 'durationMs', title: '耗时', align: 'right', hideOnMobile: true },
]

function reset(): void {
  keyword.value = ''
  module.value = ''
  level.value = ''
  page.value = 1
}
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1680px] space-y-4">
    <PageHeader
      data-motion
      title="操作日志"
      description="记录后台写操作、权限变更与业务执行结果"
      icon="i-lucide-scroll-text"
    />

    <GlassPanel data-motion variant="outline" padding="sm">
      <div class="flex flex-wrap items-center gap-2.5">
        <AppInput
          v-model="keyword"
          placeholder="搜索操作人 / 动作 / 摘要"
          icon="i-lucide-search"
          clearable
          class="w-full sm:w-64"
          @update:model-value="page = 1"
        />
        <AppSelect
          v-model="module"
          :options="MODULE_OPTIONS"
          :width="150"
          @update:model-value="page = 1"
        />
        <AppSelect
          v-model="level"
          :options="LEVEL_OPTIONS"
          :width="140"
          @update:model-value="page = 1"
        />
        <AppButton variant="ghost" icon="i-lucide-rotate-ccw" @click="reset">重置</AppButton>
        <AppButton
          class="ml-auto"
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refresh"
        >
          刷新
        </AppButton>
      </div>
    </GlassPanel>

    <GlassPanel data-motion padding="sm">
      <DataTable
        :columns="columns"
        :data="data?.list ?? []"
        :loading="loading"
        dense
        empty-text="暂无操作记录"
      >
        <template #cell-createdAt="{ row }">
          <span class="whitespace-nowrap font-mono text-[11.5px] text-text-dim">
            {{ formatDate(row.createdAt, 'MM-DD HH:mm:ss') }}
          </span>
        </template>
        <template #cell-operator="{ row }">
          <div class="flex items-center gap-2">
            <AppAvatar
              :src="row.operator.avatar"
              :name="row.operator.nickname"
              :size="28"
            />
            <div class="min-w-0">
              <p class="truncate text-[12.5px]">{{ row.operator.nickname }}</p>
              <p class="truncate font-mono text-[10.5px] text-text-dim">
                {{ row.operator.username }}
              </p>
            </div>
          </div>
        </template>
        <template #cell-summary="{ row }">
          <div class="max-w-[520px]">
            <p class="truncate text-[12.5px]">{{ row.summary }}</p>
            <p class="mt-0.5 truncate font-mono text-[10.5px] text-text-dim">
              {{ row.method }} {{ row.path }}
            </p>
          </div>
        </template>
        <template #cell-module="{ row }">
          <AppTag tone="brand" size="xs">{{ row.module }}</AppTag>
        </template>
        <template #cell-level="{ row }">
          <AppTag :tone="LEVEL_META[row.level].tone" size="xs" dot>
            {{ LEVEL_META[row.level].label }}
          </AppTag>
        </template>
        <template #cell-durationMs="{ row }">
          <span class="tabular text-[11.5px] text-text-dim">
            {{ row.durationMs === null ? '—' : `${row.durationMs} ms` }}
          </span>
        </template>
      </DataTable>

      <template #footer>
        <AppPagination
          :page="page"
          :page-size="pageSize"
          :total="data?.total ?? 0"
          @update:page="page = $event"
        />
      </template>
    </GlassPanel>
  </div>
</template>
