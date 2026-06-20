import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  private rootFilter() {
    return {
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    };
  }

  /** მობილური/ვები: მხოლოდ მთავარი კატეგორიები */
  async findForMobile(): Promise<
    {
      id: string;
      name: string;
      productCount: number;
      color?: string;
      icon?: string;
      imageUrl?: string;
    }[]
  > {
    const list = await this.categoryModel
      .find({ active: true, ...this.rootFilter() })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();

    const result = await Promise.all(
      list.map(async (c: any) => ({
        id: c._id?.toString() ?? c.id,
        name: c.name,
        productCount: await this.productsService.countByMainCategoryName(c.name),
        color: c.color,
        icon: c.icon,
        imageUrl: c.imageUrl,
      })),
    );
    return result;
  }

  /** მობილური/ვები: კატეგორიის საბკატეგორიები (Category.parentId) */
  async findSubcategories(
    parentId: string,
  ): Promise<{ id: string; name: string; productCount: number }[]> {
    const parent = await this.categoryModel.findById(parentId).lean().exec();
    if (!parent) throw new NotFoundException(`Category ${parentId} not found`);

    const list = await this.categoryModel
      .find({ active: true, parentId: new Types.ObjectId(parentId) })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();

    return Promise.all(
      list.map(async (c: any) => ({
        id: c._id?.toString() ?? c.id,
        name: c.name,
        productCount: await this.productsService.countBySubcategoryName(
          parent.name,
          c.name,
        ),
      })),
    );
  }

  /** ადმინი: კატეგორიები (?active=, ?parentId=, ?root=true) */
  async findAll(
    active?: boolean,
    parentId?: string,
    rootOnly?: boolean,
  ): Promise<
    {
      id: string;
      name: string;
      description?: string;
      parentId?: string;
      color?: string;
      icon?: string;
      imageUrl?: string;
      active: boolean;
      sortOrder: number;
      productCount: number;
    }[]
  > {
    const filter: Record<string, unknown> = {};
    if (active !== undefined) filter.active = active;
    if (rootOnly) {
      Object.assign(filter, this.rootFilter());
    } else if (parentId) {
      filter.parentId = new Types.ObjectId(parentId);
    }

    const list = await this.categoryModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();

    const result = await Promise.all(
      list.map(async (c: any) => {
        const parentName = c.parentId
          ? (
              await this.categoryModel
                .findById(c.parentId)
                .lean()
                .exec()
            )?.name
          : undefined;

        const productCount = parentName
          ? await this.productsService.countBySubcategoryName(
              parentName,
              c.name,
            )
          : await this.productsService.countByMainCategoryName(c.name);

        return {
          id: c._id?.toString() ?? c.id,
          name: c.name,
          description: c.description,
          parentId: c.parentId?.toString?.() ?? c.parentId,
          color: c.color,
          icon: c.icon,
          imageUrl: c.imageUrl,
          active: c.active ?? true,
          sortOrder: c.sortOrder ?? 0,
          productCount,
        };
      }),
    );
    return result;
  }

  async findOne(id: string) {
    const doc = await this.categoryModel.findById(id).lean().exec();
    if (!doc) throw new NotFoundException(`Category ${id} not found`);
    const c = doc as any;

    let productCount = 0;
    if (c.parentId) {
      const parent = await this.categoryModel.findById(c.parentId).lean().exec();
      if (parent) {
        productCount = await this.productsService.countBySubcategoryName(
          parent.name,
          c.name,
        );
      }
    } else {
      productCount = await this.productsService.countByMainCategoryName(c.name);
    }

    return {
      id: c._id?.toString() ?? c.id,
      name: c.name,
      description: c.description,
      parentId: c.parentId?.toString?.() ?? c.parentId,
      color: c.color,
      icon: c.icon,
      imageUrl: c.imageUrl,
      active: c.active ?? true,
      sortOrder: c.sortOrder ?? 0,
      productCount,
    };
  }

  async create(dto: CreateCategoryDto) {
    const payload: any = {
      name: dto.name,
      description: dto.description,
      color: dto.color ?? '#E8F5E9',
      icon: dto.icon ?? 'folder',
      imageUrl: dto.imageUrl,
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
