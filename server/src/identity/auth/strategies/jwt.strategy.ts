import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import type { AppEnvironment } from '../../../config/environment'
import { AuthService } from '../auth.service'
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from '../types/authenticated-user'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<AppEnvironment, true>,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    })
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    if (
      payload.type !== 'access' ||
      !payload.sub ||
      !payload.sid ||
      !(await this.authService.validateAccessSession(payload.sub, payload.sid))
    ) {
      throw new UnauthorizedException('登录状态已失效')
    }

    return {
      userId: payload.sub,
      sessionId: payload.sid,
    }
  }
}
