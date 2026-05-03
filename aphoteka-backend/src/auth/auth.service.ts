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
import { ResetPasswordWithTokenDto } from './dto/reset-password-with-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../users/schemas/user.schema';
import { BuyersService } from '../buyers/buyers.service';
import { BalanceExchangeService } from '../balance/balance-exchange.service';
import { SenderGeService } from '../sms/sender-ge.service';
import { SendVerificationOtpDto } from './dto/send-verification-otp.dto';
import { VerifyVerificationOtpDto } from './dto/verify-verification-otp.dto';

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

  /** რეგისტრაციის 4-ციფრიანი OTP — გასაღები: ელფოსტა (SMS Sender.ge-ზე იგზავნება) */
  private verificationOtps = new Map<
    string,
    { code: string; expiresAt: number; purpose: string }
  >();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private buyersService: BuyersService,
    private balanceExchange: BalanceExchangeService,
    private senderGe: SenderGeService,
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
    const buyer = await this.buyersService.findByUserId(user._id);
    const balanceUid = buyer?.balanceBuyerUid?.trim();
    return {
      user: {
        ...userObject,
        firstName: parts[0] || user.fullName || '',
        lastName: parts.slice(1).join(' ') || '',
        ...(buyer
          ? {
              buyerId: buyer._id.toString(),
              ...(balanceUid ? { balanceBuyerUid: balanceUid } : {}),
            }
          : {}),
      },
      accessToken,
    };
  }

  /** მობილური აპი: ფიზიკური ან იურიდიული პირის რეგისტრაცია */
  async registerMobile(dto: RegisterMobileDto) {
    const email = dto.email.trim().toLowerCase();
    const phoneE164 = normalizeGePhoneToE164(dto.phone);
    if (!phoneE164) {
      throw new BadRequestException('არასწორი ტელეფონის ნომერი');
    }

    const existingEmail = await this.userModel.findOne({
      $or: [{ email }, { phoneNumber: email }],
    });
    if (existingEmail) {
      throw new BadRequestException('This email is already registered');
    }
    const existingPhone = await this.userModel
      .findOne(buildLoginLookupFilter(phoneE164))
      .exec();
    if (existingPhone) {
      throw new BadRequestException('This phone number is already registered');
    }

    let fullName: string;
    let responseFirstName: string;
    let responseLastName: string;
    let buyerPayload: Parameters<BuyersService['createForConsumerUser']>[1];

    if (dto.accountType === 'individual') {
      const fn = dto.firstName!.trim();
      const ln = dto.lastName!.trim();
      fullName = `${fn} ${ln}`.trim();
      responseFirstName = fn;
      responseLastName = ln;
      buyerPayload = {
        kind: 'individual',
        firstName: fn,
        lastName: ln,
        email,
        phone: phoneE164,
        personalId: dto.personalId!.trim(),
        address: dto.address!.trim(),
      };
    } else {
      const company = dto.companyName!.trim();
      const rep = dto.representative?.trim();
      const last = rep && rep.length > 0 ? rep : 'იურიდიული პირი';
      fullName = company;
      responseFirstName = company;
      responseLastName = last;
      buyerPayload = {
        kind: 'legal',
        firstName: company,
        lastName: last,
        email,
        phone: phoneE164,
        companyName: company,
        legalId: dto.legalId!.trim(),
        address: dto.address!.trim(),
        representative: rep,
      };
    }

    this.balanceExchange.requireBalanceConfiguredForMobileRegister();

    const idCode =
      dto.accountType === 'individual'
        ? dto.personalId!.trim()
        : dto.legalId!.trim();
    let balanceName: string;
    let balanceFullName: string;
    let legalAddress: string | undefined;
    if (dto.accountType === 'individual') {
      const fn = dto.firstName!.trim();
      const ln = dto.lastName!.trim();
      balanceName = `${fn} ${ln}`.trim();
      balanceFullName = balanceName;
      legalAddress = dto.address!.trim();
    } else {
      const company = dto.companyName!.trim();
      const rep = dto.representative?.trim();
      balanceName = company;
      balanceFullName = rep ? `${company}, ${rep}` : company;
      legalAddress = dto.address!.trim();
    }
    const balanceUid = await this.balanceExchange.createBuyer({
      accountType: dto.accountType,
      name: balanceName,
      fullName: balanceFullName,
      idCode,
      email,
      phoneE164,
      legalAddress,
      ...(dto.country?.trim() ? { country: dto.country.trim() } : {}),
      ...(dto.accountType === 'legal' && dto.representative?.trim()
        ? { representative: dto.representative.trim() }
        : {}),
    });
    buyerPayload = { ...buyerPayload, balanceBuyerUid: balanceUid };

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const createdUser = await this.userModel.create({
      role: UserRole.CONSUMER,
      phoneNumber: phoneE164,
      email,
      fullName,
      password: hashedPassword,
      status: 'active',
    });

    let buyerId: string;
    let balanceBuyerUid: string | undefined;
    try {
      const buyer = await this.buyersService.createForConsumerUser(
        createdUser._id,
        buyerPayload,
      );
      buyerId = buyer._id.toString();
      const u = buyer.balanceBuyerUid?.trim();
      balanceBuyerUid = u || undefined;
    } catch (err) {
      await this.userModel.deleteOne({ _id: createdUser._id }).exec();
      throw err;
    }

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
        firstName: responseFirstName,
        lastName: responseLastName,
        buyerId,
        ...(balanceBuyerUid ? { balanceBuyerUid } : {}),
      },
      accessToken,
    };
  }

  /**
   * SMS OTP — [Sender.ge](https://sender.ge/docs/api.php), `SENDER_GE_API_KEY`.
   * `register`: ახალი ანგარიში; `forgot`: არსებული ანგარიში (ელფოსტა + ტელეფონი უნდა ემთხვეოდეს).
   */
  async sendVerificationOtp(dto: SendVerificationOtpDto) {
    if (!this.senderGe.isConfigured()) {
      throw new BadRequestException(
        'SMS (Sender.ge) არ არის ჩართული. დააყენეთ გარემოში SENDER_GE_API_KEY.',
      );
    }
    const emailKey = dto.email.trim().toLowerCase();
    const dest9 = this.senderGe.normalizeGeorgianMobile9(dto.phone);
    if (!dest9) {
      throw new BadRequestException(
        'არასწორი ტელეფონის ნომერი (საჭიროა საქართველოს მობილური).',
      );
    }

    if (dto.purpose === 'forgot') {
      const user = await this.userModel
        .findOne({
          email: emailKey,
          ...buildLoginLookupFilter(dto.phone),
        })
        .exec();
      if (!user) {
        throw new BadRequestException(
          'ელფოსტა და ტელეფონი არ ემთხვევა არსებულ ანგარიშს.',
        );
      }
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    this.verificationOtps.set(emailKey, {
      code,
      expiresAt,
      purpose: dto.purpose,
    });

    const text = `Aphoteka/Kutuku: ვერიფიკაციის კოდი: ${code}. ვადა 10 წუთი.`;
    const result = await this.senderGe.sendSms(dest9, text, 2, 0);

    if (!result.ok) {
      this.verificationOtps.delete(emailKey);
      throw new BadRequestException(
        `SMS ვერ გაიგზავნა (Sender.ge). ${result.raw.slice(0, 120)}`,
      );
    }

    return { sent: true, channel: 'sms' as const };
  }

  async verifyVerificationOtp(dto: VerifyVerificationOtpDto) {
    const emailKey = dto.email.trim().toLowerCase();
    const stored = this.verificationOtps.get(emailKey);
    if (!stored) {
      throw new BadRequestException(
        'კოდი არ მოიძებნა ან ვადაგასულია. თავიდან მოითხოვეთ.',
      );
    }
    if (Date.now() > stored.expiresAt) {
      this.verificationOtps.delete(emailKey);
      throw new BadRequestException(
        'კოდის ვადა გავიდა. თავიდან მოითხოვეთ ახალი კოდი.',
      );
    }
    if (stored.code !== dto.code.trim()) {
      throw new BadRequestException('კოდი არასწორია.');
    }
    const purpose = stored.purpose;
    this.verificationOtps.delete(emailKey);

    if (purpose === 'forgot') {
      const user = await this.userModel.findOne({ email: emailKey }).exec();
      if (!user) {
        throw new BadRequestException('მომხმარებელი ვერ მოიძებნა.');
      }
      const resetToken = this.jwtService.sign(
        {
          sub: user._id.toString(),
          typ: 'password_reset',
        },
        { expiresIn: '15m' },
      );
      return { verified: true as const, resetToken };
    }

    return { verified: true as const };
  }

  async resetPasswordWithToken(dto: ResetPasswordWithTokenDto) {
    let sub: string;
    try {
      const payload = this.jwtService.verify<{ sub?: string; typ?: string }>(
        dto.resetToken,
      );
      if (payload.typ !== 'password_reset' || !payload.sub) {
        throw new UnauthorizedException('Invalid reset token');
      }
      sub = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    if (!Types.ObjectId.isValid(sub)) {
      throw new BadRequestException('Invalid user');
    }
    const user = await this.userModel.findById(sub).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
    return { message: 'Password has been reset successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel
      .findOne(buildLoginLookupFilter(forgotPasswordDto.phoneNumber))
      .exec();

    if (!user) {
      return {
        message:
          'If a user with this phone number exists, a reset code has been sent.',
      };
    }

    if (!this.senderGe.isConfigured()) {
      throw new BadRequestException(
        'SMS (Sender.ge) არ არის ჩართული. დააყენეთ გარემოში SENDER_GE_API_KEY.',
      );
    }

    const dest9 = this.senderGe.normalizeGeorgianMobile9(
      forgotPasswordDto.phoneNumber,
    );
    if (!dest9) {
      throw new BadRequestException(
        'არასწორი ტელეფონის ნომერი (საჭიროა საქართველოს მობილური).',
      );
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const phoneKey = user.phoneNumber;
    this.resetCodes.set(phoneKey, {
      code: resetCode,
      expiresAt,
    });

    const text = `Aphoteka/Kutuku: პაროლის აღდგენის კოდი: ${resetCode}. ვადა 15 წუთი.`;
    const result = await this.senderGe.sendSms(dest9, text, 2, 0);

    if (!result.ok) {
      this.resetCodes.delete(phoneKey);
      throw new BadRequestException(
        `SMS ვერ გაიგზავნა (Sender.ge). ${result.raw.slice(0, 120)}`,
      );
    }

    return {
      message:
        'If a user with this phone number exists, a reset code has been sent.',
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
    const parts = (user.fullName || '').trim().split(/\s+/);
    const buyer = await this.buyersService.findByUserId(user._id);
    const balanceUid = buyer?.balanceBuyerUid?.trim();
    return {
      ...userObject,
      id: user._id.toString(),
      firstName: parts[0] || user.fullName || '',
      lastName: parts.slice(1).join(' ') || '',
      ...(buyer
        ? {
            buyerId: buyer._id.toString(),
            ...(balanceUid ? { balanceBuyerUid: balanceUid } : {}),
          }
        : {}),
    };
  }
}
