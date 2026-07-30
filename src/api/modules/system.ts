import type { PageResult } from '@/api/types/common'
import type {
  AccountItem,
  AccountQuery,
  NotificationItem,
  OperationLogItem,
  OperationLogQuery,
  OrderItem,
  OrderQuery,
  SystemSettings,
} from '@/api/types/system'
import { api } from '@/utils/request'

function compactQuery(query: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== '' && value !== undefined),
  )
}

export const systemApi = {
  accounts(query: AccountQuery) {
    return api.get<PageResult<AccountItem>>('/system/accounts', compactQuery(query), {
      cancelKey: 'system:accounts',
    })
  },

  createAccount(payload: Partial<AccountItem>) {
    return api.post<AccountItem>('/system/accounts', payload)
  },

  removeAccount(id: string) {
    return api.delete<{ deleted: boolean }>(`/system/accounts/${id}`)
  },

  orders(query: OrderQuery) {
    return api.get<PageResult<OrderItem>>('/orders', compactQuery(query), {
      cancelKey: 'system:orders',
    })
  },

  order(id: string) {
    return api.get<OrderItem>(`/orders/${id}`)
  },

  notifications() {
    return api.get<NotificationItem[]>('/notifications', undefined, { silentError: true })
  },

  readAllNotifications() {
    return api.post<{ success: boolean }>('/notifications/read-all', undefined, {
      silentError: true,
    })
  },

  settings() {
    return api.get<SystemSettings>('/system/settings')
  },

  updateSettings(payload: SystemSettings) {
    return api.put<SystemSettings>('/system/settings', payload)
  },

  operationLogs(query: OperationLogQuery) {
    return api.get<PageResult<OperationLogItem>>(
      '/system/operation-logs',
      compactQuery(query),
      { cancelKey: 'system:operation-logs' },
    )
  },
}
