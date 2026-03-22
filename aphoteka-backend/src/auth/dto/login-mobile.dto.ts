import { IsString, MinLength } from 'class-validator';

/**
 * მობილური აპისთვის – შესვლა ელფოსტით ან ტელეფონით
 */
export class LoginMobileDto {
  @IsString()
  emailOrPhone: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
