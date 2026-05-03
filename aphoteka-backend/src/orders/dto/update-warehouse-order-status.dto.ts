import { IsEnum } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateWarehouseOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
