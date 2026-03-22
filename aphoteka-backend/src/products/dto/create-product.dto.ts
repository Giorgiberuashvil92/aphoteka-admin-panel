import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsUUID()
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
}
