import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class ProjectQueryDto {
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1

  @Transform(({ value }) => Number(value ?? 12))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 12

  @IsOptional()
  @IsString()
  @MaxLength(160)
  keyword?: string

  @IsOptional()
  @IsIn(['game', 'application', 'ai_agent'])
  type?: 'game' | 'application' | 'ai_agent'

  @IsOptional()
  @IsIn(['planning', 'active', 'paused', 'archived'])
  status?: 'planning' | 'active' | 'paused' | 'archived'
}
