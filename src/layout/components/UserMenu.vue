<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppDropdown from '@/components/ui/AppDropdown.vue'
import AppDropdownItem from '@/components/ui/AppDropdownItem.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppTag from '@/components/ui/AppTag.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { ROLE_META, type RoleKey } from '@/types/permission'
import { formatDate } from '@/utils/format'
import { toast } from '@/utils/toast'

const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const roleModalOpen = ref(false)
const switching = ref<RoleKey | null>(null)

const DEMO_ACCOUNT: Record<RoleKey, string> = {
  super_admin: 'admin',
  admin: 'manager',
  operator: 'operator',
}

/**
 * 演示用的角色切换：走一次完整的"退出 → 登录"流程，
 * 因此动态路由、菜单、标签页缓存都会按新角色重建，
 * 正好可以验证整套权限链路是否自洽。
 */
async function switchRole(role: RoleKey): Promise<void> {
  if (userStore.roles.includes(role)) {
    roleModalOpen.value = false
    return
  }
  switching.value = role
  appStore.globalLoading = true
  try {
    await userStore.logout()
    await userStore.login({ username: DEMO_ACCOUNT[role], password: 'nebula123', role })
    await router.replace('/dashboard')
    toast.success(`已切换为「${ROLE_META[role].name}」`, '菜单与按钮权限已同步更新')
  } catch {
    toast.error('角色切换失败')
  } finally {
    switching.value = null
    appStore.globalLoading = false
    roleModalOpen.value = false
  }
}

async function logout(): Promise<void> {
  await userStore.logout()
  await router.replace('/login')
  toast.info('已退出登录')
}
</script>

<template>
  <AppDropdown :width="228" origin="top right">
    <template #trigger="{ open }">
      <button
        class="focus-ring flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors duration-200"
        :class="open ? 'bg-elevated' : 'hover:bg-elevated/70'"
      >
        <AppAvatar :src="userStore.avatar" :name="userStore.displayName" :size="30" ring />
        <span class="hidden min-w-0 text-left lg:block">
          <span class="block max-w-28 truncate text-[12.5px] font-medium leading-tight">
            {{ userStore.displayName }}
          </span>
          <span class="block text-[10.5px] leading-tight text-text-dim">
            {{ userStore.profile?.jobTitle ?? '—' }}
          </span>
        </span>
        <i
          class="i-lucide-chevron-down text-[13px] text-text-dim transition-transform duration-300"
          :class="open ? 'rotate-180' : ''"
        />
      </button>
    </template>

    <div class="mb-1 border-b border-line/60 px-2.5 pb-2.5 pt-1.5">
      <p class="truncate text-[13px] font-medium">{{ userStore.profile?.nickname }}</p>
      <p class="truncate text-[11px] text-text-dim">{{ userStore.profile?.email }}</p>
      <div class="mt-2 flex flex-wrap gap-1">
        <AppTag v-for="role in userStore.roles" :key="role" tone="violet" size="xs">
          {{ ROLE_META[role]?.name ?? role }}
        </AppTag>
      </div>
    </div>

    <AppDropdownItem icon="i-lucide-id-card" @click="router.push('/account/profile')">
      个人中心
    </AppDropdownItem>
    <AppDropdownItem icon="i-lucide-user-cog" @click="roleModalOpen = true">
      切换演示角色
    </AppDropdownItem>
    <AppDropdownItem icon="i-lucide-sliders-horizontal" @click="appStore.settingsPanelOpen = true">
      界面设置
    </AppDropdownItem>
    <AppDropdownItem icon="i-lucide-sun-moon" @click="appStore.toggleTheme()">
      切换主题
    </AppDropdownItem>
    <div class="my-1 h-px bg-line/60" />
    <AppDropdownItem icon="i-lucide-log-out" danger @click="logout">退出登录</AppDropdownItem>
  </AppDropdown>

  <AppModal
    v-model="roleModalOpen"
    title="切换演示角色"
    subtitle="用于验证菜单、页面与按钮三层权限"
    icon="i-lucide-user-cog"
    :width="480"
    hide-footer
  >
    <div class="space-y-2.5">
      <button
        v-for="meta in Object.values(ROLE_META)"
        :key="meta.key"
        class="group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-300"
        :class="
          userStore.roles.includes(meta.key)
            ? 'border-brand/45 bg-brand/8'
            : 'border-line/65 hover:-translate-y-0.5 hover:border-brand/35 hover:bg-elevated/60'
        "
        :disabled="switching !== null"
        @click="switchRole(meta.key)"
      >
        <span
          class="flex-center size-9 shrink-0 rounded-xl bg-elevated ring-1 ring-line/60 transition-transform duration-300 group-hover:scale-110"
        >
          <i
            :class="[
              meta.key === 'super_admin'
                ? 'i-lucide-crown'
                : meta.key === 'admin'
                  ? 'i-lucide-shield-check'
                  : 'i-lucide-line-chart',
              'text-[17px] text-brand',
            ]"
          />
        </span>
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-2">
            <span class="text-[13.5px] font-medium">{{ meta.name }}</span>
            <AppTag v-if="userStore.roles.includes(meta.key)" tone="brand" size="xs">当前</AppTag>
          </span>
          <span class="mt-0.5 block text-[11.5px] leading-relaxed text-text-dim">
            {{ meta.description }}
          </span>
        </span>
        <i
          v-if="switching === meta.key"
          class="i-lucide-loader-circle mt-1 shrink-0 animate-spin text-brand"
        />
      </button>

      <p class="pt-1 text-[11px] leading-relaxed text-text-dim">
        最近登录：{{ userStore.profile ? formatDate(userStore.profile.lastLoginAt) : '—' }} ·
        IP {{ userStore.profile?.lastLoginIp }}
      </p>
    </div>
  </AppModal>
</template>
