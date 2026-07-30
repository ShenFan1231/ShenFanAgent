import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { REQUIRED_PERMISSIONS_KEY } from '../auth.constants'
import { AuthService } from '../auth.service'
import type { AuthenticatedRequest } from '../types/authenticated-user'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!required?.length) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const access = await this.authService.accessContext(request.user.userId)
    if (access.roles.includes('super_admin')) return true

    const granted = new Set(access.permissions)
    if (required.every((permission) => granted.has(permission))) return true

    throw new ForbiddenException('没有执行该操作的权限')
  }
}
