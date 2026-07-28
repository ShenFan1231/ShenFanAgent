<script setup lang="ts">
import { computed } from 'vue'

import type { SegmentOption } from './types'

const props = defineProps<{
  modelValue: string
  options: SegmentOption[]
  size?: 'sm' | 'md'
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const activeIndex = computed(() =>
  Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue),
  ),
)

/** 指示块用等宽栅格 + translateX 位移，切换时只有一次 transform 动画 */
const indicatorStyle = computed(() => ({
  width: `calc(${100 / Math.max(props.options.length, 1)}% - 4px)`,
  transform: `translateX(calc(${activeIndex.value * 100}% + ${activeIndex.value * 4}px))`,
}))
</script>

<template>
  <div
    class="relative inline-flex rounded-xl border border-line/70 bg-elevated/60 p-0.5"
    :class="size === 'sm' ? 'h-8' : 'h-9'"
    role="tablist"
  >
    <span
      class="absolute inset-y-0.5 left-0.5 rounded-[10px] bg-[linear-gradient(120deg,rgb(var(--c-brand)/0.22),rgb(var(--c-violet)/0.2))] ring-1 ring-brand/30 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
      :style="indicatorStyle"
    />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="tab"
      :aria-selected="option.value === modelValue"
      class="focus-ring relative z-1 flex-center flex-1 gap-1.5 rounded-[10px] px-3 text-[12.5px] font-medium transition-colors duration-200 whitespace-nowrap"
      :class="option.value === modelValue ? 'text-brand' : 'text-text-dim hover:text-text-soft'"
      @click="emit('update:modelValue', option.value)"
    >
      <i v-if="option.icon" :class="option.icon" />
      {{ option.label }}
    </button>
  </div>
</template>
