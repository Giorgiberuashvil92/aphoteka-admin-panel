import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HomeCategoryCardDocument = HomeCategoryCard & Document;

@Schema({ timestamps: true })
export class HomeCategoryCard {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  subtitle: string;

  @Prop({ default: '#EAF7FF' })
  backgroundColor: string;

  /** Ionicons name ან 'pills' (აგენტის კასტომური აიქონი) */
  @Prop({ default: 'pills' })
  iconKey: string;

  @Prop({ default: '' })
  iconUrl: string;

  @Prop({ default: '#24B7B4' })
  iconColor: string;

  /** კატეგორია, რომელშიც გადავა ბარათზე დაჭერისას */
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true, default: 1 })
  order: number;

  @Prop({ default: true })
  isVisible: boolean;
}

export const HomeCategoryCardSchema =
  SchemaFactory.createForClass(HomeCategoryCard);
