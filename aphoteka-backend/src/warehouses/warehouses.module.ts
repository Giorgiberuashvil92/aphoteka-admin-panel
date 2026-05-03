import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import {
  Warehouse,
  WarehouseSchema,
  WarehouseEmployee,
  WarehouseEmployeeSchema,
} from './schemas/warehouse.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: WarehouseEmployee.name, schema: WarehouseEmployeeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
