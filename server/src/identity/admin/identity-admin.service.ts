import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { hash } from 'bcryptjs'

import {
  Prisma,
  UserStatus,
} from '../../../generated/prisma'
import type { AppEnvironment } from '../../config/environment'
import type { AccountQueryDto } from './dto/account-query.dto'
import type { CreateAccountDto } from './dto/create-account.dto'
import type { UpdateAccountDto } from './dto/update-account.dto'
import type { UpdateRoleAccessDto } from './dto/update-role-access.dto'
import { IdentityAdminRepository } from './identity-admin.repository'

type Account = NonNullable<
  Awaited<ReturnType<IdentityAdminRepository['findAccountById']>>
>

const statusMap: Record<'active' | 'disabled' | 'pending', UserStatus> = {
  active: UserStatus.ACTIVE,
  disabled: UserStatus.DISABLED,
  pending: UserStatus.PENDING,
}

@Injectable()
export class IdentityAdminService {
  constructor(
    private readonly repository: IdentityAdminRepository,
    private readonly config: ConfigService<AppEnvironment, true>,
  ) {}

  async accounts(query: AccountQueryDto) {
    const result = await this.repository.listAccounts({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword,
      status: query.status ? statusMap[query.status] : undefined,
      role: query.role,
    })
    return {
      list: result.list.map((account) => this.toAccountItem(account)),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async createAccount(dto: CreateAccountDto) {
    if (!(await this.repository.findRoleByCode(dto.roleCode))) {
      throw new BadRequestException('指定角色不存在或已停用')
    }

    try {
      const passwordHash = await hash(
        dto.password,
        this.config.get('PASSWORD_HASH_ROUNDS', { infer: true }),
      )
      const account = await this.repository.createAccount({
        username: dto.username,
        passwordHash,
        nickname: dto.nickname,
        email: dto.email,
        avatar: dto.avatar,
        phone: dto.phone,
        department: dto.department,
        jobTitle: dto.jobTitle,
        status: statusMap[dto.status],
        roleCode: dto.roleCode,
      })
      return this.toAccountItem(account)
    } catch (error) {
      this.rethrowPersistenceError(error)
    }
  }

  async updateAccount(userId: string, dto: UpdateAccountDto) {
    const current = await this.repository.findAccountById(userId)
    if (!current) throw new NotFoundException('用户不存在')
    if (dto.roleCode && !(await this.repository.findRoleByCode(dto.roleCode))) {
      throw new BadRequestException('指定角色不存在或已停用')
    }

    try {
      const account = await this.repository.updateAccount(userId, {
        nickname: dto.nickname,
        email: dto.email,
        avatar: dto.avatar,
        phone: dto.phone,
        department: dto.department,
        jobTitle: dto.jobTitle,
        status: dto.status ? statusMap[dto.status] : undefined,
        roleCode: dto.roleCode,
      })
      return this.toAccountItem(account)
    } catch (error) {
      this.rethrowPersistenceError(error)
    }
  }

  async removeAccount(
    currentUserId: string,
    targetUserId: string,
  ): Promise<{ id: string; deleted: true }> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('不能删除当前登录账号')
    }

    const account = await this.repository.findAccountById(targetUserId)
    if (!account) throw new NotFoundException('用户不存在')
    if (account.roles.some(({ role }) => role.code === 'super_admin')) {
      throw new BadRequestException('系统超级管理员不能被删除')
    }

    await this.repository.softDeleteAccount(targetUserId)
    return { id: targetUserId, deleted: true }
  }

  async roles() {
    const roles = await this.repository.listRoles()
    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      enabled: role.enabled,
      isSystem: role.isSystem,
      sort: role.sort,
      userCount: role._count.users,
      permissions: role.permissions
        .filter(({ permission }) => permission.enabled)
        .map(({ permission }) => permission.code)
        .sort(),
      menus: role.menus
        .filter(({ menu }) => menu.enabled)
        .map(({ menu }) => menu.routeName)
        .filter((value): value is string => Boolean(value))
        .sort(),
    }))
  }

  async permissions() {
    const permissions = await this.repository.listPermissions()
    return permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      name: permission.name,
      module: permission.module,
      action: permission.action,
      description: permission.description ?? '',
      enabled: permission.enabled,
    }))
  }

  async menus() {
    const menus = await this.repository.listMenus()
    return menus.map((menu) => ({
      id: menu.id,
      parentId: menu.parentId,
      type: menu.type.toLowerCase(),
      name: menu.name,
      routeName: menu.routeName,
      path: menu.path,
      componentKey: menu.componentKey,
      icon: menu.icon,
      hidden: menu.hidden,
      keepAlive: menu.keepAlive,
      enabled: menu.enabled,
      sort: menu.sort,
    }))
  }

  async updateRoleAccess(roleId: string, dto: UpdateRoleAccessDto) {
    try {
      await this.repository.updateRoleAccess(
        roleId,
        dto.permissionCodes,
        dto.menuRouteNames,
      )
      return { id: roleId, updated: true }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('角色不存在')
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : '角色授权数据无效',
      )
    }
  }

  private toAccountItem(account: Account) {
    const role = [...account.roles]
      .filter(({ role: item }) => item.enabled)
      .sort((left, right) => left.role.sort - right.role.sort)[0]?.role.code

    return {
      id: account.id,
      username: account.username,
      nickname: account.nickname,
      avatar: account.avatar ?? '',
      email: account.email,
      department: account.department ?? '',
      role: role ?? 'operator',
      status: account.status.toLowerCase(),
      createdAt: account.createdAt.toISOString(),
      lastActiveAt: (account.lastLoginAt ?? account.createdAt).toISOString(),
    }
  }

  private rethrowPersistenceError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('用户名或邮箱已存在')
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('用户不存在')
    }
    throw error
  }
}
