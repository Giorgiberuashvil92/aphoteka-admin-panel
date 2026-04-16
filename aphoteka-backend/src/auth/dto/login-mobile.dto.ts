import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

/**
 * მობილური აპისთვის – შესვლა ელფოსტით ან ტელეფონით
 */
export class LoginMobileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  emailOrPhone: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
