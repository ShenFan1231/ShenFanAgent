import type { LoginParams, LoginResult, UserProfile } from '@/api/types/auth'
import { api } from '@/utils/request'

export const authApi = {
  login(params: LoginParams) {
    return api.post<LoginResult>('/auth/login', params, { withoutToken: true, silentError: true })
  },

  profile() {
    return api.get<UserProfile>('/auth/profile', undefined, { retry: 1 })
  },

  logout() {
    return api.post<{ success: boolean }>('/auth/logout', undefined, { silentError: true })
  },
}
