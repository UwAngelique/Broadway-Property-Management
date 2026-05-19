export type RwandaPaymentChannel = 'BANK_GATEWAY' | 'MTN_MOMO' | 'AIRTEL_MONEY';

export interface PaymentIntentInput {
  amountRwf: number;
  channel: RwandaPaymentChannel;
  externalReference: string;
  customerPhone?: string;
  customerEmail?: string;
  bankCode?: string;
}

export interface PaymentIntentResult {
  provider: string;
  checkoutUrl?: string;
  providerReference: string;
  status: 'PENDING';
}
