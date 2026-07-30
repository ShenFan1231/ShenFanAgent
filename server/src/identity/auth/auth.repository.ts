import { Injectable } from '@nestjs/common'

import { UserStatus } from '../../../generated/prisma'
import { PrismaService } from '../../database/prisma.service'

const identityInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          menus: {
            include: {
              menu: true,
            },
          },
        },
      },
    },
  },
} as const

export interface RefreshSessionInput {
  userId: string
  tokenHash: string
  expiresAt: Date
  persistent: boolean
  ipAddress?: string
  userAgent?: string
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findForLogin(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ username: identifier }, { email: identifier.toLowerCase() }],
      },
      include: identityInclude,
    })
  }

  findIdentityById(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: identityInclude,
    })
  }

  async isAccessSessionActive(userId: string, sessionId: string): Promise<boolean> {
    const count = await this.prisma.refreshSession.count({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: {
          status: UserStatus.ACTIVE,
          deletedAt: null,
        },
      },
    })
    return count === 1
  }

  createRefreshSession(input: RefreshSessionInput) {
    return this.prisma.refreshSession.create({
      data: input,
    })
  }

  findRefreshSession(tokenHash: string) {
    return this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    })
  }

  rotateRefreshSession(sessionId: string, input: RefreshSessionInput) {
    return this.prisma.$transaction(async (transaction) => {
      const revoked = await transaction.refreshSession.updateMany({
        where: {
          id: sessionId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      })

      if (revoked.count !== 1) {
        throw new Error('Refresh session has already been rotated')
      }

      return transaction.refreshSession.create({
        data: input,
      })
    })
  }

  async revokeRefreshSession(sessionId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }

  async recordSuccessfulLogin(
    userId: string,
    input: { ipAddress?: string; loginStreak: number },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: input.ipAddress,
        loginStreak: input.loginStreak,
      },
    })
  }
}
