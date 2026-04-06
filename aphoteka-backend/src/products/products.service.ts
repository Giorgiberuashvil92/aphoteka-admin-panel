import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { BulkCreateProductDto } from './dto/bulk-create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
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

  async findAll(query: QueryProductDto) {
    const { page = 1, limit = 100, search, category, active } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (active !== undefined) {
      filter.active = active;
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

  /** პროდუქტების რაოდენობა კატეგორიის სახელის მიხედვით */
  async countByCategoryName(categoryName: string): Promise<number> {
    return this.productModel.countDocuments({ category: categoryName, active: true }).exec();
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

    return {
      ...productObj,
      genericName: productObj.genericName ?? group?.genericName,
      countryOfOrigin: variant?.countryOfOrigin ?? productObj.countryOfOrigin,
      manufacturer: variant?.manufacturer ?? productObj.manufacturer,
      strength: strength?.strength ?? productObj.strength,
      dosageForm: strength?.dosageForm ?? productObj.dosageForm,
    };
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
