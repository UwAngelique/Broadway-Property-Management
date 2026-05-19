export class UpdatePaymentSettingsDto {
  enableBankTransferProof?: boolean;
  enableBankGateway?: boolean;
  enableMtnMomo?: boolean;
  enableAirtelMoney?: boolean;
  enableManualEbmByLandlord?: boolean;
  bankGatewayProvider?: string;
  enabledBankCodes?: string[];
}
