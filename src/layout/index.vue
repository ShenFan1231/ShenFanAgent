<script setup lang="ts">
/**
 * 基础布局：侧边栏 + 顶栏 + 标签栏 + 主内容区。
 * 布局只负责骨架与设备适配，具体行为都下沉到各自的子组件与 store。
 */
import { watch } from 'vue'

import AmbientBackground from '@/components/background/AmbientBackground.vue'
import { useDeviceWatcher } from '@/composables/useDeviceWatcher'
import { useAppStore } from '@/stores/app'
import AppHeader from './components/AppHeader.vue'
import AppSidebar from './components/AppSidebar.vue'
import PageContainer from './components/PageContainer.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'
import TabsBar from './components/TabsBar.vue'

const appStore = useAppStore()

useDeviceWatcher()

// 窄屏抽屉打开时锁定页面滚动，避免背景跟着动
watch(
  () => appStore.mobileSidebarOpen,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <div class="relative flex h-full w-full overflow-hidden">
    <AmbientBackground />

    <!-- 桌面 / 平板：侧边栏参与布局流 -->
    <AppSidebar v-if="!appStore.isMobile" />

    <!-- 窄屏：覆盖式抽屉 -->
    <template v-else>
      <Transition name="modal-mask">
        <div
          v-if="appStore.mobileSidebarOpen"
          class="fixed inset-0 z-500 bg-[rgb(2_5_12/0.55)] backdrop-blur-[3px]"
          @click="appStore.mobileSidebarOpen = false"
        />
      </Transition>
      <Transition name="drawer-panel-left">
        <div v-if="appStore.mobileSidebarOpen" class="fixed inset-y-0 left-0 z-600 w-[var(--sidebar-w)]">
          <AppSidebar />
        </div>
      </Transition>
    </template>

    <div class="relative flex min-w-0 flex-1 flex-col">
      <AppHeader />
      <TabsBar v-if="appStore.showTabs" />
      <PageContainer />
    </div>

    <SettingsDrawer />

    <!-- 全局遮罩：角色切换等需要阻断交互的操作 -->
    <Transition name="fade">
      <div
        v-if="appStore.globalLoading"
        class="fixed inset-0 z-1500 flex-center flex-col gap-3 bg-[rgb(3_6_14/0.72)] backdrop-blur-md"
      >
        <span class="global-spinner" />
        <p class="text-[12.5px] tracking-[0.2em] text-text-dim">RELOADING PERMISSIONS</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.global-spinner {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 2px solid rgb(var(--c-line));
  border-top-color: rgb(var(--c-brand));
  border-right-color: rgb(var(--c-violet));
  animation: spin-slow 0.85s linear infinite;
}
</style>
