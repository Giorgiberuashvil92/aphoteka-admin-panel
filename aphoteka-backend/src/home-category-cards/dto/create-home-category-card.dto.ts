import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHomeCategoryCardDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  iconKey?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsString()
  iconColor?: string;

  @IsString()
  categoryId: string;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
