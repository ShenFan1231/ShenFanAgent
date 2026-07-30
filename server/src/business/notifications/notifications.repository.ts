import { Injectable } from '@nestjs/common'

import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      include: {
        reads: {
          where: { userId },
          select: { readAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async markAllRead(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      select: { id: true },
    })
    await this.prisma.notificationRead.createMany({
      data: notifications.map(({ id }) => ({
        notificationId: id,
        userId,
      })),
      skipDuplicates: true,
    })
    return notifications.length
  }
}
