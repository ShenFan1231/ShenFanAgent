import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator'

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nickname?: string

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(160)
  email?: string

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  avatar?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleCode?: string

  @IsOptional()
  @IsIn(['active', 'disabled', 'pending'])
  status?: 'active' | 'disabled' | 'pending'
}
