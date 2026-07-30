import { Type } from 'class-transformer'
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateProjectDto {
  @IsString()
  @Length(3, 64)
  code!: string

  @IsString()
  @Length(2, 120)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsIn(['game', 'application', 'ai_agent'])
  type!: 'game' | 'application' | 'ai_agent'

  @IsOptional()
  @IsUUID()
  ownerId?: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9999)
  members!: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budget!: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsDateString()
  startedAt?: string

  @IsOptional()
  @IsDateString()
  dueAt?: string
}
