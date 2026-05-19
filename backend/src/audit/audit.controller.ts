import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';
import { QueryAuditEventsDto } from './dto/query-audit-events.dto';

@Controller('audit-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('OWNER', 'LAWYER')
  list(@CurrentUser() user: JwtUserPayload, @Query() query: QueryAuditEventsDto) {
    return this.auditService.query(user.accountId, query);
  }
}
