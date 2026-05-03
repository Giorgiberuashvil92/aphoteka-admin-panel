import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginMobileDto } from './dto/login-mobile.dto';
import { RegisterMobileDto } from './dto/register-mobile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordWithTokenDto } from './dto/reset-password-with-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SendVerificationOtpDto } from './dto/send-verification-otp.dto';
import { VerifyVerificationOtpDto } from './dto/verify-verification-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** მობილური აპი: შესვლა ელფოსტით ან ტელეფონით */
  @Post('login-mobile')
  @HttpCode(HttpStatus.OK)
  async loginMobile(@Body() dto: LoginMobileDto) {
    return this.authService.loginMobile(dto);
  }

  /** მობილური აპი: რეგისტრაცია (firstName, lastName, email, password) */
  @Post('register-mobile')
  @HttpCode(HttpStatus.CREATED)
  async registerMobile(@Body() dto: RegisterMobileDto) {
    return this.authService.registerMobile(dto);
  }

  /** რეგისტრაციის OTP SMS-ით ([Sender.ge](https://sender.ge/docs/api.php)) */
  @Post('send-verification-otp')
  @HttpCode(HttpStatus.OK)
  async sendVerificationOtp(@Body() dto: SendVerificationOtpDto) {
    return this.authService.sendVerificationOtp(dto);
  }

  @Post('verify-verification-otp')
  @HttpCode(HttpStatus.OK)
  async verifyVerificationOtp(@Body() dto: VerifyVerificationOtpDto) {
    return this.authService.verifyVerificationOtp(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /** OTP-ის დადასტურების შემდეგ (forgot) — JWT `resetToken` + ახალი პაროლი */
  @Post('reset-password-with-token')
  @HttpCode(HttpStatus.OK)
  async resetPasswordWithToken(@Body() dto: ResetPasswordWithTokenDto) {
    return this.authService.resetPasswordWithToken(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }

  /** მობილური: პაროლის შეცვლა (JWT + მიმდინარე პაროლი) */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const userId =
      req.user?.id ?? req.user?._id?.toString?.() ?? req.user?.sub;
    return this.authService.changePassword(String(userId), dto);
  }
}
