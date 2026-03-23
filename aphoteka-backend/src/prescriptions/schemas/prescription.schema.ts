import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PrescriptionDocument = HydratedDocument<Prescription>;

@Schema({ _id: false })
export class PrescriptionLine {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop()
  notes?: string;
}

export const PrescriptionLineSchema =
  SchemaFactory.createForClass(PrescriptionLine);

@Schema({ timestamps: true })
export class Prescription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ required: true })
  patientEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  prescribedByUserId?: Types.ObjectId;

  @Prop({ type: [PrescriptionLineSchema], required: true })
  items: PrescriptionLine[];
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);

const transformId = (doc: any, ret: any) => {
  ret.id = ret._id?.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

PrescriptionSchema.set('toJSON', { transform: transformId });
PrescriptionSchema.set('toObject', { transform: transformId });
