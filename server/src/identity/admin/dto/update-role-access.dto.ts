import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator'

export class UpdateRoleAccessDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  permissionCodes!: string[]

  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  menuRouteNames!: string[]
}
