import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  managerId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
