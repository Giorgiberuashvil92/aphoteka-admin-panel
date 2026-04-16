import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password: plainPassword, ...rest } = createUserDto;
    const userData: Record<string, unknown> = {
      ...rest,
    };

    if (plainPassword?.trim()) {
      userData.password = await bcrypt.hash(plainPassword.trim(), 10);
    }

    if (createUserDto.warehouseId) {
      userData.warehouseId = new Types.ObjectId(createUserDto.warehouseId);
    }

    const createdUser = new this.userModel(userData as never);
    const savedUser = await createdUser.save();

    // Populate warehouse if warehouseId exists
    if (savedUser.warehouseId) {
      await savedUser.populate('warehouseId');
    }

    return savedUser.toObject();
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().populate('warehouseId').exec();
    return users.map((user) => user.toObject());
  }

  /** მობილური „ექიმის“ რეჟიმი: პაციენტის ძიება ელფოსტით (case-insensitive) */
  async lookupByEmail(email: string): Promise<{
    id: string;
    email?: string;
    fullName?: string;
    phoneNumber: string;
  }> {
    const trimmed = email?.trim();
    if (!trimmed) {
      throw new BadRequestException('ელფოსტა სავალდებულოა');
    }
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await this.userModel
      .findOne({ email: new RegExp(`^${escaped}$`, 'i') })
      .select('email fullName phoneNumber')
      .lean()
      .exec();

    if (!user || !user.email) {
      throw new NotFoundException(
        'ამ ელფოსტით მომხმარებელი არ მოიძებნა (ელფოსტა უნდა იყოს რეგისტრირებული)',
      );
    }

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
    };
  }

  async findOne(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = await this.userModel
      .findById(id)
      .populate('warehouseId')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user.toObject();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password: plainPassword, ...rest } = updateUserDto;
    const updateData: Record<string, unknown> = { ...rest };

    if (plainPassword?.trim()) {
      updateData.password = await bcrypt.hash(plainPassword.trim(), 10);
    }

    if (updateUserDto.warehouseId) {
      updateData.warehouseId = new Types.ObjectId(updateUserDto.warehouseId);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData as never, { new: true })
      .populate('warehouseId')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user.toObject();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const result = await this.userModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async toggleStatus(id: string): Promise<User> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';

    user.status = newStatus;
    await user.save();

    await user.populate('warehouseId');

    return user.toObject();
  }
}
