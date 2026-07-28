<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-3 pb-1">
    <div class="min-w-0">
      <div class="flex items-center gap-2.5">
        <span
          v-if="icon"
          class="flex-center size-9 shrink-0 rounded-xl bg-[linear-gradient(140deg,rgb(var(--c-brand)/0.18),rgb(var(--c-violet)/0.14))] text-brand ring-1 ring-brand/22"
        >
          <i :class="[icon, 'text-[18px]']" />
        </span>
        <div class="min-w-0">
          <h1 class="truncate text-[19px] font-semibold tracking-tight">{{ title }}</h1>
          <p v-if="description" class="truncate text-[12.5px] text-text-dim">{{ description }}</p>
        </div>
      </div>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>
