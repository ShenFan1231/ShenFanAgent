/** 系统内置角色。真实项目里由后端下发，这里保持同一套字面量类型。 */
export const ROLES = ['super_admin', 'admin', 'operator'] as const

export type RoleKey = (typeof ROLES)[number]

export interface RoleMeta {
  key: RoleKey
  name: string
  description: string
  color: string
}

export const ROLE_META: Record<RoleKey, RoleMeta> = {
  super_admin: {
    key: 'super_admin',
    name: '超级管理员',
    description: '拥有全部菜单与按钮权限，可管理角色与系统配置',
    color: 'violet',
  },
  admin: {
    key: 'admin',
    name: '管理员',
    description: '可管理用户、订单与内容，不能修改系统级配置',
    color: 'brand',
  },
  operator: {
    key: 'operator',
    name: '运营',
    description: '只读为主，可查看报表与订单，不能新增或删除数据',
    color: 'warning',
  },
}

/**
 * 按钮级权限标识，格式为 `<模块>:<动作>`。
 * 集中声明的目的是让 v-permission 的入参可被类型约束、可被 IDE 补全。
 */
export const PERMISSIONS = [
  'user:view',
  'user:create',
  'user:update',
  'user:delete',
  'user:export',
  'order:view',
  'order:create',
  'order:refund',
  'order:export',
  'notice:publish',
  'report:view',
  'system:config',
  'role:assign',
  'log:view',
  'project:view',
  'project:create',
  'project:update',
  'project:delete',
  'agent:view',
  'agent:run',
] as const

export type PermissionKey = (typeof PERMISSIONS)[number]

/** 权限校验入参：单个、数组（任一命中）。 */
export type PermissionInput = PermissionKey | PermissionKey[] | string | string[]
