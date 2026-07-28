<script setup lang="ts">
import { ref } from 'vue'

import { dashboardApi } from '@/api'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import SparkLine from '@/components/charts/SparkLine.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { useUserStore } from '@/stores/user'
import { ROLE_META } from '@/types/permission'
import { formatDate, fromNow } from '@/utils/format'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.08 })

const userStore = useUserStore()
const { data: activities, loading } = useAsyncData(() => dashboardApi.activities(6), {
  initialData: [],
})

const CONTRIBUTION = [4, 8, 6, 12, 9, 14, 11, 18, 15, 22, 19, 26, 24, 31]
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1100px] space-y-4">
    <PageHeader data-motion title="个人中心" description="账号信息与近期操作" icon="i-lucide-id-card" />

    <GlassPanel data-motion variant="gradient" padding="none" edge>
      <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <AppAvatar :src="userStore.avatar" :name="userStore.displayName" :size="72" ring />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-[19px] font-semibold tracking-tight">{{ userStore.displayName }}</h2>
            <AppTag v-for="role in userStore.roles" :key="role" tone="violet" size="xs">
              {{ ROLE_META[role]?.name ?? role }}
            </AppTag>
          </div>
          <p class="mt-1 text-[12.5px] text-text-dim">
            {{ userStore.profile?.department }} · {{ userStore.profile?.jobTitle }}
          </p>
          <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-text-soft">
            <span class="flex items-center gap-1.5">
              <i class="i-lucide-mail text-text-dim" />{{ userStore.profile?.email }}
            </span>
            <span class="flex items-center gap-1.5">
              <i class="i-lucide-phone text-text-dim" />{{ userStore.profile?.phone }}
            </span>
            <span class="flex items-center gap-1.5">
              <i class="i-lucide-map-pin text-text-dim" />{{ userStore.profile?.lastLoginIp }}
            </span>
          </div>
        </div>
        <AppButton variant="soft" icon="i-lucide-pencil">编辑资料</AppButton>
      </div>
    </GlassPanel>

    <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      <GlassPanel data-motion title="账号概览" icon="i-lucide-user-check">
        <dl class="space-y-2.5 text-[12.5px]">
          <div class="flex-between">
            <dt class="text-text-dim">用户 ID</dt>
            <dd class="font-mono text-[11.5px]">{{ userStore.profile?.id }}</dd>
          </div>
          <div class="flex-between">
            <dt class="text-text-dim">连续登录</dt>
            <dd class="tabular">{{ userStore.profile?.loginStreak }} 天</dd>
          </div>
          <div class="flex-between">
            <dt class="text-text-dim">上次登录</dt>
            <dd>{{ userStore.profile ? formatDate(userStore.profile.lastLoginAt, 'MM-DD HH:mm') : '—' }}</dd>
          </div>
          <div class="flex-between">
            <dt class="text-text-dim">权限数量</dt>
            <dd class="tabular">{{ userStore.permissions.length }}</dd>
          </div>
        </dl>
        <div class="mt-4">
          <p class="mb-1 text-[11px] text-text-dim">近两周操作活跃度</p>
          <SparkLine :data="CONTRIBUTION" tone="violet" :height="48" />
        </div>
      </GlassPanel>

      <GlassPanel data-motion class="lg:col-span-2" title="我的近期操作" icon="i-lucide-history">
        <AppSkeleton v-if="loading" variant="list" :rows="4" />
        <ul v-else class="space-y-2">
          <li
            v-for="item in activities"
            :key="item.id"
            class="flex items-start gap-3 rounded-xl border border-line/50 bg-elevated/30 px-3 py-2.5 transition-colors hover:border-brand/30"
          >
            <AppAvatar :src="item.operator.avatar" :name="item.operator.name" :size="26" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[12.5px] font-medium">{{ item.title }}</p>
              <p class="truncate text-[11px] text-text-dim">{{ item.description }}</p>
            </div>
            <time class="shrink-0 text-[10.5px] text-text-dim">{{ fromNow(item.createdAt) }}</time>
          </li>
        </ul>
      </GlassPanel>
    </div>
  </div>
</template>
