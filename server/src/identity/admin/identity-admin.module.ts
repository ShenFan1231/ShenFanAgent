import { Module } from '@nestjs/common'

import { AccessController } from './access.controller'
import { AccountsController } from './accounts.controller'
import { IdentityAdminRepository } from './identity-admin.repository'
import { IdentityAdminService } from './identity-admin.service'

@Module({
  controllers: [AccountsController, AccessController],
  providers: [IdentityAdminRepository, IdentityAdminService],
})
export class IdentityAdminModule {}
