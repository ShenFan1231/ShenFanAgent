<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { buildBreadcrumb } from '@/router/helper'

const route = useRoute()
const items = computed(() => buildBreadcrumb(route))
</script>

<template>
  <TransitionGroup tag="nav" name="crumb" class="flex min-w-0 items-center gap-1 text-[12.5px]">
    <template v-for="(item, index) in items" :key="`${item.title}-${index}`">
      <i v-if="index > 0" class="i-lucide-chevron-right shrink-0 text-[13px] text-text-dim/70" />
      <component
        :is="item.path ? 'RouterLink' : 'span'"
        :to="item.path"
        class="flex shrink-0 items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors"
        :class="
          index === items.length - 1
            ? 'text-text font-medium'
            : 'text-text-dim hover:text-brand'
        "
      >
        <i v-if="item.icon && index === 0" :class="[item.icon, 'text-[13px]']" />
        {{ item.title }}
      </component>
    </template>
  </TransitionGroup>
</template>

<style scoped>
.crumb-enter-active,
.crumb-leave-active {
  transition:
    opacity 240ms ease,
    transform 320ms var(--ease-out-expo);
}

.crumb-enter-from {
  opacity: 0;
  transform: translate3d(-8px, 0, 0);
}

.crumb-leave-to {
  opacity: 0;
  transform: translate3d(6px, 0, 0);
}

.crumb-leave-active {
  position: absolute;
}
</style>
