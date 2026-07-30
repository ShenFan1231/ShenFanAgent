import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { CookieOptions, Request, Response } from 'express'

import type { AppEnvironment } from '../../config/environment'
import { REFRESH_COOKIE_NAME } from './auth.constants'
import { AuthService, type IssuedSession } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import { Public } from './decorators/public.decorator'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import type {
  AuthenticatedUser,
  RequestMetadata,
} from './types/authenticated-user'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppEnvironment, true>,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto, this.metadata(request))
    this.setRefreshCookie(response, session)
    return session.response
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieToken = request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined
    const session = await this.authService.refresh(
      cookieToken ?? dto.refreshToken,
      this.metadata(request),
    )
    this.setRefreshCookie(response, session)
    return session.response
  }

  @Get('profile')
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.profile(user.userId)
  }

  @Get('menus')
  menus(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.menus(user.userId)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.logout(user)
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions(false))
    return result
  }

  private setRefreshCookie(response: Response, session: IssuedSession): void {
    const options = this.cookieOptions(session.persistent)
    if (session.persistent) {
      options.expires = session.refreshExpiresAt
    }
    response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, options)
  }

  private cookieOptions(_persistent: boolean): CookieOptions {
    const prefix = this.config.get('API_PREFIX', { infer: true })
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      sameSite: this.config.get('COOKIE_SAME_SITE', { infer: true }),
      path: `/${prefix}/auth`,
    }
  }

  private metadata(request: Request): RequestMetadata {
    return {
      ipAddress: request.ip || request.socket.remoteAddress || undefined,
      userAgent: request.get('user-agent')?.slice(0, 500),
    }
  }
}
