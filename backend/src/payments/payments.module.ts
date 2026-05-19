import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { PaymentSettings } from './payment-settings.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditModule } from '../audit/audit.module';
import { Contract } from '../contracts/contract.entity';
import { ContractVersion } from '../contracts/contract-version.entity';
import { PaymentGatewayService } from './gateways/payment-gateway.service';
import { Invoice } from '../invoices/invoice.entity';
import { TenantProfile } from '../tenants/tenant-profile.entity';
import { User } from '../tenants/user.entity';
import { Account } from '../accounts/account.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsScheduler } from './payments.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentSettings, Contract, ContractVersion, Invoice, TenantProfile, User, Account]),
    AuditModule,
    NotificationsModule,
  ],
  providers: [PaymentsService, PaymentGatewayService, PaymentsScheduler, RolesGuard],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
