<script setup lang="ts">
/** 空状态：一个会缓慢呼吸的几何图形，比一张灰色插图更契合整体气质。 */
withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: string
    size?: 'sm' | 'md'
  }>(),
  { title: '暂无数据', size: 'md' },
)
</script>

<template>
  <div class="flex-center flex-col gap-3 text-center" :class="size === 'sm' ? 'py-8' : 'py-14'">
    <div class="empty-orb" :class="size === 'sm' ? 'size-16' : 'size-22'">
      <span class="empty-orb__ring" />
      <span class="empty-orb__ring empty-orb__ring--delay" />
      <i :class="[icon || 'i-lucide-inbox', 'relative text-xl text-text-dim']" />
    </div>
    <div class="space-y-1">
      <p class="text-sm font-medium text-text-soft">{{ title }}</p>
      <p v-if="description" class="mx-auto max-w-64 text-xs text-text-dim">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.empty-orb {
  position: relative;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, rgb(var(--c-brand) / 0.12), transparent 70%);
}

.empty-orb__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgb(var(--c-brand) / 0.28);
  animation: pulse-ring 3.2s var(--ease-out-expo) infinite;
}

.empty-orb__ring--delay {
  animation-delay: 1.4s;
}
</style>
