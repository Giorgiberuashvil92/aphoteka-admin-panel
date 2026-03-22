import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory, InventorySchema, InventoryAdjustment, InventoryAdjustmentSchema } from './schemas/inventory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryAdjustment.name, schema: InventoryAdjustmentSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
