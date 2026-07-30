import { IsBoolean, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator'

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  siteName?: string

  @IsOptional()
  @IsString()
  @Length(1, 255)
  apiBase?: string

  @IsOptional()
  @Matches(/^\d+$/)
  timeout?: string

  @IsOptional()
  @Matches(/^\d+$/)
  sessionTtl?: string

  @IsOptional()
  @IsIn(['debug', 'info', 'warn', 'error'])
  logLevel?: 'debug' | 'info' | 'warn' | 'error'

  @IsOptional()
  @IsBoolean()
  mfa?: boolean

  @IsOptional()
  @IsBoolean()
  ipWhitelist?: boolean

  @IsOptional()
  @IsBoolean()
  auditLog?: boolean

  @IsOptional()
  @IsBoolean()
  autoBackup?: boolean
}
