<script setup lang="ts">
/**
 * 骨架屏。
 * 用一条扫光（transform 位移）代替整块透明度闪烁，观感更接近"正在加载"而不是"坏了"。
 */
withDefaults(
  defineProps<{
    variant?: 'text' | 'card' | 'chart' | 'list' | 'stat'
    rows?: number
    height?: string
  }>(),
  { variant: 'text', rows: 3 },
)
</script>

<template>
  <div class="w-full space-y-3">
    <template v-if="variant === 'text'">
      <div
        v-for="row in rows"
        :key="row"
        class="skeleton-bar h-3.5 rounded-md"
        :style="{ width: `${100 - row * 8}%` }"
      />
    </template>

    <template v-else-if="variant === 'stat'">
      <div class="space-y-3.5">
        <div class="flex-between">
          <div class="skeleton-bar h-3 w-20 rounded-md" />
          <div class="skeleton-bar size-8 rounded-xl" />
        </div>
        <div class="skeleton-bar h-8 w-32 rounded-lg" />
        <div class="skeleton-bar h-8 w-full rounded-lg" />
      </div>
    </template>

    <template v-else-if="variant === 'chart'">
      <div class="flex-between">
        <div class="skeleton-bar h-3.5 w-28 rounded-md" />
        <div class="skeleton-bar h-7 w-36 rounded-lg" />
      </div>
      <div class="flex items-end gap-2" :style="{ height: height || '220px' }">
        <div
          v-for="i in 14"
          :key="i"
          class="skeleton-bar flex-1 rounded-t-md"
          :style="{ height: `${28 + ((i * 37) % 62)}%` }"
        />
      </div>
    </template>

    <template v-else-if="variant === 'list'">
      <div v-for="row in rows" :key="row" class="flex items-center gap-3">
        <div class="skeleton-bar size-9 shrink-0 rounded-full" />
        <div class="flex-1 space-y-2">
          <div class="skeleton-bar h-3 rounded-md" :style="{ width: `${58 + ((row * 13) % 32)}%` }" />
          <div class="skeleton-bar h-2.5 w-2/5 rounded-md" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="skeleton-bar rounded-xl" :style="{ height: height || '160px' }" />
    </template>
  </div>
</template>

<style scoped>
.skeleton-bar {
  position: relative;
  overflow: hidden;
  background: rgb(var(--c-elevated) / 0.9);
}

.skeleton-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgb(var(--c-text) / 0.07) 45%,
    rgb(var(--c-brand) / 0.09) 55%,
    transparent
  );
  animation: shimmer 1.6s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-bar::after {
    animation: none;
  }
}
</style>
