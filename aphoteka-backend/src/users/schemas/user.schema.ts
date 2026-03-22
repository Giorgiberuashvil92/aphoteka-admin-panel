import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  CONSUMER = 'consumer',
  OPERATIONS = 'operations',
  DELIVERY = 'delivery',
  ADMIN = 'admin',
}

export enum UserPermission {
  // Product permissions
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',

  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  RECEIVE_INVENTORY = 'receive_inventory',
  DISPATCH_INVENTORY = 'dispatch_inventory',

  // Warehouse permissions
  VIEW_WAREHOUSES = 'view_warehouses',
  MANAGE_WAREHOUSES = 'manage_warehouses',

  // User permissions
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',

  // Order permissions
  VIEW_ORDERS = 'view_orders',
  MANAGE_ORDERS = 'manage_orders',

  // Reports permissions
  VIEW_REPORTS = 'view_reports',

  // Admin permissions
  ADMIN_ACCESS = 'admin_access',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    enum: UserRole,
    required: true,
  })
  role: UserRole;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop()
  email?: string;

  @Prop()
  password?: string; // Hashed password for authentication

  @Prop()
  fullName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Warehouse' })
  warehouseId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: 'active' | 'inactive' | 'suspended';

  @Prop({
    type: [String],
    enum: UserPermission,
    default: [],
  })
  permissions: UserPermission[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Transform _id to id for both JSON and Object responses
const transformId = (doc: any, ret: any) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

UserSchema.set('toJSON', {
  transform: transformId,
});

UserSchema.set('toObject', {
  transform: transformId,
});
