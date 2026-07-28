<script setup lang="ts">
/** 角色权限矩阵：把 types/permission.ts 里的声明可视化出来。 */
import { ref } from 'vue'

import AppTag from '@/components/ui/AppTag.vue'
import GlassPanel from '@/components/ui/GlassPanel.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useEnterMotion } from '@/composables/useEnterMotion'
import { useUserStore } from '@/stores/user'
import { PERMISSIONS, ROLE_META, type PermissionKey, type RoleKey } from '@/types/permission'

const rootRef = ref<HTMLElement | null>(null)
useEnterMotion(rootRef, { stagger: 0.08 })

const userStore = useUserStore()

const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  super_admin: [...PERMISSIONS],
  admin: [
    'user:view',
    'user:create',
    'user:update',
    'user:export',
    'order:view',
    'order:create',
    'order:export',
    'notice:publish',
    'report:view',
  ],
  operator: ['user:view', 'order:view', 'report:view'],
}

const GROUP_LABEL: Record<string, string> = {
  user: '用户',
  order: '订单',
  notice: '通知',
  report: '报表',
  system: '系统',
  role: '角色',
}

const groups = Object.entries(
  PERMISSIONS.reduce<Record<string, PermissionKey[]>>((acc, key) => {
    const group = key.split(':')[0]!
    acc[group] = [...(acc[group] ?? []), key]
    return acc
  }, {}),
)

const roles = Object.values(ROLE_META)

function has(role: RoleKey, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
</script>

<template>
  <div ref="rootRef" class="mx-auto w-full max-w-[1200px] space-y-4">
    <PageHeader
      data-motion
      title="角色权限"
      description="角色与按钮级权限标识的对应关系"
      icon="i-lucide-shield-check"
    />

    <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3" data-motion>
      <GlassPanel
        v-for="meta in roles"
        :key="meta.key"
        :variant="userStore.roles.includes(meta.key) ? 'gradient' : 'default'"
        padding="sm"
        glow
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="truncate text-[14px] font-semibold">{{ meta.name }}</p>
              <AppTag v-if="userStore.roles.includes(meta.key)" tone="brand" size="xs">当前</AppTag>
            </div>
            <p class="mt-1 font-mono text-[10.5px] text-text-dim">{{ meta.key }}</p>
          </div>
          <span class="tabular shrink-0 text-[19px] font-semibold text-brand">
            {{ ROLE_PERMISSIONS[meta.key].length }}
          </span>
        </div>
        <p class="mt-2 text-[11.5px] leading-relaxed text-text-dim">{{ meta.description }}</p>
      </GlassPanel>
    </div>

    <GlassPanel data-motion title="权限矩阵" subtitle="✓ 表示该角色拥有此操作" icon="i-lucide-grid-3x3">
      <div class="overflow-x-auto">
        <table class="w-full text-[12.5px]">
          <thead>
            <tr class="border-b border-line/70">
              <th class="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider text-text-dim">
                权限标识
              </th>
              <th
                v-for="meta in roles"
                :key="meta.key"
                class="px-3 py-2.5 text-center text-[11px] uppercase tracking-wider text-text-dim"
              >
                {{ meta.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="[group, keys] in groups" :key="group">
              <tr class="bg-elevated/25">
                <td :colspan="roles.length + 1" class="px-3 py-1.5 text-[11px] font-medium text-text-soft">
                  {{ GROUP_LABEL[group] ?? group }}
                </td>
              </tr>
              <tr
                v-for="permission in keys"
                :key="permission"
                class="border-b border-line/35 transition-colors hover:bg-elevated/45"
              >
                <td class="px-3 py-2 font-mono text-[11.5px] text-text-soft">{{ permission }}</td>
                <td v-for="meta in roles" :key="meta.key" class="px-3 py-2 text-center">
                  <i
                    v-if="has(meta.key, permission)"
                    class="i-lucide-check text-[14px] text-success"
                  />
                  <i v-else class="i-lucide-minus text-[13px] text-text-dim/50" />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </GlassPanel>
  </div>
</template>
