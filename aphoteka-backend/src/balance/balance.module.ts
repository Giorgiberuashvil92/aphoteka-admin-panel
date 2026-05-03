import { Module } from '@nestjs/common';
import { BalanceExchangeService } from './balance-exchange.service';

@Module({
  providers: [BalanceExchangeService],
  exports: [BalanceExchangeService],
})
export class BalanceModule {}
