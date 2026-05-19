import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types';
import { PlatformService } from '../platform/platform.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ComplianceService } from '../compliance/compliance.service';
import { Building } from '../buildings/building.entity';
import { Unit } from '../units/unit.entity';
import { User } from '../tenants/user.entity';
import { TenantProfile } from '../tenants/tenant-profile.entity';
import { Contract } from '../contracts/contract.entity';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Expense } from '../expenses/expense.entity';
import { TaxObligation } from '../compliance/tax-obligation.entity';

export type HubTile = {
  id: string;
  title: string;
  count: number;
  subtitle: string;
  href: string;
  accent?: string;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly platformService: PlatformService,
    private readonly analyticsService: AnalyticsService,
    private readonly complianceService: ComplianceService,
    @InjectRepository(Building) private readonly buildingsRepo: Repository<Building>,
    @InjectRepository(Unit) private readonly unitsRepo: Repository<Unit>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(TenantProfile) private readonly tenantsRepo: Repository<TenantProfile>,
    @InjectRepository(Contract) private readonly contractsRepo: Repository<Contract>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Invoice) private readonly invoicesRepo: Repository<Invoice>,
    @InjectRepository(Expense) private readonly expensesRepo: Repository<Expense>,
    @InjectRepository(TaxObligation) private readonly obligationsRepo: Repository<TaxObligation>,
  ) {}

  async getHub(user: JwtUserPayload): Promise<{ tiles: HubTile[]; headline?: string }> {
    if (user.role === 'PLATFORM_OWNER') {
      return this.platformHub(user.accountId);
    }
    if (user.role === 'TENANT') {
      return this.tenantHub(user.accountId, user.sub);
    }
    return this.landlordHub(user.accountId, user.role);
  }

  private async platformHub(accountId: number) {
    const overview = await this.platformService.getOverview(accountId);
    const openTax = overview.clients.reduce((n, c) => n + c.openTaxItems, 0);
    const pendingClients = overview.clients.filter((c) => c.activationStatus !== 'ACTIVE').length;
    const clientsWithOutstanding = overview.clients.filter((c) => c.overview.outstandingThisMonthRwf > 0).length;

    const tiles: HubTile[] = [
      {
        id: 'clients',
        title: 'Clients',
        count: overview.clientCount,
        subtitle: `${overview.totalUsersAcrossClients} users across portfolios`,
        href: '/dashboard/clients',
        accent: 'blue',
      },
      {
        id: 'finance',
        title: 'Finance',
        count: clientsWithOutstanding,
        subtitle: `${fmt(overview.rollupThisMonth.outstandingThisMonthRwf)} RWF outstanding (rolled up)`,
        href: '/dashboard/payments',
        accent: 'emerald',
      },
      {
        id: 'tax',
        title: 'Tax & compliance',
        count: openTax,
        subtitle: 'Open obligation rows (all clients)',
        href: '/dashboard/tax',
        accent: 'amber',
      },
      {
        id: 'operations',
        title: 'Operations',
        count: overview.totalAuditEventsLast30DaysAcrossClients,
        subtitle: `${pendingClients} clients not fully active`,
        href: '/dashboard/operations',
        accent: 'slate',
      },
    ];

    const platformName = overview.platform.name;
    const headline =
      platformName && platformName !== 'Default Account'
        ? platformName
        : 'Broadway Platform Command Center';

    tiles.push({
      id: 'settings',
      title: 'Settings',
      count: 1,
      subtitle: 'Platform workspace & billing',
      href: '/dashboard/settings',
      accent: 'slate',
    });

    return {
      headline,
      tiles,
    };
  }

  private async landlordHub(accountId: number, role: string) {
    const year = new Date().getFullYear();
    const [
      overview,
      buildings,
      units,
      tenantUsers,
      contracts,
      payments,
      invoices,
      expenses,
      obligations,
      allUsers,
    ] = await Promise.all([
      this.analyticsService.getOverview(accountId).catch(() => null),
      this.buildingsRepo.count({ where: { accountId } }),
      this.unitsRepo.count({ where: { accountId } }),
      this.usersRepo.count({ where: { accountId, role: 'TENANT' } }),
      this.contractsRepo.count({ where: { accountId } }),
      this.paymentsRepo.find({ where: { accountId }, order: { createdAt: 'DESC' }, take: 200 }),
      this.invoicesRepo.count({ where: { accountId } }),
      this.expensesRepo.count({ where: { accountId } }),
      this.obligationsRepo.find({ where: { accountId } }),
      this.usersRepo.count({ where: { accountId } }),
    ]);

    const pendingPayments = payments.filter((p) => ['SUBMITTED', 'UNDER_REVIEW', 'RECEIPT_REQUESTED'].includes(p.status)).length;
    const openTax = obligations.filter((o) => o.status !== 'PAID').length;
    const tenantProfiles = await this.tenantsRepo.count({ where: { accountId } });

    const tiles: HubTile[] = [
      {
        id: 'properties',
        title: 'Properties',
        count: buildings,
        subtitle: 'Buildings & land (UPI)',
        href: '/dashboard/properties',
        accent: 'indigo',
      },
      {
        id: 'units',
        title: 'Units',
        count: units,
        subtitle: `Across ${buildings} properties`,
        href: '/dashboard/units',
        accent: 'indigo',
      },
      {
        id: 'tenants',
        title: 'Tenants',
        count: tenantProfiles || tenantUsers,
        subtitle: `${tenantUsers} tenant logins`,
        href: '/dashboard/tenants',
        accent: 'blue',
      },
      {
        id: 'leases',
        title: 'Leases',
        count: contracts,
        subtitle: 'Contract records',
        href: '/dashboard/leases',
        accent: 'violet',
      },
      {
        id: 'payments',
        title: 'Payments',
        count: pendingPayments,
        subtitle: `${invoices} invoices · ${overview ? fmt(overview.collectedThisMonthRwf) : '—'} RWF collected`,
        href: '/dashboard/payments',
        accent: 'emerald',
      },
      {
        id: 'tax',
        title: 'Tax',
        count: openTax,
        subtitle: `${obligations.length} tracked obligations`,
        href: '/dashboard/tax',
        accent: 'amber',
      },
    ];

    if (['OWNER', 'ACCOUNTANT'].includes(role)) {
      tiles.push({
        id: 'expenses',
        title: 'Expenses',
        count: expenses,
        subtitle: overview ? `Net ${fmt(overview.netAfterTaxRwf)} RWF after tax est.` : 'Expense register',
        href: '/dashboard/expenses',
        accent: 'rose',
      });
    }

    const roleCounts = await this.usersRepo
      .find({ where: { accountId } })
      .then((list) => ({
        owners: list.filter((u) => u.role === 'OWNER').length,
        accountants: list.filter((u) => u.role === 'ACCOUNTANT').length,
        lawyers: list.filter((u) => u.role === 'LAWYER').length,
        tenants: list.filter((u) => u.role === 'TENANT').length,
      }));

    if (role === 'OWNER') {
      tiles.push({
        id: 'team',
        title: 'Team & roles',
        count: allUsers,
        subtitle: `${roleCounts.owners} owner · ${roleCounts.accountants} accountant · ${roleCounts.lawyers} lawyer`,
        href: '/dashboard/team',
        accent: 'slate',
      });
    }

    tiles.push({
      id: 'forecast',
      title: 'Annual forecast',
      count: year,
      subtitle: `Jan–Dec ${year} net projection`,
      href: '/dashboard/forecast',
      accent: 'emerald',
    });

    tiles.push({
      id: 'settings',
      title: 'Settings',
      count: 1,
      subtitle: 'Payments, legal, workspace',
      href: '/dashboard/settings',
      accent: 'slate',
    });

    tiles.push({
      id: 'operations',
      title: 'Operations',
      count: overview?.occupancyRate ?? 0,
      subtitle: overview ? `${overview.occupancyRate}% occupancy` : 'Automation & reports',
      href: '/dashboard/operations',
      accent: 'cyan',
    });

    return {
      headline: 'Owner Intelligence Dashboard',
      tiles,
    };
  }

  private async tenantHub(accountId: number, userId: number) {
    const profile = await this.tenantsRepo.findOne({ where: { accountId, userId } });
    const tenantProfileId = profile?.id;
    if (!tenantProfileId) {
      return {
        headline: 'Tenant Portal',
        tiles: [
          {
            id: 'setup',
            title: 'Complete your profile',
            count: 0,
            subtitle: 'Ask your landlord to link your login to a unit',
            href: '/dashboard/portal',
            accent: 'amber',
          },
        ],
      };
    }
    const [payments, contracts, invoices] = await Promise.all([
      this.paymentsRepo.find({ where: { accountId, tenantId: tenantProfileId }, order: { createdAt: 'DESC' } }),
      this.contractsRepo.count({ where: { accountId, tenantId: tenantProfileId } }),
      this.invoicesRepo.count({ where: { accountId, tenantId: tenantProfileId } }),
    ]);
    const pending = payments.filter((p) => !['APPROVED', 'REJECTED', 'RECEIPT_ISSUED'].includes(p.status)).length;

    return {
      headline: 'Tenant Portal',
      tiles: [
        {
          id: 'rent',
          title: 'My rent & payments',
          count: invoices,
          subtitle: `${pending} submissions in progress`,
          href: '/dashboard/portal',
          accent: 'emerald',
        },
        {
          id: 'leases',
          title: 'My leases',
          count: contracts,
          subtitle: 'Contracts on file',
          href: '/dashboard/leases',
          accent: 'violet',
        },
      ],
    };
  }
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('en-RW');
}
