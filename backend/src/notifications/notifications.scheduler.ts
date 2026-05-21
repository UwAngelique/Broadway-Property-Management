import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /** Every 5 minutes — process queued SMS/email/WhatsApp */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processNotificationQueue() {
    try {
      const result = await this.notificationsService.processDueDeliveries();
      if (result.processed > 0) {
        this.logger.log(
          `Notification queue: ${result.processed} processed, ${result.sent} sent, ${result.failed} failed`,
        );
      }
    } catch (e) {
      this.logger.error('Notification queue failed', e);
    }
  }
}
