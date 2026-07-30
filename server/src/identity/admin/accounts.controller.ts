import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { AccountQueryDto } from './dto/account-query.dto'
import { CreateAccountDto } from './dto/create-account.dto'
import { UpdateAccountDto } from './dto/update-account.dto'
import { IdentityAdminService } from './identity-admin.service'

@Controller('system/accounts')
export class AccountsController {
  constructor(private readonly service: IdentityAdminService) {}

  @Get()
  @RequirePermissions('user:view')
  accounts(@Query() query: AccountQueryDto) {
    return this.service.accounts(query)
  }

  @Post()
  @RequirePermissions('user:create')
  create(@Body() dto: CreateAccountDto) {
    return this.service.createAccount(dto)
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.service.updateAccount(id, dto)
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.removeAccount(user.userId, id)
  }
}
