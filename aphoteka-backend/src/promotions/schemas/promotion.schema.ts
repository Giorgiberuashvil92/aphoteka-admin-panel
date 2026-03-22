import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: '#F5F5FF' })
  backgroundColor: string;

  @Prop()
  logoUrl?: string;

  /** პროდუქტების ID-ები რომლებიც ამ აქციაში მონაწილეობენ */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  productIds: Types.ObjectId[];

  /** ფასდაკლების პროცენტი (0–100) */
  @Prop({ required: true, type: Number, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ default: true })
  active: boolean;

  /** სორტირების რიგი (მცირე = უფრო ზემოთ) */
  @Prop({ default: 0 })
  order: number;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

const transformId = (doc: any, ret: any) => {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

PromotionSchema.set('toJSON', { transform: transformId });
PromotionSchema.set('toObject', { transform: transformId });
