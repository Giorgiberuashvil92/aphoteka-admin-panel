import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SectionType,
  SectionTypeDocument,
} from './schemas/section-type.schema';
import { CreateSectionTypeDto } from './dto/create-section-type.dto';
import { UpdateSectionTypeDto } from './dto/update-section-type.dto';

@Injectable()
export class SectionTypesService {
  constructor(
    @InjectModel(SectionType.name)
    private sectionTypeModel: Model<SectionTypeDocument>,
  ) {}

  async findAll(): Promise<SectionType[]> {
    return this.sectionTypeModel.find().sort({ key: 1 }).exec();
  }

  async findActive(): Promise<SectionType[]> {
    return this.sectionTypeModel
      .find({ isActive: true })
      .sort({ key: 1 })
      .exec();
  }

  async findOne(id: string): Promise<SectionType | null> {
    return this.sectionTypeModel.findById(id).exec();
  }

  async create(dto: CreateSectionTypeDto): Promise<SectionType> {
    // Check if key already exists
    const existing = await this.sectionTypeModel
      .findOne({ key: dto.key })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Section type with key "${dto.key}" already exists`,
      );
    }

    const created = await this.sectionTypeModel.create({
      ...dto,
      isBuiltIn: false,
    });
    return created;
  }

  async update(
    id: string,
    dto: UpdateSectionTypeDto,
  ): Promise<SectionType | null> {
    // Check if trying to update key and if new key already exists
    if (dto.key) {
      const existing = await this.sectionTypeModel
        .findOne({ key: dto.key, _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException(
          `Section type with key "${dto.key}" already exists`,
        );
      }
    }

    return this.sectionTypeModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<SectionType | null> {
    const type = await this.sectionTypeModel.findById(id).exec();
    if (!type) {
      return null;
    }

    // Prevent deletion of built-in types
    if (type.isBuiltIn) {
      throw new ConflictException('Cannot delete built-in section type');
    }

    return this.sectionTypeModel.findByIdAndDelete(id).exec();
  }
}
