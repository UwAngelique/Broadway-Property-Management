import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  async sendEmail(to: string, subject: string, text: string) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { delivered: false, reason: 'SMTP is not configured' };
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return { delivered: true };
  }

  async sendWhatsapp(phone: string, message: string) {
    if (!process.env.WHATSAPP_WEBHOOK_URL) {
      return { delivered: false, reason: 'WhatsApp webhook is not configured' };
    }
    const response = await fetch(process.env.WHATSAPP_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        message,
      }),
    });
    if (!response.ok) {
      return { delivered: false, reason: `Webhook error: ${response.status}` };
    }
    return { delivered: true };
  }
}
