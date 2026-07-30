import type { RoleKey } from '@/types/permission'
import type { PageQuery } from './common'

export type AccountStatus = 'active' | 'disabled' | 'pending'

export interface AccountItem {
  id: string
  username: string
  nickname: string
  avatar: string
  email: string
  department: string
  role: RoleKey
  status: AccountStatus
  createdAt: string
  lastActiveAt: string
}

export interface AccountQuery extends PageQuery {
  status?: AccountStatus | ''
  role?: RoleKey | ''
}

export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'closed'

export interface OrderItem {
  id: string
  orderNo: string
  customer: string
  channel: string
  amount: number
  status: OrderStatus
  createdAt: string
  items: number
}

export interface OrderQuery extends PageQuery {
  status?: OrderStatus | ''
}

export interface NotificationItem {
  id: string
  title: string
  content: string
  type: 'system' | 'todo' | 'message'
  read: boolean
  createdAt: string
}

export interface SystemSettings {
  siteName: string
  apiBase: string
  timeout: string
  sessionTtl: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  mfa: boolean
  ipWhitelist: boolean
  auditLog: boolean
  autoBackup: boolean
}

export type OperationLevel = 'info' | 'success' | 'warning' | 'danger'

export interface OperationLogItem {
  id: string
  level: OperationLevel
  module: string
  action: string
  resource: string
  resourceId: string
  summary: string
  method: string
  path: string
  ipAddress: string
  statusCode: number | null
  durationMs: number | null
  success: boolean
  operator: {
    username: string
    nickname: string
    avatar: string
  }
  createdAt: string
}

export interface OperationLogQuery extends PageQuery {
  module?: string | ''
  level?: OperationLevel | ''
}
