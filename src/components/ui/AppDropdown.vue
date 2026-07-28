<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { ref } from 'vue'

withDefaults(
  defineProps<{
    /** 菜单相对触发器的对齐方式 */
    align?: 'left' | 'right'
    width?: number
    /** 变换原点，配合 pop 过渡让展开方向符合直觉 */
    origin?: string
  }>(),
  { align: 'right', width: 200, origin: 'top right' },
)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

onClickOutside(rootRef, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

function toggle(): void {
  open.value = !open.value
}

defineExpose({ close: () => (open.value = false) })
</script>

<template>
  <div ref="rootRef" class="relative">
    <div class="cursor-pointer select-none" @click="toggle">
      <slot name="trigger" :open="open" />
    </div>

    <Transition name="pop">
      <div
        v-if="open"
        class="panel absolute z-100 mt-2 overflow-hidden p-1.5"
        :class="align === 'right' ? 'right-0' : 'left-0'"
        :style="{ width: `${width}px`, '--pop-origin': origin }"
        @click="open = false"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>
