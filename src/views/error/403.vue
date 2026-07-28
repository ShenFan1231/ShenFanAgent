<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppButton from '@/components/ui/AppButton.vue'
import AppTag from '@/components/ui/AppTag.vue'
import { useUserStore } from '@/stores/user'
import { ROLE_META } from '@/types/permission'

const router = useRouter()
const userStore = useUserStore()
</script>

<template>
  <div class="flex-center min-h-[70vh] flex-col text-center">
    <div class="relative mb-6">
      <p class="select-none text-[92px] font-semibold leading-none tracking-tighter opacity-12">
        403
      </p>
      <span
        class="absolute inset-0 flex-center text-[92px] font-semibold leading-none tracking-tighter text-gradient"
      >
        403
      </span>
    </div>

    <h1 class="text-[19px] font-semibold">当前角色无权访问该页面</h1>
    <p class="mt-2 max-w-100 text-[13px] leading-relaxed text-text-dim">
      这个路径存在，但被路由守卫按角色 / 权限拦下了。
      可以切换到更高权限的演示角色，再重新进入。
    </p>

    <div class="mt-4 flex items-center gap-2">
      <span class="text-[12px] text-text-dim">当前角色：</span>
      <AppTag v-for="role in userStore.roles" :key="role" tone="violet" size="xs">
        {{ ROLE_META[role]?.name ?? role }}
      </AppTag>
    </div>

    <div class="mt-6 flex flex-wrap items-center justify-center gap-2.5">
      <AppButton variant="primary" icon="i-lucide-layout-dashboard" @click="router.push('/dashboard')">
        回到控制台
      </AppButton>
      <AppButton variant="soft" icon="i-lucide-key-round" @click="router.push('/lab/permission')">
        查看权限说明
      </AppButton>
    </div>
  </div>
</template>
