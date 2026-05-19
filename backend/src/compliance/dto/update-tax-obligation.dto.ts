import { IsDateString, IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { TaxObligationStatus, TaxObligationType } from '../tax-obligation.entity';

export class UpdateTaxObligationDto {
  @IsOptional()
  @IsIn(['VAT', 'LAND', 'PROPERTY', 'PIT', 'CIT', 'RENTAL_INCOME', 'OTHER'])
  taxType?: TaxObligationType;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  periodKey?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  amountDueRwf?: string;

  @IsOptional()
  @IsIn(['PLANNED', 'DUE', 'PAID', 'OVERDUE'])
  status?: TaxObligationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  rraReference?: string;

  @IsOptional()
  @IsInt()
  propertyId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
