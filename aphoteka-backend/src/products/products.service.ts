import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { BulkCreateProductDto } from './dto/bulk-create-product.dto';
import { BalanceExchangeService } from '../balance/balance-exchange.service';
import {
  buildDiscountMapsFromBalanceApi,
  enrichProductsWithBalanceDiscounts,
} from './balance-discounts-merge.util';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    private readonly balanceExchange: BalanceExchangeService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = new this.productModel(createProductDto);
    return await product.save();
  }

  async bulkCreate(createProductDtos: BulkCreateProductDto[]) {
    try {
      // Bulk insert with ordered: false to continue on errors
      const result = await this.productModel.insertMany(createProductDtos, {
        ordered: false, // Continue inserting even if some fail
      });

      return {
        success: result.length,
        failed: 0,
        total: createProductDtos.length,
        data: result,
      };
    } catch (error: any) {
      // Handle duplicate key errors and other errors
      const inserted = error.insertedDocs || [];
      const failed = createProductDtos.length - inserted.length;

      return {
        success: inserted.length,
        failed: failed,
        total: createProductDtos.length,
        data: inserted,
        errors: error.writeErrors?.map((err: any) => ({
          index: err.index,
          message: err.errmsg,
        })),
      };
    }
  }

  /** სიასა და ერთ ჩანაწერზე — ცოცხალი Balance Discounts, თუ env/credentials საშუალებას იძლევა */
  private async applyBalanceDiscountEnrichment(
    rows: Record<string, unknown>[],
  ): Promise<void> {
    try {
      const discRaw = await this.balanceExchange.tryFetchExchangeDiscounts();
      if (discRaw != null) {
        const maps = buildDiscountMapsFromBalanceApi(discRaw);
        enrichProductsWithBalanceDiscounts(rows, maps);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `[Products] Balance Discounts enrich გამოტოვებულია: ${msg}`,
      );
    }
  }

  async findAll(query: QueryProductDto) {
    const {
      page = 1,
      limit = 100,
      search,
      category,
      subcategory,
      active,
      filters,
      minPrice,
      maxPrice,
    } = query;

    const filter: Record<string, unknown> = {};

    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = { $regex: escaped, $options: 'i' };
      filter.$or = [
        { name: rx },
        { description: rx },
        { sku: rx },
        { genericName: rx },
        { productNameBrand: rx },
        { manufacturer: rx },
        { activeIngredients: rx },
        { barcode: rx },
        { productCode: rx },
      ];
    }

    if (category) {
      const categoryOr = [
        { mainCategory: category },
        { mainCategory: { $in: [null, ''] }, category },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: categoryOr }];
        delete filter.$or;
      } else {
        filter.$or = categoryOr;
      }
    }

    if (subcategory?.trim()) {
      const parts = subcategory
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length === 1) {
        filter.subcategory = parts[0];
      } else if (parts.length > 1) {
        filter.subcategory = { $in: parts };
      }
    }

    if (active !== undefined) {
      filter.active = active;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) {
        (filter.price as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (filter.price as Record<string, number>).$lte = maxPrice;
      }
    }

    if (filters?.trim()) {
      try {
        const parsed = JSON.parse(filters) as Record<
          string,
          string | string[] | boolean | number
        >;
        const attrFilters: Record<string, unknown>[] = [];
        for (const [key, value] of Object.entries(parsed)) {
          if (value === undefined || value === null || value === '') continue;
          if (Array.isArray(value)) {
            if (value.length === 0) continue;
            attrFilters.push({ [`filterValues.${key}`]: { $in: value } });
          } else {
            attrFilters.push({ [`filterValues.${key}`]: value });
          }
        }
        if (attrFilters.length > 0) {
          if (filter.$and) {
            (filter.$and as unknown[]).push(...attrFilters);
          } else if (filter.$or) {
            filter.$and = [{ $or: filter.$or }, ...attrFilters];
            delete filter.$or;
          } else {
            filter.$and = attrFilters;
          }
        }
      } catch {
        /* ignore invalid JSON */
      }
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate({
          path: 'productStrength',
          populate: {
            path: 'productVariant',
            populate: {
              path: 'productGroup',
            },
          },
        })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    // Populate computed fields
    const productsWithComputedFields = data.map((product) => {
      const productObj = product.toObject();
      const strength = productObj.productStrength;
      const variant = strength?.productVariant;
      const group = variant?.productGroup;

      return {
        ...productObj,
        /** ადმინში პროდუქტზე ჩაწერილი genericName უპირატესია hierarchy-ზე */
        genericName: productObj.genericName ?? group?.genericName,
        countryOfOrigin: variant?.countryOfOrigin ?? productObj.countryOfOrigin,
        manufacturer: variant?.manufacturer ?? productObj.manufacturer,
        strength: strength?.strength ?? productObj.strength,
        dosageForm: strength?.dosageForm ?? productObj.dosageForm,
      };
    });

    await this.applyBalanceDiscountEnrichment(
      productsWithComputedFields as Record<string, unknown>[],
    );

    return {
      data: productsWithComputedFields,
      total,
      page,
      limit,
    };
  }

  /** მობილური აპი: კატეგორიების სია (უნიკალური product.category) — ლეგაცია; მობილური იყენებს GET /categories */
  async getCategories(): Promise<{ id: string; name: string }[]> {
    const categories = await this.productModel
      .distinct('category', { active: true })
      .exec();
    const filtered = categories.filter(Boolean);
    return filtered
      .sort()
      .map((name, index) => ({ id: String(index + 1), name }));
  }

  /** პროდუქტების რაოდენობა მთავარი კატეგორიის მიხედვით */
  async countByMainCategoryName(categoryName: string): Promise<number> {
    return this.productModel
      .countDocuments({
        active: true,
        $or: [
          { mainCategory: categoryName },
          {
            mainCategory: { $in: [null, ''] },
            category: categoryName,
          },
        ],
      })
      .exec();
  }

  /** @deprecated use countByMainCategoryName */
  async countByCategoryName(categoryName: string): Promise<number> {
    return this.countByMainCategoryName(categoryName);
  }

  /** პროდუქტების რაოდენობა საბკატეგორიის მიხედვით */
  async countBySubcategoryName(
    mainCategoryName: string,
    subcategoryName: string,
  ): Promise<number> {
    return this.productModel
      .countDocuments({
        active: true,
        subcategory: subcategoryName,
        $or: [
          { mainCategory: mainCategoryName },
          {
            mainCategory: { $in: [null, ''] },
            category: mainCategoryName,
          },
        ],
      })
      .exec();
  }

  /** მობილური: კატეგორიის Therapeutic Class-ები */
  async getSubcategoriesByCategoryName(
    categoryName: string,
  ): Promise<{ id: string; name: string }[]> {
    const [fromTherapeuticClass, fromLegacySubcategory] = await Promise.all([
      this.productModel
        .distinct('category', {
          mainCategory: categoryName,
          active: true,
          category: { $exists: true, $nin: [null, ''] },
        })
        .exec(),
      this.productModel
        .distinct('subcategory', {
          category: categoryName,
          active: true,
          subcategory: { $exists: true, $nin: [null, ''] },
        })
        .exec(),
    ]);

    const names = new Set<string>();
    for (const value of [...fromTherapeuticClass, ...fromLegacySubcategory]) {
      if (typeof value === 'string' && value.trim()) {
        names.add(value.trim());
      }
    }

    return [...names]
      .sort((a, b) => a.localeCompare(b, 'ka'))
      .map((name) => ({ id: name, name }));
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .populate({
        path: 'productStrength',
        populate: {
          path: 'productVariant',
          populate: {
            path: 'productGroup',
          },
        },
      })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const productObj = product.toObject();
    const strength = productObj.productStrength;
    const variant = strength?.productVariant;
    const group = variant?.productGroup;

    const row = {
      ...productObj,
      genericName: productObj.genericName ?? group?.genericName,
      countryOfOrigin: variant?.countryOfOrigin ?? productObj.countryOfOrigin,
      manufacturer: variant?.manufacturer ?? productObj.manufacturer,
      strength: strength?.strength ?? productObj.strength,
      dosageForm: strength?.dosageForm ?? productObj.dosageForm,
    };
    await this.applyBalanceDiscountEnrichment([row as Record<string, unknown>]);
    return row;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // Convert date strings to Date objects if provided
    const updateData: any = { ...updateProductDto };
    if (
      updateData.activationDate &&
      typeof updateData.activationDate === 'string'
    ) {
      updateData.activationDate = new Date(updateData.activationDate);
    }
    if (
      updateData.transportStartDate &&
      typeof updateData.transportStartDate === 'string'
    ) {
      updateData.transportStartDate = new Date(updateData.transportStartDate);
    }
    if (updateData.expiryDate && typeof updateData.expiryDate === 'string') {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate({
        path: 'productStrength',
        populate: {
          path: 'productVariant',
          populate: {
            path: 'productGroup',
          },
        },
      })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Populate computed fields (same as findOne)
    const productObj = product.toObject();
    const strength = productObj.productStrength;
    const variant = strength?.productVariant;
    const group = variant?.productGroup;

    return {
      ...productObj,
      genericName: productObj.genericName ?? group?.genericName,
      countryOfOrigin: variant?.countryOfOrigin || productObj.countryOfOrigin,
      manufacturer: variant?.manufacturer || productObj.manufacturer,
      strength: strength?.strength || productObj.strength,
      dosageForm: strength?.dosageForm || productObj.dosageForm,
    };
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async toggleStatus(id: string) {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    product.active = !product.active;
    return await product.save();
  }
}
