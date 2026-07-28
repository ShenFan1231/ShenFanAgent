import type { RangeKey } from './common'

export type MetricKey = 'users' | 'visits' | 'revenue' | 'orders'

export type TrendDirection = 'up' | 'down' | 'flat'

/** 核心指标卡片。value/prev 都由后端给原始数值，格式化交给前端。 */
export interface MetricCard {
  key: MetricKey
  label: string
  /** 当前值 */
  value: number
  /** 昨日同期值，用于计算环比 */
  prevValue: number
  /** 环比百分比，后端直接算好避免前端精度问题 */
  delta: number
  direction: TrendDirection
  /** 数值单位：普通数字 / 金额 / 百分比 */
  unit: 'number' | 'currency' | 'percent'
  /** 迷你走势图数据（最近 14 个采样点） */
  sparkline: number[]
  /** 目标完成度 0~1，卡片底部进度条使用 */
  target: number
}

export interface TrendSeries {
  name: string
  key: string
  data: number[]
}

/** 访问 / 收入 / 用户增长共用的时间序列结构 */
export interface TrendChartData {
  range: RangeKey
  categories: string[]
  series: TrendSeries[]
}

export type ActivityType = 'order' | 'user' | 'system' | 'security' | 'deploy'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  operator: {
    name: string
    avatar: string
  }
  createdAt: string
  level: 'info' | 'success' | 'warning' | 'danger'
}

export interface ResourceUsage {
  key: 'cpu' | 'memory' | 'disk' | 'network'
  label: string
  /** 使用率 0~100 */
  usage: number
  /** 展示用的详细文本，例如 "12.4 / 32 GB" */
  detail: string
  /** 最近 30 个采样点，用于迷你折线 */
  history: number[]
}

export interface ServiceStatus {
  id: string
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  uptime: number
  region: string
}

export interface SystemStatusData {
  resources: ResourceUsage[]
  services: ServiceStatus[]
  /** 服务器已运行秒数 */
  uptimeSeconds: number
  /** 当前在线人数 */
  onlineUsers: number
  /** 每秒请求数 */
  qps: number
}

export interface DashboardOverview {
  metrics: MetricCard[]
  updatedAt: string
}

/** 地域分布，用于雷达 / 排行榜 */
export interface RegionRank {
  region: string
  value: number
  ratio: number
}

export interface TrafficSource {
  name: string
  value: number
}
