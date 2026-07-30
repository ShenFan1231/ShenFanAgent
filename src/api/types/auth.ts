import type { PermissionKey, RoleKey } from '@/types/permission'
import type { MenuItem } from '@/types/menu'

export interface LoginParams {
  username: string
  password: string
  /** 演示用：允许直接指定登录角色，真实项目由后端根据账号返回 */
  role?: RoleKey
  remember?: boolean
}

export interface LoginResult {
  token: string
  /** Mock 环境会返回；真实 API 使用 HttpOnly Cookie 承载刷新令牌。 */
  refreshToken?: string
  /** 过期时间（秒） */
  expiresIn: number
}

export interface UserProfile {
  id: string
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  department: string
  jobTitle: string
  status?: 'active' | 'disabled' | 'pending'
  isAdmin?: boolean
  roles: RoleKey[]
  permissions: PermissionKey[]
  /** 真实 API 下发；Mock 环境缺省时继续由静态路由生成。 */
  menus?: MenuItem[]
  lastLoginAt: string
  lastLoginIp: string
  /** 连续登录天数，欢迎区文案使用 */
  loginStreak: number
}
