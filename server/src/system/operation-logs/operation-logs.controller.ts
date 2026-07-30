import { Controller, Get, Query } from '@nestjs/common'

import { RequirePermissions } from '../../identity/auth/decorators/require-permissions.decorator'
import { OperationLogQueryDto } from './dto/operation-log-query.dto'
import { OperationLogsService } from './operation-logs.service'

@Controller('system/operation-logs')
@RequirePermissions('log:view')
export class OperationLogsController {
  constructor(private readonly service: OperationLogsService) {}

  @Get()
  list(@Query() query: OperationLogQueryDto) {
    return this.service.list(query)
  }
}
