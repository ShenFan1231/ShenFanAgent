<script setup lang="ts">
/**
 * 控制台。
 *
 * 页面职责只有三件事：取数据、编排布局、串动画。
 * 每个区块都是独立组件，各自只接收 props —— 后续替换真实接口时不需要动 UI。
 */
import { computed, ref } from 'vue'

import { dashboardApi } from '@/api'
import type { RangeKey } from '@/api/types/common'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { usePolling } from '@/composables/usePolling'
import { toast } from '@/utils/toast'
import ActivityFeed from './components/ActivityFeed.vue'
import MetricCardItem from './components/MetricCard.vue'
import QuickActions from './components/QuickActions.vue'
import SystemStatusPanel from './components/SystemStatusPanel.vue'
import TrafficBreakdown from './components/TrafficBreakdown.vue'
import TrendPanel from './components/TrendPanel.vue'
import WelcomeHero from './components/WelcomeHero.vue'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef)

const range = ref<RangeKey>('7d')

const overview = useAsyncData(() => dashboardApi.overview())
const trend = useAsyncData(() => dashboardApi.trend(range.value), { watchSource: range })
const activities = useAsyncData(() => dashboardApi.activities(14), { initialData: [] })
const systemStatus = useAsyncData(() => dashboardApi.systemStatus())
const sources = useAsyncData(() => dashboardApi.trafficSources(), { initialData: [] })
const regions = useAsyncData(() => dashboardApi.regions(), { initialData: [] })

// 系统状态每 5 秒滚动一次；页面被缓存或切到后台时自动停
const polling = usePolling(async () => void (await systemStatus.refresh()), { interval: 5000 })

const metrics = computed(() => overview.data.value?.metrics ?? [])
const onlineUsers = computed(() => systemStatus.data.value?.onlineUsers ?? 0)
const qps = computed(() => systemStatus.data.value?.qps ?? 0)

/* ------------------------------------------------------------ 快捷操作 --- */
type ActionKey = 'create-user' | 'create-order' | 'publish-notice'

const ACTION_META: Record<ActionKey, { title: string; subtitle: string; icon: string; confirm: string }> = {
  'create-user': {
    title: '新建用户',
    subtitle: '创建后会向邮箱发送激活链接',
    icon: 'i-lucide-user-plus',
    confirm: '创建并发送邀请',
  },
  'create-order': {
    title: '创建订单',
    subtitle: '用于线下交易补录',
    icon: 'i-lucide-file-plus-2',
    confirm: '提交订单',
  },
  'publish-notice': {
    title: '发布通知',
    subtitle: '将推送至所有后台管理员',
    icon: 'i-lucide-megaphone',
    confirm: '立即发布',
  },
}

const activeAction = ref<ActionKey | null>(null)
const modalOpen = ref(false)
const submitting = ref(false)
const form = ref({ name: '', email: '', role: 'operator', content: '' })

const ROLE_OPTIONS = [
  { label: '超级管理员', value: 'super_admin' },
  { label: '管理员', value: 'admin' },
  { label: '运营', value: 'operator' },
]

function openAction(key: ActionKey): void {
  activeAction.value = key
  form.value = { name: '', email: '', role: 'operator', content: '' }
  modalOpen.value = true
}

/** 这里只做演示：真实项目应调用对应的 api 模块方法 */
async function submitAction(): Promise<void> {
  submitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 700))
  submitting.value = false
  modalOpen.value = false
  const meta = activeAction.value ? ACTION_META[activeAction.value] : null
  toast.success(`${meta?.title ?? '操作'}已提交`, '演示环境不会真正写入数据')
}
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1680px] space-y-4">
    <div data-motion>
      <WelcomeHero
        :online-users="onlineUsers"
        :qps="qps"
        :updated-at="overview.data.value?.updatedAt"
      />
    </div>

    <!-- 核心指标 -->
    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      <template v-if="overview.pristine.value && overview.loading.value">
        <GlassPanel v-for="i in 4" :key="`m-${i}`" data-motion>
          <AppSkeleton variant="stat" />
        </GlassPanel>
      </template>
      <div v-for="(metric, index) in metrics" v-else :key="metric.key" data-motion>
        <MetricCardItem :metric="metric" :index="index" />
      </div>
    </div>

    <!-- 趋势 + 系统状态 -->
    <div class="grid grid-cols-1 gap-3.5 xl:grid-cols-12">
      <div class="xl:col-span-8" data-motion>
        <TrendPanel
          :data="trend.data.value"
          :loading="trend.loading.value"
          :range="range"
          @update:range="range = $event"
        />
      </div>
      <div class="xl:col-span-4" data-motion>
        <SystemStatusPanel
          :data="systemStatus.data.value"
          :loading="systemStatus.pristine.value && systemStatus.loading.value"
          :live="polling.active.value"
        />
      </div>
    </div>

    <!-- 动态 + 流量结构 + 快捷操作 -->
    <div class="grid grid-cols-1 gap-3.5 xl:grid-cols-12">
      <div class="xl:col-span-5" data-motion>
        <ActivityFeed
          :data="activities.data.value"
          :loading="activities.pristine.value && activities.loading.value"
          class="h-full max-h-[520px]"
        />
      </div>
      <div class="xl:col-span-4" data-motion>
        <TrafficBreakdown
          :sources="sources.data.value"
          :regions="regions.data.value"
          :loading="sources.loading.value"
        />
      </div>
      <div class="xl:col-span-3" data-motion>
        <QuickActions @action="openAction" />
      </div>
    </div>

    <!-- 快捷操作弹窗：同一个壳按操作类型切换表单 -->
    <AppModal
      v-model="modalOpen"
      :title="activeAction ? ACTION_META[activeAction].title : ''"
      :subtitle="activeAction ? ACTION_META[activeAction].subtitle : ''"
      :icon="activeAction ? ACTION_META[activeAction].icon : ''"
      :confirm-text="activeAction ? ACTION_META[activeAction].confirm : '确定'"
      :confirm-loading="submitting"
      @confirm="submitAction"
    >
      <div class="space-y-3.5">
        <template v-if="activeAction === 'create-user'">
          <label class="field">
            <span class="field-label">用户昵称</span>
            <AppInput v-model="form.name" placeholder="请输入昵称" icon="i-lucide-user" />
          </label>
          <label class="field">
            <span class="field-label">邮箱</span>
            <AppInput v-model="form.email" placeholder="name@nebula.io" icon="i-lucide-mail" />
          </label>
          <label class="field">
            <span class="field-label">角色</span>
            <AppSelect v-model="form.role" :options="ROLE_OPTIONS" :width="200" />
          </label>
        </template>

        <template v-else-if="activeAction === 'create-order'">
          <label class="field">
            <span class="field-label">客户名称</span>
            <AppInput v-model="form.name" placeholder="请输入客户名称" icon="i-lucide-building-2" />
          </label>
          <label class="field">
            <span class="field-label">订单金额</span>
            <AppInput v-model="form.content" placeholder="0.00" icon="i-lucide-circle-dollar-sign" />
          </label>
        </template>

        <template v-else>
          <label class="field">
            <span class="field-label">通知标题</span>
            <AppInput v-model="form.name" placeholder="一句话说明这条通知" icon="i-lucide-type" />
          </label>
          <label class="field">
            <span class="field-label">通知内容</span>
            <textarea
              v-model="form.content"
              rows="4"
              placeholder="支持纯文本，发布后不可撤回"
              class="w-full resize-none rounded-xl border border-line/75 bg-elevated/55 px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-text-dim focus:border-brand/55"
            />
          </label>
        </template>

        <p class="flex items-start gap-1.5 rounded-xl bg-brand/8 p-2.5 text-[11.5px] text-text-dim">
          <i class="i-lucide-info mt-0.5 shrink-0 text-brand" />
          该表单用于演示弹窗过渡与权限控制，提交后不会真正写入数据。
        </p>
      </div>

      <template #footer>
        <AppButton variant="ghost" @click="modalOpen = false">取消</AppButton>
        <AppButton variant="primary" :loading="submitting" @click="submitAction">
          {{ activeAction ? ACTION_META[activeAction].confirm : '确定' }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.field {
  --uno: 'block space-y-1.5';
}

.field-label {
  --uno: 'block text-[12px] text-text-soft';
}
</style>
