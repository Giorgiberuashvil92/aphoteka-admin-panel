import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { BalanceItemSeriesLineDto } from './balance-item-series-line.dto';
import { BalanceStockBreakdownLineDto } from './balance-stock-breakdown-line.dto';

export class BulkCreateProductDto {
  @IsOptional()
  productStrengthId?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  sku: string;

  @IsString()
  @IsOptional()
  packSize?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  // Computed/denormalized fields
  @IsString()
  @IsOptional()
  genericName?: string;

  @IsString()
  @IsOptional()
  countryOfOrigin?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  strength?: string;

  @IsString()
  @IsOptional()
  dosageForm?: string;

  // Excel/Invoice additional fields
  @IsString()
  @IsOptional()
  productCode?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  reservedQuantity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceStockBreakdownLineDto)
  balanceStockBreakdown?: BalanceStockBreakdownLineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalanceItemSeriesLineDto)
  balanceItemSeries?: BalanceItemSeriesLineDto[];

  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  taxation?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  buyer?: string;

  @IsString()
  @IsOptional()
  seller?: string;

  @IsString()
  @IsOptional()
  activationDate?: string;

  @IsString()
  @IsOptional()
  transportStartDate?: string;

  @IsString()
  @IsOptional()
  certificateNumber?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  packagingType?: string;

  @IsString()
  @IsOptional()
  productNameBrand?: string;

  @IsString()
  @IsOptional()
  activeIngredients?: string;

  @IsString()
  @IsOptional()
  usage?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  sideEffects?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  contraindications?: string[];

  @IsString()
  @IsOptional()
  storageConditions?: string;
}
