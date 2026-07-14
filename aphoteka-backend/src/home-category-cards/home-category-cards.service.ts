import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HomeCategoryCard,
  HomeCategoryCardDocument,
} from './schemas/home-category-card.schema';
import { CreateHomeCategoryCardDto } from './dto/create-home-category-card.dto';
import { UpdateHomeCategoryCardDto } from './dto/update-home-category-card.dto';

@Injectable()
export class HomeCategoryCardsService {
  constructor(
    @InjectModel(HomeCategoryCard.name)
    private homeCategoryCardModel: Model<HomeCategoryCardDocument>,
  ) {}

  async create(
    createDto: CreateHomeCategoryCardDto,
  ): Promise<HomeCategoryCard> {
    const created = new this.homeCategoryCardModel(createDto);
    return created.save();
  }

  async findAll(): Promise<HomeCategoryCard[]> {
    return this.homeCategoryCardModel.find().sort({ order: 1 }).exec();
  }

  async findVisible(): Promise<HomeCategoryCard[]> {
    return this.homeCategoryCardModel
      .find({ isVisible: true })
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<HomeCategoryCard | null> {
    return this.homeCategoryCardModel.findById(id).exec();
  }

  async update(
    id: string,
    updateDto: UpdateHomeCategoryCardDto,
  ): Promise<HomeCategoryCard | null> {
    return this.homeCategoryCardModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<HomeCategoryCard | null> {
    return this.homeCategoryCardModel.findByIdAndDelete(id).exec();
  }

  async reorder(updates: { id: string; order: number }[]): Promise<void> {
    const bulkOps = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { order: update.order } },
      },
    }));
    await this.homeCategoryCardModel.bulkWrite(bulkOps);
  }
}
