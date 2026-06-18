import {
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  Min,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  productName: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  packSize?: string;

  /** Balance Sale-ისთვის: მობილურიდან არჩეული სერიის UUID (სერიული ნომენკლატურისთვის) */
  @IsOptional()
  @IsString()
  balanceSeriesUuid?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  /** Balance Sale-ისთვის: მომხმარებლის არჩეული საწყობი (Mongo Warehouse._id) */
  @IsOptional()
  @IsMongoId()
  warehouseId?: string;

  /** Quickshipper delivery provider info */
  @IsOptional()
  @IsObject()
  deliveryProvider?: {
    providerId: number;
    providerName: string;
    providerLogoUrl?: string;
  };

  /** Quickshipper delivery address */
  @IsOptional()
  @IsObject()
  deliveryAddress?: {
    streetName: string;
    cityName: string;
    latitude: number;
    longitude: number;
  };

  /** Quickshipper delivery price (amount) */
  @IsOptional()
  @IsNumber()
  deliveryPrice?: number;

  /** Quickshipper service fee */
  @IsOptional()
  @IsNumber()
  deliveryServiceFee?: number;

  /** Quickshipper delivery speed name */
  @IsOptional()
  @IsString()
  deliverySpeed?: string;
}
