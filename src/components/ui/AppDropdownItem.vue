<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string
    danger?: boolean
    disabled?: boolean
    shortcut?: string
  }>(),
  { danger: false, disabled: false },
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="focus-ring group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-150"
    :class="[
      danger
        ? 'text-danger/90 hover:bg-danger/10 hover:text-danger'
        : 'text-text-soft hover:bg-elevated hover:text-text',
      disabled ? 'cursor-not-allowed opacity-45' : '',
    ]"
  >
    <i v-if="icon" :class="[icon, 'shrink-0 text-[15px] opacity-80']" />
    <span class="flex-1 truncate text-left"><slot /></span>
    <kbd
      v-if="shortcut"
      class="rounded border border-line/70 bg-elevated/70 px-1.5 py-0.25 font-mono text-[10px] text-text-dim"
    >
      {{ shortcut }}
    </kbd>
  </button>
</template>
