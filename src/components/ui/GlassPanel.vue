<script setup lang="ts">
/**
 * 全站卡片的基础材质。
 * 通过 variant 提供 4 种不同质感，避免"所有卡片长得一模一样"。
 */
import { computed } from 'vue'

type Variant = 'default' | 'raised' | 'outline' | 'gradient'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    title?: string
    subtitle?: string
    icon?: string
    /** 悬浮时的霓虹描边 */
    glow?: boolean
    /** 顶部渐变细线 */
    edge?: boolean
    padding?: 'none' | 'sm' | 'md' | 'lg'
    loading?: boolean
    /**
     * 内容区容器的附加类。
     * 需要"头部固定 + 内容自己滚动"的卡片（如实时动态）靠它把 flex 约束
     * 传进内容层，否则内容会撑破卡片外框。
     */
    bodyClass?: string
  }>(),
  {
    variant: 'default',
    padding: 'md',
    glow: false,
    edge: false,
    loading: false,
  },
)

const VARIANT_CLASS: Record<Variant, string> = {
  default: 'bg-surface/72 border-line/70',
  raised: 'bg-elevated/85 border-line/90',
  outline: 'bg-surface/35 border-line/55',
  gradient:
    'border-transparent bg-[linear-gradient(150deg,rgb(var(--c-brand)/0.14),rgb(var(--c-violet)/0.12)_45%,rgb(var(--c-surface)/0.86))]',
}

const PADDING_CLASS = {
  none: '',
  sm: 'p-3.5',
  md: 'p-5',
  lg: 'p-6',
} as const

const rootClass = computed(() => [
  'group/panel relative rounded-2xl border backdrop-blur-xl shadow-panel transition-[transform,box-shadow,border-color] duration-300',
  VARIANT_CLASS[props.variant],
  props.glow ? 'hover:border-brand/45 hover:shadow-glow hover:-translate-y-0.5' : '',
  props.edge ? 'edge-light' : '',
])

const hasHeader = computed(() => Boolean(props.title || props.subtitle))
</script>

<template>
  <section :class="rootClass">
    <!-- gradient 变体额外叠一层内高光，边缘看起来是"被光照到"而不是纯色 -->
    <div
      v-if="variant === 'gradient'"
      class="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/8"
    />

    <header
      v-if="hasHeader || $slots.header"
      class="flex-between gap-3 px-5 pt-4.5"
      :class="padding === 'none' ? 'pb-3' : 'pb-1'"
    >
      <slot name="header">
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            v-if="icon"
            class="flex-center size-8 shrink-0 rounded-xl bg-brand/12 text-brand ring-1 ring-brand/20"
          >
            <i :class="[icon, 'text-[15px]']" />
          </span>
          <div class="min-w-0">
            <h3 class="truncate text-[14.5px] font-semibold tracking-tight">{{ title }}</h3>
            <p v-if="subtitle" class="truncate text-xs text-text-dim">{{ subtitle }}</p>
          </div>
        </div>
      </slot>
      <div v-if="$slots.extra" class="shrink-0"><slot name="extra" /></div>
    </header>

    <div :class="[PADDING_CLASS[padding], hasHeader || $slots.header ? 'pt-3' : '', bodyClass]">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="border-t border-line/60 px-5 py-3">
      <slot name="footer" />
    </footer>

    <!-- 局部刷新时用蒙层，不整卡换成骨架屏，避免布局跳动 -->
    <Transition name="fade">
      <div
        v-if="loading"
        class="flex-center absolute inset-0 z-10 rounded-2xl bg-surface/45 backdrop-blur-[2px]"
      >
        <i class="i-lucide-loader-circle animate-spin text-lg text-brand" />
      </div>
    </Transition>
  </section>
</template>
