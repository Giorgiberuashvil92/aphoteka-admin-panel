import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionLineDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePrescriptionDto {
  @IsString()
  @Matches(/^\d{11}$/, { message: 'patientPersonalId must be 11 digits' })
  patientPersonalId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionLineDto)
  items: PrescriptionLineDto[];
}
