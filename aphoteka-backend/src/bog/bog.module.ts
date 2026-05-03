import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BalanceModule } from '../balance/balance.module';
import { BuyersModule } from '../buyers/buyers.module';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  Warehouse,
  WarehouseSchema,
} from '../warehouses/schemas/warehouse.schema';
import { BogPaymentsService } from './bog-payments.service';
import { BogBalanceSaleTestController } from './bog-balance-sale-test.controller';
import { BogCallbackController } from './bog-callback.controller';
import { BogBalanceSaleService } from './bog-balance-sale.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
    ]),
    BalanceModule,
    BuyersModule,
  ],
  controllers: [BogCallbackController, BogBalanceSaleTestController],
  providers: [BogPaymentsService, BogBalanceSaleService],
  exports: [BogPaymentsService, BogBalanceSaleService],
})
export class BogModule {}
