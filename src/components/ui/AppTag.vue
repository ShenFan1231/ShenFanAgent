<script setup lang="ts">
type Tone = 'brand' | 'violet' | 'success' | 'warning' | 'danger' | 'neutral'

withDefaults(
  defineProps<{
    tone?: Tone
    icon?: string
    /** 左侧呼吸圆点，用于"运行中 / 在线"这类状态 */
    dot?: boolean
    size?: 'xs' | 'sm'
  }>(),
  { tone: 'neutral', dot: false, size: 'sm' },
)

const TONE_CLASS: Record<Tone, string> = {
  brand: 'bg-brand/12 text-brand ring-brand/25',
  violet: 'bg-violet/12 text-violet ring-violet/25',
  success: 'bg-success/12 text-success ring-success/25',
  warning: 'bg-warning/14 text-warning ring-warning/28',
  danger: 'bg-danger/12 text-danger ring-danger/25',
  neutral: 'bg-elevated/80 text-text-soft ring-line/70',
}

const DOT_CLASS: Record<Tone, string> = {
  brand: 'bg-brand',
  violet: 'bg-violet',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-text-dim',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full ring-1 font-medium whitespace-nowrap"
    :class="[TONE_CLASS[tone], size === 'xs' ? 'px-1.5 py-0.25 text-[10px]' : 'px-2 py-0.5 text-[11px]']"
  >
    <span v-if="dot" class="relative flex size-1.5">
      <span
        class="absolute inline-flex size-full rounded-full opacity-70"
        :class="DOT_CLASS[tone]"
        style="animation: pulse-ring 2.4s var(--ease-out-expo) infinite"
      />
      <span class="relative inline-flex size-1.5 rounded-full" :class="DOT_CLASS[tone]" />
    </span>
    <i v-if="icon" :class="icon" />
    <slot />
  </span>
</template>
