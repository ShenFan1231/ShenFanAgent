import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import { filterRoutes, generateMenus } from '@/router/helper'
import { asyncRoutes } from '@/router/routes'
import type { MenuItem } from '@/types/menu'
import type { PermissionKey, RoleKey } from '@/types/permission'

export const usePermissionStore = defineStore('permission', () => {
  /** 路由记录不需要深层响应式，用 shallowRef 避免大对象被递归代理 */
  const accessibleRoutes = shallowRef<RouteRecordRaw[]>([])
  const menus = ref<MenuItem[]>([])
  const generated = ref(false)
  /** router.addRoute 的反注册函数，退出登录 / 切换角色时用来彻底卸载动态路由 */
  const removers = shallowRef<Array<() => void>>([])

  const hasRoutes = computed(() => generated.value)

  /**
   * 根据角色 / 权限生成可访问路由与菜单。
   * 返回值交给路由守卫去 addRoute，store 本身不碰 router 实例，方便单测。
   */
  function buildRoutes(roles: RoleKey[], permissions: PermissionKey[]): RouteRecordRaw[] {
    const filtered = filterRoutes(asyncRoutes, { roles, permissions })
    accessibleRoutes.value = filtered
    menus.value = generateMenus(filtered)
    generated.value = true
    return filtered
  }

  function registerRemovers(list: Array<() => void>): void {
    removers.value = list
  }

  function reset(): void {
    // 不卸载会导致切换角色后旧路由仍可访问
    removers.value.forEach((remove) => remove())
    removers.value = []
    accessibleRoutes.value = []
    menus.value = []
    generated.value = false
  }

  return {
    accessibleRoutes,
    menus,
    generated,
    hasRoutes,
    buildRoutes,
    registerRemovers,
    reset,
  }
})
