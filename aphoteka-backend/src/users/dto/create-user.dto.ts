import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  IsMongoId,
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
}
