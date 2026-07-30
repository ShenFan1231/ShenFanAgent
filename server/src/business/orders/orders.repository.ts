import { Injectable } from '@nestjs/common'

import { OrderStatus, Prisma } from '../../../generated/prisma'
import { PrismaService } from '../../database/prisma.service'

export interface OrderListInput {
  page: number
  pageSize: number
  keyword?: string
  status?: OrderStatus
}

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(input: OrderListInput) {
    const keyword = input.keyword?.trim()
    const where: Prisma.OrderWhereInput = {
      status: input.status,
      OR: keyword
        ? [
            { orderNo: { contains: keyword, mode: 'insensitive' } },
            { customer: { contains: keyword, mode: 'insensitive' } },
          ]
        : undefined,
    }
    const [list, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.order.count({ where }),
    ])
    return { list, total }
  }

  findById(id: string) {
    return this.prisma.order.findUnique({ where: { id } })
  }

  create(data: {
    orderNo: string
    customer: string
    channel: string
    amount: Prisma.Decimal
    items: number
  }) {
    return this.prisma.order.create({ data })
  }

  updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({ where: { id }, data: { status } })
  }
}
