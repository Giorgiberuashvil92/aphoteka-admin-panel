import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { BalanceProductsSyncService } from './balance-products-sync.service';
import { BalanceSyncScheduler } from './balance-sync.scheduler';
import {
  Product,
  ProductSchema,
  ProductGroup,
  ProductGroupSchema,
  ProductVariant,
  ProductVariantSchema,
  ProductStrength,
  ProductStrengthSchema,
} from './schemas/product.schema';
import { BalanceModule } from '../balance/balance.module';
import { Category, CategorySchema } from '../categories/schemas/category.schema';

@Module({
  imports: [
    BalanceModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: ProductStrength.name, schema: ProductStrengthSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    BalanceProductsSyncService,
    BalanceSyncScheduler,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
