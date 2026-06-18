import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FilterFieldDocument = HydratedDocument<FilterField>;

export type FilterFieldType = 'select' | 'multi' | 'boolean' | 'range';

@Schema({ timestamps: true })
export class FilterField {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true, enum: ['select', 'multi', 'boolean', 'range'] })
  type: FilterFieldType;

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: '' })
  description?: string;
}

export const FilterFieldSchema = SchemaFactory.createForClass(FilterField);

const transformId = (doc: any, ret: any) => {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
};

FilterFieldSchema.set('toJSON', { transform: transformId });
FilterFieldSchema.set('toObject', { transform: transformId });
