<script setup lang="ts">
defineProps<{ collapsed: boolean }>()
</script>

<template>
  <RouterLink
    to="/dashboard"
    class="focus-ring flex h-[var(--header-h)] shrink-0 items-center gap-2.5 overflow-hidden px-4"
  >
    <!-- 图形标记：三段旋转的弧线，收起状态下它就是唯一的品牌线索 -->
    <span class="relative flex-center size-9 shrink-0">
      <span class="brand-ring" />
      <span class="brand-ring brand-ring--mid" />
      <span
        class="relative size-2.5 rounded-full bg-[linear-gradient(140deg,rgb(var(--c-brand)),rgb(var(--c-violet)))] shadow-[0_0_12px_rgb(var(--c-brand)/0.9)]"
      />
    </span>

    <Transition name="fade-slide">
      <span v-if="!collapsed" class="min-w-0 whitespace-nowrap">
        <span class="block text-[15px] font-semibold leading-tight tracking-[0.26em]">NEBULA</span>
        <span class="block text-[10px] leading-tight text-text-dim tracking-[0.16em]">
          DATA CONTROL
        </span>
      </span>
    </Transition>
  </RouterLink>
</template>

<style scoped>
.brand-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid transparent;
  border-top-color: rgb(var(--c-brand) / 0.85);
  border-right-color: rgb(var(--c-violet) / 0.55);
  animation: spin-slow 9s linear infinite;
}

.brand-ring--mid {
  inset: 5px;
  border-top-color: rgb(var(--c-violet) / 0.7);
  border-right-color: transparent;
  border-left-color: rgb(var(--c-brand) / 0.5);
  animation-duration: 5.5s;
  animation-direction: reverse;
}

@media (prefers-reduced-motion: reduce) {
  .brand-ring {
    animation: none;
  }
}
</style>
