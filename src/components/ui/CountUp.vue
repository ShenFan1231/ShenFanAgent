<script setup lang="ts">
import { computed, toRef } from 'vue'

import { useCountUp } from '@/composables/useCountUp'
import { formatCompact, formatCurrency, formatNumber } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    value: number
    /** number: 千分位 / currency: 金额 / compact: 万亿缩写 / raw: 原样 */
    format?: 'number' | 'currency' | 'compact' | 'raw'
    precision?: number
    duration?: number
    delay?: number
    prefix?: string
    suffix?: string
  }>(),
  { format: 'number', precision: 0, duration: 1500, delay: 120 },
)

const { displayed } = useCountUp(toRef(props, 'value'), {
  duration: props.duration,
  precision: props.precision,
  delay: props.delay,
})

const text = computed(() => {
  const value = displayed.value
  switch (props.format) {
    case 'currency':
      return formatCurrency(value)
    case 'compact':
      return formatCompact(value)
    case 'raw':
      return value.toFixed(props.precision)
    default:
      return formatNumber(value, props.precision)
  }
})
</script>

<template>
  <span class="tabular">
    <span v-if="prefix" class="text-text-dim">{{ prefix }}</span>{{ text }}<span
      v-if="suffix"
      class="ml-0.5 text-[0.62em] font-medium text-text-dim"
      >{{ suffix }}</span
    >
  </span>
</template>
