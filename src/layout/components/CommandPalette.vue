<script setup lang="ts">
/**
 * 命令面板（⌘/Ctrl + K）。
 * 菜单树打平成候选项，支持键盘上下选择与回车跳转 —— 后台页面一多，
 * 这比一层层点菜单快得多。
 */
import { onKeyStroke } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { MenuItem } from '@/types/menu'
import { usePermissionStore } from '@/stores/permission'
import { useAppStore } from '@/stores/app'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const router = useRouter()
const permissionStore = usePermissionStore()
const appStore = useAppStore()

interface Candidate {
  key: string
  title: string
  path: string
  icon?: string
  group: string
  action?: () => void
}

function flatten(menus: MenuItem[], group = '导航'): Candidate[] {
  return menus.flatMap((menu) =>
    menu.children?.length
      ? flatten(menu.children, menu.title)
      : [{ key: menu.key, title: menu.title, path: menu.path, icon: menu.icon, group }],
  )
}

const commands = computed<Candidate[]>(() => [
  ...flatten(permissionStore.menus),
  {
    key: 'cmd:theme',
    title: appStore.isDark ? '切换到浅色主题' : '切换到深色主题',
    path: '',
    icon: 'i-lucide-sun-moon',
    group: '操作',
    action: () => appStore.toggleTheme(),
  },
  {
    key: 'cmd:settings',
    title: '打开界面设置',
    path: '',
    icon: 'i-lucide-settings',
    group: '操作',
    action: () => (appStore.settingsPanelOpen = true),
  },
  {
    key: 'cmd:fullscreen',
    title: '切换全屏',
    path: '',
    icon: 'i-lucide-maximize',
    group: '操作',
    action: () => void appStore.toggleFullscreen(),
  },
])

const keyword = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

const results = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return commands.value.slice(0, 8)
  return commands.value
    .filter(
      (item) =>
        item.title.toLowerCase().includes(query) || item.path.toLowerCase().includes(query),
    )
    .slice(0, 10)
})

const grouped = computed(() => {
  const map = new Map<string, Candidate[]>()
  results.value.forEach((item) => {
    const list = map.get(item.group) ?? []
    list.push(item)
    map.set(item.group, list)
  })
  return [...map.entries()]
})

function close(): void {
  emit('update:modelValue', false)
}

function run(item: Candidate): void {
  close()
  if (item.action) item.action()
  else void router.push(item.path)
}

function move(step: number): void {
  const total = results.value.length
  if (!total) return
  activeIndex.value = (activeIndex.value + step + total) % total
}

onKeyStroke('ArrowDown', (event) => {
  if (!props.modelValue) return
  event.preventDefault()
  move(1)
})

onKeyStroke('ArrowUp', (event) => {
  if (!props.modelValue) return
  event.preventDefault()
  move(-1)
})

onKeyStroke('Enter', () => {
  if (!props.modelValue) return
  const item = results.value[activeIndex.value]
  if (item) run(item)
})

onKeyStroke('Escape', () => props.modelValue && close())

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) return
    keyword.value = ''
    activeIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
  },
)

watch(keyword, () => (activeIndex.value = 0))

/** 结果被打平渲染，需要全局序号来判断高亮 */
function indexOf(item: Candidate): number {
  return results.value.findIndex((entry) => entry.key === item.key)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-1100 flex items-start justify-center p-4 pt-[12vh]">
      <Transition name="modal-mask" appear>
        <div class="absolute inset-0 bg-[rgb(2_5_12/0.62)] backdrop-blur-[6px]" @click="close" />
      </Transition>

      <Transition name="modal-panel" appear>
        <div class="panel edge-light relative w-full max-w-[560px] overflow-hidden">
          <div class="flex items-center gap-3 border-b border-line/60 px-4 py-3.5">
            <i class="i-lucide-search shrink-0 text-text-dim" />
            <input
              ref="inputRef"
              v-model="keyword"
              placeholder="搜索页面或执行命令…"
              class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-dim"
            />
            <kbd
              class="rounded border border-line/70 bg-elevated/70 px-1.5 py-0.5 font-mono text-[10px] text-text-dim"
            >
              ESC
            </kbd>
          </div>

          <div class="max-h-[52vh] overflow-y-auto p-2">
            <template v-for="[group, items] in grouped" :key="group">
              <p class="px-2 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-text-dim">
                {{ group }}
              </p>
              <button
                v-for="item in items"
                :key="item.key"
                class="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-150"
                :class="
                  indexOf(item) === activeIndex
                    ? 'bg-brand/12 text-brand ring-1 ring-brand/25'
                    : 'text-text-soft hover:bg-elevated'
                "
                @click="run(item)"
                @mouseenter="activeIndex = indexOf(item)"
              >
                <i :class="[item.icon || 'i-lucide-corner-down-right', 'shrink-0 text-[16px]']" />
                <span class="min-w-0 flex-1 truncate text-[13.5px]">{{ item.title }}</span>
                <span v-if="item.path" class="shrink-0 font-mono text-[10.5px] text-text-dim">
                  {{ item.path }}
                </span>
              </button>
            </template>

            <p v-if="!results.length" class="py-8 text-center text-[13px] text-text-dim">
              没有匹配的页面或命令
            </p>
          </div>

          <div
            class="flex items-center gap-4 border-t border-line/60 bg-elevated/40 px-4 py-2 text-[10.5px] text-text-dim"
          >
            <span class="flex items-center gap-1"><i class="i-lucide-arrow-up-down" />切换</span>
            <span class="flex items-center gap-1"><i class="i-lucide-corner-down-left" />打开</span>
            <span class="ml-auto">共 {{ commands.length }} 个可用项</span>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
