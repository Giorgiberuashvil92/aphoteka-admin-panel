import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BalanceProductsSyncService } from './balance-products-sync.service';

/** Railway/Nest — Balance → MongoDB ავტომატური სინქი (admin რექვესთები უცვლელია) */
@Injectable()
export class BalanceSyncScheduler {
  private readonly logger = new Logger(BalanceSyncScheduler.name);

  constructor(private readonly syncService: BalanceProductsSyncService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleBalanceProductsSync(): Promise<void> {
    if (!this.syncService.isSyncEnabled()) return;

    this.logger.log('[cron] Balance → MongoDB სინქრონიზაცია…');
    const result = await this.syncService.syncFromBalance();

    if (result.skipped) {
      this.logger.log(`[cron] გამოტოვებული: ${result.reason ?? 'skipped'}`);
      return;
    }
    if (!result.ok) {
      this.logger.warn(`[cron] ვერ მოხერხდა: ${result.error ?? 'unknown'}`);
      return;
    }
    this.logger.log(
      `[cron] OK — created=${result.created} updated=${result.updated} total=${result.total}`,
    );
  }
}
