import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { Account } from '../accounts/account.entity';
import { User } from '../tenants/user.entity';
import { AuditEvent } from '../audit/audit-event.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AuditModule } from '../audit/audit.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, AuditEvent]),
    AnalyticsModule,
    ComplianceModule,
    AccountsModule,
    AuditModule,
  ],
  providers: [PlatformService, RolesGuard],
  controllers: [PlatformController],
  exports: [PlatformService],
})
export class PlatformModule {}
