import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class OperationLogQueryDto {
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1

  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20

  @IsOptional()
  @IsString()
  @MaxLength(160)
  keyword?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  module?: string

  @IsOptional()
  @IsIn(['info', 'success', 'warning', 'danger'])
  level?: 'info' | 'success' | 'warning' | 'danger'
}
