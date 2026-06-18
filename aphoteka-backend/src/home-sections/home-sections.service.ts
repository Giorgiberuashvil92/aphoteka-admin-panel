import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HomeSection,
  HomeSectionDocument,
} from './schemas/home-section.schema';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';

@Injectable()
export class HomeSectionsService {
  constructor(
    @InjectModel(HomeSection.name)
    private homeSectionModel: Model<HomeSectionDocument>,
  ) {}

  async create(createDto: CreateHomeSectionDto): Promise<HomeSection> {
    const created = new this.homeSectionModel(createDto);
    return created.save();
  }

  async findAll(): Promise<HomeSection[]> {
    return this.homeSectionModel.find().sort({ order: 1 }).exec();
  }

  async findVisible(): Promise<HomeSection[]> {
    return this.homeSectionModel
      .find({ isVisible: true })
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<HomeSection | null> {
    return this.homeSectionModel.findById(id).exec();
  }

  async update(
    id: string,
    updateDto: UpdateHomeSectionDto,
  ): Promise<HomeSection | null> {
    return this.homeSectionModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<HomeSection | null> {
    return this.homeSectionModel.findByIdAndDelete(id).exec();
  }

  async reorder(updates: { id: string; order: number }[]): Promise<void> {
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { order: update.order } },
      },
    }));

    await this.homeSectionModel.bulkWrite(bulkOps);
  }
}
