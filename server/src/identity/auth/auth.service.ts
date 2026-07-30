import { createHash, randomBytes } from 'node:crypto'

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'

import { UserStatus } from '../../../generated/prisma'
import type { AppEnvironment } from '../../config/environment'
import { AuthRepository, type RefreshSessionInput } from './auth.repository'
import type { LoginDto } from './dto/login.dto'
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  RequestMetadata,
} from './types/authenticated-user'

type Identity = NonNullable<Awaited<ReturnType<AuthRepository['findIdentityById']>>>

export interface MenuNode {
  key: string
  path: string
  title: string
  icon?: string
  badge?: string
  link?: string
  order: number
  children?: MenuNode[]
}

export interface AuthResponse {
  token: string
  expiresIn: number
}

export interface IssuedSession {
  response: AuthResponse
  refreshToken: string
  refreshExpiresAt: Date
  persistent: boolean
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppEnvironment, true>,
  ) {}

  async login(dto: LoginDto, metadata: RequestMetadata): Promise<IssuedSession> {
    const identity = await this.repository.findForLogin(dto.username)
    const passwordMatches =
      identity && identity.status === UserStatus.ACTIVE
        ? await compare(dto.password, identity.passwordHash)
        : false

    if (!identity || !passwordMatches || identity.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    const persistent = dto.remember === true
    const refreshToken = this.createRefreshToken()
    const refreshExpiresAt = this.refreshExpiry()
    const session = await this.repository.createRefreshSession({
      userId: identity.id,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: refreshExpiresAt,
      persistent,
      ...metadata,
    })

    await this.repository.recordSuccessfulLogin(identity.id, {
      ipAddress: metadata.ipAddress,
      loginStreak: this.nextLoginStreak(identity.lastLoginAt, identity.loginStreak),
    })

    return {
      response: await this.issueAccessToken(identity.id, session.id),
      refreshToken,
      refreshExpiresAt,
      persistent,
    }
  }

  async refresh(rawToken: string | undefined, metadata: RequestMetadata): Promise<IssuedSession> {
    if (!rawToken) {
      throw new UnauthorizedException('刷新令牌不存在')
    }

    const current = await this.repository.findRefreshSession(this.hashRefreshToken(rawToken))
    if (
      !current ||
      current.revokedAt ||
      current.expiresAt <= new Date() ||
      current.user.deletedAt ||
      current.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('刷新令牌已失效')
    }

    const refreshToken = this.createRefreshToken()
    const refreshExpiresAt = this.refreshExpiry()
    let nextSession

    try {
      const input: RefreshSessionInput = {
        userId: current.userId,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: refreshExpiresAt,
        persistent: current.persistent,
        ...metadata,
      }
      nextSession = await this.repository.rotateRefreshSession(current.id, input)
    } catch {
      throw new UnauthorizedException('刷新令牌已被使用')
    }

    return {
      response: await this.issueAccessToken(current.userId, nextSession.id),
      refreshToken,
      refreshExpiresAt,
      persistent: current.persistent,
    }
  }

  async logout(user: AuthenticatedUser): Promise<{ success: true }> {
    await this.repository.revokeRefreshSession(user.sessionId)
    return { success: true }
  }

  async profile(userId: string) {
    const identity = await this.requireIdentity(userId)
    const roles = this.roles(identity)

    return {
      id: identity.id,
      username: identity.username,
      nickname: identity.nickname,
      avatar: identity.avatar ?? '',
      email: identity.email,
      phone: identity.phone ?? '',
      department: identity.department ?? '',
      jobTitle: identity.jobTitle ?? '',
      status: identity.status.toLowerCase(),
      isAdmin: roles.includes('super_admin') || roles.includes('admin'),
      roles,
      permissions: this.permissions(identity),
      menus: this.menuTree(identity),
      lastLoginAt: identity.lastLoginAt?.toISOString() ?? '',
      lastLoginIp: identity.lastLoginIp ?? '',
      loginStreak: identity.loginStreak,
    }
  }

  async menus(userId: string): Promise<MenuNode[]> {
    return this.menuTree(await this.requireIdentity(userId))
  }

  async accessContext(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
    const identity = await this.requireIdentity(userId)
    return {
      roles: this.roles(identity),
      permissions: this.permissions(identity),
    }
  }

  async validateAccessSession(userId: string, sessionId: string): Promise<boolean> {
    return this.repository.isAccessSessionActive(userId, sessionId)
  }

  private async requireIdentity(userId: string): Promise<Identity> {
    const identity = await this.repository.findIdentityById(userId)
    if (!identity || identity.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }
    return identity
  }

  private roles(identity: Identity): string[] {
    return identity.roles
      .filter(({ role }) => role.enabled)
      .map(({ role }) => role.code)
      .sort()
  }

  private permissions(identity: Identity): string[] {
    const values = identity.roles.flatMap(({ role }) =>
      role.enabled
        ? role.permissions
            .filter(({ permission }) => permission.enabled)
            .map(({ permission }) => permission.code)
        : [],
    )
    return [...new Set(values)].sort()
  }

  private menuTree(identity: Identity): MenuNode[] {
    const menus = new Map<
      string,
      {
        id: string
        parentId: string | null
        node: MenuNode
      }
    >()

    for (const { role } of identity.roles) {
      if (!role.enabled) continue
      for (const { menu } of role.menus) {
        if (!menu.enabled || menu.hidden || menu.type === 'BUTTON') continue
        menus.set(menu.id, {
          id: menu.id,
          parentId: menu.parentId,
          node: {
            key: menu.routeName ?? menu.id,
            path: menu.path,
            title: menu.name,
            icon: menu.icon ?? undefined,
            badge: menu.badge ?? undefined,
            link: menu.externalLink ?? undefined,
            order: menu.sort,
          },
        })
      }
    }

    const roots: MenuNode[] = []
    for (const item of menus.values()) {
      const parent = item.parentId ? menus.get(item.parentId) : undefined
      if (parent) {
        parent.node.children ??= []
        parent.node.children.push(item.node)
      } else {
        roots.push(item.node)
      }
    }

    const sortTree = (nodes: MenuNode[]): MenuNode[] =>
      nodes
        .sort((left, right) => left.order - right.order)
        .map((node) => ({
          ...node,
          children: node.children?.length ? sortTree(node.children) : undefined,
        }))

    return sortTree(roots)
  }

  private async issueAccessToken(userId: string, sessionId: string): Promise<AuthResponse> {
    const expiresIn = this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true })
    const payload: AccessTokenPayload = {
      sub: userId,
      sid: sessionId,
      type: 'access',
    }
    return {
      token: await this.jwt.signAsync(payload, { expiresIn }),
      expiresIn,
    }
  }

  private createRefreshToken(): string {
    return randomBytes(48).toString('base64url')
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private refreshExpiry(): Date {
    const seconds = this.config.get('JWT_REFRESH_TTL_SECONDS', { infer: true })
    return new Date(Date.now() + seconds * 1000)
  }

  private nextLoginStreak(lastLoginAt: Date | null, current: number): number {
    if (!lastLoginAt) return 1

    const today = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    )
    const last = Date.UTC(
      lastLoginAt.getUTCFullYear(),
      lastLoginAt.getUTCMonth(),
      lastLoginAt.getUTCDate(),
    )
    const dayDifference = Math.round((today - last) / 86_400_000)
    if (dayDifference === 0) return Math.max(current, 1)
    return dayDifference === 1 ? current + 1 : 1
  }
}
