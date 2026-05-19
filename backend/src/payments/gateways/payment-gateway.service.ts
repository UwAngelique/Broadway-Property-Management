import { Injectable } from '@nestjs/common';
import { PaymentIntentInput, PaymentIntentResult } from './payment-gateway.types';

@Injectable()
export class PaymentGatewayService {
  async createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    // Integration point for BPR, BK, Equity, I&M, Ecobank, KCB, GT Bank, Access, NCBA, etc.
    // Also supports MTN and Airtel adapters in future without changing payment business logic.
    return {
      provider: 'AGGREGATOR_PLACEHOLDER',
      checkoutUrl: undefined,
      providerReference: `${input.channel}-${Date.now()}`,
      status: 'PENDING',
    };
  }
}
