import { Injectable } from '@nestjs/common'

import { PrismaService } from '../database/prisma.service'

export interface HealthStatus {
  status: 'ok' | 'degraded'
  database: 'up' | 'down'
  uptime: number
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return {
        status: 'ok',
        database: 'up',
        uptime: Math.round(process.uptime()),
      }
    } catch {
      return {
        status: 'degraded',
        database: 'down',
        uptime: Math.round(process.uptime()),
      }
    }
  }
}
