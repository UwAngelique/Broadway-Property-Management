import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract } from './contract.entity';
import { ContractVersion } from './contract-version.entity';
import { TenantProfile } from '../tenants/tenant-profile.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditModule } from '../audit/audit.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, ContractVersion, TenantProfile]), AuditModule, TenantsModule],
  controllers: [ContractsController],
  providers: [ContractsService, RolesGuard],
})
export class ContractsModule {}