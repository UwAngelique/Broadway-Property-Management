import { IsInt, IsOptional, IsString } from 'class-validator';

export class MicrosoftSigninDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsInt()
  accountId?: number;

  @IsOptional()
  @IsString()
  accountName?: string;
}
