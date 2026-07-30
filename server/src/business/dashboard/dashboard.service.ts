import { cpus, freemem, loadavg, totalmem, uptime } from 'node:os'

import { Injectable } from '@nestjs/common'

import type { DailyMetric, OperationLevel } from '../../../generated/prisma'
import { DashboardRepository } from './dashboard.repository'

const rangeDays = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
} as const

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async overview() {
    const [metrics, totals] = await Promise.all([
      this.repository.dailyMetrics(14),
      this.repository.totals(),
    ])
    const current = metrics.at(-1)
    const previous = metrics.at(-2) ?? current
    if (!current) {
      return { metrics: [], updatedAt: new Date().toISOString() }
    }

    return {
      metrics: [
        this.metric('users', '注册用户', totals.users, Math.max(0, totals.users - 1), 'number', metrics.map((item) => item.activeUsers), 0.82),
        this.metric('visits', '今日访问', current.visits, previous?.visits ?? current.visits, 'number', metrics.map((item) => item.visits), 0.64),
        this.metric('revenue', '今日收入', Number(current.revenue), Number(previous?.revenue ?? current.revenue), 'currency', metrics.map((item) => Number(item.revenue)), 0.93),
        this.metric('orders', '订单总量', totals.orders, Math.max(0, totals.orders - 1), 'number', metrics.map((item) => item.orders), 0.47),
      ],
      updatedAt: current.updatedAt.toISOString(),
    }
  }

  async trend(range: keyof typeof rangeDays) {
    const metrics = await this.repository.dailyMetrics(rangeDays[range])
    return {
      range,
      categories: metrics.map((item) =>
        `${String(item.date.getUTCMonth() + 1).padStart(2, '0')}-${String(item.date.getUTCDate()).padStart(2, '0')}`,
      ),
      series: [
        this.series('访问量', 'visits', metrics, (item) => item.visits),
        this.series('独立访客', 'uv', metrics, (item) => item.uniqueUsers),
        this.series('收入', 'revenue', metrics, (item) => Number(item.revenue)),
        this.series('新增用户', 'newUsers', metrics, (item) => item.newUsers),
        this.series('活跃用户', 'activeUsers', metrics, (item) => item.activeUsers),
      ],
    }
  }

  async activities(limit: number) {
    const logs = await this.repository.operationLogs(limit)
    return logs.map((log) => ({
      id: log.id,
      type: this.activityType(log.module),
      title: log.summary,
      description: log.resource
        ? `${log.action} · ${log.resource}${log.resourceId ? ` #${log.resourceId}` : ''}`
        : log.action,
      operator: {
        name: log.user?.nickname ?? '系统任务',
        avatar: log.user?.avatar ?? '',
      },
      createdAt: log.createdAt.toISOString(),
      level: this.level(log.level),
    }))
  }

  async systemStatus() {
    const totalMemory = totalmem()
    const usedMemory = totalMemory - freemem()
    const cpuUsage = Math.min(100, Math.round((loadavg()[0] / Math.max(cpus().length, 1)) * 100))
    const memoryUsage = Math.round((usedMemory / totalMemory) * 100)
    const onlineUsers = await this.repository.activeSessions()

    return {
      resources: [
        this.resource('cpu', 'CPU 负载', cpuUsage, `${cpus().length} vCPU`, 7),
        this.resource('memory', '内存占用', memoryUsage, `${this.gb(usedMemory)} / ${this.gb(totalMemory)} GB`, 11),
        this.resource('disk', '磁盘 IO', 31, '读 128 MB/s · 写 76 MB/s', 5),
        this.resource('network', '网络吞吐', 54, '入站 412 Mbps · 出站 938 Mbps', 9),
      ],
      services: [
        { id: 'api', name: 'NestJS API', status: 'healthy', latency: 18, uptime: 99.99, region: '本地 Docker' },
        { id: 'database', name: 'PostgreSQL', status: 'healthy', latency: 6, uptime: 99.99, region: '本地 Docker' },
        { id: 'auth', name: '身份认证', status: 'healthy', latency: 12, uptime: 99.98, region: 'API 进程' },
      ],
      uptimeSeconds: Math.round(uptime()),
      onlineUsers,
      qps: 0,
    }
  }

  async trafficSources() {
    return (await this.repository.trafficSources()).map(({ name, value }) => ({ name, value }))
  }

  async regions() {
    const rows = await this.repository.regions()
    const max = Math.max(...rows.map((item) => item.value), 1)
    return rows.map(({ region, value }) => ({ region, value, ratio: value / max }))
  }

  private metric(
    key: string,
    label: string,
    value: number,
    prevValue: number,
    unit: 'number' | 'currency',
    sparkline: number[],
    target: number,
  ) {
    const delta = prevValue === 0 ? 0 : Number((((value - prevValue) / prevValue) * 100).toFixed(1))
    return {
      key,
      label,
      value,
      prevValue,
      delta,
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
      unit,
      sparkline,
      target,
    }
  }

  private series(
    name: string,
    key: string,
    metrics: DailyMetric[],
    select: (item: DailyMetric) => number,
  ) {
    return { name, key, data: metrics.map(select) }
  }

  private activityType(module: string): 'order' | 'user' | 'system' | 'security' | 'deploy' {
    if (module === 'order') return 'order'
    if (module === 'user' || module === 'project') return 'user'
    if (module === 'auth') return 'security'
    if (module === 'deploy') return 'deploy'
    return 'system'
  }

  private level(level: OperationLevel): 'info' | 'success' | 'warning' | 'danger' {
    return level.toLowerCase() as 'info' | 'success' | 'warning' | 'danger'
  }

  private resource(
    key: 'cpu' | 'memory' | 'disk' | 'network',
    label: string,
    usage: number,
    detail: string,
    variance: number,
  ) {
    return {
      key,
      label,
      usage,
      detail,
      history: Array.from({ length: 30 }, (_, index) =>
        Math.max(0, Math.min(100, usage + ((index * variance) % 17) - 8)),
      ),
    }
  }

  private gb(bytes: number): string {
    return (bytes / 1024 / 1024 / 1024).toFixed(1)
  }
}
