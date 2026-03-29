import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BalanceStockBreakdownLineDto {
  @IsString()
  balanceWarehouseUuid: string;

  @IsString()
  @IsOptional()
  balanceBranchUuid?: string;

  @IsString()
  @IsOptional()
  balanceWarehouseName?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  reserve: number;

  @IsString()
  @IsOptional()
  seriesUuid?: string;
}
