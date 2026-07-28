import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authApi } from '@/api'
import type { LoginParams, UserProfile } from '@/api/types/auth'
import type { PermissionInput, PermissionKey, RoleKey } from '@/types/permission'
import { local, StorageKeys } from '@/utils/storage'

/** token 有效期兜底（后端返回 expiresIn 时以后端为准） */
const TOKEN_TTL = 2 * 60 * 60 * 1000

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(local.get<string>(StorageKeys.TOKEN, ''))
  const profile = ref<UserProfile | null>(null)

  const isLoggedIn = computed(() => Boolean(token.value))
  const roles = computed<RoleKey[]>(() => profile.value?.roles ?? [])
  const permissions = computed<PermissionKey[]>(() => profile.value?.permissions ?? [])
  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))
  const displayName = computed(() => profile.value?.nickname ?? '未登录')
  const avatar = computed(() => profile.value?.avatar ?? '')

  /** 角色校验：super_admin 直接放行 */
  function hasRole(target?: RoleKey[]): boolean {
    if (!target || target.length === 0) return true
    if (isSuperAdmin.value) return true
    return target.some((role) => roles.value.includes(role))
  }

  /** 按钮 / 页面级权限校验，支持传入单个或数组（任一命中即可） */
  function hasPermission(target?: PermissionInput): boolean {
    if (!target) return true
    if (isSuperAdmin.value) return true
    const list = Array.isArray(target) ? target : [target]
    if (list.length === 0) return true
    return list.some((key) => permissions.value.includes(key as PermissionKey))
  }

  function setToken(next: string, expiresIn?: number): void {
    token.value = next
    local.set(StorageKeys.TOKEN, next, expiresIn ? expiresIn * 1000 : TOKEN_TTL)
  }

  async function login(params: LoginParams): Promise<UserProfile> {
    const result = await authApi.login(params)
    setToken(result.token, result.expiresIn)
    return fetchProfile()
  }

  async function fetchProfile(): Promise<UserProfile> {
    const data = await authApi.profile()
    profile.value = data
    return data
  }

  /** 只清本地状态，不发请求（401 场景复用） */
  async function resetState(): Promise<void> {
    token.value = ''
    profile.value = null
    local.remove(StorageKeys.TOKEN)

    const [{ usePermissionStore }, { useTabsStore }] = await Promise.all([
      import('./permission'),
      import('./tabs'),
    ])
    usePermissionStore().reset()
    useTabsStore().clearAll()
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) await authApi.logout()
    } catch {
      /* 退出接口失败也要清理本地状态 */
    } finally {
      await resetState()
    }
  }

  return {
    token,
    profile,
    isLoggedIn,
    roles,
    permissions,
    isSuperAdmin,
    displayName,
    avatar,
    hasRole,
    hasPermission,
    setToken,
    login,
    fetchProfile,
    logout,
    resetState,
  }
})
