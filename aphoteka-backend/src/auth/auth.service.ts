import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginMobileDto } from './dto/login-mobile.dto';
import { RegisterMobileDto } from './dto/register-mobile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  // In-memory storage for reset codes (in production, use Redis or database)
  private resetCodes = new Map<string, { code: string; expiresAt: Date }>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      phoneNumber: registerDto.phoneNumber,
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this phone number already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user
    const baseData = {
      ...registerDto,
      password: hashedPassword,
      status: 'active',
    };
    const userData = registerDto.warehouseId
      ? {
          ...baseData,
          warehouseId: new Types.ObjectId(
            registerDto.warehouseId as unknown as string,
          ),
        }
      : baseData;
    const createdUser = new this.userModel(
      userData as Parameters<Model<UserDocument>['create']>[0],
    );
    const savedUser = await createdUser.save();

    // Populate warehouse if exists
    if (savedUser.warehouseId) {
      await savedUser.populate('warehouseId');
    }

    // Generate JWT token
    const payload = {
      sub: savedUser._id.toString(),
      phoneNumber: savedUser.phoneNumber,
      role: savedUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const userObject = savedUser.toObject();
    delete userObject.password;

    return {
      user: userObject,
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user by phone number
    const user = await this.userModel
      .findOne({ phoneNumber: loginDto.phoneNumber })
      .populate('warehouseId')
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Check if user has password set
    if (!user.password) {
      throw new UnauthorizedException(
        'Password not set. Please set your password first.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid phone number or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    // Generate JWT token
    const payload = {
      sub: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const userObject = user.toObject();
    delete userObject.password;

    return {
      user: userObject,
      accessToken,
    };
  }

  /** მობილური აპი: შესვლა ელფოსტით ან ტელეფონით */
  async loginMobile(dto: LoginMobileDto) {
    const isEmail = dto.emailOrPhone.includes('@');
    const user = await this.userModel
      .findOne(
        isEmail
          ? { email: dto.emailOrPhone.trim().toLowerCase() }
          : { phoneNumber: dto.emailOrPhone.trim() },
      )
      .populate('warehouseId')
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }
    if (!user.password) {
      throw new UnauthorizedException(
        'Password not set. Please set your password first.',
      );
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email/phone or password');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is not active');
    }

    const payload = {
      sub: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const userObject = user.toObject();
    delete userObject.password;
    const parts = (user.fullName || '').trim().split(/\s+/);
    return {
      user: {
        ...userObject,
        firstName: parts[0] || user.fullName || '',
        lastName: parts.slice(1).join(' ') || '',
      },
      accessToken,
    };
  }

  /** მობილური აპი: რეგისტრაცია სახელით, გვარით, ელფოსტით */
  async registerMobile(dto: RegisterMobileDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userModel.findOne({
      $or: [{ email }, { phoneNumber: email }],
    });
    if (existing) {
      throw new BadRequestException('This email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;
    const createdUser = await this.userModel.create({
      role: UserRole.CONSUMER,
      phoneNumber: email,
      email,
      fullName,
      password: hashedPassword,
      status: 'active',
    });

    const payload = {
      sub: createdUser._id.toString(),
      phoneNumber: createdUser.phoneNumber,
      role: createdUser.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const userObject = createdUser.toObject();
    delete userObject.password;
    return {
      user: {
        ...userObject,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
      },
      accessToken,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({
      phoneNumber: forgotPasswordDto.phoneNumber,
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message:
          'If a user with this phone number exists, a reset code has been sent.',
      };
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store reset code (expires in 15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    this.resetCodes.set(forgotPasswordDto.phoneNumber, {
      code: resetCode,
      expiresAt,
    });

    // In production, send SMS with reset code
    console.log(
      `Reset code for ${forgotPasswordDto.phoneNumber}: ${resetCode}`,
    );

    return {
      message:
        'If a user with this phone number exists, a reset code has been sent.',
      // In development, return code for testing
      resetCode: process.env.NODE_ENV === 'development' ? resetCode : undefined,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const storedReset = this.resetCodes.get(resetPasswordDto.phoneNumber);

    if (!storedReset) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (new Date() > storedReset.expiresAt) {
      this.resetCodes.delete(resetPasswordDto.phoneNumber);
      throw new BadRequestException('Reset code has expired');
    }

    if (storedReset.code !== resetPasswordDto.resetCode) {
      throw new BadRequestException('Invalid reset code');
    }

    // Find user
    const user = await this.userModel.findOne({
      phoneNumber: resetPasswordDto.phoneNumber,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Remove reset code
    this.resetCodes.delete(resetPasswordDto.phoneNumber);

    return {
      message: 'Password has been reset successfully',
    };
  }

  async validateUser(userId: string): Promise<any> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const user = await this.userModel
      .findById(userId)
      .populate('warehouseId')
      .exec();

    if (!user || user.status !== 'active') {
      return null;
    }

    const userObject = user.toObject();
    delete userObject.password;
    return userObject;
  }
}
