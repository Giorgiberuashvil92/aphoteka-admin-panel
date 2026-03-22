import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    private productsService: ProductsService,
  ) {}

  /** მობილური: აქტიური კატეგორიები productCount-ით */
  async findForMobile(): Promise<
    {
      id: string;
      name: string;
      productCount: number;
      color?: string;
      icon?: string;
    }[]
  > {
    const list = await this.categoryModel
      .find({ active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
    const result = await Promise.all(
      list.map(async (c: any) => ({
        id: c._id?.toString() ?? c.id,
        name: c.name,
        productCount: await this.productsService.countByCategoryName(c.name),
        color: c.color,
        icon: c.icon,
      })),
    );
    return result;
  }

  /** ადმინი: ყველა კატეგორია (პროდუქტების რაოდენობით) */
  async findAll(active?: boolean): Promise<
    {
      id: string;
      name: string;
      description?: string;
      parentId?: string;
      color?: string;
      icon?: string;
      active: boolean;
      sortOrder: number;
      productCount: number;
    }[]
  > {
    const filter: { active?: boolean } = {};
    if (active !== undefined) filter.active = active;
    const list = await this.categoryModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
    const result = await Promise.all(
      list.map(async (c: any) => ({
        id: c._id?.toString() ?? c.id,
        name: c.name,
        description: c.description,
        parentId: c.parentId?.toString?.() ?? c.parentId,
        color: c.color,
        icon: c.icon,
        active: c.active ?? true,
        sortOrder: c.sortOrder ?? 0,
        productCount: await this.productsService.countByCategoryName(c.name),
      })),
    );
    return result;
  }

  async findOne(id: string) {
    const doc = await this.categoryModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException(`Category ${id} not found`);
    const c = doc as any;
    return {
      id: c._id?.toString() ?? c.id,
      name: c.name,
      description: c.description,
      parentId: c.parentId?.toString?.() ?? c.parentId,
      color: c.color,
      icon: c.icon,
      active: c.active ?? true,
      sortOrder: c.sortOrder ?? 0,
      productCount: await this.productsService.countByCategoryName(c.name),
    };
  }

  async create(dto: CreateCategoryDto) {
    const payload: any = {
      name: dto.name,
      description: dto.description,
      color: dto.color ?? '#E8F5E9',
      icon: dto.icon ?? 'folder',
      active: dto.active ?? true,
      sortOrder: dto.sortOrder ?? 0,
    };
    if (dto.parentId) payload.parentId = dto.parentId;
    const doc = await this.categoryModel.create(payload);
    const c = doc.toObject ? doc.toObject() : doc;
    return { ...c, id: (doc as any)._id?.toString() };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const doc = await this.categoryModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean()
      .exec();
    if (!doc) throw new NotFoundException(`Category ${id} not found`);
    const c = doc as any;
    return { ...c, id: c._id?.toString() ?? c.id };
  }

  async remove(id: string) {
    const doc = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException(`Category ${id} not found`);
  }
}
