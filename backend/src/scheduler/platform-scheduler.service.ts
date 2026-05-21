import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class PlatformSchedulerService {
  private readonly logger = new Logger(PlatformSchedulerService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountsRepo: Repository<Account>,
    private readonly paymentsService: PaymentsService,
  ) {}

  /** Daily 6:00 AM Africa/Kigali — run rent reminders for every active landlord account */
  @Cron('0 6 * * *', { timeZone: 'Africa/Kigali' })
  async runDailyRentRemindersAllAccounts() {
    const accounts = await this.accountsRepo.find({
      where: { isActive: true, activationStatus: 'ACTIVE', kind: 'LANDLORD' },
    });

    let totalCreated = 0;
    let errors = 0;

    for (const account of accounts) {
      try {
        const result = await this.paymentsService.generateUpcomingReminderInvoices(account.id);
        totalCreated += result.createdCount;
      } catch (e) {
        errors++;
        this.logger.warn(`Reminders failed for account ${account.id}: ${(e as Error).message}`);
      }
    }

    this.logger.log(
      `Daily reminders: ${accounts.length} accounts, ${totalCreated} invoices, ${errors} errors`,
    );
  }

  /** Hourly catch-up for accounts that missed the daily window */
  @Cron(CronExpression.EVERY_HOUR)
  async runHourlyReminderCatchUp() {
    const accounts = await this.accountsRepo.find({
      where: { isActive: true, activationStatus: 'ACTIVE', kind: 'LANDLORD' },
    });

    for (const account of accounts) {
      try {
        await this.paymentsService.generateUpcomingReminderInvoices(account.id);
      } catch {
        // skip accounts missing bank profile
      }
    }
  }
}
