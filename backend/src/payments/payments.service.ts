import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import { Payment } from './payment.entity';
import { PaymentSettings } from './payment-settings.entity';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { Contract } from '../contracts/contract.entity';
import { ContractVersion } from '../contracts/contract-version.entity';
import { PaymentQuoteDto } from './dto/payment-quote.dto';
import { PaymentGatewayService } from './gateways/payment-gateway.service';
import { Invoice } from '../invoices/invoice.entity';
import { TenantProfile } from '../tenants/tenant-profile.entity';
import { User } from '../tenants/user.entity';
import { Account } from '../accounts/account.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../realtime/events.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(PaymentSettings)
    private readonly settingsRepo: Repository<PaymentSettings>,
    @InjectRepository(Contract)
    private readonly contractsRepo: Repository<Contract>,
    @InjectRepository(ContractVersion)
    private readonly versionsRepo: Repository<ContractVersion>,
    @InjectRepository(Invoice)
    private readonly invoicesRepo: Repository<Invoice>,
    @InjectRepository(TenantProfile)
    private readonly tenantsRepo: Repository<TenantProfile>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepo: Repository<Account>,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getSettings(accountId: number) {
    let settings = await this.settingsRepo.findOne({ where: { accountId } });
    if (!settings) {
      settings = this.settingsRepo.create({ accountId });
      settings = await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(accountId: number, dto: UpdatePaymentSettingsDto) {
    const settings = await this.getSettings(accountId);
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  async resolveTenantProfileId(accountId: number, userId: number) {
    const profile = await this.tenantsRepo.findOne({ where: { accountId, userId } });
    if (!profile) {
      throw new NotFoundException('Tenant profile not found for this login');
    }
    return profile.id;
  }

  async uploadProof(accountId: number, dto: CreatePaymentProofDto, proofPath?: string) {
    const reference = (dto.proofNote ?? dto.bankReference)?.trim();
    if (!proofPath && !reference) {
      throw new BadRequestException('Upload a proof file or enter a MoMo/bank reference message');
    }
    const settings = await this.getSettings(accountId);
    if (dto.method === 'BANK_TRANSFER' && !settings.enableBankTransferProof) {
      throw new BadRequestException('Bank transfer proof uploads are disabled by landlord');
    }
    if (dto.method === 'BANK_GATEWAY' && !settings.enableBankGateway) {
      throw new BadRequestException('Bank gateway payments are disabled by landlord');
    }
    if (dto.method === 'MTN_MOMO' && !settings.enableMtnMomo) {
      throw new BadRequestException('MTN mobile money is disabled by landlord');
    }
    if (dto.method === 'AIRTEL_MONEY' && !settings.enableAirtelMoney) {
      throw new BadRequestException('Airtel money is disabled by landlord');
    }
    if (dto.method === 'BANK_GATEWAY') {
      if (!dto.bankCode) {
        throw new BadRequestException('Bank code is required for bank gateway payments');
      }
      if (settings.enabledBankCodes?.length && !settings.enabledBankCodes.includes(dto.bankCode)) {
        throw new BadRequestException('Selected bank is not enabled by landlord');
      }
    }

    const quote = await this.generateQuote(accountId, {
      contractId: dto.contractId,
      tenantId: dto.tenantId,
      billingMonths: dto.billingMonths,
    });

    const payment = this.paymentsRepo.create({
      accountId,
      tenantId: quote.tenantId,
      contractId: dto.contractId,
      amountRwf: quote.totalAmountRwf,
      method: dto.method,
      status: dto.requestEbmReceipt ? 'RECEIPT_REQUESTED' : 'SUBMITTED',
      bankCode: dto.bankCode,
      bankReference: reference,
      proofPath: proofPath ?? undefined,
      billingMonths: quote.billingMonths,
      monthlyRateRwf: quote.monthlyRateRwf,
      receiptRequested: Boolean(dto.requestEbmReceipt),
    });
    return this.paymentsRepo.save(payment);
  }

  async generateQuote(accountId: number, dto: PaymentQuoteDto) {
    if (!dto.billingMonths?.length) {
      throw new BadRequestException('Select at least one month to pay');
    }
    const contract = await this.contractsRepo.findOne({
      where: { id: dto.contractId, accountId, status: 'ACTIVE', isApproved: true },
    });
    if (!contract) {
      throw new NotFoundException('Active contract not found');
    }
    if (dto.tenantId && contract.tenantId !== dto.tenantId) {
      throw new BadRequestException('Tenant does not match selected contract');
    }
    const version = await this.versionsRepo.findOne({
      where: { accountId, contractId: contract.id, versionNumber: contract.currentVersionNumber ?? 1 },
    });
    if (!version) {
      throw new NotFoundException('Contract pricing version not found');
    }
    if (version.paymentFrequency !== 'MONTHLY') {
      throw new BadRequestException('This payment selector currently supports monthly contracts only');
    }

    const uniqueMonths = [...new Set(dto.billingMonths)].sort();
    const monthlyRate = Number(version.rentAmountRwf);
    const total = monthlyRate * uniqueMonths.length;
    return {
      contractId: contract.id,
      tenantId: contract.tenantId,
      dueDayOfMonth: version.dueDayOfMonth,
      monthlyRateRwf: monthlyRate,
      billingMonths: uniqueMonths,
      totalAmountRwf: Number(total.toFixed(2)),
      reminderDate: this.getReminderDate(uniqueMonths[0], version.dueDayOfMonth, 10),
    };
  }

  async createGatewayIntent(
    accountId: number,
    dto: PaymentQuoteDto & { channel: 'BANK_GATEWAY' | 'MTN_MOMO' | 'AIRTEL_MONEY'; bankCode?: string },
  ) {
    const settings = await this.getSettings(accountId);
    if (dto.channel === 'BANK_GATEWAY' && !settings.enableBankGateway) {
      throw new BadRequestException('Bank gateway is disabled');
    }
    if (dto.channel === 'MTN_MOMO' && !settings.enableMtnMomo) {
      throw new BadRequestException('MTN mobile money is disabled');
    }
    if (dto.channel === 'AIRTEL_MONEY' && !settings.enableAirtelMoney) {
      throw new BadRequestException('Airtel money is disabled');
    }
    const quote = await this.generateQuote(accountId, dto);
    const intent = await this.paymentGatewayService.createIntent({
      amountRwf: quote.totalAmountRwf,
      channel: dto.channel,
      externalReference: `acct-${accountId}-contract-${quote.contractId}-${Date.now()}`,
      bankCode: dto.bankCode,
    });
    return { quote, intent };
  }

  async getUpcomingRentReminders(accountId: number) {
    const contracts = await this.contractsRepo.find({
      where: { accountId, status: 'ACTIVE', isApproved: true },
      order: { id: 'DESC' },
    });
    const now = new Date();
    const result: Array<{
      contractId: number;
      tenantId: number;
      dueDate: string;
      reminderDate: string;
      daysUntilDue: number;
    }> = [];

    for (const contract of contracts) {
      const version = await this.versionsRepo.findOne({
        where: { accountId, contractId: contract.id, versionNumber: contract.currentVersionNumber ?? 1 },
      });
      if (!version) continue;

      const dueDate = new Date(now.getFullYear(), now.getMonth(), version.dueDayOfMonth);
      if (dueDate < now) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 10);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      result.push({
        contractId: contract.id,
        tenantId: contract.tenantId,
        dueDate: dueDate.toISOString().slice(0, 10),
        reminderDate: reminderDate.toISOString().slice(0, 10),
        daysUntilDue,
      });
    }
    return result;
  }

  async generateUpcomingReminderInvoices(accountId: number) {
    const reminders = await this.getUpcomingRentReminders(accountId);
    const created: Array<{ invoiceId: number; tenantId: number; month: string }> = [];

    for (const reminder of reminders) {
      if (reminder.daysUntilDue !== 10) continue;
      const billingMonth = reminder.dueDate.slice(0, 7);

      const contract = await this.contractsRepo.findOne({
        where: { id: reminder.contractId, accountId, status: 'ACTIVE', isApproved: true },
      });
      if (!contract) continue;
      const version = await this.versionsRepo.findOne({
        where: { accountId, contractId: contract.id, versionNumber: contract.currentVersionNumber ?? 1 },
      });
      if (!version) continue;
      const account = await this.accountsRepo.findOne({ where: { id: accountId } });
      if (!account?.bankName || !account.bankAccountName || !account.bankAccountNumber) {
        throw new BadRequestException('Missing landlord bank details. Set account billing profile first.');
      }

      const exists = await this.invoicesRepo.findOne({
        where: { accountId, contractId: contract.id, tenantId: reminder.tenantId, billingMonth },
      });
      if (exists) continue;

      const base = Number(version.rentAmountRwf);
      const vatRate = account.vatEnabled ? Number(account.vatRatePercent ?? 18) : 0;
      const vatAmount = Number(((base * vatRate) / 100).toFixed(2));
      const total = Number((base + vatAmount).toFixed(2));

      const invoice = this.invoicesRepo.create({
        accountId,
        tenantId: reminder.tenantId,
        contractId: contract.id,
        billingMonth,
        dueDate: reminder.dueDate,
        baseAmountRwf: base,
        vatRatePercent: vatRate,
        vatAmountRwf: vatAmount,
        totalAmountRwf: total,
        status: 'PENDING',
      });
      const saved = await this.invoicesRepo.save(invoice);
      const pdfPath = await this.createInvoicePdf(saved.id, reminder.tenantId, account, saved);
      saved.pdfPath = pdfPath;
      await this.invoicesRepo.save(saved);
      await this.notifyTenantForInvoice(accountId, reminder.tenantId, saved);
      created.push({ invoiceId: saved.id, tenantId: reminder.tenantId, month: billingMonth });
    }

    return { createdCount: created.length, invoices: created };
  }

  async listInvoices(accountId: number, tenantId?: number) {
    return this.invoicesRepo.find({
      where: { accountId, ...(tenantId ? { tenantId } : {}) },
      order: { id: 'DESC' },
    });
  }

  async findInvoice(accountId: number, invoiceId: number) {
    const invoice = await this.invoicesRepo.findOne({ where: { id: invoiceId, accountId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async processProviderWebhook(
    payload: Record<string, unknown>,
    signature?: string,
    rawBody?: string,
  ) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (secret && signature && rawBody) {
      const crypto = await import('crypto');
      const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      const normalized = signature.replace(/^sha256=/, '');
      if (expected !== normalized && signature !== expected) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const providerReference =
      typeof payload.providerReference === 'string'
        ? payload.providerReference
        : typeof payload.externalReference === 'string'
          ? payload.externalReference
          : undefined;
    const status = typeof payload.status === 'string' ? payload.status.toUpperCase() : undefined;
    if (!providerReference || !status) {
      throw new BadRequestException('Invalid webhook payload');
    }

    const payment = await this.paymentsRepo.findOne({
      where: { bankReference: providerReference },
    });
    if (payment) {
      if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'APPROVED') {
        payment.status = 'APPROVED';
      } else if (status === 'FAILED' || status === 'REJECTED') {
        payment.status = 'REJECTED';
      }
      await this.paymentsRepo.save(payment);
    }

    return {
      accepted: true,
      providerReference,
      normalizedStatus: status,
      paymentUpdated: !!payment,
    };
  }

  async runReconciliation(accountId: number) {
    const pending = await this.paymentsRepo.find({
      where: { accountId, status: 'SUBMITTED' },
      order: { id: 'DESC' },
      take: 200,
    });
    return {
      scanned: pending.length,
      pendingPaymentIds: pending.map((item) => item.id),
      note: 'Reconciliation scanner ready. Plug bank/momo settlement API checks next.',
    };
  }

  async list(accountId: number, tenantId?: number) {
    return this.paymentsRepo.find({
      where: { accountId, ...(tenantId ? { tenantId } : {}) },
      order: { id: 'DESC' },
    });
  }

  async review(accountId: number, paymentId: number, dto: ReviewPaymentDto) {
    const payment = await this.findOne(accountId, paymentId);
    payment.status = dto.approve ? (payment.receiptRequested ? 'RECEIPT_REQUESTED' : 'APPROVED') : 'REJECTED';
    payment.landlordNote = dto.landlordNote;
    const saved = await this.paymentsRepo.save(payment);
    this.eventsGateway.emitPaymentUpdate(accountId, saved);
    return saved;
  }

  async submitPurchaseCode(accountId: number, paymentId: number, purchaseCode: string) {
    const payment = await this.findOne(accountId, paymentId);
    payment.rraPurchaseCode = purchaseCode;
    payment.status = 'RECEIPT_REQUESTED';
    payment.receiptRequested = true;
    return this.paymentsRepo.save(payment);
  }

  async markReceiptIssued(accountId: number, paymentId: number, receiptPath: string) {
    const payment = await this.findOne(accountId, paymentId);
    if (!payment.rraPurchaseCode) {
      throw new BadRequestException('RRA purchase code is required before issuing EBM receipt');
    }
    payment.ebmReceiptPath = receiptPath;
    payment.status = 'RECEIPT_ISSUED';
    return this.paymentsRepo.save(payment);
  }

  getRwandaCommercialBanks() {
    return [
      { code: 'BK', name: 'Bank of Kigali' },
      { code: 'BPR', name: 'BPR Bank Rwanda' },
      { code: 'EQUITY', name: 'Equity Bank Rwanda' },
      { code: 'I_AND_M', name: 'I&M Bank Rwanda' },
      { code: 'ECOBANK', name: 'Ecobank Rwanda' },
      { code: 'KCB', name: 'KCB Bank Rwanda' },
      { code: 'GTBANK', name: 'GT Bank Rwanda' },
      { code: 'NCBA', name: 'NCBA Rwanda' },
      { code: 'ACCESS', name: 'Access Bank Rwanda' },
    ];
  }

  async findOne(accountId: number, paymentId: number) {
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId, accountId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private getReminderDate(month: string, dueDay: number, daysBefore: number) {
    const [yearRaw, monthRaw] = month.split('-');
    const year = Number(yearRaw);
    const monthIdx = Number(monthRaw) - 1;
    const dueDate = new Date(year, monthIdx, dueDay);
    dueDate.setDate(dueDate.getDate() - daysBefore);
    return dueDate.toISOString().slice(0, 10);
  }

  private async notifyTenantForInvoice(accountId: number, tenantId: number, invoice: Invoice) {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId, accountId } });
    if (!tenant) return;
    const user = await this.usersRepo.findOne({ where: { id: tenant.userId, accountId } });
    if (!user) return;

    const text = `Invoice ${invoice.billingMonth}: base ${invoice.baseAmountRwf} RWF, VAT ${invoice.vatAmountRwf} RWF, total ${invoice.totalAmountRwf} RWF tax inclusive. Due on ${invoice.dueDate}. Please log in and download the invoice PDF with bank transfer details.`;
    await this.notificationsService.sendRentReminder({
      accountId,
      email: user.email,
      phone: tenant.phone,
      subject: `Rent Invoice Reminder ${invoice.billingMonth}`,
      message: text,
    });
  }

  private async createInvoicePdf(invoiceId: number, tenantId: number, account: Account, invoice: Invoice) {
    const dir = path.resolve('uploads/invoices');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `invoice-${invoiceId}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(20).text('Rent Invoice Reminder', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice Number: INV-${invoiceId}`);
    doc.text(`Tenant ID: ${tenantId}`);
    doc.text(`Billing Month: ${invoice.billingMonth}`);
    doc.text(`Due Date: ${invoice.dueDate}`);
    doc.text('Currency: RWF');
    doc.moveDown();
    doc.text(`Base Rent: ${Number(invoice.baseAmountRwf).toFixed(2)} RWF`);
    doc.text(`VAT (${Number(invoice.vatRatePercent).toFixed(2)}%): ${Number(invoice.vatAmountRwf).toFixed(2)} RWF`);
    doc.text(`Total Tax Inclusive: ${Number(invoice.totalAmountRwf).toFixed(2)} RWF`);
    doc.moveDown();
    doc.fontSize(13).text('Landlord Bank Details', { underline: true });
    doc.fontSize(12).text(`Bank Name: ${account.bankName ?? '-'}`);
    doc.text(`Account Name: ${account.bankAccountName ?? '-'}`);
    doc.text(`Account Number: ${account.bankAccountNumber ?? '-'}`);
    doc.text(`SWIFT Code: ${account.bankSwiftCode ?? '-'}`);
    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
    return filePath;
  }
}
