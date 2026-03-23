import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
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
  @IsEmail()
  patientEmail: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionLineDto)
  items: PrescriptionLineDto[];
}
