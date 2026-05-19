import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { User } from '../tenants/user.entity';
import { AuditEvent } from '../audit/audit-event.entity';
import { AnalyticsService } from '../analytics/analytics.service';
import { ComplianceService } from '../compliance/compliance.service';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(AuditEvent)
    private readonly auditRepo: Repository<AuditEvent>,
    private readonly analyticsService: AnalyticsService,
    private readonly complianceService: ComplianceService,
    private readonly accountsService: AccountsService,
  ) {}

  async getOverview(platformAccountId: number) {
    const platform = await this.accountsService.findOne(platformAccountId);
    const clients = await this.accountsService.listLandlordChildren(platformAccountId);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const clientRows = await Promise.all(
      clients.map(async (c) => {
        const [overview, userCount, activeUsers, auditEvents30d, obligations] = await Promise.all([
          this.analyticsService.getOverview(c.id),
          this.usersRepo.count({ where: { accountId: c.id } }),
          this.usersRepo.count({ where: { accountId: c.id, isActive: true } }),
          this.auditRepo.count({ where: { accountId: c.id, createdAt: MoreThan(since) } }),
          this.complianceService.listObligations(c.id),
        ]);
        const openTaxItems = obligations.filter((o) => o.status !== 'PAID').length;
        return {
          accountId: c.id,
          name: c.name,
          activationStatus: c.activationStatus,
          isActive: c.isActive,
          createdAt: c.createdAt,
          userCount,
          activeUsers,
          auditEventsLast30Days: auditEvents30d,
          openTaxItems,
          overview,
        };
      }),
    );

    const rollup = clientRows.reduce(
      (acc, row) => {
        acc.expectedMonthlyRentRwf += row.overview.expectedMonthlyRentRwf;
        acc.collectedThisMonthRwf += row.overview.collectedThisMonthRwf;
        acc.outstandingThisMonthRwf += row.overview.outstandingThisMonthRwf;
        acc.taxDueThisMonthRwf += row.overview.taxDueThisMonthRwf;
        acc.estimatedVacancyLossRwf += row.overview.estimatedVacancyLossRwf;
        acc.netAfterTaxRwf += row.overview.netAfterTaxRwf;
        acc.totalUnits += row.overview.totalUnits;
        acc.occupiedUnits += row.overview.occupiedUnits;
        return acc;
      },
      {
        expectedMonthlyRentRwf: 0,
        collectedThisMonthRwf: 0,
        outstandingThisMonthRwf: 0,
        taxDueThisMonthRwf: 0,
        estimatedVacancyLossRwf: 0,
        netAfterTaxRwf: 0,
        totalUnits: 0,
        occupiedUnits: 0,
      },
    );

    const fix = (n: number) => Number(n.toFixed(2));

    const platformName =
      platform?.name && platform.name !== 'Default Account' ? platform.name : 'Broadway Platform';

    return {
      platform: {
        accountId: platform?.id,
        name: platformName,
        kind: platform?.kind ?? 'PLATFORM',
      },
      clientCount: clients.length,
      totalUsersAcrossClients: clientRows.reduce((s, r) => s + r.userCount, 0),
      totalAuditEventsLast30DaysAcrossClients: clientRows.reduce((s, r) => s + r.auditEventsLast30Days, 0),
      rollupThisMonth: {
        expectedMonthlyRentRwf: fix(rollup.expectedMonthlyRentRwf),
        collectedThisMonthRwf: fix(rollup.collectedThisMonthRwf),
        outstandingThisMonthRwf: fix(rollup.outstandingThisMonthRwf),
        taxDueThisMonthRwf: fix(rollup.taxDueThisMonthRwf),
        estimatedVacancyLossRwf: fix(rollup.estimatedVacancyLossRwf),
        netAfterTaxRwf: fix(rollup.netAfterTaxRwf),
        totalUnits: rollup.totalUnits,
        occupiedUnits: rollup.occupiedUnits,
        portfolioOccupancyRate: rollup.totalUnits
          ? fix((rollup.occupiedUnits / rollup.totalUnits) * 100)
          : 0,
      },
      clients: clientRows,
    };
  }
}
