import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common'

import { RequirePermissions } from '../../identity/auth/decorators/require-permissions.decorator'
import { DashboardService } from './dashboard.service'
import { TrendQueryDto } from './dto/trend-query.dto'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  overview() {
    return this.service.overview()
  }

  @Get('trend')
  @RequirePermissions('report:view')
  trend(@Query() query: TrendQueryDto) {
    return this.service.trend(query.range)
  }

  @Get('activities')
  activities(@Query('limit', new ParseIntPipe({ optional: true })) limit = 12) {
    return this.service.activities(Math.min(Math.max(limit, 1), 50))
  }

  @Get('system-status')
  systemStatus() {
    return this.service.systemStatus()
  }

  @Get('traffic-sources')
  @RequirePermissions('report:view')
  trafficSources() {
    return this.service.trafficSources()
  }

  @Get('regions')
  @RequirePermissions('report:view')
  regions() {
    return this.service.regions()
  }
}
