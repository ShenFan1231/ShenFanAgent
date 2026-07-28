<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { computed, ref } from 'vue'

import AppTag from '@/components/ui/AppTag.vue'
import { useNow } from '@/composables/useNow'
import { useAppStore } from '@/stores/app'
import { useTabsStore } from '@/stores/tabs'
import { formatDate } from '@/utils/format'
import BreadcrumbNav from './BreadcrumbNav.vue'
import CommandPalette from './CommandPalette.vue'
import NoticeDrawer from './NoticeDrawer.vue'
import UserMenu from './UserMenu.vue'

const appStore = useAppStore()
const tabsStore = useTabsStore()
const now = useNow()

const paletteOpen = ref(false)
const noticeOpen = ref(false)
const unreadCount = ref(3)

const clock = computed(() => formatDate(now.value, 'HH:mm:ss'))

// ⌘/Ctrl + K 打开命令面板；输入框内也能触发，避免用户先点空白处
onKeyStroke('k', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return
  event.preventDefault()
  paletteOpen.value = !paletteOpen.value
})

function onToggleTheme(event: MouseEvent): void {
  appStore.toggleTheme({ x: event.clientX, y: event.clientY })
}
</script>

<template>
  <header
    class="relative z-30 flex h-[var(--header-h)] shrink-0 items-center gap-3 border-b border-line/55 bg-surface/50 px-3 backdrop-blur-2xl sm:px-4"
  >
    <button class="icon-btn" :title="appStore.isMobile ? '打开菜单' : '折叠侧边栏'" @click="appStore.toggleSidebar()">
      <i class="i-lucide-panel-left" />
    </button>

    <div class="hidden min-w-0 flex-1 md:block">
      <BreadcrumbNav />
    </div>
    <div class="min-w-0 flex-1 md:hidden">
      <p class="truncate text-[13px] font-medium">{{ tabsStore.activeTab?.title ?? 'NEBULA' }}</p>
    </div>

    <!-- 搜索入口：窄屏退化成图标按钮 -->
    <button
      class="hidden items-center gap-2 rounded-xl border border-line/70 bg-elevated/50 px-2.5 py-1.5 text-[12.5px] text-text-dim transition-all duration-200 hover:border-brand/40 hover:text-text-soft lg:flex"
      @click="paletteOpen = true"
    >
      <i class="i-lucide-search text-[14px]" />
      <span class="w-28 text-left">搜索页面…</span>
      <kbd class="rounded border border-line/70 bg-surface/80 px-1.5 font-mono text-[10px]">⌘K</kbd>
    </button>
    <!--
      注意：需要按断点显示 / 隐藏时，把响应式类放在外层包裹元素上。
      .icon-btn 是 scoped 类（选择器带 data-v 属性），特异性高于 hidden / lg:hidden，
      直接写在 button 上不会生效。
    -->
    <span class="lg:hidden">
      <button class="icon-btn" title="搜索" @click="paletteOpen = true">
        <i class="i-lucide-search" />
      </button>
    </span>

    <div class="flex items-center gap-0.5 sm:gap-1">
      <!-- 系统状态 + 时钟：数据终端的仪表感 -->
      <span class="mr-1 hidden xl:block">
        <AppTag tone="success" dot>
          系统正常 · <span class="tabular">{{ clock }}</span>
        </AppTag>
      </span>

      <button class="icon-btn" title="刷新当前页" @click="tabsStore.refreshTab()">
        <i class="i-lucide-rotate-cw" />
      </button>

      <button class="icon-btn relative" title="通知中心" @click="noticeOpen = true">
        <i class="i-lucide-bell" />
        <span
          v-if="unreadCount"
          class="absolute right-1 top-1 flex-center min-w-3.5 rounded-full bg-danger px-1 text-[9px] font-semibold leading-3.5 text-white"
        >
          {{ unreadCount }}
        </span>
      </button>

      <span class="hidden sm:block">
        <button
          class="icon-btn"
          :title="appStore.isFullscreen ? '退出全屏' : '进入全屏'"
          @click="appStore.toggleFullscreen()"
        >
          <i :class="appStore.isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'" />
        </button>
      </span>

      <button class="icon-btn" :title="appStore.isDark ? '浅色主题' : '深色主题'" @click="onToggleTheme">
        <i :class="appStore.isDark ? 'i-lucide-sun' : 'i-lucide-moon'" />
      </button>

      <span class="hidden sm:block">
        <button class="icon-btn" title="界面设置" @click="appStore.settingsPanelOpen = true">
          <i class="i-lucide-settings" />
        </button>
      </span>

      <div class="mx-1 h-6 w-px bg-line/60" />

      <UserMenu />
    </div>

    <CommandPalette v-model="paletteOpen" />
    <NoticeDrawer v-model="noticeOpen" />
  </header>
</template>

<style scoped>
.icon-btn {
  --uno: 'flex-center size-9 shrink-0 rounded-xl text-[17px] text-text-soft transition-all duration-200';
}

.icon-btn:hover {
  --uno: 'bg-elevated text-brand -translate-y-px';
}

.icon-btn:active {
  --uno: 'translate-y-0 scale-95';
}
</style>
