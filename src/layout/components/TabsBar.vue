<script setup lang="ts">
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppDropdown from '@/components/ui/AppDropdown.vue'
import AppDropdownItem from '@/components/ui/AppDropdownItem.vue'
import { useTabsStore } from '@/stores/tabs'
import type { TabItem } from '@/types/tabs'

const router = useRouter()
const tabsStore = useTabsStore()

const scrollerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const contextTab = ref<TabItem | null>(null)
const menuPosition = ref({ x: 0, y: 0 })

onClickOutside(menuRef, () => (contextTab.value = null))
onKeyStroke('Escape', () => (contextTab.value = null))

/** 激活标签滚动进视野：标签多了之后不会"消失"在溢出区域 */
async function scrollActiveIntoView(): Promise<void> {
  await nextTick()
  const scroller = scrollerRef.value
  const active = scroller?.querySelector<HTMLElement>('[data-active="true"]')
  active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

watch(() => tabsStore.activeKey, scrollActiveIntoView, { immediate: true })

function openContextMenu(event: MouseEvent, tab: TabItem): void {
  event.preventDefault()
  contextTab.value = tab
  menuPosition.value = { x: event.clientX, y: event.clientY }
}

function goTo(tab: TabItem | null): void {
  if (tab) void router.push(tab.fullPath)
  else void router.push('/dashboard')
}

function onClose(tab: TabItem): void {
  const next = tabsStore.closeTab(tab.key)
  if (next !== null || tabsStore.activeKey === '') goTo(next)
  contextTab.value = null
}

function refresh(tab: TabItem): void {
  contextTab.value = null
  if (tab.key !== tabsStore.activeKey) {
    void router.push(tab.fullPath).then(() => tabsStore.refreshTab(tab.key))
    return
  }
  tabsStore.refreshTab(tab.key)
}

function closeOthers(tab: TabItem): void {
  tabsStore.closeOthers(tab.key)
  goTo(tab)
  contextTab.value = null
}

function closeSide(tab: TabItem, side: 'left' | 'right'): void {
  tabsStore.closeSide(tab.key, side)
  goTo(tab)
  contextTab.value = null
}

function closeAll(): void {
  goTo(tabsStore.closeAll())
  contextTab.value = null
}
</script>

<template>
  <div
    class="relative z-20 flex h-[var(--tabs-h)] shrink-0 items-center gap-1 border-b border-line/50 bg-surface/35 px-2 backdrop-blur-xl"
  >
    <div
      ref="scrollerRef"
      class="tab-scroller relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
    >
      <TransitionGroup name="stagger">
        <button
          v-for="tab in tabsStore.tabs"
          :key="tab.key"
          :data-active="tab.key === tabsStore.activeKey"
          class="tab-item group/tab"
          :class="tab.key === tabsStore.activeKey ? 'tab-item--active' : ''"
          @click="goTo(tab)"
          @contextmenu="openContextMenu($event, tab)"
        >
          <i v-if="tab.icon" :class="[tab.icon, 'shrink-0 text-[13px]']" />
          <span class="max-w-32 truncate">{{ tab.title }}</span>

          <span
            v-if="tab.affix"
            class="i-lucide-pin shrink-0 text-[10px] text-text-dim opacity-70"
          />
          <span
            v-else
            class="close-dot"
            role="button"
            aria-label="关闭标签"
            @click.stop="onClose(tab)"
          >
            <i class="i-lucide-x text-[10px]" />
          </span>
        </button>
      </TransitionGroup>
    </div>

    <!-- 溢出渐隐，提示还有更多标签 -->
    <span
      class="pointer-events-none absolute right-11 top-0 h-full w-8 bg-[linear-gradient(90deg,transparent,rgb(var(--c-canvas)/0.85))]"
    />

    <AppDropdown :width="176" origin="top right" class="shrink-0">
      <template #trigger>
        <span class="flex-center size-7 rounded-lg text-text-dim transition hover:bg-elevated hover:text-text">
          <i class="i-lucide-chevron-down text-[15px]" />
        </span>
      </template>
      <AppDropdownItem
        icon="i-lucide-rotate-cw"
        @click="tabsStore.activeTab && refresh(tabsStore.activeTab)"
      >
        刷新当前页
      </AppDropdownItem>
      <AppDropdownItem
        icon="i-lucide-x"
        :disabled="!tabsStore.activeTab || tabsStore.activeTab.affix"
        @click="tabsStore.activeTab && onClose(tabsStore.activeTab)"
      >
        关闭当前页
      </AppDropdownItem>
      <AppDropdownItem
        icon="i-lucide-arrow-left-to-line"
        @click="tabsStore.activeTab && closeSide(tabsStore.activeTab, 'left')"
      >
        关闭左侧
      </AppDropdownItem>
      <AppDropdownItem
        icon="i-lucide-arrow-right-to-line"
        @click="tabsStore.activeTab && closeSide(tabsStore.activeTab, 'right')"
      >
        关闭右侧
      </AppDropdownItem>
      <AppDropdownItem
        icon="i-lucide-columns-2"
        @click="tabsStore.activeTab && closeOthers(tabsStore.activeTab)"
      >
        关闭其他
      </AppDropdownItem>
      <div class="my-1 h-px bg-line/60" />
      <AppDropdownItem icon="i-lucide-trash-2" danger @click="closeAll">关闭全部</AppDropdownItem>
    </AppDropdown>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <Transition name="pop">
        <div
          v-if="contextTab"
          ref="menuRef"
          class="panel fixed z-1200 w-44 p-1.5"
          :style="{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px`, '--pop-origin': 'top left' }"
        >
          <p class="truncate px-2 py-1 text-[11px] text-text-dim">{{ contextTab.title }}</p>
          <AppDropdownItem icon="i-lucide-rotate-cw" @click="refresh(contextTab)">
            刷新
          </AppDropdownItem>
          <AppDropdownItem
            icon="i-lucide-x"
            :disabled="contextTab.affix"
            @click="onClose(contextTab)"
          >
            关闭
          </AppDropdownItem>
          <AppDropdownItem icon="i-lucide-columns-2" @click="closeOthers(contextTab)">
            关闭其他
          </AppDropdownItem>
          <AppDropdownItem
            icon="i-lucide-arrow-left-to-line"
            @click="closeSide(contextTab, 'left')"
          >
            关闭左侧
          </AppDropdownItem>
          <AppDropdownItem
            icon="i-lucide-arrow-right-to-line"
            @click="closeSide(contextTab, 'right')"
          >
            关闭右侧
          </AppDropdownItem>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.tab-scroller {
  scrollbar-width: none;
}

.tab-scroller::-webkit-scrollbar {
  height: 0;
}

.tab-item {
  --uno: 'group relative flex shrink-0 items-center gap-1.5 rounded-lg border border-line/50 bg-elevated/35 px-2.5 py-1.25 text-[12.5px] text-text-dim transition-all duration-250';
}

.tab-item:hover {
  --uno: 'border-line text-text-soft -translate-y-px';
}

/* 激活标签：渐变底 + 底部霓虹条 */
.tab-item--active {
  --uno: 'border-brand/40 text-brand font-medium bg-[linear-gradient(180deg,rgb(var(--c-brand)/0.16),rgb(var(--c-brand)/0.04))]';
}

.tab-item--active::after {
  content: '';
  position: absolute;
  inset-inline: 18%;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, rgb(var(--c-brand)), transparent);
  box-shadow: 0 0 8px rgb(var(--c-brand) / 0.8);
}

.close-dot {
  --uno: 'flex-center size-4 shrink-0 rounded-full text-text-dim opacity-0 transition-all duration-200';
}

.tab-item:hover .close-dot,
.tab-item--active .close-dot {
  --uno: 'opacity-100';
}

.close-dot:hover {
  --uno: 'bg-danger/20 text-danger rotate-90';
}
</style>
