import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryAddressDto {
  @IsString()
  @IsNotEmpty()
  streetName: string;

  @IsString()
  @IsNotEmpty()
  cityName: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  shippingAddress?: string;
}
