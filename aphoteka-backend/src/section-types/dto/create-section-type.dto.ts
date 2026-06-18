import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSectionTypeDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
