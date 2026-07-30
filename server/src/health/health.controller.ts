import { Controller, Get } from '@nestjs/common'

import { Public } from '../identity/auth/decorators/public.decorator'
import { HealthService, type HealthStatus } from './health.service'

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  check(): Promise<HealthStatus> {
    return this.healthService.check()
  }
}
