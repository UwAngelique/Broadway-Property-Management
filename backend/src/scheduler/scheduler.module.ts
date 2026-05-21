import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/account.entity';
import { PaymentsModule } from '../payments/payments.module';
import { PlatformSchedulerService } from './platform-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), PaymentsModule],
  providers: [PlatformSchedulerService],
})
export class SchedulerModule {}
