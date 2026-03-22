import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  phoneNumber: string;

  @IsString()
  resetCode: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword: string;
}
