import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { RwandaTaxProfile } from './rwanda-tax-profile.entity';
import { TaxObligation } from './tax-obligation.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([RwandaTaxProfile, TaxObligation])],
  providers: [ComplianceService, RolesGuard],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
