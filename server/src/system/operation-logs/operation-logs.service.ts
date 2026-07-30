import { Injectable } from '@nestjs/common'

import { OperationLevel } from '../../../generated/prisma'
import type { OperationLogQueryDto } from './dto/operation-log-query.dto'
import { OperationLogsRepository } from './operation-logs.repository'

const levelMap = {
  info: OperationLevel.INFO,
  success: OperationLevel.SUCCESS,
  warning: OperationLevel.WARNING,
  danger: OperationLevel.DANGER,
} as const

@Injectable()
export class OperationLogsService {
  constructor(private readonly repository: OperationLogsRepository) {}

  async list(query: OperationLogQueryDto) {
    const result = await this.repository.list({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword,
      module: query.module,
      level: query.level ? levelMap[query.level] : undefined,
    })
    return {
      list: result.list.map((item) => ({
        id: item.id,
        level: item.level.toLowerCase(),
        module: item.module,
        action: item.action,
        resource: item.resource ?? '',
        resourceId: item.resourceId ?? '',
        summary: item.summary,
        method: item.method ?? '',
        path: item.path ?? '',
        ipAddress: item.ipAddress ?? '',
        statusCode: item.statusCode,
        durationMs: item.durationMs,
        success: item.success,
        operator: item.user
          ? {
              username: item.user.username,
              nickname: item.user.nickname,
              avatar: item.user.avatar ?? '',
            }
          : {
              username: 'system',
              nickname: '系统任务',
              avatar: '',
            },
        createdAt: item.createdAt.toISOString(),
      })),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }
}
