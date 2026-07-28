<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { computed, nextTick, ref } from 'vue'

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
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})
const popOrigin = ref('top left')

const current = computed(() => props.options.find((option) => option.value === props.modelValue))

function updateMenuPosition(): void {
  const root = rootRef.value
  if (!root) return

  const rect = root.getBoundingClientRect()
  const gap = 6
  const viewportPadding = 8
  const menuHeight = menuRef.value?.offsetHeight ?? 0
  const maxLeft = Math.max(viewportPadding, window.innerWidth - rect.width - viewportPadding)
  const left = Math.min(Math.max(rect.left, viewportPadding), maxLeft)
  let top = rect.bottom + gap

  if (menuHeight && top + menuHeight > window.innerHeight - viewportPadding && rect.top > menuHeight + gap) {
    top = rect.top - menuHeight - gap
    popOrigin.value = 'bottom left'
  } else {
    popOrigin.value = 'top left'
  }

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${rect.width}px`,
    zIndex: '10000',
  }
}

async function toggle(): Promise<void> {
  if (open.value) {
    open.value = false
    return
  }

  updateMenuPosition()
  open.value = true
  await nextTick()
  updateMenuPosition()
}

useEventListener(document, 'pointerdown', (event) => {
  const target = event.target as Node | null
  if (!target || rootRef.value?.contains(target) || menuRef.value?.contains(target)) return
  open.value = false
})

useEventListener(
  window,
  'scroll',
  () => {
    if (open.value) updateMenuPosition()
  },
  { capture: true, passive: true },
)

useEventListener(window, 'resize', () => {
  if (open.value) updateMenuPosition()
})

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
      @click="toggle"
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

    <Teleport to="body">
      <Transition name="pop">
        <div
          v-if="open"
          ref="menuRef"
          class="panel fixed max-h-[calc(100vh-1rem)] overflow-y-auto p-1.5"
          :style="{ ...menuStyle, '--pop-origin': popOrigin }"
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
    </Teleport>
  </div>
</template>
