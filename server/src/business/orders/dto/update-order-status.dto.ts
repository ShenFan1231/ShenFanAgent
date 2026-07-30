import { IsIn } from 'class-validator'

export class UpdateOrderStatusDto {
  @IsIn(['paid', 'pending', 'refunded', 'closed'])
  status!: 'paid' | 'pending' | 'refunded' | 'closed'
}
