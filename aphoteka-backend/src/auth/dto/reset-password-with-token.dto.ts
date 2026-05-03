import { IsString, MinLength } from 'class-validator';

export class ResetPasswordWithTokenDto {
  @IsString()
  resetToken: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword: string;
}
