import { Injectable } from '@nestjs/common'

import type { Prisma } from '../../../generated/prisma'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.systemSetting.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    })
  }

  async updateMany(userId: string, values: Record<string, Prisma.InputJsonValue>) {
    return this.prisma.$transaction(
      Object.entries(values).map(([key, value]) =>
        this.prisma.systemSetting.update({
          where: { key },
          data: {
            value,
            updatedById: userId,
          },
        }),
      ),
    )
  }
}
