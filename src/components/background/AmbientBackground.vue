<script setup lang="ts">
/**
 * 全局环境层：网格 + 极光 + 星尘 + 噪点。
 *
 * 分工刻意做得很清楚：
 * - 网格 / 噪点：静态 CSS，零运行时成本
 * - 极光：3 个大尺寸径向渐变，只跑 transform 关键帧（不用 filter: blur，避免重绘）
 * - 星尘：唯一的 canvas，粒子数按面积推导，隐藏页面时暂停 rAF
 */
import { ref } from 'vue'

import { useAmbientCanvas } from '@/composables/useAmbientCanvas'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

useAmbientCanvas(canvasRef)
</script>

<template>
  <div class="pointer-events-none fixed inset-0 -z-1 overflow-hidden" aria-hidden="true">
    <div class="absolute inset-0 bg-canvas" />

    <!-- 透视网格：底部渐隐，制造"地面"的空间感 -->
    <div class="grid-layer" />

    <template v-if="appStore.showBackground">
      <div class="aurora aurora--a" />
      <div class="aurora aurora--b" />
      <div class="aurora aurora--c" />
    </template>

    <canvas ref="canvasRef" class="absolute inset-0 size-full" />

    <div class="noise-layer" />

    <!-- 顶部压暗，让顶栏区域的文字对比度更稳定 -->
    <div
      class="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgb(var(--c-canvas)/0.9),transparent)]"
    />
  </div>
</template>

<style scoped>
.grid-layer {
  position: absolute;
  inset: -10% -10% 0 -10%;
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 78%);
}

.aurora {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

.aurora--a {
  top: -22%;
  left: -8%;
  width: 46vw;
  height: 46vw;
  background: radial-gradient(circle, var(--aurora-1), transparent 68%);
  animation: drift-a 34s var(--ease-in-out-soft) infinite alternate;
}

.aurora--b {
  top: -14%;
  right: -12%;
  width: 52vw;
  height: 52vw;
  background: radial-gradient(circle, var(--aurora-2), transparent 66%);
  animation: drift-b 42s var(--ease-in-out-soft) infinite alternate;
}

.aurora--c {
  bottom: -30%;
  left: 28%;
  width: 58vw;
  height: 40vw;
  background: radial-gradient(ellipse, var(--aurora-3), transparent 70%);
  animation: drift-c 48s var(--ease-in-out-soft) infinite alternate;
}

@keyframes drift-a {
  to {
    transform: translate3d(8vw, 6vh, 0) scale(1.12);
  }
}

@keyframes drift-b {
  to {
    transform: translate3d(-7vw, 9vh, 0) scale(0.92);
  }
}

@keyframes drift-c {
  to {
    transform: translate3d(6vw, -7vh, 0) scale(1.08);
  }
}

/* 噪点：一次性生成的 SVG 湍流，抹平大面积渐变的色带 */
.noise-layer {
  position: absolute;
  inset: 0;
  opacity: var(--noise-opacity);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

@media (prefers-reduced-motion: reduce) {
  .aurora {
    animation: none;
  }
}
</style>
