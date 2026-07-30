import type { Router, RouteRecordRaw } from 'vue-router'

import { usePermissionStore } from '@/stores/permission'
import { useTabsStore } from '@/stores/tabs'
import { useUserStore } from '@/stores/user'
import { doneProgress, startProgress } from '@/utils/progress'
import { asyncRoutes } from './routes'
import { joinPath } from './helper'

const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'NEBULA'
const WHITE_LIST = ['/login', '/error/403', '/error/404']

/** 打平完整路由表，用于区分"路径不存在(404)"与"没有权限(403)" */
function collectAllPaths(routes: RouteRecordRaw[], parent = ''): string[] {
  return routes.flatMap((route) => {
    const full = joinPath(parent, route.path)
    return [full, ...(route.children ? collectAllPaths(route.children, full) : [])]
  })
}

const ALL_PATHS = collectAllPaths(asyncRoutes)

function matchesKnownPath(path: string): boolean {
  return ALL_PATHS.some((known) => {
    if (known === path) return true
    // /order/detail/:id 这类动态段做一次宽松匹配
    if (!known.includes(':')) return false
    const pattern = new RegExp(`^${known.replace(/:[^/]+/g, '[^/]+')}$`)
    return pattern.test(path)
  })
}

export function setupRouterGuard(router: Router): void {
  router.beforeEach(async (to) => {
    startProgress()

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    const tabsStore = useTabsStore()

    const requiresAuth = to.meta.requiresAuth !== false

    if (!requiresAuth || WHITE_LIST.includes(to.path)) {
      // 已登录用户不应再看到登录页
      if (to.path === '/login' && userStore.isLoggedIn) return { path: '/', replace: true }
      return true
    }

    if (!userStore.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath }, replace: true }
    }

    // 刷新页面后 token 还在但内存里没有用户信息，需要补一次
    if (!userStore.profile) {
      try {
        await userStore.fetchProfile()
      } catch {
        await userStore.resetState()
        return { path: '/login', query: { redirect: to.fullPath }, replace: true }
      }
    }

    // 首次进入：按角色生成可访问路由并动态注册
    if (!permissionStore.generated) {
      const routes = permissionStore.buildRoutes(
        userStore.roles,
        userStore.permissions,
        userStore.profile?.menus,
      )
      permissionStore.registerRemovers(routes.map((route) => router.addRoute(route)))
      tabsStore.restore()
      tabsStore.initAffixTabs(permissionStore.accessibleRoutes)
      /**
       * 动态路由注册后必须重新解析一次，否则本次导航仍然匹配不到组件。
       * 这里只能带 path，不能用 `{ ...to }`：此刻 to.name 很可能是兜底路由的
       * NotFound，而按 name 跳转的优先级高于 path，会把用户又送回 404。
       */
      return { path: to.path, query: to.query, hash: to.hash, replace: true }
    }

    // 路径本身存在但被权限过滤掉了 → 403，而不是笼统的 404
    if (to.matched.length === 0 || to.name === 'NotFound') {
      return matchesKnownPath(to.path)
        ? { path: '/error/403', replace: true }
        : { path: '/error/404', replace: true }
    }

    if (!userStore.hasRole(to.meta.roles) || !userStore.hasPermission(to.meta.permissions)) {
      return { path: '/error/403', replace: true }
    }

    return true
  })

  router.afterEach((to) => {
    const tabsStore = useTabsStore()
    tabsStore.addTab(to)

    document.title = to.meta.title ? `${to.meta.title} · ${APP_TITLE}` : APP_TITLE
    doneProgress()
  })

  router.onError(() => {
    doneProgress()
  })
}
