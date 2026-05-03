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
import {
  WarehouseEmployee,
  WarehouseEmployeeDocument,
  WarehouseEmployeeRole,
} from '../warehouses/schemas/warehouse.schema';

function warehouseIdToObjectId(
  w:
    | Types.ObjectId
    | { _id?: Types.ObjectId; id?: string }
    | string
    | undefined
    | null,
): Types.ObjectId | undefined {
  if (!w) return undefined;
  if (w instanceof Types.ObjectId) return w;
  if (typeof w === 'string' && Types.ObjectId.isValid(w)) {
    return new Types.ObjectId(w);
  }
  if (typeof w === 'object' && w !== null) {
    if ('_id' in w && w._id instanceof Types.ObjectId) return w._id;
    if (
      'id' in w &&
      typeof w.id === 'string' &&
      Types.ObjectId.isValid(w.id)
    ) {
      return new Types.ObjectId(w.id);
    }
  }
  return undefined;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(WarehouseEmployee.name)
    private warehouseEmployeeModel: Model<WarehouseEmployeeDocument>,
  ) {}

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

    await this.syncWarehouseEmployeeForUser(savedUser);

    // Populate warehouse if warehouseId exists
    if (savedUser.warehouseId) {
      await savedUser.populate('warehouseId');
    }

    return savedUser.toObject();
  }

  /**
   * User.warehouseId → WarehouseEmployee (საწყობის თანამშრომლების სია).
   * ნებისმიერი როლის მომხმარებელს შეიძლება ჰქონდეს საწყობი; თუ როლი არ არის warehouse_staff,
   * ჩანაწერი მაინც უნდა იყოს, რომ ადმინში საწყობის გვერდზე ჩანდეს.
   */
  private async syncWarehouseEmployeeForUser(user: UserDocument): Promise<void> {
    const uid = user._id.toString();
    const wid = warehouseIdToObjectId(
      user.warehouseId as Types.ObjectId | undefined,
    );

    if (wid) {
      const existing = await this.warehouseEmployeeModel
        .findOne({ userId: uid })
        .exec();
      if (existing) {
        existing.warehouseId = wid;
        existing.active = user.status === 'active';
        await existing.save();
      } else {
        await this.warehouseEmployeeModel.create({
          warehouseId: wid,
          userId: uid,
          role: WarehouseEmployeeRole.WAREHOUSE_KEEPER,
          active: user.status === 'active',
          startedAt: new Date(),
        });
      }
    } else {
      await this.warehouseEmployeeModel.deleteMany({ userId: uid }).exec();
    }
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

    await this.syncWarehouseEmployeeForUser(user);

    return user.toObject();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.warehouseEmployeeModel.deleteMany({ userId: id }).exec();

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

    await this.syncWarehouseEmployeeForUser(user);

    await user.populate('warehouseId');

    return user.toObject();
  }
}
