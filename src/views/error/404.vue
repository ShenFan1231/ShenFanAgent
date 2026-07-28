<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
</script>

<template>
  <div class="flex-center min-h-[70vh] flex-col text-center">
    <div class="relative mb-6">
      <p class="select-none text-[92px] font-semibold leading-none tracking-tighter opacity-12">
        404
      </p>
      <span
        class="absolute inset-0 flex-center text-[92px] font-semibold leading-none tracking-tighter text-gradient"
      >
        404
      </span>
      <!-- 缓慢漂浮的装饰环，让空页面不至于太冷 -->
      <span class="orbit" />
    </div>

    <h1 class="text-[19px] font-semibold">这个页面不存在</h1>
    <p class="mt-2 max-w-96 text-[13px] leading-relaxed text-text-dim">
      地址可能已经变更或被删除。可以用 ⌘K 打开命令面板直接搜索页面。
    </p>

    <div class="mt-6 flex flex-wrap items-center justify-center gap-2.5">
      <AppButton variant="primary" icon="i-lucide-layout-dashboard" @click="router.push('/dashboard')">
        回到控制台
      </AppButton>
      <AppButton variant="soft" icon="i-lucide-corner-up-left" @click="router.back()">
        返回上一页
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
.orbit {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 200px;
  height: 200px;
  translate: -50% -50%;
  border-radius: 50%;
  border: 1px dashed rgb(var(--c-brand) / 0.25);
  animation: spin-slow 26s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .orbit {
    animation: none;
  }
}
</style>
