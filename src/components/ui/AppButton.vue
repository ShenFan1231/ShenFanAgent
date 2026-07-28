<script setup lang="ts">
import { computed } from 'vue'

import { vRipple } from '@/directives'

type Variant = 'primary' | 'soft' | 'ghost' | 'outline' | 'danger' | 'text'
type Size = 'xs' | 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    icon?: string
    iconRight?: string
    loading?: boolean
    disabled?: boolean
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'soft',
    size: 'md',
    loading: false,
    disabled: false,
    block: false,
    type: 'button',
  },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const VARIANT_CLASS: Record<Variant, string> = {
  // 主按钮：渐变 + 外发光，全站唯一的高饱和元素
  primary:
    'text-[#04121a] font-semibold bg-[linear-gradient(120deg,rgb(var(--c-brand)),rgb(var(--c-violet)))] shadow-[0_10px_30px_-12px_rgb(var(--c-brand)/0.75)] hover:shadow-[0_14px_38px_-12px_rgb(var(--c-brand)/0.9)] hover:brightness-110',
  soft: 'bg-elevated/80 text-text border border-line/80 hover:border-brand/40 hover:text-brand hover:bg-elevated',
  ghost: 'text-text-soft hover:text-text hover:bg-elevated/70',
  outline: 'border border-brand/40 text-brand hover:bg-brand/10',
  danger: 'bg-danger/12 text-danger border border-danger/30 hover:bg-danger/20',
  text: 'text-text-soft hover:text-brand',
}

const SIZE_CLASS: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-lg',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-9.5 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
}

const isDisabled = computed(() => props.disabled || props.loading)

function onClick(event: MouseEvent) {
  if (isDisabled.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    v-ripple
    :type="type"
    :disabled="isDisabled"
    class="focus-ring relative inline-flex select-none items-center justify-center whitespace-nowrap transition-[transform,background-color,border-color,box-shadow,color] duration-200 active:scale-[0.97]"
    :class="[
      VARIANT_CLASS[variant],
      SIZE_CLASS[size],
      block ? 'w-full' : '',
      isDisabled ? 'cursor-not-allowed opacity-55 active:scale-100' : '',
    ]"
    @click="onClick"
  >
    <i v-if="loading" class="i-lucide-loader-circle shrink-0 animate-spin" />
    <i v-else-if="icon" :class="[icon, 'shrink-0']" />
    <slot />
    <i v-if="iconRight && !loading" :class="[iconRight, 'shrink-0']" />
  </button>
</template>
