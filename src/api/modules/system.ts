import type { PageResult } from '@/api/types/common'
import type {
  AccountItem,
  AccountQuery,
  NotificationItem,
  OrderItem,
  OrderQuery,
} from '@/api/types/system'
import { api } from '@/utils/request'

export const systemApi = {
  accounts(query: AccountQuery) {
    return api.get<PageResult<AccountItem>>('/system/accounts', { ...query }, {
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
    return api.get<PageResult<OrderItem>>('/orders', { ...query }, { cancelKey: 'system:orders' })
  },

  notifications() {
    return api.get<NotificationItem[]>('/notifications', undefined, { silentError: true })
  },

  readAllNotifications() {
    return api.post<{ success: boolean }>('/notifications/read-all', undefined, {
      silentError: true,
    })
  },
}
