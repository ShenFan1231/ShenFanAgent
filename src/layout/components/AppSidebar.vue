<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppTag from '@/components/ui/AppTag.vue'
import { findMenuChain } from '@/router/helper'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'
import BrandLogo from './BrandLogo.vue'
import SidebarMenuItem from './SidebarMenuItem.vue'

const appStore = useAppStore()
const permissionStore = usePermissionStore()
const userStore = useUserStore()
const route = useRoute()

/** 窄屏时侧边栏是覆盖式抽屉，不参与折叠逻辑 */
const collapsed = computed(() => !appStore.isMobile && appStore.sidebarCollapsed)
const openKeys = ref<string[]>([])

function toggle(key: string): void {
  const index = openKeys.value.indexOf(key)
  if (index > -1) openKeys.value.splice(index, 1)
  else openKeys.value.push(key)
}

function onNavigate(): void {
  if (appStore.isMobile) appStore.mobileSidebarOpen = false
}

// 路由变化时自动展开命中的分组（刷新后直接进子页面也能定位）
watch(
  () => route.path,
  (path) => {
    const chain = findMenuChain(permissionStore.menus, path)
    chain.slice(0, -1).forEach((menu) => {
      if (!openKeys.value.includes(menu.key)) openKeys.value.push(menu.key)
    })
  },
  { immediate: true },
)

const roleLabel = computed(() => {
  if (userStore.roles.includes('super_admin')) return '超级管理员'
  if (userStore.roles.includes('admin')) return '管理员'
  return '运营'
})
</script>

<template>
  <aside
    class="relative z-40 flex h-full shrink-0 flex-col border-r border-line/60 bg-surface/55 backdrop-blur-2xl transition-[width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
    :style="{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }"
  >
    <!-- 右侧竖向渐变描边，让侧栏边界有"发光"的层次 -->
    <span
      class="pointer-events-none absolute inset-y-0 right-0 w-px bg-[linear-gradient(180deg,transparent,rgb(var(--c-brand)/0.35)_35%,rgb(var(--c-violet)/0.25)_65%,transparent)]"
    />

    <BrandLogo :collapsed="collapsed" />

    <nav class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-3">
      <p
        v-if="!collapsed"
        class="px-2.5 pb-1.5 pt-2 text-[10.5px] font-medium uppercase tracking-[0.18em] text-text-dim"
      >
        导航
      </p>
      <ul class="space-y-0.5">
        <SidebarMenuItem
          v-for="item in permissionStore.menus"
          :key="item.key"
          :item="item"
          :collapsed="collapsed"
          :depth="0"
          :open-keys="openKeys"
          @toggle="toggle"
          @navigate="onNavigate"
        />
      </ul>
    </nav>

    <footer class="shrink-0 border-t border-line/50 p-2.5">
      <!-- 当前角色：权限体系的可视化入口，一眼知道自己是谁 -->
      <div
        v-if="!collapsed"
        class="mb-2 rounded-xl border border-line/60 bg-elevated/40 px-2.5 py-2"
      >
        <div class="flex-between gap-2">
          <span class="truncate text-[11px] text-text-dim">当前角色</span>
          <AppTag tone="violet" size="xs">{{ roleLabel }}</AppTag>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-text-dim">
          <i class="i-lucide-shield-check text-[12px] text-success" />
          <span class="truncate">{{ userStore.permissions.length }} 项操作权限</span>
        </div>
      </div>

      <button
        class="focus-ring flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] text-text-soft transition hover:bg-elevated/70 hover:text-text"
        :class="collapsed ? 'justify-center px-0' : ''"
        :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="appStore.toggleSidebar()"
      >
        <i
          class="i-lucide-chevrons-left shrink-0 text-[17px] transition-transform duration-400"
          :class="collapsed ? 'rotate-180' : ''"
        />
        <span v-if="!collapsed">收起侧边栏</span>
      </button>
    </footer>
  </aside>
</template>
