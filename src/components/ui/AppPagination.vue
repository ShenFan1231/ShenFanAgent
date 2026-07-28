<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

/** 页码窗口：始终显示首尾，中间用省略号收拢 */
const pages = computed<Array<number | '...'>>(() => {
  const last = totalPages.value
  const current = props.page
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const list: Array<number | '...'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(last - 1, current + 1)
  if (start > 2) list.push('...')
  for (let i = start; i <= end; i++) list.push(i)
  if (end < last - 1) list.push('...')
  list.push(last)
  return list
})

function go(page: number): void {
  const next = Math.min(Math.max(1, page), totalPages.value)
  if (next !== props.page) emit('update:page', next)
}
</script>

<template>
  <div class="flex-between flex-wrap gap-3">
    <p class="text-xs text-text-dim">
      共 <span class="tabular text-text-soft">{{ total }}</span> 条 · 第
      <span class="tabular text-text-soft">{{ page }}</span> / {{ totalPages }} 页
    </p>

    <div class="flex items-center gap-1">
      <button
        class="pager"
        :disabled="page <= 1"
        aria-label="上一页"
        @click="go(page - 1)"
      >
        <i class="i-lucide-chevron-left" />
      </button>

      <button
        v-for="(item, index) in pages"
        :key="`${item}-${index}`"
        class="pager"
        :class="item === page ? 'pager--active' : ''"
        :disabled="item === '...'"
        @click="typeof item === 'number' && go(item)"
      >
        {{ item }}
      </button>

      <button
        class="pager"
        :disabled="page >= totalPages"
        aria-label="下一页"
        @click="go(page + 1)"
      >
        <i class="i-lucide-chevron-right" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pager {
  --uno: 'flex-center h-8 min-w-8 rounded-lg border border-line/60 bg-elevated/40 px-2 text-[12.5px] text-text-soft transition-all duration-200';
}

.pager:hover:not(:disabled) {
  --uno: 'border-brand/40 text-brand -translate-y-px';
}

.pager:disabled {
  --uno: 'opacity-35 cursor-not-allowed';
}

.pager--active {
  --uno: 'border-brand/50 bg-brand/12 text-brand font-semibold';
}
</style>
