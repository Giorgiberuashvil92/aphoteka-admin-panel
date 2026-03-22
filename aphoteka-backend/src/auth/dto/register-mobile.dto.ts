import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

/**
 * მობილური აპისთვის – რეგისტრაცია სახელით, გვარით, ელფოსტით და პაროლით
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

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
