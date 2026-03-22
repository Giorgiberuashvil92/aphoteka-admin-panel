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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }
}
