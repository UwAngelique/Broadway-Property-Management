import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class PhoneRequestOtpDto {
  @IsString()
  @Matches(/^(\+?250|0)?[7][2-9]\d{7}$/, {
    message: 'Enter a valid Rwanda mobile number (MTN or Airtel)',
  })
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  accountName?: string;

  @IsOptional()
  purpose?: 'LOGIN' | 'SIGNUP';
}
