import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsArray()
  productIds?: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}
