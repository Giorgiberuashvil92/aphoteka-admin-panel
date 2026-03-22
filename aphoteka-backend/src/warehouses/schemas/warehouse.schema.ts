import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WarehouseDocument = HydratedDocument<Warehouse>;
export type WarehouseEmployeeDocument = HydratedDocument<WarehouseEmployee>;

export enum WarehouseEmployeeRole {
  MANAGER = 'manager',
  WAREHOUSE_KEEPER = 'warehouse_keeper',
  PICKER = 'picker',
  DISPATCHER = 'dispatcher',
  RECEIVER = 'receiver',
}

@Schema({ timestamps: true })
export class Warehouse {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  email?: string;

  @Prop()
  managerId?: string;

  @Prop({ default: true })
  active: boolean;
}

export const WarehouseSchema = SchemaFactory.createForClass(Warehouse);

// Transform _id to id for both JSON and Object responses
WarehouseSchema.set('toJSON', { 
  transform: (doc: any, ret: any) => { 
    ret.id = ret._id?.toString(); 
    delete ret._id; 
    delete ret.__v; 
    return ret; 
  } 
});
WarehouseSchema.set('toObject', { 
  transform: (doc: any, ret: any) => { 
    ret.id = ret._id?.toString(); 
    delete ret._id; 
    delete ret.__v; 
    return ret; 
  } 
});

@Schema({ timestamps: true })
export class WarehouseEmployee {
  @Prop({ type: Types.ObjectId, ref: 'Warehouse', required: true })
  warehouseId: Types.ObjectId;

  @Prop({ required: true })
  userId: string;

  @Prop({
    type: String,
    enum: WarehouseEmployeeRole,
    required: true,
  })
  role: WarehouseEmployeeRole;

  @Prop({ default: true })
  active: boolean;

  @Prop({ required: true, type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  endedAt?: Date;
}

export const WarehouseEmployeeSchema = SchemaFactory.createForClass(WarehouseEmployee);

// Transform _id to id for both JSON and Object responses
WarehouseEmployeeSchema.set('toJSON', { 
  transform: (doc: any, ret: any) => { 
    ret.id = ret._id?.toString(); 
    delete ret._id; 
    delete ret.__v; 
    return ret; 
  } 
});
WarehouseEmployeeSchema.set('toObject', { 
  transform: (doc: any, ret: any) => { 
    ret.id = ret._id?.toString(); 
    delete ret._id; 
    delete ret.__v; 
    return ret; 
  } 
});
