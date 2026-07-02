import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Buyer, BuyerSchema } from '../buyers/schemas/buyer.schema';
import {
  WarehouseEmployee,
  WarehouseEmployeeSchema,
} from '../warehouses/schemas/warehouse.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Buyer.name, schema: BuyerSchema },
      { name: WarehouseEmployee.name, schema: WarehouseEmployeeSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
