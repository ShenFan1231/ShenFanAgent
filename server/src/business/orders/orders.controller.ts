import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common'

import { RequirePermissions } from '../../identity/auth/decorators/require-permissions.decorator'
import { CreateOrderDto } from './dto/create-order.dto'
import { OrderQueryDto } from './dto/order-query.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @RequirePermissions('order:view')
  list(@Query() query: OrderQueryDto) {
    return this.service.list(query)
  }

  @Get(':id')
  @RequirePermissions('order:view')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detail(id)
  }

  @Post()
  @RequirePermissions('order:create')
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto)
  }

  @Patch(':id/status')
  @RequirePermissions('order:refund')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(id, dto)
  }
}
