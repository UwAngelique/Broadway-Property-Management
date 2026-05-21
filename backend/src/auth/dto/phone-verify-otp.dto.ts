import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class PhoneVerifyOtpDto {
  @IsString()
  @Matches(/^(\+?250|0)?[7][2-9]\d{7}$/)
  phone: string;

  @IsString()
  @Length(4, 8)
  code: string;

  @IsOptional()
  @IsString()
  selectedPlanId?: string;

  @IsOptional()
  @IsString()
  accountName?: string;
}
