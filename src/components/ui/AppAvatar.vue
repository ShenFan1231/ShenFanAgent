<script setup lang="ts">
import { computed } from 'vue'

import { gradientAvatar } from '@/utils/avatar'

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    size?: number
    /** 外圈渐变描边，用于当前登录用户 */
    ring?: boolean
    status?: 'online' | 'busy' | 'offline'
  }>(),
  { size: 36, ring: false },
)

const source = computed(() => props.src || gradientAvatar(props.name || 'nebula', props.name))

const STATUS_CLASS = {
  online: 'bg-success',
  busy: 'bg-warning',
  offline: 'bg-text-dim',
} as const
</script>

<template>
  <span class="relative inline-flex shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <span
      v-if="ring"
      class="absolute -inset-0.5 rounded-full bg-[conic-gradient(from_140deg,rgb(var(--c-brand)),rgb(var(--c-violet)),rgb(var(--c-brand)))] opacity-80"
    />
    <img
      :src="source"
      :alt="name || 'avatar'"
      loading="lazy"
      class="relative size-full rounded-full object-cover ring-1 ring-line/60"
      :class="ring ? 'ring-2 ring-canvas' : ''"
    />
    <span
      v-if="status"
      class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-canvas"
      :class="STATUS_CLASS[status]"
    />
  </span>
</template>
