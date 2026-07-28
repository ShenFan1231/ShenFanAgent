<script setup lang="ts">
/**
 * 组件与动效实验室。
 * 集中演示基础组件、过渡、骨架屏与空状态 —— 也是回归测试这些交互最快的地方。
 */
import { ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import AppEmpty from '@/components/ui/AppEmpty.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import AppSegmented from '@/components/ui/AppSegmented.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSkeleton from '@/components/ui/AppSkeleton.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppTag from '@/components/ui/AppTag.vue'
import CountUp from '@/components/ui/CountUp.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import RadialGauge from '@/components/charts/RadialGauge.vue'
import SparkLine from '@/components/charts/SparkLine.vue'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { vReveal, vSpotlight } from '@/directives'
import { toast } from '@/utils/toast'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.06 })

const modalOpen = ref(false)
const drawerOpen = ref(false)
const loadingDemo = ref(false)
const switchValue = ref(true)
const inputValue = ref('')
const segment = ref('a')
const selectValue = ref('option-1')
const progress = ref(42)
const counter = ref(86420)

const SPARK = [12, 18, 15, 24, 22, 31, 28, 36, 33, 44, 41, 52, 48, 61]

function fakeLoad(): void {
  loadingDemo.value = true
  window.setTimeout(() => (loadingDemo.value = false), 1600)
}

function shuffle(): void {
  counter.value = Math.round(20000 + Math.random() * 160000)
  progress.value = Math.round(20 + Math.random() * 75)
}
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1400px] space-y-4">
    <PageHeader
      data-motion
      title="组件与动效"
      description="基础组件、过渡动画与加载状态的集中演示"
      icon="i-lucide-sparkles"
    >
      <template #actions>
        <AppButton variant="soft" icon="i-lucide-dices" @click="shuffle">随机数据</AppButton>
        <AppButton variant="primary" icon="i-lucide-bell" @click="toast.success('这是一条成功提示', '4 条以上会自动出栈')">
          触发提示
        </AppButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
      <GlassPanel data-motion title="按钮" subtitle="6 种变体 · 涟漪反馈" icon="i-lucide-mouse-pointer-2">
        <div class="flex flex-wrap gap-2">
          <AppButton variant="primary">主要</AppButton>
          <AppButton variant="soft">次要</AppButton>
          <AppButton variant="outline">描边</AppButton>
          <AppButton variant="ghost">幽灵</AppButton>
          <AppButton variant="danger" icon="i-lucide-trash-2">危险</AppButton>
          <AppButton variant="text">文字</AppButton>
          <AppButton variant="primary" loading>加载中</AppButton>
          <AppButton variant="soft" disabled>禁用</AppButton>
        </div>
      </GlassPanel>

      <GlassPanel data-motion variant="raised" title="标签与状态" icon="i-lucide-tags">
        <div class="flex flex-wrap gap-2">
          <AppTag tone="brand" dot>运行中</AppTag>
          <AppTag tone="success" icon="i-lucide-check">已完成</AppTag>
          <AppTag tone="warning" icon="i-lucide-triangle-alert">告警</AppTag>
          <AppTag tone="danger" icon="i-lucide-x">失败</AppTag>
          <AppTag tone="violet">Beta</AppTag>
          <AppTag tone="neutral">默认</AppTag>
        </div>
        <div class="mt-4 space-y-3">
          <AppProgress :value="progress" tone="brand" animated show-label />
          <AppProgress :value="progress + 30" tone="auto" show-label />
        </div>
      </GlassPanel>

      <GlassPanel data-motion variant="outline" title="表单控件" icon="i-lucide-square-pen">
        <div class="space-y-3.5">
          <AppInput v-model="inputValue" placeholder="可清空的输入框" icon="i-lucide-search" clearable />
          <AppSelect
            v-model="selectValue"
            :options="[
              { label: '选项一', value: 'option-1', icon: 'i-lucide-circle' },
              { label: '选项二', value: 'option-2', icon: 'i-lucide-square' },
              { label: '选项三', value: 'option-3', icon: 'i-lucide-triangle' },
            ]"
            :width="220"
          />
          <AppSegmented
            v-model="segment"
            :options="[
              { label: '日', value: 'a' },
              { label: '周', value: 'b' },
              { label: '月', value: 'c' },
            ]"
            class="w-full"
          />
          <AppSwitch v-model="switchValue" label="开关组件" description="带弹性缓动的滑块" />
        </div>
      </GlassPanel>
    </div>

    <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
      <GlassPanel
        data-motion
        class="lg:col-span-4"
        title="数字滚动"
        subtitle="rAF + easeOutExpo"
        icon="i-lucide-hash"
      >
        <p class="text-[34px] font-semibold leading-none tracking-tight">
          <CountUp :value="counter" format="compact" />
        </p>
        <div class="mt-3">
          <SparkLine :data="SPARK" tone="brand" :height="56" />
        </div>
      </GlassPanel>

      <GlassPanel
        data-motion
        class="lg:col-span-4"
        title="环形仪表"
        subtitle="SVG stroke 过渡"
        icon="i-lucide-gauge"
      >
        <div class="flex justify-around">
          <RadialGauge :value="progress" label="CPU" :size="96" />
          <RadialGauge :value="100 - progress" label="内存" :size="96" tone="violet" />
        </div>
      </GlassPanel>

      <GlassPanel
        data-motion
        class="lg:col-span-4"
        title="弹层"
        subtitle="Teleport + 自然过渡"
        icon="i-lucide-layers-2"
      >
        <div class="flex flex-wrap gap-2">
          <AppButton variant="soft" icon="i-lucide-square-dashed" @click="modalOpen = true">
            打开弹窗
          </AppButton>
          <AppButton variant="soft" icon="i-lucide-panel-right" @click="drawerOpen = true">
            打开抽屉
          </AppButton>
          <AppButton variant="ghost" icon="i-lucide-loader" @click="fakeLoad">模拟加载</AppButton>
        </div>
        <div class="mt-3.5">
          <Transition name="fade-slide" mode="out-in">
            <AppSkeleton v-if="loadingDemo" variant="list" :rows="2" />
            <AppEmpty
              v-else
              size="sm"
              title="空状态"
              description="呼吸感的占位图形，避免灰色插图的廉价感"
            />
          </Transition>
        </div>
      </GlassPanel>
    </div>

    <!-- 滚动揭示 + 光标高光 -->
    <GlassPanel data-motion title="滚动揭示与光标高光" subtitle="v-reveal / v-spotlight" icon="i-lucide-scan">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="i in 4"
          :key="i"
          v-reveal="i * 90"
          v-spotlight.tilt="5"
          class="rounded-2xl border border-line/60 bg-elevated/35 p-4"
        >
          <span class="flex-center size-9 rounded-xl bg-brand/12 text-brand ring-1 ring-brand/20">
            <i class="i-lucide-box" />
          </span>
          <p class="mt-2.5 text-[13px] font-medium">卡片 {{ i }}</p>
          <p class="mt-0.5 text-[11.5px] text-text-dim">鼠标移入有高光与轻微倾斜</p>
        </div>
      </div>
    </GlassPanel>

    <AppModal
      v-model="modalOpen"
      title="弹窗示例"
      subtitle="Esc 关闭 · 点击遮罩关闭"
      icon="i-lucide-square-dashed"
      @confirm="((modalOpen = false), toast.success('已确认'))"
    >
      <p class="text-[13px] leading-relaxed text-text-soft">
        弹窗进入使用位移 + 缩放 + 遮罩模糊的组合，离开时缩短时长，
        让"关闭"的反馈比"打开"更快 —— 这是让交互显得利落的小细节。
      </p>
    </AppModal>

    <AppDrawer v-model="drawerOpen" title="抽屉示例" subtitle="右侧滑入" icon="i-lucide-panel-right">
      <div class="space-y-2.5">
        <div
          v-for="i in 6"
          :key="i"
          class="rounded-xl border border-line/55 bg-elevated/35 px-3 py-2.5 text-[12.5px] text-text-soft"
        >
          列表项 {{ i }}
        </div>
      </div>
    </AppDrawer>
  </div>
</template>
