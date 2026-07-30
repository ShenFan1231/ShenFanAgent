import { Controller, Get, Post } from '@nestjs/common'

import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../identity/auth/types/authenticated-user'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.list(user.userId)
  }

  @Post('read-all')
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.readAll(user.userId)
  }
}
