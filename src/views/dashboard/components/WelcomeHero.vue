<script setup lang="ts">
import { computed } from 'vue'

import AppTag from '@/components/ui/AppTag.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import CountUp from '@/components/ui/CountUp.vue'
import { useNow } from '@/composables/useNow'
import { useUserStore } from '@/stores/user'
import { ROLE_META } from '@/types/permission'
import { formatDate, greetingOf } from '@/utils/format'

const props = defineProps<{
  onlineUsers: number
  qps: number
  updatedAt?: string
}>()

const userStore = useUserStore()
const now = useNow()

const greeting = computed(() => greetingOf(now.value))
const dateText = computed(() => formatDate(now.value, 'YYYY年MM月DD日 dddd'))
const timeText = computed(() => formatDate(now.value, 'HH:mm:ss'))
const roleName = computed(() => {
  const role = userStore.roles[0]
  return role ? ROLE_META[role].name : '访客'
})

/** 按时段给一句有针对性的提示，而不是永远同一句欢迎语 */
const hint = computed(() => {
  const hour = now.value.getHours()
  if (hour < 9) return '今日报表已在 07:00 生成，建议先看昨日转化漏斗。'
  if (hour < 12) return '上午是流量高峰，实时计算集群延迟略有升高，注意关注。'
  if (hour < 18) return `当前并发 ${props.qps} QPS，各服务水位正常，可以安排发布。`
  return '夜间批处理任务将在 23:30 启动，请确认数据同步队列已清空。'
})
</script>

<template>
  <section
    class="relative overflow-hidden rounded-2xl border border-line/60 bg-surface/55 backdrop-blur-xl"
  >
    <!-- 装饰层：斜向光带 + 右侧渐变球 + 细网格，纯 CSS，不占用 rAF -->
    <div class="hero-beam" />
    <div class="hero-orb" />
    <div class="hero-grid" />

    <div class="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2.5">
          <AppAvatar :src="userStore.avatar" :name="userStore.displayName" :size="44" ring />
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="truncate text-[20px] font-semibold tracking-tight sm:text-[23px]">
                {{ greeting }}，{{ userStore.displayName }}
              </h1>
              <AppTag tone="violet" size="xs">{{ roleName }}</AppTag>
            </div>
            <p class="mt-0.5 truncate text-[12.5px] text-text-dim">
              {{ userStore.profile?.department }} · {{ userStore.profile?.jobTitle }} ·
              已连续登录 {{ userStore.profile?.loginStreak ?? 0 }} 天
            </p>
          </div>
        </div>

        <p class="mt-4 max-w-160 text-[13px] leading-relaxed text-text-soft">
          {{ hint }}
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-text-dim">
          <span class="flex items-center gap-1.5">
            <i class="i-lucide-calendar-days text-[14px] text-brand/80" />{{ dateText }}
          </span>
          <span class="flex items-center gap-1.5">
            <i class="i-lucide-users text-[14px] text-brand/80" />在线
            <CountUp :value="onlineUsers" class="text-text-soft" :duration="1800" />人
          </span>
          <span v-if="updatedAt" class="flex items-center gap-1.5">
            <i class="i-lucide-refresh-cw text-[14px] text-brand/80" />数据更新于
            {{ formatDate(updatedAt, 'HH:mm:ss') }}
          </span>
        </div>
      </div>

      <!-- 时钟：等宽数字 + 呼吸分隔符，像数据终端而不是网页 -->
      <div class="shrink-0 lg:text-right">
        <p class="tabular text-[38px] font-semibold leading-none tracking-tight sm:text-[46px]">
          <span class="text-gradient">{{ timeText }}</span>
        </p>
        <div class="mt-2 flex items-center gap-2 lg:justify-end">
          <AppTag tone="success" dot size="xs">全部服务运行中</AppTag>
          <AppTag tone="brand" size="xs" icon="i-lucide-activity">
            <span class="tabular">{{ qps }}</span> QPS
          </AppTag>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-beam {
  position: absolute;
  top: -60%;
  left: -10%;
  width: 60%;
  height: 220%;
  background: linear-gradient(
    100deg,
    transparent,
    rgb(var(--c-brand) / 0.13) 45%,
    rgb(var(--c-violet) / 0.1) 60%,
    transparent
  );
  transform: rotate(12deg);
  animation: beam-slide 14s var(--ease-in-out-soft) infinite alternate;
  pointer-events: none;
}

.hero-orb {
  position: absolute;
  right: -6%;
  top: -80%;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(var(--c-violet) / 0.22), transparent 65%);
  pointer-events: none;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgb(var(--c-text) / 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(var(--c-text) / 0.045) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(120deg, black, transparent 62%);
  -webkit-mask-image: linear-gradient(120deg, black, transparent 62%);
  pointer-events: none;
}

@keyframes beam-slide {
  to {
    transform: rotate(12deg) translateX(38%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-beam {
    animation: none;
  }
}
</style>
