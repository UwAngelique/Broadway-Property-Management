import type { UserRole } from '../../tenants/user.entity';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { SUBSCRIPTION_PLAN_IDS } from '../../billing/plan-catalog';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['OWNER', 'ACCOUNTANT', 'LAWYER', 'TENANT'])
  role?: UserRole;

  @IsOptional()
  @IsIn(['EN', 'FR', 'SW', 'RW'])
  language?: 'EN' | 'FR' | 'SW' | 'RW';

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsInt()
  accountId?: number;

  /** Must match a plan id from GET /billing/plans */
  @IsOptional()
  @IsIn(SUBSCRIPTION_PLAN_IDS)
  selectedPlanId?: string;
}
