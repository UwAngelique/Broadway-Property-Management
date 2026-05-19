import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../tenants/user.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Account, User]), AuditModule],
  providers: [AccountsService, RolesGuard],
  controllers: [AccountsController],
  exports: [AccountsService, TypeOrmModule],
})
export class AccountsModule {}
