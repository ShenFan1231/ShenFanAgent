import { Injectable } from '@nestjs/common'

import { OperationLevel, Prisma } from '../../../generated/prisma'
import { PrismaService } from '../../database/prisma.service'

export interface OperationLogListInput {
  page: number
  pageSize: number
  keyword?: string
  module?: string
  level?: OperationLevel
}

export interface OperationLogCreateInput {
  userId?: string
  level: OperationLevel
  module: string
  action: string
  resource?: string
  resourceId?: string
  summary: string
  method?: string
  path?: string
  ipAddress?: string
  userAgent?: string
  statusCode?: number
  durationMs?: number
  success: boolean
  detail?: Prisma.InputJsonValue
}

@Injectable()
export class OperationLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: OperationLogListInput) {
    const keyword = input.keyword?.trim()
    const where: Prisma.OperationLogWhereInput = {
      module: input.module || undefined,
      level: input.level,
      OR: keyword
        ? [
            { summary: { contains: keyword, mode: 'insensitive' } },
            { action: { contains: keyword, mode: 'insensitive' } },
            { user: { nickname: { contains: keyword, mode: 'insensitive' } } },
          ]
        : undefined,
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.operationLog.findMany({
        where,
        include: {
          user: {
            select: {
              username: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.operationLog.count({ where }),
    ])
    return { list, total }
  }

  create(data: OperationLogCreateInput) {
    return this.prisma.operationLog.create({ data })
  }
}
