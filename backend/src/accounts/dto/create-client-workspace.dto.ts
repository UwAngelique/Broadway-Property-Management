import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { AccountActivationStatus } from '../account.entity';

export class CreateClientWorkspaceDto {
  @IsString()
  workspaceName: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @MinLength(6)
  ownerPassword: string;

  /** New landlord workspaces start PENDING until you activate them (default). */
  @IsOptional()
  @IsIn(['PENDING', 'ACTIVE'])
  initialActivationStatus?: AccountActivationStatus;

  @IsOptional()
  @IsString()
  language?: 'EN' | 'FR' | 'SW' | 'RW';
}
