import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateHomeSectionDto {
  @IsString()
  title: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  categoryFilter?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsNumber()
  order: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
