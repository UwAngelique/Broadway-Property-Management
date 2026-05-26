import { IsOptional, IsString } from 'class-validator';

export class GoogleSigninDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  accountName?: string;
}
