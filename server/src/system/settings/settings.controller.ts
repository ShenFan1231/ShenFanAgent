import { Body, Controller, Get, Put } from '@nestjs/common'

import { CurrentUser } from '../../identity/auth/decorators/current-user.decorator'
import { RequirePermissions } from '../../identity/auth/decorators/require-permissions.decorator'
import type { AuthenticatedUser } from '../../identity/auth/types/authenticated-user'
import { UpdateSettingsDto } from './dto/update-settings.dto'
import { SettingsService } from './settings.service'

@Controller('system/settings')
@RequirePermissions('system:config')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  get() {
    return this.service.get()
  }

  @Put()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.service.update(user.userId, dto)
  }
}
