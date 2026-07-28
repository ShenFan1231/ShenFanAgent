import type { LoginParams } from '@/api/types/auth'
import type { RangeKey } from '@/api/types/common'
import type { AccountItem, AccountStatus, OrderItem, OrderStatus } from '@/api/types/system'
import type { RoleKey } from '@/types/permission'
import {
  buildAccounts,
  buildActivities,
  buildNotifications,
  buildOrders,
  buildOverview,
  buildProfile,
  buildRegionRank,
  buildSystemStatus,
  buildTrafficSources,
  buildTrend,
  resolveRole,
} from './data'

export interface MockContext {
  path: string
  method: string
  params: Record<string, unknown>
  body: Record<string, unknown>
  /** 从 Authorization 头解析出的 token */
  token: string
  match: RegExpExecArray | null
}

export interface MockRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string | RegExp
  /** false 表示公开接口，不校验 token */
  auth?: boolean
  handler: (ctx: MockContext) => unknown | Promise<unknown>
}

/** 演示环境把角色编进 token，退出登录后刷新也能还原身份 */
function issueToken(role: RoleKey): string {
  return `mock.${role}.${Math.random().toString(36).slice(2, 12)}`
}

function roleFromToken(token: string): RoleKey {
  const role = token.split('.')[1] as RoleKey | undefined
  return role && ['super_admin', 'admin', 'operator'].includes(role) ? role : 'operator'
}

function paginate<T>(list: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  }
}

function num(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export const handlers: MockRoute[] = [
  /* ------------------------------------------------------------- auth --- */
  {
    method: 'POST',
    path: '/auth/login',
    auth: false,
    handler: (ctx) => {
      const params = ctx.body as unknown as LoginParams
      if (!params.username || !params.password) {
        throw new Error('用户名与密码不能为空')
      }
      if (params.password.length < 6) {
        return {
          code: 422,
          message: '密码长度至少 6 位',
          data: null,
          timestamp: Date.now(),
          traceId: 'mock-login',
        }
      }
      const role = resolveRole(params)
      return {
        token: issueToken(role),
        refreshToken: issueToken(role),
        expiresIn: 7200,
      }
    },
  },
  {
    method: 'GET',
    path: '/auth/profile',
    handler: (ctx) => buildProfile(ctx.token ? roleFromToken(ctx.token) : 'operator'),
  },
  { method: 'POST', path: '/auth/logout', handler: () => ({ success: true }) },

  /* -------------------------------------------------------- dashboard --- */
  { method: 'GET', path: '/dashboard/overview', handler: () => buildOverview() },
  {
    method: 'GET',
    path: '/dashboard/trend',
    handler: (ctx) => buildTrend((str(ctx.params.range) || '7d') as RangeKey),
  },
  {
    method: 'GET',
    path: '/dashboard/activities',
    handler: (ctx) => buildActivities(num(ctx.params.limit, 12)),
  },
  { method: 'GET', path: '/dashboard/system-status', handler: () => buildSystemStatus() },
  { method: 'GET', path: '/dashboard/traffic-sources', handler: () => buildTrafficSources() },
  { method: 'GET', path: '/dashboard/regions', handler: () => buildRegionRank() },

  /* ----------------------------------------------------------- system --- */
  {
    method: 'GET',
    path: '/system/accounts',
    handler: (ctx) => {
      const keyword = str(ctx.params.keyword).toLowerCase()
      const status = str(ctx.params.status) as AccountStatus | ''
      const role = str(ctx.params.role) as RoleKey | ''

      let list: AccountItem[] = buildAccounts()
      if (keyword) {
        list = list.filter(
          (item) =>
            item.nickname.toLowerCase().includes(keyword) ||
            item.username.toLowerCase().includes(keyword) ||
            item.email.toLowerCase().includes(keyword),
        )
      }
      if (status) list = list.filter((item) => item.status === status)
      if (role) list = list.filter((item) => item.role === role)

      return paginate(list, num(ctx.params.page, 1), num(ctx.params.pageSize, 10))
    },
  },
  {
    method: 'POST',
    path: '/system/accounts',
    handler: (ctx) => ({ id: `ACC-${Date.now()}`, ...ctx.body }),
  },
  {
    method: 'DELETE',
    path: /^\/system\/accounts\/[\w-]+$/,
    handler: (ctx) => ({ id: ctx.path.split('/').pop(), deleted: true }),
  },

  /* ----------------------------------------------------------- orders --- */
  {
    method: 'GET',
    path: '/orders',
    handler: (ctx) => {
      const status = str(ctx.params.status) as OrderStatus | ''
      const keyword = str(ctx.params.keyword).toLowerCase()
      let list: OrderItem[] = buildOrders()
      if (status) list = list.filter((item) => item.status === status)
      if (keyword) {
        list = list.filter(
          (item) =>
            item.orderNo.toLowerCase().includes(keyword) ||
            item.customer.toLowerCase().includes(keyword),
        )
      }
      return paginate(list, num(ctx.params.page, 1), num(ctx.params.pageSize, 10))
    },
  },

  /* ---------------------------------------------------- notifications --- */
  { method: 'GET', path: '/notifications', handler: () => buildNotifications() },
  { method: 'POST', path: '/notifications/read-all', handler: () => ({ success: true }) },
]
