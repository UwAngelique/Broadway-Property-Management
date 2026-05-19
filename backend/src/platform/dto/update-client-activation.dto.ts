import { IsIn } from 'class-validator';
import type { AccountActivationStatus } from '../../accounts/account.entity';

export class UpdateClientActivationDto {
  @IsIn(['PENDING', 'ACTIVE', 'SUSPENDED'])
  status: AccountActivationStatus;
}
