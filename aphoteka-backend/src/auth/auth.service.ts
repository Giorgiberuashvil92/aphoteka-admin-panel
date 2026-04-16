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
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../users/schemas/user.schema';

/** საქართველოს მობილური → E.164 (+9955XXXXXXXX) ან null */
function normalizeGePhoneToE164(raw: string): string | null {
  const t = raw.trim().replace(/[\s-]/g, '');
  if (!t) return null;
  const digits = t.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('5')) return `+995${digits}`;
  if (digits.length === 12 && digits.startsWith('995')) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith('05'))
    return `+995${digits.slice(1)}`;
  if (t.startsWith('+')) {
    const d = t.slice(1).replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('995')) return `+${d}`;
  }
  return null;
}

/**
 * მობილური შესვლა: რეგისტრაციაზე ხშირად `phoneNumber` = იგივე ელფოსტაა;
 * ტელეფონი DB-ში შეიძლება იყოს +995..., 995..., ან 9 ციფრი.
 */
function buildLoginLookupFilter(emailOrPhone: string): Record<string, unknown> {
  const raw = emailOrPhone.trim();
  if (!raw) {
    return { _id: { $exists: false } };
  }
  if (raw.includes('@')) {
    const e = raw.toLowerCase();
    return { $or: [{ email: e }, { phoneNumber: e }] };
  }
  const digits = raw.replace(/\D/g, '');
  const variants = new Set<string>();
  variants.add(raw);
  if (digits.length === 9 && digits.startsWith('5')) {
    variants.add(`+995${digits}`);
    variants.add(`995${digits}`);
    variants.add(digits);
  } else if (digits.length === 12 && digits.startsWith('995')) {
    variants.add(`+${digits}`);
    variants.add(digits);
    variants.add(digits.slice(3));
  } else if (digits.length > 0) {
    variants.add(digits);
  }
  return { $or: [...variants].map((phoneNumber) => ({ phoneNumber })) };
}

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
    const user = await this.userModel
      .findOne(buildLoginLookupFilter(dto.emailOrPhone))
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
    const phoneE164 = dto.phone?.trim()
      ? normalizeGePhoneToE164(dto.phone)
      : null;
    if (dto.phone?.trim() && !phoneE164) {
      throw new BadRequestException('არასწორი ტელეფონის ნომერი');
    }

    const existingEmail = await this.userModel.findOne({
      $or: [{ email }, { phoneNumber: email }],
    });
    if (existingEmail) {
      throw new BadRequestException('This email is already registered');
    }
    if (phoneE164) {
      const existingPhone = await this.userModel
        .findOne(buildLoginLookupFilter(phoneE164))
        .exec();
      if (existingPhone) {
        throw new BadRequestException(
          'This phone number is already registered',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;
    /** ტელეფონი მითითებულზე — `phoneNumber` = E.164 (შესვლა ნომრით); წინააღმდეგ შემთხვევაში = ელფოსტა */
    const phoneNumber = phoneE164 ?? email;
    const createdUser = await this.userModel.create({
      role: UserRole.CONSUMER,
      phoneNumber,
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

  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user');
    }
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.password) {
      throw new BadRequestException('Password is not set for this account');
    }
    const currentOk = await bcrypt.compare(dto.currentPassword, user.password);
    if (!currentOk) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current one',
      );
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
    return { message: 'Password has been changed successfully' };
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
