<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import CollapseTransition from '@/components/ui/CollapseTransition.vue'
import type { MenuItem } from '@/types/menu'

const props = defineProps<{
  item: MenuItem
  collapsed: boolean
  depth: number
  openKeys: string[]
}>()

const emit = defineEmits<{
  toggle: [key: string]
  navigate: []
}>()

const route = useRoute()

const hasChildren = computed(() => Boolean(props.item.children?.length))
const isOpen = computed(() => props.openKeys.includes(props.item.key))

/** 叶子节点精确匹配；分组只要子路径命中就算激活 */
const isActive = computed(() => {
  if (hasChildren.value) return route.path.startsWith(`${props.item.path}/`)
  return route.path === props.item.path || route.path.startsWith(`${props.item.path}/`)
})

const isCurrent = computed(() => !hasChildren.value && route.path === props.item.path)
</script>

<template>
  <li class="relative">
    <!-- 分组：点击展开 / 收起 -->
    <button
      v-if="hasChildren"
      type="button"
      class="menu-row group/row"
      :class="[isActive ? 'menu-row--active-parent' : '', collapsed ? 'justify-center px-0' : '']"
      @click="emit('toggle', item.key)"
    >
      <i :class="[item.icon || 'i-lucide-dot', 'menu-icon']" />
      <template v-if="!collapsed">
        <span class="menu-label">{{ item.title }}</span>
        <i
          class="i-lucide-chevron-right shrink-0 text-[13px] text-text-dim transition-transform duration-300"
          :class="isOpen ? 'rotate-90' : ''"
        />
      </template>
    </button>

    <!-- 叶子：路由链接 -->
    <RouterLink
      v-else
      :to="item.path"
      class="menu-row group/row"
      :class="[isCurrent ? 'menu-row--active' : '', collapsed ? 'justify-center px-0' : '']"
      @click="emit('navigate')"
    >
      <span v-if="isCurrent" class="menu-indicator" />
      <i :class="[item.icon || 'i-lucide-circle-dot', 'menu-icon']" />
      <template v-if="!collapsed">
        <span class="menu-label">{{ item.title }}</span>
        <span
          v-if="item.badge"
          class="shrink-0 rounded-full bg-violet/18 px-1.5 py-0.25 text-[10px] font-medium text-violet ring-1 ring-violet/25"
        >
          {{ item.badge }}
        </span>
      </template>
    </RouterLink>

    <!-- 展开态：正常的嵌套列表 -->
    <CollapseTransition v-if="hasChildren && !collapsed">
      <ul v-show="isOpen" class="mt-0.5 space-y-0.5 pl-3.5">
        <SidebarMenuItem
          v-for="child in item.children"
          :key="child.key"
          :item="child"
          :collapsed="false"
          :depth="depth + 1"
          :open-keys="openKeys"
          @toggle="emit('toggle', $event)"
          @navigate="emit('navigate')"
        />
      </ul>
    </CollapseTransition>

    <!-- 收起态：悬浮飞出面板，收起侧边栏也能进多级菜单 -->
    <div
      v-if="hasChildren && collapsed"
      class="flyout panel absolute left-full top-0 z-200 ml-2 w-52 p-1.5"
    >
      <p class="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-text-dim">
        {{ item.title }}
      </p>
      <RouterLink
        v-for="child in item.children"
        :key="child.key"
        :to="child.path"
        class="flex items-center gap-2 rounded-lg px-2 py-1.75 text-[13px] transition-colors"
        :class="
          route.path === child.path
            ? 'bg-brand/12 text-brand'
            : 'text-text-soft hover:bg-elevated hover:text-text'
        "
        @click="emit('navigate')"
      >
        <i :class="[child.icon || 'i-lucide-circle-dot', 'text-[15px] opacity-80']" />
        <span class="truncate">{{ child.title }}</span>
      </RouterLink>
    </div>
  </li>
</template>

<style scoped>
.menu-row {
  --uno: 'relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-text-soft transition-[color,background-color] duration-200';
}

.menu-row:hover {
  --uno: 'bg-elevated/70 text-text';
}

.menu-icon {
  --uno: 'shrink-0 text-[17px] transition-transform duration-300';
}

.menu-row:hover .menu-icon {
  --uno: 'scale-110';
}

.menu-label {
  --uno: 'min-w-0 flex-1 truncate text-left';
}

/* 选中态：渐变底 + 左侧霓虹条 + 图标发光 */
.menu-row--active {
  --uno: 'text-brand font-medium bg-[linear-gradient(90deg,rgb(var(--c-brand)/0.16),rgb(var(--c-brand)/0.02))]';
}

.menu-row--active .menu-icon {
  filter: drop-shadow(0 0 6px rgb(var(--c-brand) / 0.75));
}

.menu-row--active-parent {
  --uno: 'text-text';
}

.menu-indicator {
  position: absolute;
  left: -2px;
  top: 50%;
  width: 2px;
  height: 18px;
  transform: translateY(-50%);
  border-radius: 2px;
  background: linear-gradient(180deg, rgb(var(--c-brand)), rgb(var(--c-violet)));
  box-shadow: 0 0 10px rgb(var(--c-brand) / 0.9);
  animation: indicator-in 380ms var(--ease-out-back);
}

@keyframes indicator-in {
  from {
    transform: translateY(-50%) scaleY(0.2);
    opacity: 0;
  }
}

.flyout {
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
  transition:
    opacity 200ms ease,
    transform 240ms var(--ease-out-expo);
}

li:hover > .flyout {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .menu-indicator {
    animation: none;
  }
}
</style>
