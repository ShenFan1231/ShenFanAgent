<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    icon?: string
    width?: number
    placement?: 'left' | 'right'
    maskClosable?: boolean
  }>(),
  { width: 380, placement: 'right', maskClosable: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function close(): void {
  emit('update:modelValue', false)
}

onKeyStroke('Escape', () => {
  if (props.modelValue) close()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-999">
      <Transition name="modal-mask" appear>
        <div
          class="absolute inset-0 bg-[rgb(2_5_12/0.5)] backdrop-blur-[4px]"
          @click="maskClosable && close()"
        />
      </Transition>

      <Transition :name="placement === 'right' ? 'drawer-panel' : 'drawer-panel-left'" appear>
        <aside
          class="absolute inset-y-0 flex flex-col border-line/70 bg-surface/92 shadow-[0_0_80px_-20px_rgb(0_0_0/0.8)] backdrop-blur-2xl"
          :class="placement === 'right' ? 'right-0 border-l' : 'left-0 border-r'"
          :style="{ width: `min(${width}px, 92vw)` }"
        >
          <header class="flex-between shrink-0 gap-3 border-b border-line/60 px-4.5 py-4">
            <div class="flex items-center gap-2.5 min-w-0">
              <span v-if="icon" class="flex-center size-8 rounded-xl bg-brand/12 text-brand">
                <i :class="icon" />
              </span>
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold">{{ title }}</h3>
                <p v-if="subtitle" class="truncate text-xs text-text-dim">{{ subtitle }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <slot name="actions" />
              <button
                class="focus-ring flex-center size-8 rounded-lg text-text-dim transition hover:bg-elevated hover:text-text"
                aria-label="关闭"
                @click="close"
              >
                <i class="i-lucide-x" />
              </button>
            </div>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto px-4.5 py-4">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="shrink-0 border-t border-line/60 px-4.5 py-3">
            <slot name="footer" />
          </footer>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>

<style>
.drawer-panel-left-enter-active {
  transition: transform 420ms var(--ease-out-expo);
}

.drawer-panel-left-leave-active {
  transition: transform 260ms var(--ease-in-out-soft);
}

.drawer-panel-left-enter-from,
.drawer-panel-left-leave-to {
  transform: translate3d(-100%, 0, 0);
}
</style>
