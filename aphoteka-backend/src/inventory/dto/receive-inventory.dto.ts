import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsMongoId,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WarehouseReceiptItemDto {
  @IsMongoId()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  productCode?: string;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsNumber()
  @IsOptional()
  tax?: number;

  @IsString()
  batchNumber: string;

  @IsDateString()
  expiryDate: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  genericName?: string;

  @IsString()
  @IsOptional()
  strength?: string;

  @IsString()
  @IsOptional()
  dosageForm?: string;

  @IsString()
  @IsOptional()
  packSize?: string;

  @IsString()
  @IsOptional()
  barcode?: string;
}

export class ReceiveInventoryDto {
  @IsMongoId()
  @IsNotEmpty()
  warehouseId: string;

  @IsString()
  @IsOptional()
  supplierInvoiceNumber?: string;

  @IsString()
  @IsOptional()
  purchaseInvoiceId?: string;

  @IsString()
  receiptNumber: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  receivedBy?: string;

  @IsDateString()
  receivedDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WarehouseReceiptItemDto)
  items: WarehouseReceiptItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
