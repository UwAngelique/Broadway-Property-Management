import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
import { ReviewPaymentDto } from './dto/review-payment.dto';
import { SubmitRraPurchaseCodeDto } from './dto/submit-rra-purchase-code.dto';
import { AuditService } from '../audit/audit.service';
import { PaymentQuoteDto } from './dto/payment-quote.dto';
import { Public } from '../auth/public.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('settings')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  getSettings(@CurrentUser() user: JwtUserPayload) {
    return this.paymentsService.getSettings(user.accountId);
  }

  @Patch('settings')
  @Roles('OWNER')
  updateSettings(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdatePaymentSettingsDto, @Req() req: Request) {
    return this.paymentsService.updateSettings(user.accountId, dto).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'EDIT',
        resourceType: 'PAYMENT_SETTINGS',
        resourceId: String(result.id),
        details: 'Updated payment methods configuration',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Get('banks/rwanda-commercial')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  getRwandaBanks() {
    return this.paymentsService.getRwandaCommercialBanks();
  }

  @Get('rent-reminders/upcoming')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  getUpcomingRentReminders(@CurrentUser() user: JwtUserPayload) {
    return this.paymentsService.getUpcomingRentReminders(user.accountId);
  }

  @Post('rent-reminders/run')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  runRentReminderInvoices(@CurrentUser() user: JwtUserPayload, @Req() req: Request) {
    return this.paymentsService.generateUpcomingReminderInvoices(user.accountId).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: 'CREATE',
        resourceType: 'INVOICE',
        resourceId: `batch:${result.createdCount}`,
        details: 'Generated reminder invoices and dispatched notifications',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Post('quote')
  @Roles('TENANT', 'OWNER', 'LAWYER', 'ACCOUNTANT')
  async quote(@Body() dto: PaymentQuoteDto, @CurrentUser() user: JwtUserPayload, @Req() req: Request) {
    const tenantId =
      user.role === 'TENANT'
        ? await this.paymentsService.resolveTenantProfileId(user.accountId, user.sub)
        : dto.tenantId;
    return this.paymentsService
      .generateQuote(user.accountId, { ...dto, tenantId })
      .then(async (result) => {
        await this.auditService.log({
          accountId: user.accountId,
          userId: user.sub,
          userEmail: user.email,
          userRole: user.role,
          action: 'VIEW',
          resourceType: 'PAYMENT_QUOTE',
          resourceId: `${result.contractId}:${result.billingMonths.join(',')}`,
          details: 'Generated contract-driven payment quote',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        return result;
      });
  }

  @Post('gateway-intent')
  @Roles('TENANT', 'OWNER', 'LAWYER', 'ACCOUNTANT')
  async createGatewayIntent(
    @Body() dto: PaymentQuoteDto & { channel: 'BANK_GATEWAY' | 'MTN_MOMO' | 'AIRTEL_MONEY'; bankCode?: string },
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    const tenantId =
      user.role === 'TENANT'
        ? await this.paymentsService.resolveTenantProfileId(user.accountId, user.sub)
        : dto.tenantId;
    return this.paymentsService
      .createGatewayIntent(user.accountId, { ...dto, tenantId })
      .then(async (result) => {
        await this.auditService.log({
          accountId: user.accountId,
          userId: user.sub,
          userEmail: user.email,
          userRole: user.role,
          action: 'CREATE',
          resourceType: 'PAYMENT_GATEWAY_INTENT',
          resourceId: result.intent.providerReference,
          details: `Created gateway intent for channel ${dto.channel}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        return result;
      });
  }

  @Post('proofs')
  @Roles('TENANT', 'OWNER', 'LAWYER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/payments',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `payment-proof-${unique}${path.extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadPaymentProof(
    @Body() body: Record<string, string>,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    const billingMonths = Array.isArray(body.billingMonths)
      ? body.billingMonths
      : typeof body.billingMonths === 'string'
        ? body.billingMonths.split(',').map((m) => m.trim()).filter(Boolean)
        : [];
    const dto: CreatePaymentProofDto = {
      contractId: Number(body.contractId),
      billingMonths,
      method: body.method as CreatePaymentProofDto['method'],
      bankCode: body.bankCode,
      bankReference: body.bankReference,
      proofNote: body.proofNote,
      requestEbmReceipt: String(body.requestEbmReceipt) === 'true' || body.requestEbmReceipt === '1',
      tenantId: body.tenantId ? Number(body.tenantId) : undefined,
    };
    const tenantId =
      user.role === 'TENANT'
        ? await this.paymentsService.resolveTenantProfileId(user.accountId, user.sub)
        : dto.tenantId;
    return this.paymentsService
      .uploadProof(user.accountId, { ...dto, tenantId }, file?.path)
      .then(async (result) => {
        await this.auditService.log({
          accountId: user.accountId,
          userId: user.sub,
          userEmail: user.email,
          userRole: user.role,
          action: 'UPLOAD',
          resourceType: 'PAYMENT_PROOF',
          resourceId: String(result.id),
          details: `Uploaded payment proof (method=${result.method})`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        return result;
      });
  }

  @Get()
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  async list(@CurrentUser() user: JwtUserPayload, @Query('tenantId') tenantId?: string) {
    const scopedTenantId =
      user.role === 'TENANT'
        ? await this.paymentsService.resolveTenantProfileId(user.accountId, user.sub)
        : tenantId
          ? Number(tenantId)
          : undefined;
    return this.paymentsService.list(user.accountId, scopedTenantId);
  }

  @Get('invoices')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  async listInvoices(@CurrentUser() user: JwtUserPayload, @Query('tenantId') tenantId?: string) {
    const scopedTenantId =
      user.role === 'TENANT'
        ? await this.paymentsService.resolveTenantProfileId(user.accountId, user.sub)
        : tenantId
          ? Number(tenantId)
          : undefined;
    return this.paymentsService.listInvoices(user.accountId, scopedTenantId);
  }

  @Get('invoices/:invoiceId/download')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  async downloadInvoice(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    const invoice = await this.paymentsService.findInvoice(user.accountId, Number(invoiceId));
    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      throw new NotFoundException('Invoice PDF not found');
    }
    await this.auditService.log({
      accountId: user.accountId,
      userId: user.sub,
      userEmail: user.email,
      userRole: user.role,
      action: 'DOWNLOAD',
      resourceType: 'INVOICE',
      resourceId: invoiceId,
      details: `Downloaded invoice PDF ${invoiceId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return new StreamableFile(fs.createReadStream(invoice.pdfPath));
  }

  @Patch(':paymentId/review')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  review(
    @Param('paymentId') paymentId: string,
    @Body() dto: ReviewPaymentDto,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    return this.paymentsService.review(user.accountId, Number(paymentId), dto).then(async (result) => {
      await this.auditService.log({
        accountId: user.accountId,
        userId: user.sub,
        userEmail: user.email,
        userRole: user.role,
        action: dto.approve ? 'APPROVE' : 'EDIT',
        resourceType: 'PAYMENT',
        resourceId: paymentId,
        details: dto.approve ? 'Payment approved after review' : 'Payment rejected after review',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    });
  }

  @Patch(':paymentId/rra-purchase-code')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  submitPurchaseCode(
    @Param('paymentId') paymentId: string,
    @Body() dto: SubmitRraPurchaseCodeDto,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    return this.paymentsService
      .submitPurchaseCode(user.accountId, Number(paymentId), dto.rraPurchaseCode)
      .then(async (result) => {
        await this.auditService.log({
          accountId: user.accountId,
          userId: user.sub,
          userEmail: user.email,
          userRole: user.role,
          action: 'EDIT',
          resourceType: 'PAYMENT',
          resourceId: paymentId,
          details: 'Submitted RRA purchase code for EBM issuance',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        return result;
      });
  }

  @Patch(':paymentId/ebm-issue')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/ebm',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `ebm-receipt-${unique}${path.extname(file.originalname)}`);
        },
      }),
    }),
  )
  markReceiptIssued(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    if (!file?.path) {
      throw new BadRequestException('EBM receipt file is required');
    }
    return this.paymentsService
      .markReceiptIssued(user.accountId, Number(paymentId), file.path)
      .then(async (result) => {
        await this.auditService.log({
          accountId: user.accountId,
          userId: user.sub,
          userEmail: user.email,
          userRole: user.role,
          action: 'UPLOAD',
          resourceType: 'EBM_RECEIPT',
          resourceId: paymentId,
          details: 'Uploaded issued EBM receipt document',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        return result;
      });
  }

  @Get(':paymentId/ebm-receipt/download')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  async downloadEbmReceipt(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: JwtUserPayload,
    @Req() req: Request,
  ) {
    const payment = await this.paymentsService.findOne(user.accountId, Number(paymentId));
    if (!payment.ebmReceiptPath || !fs.existsSync(payment.ebmReceiptPath)) {
      throw new NotFoundException('EBM receipt not found');
    }
    await this.auditService.log({
      accountId: user.accountId,
      userId: user.sub,
      userEmail: user.email,
      userRole: user.role,
      action: 'DOWNLOAD',
      resourceType: 'EBM_RECEIPT',
      resourceId: paymentId,
      details: 'Downloaded EBM receipt',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return new StreamableFile(fs.createReadStream(payment.ebmReceiptPath));
  }

  @Public()
  @Post('webhooks/provider')
  async providerWebhook(@Body() payload: Record<string, unknown>) {
    // Keep provider-agnostic for now; map provider fields in a dedicated adapter later.
    return this.paymentsService.processProviderWebhook(payload);
  }

  @Post('reconciliation/run')
  @Roles('OWNER', 'ACCOUNTANT')
  runReconciliation(@CurrentUser() user: JwtUserPayload) {
    return this.paymentsService.runReconciliation(user.accountId);
  }
}
