import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BogPaymentInitDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  successRedirectUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  failRedirectUrl?: string;
}
