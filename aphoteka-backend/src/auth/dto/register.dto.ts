import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsMongoId,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export class RegisterDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  phoneNumber: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsMongoId()
  @IsOptional()
  warehouseId?: string;
}
