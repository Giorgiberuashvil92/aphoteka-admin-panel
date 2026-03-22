/**
 * Seed script – ბაზაში სატესტო მონაცემების ჩასმა.
 * გაშვება: npm run seed
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { connect, connection, model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  ProductGroup,
  ProductGroupSchema,
  ProductVariant,
  ProductVariantSchema,
  ProductStrength,
  ProductStrengthSchema,
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';
import {
  Warehouse,
  WarehouseSchema,
  WarehouseEmployee,
  WarehouseEmployeeSchema,
} from '../warehouses/schemas/warehouse.schema';
import {
  User,
  UserSchema,
  UserRole,
  UserPermission,
} from '../users/schemas/user.schema';
import {
  Inventory,
  InventorySchema,
  InventoryState,
} from '../inventory/schemas/inventory.schema';
import {
  Promotion,
  PromotionSchema,
} from '../promotions/schemas/promotion.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  `mongodb+srv://Giorgiberuashvili92:Berobero1@aphoteka.kitkuk2.mongodb.net/aphoteka_db?retryWrites=true&w=majority&appName=aphoteka`;
async function seed() {
  console.log('Connecting to MongoDB...');
  await connect(MONGODB_URI);

  const ProductGroupModel = model(ProductGroup.name, ProductGroupSchema);
  const ProductVariantModel = model(ProductVariant.name, ProductVariantSchema);
  const ProductStrengthModel = model(
    ProductStrength.name,
    ProductStrengthSchema,
  );
  const ProductModel = model(Product.name, ProductSchema);
  const PromotionModel = model(Promotion.name, PromotionSchema);
  const CategoryModel = model(Category.name, CategorySchema);
  const WarehouseModel = model(Warehouse.name, WarehouseSchema);
  model(WarehouseEmployee.name, WarehouseEmployeeSchema); // register schema
  const UserModel = model(User.name, UserSchema);
  const InventoryModel = model(Inventory.name, InventorySchema);

  const countProducts = await ProductModel.countDocuments();
  const countUsers = await UserModel.countDocuments();
  if (countProducts > 0 || countUsers > 0) {
    console.log(
      'Found existing data (products or users). Skipping seed to avoid duplicates. Delete collections manually if you want a fresh seed.',
    );
    await connection.close();
    process.exit(0);
    return;
  }

  console.log('Seeding ProductGroup...');
  const group1 = await ProductGroupModel.create({
    genericName: 'პარაცეტამოლი',
    description: 'ცხელსაწინააღმდეგო, ტკივილგამაყუჩებელი',
    category: 'OTC',
    active: true,
  });
  const group2 = await ProductGroupModel.create({
    genericName: 'იბუპროფენი',
    description: 'ანთების საწინააღმდეგო, ტკივილგამაყუჩებელი',
    category: 'OTC',
    active: true,
  });
  const group3 = await ProductGroupModel.create({
    genericName: 'ამოქსიცილინი',
    description: 'ანტიბიოტიკი',
    category: 'Rx',
    active: true,
  });

  console.log('Seeding ProductVariant...');
  const variant1 = await ProductVariantModel.create({
    productGroupId: group1._id,
    countryOfOrigin: 'საქართველო',
    manufacturer: 'ფარმადეფი',
    active: true,
  });
  const variant2 = await ProductVariantModel.create({
    productGroupId: group1._id,
    countryOfOrigin: 'თურქეთი',
    manufacturer: 'Generic Pharma',
    active: true,
  });
  const variant3 = await ProductVariantModel.create({
    productGroupId: group2._id,
    countryOfOrigin: 'საქართველო',
    manufacturer: 'Aversi',
    active: true,
  });
  const variant4 = await ProductVariantModel.create({
    productGroupId: group3._id,
    countryOfOrigin: 'ინდოეთი',
    manufacturer: 'Sun Pharma',
    active: true,
  });

  console.log('Seeding ProductStrength...');
  const strength1 = await ProductStrengthModel.create({
    productVariantId: variant1._id,
    strength: '500mg',
    dosageForm: 'ტაბლეტი',
    active: true,
  });
  const strength2 = await ProductStrengthModel.create({
    productVariantId: variant2._id,
    strength: '500mg',
    dosageForm: 'ტაბლეტი',
    active: true,
  });
  const strength3 = await ProductStrengthModel.create({
    productVariantId: variant3._id,
    strength: '200mg',
    dosageForm: 'ტაბლეტი',
    active: true,
  });
  const strength4 = await ProductStrengthModel.create({
    productVariantId: variant4._id,
    strength: '500mg',
    dosageForm: 'კაფსული',
    active: true,
  });

  console.log('Seeding Product...');
  const createdProducts = await ProductModel.create([
    {
      productStrengthId: strength1._id,
      name: 'პარაცეტამოლი ფარმადეფი 500მგ',
      description: 'ცხელსაწინააღმდეგო ტაბლეტი',
      price: 3.5,
      active: true,
      category: 'OTC',
      sku: 'PAR-FAR-500-001',
      barcode: '5449000000016',
      packSize: '20 ცალი',
      unitOfMeasure: 'ცალი',
      genericName: 'პარაცეტამოლი',
      countryOfOrigin: 'საქართველო',
      manufacturer: 'ფარმადეფი',
      strength: '500mg',
      dosageForm: 'ტაბლეტი',
    },
    {
      productStrengthId: strength2._id,
      name: 'პარაცეტამოლი Generic 500მგ',
      description: 'ცხელსაწინააღმდეგო',
      price: 2.8,
      active: true,
      category: 'OTC',
      sku: 'PAR-GEN-500-002',
      barcode: '5449000000023',
      packSize: '10 ცალი',
      unitOfMeasure: 'ცალი',
      genericName: 'პარაცეტამოლი',
      countryOfOrigin: 'თურქეთი',
      manufacturer: 'Generic Pharma',
      strength: '500mg',
      dosageForm: 'ტაბლეტი',
    },
    {
      productStrengthId: strength3._id,
      name: 'ნუროფენი 200მგ',
      description: 'ტკივილგამაყუჩებელი',
      price: 5.0,
      active: true,
      category: 'OTC',
      sku: 'IBU-AVR-200-003',
      barcode: '5449000000030',
      packSize: '20 ცალი',
      unitOfMeasure: 'ცალი',
      genericName: 'იბუპროფენი',
      countryOfOrigin: 'საქართველო',
      manufacturer: 'Aversi',
      strength: '200mg',
      dosageForm: 'ტაბლეტი',
    },
    {
      productStrengthId: strength4._id,
      name: 'ამოქსიცილინი 500მგ კაფსული',
      description: 'ანტიბიოტიკი',
      price: 8.0,
      active: true,
      category: 'Rx',
      sku: 'AMX-SUN-500-004',
      barcode: '5449000000047',
      packSize: '16 ცალი',
      unitOfMeasure: 'ცალი',
      genericName: 'ამოქსიცილინი',
      countryOfOrigin: 'ინდოეთი',
      manufacturer: 'Sun Pharma',
      strength: '500mg',
      dosageForm: 'კაფსული',
    },
  ]);
  const productIds = createdProducts.map((p) => p._id);

  console.log('Seeding Warehouse...');
  const wh1 = await WarehouseModel.create({
    name: 'თბილისი - ცენტრალური საწყობი',
    address: 'ქ. თბილისი, ვაჟა-ფშაველას 33',
    city: 'თბილისი',
    phoneNumber: '+995 32 2 123 456',
    email: 'warehouse.tbilisi@aphoteka.ge',
    active: true,
  });
  const wh2 = await WarehouseModel.create({
    name: 'ბათუმი - საწყობი',
    address: 'ქ. ბათუმი, რუსთაველის 15',
    city: 'ბათუმი',
    phoneNumber: '+995 422 123 456',
    email: 'warehouse.batumi@aphoteka.ge',
    active: true,
  });

  const hashedPassword = await bcrypt.hash('Test123!', 10);
  const adminPermissions = Object.values(UserPermission);

  console.log('Seeding User...');
  await UserModel.create([
    {
      role: UserRole.ADMIN,
      phoneNumber: '+995555111222',
      email: 'admin@aphoteka.ge',
      password: hashedPassword,
      fullName: 'ადმინისტრატორი',
      status: 'active',
      permissions: adminPermissions,
    },
    {
      role: UserRole.OPERATIONS,
      phoneNumber: '+995555333444',
      email: 'operations@aphoteka.ge',
      password: hashedPassword,
      fullName: 'ოპერაციების მენეჯერი',
      warehouseId: wh1._id,
      status: 'active',
      permissions: [
        UserPermission.VIEW_PRODUCTS,
        UserPermission.CREATE_PRODUCTS,
        UserPermission.EDIT_PRODUCTS,
        UserPermission.VIEW_INVENTORY,
        UserPermission.MANAGE_INVENTORY,
        UserPermission.RECEIVE_INVENTORY,
        UserPermission.DISPATCH_INVENTORY,
        UserPermission.VIEW_WAREHOUSES,
        UserPermission.VIEW_ORDERS,
        UserPermission.MANAGE_ORDERS,
      ],
    },
    {
      role: UserRole.DELIVERY,
      phoneNumber: '+995555555666',
      email: 'delivery@aphoteka.ge',
      password: hashedPassword,
      fullName: 'მიწოდების თანამშრომელი',
      warehouseId: wh1._id,
      status: 'active',
      permissions: [
        UserPermission.VIEW_PRODUCTS,
        UserPermission.VIEW_INVENTORY,
        UserPermission.DISPATCH_INVENTORY,
        UserPermission.VIEW_ORDERS,
      ],
    },
  ]);

  console.log('Seeding Inventory...');
  const now = new Date();
  const expiry1 = new Date(now);
  expiry1.setFullYear(expiry1.getFullYear() + 1);
  const expiry2 = new Date(now);
  expiry2.setMonth(expiry2.getMonth() + 6);

  await InventoryModel.create([
    {
      productId: productIds[0],
      warehouseId: wh1._id,
      batchNumber: 'BATCH-2025-001',
      expiryDate: expiry1,
      quantity: 500,
      availableQuantity: 500,
      reservedQuantity: 0,
      state: InventoryState.AVAILABLE,
      warehouseLocation: 'A-01-01',
      receivedDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      supplier: 'ფარმადეფი',
    },
    {
      productId: productIds[1],
      warehouseId: wh1._id,
      batchNumber: 'BATCH-2025-002',
      expiryDate: expiry2,
      quantity: 200,
      availableQuantity: 200,
      reservedQuantity: 0,
      state: InventoryState.AVAILABLE,
      warehouseLocation: 'A-01-02',
      receivedDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      supplier: 'Generic Pharma',
    },
    {
      productId: productIds[2],
      warehouseId: wh1._id,
      batchNumber: 'BATCH-2025-003',
      expiryDate: expiry1,
      quantity: 300,
      availableQuantity: 300,
      reservedQuantity: 0,
      state: InventoryState.AVAILABLE,
      warehouseLocation: 'A-02-01',
      receivedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      supplier: 'Aversi',
    },
    {
      productId: productIds[0],
      warehouseId: wh2._id,
      batchNumber: 'BATCH-2025-004',
      expiryDate: expiry1,
      quantity: 150,
      availableQuantity: 150,
      reservedQuantity: 0,
      state: InventoryState.AVAILABLE,
      warehouseLocation: 'B-01-01',
      receivedDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      supplier: 'ფარმადეფი',
    },
  ]);

  console.log('Seeding Categories...');
  await CategoryModel.create([
    { name: 'OTC', description: 'Over the counter', sortOrder: 0, active: true, color: '#E8F5E9', icon: 'medkit' },
    { name: 'Rx', description: 'რეცეპტური', sortOrder: 1, active: true, color: '#E3F2FD', icon: 'document-text' },
    { name: 'ვიტამინები და დანამატები', description: 'ვიტამინები და მინერალები', sortOrder: 2, active: true, color: '#FFF3E0', icon: 'nutrition' },
  ]);

  console.log('Seeding Promotions (აქციები მობილურისთვის)...');
  await PromotionModel.create([
    {
      name: 'სპეციალური შეთავაზება',
      description: 'სპეციალური შეთავაზება ყველა პროდუქტზე',
      backgroundColor: '#F5F5FF',
      productIds: [productIds[0], productIds[1], productIds[2], productIds[3]],
      discountPercent: 30,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      active: true,
      order: 0,
    },
    {
      name: 'ვიტამინები და დანამატები',
      description: 'ვიტამინები და დანამატები ფასდაკლებით',
      backgroundColor: '#EBEBFF',
      productIds: [productIds[1], productIds[2], productIds[3], productIds[0]],
      discountPercent: 25,
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      active: true,
      order: 1,
    },
  ]);

  console.log('Seed completed successfully.');
  console.log('Test users (password for all: Test123!):');
  console.log('  Admin:      +995555111222');
  console.log('  Operations: +995555333444');
  console.log('  Delivery:   +995555555666');
  await connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
