import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

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

export class PaymentQuoteDto {
  @Type(() => Number)
  @IsNumber()
  contractId: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @Transform(({ value }) => toBillingMonths(value))
  @IsArray()
  @IsString({ each: true })
  billingMonths: string[];
}
