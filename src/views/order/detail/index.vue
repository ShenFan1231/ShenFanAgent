<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { systemApi } from '@/api'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { useTabsStore } from '@/stores/tabs'
import { formatCurrency, formatDate } from '@/utils/format'

/**
 * 详情页演示两件事：
 * 1. 动态路由参数 + 每个订单独立占一个标签页与缓存实例
 * 2. 进入后把标签标题改成订单号，标签栏更可读
 */
const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.08 })

const orderId = computed(() => String(route.params.id ?? ''))

const { data, loading } = useAsyncData(
  async () => {
    return systemApi.order(orderId.value)
  },
  {
    onSuccess: (order) => {
      // 标签宽度有限，只取订单号末段（NB-20260727-1042 → 1042）
      if (order) tabsStore.updateTitle(route.fullPath, `订单 ${order.orderNo.split('-').at(-1)}`)
    },
  },
)

const STEPS = ['创建订单', '支付成功', '仓库出库', '配送中', '已完成']
const currentStep = computed(() => {
  if (!data.value) return 0
  switch (data.value.status) {
    case 'paid':
      return 3
    case 'pending':
      return 1
    case 'refunded':
      return 2
    default:
      return 5
  }
})
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1200px] space-y-4">
    <PageHeader
      data-motion
      :title="data ? `订单 ${data.orderNo}` : '订单详情'"
      :description="data ? `${data.channel} · ${data.customer}` : '加载中…'"
      icon="i-lucide-file-text"
    >
      <template #actions>
        <AppButton variant="soft" icon="i-lucide-corner-up-left" @click="router.push('/order/list')">
          返回列表
        </AppButton>
      </template>
    </PageHeader>

    <GlassPanel v-if="loading" data-motion>
      <AppSkeleton variant="card" height="220px" />
    </GlassPanel>

    <template v-else-if="data">
      <!-- 进度条：节点按状态点亮，连线用渐变 -->
      <GlassPanel data-motion variant="gradient" title="物流进度" icon="i-lucide-truck">
        <ol class="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center">
          <li
            v-for="(step, index) in STEPS"
            :key="step"
            class="flex flex-1 items-center gap-2.5"
          >
            <span
              class="flex-center size-7 shrink-0 rounded-full text-[11px] font-semibold ring-1 transition-all duration-500"
              :class="
                index < currentStep
                  ? 'bg-brand/18 text-brand ring-brand/40 shadow-[0_0_14px_-2px_rgb(var(--c-brand)/0.7)]'
                  : 'bg-elevated text-text-dim ring-line/60'
              "
              :style="{ transitionDelay: `${index * 90}ms` }"
            >
              <i v-if="index < currentStep" class="i-lucide-check" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span class="whitespace-nowrap text-[12.5px]" :class="index < currentStep ? 'text-text' : 'text-text-dim'">
              {{ step }}
            </span>
            <span
              v-if="index < STEPS.length - 1"
              class="hidden h-px flex-1 sm:block"
              :class="
                index < currentStep - 1
                  ? 'bg-[linear-gradient(90deg,rgb(var(--c-brand)/0.7),rgb(var(--c-brand)/0.2))]'
                  : 'bg-line/60'
              "
            />
          </li>
        </ol>
      </GlassPanel>

      <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <GlassPanel data-motion class="lg:col-span-2" title="订单信息" icon="i-lucide-clipboard-list">
          <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div
              v-for="item in [
                { label: '订单号', value: data.orderNo },
                { label: '客户', value: data.customer },
                { label: '渠道', value: data.channel },
                { label: '商品件数', value: `${data.items} 件` },
                { label: '下单时间', value: formatDate(data.createdAt) },
                { label: '订单 ID', value: data.id },
              ]"
              :key="item.label"
              class="rounded-xl border border-line/55 bg-elevated/30 px-3 py-2.5"
            >
              <dt class="text-[11px] text-text-dim">{{ item.label }}</dt>
              <dd class="mt-0.5 truncate text-[13px]">{{ item.value }}</dd>
            </div>
          </dl>
        </GlassPanel>

        <GlassPanel data-motion variant="raised" title="金额" icon="i-lucide-circle-dollar-sign">
          <p class="text-[30px] font-semibold leading-none tracking-tight">
            <span class="text-gradient">{{ formatCurrency(data.amount) }}</span>
          </p>
          <div class="mt-3 space-y-2 text-[12.5px]">
            <div class="flex-between">
              <span class="text-text-dim">商品金额</span>
              <span class="tabular">{{ formatCurrency(data.amount * 0.92) }}</span>
            </div>
            <div class="flex-between">
              <span class="text-text-dim">税费</span>
              <span class="tabular">{{ formatCurrency(data.amount * 0.08) }}</span>
            </div>
            <div class="flex-between border-t border-line/60 pt-2">
              <span class="text-text-dim">状态</span>
              <AppTag :tone="data.status === 'paid' ? 'success' : 'warning'" size="xs">
                {{ data.status }}
              </AppTag>
            </div>
          </div>
        </GlassPanel>
      </div>
    </template>

    <GlassPanel v-else data-motion>
      <p class="py-8 text-center text-[13px] text-text-dim">未找到该订单（ID: {{ orderId }}）</p>
    </GlassPanel>
  </div>
</template>
