import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PlatformModule } from '../platform/platform.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { Building } from '../buildings/building.entity';
import { Unit } from '../units/unit.entity';
import { User } from '../tenants/user.entity';
import { TenantProfile } from '../tenants/tenant-profile.entity';
import { Contract } from '../contracts/contract.entity';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Expense } from '../expenses/expense.entity';
import { TaxObligation } from '../compliance/tax-obligation.entity';

@Module({
  imports: [
    PlatformModule,
    AnalyticsModule,
    ComplianceModule,
    TypeOrmModule.forFeature([
      Building,
      Unit,
      User,
      TenantProfile,
      Contract,
      Payment,
      Invoice,
      Expense,
      TaxObligation,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
