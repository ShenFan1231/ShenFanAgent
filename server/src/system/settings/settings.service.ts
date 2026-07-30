import { Injectable } from '@nestjs/common'

import type { Prisma } from '../../../generated/prisma'
import type { UpdateSettingsDto } from './dto/update-settings.dto'
import { SettingsRepository } from './settings.repository'

@Injectable()
export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async get() {
    const settings = await this.repository.list()
    return Object.fromEntries(settings.map((item) => [item.key, item.value]))
  }

  async update(userId: string, dto: UpdateSettingsDto) {
    const values = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Record<string, Prisma.InputJsonValue>
    if (Object.keys(values).length > 0) {
      await this.repository.updateMany(userId, values)
    }
    return this.get()
  }
}
