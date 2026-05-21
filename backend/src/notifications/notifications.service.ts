import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { NotificationDelivery } from './notification-delivery.entity';

export type SendResult = { delivered: boolean; reason?: string; provider?: string };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(NotificationDelivery)
    private readonly deliveriesRepo: Repository<NotificationDelivery>,
  ) {}

  private getEmailTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return null;
    }
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  normalizeRwandaPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('250')) return `+${digits}`;
    if (digits.startsWith('0')) return `+250${digits.slice(1)}`;
    if (digits.length === 9) return `+250${digits}`;
    return phone.startsWith('+') ? phone : `+${digits}`;
  }

  detectMobileNetwork(phone: string): 'MTN' | 'AIRTEL' | 'UNKNOWN' {
    const normalized = this.normalizeRwandaPhone(phone);
    const local = normalized.replace('+250', '');
    const prefix = local.slice(0, 2);
    const mtn = ['78', '79', '72', '73'];
    const airtel = ['72', '73', '74', '75', '76', '77'];
    if (mtn.some((p) => local.startsWith(p))) return 'MTN';
    if (airtel.some((p) => local.startsWith(p))) return 'AIRTEL';
    return 'UNKNOWN';
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<SendResult> {
    const transporter = this.getEmailTransporter();
    if (!transporter) {
      return { delivered: false, reason: 'SMTP is not configured' };
    }
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to,
        subject,
        text,
        html: html ?? `<p>${text.replace(/\n/g, '<br/>')}</p>`,
      });
      return { delivered: true, provider: 'smtp' };
    } catch (e) {
      this.logger.error('SMTP send failed', e);
      return { delivered: false, reason: (e as Error).message };
    }
  }

  async sendSms(phone: string, message: string): Promise<SendResult> {
    const normalized = this.normalizeRwandaPhone(phone);

    if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const AfricasTalking = require('africastalking')({
          apiKey: process.env.AFRICASTALKING_API_KEY,
          username: process.env.AFRICASTALKING_USERNAME,
        });
        const result = await AfricasTalking.SMS.send({
          to: [normalized],
          message,
          from: process.env.AFRICASTALKING_SENDER_ID ?? undefined,
        });
        return { delivered: true, provider: 'africastalking', reason: JSON.stringify(result) };
      } catch (e) {
        this.logger.warn('Africa\'s Talking SMS failed', e);
      }
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_SMS_FROM) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const twilio = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );
        await twilio.messages.create({
          body: message,
          from: process.env.TWILIO_SMS_FROM,
          to: normalized,
        });
        return { delivered: true, provider: 'twilio' };
      } catch (e) {
        this.logger.warn('Twilio SMS failed', e);
        return { delivered: false, reason: (e as Error).message };
      }
    }

    return { delivered: false, reason: 'SMS provider not configured (Africa\'s Talking or Twilio)' };
  }

  async sendWhatsapp(phone: string, message: string): Promise<SendResult> {
    const normalized = this.normalizeRwandaPhone(phone);

    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const twilio = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        );
        await twilio.messages.create({
          body: message,
          from: process.env.TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${normalized}`,
        });
        return { delivered: true, provider: 'twilio-whatsapp' };
      } catch (e) {
        this.logger.warn('Twilio WhatsApp failed', e);
      }
    }

    if (process.env.WHATSAPP_WEBHOOK_URL) {
      const response = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WHATSAPP_WEBHOOK_SECRET
            ? { 'X-Webhook-Secret': process.env.WHATSAPP_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify({ phone: normalized, message }),
      });
      if (!response.ok) {
        return { delivered: false, reason: `Webhook error: ${response.status}` };
      }
      return { delivered: true, provider: 'webhook' };
    }

    return { delivered: false, reason: 'WhatsApp not configured (Twilio or WHATSAPP_WEBHOOK_URL)' };
  }

  /** Send on all configured channels for rent reminders */
  async sendRentReminder(params: {
    accountId: number;
    email?: string;
    phone?: string;
    subject: string;
    message: string;
  }) {
    const results: Record<string, SendResult> = {};
    if (params.email) {
      results.email = await this.sendEmail(params.email, params.subject, params.message);
      await this.logDelivery(params.accountId, 'EMAIL', params.email, params.subject, results.email);
    }
    if (params.phone) {
      const network = this.detectMobileNetwork(params.phone);
      results.sms = await this.sendSms(params.phone, params.message);
      await this.logDelivery(params.accountId, 'SMS', params.phone, params.subject, results.sms, {
        network,
      });
      results.whatsapp = await this.sendWhatsapp(params.phone, params.message);
      await this.logDelivery(
        params.accountId,
        'WHATSAPP',
        params.phone,
        params.subject,
        results.whatsapp,
      );
    }
    return results;
  }

  async scheduleDelivery(
    accountId: number,
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP',
    recipient: string,
    subject: string,
    message: string,
    scheduledAt: Date,
    metadata?: Record<string, unknown>,
  ) {
    return this.deliveriesRepo.save(
      this.deliveriesRepo.create({
        accountId,
        channel,
        recipient,
        subject,
        status: 'PENDING',
        scheduledAt,
        metadata: { ...metadata, message },
      }),
    );
  }

  async processDueDeliveries() {
    const due = await this.deliveriesRepo.find({
      where: { status: 'PENDING', scheduledAt: LessThanOrEqual(new Date()) },
      take: 100,
      order: { scheduledAt: 'ASC' },
    });

    let sent = 0;
    let failed = 0;

    for (const job of due) {
      const message = (job.metadata?.message as string) ?? job.subject ?? '';
      let result: SendResult = { delivered: false, reason: 'Unknown channel' };

      if (job.channel === 'EMAIL') {
        result = await this.sendEmail(job.recipient, job.subject ?? 'Broadway PM', message);
      } else if (job.channel === 'SMS') {
        result = await this.sendSms(job.recipient, message);
      } else if (job.channel === 'WHATSAPP') {
        result = await this.sendWhatsapp(job.recipient, message);
      }

      job.status = result.delivered ? 'SENT' : 'FAILED';
      job.sentAt = result.delivered ? new Date() : undefined;
      job.errorMessage = result.reason;
      await this.deliveriesRepo.save(job);
      if (result.delivered) sent++;
      else failed++;
    }

    return { processed: due.length, sent, failed };
  }

  private async logDelivery(
    accountId: number,
    channel: 'EMAIL' | 'SMS' | 'WHATSAPP',
    recipient: string,
    subject: string,
    result: SendResult,
    metadata?: Record<string, unknown>,
  ) {
    await this.deliveriesRepo.save(
      this.deliveriesRepo.create({
        accountId,
        channel,
        recipient,
        subject,
        status: result.delivered ? 'SENT' : 'FAILED',
        scheduledAt: new Date(),
        sentAt: result.delivered ? new Date() : undefined,
        errorMessage: result.reason,
        metadata,
      }),
    );
  }
}
