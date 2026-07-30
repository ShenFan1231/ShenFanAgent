import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  dailyMetrics(days: number) {
    return this.prisma.dailyMetric
      .findMany({
        orderBy: { date: 'desc' },
        take: days,
      })
      .then((items) => items.reverse())
  }

  async totals() {
    const [users, orders] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.order.count(),
    ])
    return { users, orders }
  }

  operationLogs(limit: number) {
    return this.prisma.operationLog.findMany({
      include: {
        user: {
          select: {
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  trafficSources() {
    return this.prisma.trafficSourceMetric.findMany({
      orderBy: { sort: 'asc' },
    })
  }

  regions() {
    return this.prisma.regionMetric.findMany({
      orderBy: { sort: 'asc' },
    })
  }

  activeSessions() {
    return this.prisma.refreshSession.count({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
  }
}
