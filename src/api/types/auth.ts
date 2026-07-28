import type { PermissionKey, RoleKey } from '@/types/permission'

export interface LoginParams {
  username: string
  password: string
  /** 演示用：允许直接指定登录角色，真实项目由后端根据账号返回 */
  role?: RoleKey
  remember?: boolean
}

export interface LoginResult {
  token: string
  refreshToken: string
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
  roles: RoleKey[]
  permissions: PermissionKey[]
  lastLoginAt: string
  lastLoginIp: string
  /** 连续登录天数，欢迎区文案使用 */
  loginStreak: number
}
