import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'ახალი პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს' })
  newPassword: string;
}
