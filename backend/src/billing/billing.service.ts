import { Injectable } from '@nestjs/common';
import { SUBSCRIPTION_PLANS } from './plan-catalog';

@Injectable()
export class BillingService {
  getPlans() {
    return {
      currency: 'RWF',
      disclaimer:
        'Prices are indicative for Rwanda. Final pricing, VAT, and contracts are confirmed at onboarding. Payment collection (cards, MoMo, bank debit) can be wired in a later release.',
      plans: SUBSCRIPTION_PLANS,
    };
  }
}
