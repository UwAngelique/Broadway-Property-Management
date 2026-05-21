import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { SUBSCRIPTION_PLANS } from './plan-catalog';

@Injectable()
export class StripeBillingService {
  private readonly logger = new Logger(StripeBillingService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stripe: any = null;

  constructor(
    @InjectRepository(Account)
    private readonly accountsRepo: Repository<Account>,
  ) {
    if (process.env.STRIPE_SECRET_KEY) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require('stripe');
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  private ensureStripe() {
    if (!this.stripe) {
      throw new BadRequestException('STRIPE_SECRET_KEY is not configured');
    }
    return this.stripe;
  }

  private getPriceIdForPlan(planId: string): string | undefined {
    const map: Record<string, string | undefined> = {
      starter: process.env.STRIPE_PRICE_STARTER,
      professional: process.env.STRIPE_PRICE_PROFESSIONAL,
      business: process.env.STRIPE_PRICE_BUSINESS,
    };
    return map[planId];
  }

  async createCheckoutSession(accountId: number, planId: string, customerEmail: string) {
    const stripe = this.ensureStripe();
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) throw new BadRequestException('Invalid plan');

    const priceId = this.getPriceIdForPlan(planId);
    if (!priceId) {
      throw new BadRequestException(
        `Stripe price not configured for plan "${planId}". Set STRIPE_PRICE_${planId.toUpperCase()}.`,
      );
    }

    const account = await this.accountsRepo.findOne({ where: { id: accountId } });
    if (!account) throw new BadRequestException('Account not found');

    let customerId = account.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: account.name,
        metadata: { accountId: String(accountId) },
      });
      customerId = customer.id;
      account.stripeCustomerId = customerId;
      await this.accountsRepo.save(account);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/dashboard/settings?billing=success`,
      cancel_url: `${process.env.APP_URL}/pricing?billing=canceled`,
      metadata: { accountId: String(accountId), planId },
      subscription_data: {
        metadata: { accountId: String(accountId), planId },
      },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const stripe = this.ensureStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured');

    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        metadata?: { accountId?: string; planId?: string };
        subscription?: string;
      };
      const accountId = Number(session.metadata?.accountId);
      const planId = session.metadata?.planId;
      if (accountId && planId) {
        await this.activateSubscription(accountId, planId, session.subscription as string);
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as {
        id: string;
        status: string;
        metadata?: { accountId?: string; planId?: string };
        current_period_end: number;
      };
      const accountId = Number(sub.metadata?.accountId);
      if (accountId) {
        const account = await this.accountsRepo.findOne({ where: { id: accountId } });
        if (account) {
          account.stripeSubscriptionId = sub.id;
          account.subscriptionStatus = sub.status as Account['subscriptionStatus'];
          account.subscriptionCurrentPeriodEnd = new Date(sub.current_period_end * 1000);
          if (sub.metadata?.planId) account.subscriptionPlanId = sub.metadata.planId;
          await this.accountsRepo.save(account);
        }
      }
    }

    return { received: true };
  }

  private async activateSubscription(accountId: number, planId: string, subscriptionId: string) {
    const account = await this.accountsRepo.findOne({ where: { id: accountId } });
    if (!account) return;
    account.subscriptionPlanId = planId;
    account.stripeSubscriptionId = subscriptionId;
    account.subscriptionStatus = 'active';
    account.activationStatus = 'ACTIVE';
    await this.accountsRepo.save(account);
    this.logger.log(`Subscription activated for account ${accountId} plan ${planId}`);
  }

  async getBillingPortalUrl(accountId: number) {
    const stripe = this.ensureStripe();
    const account = await this.accountsRepo.findOne({ where: { id: accountId } });
    if (!account?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer — subscribe first');
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: `${process.env.APP_URL}/dashboard/settings`,
    });
    return { url: session.url };
  }
}
