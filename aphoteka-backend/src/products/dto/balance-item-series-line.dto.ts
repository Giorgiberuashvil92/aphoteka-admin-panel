import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BalanceItemSeriesLineDto {
  @IsString()
  @IsOptional()
  seriesNumber?: string;

  @IsString()
  @IsOptional()
  seriesUuid?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  warehouseUuid?: string;
}
