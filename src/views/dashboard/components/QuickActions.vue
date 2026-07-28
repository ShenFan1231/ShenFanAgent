<script setup lang="ts">
import { useRouter } from 'vue-router'

import GlassPanel from '@/components/ui/GlassPanel.vue'
import { vPermission } from '@/directives'
import type { PermissionKey } from '@/types/permission'

/**
 * 快捷操作。
 * 每个入口都挂了 v-permission，运营角色登录时会自动少掉几个按钮 ——
 * 这是按钮级权限最直观的验证场景。
 */
interface QuickAction {
  key: string
  label: string
  description: string
  icon: string
  permission: PermissionKey
  tone: 'brand' | 'violet' | 'success' | 'warning' | 'danger'
  to?: string
  event?: 'create-user' | 'create-order' | 'publish-notice'
}

const emit = defineEmits<{ action: [key: NonNullable<QuickAction['event']>] }>()

const router = useRouter()

const ACTIONS: QuickAction[] = [
  {
    key: 'user',
    label: '新建用户',
    description: '邀请成员并分配角色',
    icon: 'i-lucide-user-plus',
    permission: 'user:create',
    tone: 'brand',
    event: 'create-user',
  },
  {
    key: 'order',
    label: '创建订单',
    description: '手动录入线下交易',
    icon: 'i-lucide-file-plus-2',
    permission: 'order:create',
    tone: 'success',
    event: 'create-order',
  },
  {
    key: 'notice',
    label: '发布通知',
    description: '推送全站公告',
    icon: 'i-lucide-megaphone',
    permission: 'notice:publish',
    tone: 'violet',
    event: 'publish-notice',
  },
  {
    key: 'report',
    label: '查看报表',
    description: '经营分析看板',
    icon: 'i-lucide-chart-spline',
    permission: 'report:view',
    tone: 'warning',
    to: '/analytics',
  },
  {
    key: 'setting',
    label: '系统设置',
    description: '参数与安全策略',
    icon: 'i-lucide-sliders-horizontal',
    permission: 'system:config',
    tone: 'danger',
    to: '/system/setting',
  },
]

const TONE: Record<QuickAction['tone'], string> = {
  brand: 'text-brand bg-brand/10 ring-brand/22 group-hover/tile:bg-brand/18',
  violet: 'text-violet bg-violet/10 ring-violet/22 group-hover/tile:bg-violet/18',
  success: 'text-success bg-success/10 ring-success/22 group-hover/tile:bg-success/18',
  warning: 'text-warning bg-warning/10 ring-warning/22 group-hover/tile:bg-warning/18',
  danger: 'text-danger bg-danger/10 ring-danger/22 group-hover/tile:bg-danger/18',
}

function run(action: QuickAction): void {
  if (action.to) void router.push(action.to)
  else if (action.event) emit('action', action.event)
}
</script>

<template>
  <GlassPanel
    variant="outline"
    title="快捷操作"
    subtitle="按当前角色权限展示"
    icon="i-lucide-zap"
    padding="none"
    class="flex h-full flex-col"
  >
    <div class="grid grid-cols-1 gap-2 px-5 pb-5 pt-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
      <button
        v-for="action in ACTIONS"
        :key="action.key"
        v-permission="action.permission"
        class="tile group/tile"
        @click="run(action)"
      >
        <span class="flex-center size-9 shrink-0 rounded-xl ring-1 transition-all duration-300" :class="TONE[action.tone]">
          <i :class="[action.icon, 'text-[17px]']" />
        </span>
        <span class="min-w-0">
          <span class="block truncate text-[12.5px] font-medium">{{ action.label }}</span>
          <span class="block truncate text-[10.5px] text-text-dim">{{ action.description }}</span>
        </span>
        <i
          class="i-lucide-arrow-up-right ml-auto shrink-0 text-[13px] text-text-dim opacity-0 transition-all duration-300 group-hover/tile:translate-x-0.5 group-hover/tile:opacity-100"
        />
      </button>
    </div>
  </GlassPanel>
</template>

<style scoped>
.tile {
  --uno: 'flex items-center gap-2.5 rounded-xl border border-line/55 bg-elevated/30 p-2.5 text-left transition-all duration-300';
}

.tile:hover {
  --uno: 'border-brand/35 bg-elevated/60 -translate-y-0.5 shadow-[0_10px_28px_-16px_rgb(var(--c-brand)/0.6)]';
}

.tile:active {
  --uno: 'translate-y-0 scale-[0.98]';
}
</style>
