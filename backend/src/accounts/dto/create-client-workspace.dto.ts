import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import type { AccountActivationStatus } from '../account.entity';
import { USER_LANGUAGES } from '../../common/languages';
import type { UserLanguage } from '../../common/languages';
import { ApplyPasswordPolicy } from '../../common/password-policy';

export class CreateClientWorkspaceDto {
  @IsString()
  workspaceName: string;

  @IsEmail()
  ownerEmail: string;

  @ApplyPasswordPolicy()
  ownerPassword: string;

  /** New landlord workspaces start PENDING until you activate them (default). */
  @IsOptional()
  @IsIn(['PENDING', 'ACTIVE'])
  initialActivationStatus?: AccountActivationStatus;

  @IsOptional()
  @IsIn(USER_LANGUAGES)
  language?: UserLanguage;
}
