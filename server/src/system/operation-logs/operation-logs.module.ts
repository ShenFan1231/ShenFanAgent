import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'

import { OperationAuditInterceptor } from './operation-audit.interceptor'
import { OperationLogsController } from './operation-logs.controller'
import { OperationLogsRepository } from './operation-logs.repository'
import { OperationLogsService } from './operation-logs.service'

@Module({
  controllers: [OperationLogsController],
  providers: [
    OperationLogsRepository,
    OperationLogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationAuditInterceptor,
    },
  ],
})
export class OperationLogsModule {}
