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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Warehouse.name, schema: WarehouseSchema },
      { name: WarehouseEmployee.name, schema: WarehouseEmployeeSchema },
    ]),
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
