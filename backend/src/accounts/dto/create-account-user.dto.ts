import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../../tenants/user.entity';

export class CreateAccountUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['OWNER', 'ACCOUNTANT', 'LAWYER', 'TENANT'])
  role: UserRole;

  /** When true, tenant cannot sign in until landlord activates them. */
  @IsOptional()
  @IsBoolean()
  startInactive?: boolean;

  @IsOptional()
  @IsIn(['EN', 'FR', 'SW', 'RW'])
  language?: 'EN' | 'FR' | 'SW' | 'RW';
}
