<script setup lang="ts">
import { dismissToast, toasts, type ToastType } from '@/utils/toast'

const ICON: Record<ToastType, string> = {
  success: 'i-lucide-circle-check',
  error: 'i-lucide-circle-alert',
  warning: 'i-lucide-triangle-alert',
  info: 'i-lucide-info',
}

const TONE: Record<ToastType, string> = {
  success: 'text-success border-success/30',
  error: 'text-danger border-danger/30',
  warning: 'text-warning border-warning/30',
  info: 'text-brand border-brand/30',
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="toast"
      class="pointer-events-none fixed right-4 top-4 z-2000 flex w-[min(340px,calc(100vw-32px))] flex-col gap-2"
    >
      <div
        v-for="item in toasts"
        :key="item.id"
        class="panel pointer-events-auto flex items-start gap-2.5 border-l-2 p-3.5"
        :class="TONE[item.type]"
      >
        <i :class="[ICON[item.type], 'mt-0.5 shrink-0']" />
        <div class="min-w-0 flex-1">
          <p class="text-[13px] font-medium text-text">{{ item.title }}</p>
          <p v-if="item.description" class="mt-0.5 break-words text-[11.5px] text-text-dim">
            {{ item.description }}
          </p>
        </div>
        <button
          class="flex-center size-5 shrink-0 rounded-md text-text-dim transition hover:bg-elevated hover:text-text"
          aria-label="关闭提示"
          @click="dismissToast(item.id)"
        >
          <i class="i-lucide-x text-[11px]" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<style scoped>
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 280ms ease,
    transform 420ms var(--ease-out-expo);
}

.toast-enter-from {
  opacity: 0;
  transform: translate3d(24px, -8px, 0) scale(0.94);
}

.toast-leave-to {
  opacity: 0;
  transform: translate3d(24px, 0, 0) scale(0.96);
}

.toast-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}
</style>
