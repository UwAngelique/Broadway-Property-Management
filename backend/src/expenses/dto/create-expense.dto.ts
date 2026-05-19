import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  category: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  amountRwf: number;

  @IsString()
  expenseDate: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  buildingId?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  tenantId?: number;
}
