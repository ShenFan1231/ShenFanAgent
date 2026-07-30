import type { LoginParams, UserProfile } from '@/api/types/auth'
import type { RangeKey } from '@/api/types/common'
import type {
  ActivityItem,
  ActivityType,
  DashboardOverview,
  MetricCard,
  RegionRank,
  SystemStatusData,
  TrafficSource,
  TrendChartData,
} from '@/api/types/dashboard'
import type {
  AccountItem,
  AccountStatus,
  NotificationItem,
  OrderItem,
  OrderStatus,
} from '@/api/types/system'
import { PERMISSIONS, type PermissionKey, type RoleKey } from '@/types/permission'
import { gradientAvatar } from '@/utils/avatar'
import { createPrng, pick, randomInt, series } from './prng'

const DAY = 86_400_000

/* ----------------------------------------------------------------- 账号 --- */
const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  super_admin: [...PERMISSIONS],
  admin: [
    'user:view',
    'user:create',
    'user:update',
    'user:export',
    'order:view',
    'order:create',
    'order:export',
    'notice:publish',
    'report:view',
    'log:view',
    'project:view',
    'project:create',
    'project:update',
    'agent:view',
    'agent:run',
  ],
  operator: ['user:view', 'order:view', 'report:view', 'project:view', 'agent:view', 'agent:run'],
}

const ACCOUNT_PRESET: Record<RoleKey, { username: string; nickname: string; jobTitle: string }> = {
  super_admin: { username: 'admin', nickname: '云舒', jobTitle: '平台架构负责人' },
  admin: { username: 'manager', nickname: '林深', jobTitle: '业务运营经理' },
  operator: { username: 'operator', nickname: '南星', jobTitle: '数据运营专员' },
}

export function buildProfile(role: RoleKey): UserProfile {
  const preset = ACCOUNT_PRESET[role]
  return {
    id: `U-${role.toUpperCase()}-001`,
    username: preset.username,
    nickname: preset.nickname,
    avatar: gradientAvatar(preset.username, preset.nickname),
    email: `${preset.username}@nebula.io`,
    phone: '138****6027',
    department: '数据智能中心',
    jobTitle: preset.jobTitle,
    roles: [role],
    permissions: ROLE_PERMISSIONS[role],
    lastLoginAt: new Date(Date.now() - 3600_000 * 9).toISOString(),
    lastLoginIp: '10.24.88.31',
    loginStreak: 27,
  }
}

/** 演示账号：任意密码都能登录，用户名决定角色 */
export function resolveRole(params: LoginParams): RoleKey {
  if (params.role) return params.role
  const byName: Record<string, RoleKey> = {
    admin: 'super_admin',
    manager: 'admin',
    operator: 'operator',
  }
  return byName[params.username] ?? 'operator'
}

/* ------------------------------------------------------------- 核心指标 --- */
export function buildOverview(): DashboardOverview {
  const rand = createPrng(20260727)
  const spark = (base: number, growth: number) => series(rand, 14, base, { growth, volatility: 0.14 })

  const metrics: MetricCard[] = [
    {
      key: 'users',
      label: '注册用户',
      value: 182_463 + randomInt(rand, 0, 320),
      prevValue: 178_902,
      delta: 8.4,
      direction: 'up',
      unit: 'number',
      sparkline: spark(1200, 0.03),
      target: 0.82,
    },
    {
      key: 'visits',
      label: '今日访问',
      value: 46_128 + randomInt(rand, 0, 900),
      prevValue: 49_210,
      delta: -5.2,
      direction: 'down',
      unit: 'number',
      sparkline: spark(3600, -0.008),
      target: 0.64,
    },
    {
      key: 'revenue',
      label: '今日收入',
      value: 938_642.55,
      prevValue: 811_204.1,
      delta: 15.7,
      direction: 'up',
      unit: 'currency',
      sparkline: spark(52_000, 0.024),
      target: 0.93,
    },
    {
      key: 'orders',
      label: '订单总量',
      value: 12_806,
      prevValue: 12_611,
      delta: 1.5,
      direction: 'up',
      unit: 'number',
      sparkline: spark(720, 0.006),
      target: 0.47,
    },
  ]

  return { metrics, updatedAt: new Date().toISOString() }
}

/* --------------------------------------------------------------- 趋势图 --- */
const RANGE_LENGTH: Record<RangeKey, number> = { '7d': 7, '30d': 30, '90d': 90 }

export function buildTrend(range: RangeKey): TrendChartData {
  const length = RANGE_LENGTH[range] ?? 7
  const rand = createPrng(9_301 + length)
  const now = Date.now()

  const categories = Array.from({ length }, (_, i) => {
    const d = new Date(now - (length - 1 - i) * DAY)
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  return {
    range,
    categories,
    series: [
      { name: '访问量', key: 'visits', data: series(rand, length, 38_000, { growth: 0.004 }) },
      { name: '独立访客', key: 'uv', data: series(rand, length, 21_500, { growth: 0.003 }) },
      { name: '收入', key: 'revenue', data: series(rand, length, 620_000, { growth: 0.006 }) },
      { name: '新增用户', key: 'newUsers', data: series(rand, length, 1_180, { growth: 0.01 }) },
      { name: '活跃用户', key: 'activeUsers', data: series(rand, length, 8_600, { growth: 0.005 }) },
    ],
  }
}

/* --------------------------------------------------------------- 活动流 --- */
const ACTIVITY_TEMPLATES: Array<{
  type: ActivityType
  level: ActivityItem['level']
  title: string
  description: string
}> = [
  { type: 'order', level: 'success', title: '大额订单已支付', description: '订单 #NB-{n} 完成支付，金额 ¥{a}' },
  { type: 'user', level: 'info', title: '新用户注册', description: '来自 {r} 的用户完成实名认证' },
  { type: 'system', level: 'warning', title: '任务队列积压', description: '数据同步队列堆积 {n} 条，已自动扩容' },
  { type: 'security', level: 'danger', title: '异地登录拦截', description: '检测到 IP 10.9.{n}.12 的异常登录并已拦截' },
  { type: 'deploy', level: 'success', title: '服务发布完成', description: 'gateway-service v2.{n}.0 灰度发布 100%' },
  { type: 'order', level: 'warning', title: '订单发起退款', description: '订单 #NB-{n} 申请退款，等待审核' },
  { type: 'system', level: 'info', title: '定时报表生成', description: '「{r}区域经营日报」已生成并推送' },
  { type: 'user', level: 'success', title: '权限变更', description: '{r} 的账号被授予「订单导出」权限' },
]

const OPERATORS = ['云舒', '林深', '南星', '沈川', '陆微', '系统机器人']
const REGIONS = ['华东', '华南', '华北', '西南', '海外']

export function buildActivities(limit = 12): ActivityItem[] {
  const rand = createPrng(4_517)
  const now = Date.now()

  return Array.from({ length: limit }, (_, i) => {
    const tpl = pick(rand, ACTIVITY_TEMPLATES)
    const operator = pick(rand, OPERATORS)
    const description = tpl.description
      .replace('{n}', String(randomInt(rand, 100, 9999)))
      .replace('{a}', String(randomInt(rand, 3, 88) * 1000))
      .replace('{r}', pick(rand, REGIONS))

    return {
      id: `ACT-${now}-${i}`,
      type: tpl.type,
      level: tpl.level,
      title: tpl.title,
      description,
      operator: { name: operator, avatar: gradientAvatar(operator) },
      createdAt: new Date(now - i * randomInt(rand, 3, 26) * 60_000).toISOString(),
    }
  })
}

/* ------------------------------------------------------------- 系统状态 --- */
export function buildSystemStatus(): SystemStatusData {
  const rand = createPrng(Date.now() % 100_000)
  const history = (base: number) =>
    Array.from({ length: 30 }, () => Math.round(base + (rand() - 0.5) * 22))

  return {
    resources: [
      { key: 'cpu', label: 'CPU 负载', usage: 42 + Math.round(rand() * 22), detail: '16 vCPU · 4 节点', history: history(48) },
      { key: 'memory', label: '内存占用', usage: 58 + Math.round(rand() * 14), detail: '38.6 / 64 GB', history: history(62) },
      { key: 'disk', label: '磁盘 IO', usage: 24 + Math.round(rand() * 18), detail: '读 128 MB/s · 写 76 MB/s', history: history(30) },
      { key: 'network', label: '网络吞吐', usage: 66 + Math.round(rand() * 20), detail: '↑ 412 Mbps · ↓ 938 Mbps', history: history(70) },
    ],
    services: [
      { id: 'gateway', name: 'API 网关', status: 'healthy', latency: 38 + Math.round(rand() * 20), uptime: 99.99, region: '华东-1' },
      { id: 'auth', name: '认证服务', status: 'healthy', latency: 24 + Math.round(rand() * 12), uptime: 99.98, region: '华东-1' },
      { id: 'compute', name: '实时计算', status: 'degraded', latency: 186 + Math.round(rand() * 60), uptime: 99.42, region: '华北-2' },
      { id: 'storage', name: '对象存储', status: 'healthy', latency: 52 + Math.round(rand() * 18), uptime: 99.97, region: '华南-1' },
      { id: 'search', name: '检索集群', status: 'healthy', latency: 44 + Math.round(rand() * 16), uptime: 99.95, region: '华东-2' },
    ],
    uptimeSeconds: 86_400 * 63 + 12_480,
    onlineUsers: 3_820 + Math.round(rand() * 260),
    qps: 1_260 + Math.round(rand() * 420),
  }
}

/* --------------------------------------------------------------- 分布图 --- */
export function buildTrafficSources(): TrafficSource[] {
  return [
    { name: '自然搜索', value: 4820 },
    { name: '广告投放', value: 3160 },
    { name: '社交媒体', value: 2410 },
    { name: '合作渠道', value: 1580 },
    { name: '直接访问', value: 1120 },
  ]
}

export function buildRegionRank(): RegionRank[] {
  const raw = [
    { region: '华东', value: 48_620 },
    { region: '华南', value: 36_140 },
    { region: '华北', value: 29_880 },
    { region: '西南', value: 18_260 },
    { region: '海外', value: 11_430 },
  ]
  const max = Math.max(...raw.map((r) => r.value))
  return raw.map((r) => ({ ...r, ratio: r.value / max }))
}

/* --------------------------------------------------------------- 列表页 --- */
const DEPARTMENTS = ['数据智能中心', '增长运营部', '交易平台部', '风控合规部', '客户成功部']
const STATUSES: AccountStatus[] = ['active', 'active', 'active', 'pending', 'disabled']
const NAMES = [
  '陈砚白', '苏酌', '顾南川', '林清野', '沈奚', '江照', '温衡', '许知微',
  '傅思远', '裴皎', '穆青', '容与', '柳鹤', '闻星', '洛珩', '姜辞',
]

let accountCache: AccountItem[] | null = null

export function buildAccounts(): AccountItem[] {
  if (accountCache) return accountCache
  const rand = createPrng(77_321)
  const roles: RoleKey[] = ['super_admin', 'admin', 'operator', 'operator', 'admin']

  accountCache = Array.from({ length: 86 }, (_, i) => {
    const nickname = `${NAMES[i % NAMES.length]}${i > 15 ? String(Math.floor(i / 16) + 1) : ''}`
    const username = `user_${String(1000 + i)}`
    return {
      id: `ACC-${1000 + i}`,
      username,
      nickname,
      avatar: gradientAvatar(username, nickname),
      email: `${username}@nebula.io`,
      department: pick(rand, DEPARTMENTS),
      role: pick(rand, roles),
      status: pick(rand, STATUSES),
      createdAt: new Date(Date.now() - randomInt(rand, 1, 720) * DAY).toISOString(),
      lastActiveAt: new Date(Date.now() - randomInt(rand, 1, 4200) * 60_000).toISOString(),
    }
  })
  return accountCache
}

const CHANNELS = ['小程序', 'App', 'Web', '开放平台', '线下门店']
const ORDER_STATUS: OrderStatus[] = ['paid', 'paid', 'pending', 'refunded', 'closed']

let orderCache: OrderItem[] | null = null

export function buildOrders(): OrderItem[] {
  if (orderCache) return orderCache
  const rand = createPrng(31_907)

  orderCache = Array.from({ length: 124 }, (_, i) => ({
    id: `ORD-${2000 + i}`,
    orderNo: `NB-20260727-${String(1000 + i)}`,
    customer: pick(rand, NAMES),
    channel: pick(rand, CHANNELS),
    amount: randomInt(rand, 120, 98_000) + rand(),
    status: pick(rand, ORDER_STATUS),
    createdAt: new Date(Date.now() - randomInt(rand, 1, 2600) * 60_000).toISOString(),
    items: randomInt(rand, 1, 12),
  }))
  return orderCache
}

/* ----------------------------------------------------------------- 通知 --- */
export function buildNotifications(): NotificationItem[] {
  const now = Date.now()
  return [
    {
      id: 'N-1',
      type: 'system',
      title: '实时计算集群延迟升高',
      content: '华北-2 区域实时计算任务平均延迟 186ms，已触发自动扩容策略。',
      read: false,
      createdAt: new Date(now - 6 * 60_000).toISOString(),
    },
    {
      id: 'N-2',
      type: 'todo',
      title: '3 笔退款订单待审核',
      content: '订单 NB2026072710xx 等 3 笔退款申请等待你的处理。',
      read: false,
      createdAt: new Date(now - 42 * 60_000).toISOString(),
    },
    {
      id: 'N-3',
      type: 'message',
      title: '林深 提到了你',
      content: '「本周的转化漏斗报表需要你补充一下渠道口径」',
      read: false,
      createdAt: new Date(now - 3 * 3600_000).toISOString(),
    },
    {
      id: 'N-4',
      type: 'system',
      title: '版本发布完成',
      content: 'NEBULA 控制台 v2.4.0 已完成灰度发布，新增智能预警面板。',
      read: true,
      createdAt: new Date(now - 26 * 3600_000).toISOString(),
    },
    {
      id: 'N-5',
      type: 'todo',
      title: '季度权限复核',
      content: '共 12 个高权限账号需要在本周五前完成复核。',
      read: true,
      createdAt: new Date(now - 3 * 24 * 3600_000).toISOString(),
    },
  ]
}
