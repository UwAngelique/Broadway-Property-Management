import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/account.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { StripeBillingService } from './stripe-billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [BillingService, StripeBillingService],
  controllers: [BillingController],
  exports: [BillingService, StripeBillingService],
})
export class BillingModule {}
