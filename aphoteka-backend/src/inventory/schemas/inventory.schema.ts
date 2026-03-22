import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;
export type InventoryAdjustmentDocument = HydratedDocument<InventoryAdjustment>;

export enum InventoryState {
  RECEIVED_BLOCKED = 'received_blocked',
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  PICKED = 'picked',
  DISPATCHED = 'dispatched',
  CONSUMED = 'consumed',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Inventory {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId: Types.ObjectId;

  @Prop({ required: true })
  batchNumber: string;

  @Prop({ required: true, type: Date })
  expiryDate: Date;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ type: Number, default: 0 })
  availableQuantity: number;

  @Prop({ type: Number, default: 0 })
  reservedQuantity: number;

  @Prop({
    type: String,
    enum: InventoryState,
    default: InventoryState.AVAILABLE,
  })
  state: InventoryState;

  @Prop()
  warehouseLocation?: string;

  @Prop({ required: true, type: Date })
  receivedDate: Date;

  @Prop()
  supplier?: string;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);

// Transform _id to id for both JSON and Object responses
InventorySchema.set('toJSON', {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
InventorySchema.set('toObject', {
  transform: (doc: any, ret: any) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

@Schema({ timestamps: true })
export class InventoryAdjustment {
  @Prop({ type: Types.ObjectId, ref: 'Inventory', required: true })
  inventoryId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['damage', 'theft', 'expiry_writeoff', 'cycle_count', 'other'],
    required: true,
  })
  adjustmentType:
    | 'damage'
    | 'theft'
    | 'expiry_writeoff'
    | 'cycle_count'
    | 'other';

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  authorizedBy: string;
}

export const InventoryAdjustmentSchema =
  SchemaFactory.createForClass(InventoryAdjustment);
