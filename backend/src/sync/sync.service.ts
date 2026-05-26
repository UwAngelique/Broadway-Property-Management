import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types';
import { DashboardService } from '../dashboard/dashboard.service';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Building } from '../buildings/building.entity';
import { User } from '../tenants/user.entity';
import { EventsGateway } from '../realtime/events.gateway';
import { PlatformService } from '../platform/platform.service';

export const SYNC_INTERVAL_MS = 60_000;

@Injectable()
export class SyncService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly platformService: PlatformService,
    private readonly eventsGateway: EventsGateway,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Invoice) private readonly invoicesRepo: Repository<Invoice>,
    @InjectRepository(Building) private readonly buildingsRepo: Repository<Building>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async computeRevision(accountId: number): Promise<string> {
    const [pay, inv, bld, usr] = await Promise.all([
      this.paymentsRepo
        .createQueryBuilder('p')
        .select('MAX(p.updatedAt)', 'm')
        .where('p.accountId = :accountId', { accountId })
        .getRawOne<{ m: Date | null }>(),
      this.invoicesRepo
        .createQueryBuilder('i')
        .select('MAX(i.updatedAt)', 'm')
        .where('i.accountId = :accountId', { accountId })
        .getRawOne<{ m: Date | null }>(),
      this.buildingsRepo
        .createQueryBuilder('b')
        .select('MAX(b.updatedAt)', 'm')
        .where('b.accountId = :accountId', { accountId })
        .getRawOne<{ m: Date | null }>(),
      this.usersRepo
        .createQueryBuilder('u')
        .select('MAX(u.updatedAt)', 'm')
        .where('u.accountId = :accountId', { accountId })
        .getRawOne<{ m: Date | null }>(),
    ]);
    const payload = [pay?.m, inv?.m, bld?.m, usr?.m].map((d) => (d ? new Date(d).toISOString() : '')).join('|');
    return createHash('sha256').update(payload).digest('hex').slice(0, 16);
  }

  async pull(user: JwtUserPayload, clientRevision?: string) {
    const revision = await this.computeRevision(user.accountId);
    const serverTime = new Date().toISOString();

    if (clientRevision && clientRevision === revision) {
      return {
        unchanged: true,
        revision,
        serverTime,
        syncIntervalMs: SYNC_INTERVAL_MS,
      };
    }

    const hub = await this.dashboardService.getHub(user);
    const me = await this.usersRepo.findOne({ where: { id: user.sub } });

    let platformOverview: unknown = null;
    if (user.role === 'PLATFORM_OWNER') {
      platformOverview = await this.platformService.getOverview(user.accountId);
    }

    return {
      unchanged: false,
      revision,
      serverTime,
      syncIntervalMs: SYNC_INTERVAL_MS,
      language: me?.language ?? 'EN',
      hub,
      platformOverview,
    };
  }

  notifyAccountSync(accountId: number) {
    void this.computeRevision(accountId).then((revision) => {
      this.eventsGateway.emitToAccount(accountId, 'sync:refresh', {
        revision,
        serverTime: new Date().toISOString(),
      });
    });
  }
}
