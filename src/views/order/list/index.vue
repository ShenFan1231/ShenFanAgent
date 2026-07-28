<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { systemApi } from '@/api'
import type { OrderStatus } from '@/api/types/system'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppTag from '@/components/ui/AppTag.vue'
import CountUp from '@/components/ui/CountUp.vue'
import DataTable from '@/components/ui/DataTable.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import type { TableColumn } from '@/components/ui/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { vPermission } from '@/directives'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from '@/utils/toast'

const router = useRouter()
const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.07 })

const keyword = ref('')
const status = ref<OrderStatus | ''>('')
const page = ref(1)
const pageSize = ref(10)

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  keyword: keyword.value,
  status: status.value,
}))

const { data, loading, refresh } = useAsyncData(() => systemApi.orders(query.value), {
  watchSource: query,
  initialData: { list: [], total: 0, page: 1, pageSize: 10 },
})

const STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '已支付', value: 'paid' },
  { label: '待付款', value: 'pending' },
  { label: '已退款', value: 'refunded' },
  { label: '已关闭', value: 'closed' },
]

const STATUS_META: Record<OrderStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  paid: { label: '已支付', tone: 'success' },
  pending: { label: '待付款', tone: 'warning' },
  refunded: { label: '已退款', tone: 'danger' },
  closed: { label: '已关闭', tone: 'neutral' },
}

const columns: TableColumn[] = [
  { key: 'orderNo', title: '订单号' },
  { key: 'customer', title: '客户' },
  { key: 'channel', title: '渠道', hideOnMobile: true },
  { key: 'amount', title: '金额', align: 'right' },
  { key: 'status', title: '状态', align: 'center' },
  { key: 'createdAt', title: '下单时间', hideOnMobile: true },
  { key: 'actions', title: '', align: 'right', width: '84px' },
]

/** 当前筛选结果的汇总，跟着分页数据一起变 */
const summary = computed(() => {
  const list = data.value?.list ?? []
  return {
    amount: list.reduce((sum, item) => sum + item.amount, 0),
    items: list.reduce((sum, item) => sum + item.items, 0),
  }
})
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1680px] space-y-4">
    <PageHeader
      data-motion
      title="订单列表"
      description="交易流水与退款处理"
      icon="i-lucide-receipt-text"
    >
      <template #actions>
        <AppButton v-permission="'order:export'" variant="soft" icon="i-lucide-download">
          导出账单
        </AppButton>
        <AppButton
          v-permission="'order:refund'"
          variant="primary"
          icon="i-lucide-undo-2"
          @click="toast.info('演示环境：退款流程需要接入真实订单接口')"
        >
          批量退款
        </AppButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3" data-motion>
      <GlassPanel variant="gradient" padding="sm">
        <p class="text-[11.5px] text-text-dim">本页金额合计</p>
        <p class="mt-1 text-[22px] font-semibold leading-none">
          <CountUp :value="summary.amount" format="currency" />
        </p>
      </GlassPanel>
      <GlassPanel padding="sm">
        <p class="text-[11.5px] text-text-dim">本页商品件数</p>
        <p class="mt-1 text-[22px] font-semibold leading-none">
          <CountUp :value="summary.items" />
        </p>
      </GlassPanel>
      <GlassPanel padding="sm">
        <p class="text-[11.5px] text-text-dim">筛选结果</p>
        <p class="mt-1 text-[22px] font-semibold leading-none">
          <CountUp :value="data?.total ?? 0" /><span class="ml-1 text-[12px] text-text-dim">笔</span>
        </p>
      </GlassPanel>
    </div>

    <GlassPanel data-motion variant="outline" padding="sm">
      <div class="flex flex-wrap items-center gap-2.5">
        <AppSegmented
          :model-value="status"
          :options="STATUS_TABS"
          @update:model-value="((status = $event as OrderStatus | ''), (page = 1))"
        />
        <AppInput
          v-model="keyword"
          placeholder="搜索订单号 / 客户"
          icon="i-lucide-search"
          clearable
          class="w-full sm:w-56"
          @update:model-value="page = 1"
        />
        <AppButton
          class="ml-auto"
          variant="soft"
          size="sm"
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
        empty-text="没有符合条件的订单"
        @row-click="router.push(`/order/detail/${$event.id}`)"
      >
        <template #cell-orderNo="{ row }">
          <span class="font-mono text-[12px] text-text-soft">{{ row.orderNo }}</span>
        </template>
        <template #cell-customer="{ row }">
          <span class="text-[13px]">{{ row.customer }}</span>
        </template>
        <template #cell-channel="{ row }">
          <AppTag tone="neutral" size="xs">{{ row.channel }}</AppTag>
        </template>
        <template #cell-amount="{ row }">
          <span class="tabular text-[13px] font-medium">{{ formatCurrency(row.amount) }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppTag :tone="STATUS_META[row.status].tone" size="xs">
            {{ STATUS_META[row.status].label }}
          </AppTag>
        </template>
        <template #cell-createdAt="{ row }">
          <span class="text-[12px] text-text-dim">{{ formatDate(row.createdAt, 'MM-DD HH:mm') }}</span>
        </template>
        <template #cell-actions="{ row }">
          <AppButton
            variant="text"
            size="xs"
            icon-right="i-lucide-arrow-right"
            @click.stop="router.push(`/order/detail/${row.id}`)"
          >
            详情
          </AppButton>
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
