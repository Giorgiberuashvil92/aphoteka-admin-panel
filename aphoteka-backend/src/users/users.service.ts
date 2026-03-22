import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const userData: any = {
      ...createUserDto,
    };

    if (createUserDto.warehouseId) {
      userData.warehouseId = new Types.ObjectId(createUserDto.warehouseId);
    }

    const createdUser = new this.userModel(userData);
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

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.warehouseId) {
      updateData.warehouseId = new Types.ObjectId(updateUserDto.warehouseId);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
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
