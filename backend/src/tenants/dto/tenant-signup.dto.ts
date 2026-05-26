import { IsEmail, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { USER_LANGUAGES } from '../../common/languages';
import type { UserLanguage } from '../../common/languages';
import { ApplyPasswordPolicy } from '../../common/password-policy';

export class TenantSignupDto {
  @IsEmail()
  email: string;

  @ApplyPasswordPolicy()
  password: string;

  @IsInt()
  accountId: number;

  @IsOptional()
  @IsIn(USER_LANGUAGES)
  language?: UserLanguage;

  @IsInt()
  unitId: number;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @MinLength(2)
  companyName: string;

  @IsString()
  @MinLength(2)
  businessSector: string;

  @IsString()
  @MinLength(5)
  tinNumber: string;

  @IsString()
  @MinLength(9)
  phone: string;

  @IsOptional()
  @IsString()
  address?: string;
}
