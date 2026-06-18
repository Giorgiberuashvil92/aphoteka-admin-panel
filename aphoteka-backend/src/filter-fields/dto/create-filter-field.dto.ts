import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFilterFieldDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsIn(['select', 'multi', 'boolean', 'range'])
  type: 'select' | 'multi' | 'boolean' | 'range';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}
