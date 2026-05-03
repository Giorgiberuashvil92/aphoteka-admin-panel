import { IsMongoId } from 'class-validator';

export class AssignWarehouseDto {
  @IsMongoId()
  warehouseId: string;
}
