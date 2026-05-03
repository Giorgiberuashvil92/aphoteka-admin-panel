import { existsSync } from 'fs';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BOG_INLINE } from './config/bog-inline';
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

/**
 * BOG / OPAY (საქართველოს ბანკი) — OAuth: client_id + client_secret
 * სავაჭრო მონაცემები (მენეჯერი / ხელშეკრულება; REST-ზე ამ კოდში არ ვაგზავნით):
 * - Client INN: 404804636
 * - Merchant Name: NORIX.APP
 * - Merchant ID: 000000009812A3O
 * - Terminal ID: POS383EN
 * - OPAY CLIENT ID → BOG_CLIENT_ID_FIXED
 * - OPAY SECRET KEY → BOG_CLIENT_SECRET_FIXED
 * .env-დან BOG_CLIENT_ID / BOG_CLIENT_SECRET არ იკითხება.
 */
const BOG_CLIENT_ID_FIXED = '10006885';
const BOG_CLIENT_SECRET_FIXED = 'oWMbrG3wVBqS';

const bogConfig = registerAs('bog', () => {
  const publicBaseUrl =
    process.env.NEST_PUBLIC_URL?.trim().replace(/\/+$/, '') ||
    BOG_INLINE.publicBaseUrl.trim().replace(/\/+$/, '');
  const callbackUrlFull =
    process.env.BOG_CALLBACK_URL?.trim().replace(/\/+$/, '') ||
    BOG_INLINE.callbackUrlFull.trim().replace(/\/+$/, '');
  return {
    clientId: BOG_CLIENT_ID_FIXED,
    clientSecret: BOG_CLIENT_SECRET_FIXED,
    publicBaseUrl,
    callbackUrlFull,
  };
});

/** cwd = მონორეპოს ფესვი ან `aphoteka-backend` — ორივე ადგილას `.env` იპოვოს */
function balanceEnvFilePaths(): string[] {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, '.env'),
    join(cwd, 'aphoteka-backend', '.env'),
    join(__dirname, '..', '.env'),
  ];
  const unique = [...new Set(candidates.filter((p) => existsSync(p)))];
  return unique.length ? unique : ['.env'];
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: balanceEnvFilePaths(),
      ignoreEnvFile: false,
      load: [bogConfig],
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
