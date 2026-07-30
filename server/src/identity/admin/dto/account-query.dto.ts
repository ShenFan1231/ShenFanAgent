import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class AccountQueryDto {
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1

  @Transform(({ value }) => Number(value ?? 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10

  @IsOptional()
  @IsString()
  @MaxLength(160)
  keyword?: string

  @IsOptional()
  @IsIn(['active', 'disabled', 'pending'])
  status?: 'active' | 'disabled' | 'pending'

  @IsOptional()
  @IsString()
  @MaxLength(64)
  role?: string
}
