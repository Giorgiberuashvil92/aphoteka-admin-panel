import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VerificationOtpDocument = HydratedDocument<VerificationOtp>;

@Schema({ timestamps: true, collection: 'verification_otps' })
export class VerificationOtp {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ['register', 'forgot'] })
  purpose: 'register' | 'forgot';

  /** Mongo TTL — ვადაგასული ჩანაწერები ავტომატურად იშლება */
  @Prop({ required: true, expires: 0 })
  expiresAt: Date;
}

export const VerificationOtpSchema =
  SchemaFactory.createForClass(VerificationOtp);
