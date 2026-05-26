import { IsOptional, IsString } from 'class-validator';

export class MicrosoftSigninDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  accountName?: string;
}
