import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator'

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 160)
  username!: string

  @IsString()
  @Length(6, 128)
  password!: string

  // Kept for compatibility with the existing mock login contract.
  // The real API always resolves roles from the account.
  @IsOptional()
  @IsIn(['super_admin', 'admin', 'operator'])
  role?: string

  @IsOptional()
  @IsBoolean()
  remember?: boolean
}
