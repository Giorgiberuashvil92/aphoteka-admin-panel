import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SectionTypeDocument = SectionType & Document;

@Schema({ timestamps: true })
export class SectionType {
  @Prop({ required: true, unique: true })
  key: string; // 'new-arrivals', 'bestsellers', etc.

  @Prop({ required: true })
  label: string; // 'ახალი პროდუქტები', 'ბესტსელერები', etc.

  @Prop({ default: '' })
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isBuiltIn: boolean; // Built-in types cannot be deleted
}

export const SectionTypeSchema = SchemaFactory.createForClass(SectionType);
