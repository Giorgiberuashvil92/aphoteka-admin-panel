import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HomeSectionDocument = HomeSection & Document;

/**
 * Built-in section types (for reference/backward compatibility)
 * Admin can create custom types dynamically
 */
export enum HomeSectionType {
  CATEGORY = 'category',
  DISCOUNTED = 'discounted',
  FAVORITES = 'favorites',
  ALL = 'all',
}

@Schema({ timestamps: true })
export class HomeSection {
  @Prop({ required: true })
  title: string;

  /**
   * Section type - can be built-in or custom
   * Examples: 'category', 'discounted', 'favorites', 'new-arrivals', 'top-rated', etc.
   */
  @Prop({ required: true })
  type: string;

  @Prop({ default: '' })
  categoryFilter: string;

  @Prop({ default: '' })
  searchQuery: string;

  @Prop({ required: true })
  order: number;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ default: 12 })
  limit: number;
}

export const HomeSectionSchema = SchemaFactory.createForClass(HomeSection);
