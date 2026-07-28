<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <label
    class="flex items-center justify-between gap-4"
    :class="disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'"
  >
    <span v-if="label || description" class="min-w-0">
      <span class="block text-[13px] text-text-soft">{{ label }}</span>
      <span v-if="description" class="block text-[11px] text-text-dim">{{ description }}</span>
    </span>

    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      class="focus-ring relative h-5.5 w-9.5 shrink-0 rounded-full border transition-colors duration-300"
      :class="
        modelValue
          ? 'border-brand/50 bg-brand/25'
          : 'border-line/80 bg-elevated'
      "
      @click="!props.disabled && emit('update:modelValue', !modelValue)"
    >
      <span
        class="absolute top-0.5 left-0.5 size-4 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
        :class="
          modelValue
            ? 'translate-x-4 bg-brand shadow-[0_0_12px_rgb(var(--c-brand)/0.8)]'
            : 'bg-text-dim'
        "
      />
    </button>
  </label>
</template>
