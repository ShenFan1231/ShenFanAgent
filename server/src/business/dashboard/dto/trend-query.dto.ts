import { IsIn, IsOptional } from 'class-validator'

export class TrendQueryDto {
  @IsOptional()
  @IsIn(['7d', '30d', '90d'])
  range: '7d' | '30d' | '90d' = '7d'
}
