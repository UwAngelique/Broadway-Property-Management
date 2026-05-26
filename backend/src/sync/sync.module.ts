import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PlatformModule } from '../platform/platform.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Building } from '../buildings/building.entity';
import { User } from '../tenants/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice, Building, User]),
    DashboardModule,
    PlatformModule,
    RealtimeModule,
  ],
  providers: [SyncService],
  controllers: [SyncController],
  exports: [SyncService],
})
export class SyncModule {}
