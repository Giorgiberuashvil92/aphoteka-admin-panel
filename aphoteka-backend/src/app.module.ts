import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DEFAULT_MONGODB_URI } from './config/default-mongodb-uri';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PromotionsModule } from './promotions/promotions.module';
import { CategoriesModule } from './categories/categories.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: false, // Enable .env file reading
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || DEFAULT_MONGODB_URI),
    ProductsModule,
    InventoryModule,
    WarehousesModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    PromotionsModule,
    CategoriesModule,
    PrescriptionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
