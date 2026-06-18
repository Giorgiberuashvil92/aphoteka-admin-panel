import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QuickshipperService } from './quickshipper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type {
  DeliveryFeeRequest,
  CreateOrderRequest,
  DeliveryFeeResponse,
} from './interfaces/quickshipper.interface';

@Controller('quickshipper')
export class QuickshipperController {
  constructor(private readonly quickshipperService: QuickshipperService) {}

  /**
   * Calculate delivery fees (Public - for mobile app during checkout)
   */
  @Post('fees')
  async calculateFees(
    @Body() request: DeliveryFeeRequest,
  ): Promise<DeliveryFeeResponse> {
    try {
      return await this.quickshipperService.calculateDeliveryFee(request);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to calculate delivery fee',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Create delivery order (Admin only - when order status changes to "ready for delivery")
   */
  @Post('order')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() request: CreateOrderRequest) {
    try {
      return await this.quickshipperService.createOrder(request);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create delivery order',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get order status/tracking (Public - for users to track their orders)
   */
  @Get('order/status')
  async getOrderStatus(@Query('orderId') orderId: string) {
    if (!orderId) {
      throw new HttpException('Order ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.quickshipperService.getOrderStatus(orderId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get order status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
