import { Injectable } from '@nestjs/common'

import { NotificationsRepository } from './notifications.repository'

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async list(userId: string) {
    return (await this.repository.listForUser(userId)).map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type.toLowerCase(),
      read: item.reads.length > 0,
      createdAt: item.createdAt.toISOString(),
    }))
  }

  async readAll(userId: string) {
    const count = await this.repository.markAllRead(userId)
    return { success: true as const, count }
  }
}
