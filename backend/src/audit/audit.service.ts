import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuditAction, AuditEvent } from './audit-event.entity';
import { QueryAuditEventsDto } from './dto/query-audit-events.dto';

interface LogAuditInput {
  accountId: number;
  userId: number;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
  ) {}

  async log(input: LogAuditInput) {
    const event = this.auditRepo.create(input);
    return this.auditRepo.save(event);
  }

  async query(accountId: number, query: QueryAuditEventsDto) {
    const limit = Number(query.limit ?? 100);
    const where: Record<string, unknown> = { accountId };
    if (query.userId) where.userId = Number(query.userId);
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to));
    }

    return this.auditRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit > 500 ? 500 : limit,
    });
  }
}
