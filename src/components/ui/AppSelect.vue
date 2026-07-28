<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { computed, ref } from 'vue'

import type { SelectOption } from './types'

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    placeholder?: string
    icon?: string
    width?: number
    size?: 'sm' | 'md'
  }>(),
  { placeholder: '请选择', size: 'md', width: 148 },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
onClickOutside(rootRef, () => (open.value = false))

const current = computed(() => props.options.find((option) => option.value === props.modelValue))

function select(value: string): void {
  emit('update:modelValue', value)
  open.value = false
}
</script>

<template>
  <div ref="rootRef" class="relative" :style="{ width: `${width}px` }">
    <button
      type="button"
      class="focus-ring flex w-full items-center gap-2 rounded-xl border bg-elevated/55 px-3 text-[13px] transition-colors duration-200"
      :class="[
        size === 'sm' ? 'h-8' : 'h-9.5',
        open ? 'border-brand/55 text-text' : 'border-line/75 text-text-soft hover:border-line',
      ]"
      @click="open = !open"
    >
      <i v-if="icon || current?.icon" :class="[current?.icon || icon, 'shrink-0 text-text-dim']" />
      <span class="flex-1 truncate text-left" :class="current ? '' : 'text-text-dim'">
        {{ current?.label ?? placeholder }}
      </span>
      <i
        class="i-lucide-chevron-down shrink-0 text-[13px] text-text-dim transition-transform duration-300"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <Transition name="pop">
      <div
        v-if="open"
        class="panel absolute left-0 z-100 mt-1.5 w-full overflow-hidden p-1.5"
        style="--pop-origin: top left"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.75 text-[13px] transition-colors"
          :class="
            option.value === modelValue
              ? 'bg-brand/12 text-brand'
              : 'text-text-soft hover:bg-elevated hover:text-text'
          "
          @click="select(option.value)"
        >
          <i v-if="option.icon" :class="[option.icon, 'shrink-0']" />
          <span class="flex-1 truncate text-left">{{ option.label }}</span>
          <i v-if="option.value === modelValue" class="i-lucide-check shrink-0 text-[13px]" />
        </button>
      </div>
    </Transition>
  </div>
</template>
