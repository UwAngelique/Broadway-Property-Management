import { IsString } from 'class-validator';
import { ApplyPasswordPolicy } from '../../common/password-policy';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @ApplyPasswordPolicy()
  newPassword: string;
}
