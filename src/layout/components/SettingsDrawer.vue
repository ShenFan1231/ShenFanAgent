<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppTag from '@/components/ui/AppTag.vue'
import { useAppStore } from '@/stores/app'
import { useTabsStore } from '@/stores/tabs'
import { toast } from '@/utils/toast'

const appStore = useAppStore()
const tabsStore = useTabsStore()

const TRANSITIONS = [
  { label: '景深', value: 'route' },
  { label: '淡入', value: 'fade' },
  { label: '关闭', value: 'none' },
]

const THEMES = [
  { label: '深色', value: 'dark', icon: 'i-lucide-moon' },
  { label: '浅色', value: 'light', icon: 'i-lucide-sun' },
]

function reset(): void {
  appStore.resetSettings()
  toast.success('已恢复默认外观设置')
}
</script>

<template>
  <AppDrawer
    v-model="appStore.settingsPanelOpen"
    title="界面设置"
    subtitle="所有偏好都会写入本地存储"
    icon="i-lucide-sliders-horizontal"
    :width="340"
  >
    <div class="space-y-5">
      <section class="space-y-2.5">
        <p class="section-title">主题</p>
        <AppSegmented
          :model-value="appStore.theme"
          :options="THEMES"
          class="w-full"
          @update:model-value="appStore.setTheme($event as 'dark' | 'light')"
        />
      </section>

      <section class="space-y-2.5">
        <p class="section-title">路由过渡</p>
        <AppSegmented v-model="appStore.routeTransition" :options="TRANSITIONS" class="w-full" />
      </section>

      <section class="space-y-3 rounded-xl border border-line/60 bg-elevated/35 p-3.5">
        <p class="section-title">布局</p>
        <AppSwitch v-model="appStore.showTabs" label="多标签页" description="关闭后仅保留主内容区" />
        <AppSwitch v-model="appStore.showBreadcrumb" label="面包屑" description="顶栏路径导航" />
        <AppSwitch
          v-model="appStore.showBackground"
          label="动态背景"
          description="极光与星尘动画，低配设备可关闭"
        />
        <AppSwitch v-model="appStore.compact" label="紧凑间距" description="一屏显示更多内容" />
        <AppSwitch
          :model-value="appStore.sidebarCollapsed"
          label="收起侧边栏"
          description="仅保留图标导航"
          @update:model-value="appStore.toggleSidebar($event)"
        />
      </section>

      <section class="space-y-2.5">
        <p class="section-title">缓存</p>
        <div class="rounded-xl border border-line/60 bg-elevated/35 p-3.5">
          <div class="flex-between text-[12.5px]">
            <span class="text-text-soft">已缓存页面</span>
            <AppTag tone="brand" size="xs">{{ tabsStore.cachedKeys.length }} 个</AppTag>
          </div>
          <ul class="mt-2 space-y-1">
            <li
              v-for="tab in tabsStore.tabs.filter((item) => item.keepAlive)"
              :key="tab.key"
              class="flex items-center gap-1.5 truncate font-mono text-[10.5px] text-text-dim"
            >
              <i class="i-lucide-database-zap shrink-0 text-[11px] text-success" />
              {{ tab.title }} · v{{ tab.version }}
            </li>
          </ul>
        </div>
      </section>

      <p class="text-[11px] leading-relaxed text-text-dim">
        提示：动态背景与路由过渡在系统开启「减少动态效果」时会自动降级为静态展示。
      </p>
    </div>

    <template #footer>
      <AppButton variant="soft" icon="i-lucide-rotate-ccw" block @click="reset">
        恢复默认设置
      </AppButton>
    </template>
  </AppDrawer>
</template>

<style scoped>
.section-title {
  --uno: 'text-[11px] font-medium uppercase tracking-[0.14em] text-text-dim';
}
</style>
