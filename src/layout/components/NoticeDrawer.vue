<script setup lang="ts">
import { computed, ref } from 'vue'

import { systemApi } from '@/api'
import type { NotificationItem } from '@/api/types/system'
import AppButton from '@/components/ui/AppButton.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import AppEmpty from '@/components/ui/AppEmpty.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { fromNow } from '@/utils/format'
import { toast } from '@/utils/toast'

const visible = defineModel<boolean>({ required: true })

const { data, loading, refresh } = useAsyncData<NotificationItem[]>(
  () => systemApi.notifications(),
  { initialData: [] },
)

const filter = ref('all')
const FILTERS = [
  { label: '全部', value: 'all' },
  { label: '系统', value: 'system' },
  { label: '待办', value: 'todo' },
  { label: '消息', value: 'message' },
]

const list = computed(() => {
  const items = data.value ?? []
  return filter.value === 'all' ? items : items.filter((item) => item.type === filter.value)
})

const unread = computed(() => (data.value ?? []).filter((item) => !item.read).length)

const TYPE_STYLE: Record<NotificationItem['type'], { icon: string; class: string }> = {
  system: { icon: 'i-lucide-server-cog', class: 'text-brand bg-brand/12' },
  todo: { icon: 'i-lucide-list-todo', class: 'text-warning bg-warning/12' },
  message: { icon: 'i-lucide-message-square-dot', class: 'text-violet bg-violet/12' },
}

async function markAll(): Promise<void> {
  await systemApi.readAllNotifications()
  ;(data.value ?? []).forEach((item) => (item.read = true))
  toast.success('已全部标记为已读')
}

defineExpose({ refresh, unread })
</script>

<template>
  <AppDrawer
    v-model="visible"
    title="通知中心"
    :subtitle="`${unread} 条未读`"
    icon="i-lucide-bell-ring"
    :width="400"
  >
    <template #actions>
      <AppButton variant="ghost" size="xs" icon="i-lucide-check-check" @click="markAll">
        全部已读
      </AppButton>
    </template>

    <AppSegmented v-model="filter" :options="FILTERS" size="sm" class="mb-3 w-full" />

    <AppSkeleton v-if="loading" variant="list" :rows="4" />

    <TransitionGroup v-else-if="list.length" tag="ul" name="stagger" class="relative space-y-2">
      <li
        v-for="(item, index) in list"
        :key="item.id"
        class="group relative rounded-xl border border-line/55 bg-elevated/40 p-3 transition-all duration-300 hover:border-brand/35 hover:bg-elevated/70"
        :style="{ transitionDelay: `${index * 18}ms` }"
      >
        <div class="flex items-start gap-2.5">
          <span class="flex-center size-8 shrink-0 rounded-xl" :class="TYPE_STYLE[item.type].class">
            <i :class="TYPE_STYLE[item.type].icon" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p class="text-[13px] font-medium leading-snug" :class="item.read ? 'text-text-soft' : 'text-text'">
                {{ item.title }}
              </p>
              <span
                v-if="!item.read"
                class="mt-1 size-1.5 shrink-0 rounded-full bg-brand shadow-[0_0_8px_rgb(var(--c-brand))]"
              />
            </div>
            <p class="mt-1 text-[11.5px] leading-relaxed text-text-dim">{{ item.content }}</p>
            <p class="mt-1.5 text-[10.5px] text-text-dim/80">{{ fromNow(item.createdAt) }}</p>
          </div>
        </div>
      </li>
    </TransitionGroup>

    <AppEmpty v-else title="没有新的通知" description="系统动态与待办会实时出现在这里" size="sm" />
  </AppDrawer>
</template>
