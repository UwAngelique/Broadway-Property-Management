import { IsBoolean, IsEmail, IsIn, IsOptional } from 'class-validator';
import type { UserRole } from '../../tenants/user.entity';
import { USER_LANGUAGES } from '../../common/languages';
import type { UserLanguage } from '../../common/languages';
import { ApplyPasswordPolicy } from '../../common/password-policy';

export class CreateAccountUserDto {
  @IsEmail()
  email: string;

  @ApplyPasswordPolicy()
  password: string;

  @IsIn(['OWNER', 'ACCOUNTANT', 'LAWYER', 'TENANT'])
  role: UserRole;

  /** When true, tenant cannot sign in until landlord activates them. */
  @IsOptional()
  @IsBoolean()
  startInactive?: boolean;

  @IsOptional()
  @IsIn(USER_LANGUAGES)
  language?: UserLanguage;
}
