import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * მობილური აპისთვის – რეგისტრაცია სახელით, გვარით, ელფოსტით და პაროლით
 * phone — არასავალდებულო; თუ მიუთითებთ, შესვლა ტელეფონითაც შეიძლება (+995 / 5XX…)
 */
export class RegisterMobileDto {
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters' })
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters' })
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || typeof value !== 'string') return undefined;
    const t = value.trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MinLength(9, { message: 'Phone must be at least 9 digits' })
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
