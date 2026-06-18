import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FilterField,
  FilterFieldDocument,
} from './schemas/filter-field.schema';
import { CreateFilterFieldDto } from './dto/create-filter-field.dto';
import { UpdateFilterFieldDto } from './dto/update-filter-field.dto';

@Injectable()
export class FilterFieldsService {
  constructor(
    @InjectModel(FilterField.name)
    private filterFieldModel: Model<FilterFieldDocument>,
  ) {}

  findAll(): Promise<FilterField[]> {
    return this.filterFieldModel.find().sort({ sortOrder: 1, label: 1 }).exec();
  }

  findActive(): Promise<FilterField[]> {
    return this.filterFieldModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .exec();
  }

  findOne(id: string): Promise<FilterField | null> {
    return this.filterFieldModel.findById(id).exec();
  }

  async create(dto: CreateFilterFieldDto): Promise<FilterField> {
    const existing = await this.filterFieldModel
      .findOne({ key: dto.key.trim() })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Filter field with key "${dto.key}" already exists`,
      );
    }
    return this.filterFieldModel.create({
      ...dto,
      key: dto.key.trim(),
      options: dto.options ?? [],
    });
  }

  async update(
    id: string,
    dto: UpdateFilterFieldDto,
  ): Promise<FilterField | null> {
    if (dto.key) {
      const existing = await this.filterFieldModel
        .findOne({ key: dto.key.trim(), _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException(
          `Filter field with key "${dto.key}" already exists`,
        );
      }
    }
    const patch = { ...dto };
    if (patch.key) patch.key = patch.key.trim();
    return this.filterFieldModel
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();
  }

  remove(id: string): Promise<FilterField | null> {
    return this.filterFieldModel.findByIdAndDelete(id).exec();
  }
}
