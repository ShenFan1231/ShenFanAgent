<script setup lang="ts">
import { computed, ref } from 'vue'

import { projectsApi } from '@/api'
import type {
  CreateProjectPayload,
  ProjectStatus,
  ProjectType,
} from '@/api/types/project'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { useUserStore } from '@/stores/user'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from '@/utils/toast'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.06 })

const userStore = useUserStore()
const keyword = ref('')
const type = ref<ProjectType | ''>('')
const status = ref<ProjectStatus | ''>('')
const page = ref(1)
const pageSize = ref(8)

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  keyword: keyword.value,
  type: type.value,
  status: status.value,
}))

const { data, loading, refresh } = useAsyncData(() => projectsApi.list(query.value), {
  watchSource: query,
  initialData: { list: [], total: 0, page: 1, pageSize: 8 },
})

const TYPE_OPTIONS = [
  { label: '全部类型', value: '' },
  { label: '游戏', value: 'game' },
  { label: '企业应用', value: 'application' },
  { label: 'AI Agent', value: 'ai_agent' },
]

const STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '规划中', value: 'planning' },
  { label: '进行中', value: 'active' },
  { label: '已暂停', value: 'paused' },
  { label: '已归档', value: 'archived' },
]

const TYPE_META: Record<ProjectType, { label: string; icon: string; tone: 'brand' | 'violet' | 'warning' }> = {
  game: { label: '游戏', icon: 'i-lucide-gamepad-2', tone: 'violet' },
  application: { label: '企业应用', icon: 'i-lucide-panels-top-left', tone: 'brand' },
  ai_agent: { label: 'AI Agent', icon: 'i-lucide-bot', tone: 'warning' },
}

const STATUS_META: Record<
  ProjectStatus,
  { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }
> = {
  planning: { label: '规划中', tone: 'neutral' },
  active: { label: '进行中', tone: 'success' },
  paused: { label: '已暂停', tone: 'warning' },
  archived: { label: '已归档', tone: 'danger' },
}

const createVisible = ref(false)
const creating = ref(false)
const createForm = ref({
  code: '',
  name: '',
  description: '',
  type: 'application' as ProjectType,
  members: '5',
  budget: '100000',
})

async function createProject(): Promise<void> {
  if (!createForm.value.code.trim() || !createForm.value.name.trim()) {
    toast.warning('请填写项目编码和名称')
    return
  }
  creating.value = true
  try {
    const payload: CreateProjectPayload = {
      code: createForm.value.code,
      name: createForm.value.name,
      description: createForm.value.description,
      type: createForm.value.type,
      members: Number(createForm.value.members),
      budget: Number(createForm.value.budget),
      tags: [],
    }
    await projectsApi.create(payload)
    createVisible.value = false
    createForm.value = {
      code: '',
      name: '',
      description: '',
      type: 'application',
      members: '5',
      budget: '100000',
    }
    await refresh()
    toast.success('项目已创建', '写操作已同步记录到审计日志')
  } finally {
    creating.value = false
  }
}

async function advance(id: string, progress: number): Promise<void> {
  await projectsApi.update(id, { progress: Math.min(100, progress + 10) })
  await refresh()
  toast.success('项目进度已更新')
}
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1680px] space-y-4">
    <PageHeader
      data-motion
      title="项目管理"
      description="统一管理游戏、企业应用与 AI Agent 项目的交付状态"
      icon="i-lucide-boxes"
    >
      <template #actions>
        <AppButton
          v-if="userStore.hasPermission('project:create')"
          variant="primary"
          icon="i-lucide-plus"
          @click="createVisible = true"
        >
          新建项目
        </AppButton>
      </template>
    </PageHeader>

    <GlassPanel data-motion variant="outline" padding="sm">
      <div class="flex flex-wrap items-center gap-2.5">
        <AppInput
          v-model="keyword"
          placeholder="搜索项目名称 / 编码"
          icon="i-lucide-search"
          clearable
          class="w-full sm:w-64"
          @update:model-value="page = 1"
        />
        <AppSelect
          v-model="type"
          :options="TYPE_OPTIONS"
          :width="150"
          @update:model-value="page = 1"
        />
        <AppSelect
          v-model="status"
          :options="STATUS_OPTIONS"
          :width="150"
          @update:model-value="page = 1"
        />
        <AppTag class="ml-auto" tone="brand" size="xs" icon="i-lucide-database">
          {{ data?.total ?? 0 }} 个项目
        </AppTag>
      </div>
    </GlassPanel>

    <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-2 xl:grid-cols-3" data-motion>
      <GlassPanel
        v-for="project in data?.list ?? []"
        :key="project.id"
        variant="raised"
        padding="sm"
        glow
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="flex-center size-10 shrink-0 rounded-xl bg-brand/10 text-[18px] text-brand ring-1 ring-brand/20"
            >
              <i :class="TYPE_META[project.type].icon" />
            </span>
            <div class="min-w-0">
              <p class="truncate text-[14px] font-semibold">{{ project.name }}</p>
              <p class="mt-0.5 font-mono text-[10.5px] text-text-dim">{{ project.code }}</p>
            </div>
          </div>
          <AppTag :tone="STATUS_META[project.status].tone" size="xs" dot>
            {{ STATUS_META[project.status].label }}
          </AppTag>
        </div>

        <p class="mt-3 line-clamp-2 min-h-10 text-[12px] leading-relaxed text-text-soft">
          {{ project.description }}
        </p>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <AppTag :tone="TYPE_META[project.type].tone" size="xs">
            {{ TYPE_META[project.type].label }}
          </AppTag>
          <AppTag v-for="tag in project.tags" :key="tag" tone="neutral" size="xs">{{ tag }}</AppTag>
        </div>

        <div class="mt-4">
          <div class="mb-1.5 flex-between text-[11.5px]">
            <span class="text-text-dim">交付进度</span>
            <span class="tabular font-medium">{{ project.progress }}%</span>
          </div>
          <AppProgress :value="project.progress" animated />
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <div class="rounded-lg bg-elevated/45 px-2.5 py-2">
            <p class="text-[10px] text-text-dim">成员</p>
            <p class="mt-0.5 text-[12px]">{{ project.members }} 人</p>
          </div>
          <div class="rounded-lg bg-elevated/45 px-2.5 py-2">
            <p class="text-[10px] text-text-dim">预算</p>
            <p class="mt-0.5 truncate text-[12px]">{{ formatCurrency(project.budget) }}</p>
          </div>
          <div class="rounded-lg bg-elevated/45 px-2.5 py-2">
            <p class="text-[10px] text-text-dim">截止</p>
            <p class="mt-0.5 text-[12px]">
              {{ project.dueAt ? formatDate(project.dueAt, 'MM-DD') : '待定' }}
            </p>
          </div>
        </div>

        <div class="mt-3 flex-between border-t border-line/50 pt-3">
          <div class="flex items-center gap-2">
            <AppAvatar
              :src="project.owner?.avatar"
              :name="project.owner?.nickname ?? '待分配'"
              :size="26"
            />
            <span class="text-[11.5px] text-text-dim">
              {{ project.owner?.nickname ?? '待分配' }}
            </span>
          </div>
          <AppButton
            v-if="userStore.hasPermission('project:update')"
            variant="text"
            size="xs"
            icon-right="i-lucide-trending-up"
            :disabled="project.progress >= 100"
            @click="advance(project.id, project.progress)"
          >
            推进 10%
          </AppButton>
        </div>
      </GlassPanel>
    </div>

    <GlassPanel v-if="!loading && !(data?.list.length ?? 0)" data-motion>
      <p class="py-10 text-center text-[13px] text-text-dim">暂无符合条件的项目</p>
    </GlassPanel>

    <div class="flex justify-end" data-motion>
      <AppPagination
        :page="page"
        :page-size="pageSize"
        :total="data?.total ?? 0"
        @update:page="page = $event"
      />
    </div>

    <AppModal
      v-model="createVisible"
      title="新建项目"
      subtitle="创建后可继续配置负责人、标签与交付计划"
      icon="i-lucide-folder-plus"
      :confirm-loading="creating"
      @confirm="createProject"
    >
      <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">项目编码</span>
          <AppInput v-model="createForm.code" placeholder="例如 GAME-ORION" />
        </label>
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">项目类型</span>
          <AppSelect v-model="createForm.type" :options="TYPE_OPTIONS.slice(1)" :width="220" />
        </label>
        <label class="space-y-1.5 sm:col-span-2">
          <span class="text-[12px] text-text-soft">项目名称</span>
          <AppInput v-model="createForm.name" placeholder="请输入项目名称" />
        </label>
        <label class="space-y-1.5 sm:col-span-2">
          <span class="text-[12px] text-text-soft">项目说明</span>
          <AppInput v-model="createForm.description" placeholder="简要描述目标与范围" />
        </label>
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">团队人数</span>
          <AppInput v-model="createForm.members" />
        </label>
        <label class="space-y-1.5">
          <span class="text-[12px] text-text-soft">项目预算</span>
          <AppInput v-model="createForm.budget" />
        </label>
      </div>
    </AppModal>
  </div>
</template>
