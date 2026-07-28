<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    icon?: string
    type?: 'text' | 'password' | 'search'
    clearable?: boolean
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  { type: 'text', clearable: false, size: 'md' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  enter: []
  clear: []
}>()

const showClear = computed(() => props.clearable && props.modelValue.length > 0)
</script>

<template>
  <div
    class="group relative flex items-center gap-2 rounded-xl border border-line/75 bg-elevated/55 px-3 transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-brand/55 focus-within:bg-elevated/80 focus-within:shadow-[0_0_0_3px_rgb(var(--c-brand)/0.12)]"
    :class="[size === 'sm' ? 'h-8' : 'h-9.5', disabled ? 'opacity-55' : '']"
  >
    <i v-if="icon" :class="[icon, 'shrink-0 text-text-dim transition-colors group-focus-within:text-brand']" />
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      class="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-dim"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keyup.enter="emit('enter')"
    />
    <Transition name="fade">
      <button
        v-if="showClear"
        type="button"
        class="flex-center size-4.5 shrink-0 rounded-full bg-line/60 text-[10px] text-text-dim transition hover:bg-danger/20 hover:text-danger"
        aria-label="清空"
        @click="emit('update:modelValue', ''), emit('clear')"
      >
        <i class="i-lucide-x" />
      </button>
    </Transition>
    <slot name="suffix" />
  </div>
</template>
