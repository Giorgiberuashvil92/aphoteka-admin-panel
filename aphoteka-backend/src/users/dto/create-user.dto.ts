import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  IsMongoId,
  MinLength,
} from 'class-validator';
import { UserRole, UserPermission } from '../schemas/user.schema';

export class CreateUserDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  phoneNumber: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsMongoId()
  @IsOptional()
  warehouseId?: string;

  @IsEnum(['active', 'inactive', 'suspended'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'suspended';

  @IsArray()
  @IsEnum(UserPermission, { each: true })
  @IsOptional()
  permissions?: UserPermission[];

  /** ახალი პაროლი (შექმნისას ან ადმინის მიერ რედაქტირებისას) — ინახება ჰეშირებული */
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && !value.trim() ? undefined : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს' })
  password?: string;
}
