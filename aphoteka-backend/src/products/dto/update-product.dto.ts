import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { BalanceItemSeriesLineDto } from './balance-item-series-line.dto';
import { BalanceStockBreakdownLineDto } from './balance-stock-breakdown-line.dto';

/**
 * PATCH სხეული — ყველა ველი არჩევითი.
 * `PartialType(CreateProductDto)` ზოგიერთ რანტაიმში არ აკოპირებს class-validator whitelist-ს
 * (`forbidNonWhitelisted` → „property X should not exist“). აქ ყველა ველი პირდაპირაა აღწერილი.
 */
export class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  productStrengthId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

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
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  packSize?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

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

  @IsString()
  @IsOptional()
  productCode?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  reservedQuantity?: number;

  @IsString()
  @IsOptional()
  balanceNomenclatureItemUid?: string;

  @IsString()
  @IsOptional()
  balanceInventoriesAccount?: string;

  @IsString()
  @IsOptional()
  balanceExpensesAccount?: string;

  @IsString()
  @IsOptional()
  balanceRevenuesAccount?: string;

  @IsString()
  @IsOptional()
  balanceVatPayableAccount?: string;

  @IsString()
  @IsOptional()
  balanceVatRateUid?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  balanceDiscountPercent?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  balanceDiscountAmount?: number;

  @IsString()
  @IsOptional()
  balanceDiscountName?: string;

  @IsString()
  @IsOptional()
  balanceDiscountUid?: string;

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
