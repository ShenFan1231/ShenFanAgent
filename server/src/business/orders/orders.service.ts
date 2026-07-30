import { randomUUID } from 'node:crypto'

import { Injectable, NotFoundException } from '@nestjs/common'

import { OrderStatus, Prisma } from '../../../generated/prisma'
import type { CreateOrderDto } from './dto/create-order.dto'
import type { OrderQueryDto } from './dto/order-query.dto'
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { OrdersRepository } from './orders.repository'

const statusMap = {
  paid: OrderStatus.PAID,
  pending: OrderStatus.PENDING,
  refunded: OrderStatus.REFUNDED,
  closed: OrderStatus.CLOSED,
} as const

@Injectable()
export class OrdersService {
  constructor(private readonly repository: OrdersRepository) {}

  async list(query: OrderQueryDto) {
    const result = await this.repository.list({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword,
      status: query.status ? statusMap[query.status] : undefined,
    })
    return {
      list: result.list.map((item) => this.toItem(item)),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async detail(id: string) {
    const order = await this.repository.findById(id)
    if (!order) throw new NotFoundException('订单不存在')
    return this.toItem(order)
  }

  async create(dto: CreateOrderDto) {
    const date = new Date()
    const prefix = `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`
    const order = await this.repository.create({
      orderNo: `NB-${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`,
      customer: dto.customer.trim(),
      channel: dto.channel.trim(),
      amount: new Prisma.Decimal(dto.amount),
      items: dto.items,
    })
    return this.toItem(order)
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    if (!(await this.repository.findById(id))) throw new NotFoundException('订单不存在')
    return this.toItem(await this.repository.updateStatus(id, statusMap[dto.status]))
  }

  private toItem(order: {
    id: string
    orderNo: string
    customer: string
    channel: string
    amount: Prisma.Decimal
    status: OrderStatus
    createdAt: Date
    items: number
  }) {
    return {
      id: order.id,
      orderNo: order.orderNo,
      customer: order.customer,
      channel: order.channel,
      amount: Number(order.amount),
      status: order.status.toLowerCase(),
      createdAt: order.createdAt.toISOString(),
      items: order.items,
    }
  }
}
