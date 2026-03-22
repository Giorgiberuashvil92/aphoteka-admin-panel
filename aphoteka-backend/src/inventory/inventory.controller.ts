import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query() params: any) {
    return this.inventoryService.findAll(params);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Post('receive')
  @HttpCode(HttpStatus.CREATED)
  receive(@Body() receiveDto: ReceiveInventoryDto) {
    return this.inventoryService.receive(receiveDto);
  }

  @Post('dispatch')
  @HttpCode(HttpStatus.CREATED)
  dispatch(@Body() dispatchDto: any) {
    return this.inventoryService.dispatch(dispatchDto);
  }

  @Post('adjust')
  @HttpCode(HttpStatus.CREATED)
  adjust(@Body() adjustmentDto: any) {
    return this.inventoryService.adjust(adjustmentDto);
  }

  @Get('adjustments')
  getAdjustments(@Query('inventoryId') inventoryId?: string) {
    return this.inventoryService.getAdjustments(inventoryId);
  }
}
