import { Body, Controller, Get, Post, Req, UseGuards, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { BillingService } from './billing.service';
import { StripeBillingService } from './stripe-billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { Public } from '../auth/public.decorator';
import type { Request } from 'express';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  @Get('plans')
  @Public()
  plans() {
    return this.billingService.getPlans();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(
    @CurrentUser() user: JwtUserPayload,
    @Body() body: { planId: string },
  ) {
    return this.stripeBillingService.createCheckoutSession(
      user.accountId,
      body.planId,
      user.email,
    );
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  portal(@CurrentUser() user: JwtUserPayload) {
    return this.stripeBillingService.getBillingPortalUrl(user.accountId);
  }

  @Post('webhooks/stripe')
  @Public()
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const raw = req.rawBody ?? Buffer.from('');
    return this.stripeBillingService.handleWebhook(raw, signature);
  }
}
