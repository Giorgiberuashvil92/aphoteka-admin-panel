import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export type RegisterMobileAccountType = 'individual' | 'legal';

/**
 * მობილური აპი: ფიზიკური ან იურიდიული პირის რეგისტრაცია.
 * phone — სავალდებულო (E.164 ნორმალიზაცია სერვერზე); შესვლა ტელეფონითაც.
 */
export class RegisterMobileDto {
  @IsIn(['individual', 'legal'])
  accountType: RegisterMobileAccountType;

  /** ფიზიკური პირი */
  @ValidateIf((o: RegisterMobileDto) => o.accountType === 'individual')
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50)
  firstName?: string;

  @ValidateIf((o: RegisterMobileDto) => o.accountType === 'individual')
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50)
  lastName?: string;

  @ValidateIf((o: RegisterMobileDto) => o.accountType === 'individual')
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string' ? value.replace(/\D/g, '') : '',
  )
  @IsString()
  @Matches(/^[0-9]{11}$/, {
    message: 'personalId must be 11 digits',
  })
  personalId?: string;

  /** იურიდიული პირი */
  @ValidateIf((o: RegisterMobileDto) => o.accountType === 'legal')
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @ValidateIf((o: RegisterMobileDto) => o.accountType === 'legal')
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  legalId?: string;

  /** ფ/პ და იურ. პირი — Balance `LegalAddress` / მონგო `Buyer.address` */
  @ValidateIf(
    (o: RegisterMobileDto) =>
      o.accountType === 'individual' || o.accountType === 'legal',
  )
  @IsString()
  @MinLength(4)
  @MaxLength(400)
  address?: string;

  /** Balance `Country` — არასავალდებულო; ცარიელი → სერვერის ნაგულისხმევი */
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || typeof value !== 'string') return undefined;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country?: string;

  @ValidateIf((o: RegisterMobileDto) => o.accountType === 'legal')
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || typeof value !== 'string') return undefined;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MaxLength(120)
  representative?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(9, { message: 'Phone must be at least 9 digits' })
  @MaxLength(20)
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
