import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import type { PaymentMethod } from '../payment.entity';

function toBillingMonths(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return value != null && value !== '' ? [String(value)] : [];
}

export class CreatePaymentProofDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @Type(() => Number)
  @IsNumber()
  contractId: number;

  @Transform(({ value }) => toBillingMonths(value))
  @IsArray()
  @IsString({ each: true })
  billingMonths: string[];

  @IsIn(['BANK_TRANSFER', 'BANK_GATEWAY', 'MTN_MOMO', 'AIRTEL_MONEY', 'CASH'])
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  bankReference?: string;

  @IsOptional()
  @IsString()
  proofNote?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  requestEbmReceipt?: boolean;
}
