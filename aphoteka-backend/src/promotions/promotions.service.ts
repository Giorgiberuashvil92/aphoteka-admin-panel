import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionDocument } from './schemas/promotion.schema';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

interface PopulatedProduct {
  _id?: { toString(): string };
  id?: string;
  name: string;
  price?: number;
  imageUrl?: string;
}

interface PromotionLean {
  _id?: { toString(): string };
  id?: string;
  name: string;
  description?: string;
  backgroundColor?: string;
  logoUrl?: string;
  productIds?: PopulatedProduct[];
  discountPercent?: number;
  startDate?: Date;
  endDate?: Date;
  active?: boolean;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ActivePromotionItem {
  id: string;
  name: string;
  description?: string;
  backgroundColor: string;
  logoUrl: string | null;
  products: {
    id: string;
    name: string;
    originalPrice: number;
    currentPrice: number;
    discount: number;
    image: string | null;
  }[];
}

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private promotionModel: Model<PromotionDocument>,
  ) {}

  /** მობილური: მხოლოდ აქტიური აქციები (აქტიური, ვადა არ არის გასული), პროდუქტებით */
  async findActive(): Promise<ActivePromotionItem[]> {
    const now = new Date();
    const list = (await this.promotionModel
      .find({
        active: true,
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } },
        ],
      })
      .sort({ order: 1, createdAt: -1 })
      .populate('productIds')
      .lean()
      .exec()) as unknown as PromotionLean[];

    return list.map((p) => {
      const productList = (p.productIds || []).filter(
        (x): x is PopulatedProduct => Boolean(x),
      );
      const products = productList.map((prod) => {
        const price = prod.price ?? 0;
        const discount = p.discountPercent ?? 0;
        const currentPrice =
          Math.round(price * (1 - discount / 100) * 100) / 100;
        return {
          id: prod._id?.toString() ?? prod.id ?? '',
          name: prod.name,
          originalPrice: price,
          currentPrice,
          discount: p.discountPercent ?? 0,
          image: prod.imageUrl || null,
        };
      });
      return {
        id: p._id?.toString() ?? p.id ?? '',
        name: p.name,
        description: p.description,
        backgroundColor: p.backgroundColor || '#F5F5FF',
        logoUrl: p.logoUrl || null,
        products,
      };
    });
  }

  /** ადმინი: ერთი აქცია ID-ით */
  async findOne(id: string): Promise<Record<string, unknown> | null> {
    const doc = (await this.promotionModel
      .findById(id)
      .populate('productIds')
      .lean()
      .exec()) as unknown as PromotionLean | null;
    if (!doc) return null;
    return {
      id: doc._id?.toString() ?? doc.id,
      name: doc.name,
      description: doc.description,
      backgroundColor: doc.backgroundColor,
      logoUrl: doc.logoUrl,
      productIds: (doc.productIds || []).map(
        (x: PopulatedProduct) => x._id?.toString() ?? x.id,
      ),
      discountPercent: doc.discountPercent,
      startDate: doc.startDate,
      endDate: doc.endDate,
      active: doc.active,
      order: doc.order,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /** ადმინი: ყველა აქცია (ფილტრი ?active=true/false) */
  async findAll(active?: boolean): Promise<Record<string, unknown>[]> {
    const filter: { active?: boolean } = {};
    if (active !== undefined) filter.active = active;
    const list = (await this.promotionModel
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate('productIds')
      .lean()
      .exec()) as unknown as PromotionLean[];

    return list.map((p) => ({
      id: p._id?.toString() ?? p.id,
      name: p.name,
      description: p.description,
      backgroundColor: p.backgroundColor,
      logoUrl: p.logoUrl,
      productIds: (p.productIds || []).map(
        (x: PopulatedProduct) => x._id?.toString() ?? x.id,
      ),
      discountPercent: p.discountPercent,
      startDate: p.startDate,
      endDate: p.endDate,
      active: p.active,
      order: p.order,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async create(dto: CreatePromotionDto): Promise<Record<string, unknown>> {
    const payload: Record<string, unknown> = {
      name: dto.name,
      description: dto.description,
      backgroundColor: dto.backgroundColor ?? '#F5F5FF',
      logoUrl: dto.logoUrl,
      discountPercent: dto.discountPercent,
      active: dto.active ?? true,
      order: dto.order ?? 0,
    };
    if (dto.productIds?.length) {
      payload.productIds = dto.productIds;
    }
    if (dto.startDate) payload.startDate = new Date(dto.startDate);
    if (dto.endDate) payload.endDate = new Date(dto.endDate);
    const doc = await this.promotionModel.create(payload);
    const obj = doc.toObject ? doc.toObject() : doc;
    return {
      ...obj,
      id: (doc as { _id: { toString(): string } })._id?.toString(),
    };
  }

  async update(
    id: string,
    dto: UpdatePromotionDto,
  ): Promise<Record<string, unknown>> {
    const update: Record<string, unknown> = { ...dto };
    if (dto.startDate !== undefined)
      update.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      update.endDate = dto.endDate ? new Date(dto.endDate) : null;
    const doc = await this.promotionModel
      .findByIdAndUpdate(id, update, { new: true })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException(`Promotion ${id} not found`);
    const obj = doc as unknown as PromotionLean;
    return { ...obj, id: obj._id?.toString() ?? obj.id };
  }

  async remove(id: string): Promise<void> {
    const doc = await this.promotionModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Promotion ${id} not found`);
  }
}
