import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  unitPrice: number;

  @Prop({ required: true, type: Number })
  totalPrice: number;

  @Prop()
  imageUrl?: string;

  @Prop()
  packSize?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, type: Number })
  totalAmount: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop()
  shippingAddress?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  comment?: string;

  /** საქართველოს ბანკის ონლაინ გადახდის order_id (UUID) */
  @Prop()
  bogOrderId?: string;

  /** BOG receipt-ის order_status.key (მაგ. completed, rejected) */
  @Prop()
  bogPaymentStatus?: string;

  /** ბოლო BOG server-to-server callback-ის დრო */
  @Prop({ type: Date })
  bogLastCallbackAt?: Date;

  /**
   * ბოლო callback-ის სრული JSON (event + body) — აუდიტი/დებაგი.
   * redirect (ბრაუზერი) ცალკეა; ეს არის ბანკის POST callback.
   */
  @Prop({ type: MongooseSchema.Types.Mixed })
  bogLastCallbackRaw?: Record<string, unknown>;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.set('toJSON', {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
