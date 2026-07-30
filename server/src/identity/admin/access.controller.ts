import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common'

import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import { UpdateRoleAccessDto } from './dto/update-role-access.dto'
import { IdentityAdminService } from './identity-admin.service'

@Controller('system')
@RequirePermissions('role:assign')
export class AccessController {
  constructor(private readonly service: IdentityAdminService) {}

  @Get('roles')
  roles() {
    return this.service.roles()
  }

  @Get('permissions')
  permissions() {
    return this.service.permissions()
  }

  @Get('menus')
  menus() {
    return this.service.menus()
  }

  @Put('roles/:id/access')
  updateRoleAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleAccessDto,
  ) {
    return this.service.updateRoleAccess(id, dto)
  }
}
