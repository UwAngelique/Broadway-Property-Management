import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent } from './audit-event.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent])],
  providers: [AuditService, RolesGuard],
  controllers: [AuditController],
  exports: [AuditService],
})
export class AuditModule {}
