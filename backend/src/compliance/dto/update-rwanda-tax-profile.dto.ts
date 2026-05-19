import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { IncomeTaxRegime } from '../rwanda-tax-profile.entity';

export class UpdateRwandaTaxProfileDto {
  @IsOptional()
  @IsIn(['PIT', 'CIT', 'UNKNOWN'])
  incomeTaxRegime?: IncomeTaxRegime;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tin?: string;

  @IsOptional()
  @IsBoolean()
  vatRegistered?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
