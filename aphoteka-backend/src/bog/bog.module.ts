import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { BogPaymentsService } from './bog-payments.service';
import { BogCallbackController } from './bog-callback.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [BogCallbackController],
  providers: [BogPaymentsService],
  exports: [BogPaymentsService],
})
export class BogModule {}
