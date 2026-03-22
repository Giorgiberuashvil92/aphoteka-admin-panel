import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateOrderDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.create(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMyOrders(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.findAllByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.findOne(id, userId);
  }
}
