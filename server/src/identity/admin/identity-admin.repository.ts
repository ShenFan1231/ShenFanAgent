import { Injectable } from '@nestjs/common'

import {
  Prisma,
  UserStatus,
} from '../../../generated/prisma'
import { PrismaService } from '../../database/prisma.service'

export interface AccountListInput {
  page: number
  pageSize: number
  keyword?: string
  status?: UserStatus
  role?: string
}

export interface CreateAccountInput {
  username: string
  passwordHash: string
  nickname: string
  email: string
  avatar?: string
  phone?: string
  department?: string
  jobTitle?: string
  status: UserStatus
  roleCode: string
}

const accountInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} as const

@Injectable()
export class IdentityAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts(input: AccountListInput) {
    const keyword = input.keyword?.trim()
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      status: input.status,
      roles: input.role
        ? {
            some: {
              role: {
                code: input.role,
                enabled: true,
              },
            },
          }
        : undefined,
      OR: keyword
        ? [
            { username: { contains: keyword, mode: 'insensitive' } },
            { nickname: { contains: keyword, mode: 'insensitive' } },
            { email: { contains: keyword, mode: 'insensitive' } },
          ]
        : undefined,
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: accountInclude,
        orderBy: [{ createdAt: 'desc' }, { username: 'asc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.user.count({ where }),
    ])

    return { list, total }
  }

  findAccountById(userId: string) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: accountInclude,
    })
  }

  findRoleByCode(code: string) {
    return this.prisma.role.findFirst({
      where: {
        code,
        enabled: true,
      },
    })
  }

  createAccount(input: CreateAccountInput) {
    const { roleCode, ...user } = input
    return this.prisma.user.create({
      data: {
        ...user,
        roles: {
          create: {
            role: {
              connect: { code: roleCode },
            },
          },
        },
      },
      include: accountInclude,
    })
  }

  async updateAccount(
    userId: string,
    input: {
      nickname?: string
      email?: string
      avatar?: string
      phone?: string
      department?: string
      jobTitle?: string
      status?: UserStatus
      roleCode?: string
    },
  ) {
    const { roleCode, ...user } = input
    return this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: userId },
        data: user,
      })

      if (roleCode) {
        const role = await transaction.role.findFirst({
          where: { code: roleCode, enabled: true },
        })
        if (!role) throw new Error('Role does not exist')

        await transaction.userRole.deleteMany({ where: { userId } })
        await transaction.userRole.create({
          data: {
            userId,
            roleId: role.id,
          },
        })
      }

      return transaction.user.findUniqueOrThrow({
        where: { id: userId },
        include: accountInclude,
      })
    })
  }

  async softDeleteAccount(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.DISABLED,
          deletedAt: new Date(),
        },
      }),
      this.prisma.refreshSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ])
  }

  listRoles() {
    return this.prisma.role.findMany({
      orderBy: [{ sort: 'asc' }, { code: 'asc' }],
      include: {
        permissions: {
          include: { permission: true },
        },
        menus: {
          include: { menu: true },
        },
        _count: {
          select: { users: true },
        },
      },
    })
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    })
  }

  listMenus() {
    return this.prisma.menu.findMany({
      orderBy: [{ sort: 'asc' }, { name: 'asc' }],
    })
  }

  async updateRoleAccess(
    roleId: string,
    permissionCodes: string[],
    menuRouteNames: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.role.findUniqueOrThrow({ where: { id: roleId } })
      const [permissions, menus] = await Promise.all([
        transaction.permission.findMany({
          where: {
            code: { in: [...new Set(permissionCodes)] },
            enabled: true,
          },
          select: { id: true, code: true },
        }),
        transaction.menu.findMany({
          where: {
            routeName: { in: [...new Set(menuRouteNames)] },
            enabled: true,
          },
          select: { id: true, routeName: true },
        }),
      ])

      if (permissions.length !== new Set(permissionCodes).size) {
        throw new Error('One or more permissions do not exist')
      }
      if (menus.length !== new Set(menuRouteNames).size) {
        throw new Error('One or more menus do not exist')
      }

      await transaction.rolePermission.deleteMany({ where: { roleId } })
      await transaction.roleMenu.deleteMany({ where: { roleId } })
      if (permissions.length) {
        await transaction.rolePermission.createMany({
          data: permissions.map(({ id }) => ({ roleId, permissionId: id })),
        })
      }
      if (menus.length) {
        await transaction.roleMenu.createMany({
          data: menus.map(({ id }) => ({ roleId, menuId: id })),
        })
      }
    })
  }
}
