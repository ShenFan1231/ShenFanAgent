<script setup lang="ts" generic="T extends object">
/**
 * 轻量数据表格。
 * 只做后台列表真正需要的部分：列配置、单元格插槽、加载骨架、空状态、逐行入场。
 * 复杂需求（虚拟滚动、拖拽列）留给后续按需扩展，不在这里堆功能。
 */
import AppEmpty from './AppEmpty.vue'
import AppSkeleton from './AppSkeleton.vue'
import type { TableColumn } from './types'

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    data: T[]
    rowKey?: string
    loading?: boolean
    emptyText?: string
    /** 行高，紧凑模式下列表能多显示两行 */
    dense?: boolean
  }>(),
  { rowKey: 'id', loading: false, emptyText: '没有匹配的数据', dense: false },
)

const emit = defineEmits<{ rowClick: [row: T, index: number] }>()

const ALIGN: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/** 列配置里的 key 是字符串，这里统一做一次取值，避免模板中到处断言。 */
function cellOf(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key]
}

function keyOf(row: T, index: number): string {
  const value = cellOf(row, props.rowKey)
  return value === undefined ? String(index) : String(value)
}
</script>

<template>
  <div class="relative w-full overflow-x-auto">
    <table class="w-full border-collapse text-[13px]">
      <thead>
        <tr class="border-b border-line/70">
          <th
            v-for="column in columns"
            :key="column.key"
            class="whitespace-nowrap px-3 py-2.5 text-[11.5px] font-medium uppercase tracking-wider text-text-dim"
            :class="[ALIGN[column.align ?? 'left'], column.hideOnMobile ? 'hidden md:table-cell' : '']"
            :style="column.width ? { width: column.width } : undefined"
          >
            {{ column.title }}
          </th>
        </tr>
      </thead>

      <tbody v-if="loading && data.length === 0">
        <tr v-for="row in 6" :key="`skeleton-${row}`">
          <td v-for="column in columns" :key="column.key" class="px-3 py-3">
            <AppSkeleton :rows="1" />
          </td>
        </tr>
      </tbody>

      <TransitionGroup v-else tag="tbody" name="row" appear>
        <tr
          v-for="(row, index) in data"
          :key="keyOf(row, index)"
          class="group/row border-b border-line/40 transition-colors duration-200 last:border-0 hover:bg-elevated/60"
          :style="{ '--row-index': index }"
          @click="emit('rowClick', row, index)"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-3 align-middle"
            :class="[
              ALIGN[column.align ?? 'left'],
              dense ? 'py-2' : 'py-3',
              column.hideOnMobile ? 'hidden md:table-cell' : '',
            ]"
          >
            <slot :name="`cell-${column.key}`" :row="row" :index="index">
              {{ cellOf(row, column.key) }}
            </slot>
          </td>
        </tr>
      </TransitionGroup>
    </table>

    <AppEmpty v-if="!loading && data.length === 0" size="sm" :title="emptyText" />
  </div>
</template>

<style scoped>
/* 逐行进入：按索引递增延迟，形成"数据流入"的感觉 */
.row-enter-active {
  transition:
    opacity 420ms ease,
    transform 520ms var(--ease-out-expo);
  transition-delay: calc(var(--row-index, 0) * 26ms);
}

.row-enter-from {
  opacity: 0;
  transform: translate3d(-14px, 0, 0);
}

.row-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}

.row-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0);
}

@media (prefers-reduced-motion: reduce) {
  .row-enter-active {
    transition-delay: 0ms;
  }
}
</style>
