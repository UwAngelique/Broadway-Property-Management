export class UpdateAccountBillingDto {
  billingContactName?: string;
  billingContactEmail?: string;
  billingContactPhone?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankSwiftCode?: string;
  vatEnabled?: boolean;
  vatRatePercent?: number;
}
