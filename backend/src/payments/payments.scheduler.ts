import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

@Injectable()
export class PaymentsScheduler {
  private readonly logger = new Logger(PaymentsScheduler.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async runDailyInvoiceReminders() {
    // In production, iterate through all active accounts from a dedicated account service query.
    // This fallback supports a single-account deployment out of the box.
    const defaultAccountId = Number(process.env.DEFAULT_ACCOUNT_ID ?? 1);
    try {
      const result = await this.paymentsService.generateUpcomingReminderInvoices(defaultAccountId);
      this.logger.log(`Daily reminder run complete. Created: ${result.createdCount}`);
    } catch (error) {
      this.logger.error('Daily reminder run failed', error as Error);
    }
  }
}
