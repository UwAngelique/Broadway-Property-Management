import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import type { UploadedByRole } from '../contract-version.entity';

export class CreateContractDto {
  @Type(() => Number)
  @IsNumber()
  tenantId: number;

  @IsIn(['OWNER', 'LAWYER'])
  uploadedByRole: UploadedByRole;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @Type(() => Number)
  @IsNumber()
  rentAmountRwf: number;

  @IsIn(['MONTHLY', 'QUARTERLY', 'YEARLY'])
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

  @Type(() => Number)
  @IsNumber()
  dueDayOfMonth: number;
  reminderDaysBeforeEnd?: number;
  notes?: string;
}
