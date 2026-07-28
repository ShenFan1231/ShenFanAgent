<script setup lang="ts">
import { ref } from 'vue'

import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { vPermission } from '@/directives'
import { toast } from '@/utils/toast'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.08 })

const saving = ref(false)

const form = ref({
  siteName: 'NEBULA 控制台',
  apiBase: import.meta.env.VITE_API_BASE_URL,
  timeout: String(import.meta.env.VITE_REQUEST_TIMEOUT ?? '15000'),
  sessionTtl: '7200',
  logLevel: 'info',
  mfa: true,
  ipWhitelist: false,
  auditLog: true,
  autoBackup: true,
})

const LOG_LEVELS = [
  { label: 'debug', value: 'debug' },
  { label: 'info', value: 'info' },
  { label: 'warn', value: 'warn' },
  { label: 'error', value: 'error' },
]

async function save(): Promise<void> {
  saving.value = true
  await new Promise((resolve) => setTimeout(resolve, 600))
  saving.value = false
  toast.success('配置已保存', '演示环境不会写入真实配置中心')
}
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1000px] space-y-4">
    <PageHeader
      data-motion
      title="系统设置"
      description="仅超级管理员可见，需要 system:config 权限"
      icon="i-lucide-sliders-horizontal"
    >
      <template #actions>
        <AppTag tone="danger" size="xs" icon="i-lucide-lock">高危配置</AppTag>
        <AppButton
          v-permission="'system:config'"
          variant="primary"
          icon="i-lucide-save"
          :loading="saving"
          @click="save"
        >
          保存配置
        </AppButton>
      </template>
    </PageHeader>

    <GlassPanel data-motion title="基础信息" icon="i-lucide-settings-2" edge>
      <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">站点名称</span>
          <AppInput v-model="form.siteName" icon="i-lucide-type" />
        </label>
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">接口前缀</span>
          <AppInput v-model="form.apiBase" icon="i-lucide-link" />
        </label>
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">请求超时（ms）</span>
          <AppInput v-model="form.timeout" icon="i-lucide-timer" />
        </label>
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">会话有效期（秒）</span>
          <AppInput v-model="form.sessionTtl" icon="i-lucide-clock" />
        </label>
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">日志级别</span>
          <AppSelect v-model="form.logLevel" :options="LOG_LEVELS" :width="200" />
        </label>
      </div>
    </GlassPanel>

    <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <GlassPanel data-motion variant="raised" title="安全策略" icon="i-lucide-shield-alert">
        <div class="space-y-3.5">
          <AppSwitch v-model="form.mfa" label="强制二次验证" description="管理员登录需短信 / TOTP" />
          <AppSwitch v-model="form.ipWhitelist" label="IP 白名单" description="仅允许内网网段访问" />
          <AppSwitch v-model="form.auditLog" label="操作审计" description="记录所有写操作与导出行为" />
        </div>
      </GlassPanel>

      <GlassPanel data-motion variant="outline" title="数据与备份" icon="i-lucide-database-backup">
        <div class="space-y-3.5">
          <AppSwitch v-model="form.autoBackup" label="每日自动备份" description="每天 03:00 全量备份" />
          <div class="rounded-xl border border-line/55 bg-elevated/30 p-3">
            <p class="text-[11.5px] text-text-dim">最近备份</p>
            <p class="mt-1 text-[13px]">2026-07-27 03:00 · 快照 12.4 GB</p>
            <AppButton
              class="mt-2.5"
              variant="soft"
              size="sm"
              icon="i-lucide-download"
              @click="toast.info('演示环境：备份下载需接入对象存储')"
            >
              下载最近备份
            </AppButton>
          </div>
        </div>
      </GlassPanel>
    </div>
  </div>
</template>
