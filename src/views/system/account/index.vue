<script setup lang="ts">
import { computed, ref } from 'vue'

import { systemApi } from '@/api'
import type { AccountItem, AccountStatus } from '@/api/types/system'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppTag from '@/components/ui/AppTag.vue'
import DataTable from '@/components/ui/DataTable.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import type { TableColumn } from '@/components/ui/types'
import { useAsyncData } from '@/composables/useAsyncData'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { vPermission } from '@/directives'
import { ROLE_META, type RoleKey } from '@/types/permission'
import { formatDate, fromNow } from '@/utils/format'
import { toast } from '@/utils/toast'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.07 })

/**
 * 这些筛选条件是"页面状态"，被 KeepAlive 缓存下来。
 * 切到别的标签再回来，关键词、页码、选中项都还在 —— 这正是 keepAlive 的价值。
 */
const keyword = ref('')
const status = ref<AccountStatus | ''>('')
const role = ref<RoleKey | ''>('')
const page = ref(1)
const pageSize = ref(10)

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  keyword: keyword.value,
  status: status.value,
  role: role.value,
}))

const { data, loading, refresh } = useAsyncData(() => systemApi.accounts(query.value), {
  watchSource: query,
  initialData: { list: [], total: 0, page: 1, pageSize: 10 },
})

const STATUS_OPTIONS = [
  { label: '全部状态', value: '' },
  { label: '正常', value: 'active' },
  { label: '待激活', value: 'pending' },
  { label: '已停用', value: 'disabled' },
]

const ROLE_OPTIONS = [
  { label: '全部角色', value: '' },
  { label: '超级管理员', value: 'super_admin' },
  { label: '管理员', value: 'admin' },
  { label: '运营', value: 'operator' },
]

const STATUS_META: Record<AccountStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  active: { label: '正常', tone: 'success' },
  pending: { label: '待激活', tone: 'warning' },
  disabled: { label: '已停用', tone: 'neutral' },
}

const columns: TableColumn[] = [
  { key: 'nickname', title: '成员' },
  { key: 'department', title: '部门', hideOnMobile: true },
  { key: 'role', title: '角色' },
  { key: 'status', title: '状态', align: 'center' },
  { key: 'lastActiveAt', title: '最近活跃', hideOnMobile: true },
  { key: 'actions', title: '操作', align: 'right', width: '120px' },
]

/* --------------------------------------------------------------- 交互 --- */
const detailTarget = ref<AccountItem | null>(null)
const removeTarget = ref<AccountItem | null>(null)
const removing = ref(false)

function resetFilters(): void {
  keyword.value = ''
  status.value = ''
  role.value = ''
  page.value = 1
}

async function confirmRemove(): Promise<void> {
  if (!removeTarget.value) return
  removing.value = true
  try {
    await systemApi.removeAccount(removeTarget.value.id)
    toast.success('已删除该成员', '演示环境下不会真正落库')
    removeTarget.value = null
    await refresh()
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1680px] space-y-4">
    <PageHeader
      data-motion
      title="用户管理"
      description="管理后台成员、部门归属与角色分配"
      icon="i-lucide-users-round"
    >
      <template #actions>
        <AppButton variant="soft" icon="i-lucide-download" v-permission="'user:export'">
          导出
        </AppButton>
        <AppButton
          v-permission="'user:create'"
          variant="primary"
          icon="i-lucide-user-plus"
          @click="toast.info('演示环境：新建用户表单可在控制台快捷操作中体验')"
        >
          新增用户
        </AppButton>
      </template>
    </PageHeader>

    <GlassPanel data-motion variant="outline" padding="sm">
      <div class="flex flex-wrap items-center gap-2.5">
        <AppInput
          v-model="keyword"
          placeholder="搜索昵称 / 账号 / 邮箱"
          icon="i-lucide-search"
          clearable
          class="w-full sm:w-64"
          @update:model-value="page = 1"
        />
        <AppSelect
          v-model="status"
          :options="STATUS_OPTIONS"
          icon="i-lucide-toggle-left"
          @update:model-value="page = 1"
        />
        <AppSelect
          v-model="role"
          :options="ROLE_OPTIONS"
          icon="i-lucide-shield"
          :width="160"
          @update:model-value="page = 1"
        />
        <AppButton variant="ghost" icon="i-lucide-rotate-ccw" @click="resetFilters">重置</AppButton>
        <div class="ml-auto flex items-center gap-2">
          <AppTag tone="brand" size="xs" icon="i-lucide-database">
            {{ data?.total ?? 0 }} 条记录
          </AppTag>
          <AppButton variant="soft" size="sm" icon="i-lucide-refresh-cw" :loading="loading" @click="refresh">
            刷新
          </AppButton>
        </div>
      </div>
    </GlassPanel>

    <GlassPanel data-motion padding="sm" :loading="loading && (data?.list.length ?? 0) > 0">
      <DataTable
        :columns="columns"
        :data="data?.list ?? []"
        :loading="loading"
        empty-text="没有符合条件的成员"
        @row-click="detailTarget = $event"
      >
        <template #cell-nickname="{ row }">
          <div class="flex items-center gap-2.5">
            <AppAvatar :src="row.avatar" :name="row.nickname" :size="32" status="online" />
            <div class="min-w-0">
              <p class="truncate text-[13px] font-medium">{{ row.nickname }}</p>
              <p class="truncate text-[11px] text-text-dim">{{ row.email }}</p>
            </div>
          </div>
        </template>

        <template #cell-department="{ row }">
          <span class="text-text-soft">{{ row.department }}</span>
        </template>

        <template #cell-role="{ row }">
          <AppTag :tone="row.role === 'super_admin' ? 'violet' : row.role === 'admin' ? 'brand' : 'neutral'" size="xs">
            {{ ROLE_META[row.role]?.name ?? row.role }}
          </AppTag>
        </template>

        <template #cell-status="{ row }">
          <AppTag :tone="STATUS_META[row.status].tone" :dot="row.status === 'active'" size="xs">
            {{ STATUS_META[row.status].label }}
          </AppTag>
        </template>

        <template #cell-lastActiveAt="{ row }">
          <span class="text-[12px] text-text-dim">{{ fromNow(row.lastActiveAt) }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1" @click.stop>
            <button class="row-action" title="查看" @click="detailTarget = row">
              <i class="i-lucide-eye" />
            </button>
            <button v-permission="'user:update'" class="row-action" title="编辑">
              <i class="i-lucide-pencil" />
            </button>
            <button
              v-permission="'user:delete'"
              class="row-action row-action--danger"
              title="删除"
              @click="removeTarget = row"
            >
              <i class="i-lucide-trash-2" />
            </button>
          </div>
        </template>
      </DataTable>

      <template #footer>
        <AppPagination
          :page="page"
          :page-size="pageSize"
          :total="data?.total ?? 0"
          @update:page="page = $event"
        />
      </template>
    </GlassPanel>

    <!-- 详情抽屉式弹窗 -->
    <AppModal
      :model-value="detailTarget !== null"
      title="成员详情"
      :subtitle="detailTarget?.username"
      icon="i-lucide-id-card"
      hide-footer
      @update:model-value="detailTarget = null"
    >
      <div v-if="detailTarget" class="space-y-4">
        <div class="flex items-center gap-3">
          <AppAvatar :src="detailTarget.avatar" :name="detailTarget.nickname" :size="52" ring />
          <div class="min-w-0">
            <p class="truncate text-[15px] font-semibold">{{ detailTarget.nickname }}</p>
            <p class="truncate text-[12px] text-text-dim">{{ detailTarget.email }}</p>
          </div>
        </div>
        <dl class="grid grid-cols-2 gap-3">
          <div
            v-for="item in [
              { label: '账号', value: detailTarget.username },
              { label: '部门', value: detailTarget.department },
              { label: '角色', value: ROLE_META[detailTarget.role]?.name ?? detailTarget.role },
              { label: '状态', value: STATUS_META[detailTarget.status].label },
              { label: '创建时间', value: formatDate(detailTarget.createdAt, 'YYYY-MM-DD') },
              { label: '最近活跃', value: fromNow(detailTarget.lastActiveAt) },
            ]"
            :key="item.label"
            class="rounded-xl border border-line/55 bg-elevated/35 px-3 py-2"
          >
            <dt class="text-[11px] text-text-dim">{{ item.label }}</dt>
            <dd class="mt-0.5 truncate text-[13px]">{{ item.value }}</dd>
          </div>
        </dl>
      </div>
    </AppModal>

    <!-- 删除确认 -->
    <AppModal
      :model-value="removeTarget !== null"
      title="删除成员"
      subtitle="该操作不可撤销"
      icon="i-lucide-triangle-alert"
      :width="420"
      confirm-text="确认删除"
      :confirm-loading="removing"
      @update:model-value="removeTarget = null"
      @confirm="confirmRemove"
    >
      <p class="text-[13px] leading-relaxed text-text-soft">
        确定要删除成员
        <span class="font-medium text-danger">{{ removeTarget?.nickname }}</span>
        吗？删除后其所有权限将立即失效。
      </p>
    </AppModal>
  </div>
</template>

<style scoped>
.row-action {
  --uno: 'flex-center size-7 rounded-lg text-text-dim transition-all duration-200';
}

.row-action:hover {
  --uno: 'bg-brand/12 text-brand scale-110';
}

.row-action--danger:hover {
  --uno: 'bg-danger/12 text-danger';
}
</style>
