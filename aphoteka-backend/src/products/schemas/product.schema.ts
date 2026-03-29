import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;
export type ProductGroupDocument = HydratedDocument<ProductGroup>;
export type ProductVariantDocument = HydratedDocument<ProductVariant>;
export type ProductStrengthDocument = HydratedDocument<ProductStrength>;

// ProductGroup - იერარქიის ზედა დონე (Generic Name)
@Schema({ timestamps: true })
export class ProductGroup {
  @Prop({ required: true })
  genericName: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop({ default: true })
  active: boolean;
}

export const ProductGroupSchema = SchemaFactory.createForClass(ProductGroup);
ProductGroupSchema.set('toJSON', { transform: (doc: any, ret: any) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; return ret; } });
ProductGroupSchema.set('toObject', { transform: (doc: any, ret: any) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; return ret; } });

// ProductVariant - იერარქიის მეორე დონე (Generic + Country)
@Schema({ timestamps: true })
export class ProductVariant {
  @Prop({ type: Types.ObjectId, ref: 'ProductGroup', required: true })
  productGroupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductGroup' })
  productGroup?: ProductGroup;

  @Prop({ required: true })
  countryOfOrigin: string;

  @Prop()
  manufacturer?: string;

  @Prop({ default: true })
  active: boolean;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
ProductVariantSchema.set('toJSON', { transform: (doc: any, ret: any) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; return ret; } });
ProductVariantSchema.set('toObject', { transform: (doc: any, ret: any) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; return ret; } });

// ProductStrength - იერარქიის მესამე დონე (Generic + Country + Strength)
@Schema({ timestamps: true })
export class ProductStrength {
  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true })
  productVariantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  productVariant?: ProductVariant;

  @Prop({ required: true })
  strength: string;

  @Prop({ required: true })
  dosageForm: string;

  @Prop({ default: true })
  active: boolean;
}

export const ProductStrengthSchema = SchemaFactory.createForClass(ProductStrength);
ProductStrengthSchema.set('toJSON', { transform: (doc: any, ret: any) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; return ret; } });
ProductStrengthSchema.set('toObject', { transform: (doc: any, ret: any) => { ret.id = ret._id?.toString(); delete ret._id; delete ret.__v; return ret; } });

// Product Entity - იერარქიის ქვედა დონე (კონკრეტული პროდუქტი)
@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'ProductStrength' })
  productStrengthId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductStrength' })
  productStrength?: ProductStrength;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ default: true })
  active: boolean;

  @Prop()
  category?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop()
  packSize?: string;

  @Prop({ unique: true, sparse: true })
  barcode?: string;

  @Prop()
  unitOfMeasure?: string;

  // Computed/denormalized fields for easy access (from hierarchy)
  @Prop()
  genericName?: string;

  @Prop()
  countryOfOrigin?: string;

  @Prop()
  manufacturer?: string;

  @Prop()
  strength?: string;

  @Prop()
  dosageForm?: string;

  // Excel/Invoice additional fields
  @Prop()
  productCode?: string; // საქონლის კოდი

  @Prop({ type: Number })
  quantity?: number; // რაოდენობა (Balance Exchange/Stocks ჯამი)

  @Prop({ type: Number })
  reservedQuantity?: number; // დარეზერვებული (Balance Reserve ჯამი)

  @Prop({
    type: [
      {
        balanceWarehouseUuid: { type: String, required: true },
        balanceBranchUuid: { type: String },
        balanceWarehouseName: { type: String },
        quantity: { type: Number, required: true },
        reserve: { type: Number, required: true },
        seriesUuid: { type: String },
      },
    ],
  })
  balanceStockBreakdown?: Array<{
    balanceWarehouseUuid: string;
    balanceBranchUuid?: string;
    balanceWarehouseName?: string;
    quantity: number;
    reserve: number;
    seriesUuid?: string;
  }>;

  @Prop({
    type: [
      {
        seriesNumber: { type: String },
        seriesUuid: { type: String },
        quantity: { type: Number },
        expiryDate: { type: String },
        warehouseUuid: { type: String },
      },
    ],
  })
  balanceItemSeries?: Array<{
    seriesNumber?: string;
    seriesUuid?: string;
    quantity?: number;
    expiryDate?: string;
    warehouseUuid?: string;
  }>;

  @Prop({ type: Number })
  totalPrice?: number; // საქონლის ფასი (quantity * price)

  @Prop()
  taxation?: string; // დაბეგვრა

  @Prop()
  invoiceNumber?: string; // ზედნადების ნომერი

  @Prop()
  buyer?: string; // მყიდველი

  @Prop()
  seller?: string; // გამყიდველი

  @Prop({ type: Date })
  activationDate?: Date; // გააქტიურების თარიღი

  @Prop({ type: Date })
  transportStartDate?: Date; // ტრანსპორტირების დაწყების თარიღი

  @Prop()
  certificateNumber?: string; // ფირნიშის ან ცნობის ნომერი

  @Prop()
  documentNumber?: string; // დოკუმენტის N

  @Prop()
  serialNumber?: string; // სერიის ნომერი

  @Prop({ type: Date })
  expiryDate?: Date; // ვარგისიანობის ვადა

  @Prop()
  packagingType?: string; // შეფუთვის სახეობა

  @Prop()
  productNameBrand?: string; // Product name (brand)
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Transform _id to id for both JSON and Object responses
const transformId = (doc: any, ret: any) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

ProductSchema.set('toJSON', {
  transform: transformId,
});

ProductSchema.set('toObject', {
  transform: transformId,
});
