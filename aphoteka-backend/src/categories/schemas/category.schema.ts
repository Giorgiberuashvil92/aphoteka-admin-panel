import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId?: Types.ObjectId | null;

  @Prop({ default: '#E8F5E9' })
  color?: string;

  @Prop({ default: 'folder' })
  icon?: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

const transformId = (doc: any, ret: any) => {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

CategorySchema.set('toJSON', { transform: transformId });
CategorySchema.set('toObject', { transform: transformId });
