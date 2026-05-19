import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from '../units/unit.entity';
import { TenantProfile } from '../tenants/tenant-profile.entity';
import { Payment } from '../payments/payment.entity';
import { Invoice } from '../invoices/invoice.entity';
import { Contract } from '../contracts/contract.entity';
import { ContractVersion } from '../contracts/contract-version.entity';
import { Building } from '../buildings/building.entity';
import { ManualIncomeLine } from './manual-income-line.entity';
import { ComplianceService } from '../compliance/compliance.service';
import { User } from '../tenants/user.entity';

function billableMonthsInYear(startDate: string, endDate: string, year: number): number {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const from = start > yearStart ? start : yearStart;
  const to = end < yearEnd ? end : yearEnd;
  if (from > to) return 0;
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Unit) private readonly unitsRepo: Repository<Unit>,
    @InjectRepository(TenantProfile) private readonly tenantsRepo: Repository<TenantProfile>,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Invoice) private readonly invoicesRepo: Repository<Invoice>,
    @InjectRepository(Contract) private readonly contractsRepo: Repository<Contract>,
    @InjectRepository(ContractVersion) private readonly versionsRepo: Repository<ContractVersion>,
    @InjectRepository(Building) private readonly buildingsRepo: Repository<Building>,
    @InjectRepository(ManualIncomeLine) private readonly manualIncomeRepo: Repository<ManualIncomeLine>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly complianceService: ComplianceService,
  ) {}

  async getOverview(accountId: number) {
    const [units, tenants, contracts, payments, invoices] = await Promise.all([
      this.unitsRepo.find({ where: { accountId } }),
      this.tenantsRepo.find({ where: { accountId } }),
      this.contractsRepo.find({ where: { accountId, status: 'ACTIVE', isApproved: true } }),
      this.paymentsRepo.find({ where: { accountId }, order: { id: 'DESC' } }),
      this.invoicesRepo.find({ where: { accountId }, order: { id: 'DESC' } }),
    ]);

    const occupiedUnitIds = new Set(tenants.map((item) => item.unitId));
    const totalUnits = units.length;
    const occupiedUnits = occupiedUnitIds.size;
    const vacantUnits = Math.max(0, totalUnits - occupiedUnits);
    const occupancyRate = totalUnits ? (occupiedUnits / totalUnits) * 100 : 0;

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const activeContractVersions = await Promise.all(
      contracts.map((contract) =>
        this.versionsRepo.findOne({
          where: {
            accountId,
            contractId: contract.id,
            versionNumber: contract.currentVersionNumber ?? 1,
          },
        }),
      ),
    );

    const expectedMonthlyRentRwf = activeContractVersions
      .filter((item): item is ContractVersion => Boolean(item))
      .reduce((sum, item) => sum + Number(item.rentAmountRwf), 0);

    const collectedThisMonthRwf = payments
      .filter(
        (item) =>
          (item.status === 'APPROVED' || item.status === 'RECEIPT_ISSUED' || item.status === 'RECEIPT_REQUESTED') &&
          item.createdAt.toISOString().slice(0, 7) === currentMonth,
      )
      .reduce((sum, item) => sum + Number(item.amountRwf), 0);

    const taxDueThisMonthRwf = invoices
      .filter((item) => item.billingMonth === currentMonth)
      .reduce((sum, item) => sum + Number(item.vatAmountRwf), 0);

    const invoiceDueThisMonthRwf = invoices
      .filter((item) => item.billingMonth === currentMonth)
      .reduce((sum, item) => sum + Number(item.totalAmountRwf), 0);

    const outstandingThisMonthRwf = Math.max(0, invoiceDueThisMonthRwf - collectedThisMonthRwf);
    const estimatedVacancyLossRwf =
      totalUnits > 0 ? (expectedMonthlyRentRwf / Math.max(occupiedUnits, 1)) * vacantUnits : 0;
    const netAfterTaxRwf = collectedThisMonthRwf - taxDueThisMonthRwf;

    return {
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate: Number(occupancyRate.toFixed(2)),
      expectedMonthlyRentRwf: Number(expectedMonthlyRentRwf.toFixed(2)),
      collectedThisMonthRwf: Number(collectedThisMonthRwf.toFixed(2)),
      outstandingThisMonthRwf: Number(outstandingThisMonthRwf.toFixed(2)),
      taxDueThisMonthRwf: Number(taxDueThisMonthRwf.toFixed(2)),
      estimatedVacancyLossRwf: Number(estimatedVacancyLossRwf.toFixed(2)),
      netAfterTaxRwf: Number(netAfterTaxRwf.toFixed(2)),
    };
  }

  async getRevenueTrend(accountId: number) {
    const payments = await this.paymentsRepo.find({ where: { accountId }, order: { createdAt: 'ASC' } });
    const monthly = new Map<string, number>();
    for (const payment of payments) {
      if (!['APPROVED', 'RECEIPT_ISSUED', 'RECEIPT_REQUESTED'].includes(payment.status)) continue;
      const month = payment.createdAt.toISOString().slice(0, 7);
      monthly.set(month, (monthly.get(month) ?? 0) + Number(payment.amountRwf));
    }
    return [...monthly.entries()]
      .map(([month, amountRwf]) => ({ month, amountRwf: Number(amountRwf.toFixed(2)) }))
      .slice(-12);
  }

  async getBuildingPerformance(accountId: number) {
    const [buildings, units, tenants] = await Promise.all([
      this.buildingsRepo.find({ where: { accountId }, order: { id: 'ASC' } }),
      this.unitsRepo.find({ where: { accountId }, order: { id: 'ASC' } }),
      this.tenantsRepo.find({ where: { accountId }, order: { id: 'ASC' } }),
    ]);
    const occupiedUnitIds = new Set(tenants.map((item) => item.unitId));

    return buildings.map((building) => {
      const buildingUnits = units.filter((unit) => unit.buildingId === building.id);
      const occupied = buildingUnits.filter((unit) => occupiedUnitIds.has(unit.id)).length;
      const total = buildingUnits.length;
      const vacant = Math.max(0, total - occupied);
      return {
        buildingId: building.id,
        buildingName: building.name,
        totalUnits: total,
        occupiedUnits: occupied,
        vacantUnits: vacant,
        occupancyRate: total ? Number(((occupied / total) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getTeamRoleCounts(accountId: number) {
    const users = await this.usersRepo.find({ where: { accountId } });
    return {
      total: users.length,
      owners: users.filter((u) => u.role === 'OWNER').length,
      accountants: users.filter((u) => u.role === 'ACCOUNTANT').length,
      lawyers: users.filter((u) => u.role === 'LAWYER').length,
      tenants: users.filter((u) => u.role === 'TENANT').length,
    };
  }

  async getAnnualForecast(accountId: number, year: number) {
    const profile = await this.complianceService.getOrCreateProfile(accountId);
    const vatRatePercent = 18;
    const incomeTaxRatePercent = profile.incomeTaxRegime === 'CIT' ? 28 : profile.incomeTaxRegime === 'PIT' ? 30 : 0;

    const contracts = await this.contractsRepo.find({
      where: { accountId, status: 'ACTIVE', isApproved: true },
    });
    const tenants = await this.tenantsRepo.find({ where: { accountId } });
    const tenantName = new Map(tenants.map((t) => [t.id, t.fullName || t.companyName || `Tenant #${t.id}`]));

    const contractLines: Array<{
      source: 'CONTRACT';
      contractId: number;
      tenantId: number;
      tenantName: string;
      monthlyRentRwf: number;
      monthsInYear: number;
      grossRwf: number;
    }> = [];

    for (const contract of contracts) {
      const version = await this.versionsRepo.findOne({
        where: {
          accountId,
          contractId: contract.id,
          versionNumber: contract.currentVersionNumber ?? 1,
        },
      });
      if (!version) continue;
      const monthly = Number(version.rentAmountRwf);
      const months = billableMonthsInYear(version.startDate, version.endDate, year);
      if (months <= 0) continue;
      contractLines.push({
        source: 'CONTRACT',
        contractId: contract.id,
        tenantId: contract.tenantId,
        tenantName: tenantName.get(contract.tenantId) ?? `Tenant #${contract.tenantId}`,
        monthlyRentRwf: monthly,
        monthsInYear: months,
        grossRwf: Number((monthly * months).toFixed(2)),
      });
    }

    const manualRows = await this.manualIncomeRepo.find({ where: { accountId, year } });
    const manualLines = manualRows.map((row) => ({
      source: 'MANUAL' as const,
      manualLineId: row.id,
      label: row.label,
      monthlyRentRwf: Number(row.monthlyRentRwf),
      monthsInYear: 12,
      grossRwf: Number((Number(row.monthlyRentRwf) * 12).toFixed(2)),
    }));

    const grossAnnualRwf = [...contractLines, ...manualLines].reduce((s, l) => s + l.grossRwf, 0);
    const vatRwf = Number((grossAnnualRwf * (vatRatePercent / 100)).toFixed(2));
    const afterVatRwf = Number((grossAnnualRwf - vatRwf).toFixed(2));
    const incomeTaxRwf =
      incomeTaxRatePercent > 0 ? Number((afterVatRwf * (incomeTaxRatePercent / 100)).toFixed(2)) : 0;
    const netAfterTaxRwf = Number((afterVatRwf - incomeTaxRwf).toFixed(2));

    return {
      year,
      disclaimer:
        'Illustrative forecast from lease rent fields and manual lines. Not RRA filing. VAT at 18% on gross rent is simplified; confirm with your accountant.',
      incomeTaxRegime: profile.incomeTaxRegime,
      vatRatePercent,
      incomeTaxRatePercent,
      contractLines,
      manualLines,
      summary: {
        grossAnnualRwf,
        vatRwf,
        afterVatRwf,
        incomeTaxLabel: profile.incomeTaxRegime === 'CIT' ? 'CIT (est.)' : profile.incomeTaxRegime === 'PIT' ? 'PIT (est.)' : 'Income tax (not set)',
        incomeTaxRwf,
        netAfterTaxRwf,
      },
    };
  }

  async addManualIncomeLine(accountId: number, year: number, label: string, monthlyRentRwf: number) {
    const row = this.manualIncomeRepo.create({ accountId, year, label, monthlyRentRwf });
    return this.manualIncomeRepo.save(row);
  }

  async removeManualIncomeLine(accountId: number, id: number) {
    const row = await this.manualIncomeRepo.findOne({ where: { id, accountId } });
    if (!row) throw new Error('Manual line not found');
    await this.manualIncomeRepo.remove(row);
    return { success: true };
  }
}
