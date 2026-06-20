import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeliveryRedispatchPreviewDto {
  @IsMongoId()
  @IsNotEmpty()
  warehouseId: string;
}

export class DeliveryRedispatchApplyDto extends DeliveryRedispatchPreviewDto {
  @IsOptional()
  @IsString()
  providerPriceId?: string;
}
