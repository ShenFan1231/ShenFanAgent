<script setup lang="ts">
/**
 * 权限演示页。
 * 用同一组按钮直观展示 v-permission 的两种模式，并列出当前角色的完整权限清单。
 */
import { computed, ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { vPermission, vRole } from '@/directives'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import { PERMISSIONS, ROLE_META } from '@/types/permission'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.08 })

const userStore = useUserStore()
const permissionStore = usePermissionStore()
const appStore = useAppStore()

const owned = computed(() => new Set(userStore.permissions))
const menuCount = computed(() => {
  const count = (list: typeof permissionStore.menus): number =>
    list.reduce((sum, menu) => sum + 1 + (menu.children ? count(menu.children) : 0), 0)
  return count(permissionStore.menus)
})
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1200px] space-y-4">
    <PageHeader
      data-motion
      title="权限演示"
      description="菜单级、页面级、按钮级三层控制"
      icon="i-lucide-key-round"
    >
      <template #actions>
        <AppButton variant="soft" icon="i-lucide-user-cog" @click="appStore.settingsPanelOpen = false">
          <span class="hidden sm:inline">在右上角头像菜单切换角色</span>
          <span class="sm:hidden">切换角色</span>
        </AppButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3" data-motion>
      <GlassPanel variant="gradient" padding="sm">
        <p class="text-[11.5px] text-text-dim">当前角色</p>
        <p class="mt-1 text-[17px] font-semibold">
          {{ userStore.roles.map((role) => ROLE_META[role]?.name ?? role).join(' / ') }}
        </p>
      </GlassPanel>
      <GlassPanel padding="sm">
        <p class="text-[11.5px] text-text-dim">可见菜单项</p>
        <p class="tabular mt-1 text-[17px] font-semibold">{{ menuCount }}</p>
      </GlassPanel>
      <GlassPanel padding="sm">
        <p class="text-[11.5px] text-text-dim">持有权限</p>
        <p class="tabular mt-1 text-[17px] font-semibold">
          {{ userStore.permissions.length }} / {{ PERMISSIONS.length }}
        </p>
      </GlassPanel>
    </div>

    <GlassPanel
      data-motion
      title="按钮级权限"
      subtitle="没有权限的按钮会被直接移除；.disable 修饰符则保留但置灰"
      icon="i-lucide-square-mouse-pointer"
      edge
    >
      <div class="space-y-4">
        <div>
          <p class="mb-2 text-[11.5px] text-text-dim">移除模式 · v-permission="'user:create'"</p>
          <div class="flex flex-wrap gap-2">
            <AppButton v-permission="'user:view'" variant="soft" icon="i-lucide-eye">查看用户</AppButton>
            <AppButton v-permission="'user:create'" variant="soft" icon="i-lucide-user-plus">新增用户</AppButton>
            <AppButton v-permission="'user:delete'" variant="danger" icon="i-lucide-trash-2">删除用户</AppButton>
            <AppButton v-permission="'system:config'" variant="soft" icon="i-lucide-settings">系统配置</AppButton>
            <AppButton v-permission="'role:assign'" variant="soft" icon="i-lucide-shield">分配角色</AppButton>
          </div>
        </div>

        <div>
          <p class="mb-2 text-[11.5px] text-text-dim">置灰模式 · v-permission.disable</p>
          <div class="flex flex-wrap gap-2">
            <AppButton v-permission.disable="'order:refund'" variant="soft" icon="i-lucide-undo-2">
              订单退款
            </AppButton>
            <AppButton v-permission.disable="'user:delete'" variant="soft" icon="i-lucide-user-minus">
              移除成员
            </AppButton>
          </div>
        </div>

        <div>
          <p class="mb-2 text-[11.5px] text-text-dim">角色模式 · v-role="['super_admin']"</p>
          <div class="flex flex-wrap gap-2">
            <AppButton v-role="['super_admin']" variant="outline" icon="i-lucide-crown">
              仅超级管理员可见
            </AppButton>
            <AppButton v-role="['admin', 'super_admin']" variant="outline" icon="i-lucide-shield-check">
              管理员及以上可见
            </AppButton>
          </div>
        </div>
      </div>
    </GlassPanel>

    <GlassPanel
      data-motion
      title="权限清单"
      subtitle="绿色为当前角色持有"
      icon="i-lucide-list-checks"
      variant="raised"
    >
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="permission in PERMISSIONS"
          :key="permission"
          class="rounded-lg border px-2 py-1 font-mono text-[11px] transition-colors"
          :class="
            owned.has(permission)
              ? 'border-success/35 bg-success/10 text-success'
              : 'border-line/60 bg-elevated/30 text-text-dim/70 line-through'
          "
        >
          {{ permission }}
        </span>
      </div>
    </GlassPanel>

    <GlassPanel data-motion title="页面级权限" subtitle="路由守卫的处理策略" icon="i-lucide-route">
      <ul class="space-y-2 text-[12.5px] leading-relaxed text-text-soft">
        <li class="flex gap-2">
          <AppTag tone="brand" size="xs">1</AppTag>
          登录后按角色过滤 <code class="code">asyncRoutes</code>，只把可访问的路由
          <code class="code">addRoute</code> 进 router，菜单由同一份结果推导。
        </li>
        <li class="flex gap-2">
          <AppTag tone="brand" size="xs">2</AppTag>
          直接输入被过滤掉的地址时，守卫会区分"路径不存在"与"没有权限"，分别跳
          <code class="code">/error/404</code> 与 <code class="code">/error/403</code>。
        </li>
        <li class="flex gap-2">
          <AppTag tone="brand" size="xs">3</AppTag>
          切换角色会卸载旧的动态路由（保存了 addRoute 的返回值），重新生成整套菜单与缓存。
        </li>
      </ul>
    </GlassPanel>
  </div>
</template>

<style scoped>
.code {
  --uno: 'rounded bg-elevated/70 px-1 py-0.25 font-mono text-[11px] text-brand';
}
</style>
