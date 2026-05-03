import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { balanceSaleTestPutEnabled } from '../config/balance-sale-inline';
import { BogBalanceSaleService } from './bog-balance-sale.service';

@Controller('payments/bog')
export class BogBalanceSaleTestController {
  constructor(private readonly bogBalanceSale: BogBalanceSaleService) {}

  /**
   * გადახდის გარეშე — იგივე Sale PUT რაც BOG `completed`-ზე (არჩეული შეკვეთის მონაცემებით).
   * ჩართვა: `balance-sale-inline.ts` → `testPutEnabled: true` ან `BALANCE_SALE_TEST_PUT_ENABLED=1`.
   */
  @Post('test-balance-sale')
  @HttpCode(200)
  async testBalanceSale(@Body() body: { orderId?: string }) {
    if (!balanceSaleTestPutEnabled()) {
      throw new ForbiddenException(
        'test-balance-sale გამორთულია — balance-sale-inline.ts → testPutEnabled ან BALANCE_SALE_TEST_PUT_ENABLED=1',
      );
    }
    const id = body?.orderId?.trim();
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('body.orderId საჭიროა (Mongo ObjectId)');
    }
    return this.bogBalanceSale.testPutSaleToBalance(new Types.ObjectId(id));
  }
}
