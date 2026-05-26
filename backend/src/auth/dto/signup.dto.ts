import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { SUBSCRIPTION_PLAN_IDS } from '../../billing/plan-catalog';
import { USER_LANGUAGES } from '../../common/languages';
import type { UserLanguage } from '../../common/languages';
import { ApplyPasswordPolicy } from '../../common/password-policy';

export class SignupDto {
  @IsEmail()
  email: string;

  @ApplyPasswordPolicy()
  password: string;

  @IsOptional()
  @IsIn(USER_LANGUAGES)
  language?: UserLanguage;

  /** Creates a new landlord workspace (public signup cannot join an existing account). */
  @IsOptional()
  @IsString()
  accountName?: string;

  /** Must match a plan id from GET /billing/plans */
  @IsOptional()
  @IsIn(SUBSCRIPTION_PLAN_IDS)
  selectedPlanId?: string;
}
