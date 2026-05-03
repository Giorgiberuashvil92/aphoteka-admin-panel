import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
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

@Module({
  imports: [
    BalanceModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: ProductStrength.name, schema: ProductStrengthSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
