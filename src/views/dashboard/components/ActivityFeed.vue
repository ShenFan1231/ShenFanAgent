<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ActivityItem, ActivityType } from '@/api/types/dashboard'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppEmpty from '@/components/ui/AppEmpty.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import { formatDate, fromNow } from '@/utils/format'

const props = defineProps<{
  data?: ActivityItem[]
  loading: boolean
}>()

const filter = ref<'all' | ActivityType>('all')
const FILTERS = [
  { label: '全部', value: 'all' },
  { label: '交易', value: 'order' },
  { label: '用户', value: 'user' },
  { label: '系统', value: 'system' },
]

const TYPE_META: Record<ActivityType, { icon: string; class: string }> = {
  order: { icon: 'i-lucide-shopping-bag', class: 'text-success bg-success/12 ring-success/25' },
  user: { icon: 'i-lucide-user-plus', class: 'text-brand bg-brand/12 ring-brand/25' },
  system: { icon: 'i-lucide-server-cog', class: 'text-violet bg-violet/12 ring-violet/25' },
  security: { icon: 'i-lucide-shield-alert', class: 'text-danger bg-danger/12 ring-danger/25' },
  deploy: { icon: 'i-lucide-rocket', class: 'text-warning bg-warning/12 ring-warning/25' },
}

const list = computed(() => {
  const items = props.data ?? []
  return filter.value === 'all' ? items : items.filter((item) => item.type === filter.value)
})
</script>

<template>
  <GlassPanel
    variant="default"
    padding="none"
    class="flex h-full flex-col overflow-hidden"
    body-class="flex min-h-0 flex-1 flex-col"
  >
    <div class="flex flex-wrap items-center justify-between gap-2.5 px-5 pt-4.5">
      <div>
        <h3 class="text-[14.5px] font-semibold tracking-tight">实时动态</h3>
        <p class="mt-0.5 text-xs text-text-dim">操作审计与系统事件</p>
      </div>
      <AppSegmented
        :model-value="filter"
        :options="FILTERS"
        size="sm"
        @update:model-value="filter = $event as 'all' | ActivityType"
      />
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3.5">
      <AppSkeleton v-if="loading" variant="list" :rows="5" />

      <!-- 时间线：左侧竖线 + 图标节点，逐项错开进入 -->
      <TransitionGroup v-else-if="list.length" tag="ul" name="feed" class="relative">
        <li
          v-for="(item, index) in list"
          :key="item.id"
          class="feed-item group relative pb-4 pl-9 last:pb-0"
          :style="{ '--i': index }"
        >
          <span class="feed-line" />
          <span class="feed-node ring-1" :class="TYPE_META[item.type].class">
            <i :class="[TYPE_META[item.type].icon, 'text-[13px]']" />
          </span>

          <div
            class="rounded-xl border border-transparent px-2.5 py-1.5 transition-all duration-300 group-hover:border-line/60 group-hover:bg-elevated/45"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="text-[13px] font-medium leading-snug">{{ item.title }}</p>
              <time
                class="shrink-0 text-[10.5px] text-text-dim"
                :title="formatDate(item.createdAt)"
              >
                {{ fromNow(item.createdAt) }}
              </time>
            </div>
            <p class="mt-1 text-[11.5px] leading-relaxed text-text-dim">{{ item.description }}</p>
            <div class="mt-1.5 flex items-center gap-1.5">
              <AppAvatar :src="item.operator.avatar" :name="item.operator.name" :size="16" />
              <span class="text-[10.5px] text-text-dim">{{ item.operator.name }}</span>
            </div>
          </div>
        </li>
      </TransitionGroup>

      <AppEmpty v-else size="sm" title="暂无该类型的动态" icon="i-lucide-activity" />
    </div>
  </GlassPanel>
</template>

<style scoped>
.feed-line {
  position: absolute;
  left: 13px;
  top: 26px;
  bottom: -2px;
  width: 1px;
  background: linear-gradient(180deg, rgb(var(--c-line)), transparent);
}

.feed-item:last-child .feed-line {
  display: none;
}

.feed-node {
  position: absolute;
  left: 0;
  top: 2px;
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  border-radius: 10px;
  transition: transform 320ms var(--ease-out-back);
}

.feed-item:hover .feed-node {
  transform: scale(1.12);
}

.feed-enter-active {
  transition:
    opacity 420ms ease,
    transform 560ms var(--ease-out-expo);
  transition-delay: calc(var(--i, 0) * 42ms);
}

.feed-enter-from {
  opacity: 0;
  transform: translate3d(-14px, 6px, 0);
}

.feed-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
  position: absolute;
  width: 100%;
}

.feed-leave-to {
  opacity: 0;
  transform: translate3d(10px, 0, 0);
}

.feed-move {
  transition: transform 420ms var(--ease-out-expo);
}

@media (prefers-reduced-motion: reduce) {
  .feed-enter-active {
    transition-delay: 0ms;
  }
}
</style>
