import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Unit } from '../units/unit.entity';
import { TenantProfile } from '../tenants/tenant-profile.entity';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Contract } from '../contracts/contract.entity';
import { ContractVersion } from '../contracts/contract-version.entity';
import { Building } from '../buildings/building.entity';
import { ManualIncomeLine } from './manual-income-line.entity';
import { ComplianceModule } from '../compliance/compliance.module';
import { User } from '../tenants/user.entity';

@Module({
  imports: [
    ComplianceModule,
    TypeOrmModule.forFeature([
      Unit,
      TenantProfile,
      Payment,
      Invoice,
      Contract,
      ContractVersion,
      Building,
      ManualIncomeLine,
      User,
    ]),
  ],
  providers: [AnalyticsService, RolesGuard],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
