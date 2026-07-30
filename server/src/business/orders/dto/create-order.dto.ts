import { Type } from 'class-transformer'
import { IsInt, IsNumber, IsString, Length, Max, Min } from 'class-validator'

export class CreateOrderDto {
  @IsString()
  @Length(2, 100)
  customer!: string

  @IsString()
  @Length(2, 64)
  channel!: string

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  items!: number
}
