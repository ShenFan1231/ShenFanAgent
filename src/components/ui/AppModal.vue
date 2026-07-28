<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'

import AppButton from './AppButton.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    icon?: string
    width?: number
    maskClosable?: boolean
    hideFooter?: boolean
    confirmText?: string
    cancelText?: string
    confirmLoading?: boolean
  }>(),
  {
    width: 520,
    maskClosable: true,
    hideFooter: false,
    confirmText: '确定',
    cancelText: '取消',
    confirmLoading: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)

function close(): void {
  emit('update:modelValue', false)
  emit('close')
}

onKeyStroke('Escape', () => {
  if (props.modelValue) close()
})

// 打开后把焦点移进弹窗，Esc / Tab 才有正确的落点
watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) return
    await nextTick()
    panelRef.value?.focus()
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-1000 flex items-center justify-center p-4">
      <Transition name="modal-mask" appear>
        <div
          class="absolute inset-0 bg-[rgb(2_5_12/0.6)] backdrop-blur-[6px]"
          @click="maskClosable && close()"
        />
      </Transition>

      <Transition name="modal-panel" appear>
        <div
          ref="panelRef"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          class="panel edge-light relative w-full overflow-hidden outline-none"
          :style="{ maxWidth: `${width}px` }"
        >
          <!-- 顶部辉光：让弹窗有"从深处浮出"的层次 -->
          <div
            class="pointer-events-none absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-brand/12 blur-3xl"
          />

          <header class="flex-between gap-4 border-b border-line/60 px-5 py-4">
            <div class="flex items-center gap-3 min-w-0">
              <span
                v-if="icon"
                class="flex-center size-9 shrink-0 rounded-xl bg-brand/12 text-brand ring-1 ring-brand/20"
              >
                <i :class="icon" />
              </span>
              <div class="min-w-0">
                <h3 class="truncate text-[15px] font-semibold">{{ title }}</h3>
                <p v-if="subtitle" class="truncate text-xs text-text-dim">{{ subtitle }}</p>
              </div>
            </div>
            <button
              class="focus-ring flex-center size-8 rounded-lg text-text-dim transition hover:bg-elevated hover:text-text"
              aria-label="关闭"
              @click="close"
            >
              <i class="i-lucide-x" />
            </button>
          </header>

          <div class="max-h-[62vh] overflow-y-auto px-5 py-5">
            <slot />
          </div>

          <footer
            v-if="!hideFooter"
            class="flex items-center justify-end gap-2.5 border-t border-line/60 bg-elevated/40 px-5 py-3.5"
          >
            <slot name="footer">
              <AppButton variant="ghost" @click="close">{{ cancelText }}</AppButton>
              <AppButton variant="primary" :loading="confirmLoading" @click="emit('confirm')">
                {{ confirmText }}
              </AppButton>
            </slot>
          </footer>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
