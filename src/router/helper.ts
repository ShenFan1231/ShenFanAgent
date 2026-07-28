import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'

import type { BreadcrumbItem, MenuItem } from '@/types/menu'
import type { PermissionKey, RoleKey } from '@/types/permission'

interface AccessContext {
  roles: RoleKey[]
  permissions: PermissionKey[]
}

function isSuper(ctx: AccessContext): boolean {
  return ctx.roles.includes('super_admin')
}

/** 单条路由是否可访问：角色与权限都满足才通过 */
export function canAccess(route: RouteRecordRaw, ctx: AccessContext): boolean {
  if (isSuper(ctx)) return true

  const roles = route.meta?.roles
  if (roles?.length && !roles.some((role) => ctx.roles.includes(role))) return false

  const permissions = route.meta?.permissions
  if (permissions?.length && !permissions.some((key) => ctx.permissions.includes(key))) return false

  return true
}

/**
 * 递归过滤路由表。
 * 父级不可访问则整棵子树剪掉；父级可访问但子级全部被过滤时，同样剪掉父级，
 * 避免出现点进去空白的菜单。
 */
export function filterRoutes(routes: RouteRecordRaw[], ctx: AccessContext): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const route of routes) {
    if (!canAccess(route, ctx)) continue

    const cloned: RouteRecordRaw = { ...route }
    if (route.children?.length) {
      const children = filterRoutes(route.children, ctx)
      if (children.length === 0) continue
      cloned.children = children
      // 原 redirect 指向的子路由可能已被过滤，回退到第一个可访问子路由
      if (cloned.redirect && !children.some((c) => joinPath(route.path, c.path) === cloned.redirect)) {
        cloned.redirect = joinPath(route.path, children[0]!.path)
      }
    }
    result.push(cloned)
  }

  return result
}

export function joinPath(parent: string, child: string): string {
  if (/^https?:\/\//.test(child)) return child
  if (child.startsWith('/')) return child
  if (!child) return parent
  return `${parent.replace(/\/+$/, '')}/${child}`
}

/**
 * 由路由表推导菜单树。
 * 路由与菜单在这里解耦：菜单只依赖 meta，将来换成接口下发同结构即可。
 *
 * 规则：
 * - `hideInMenu` 的分支整棵剪掉；
 * - 没有 `title` 的层级视为"透明容器"（如根布局），子菜单提升到当前层级；
 * - 只有一个可见子菜单且未声明 `alwaysShow` 时，父级折叠成单个菜单项。
 */
export function generateMenus(routes: RouteRecordRaw[], parentPath = ''): MenuItem[] {
  const menus: MenuItem[] = []

  for (const route of routes) {
    if (route.meta?.hideInMenu) continue

    const fullPath = joinPath(parentPath, route.path)
    const visibleChildren = (route.children ?? []).filter((child) => !child.meta?.hideInMenu)
    const title = route.meta?.title
    const order = route.meta?.order

    if (!title) {
      menus.push(...generateMenus(visibleChildren, fullPath))
      continue
    }

    if (visibleChildren.length === 1 && !route.meta?.alwaysShow) {
      const [child] = generateMenus(visibleChildren, fullPath)
      if (child) {
        menus.push({ ...child, icon: child.icon ?? route.meta?.icon, order: order ?? child.order })
      }
      continue
    }

    if (visibleChildren.length > 1) {
      menus.push({
        key: String(route.name ?? fullPath),
        path: fullPath,
        title,
        icon: route.meta?.icon,
        badge: route.meta?.badge,
        order,
        children: generateMenus(visibleChildren, fullPath),
      })
      continue
    }

    menus.push({
      key: String(route.name ?? fullPath),
      path: fullPath,
      title,
      icon: route.meta?.icon,
      badge: route.meta?.badge,
      link: route.meta?.link,
      order,
    })
  }

  return menus.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
}

/** 由 matched 生成面包屑，跳过没有标题或显式隐藏的层级 */
export function buildBreadcrumb(route: RouteLocationNormalizedLoaded): BreadcrumbItem[] {
  return route.matched
    .filter((record) => record.meta?.title && !record.meta?.breadcrumbHidden)
    .map((record) => ({
      title: record.meta.title ?? '',
      icon: record.meta.icon,
      path: record.path === route.path ? undefined : record.path,
    }))
}

/** 找到菜单树中命中当前路径的那条链路（用于父级菜单高亮 / 自动展开） */
export function findMenuChain(menus: MenuItem[], path: string): MenuItem[] {
  for (const menu of menus) {
    if (menu.path === path) return [menu]
    if (menu.children?.length) {
      const chain = findMenuChain(menu.children, path)
      if (chain.length) return [menu, ...chain]
    }
  }
  return []
}
