import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class SendVerificationOtpDto {
  @IsEmail()
  email: string;

  /** ტელეფონი — Sender.ge მოელის საქართველოს 9 ციფრს (ნორმალიზაცია სერვერზე) */
  @IsString()
  @MinLength(9)
  @MaxLength(24)
  phone: string;

  @IsIn(['register', 'forgot'])
  purpose: 'register' | 'forgot';
}
