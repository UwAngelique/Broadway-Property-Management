import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './contract.entity';
import { ContractVersion } from './contract-version.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { AddContractVersionDto } from './dto/add-contract-version.dto';
import { ContractLibraryQueryDto } from './dto/contract-library-query.dto';
import { TenantProfile } from '../tenants/tenant-profile.entity';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractsRepo: Repository<Contract>,
    @InjectRepository(ContractVersion)
    private readonly versionsRepo: Repository<ContractVersion>,
    @InjectRepository(TenantProfile)
    private readonly tenantsRepo: Repository<TenantProfile>,
  ) {}

  async createContractV1(dto: CreateContractDto, filePath: string, accountId: number) {
    await this.ensureTenant(dto.tenantId, accountId);
    const contract = this.contractsRepo.create({
      accountId,
      tenantId: dto.tenantId,
      status: 'DRAFT',
      isApproved: false,
      currentVersionNumber: 1,
      notes: dto.notes,
    });
    const savedContract = await this.contractsRepo.save(contract);
    const version = this.versionsRepo.create({
      accountId,
      contractId: savedContract.id,
      versionNumber: 1,
      filePath,
      uploadedByRole: dto.uploadedByRole,
      startDate: dto.startDate,
      endDate: dto.endDate,
      rentAmountRwf: dto.rentAmountRwf,
      paymentFrequency: dto.paymentFrequency,
      dueDayOfMonth: dto.dueDayOfMonth,
      reminderDaysBeforeEnd: dto.reminderDaysBeforeEnd ?? 60,
      automationEnabled: false,
      autoInvoice: false,
      autoIncrement: false,
      autoDisableOnEnd: true,
    });
    const savedVersion = await this.versionsRepo.save(version);
    return { contract: savedContract, version: savedVersion };
  }

  async addVersion(contractId: number, dto: AddContractVersionDto, filePath: string, accountId: number) {
    const contract = await this.findContract(contractId, accountId);
    const nextVersion = (contract.currentVersionNumber ?? 1) + 1;
    const version = this.versionsRepo.create({
      accountId,
      contractId: contract.id,
      versionNumber: nextVersion,
      filePath,
      uploadedByRole: dto.uploadedByRole,
      startDate: dto.startDate,
      endDate: dto.endDate,
      rentAmountRwf: dto.rentAmountRwf,
      paymentFrequency: dto.paymentFrequency,
      dueDayOfMonth: dto.dueDayOfMonth,
      reminderDaysBeforeEnd: dto.reminderDaysBeforeEnd ?? 60,
      automationEnabled: false,
      autoInvoice: false,
      autoIncrement: false,
      autoDisableOnEnd: true,
    });
    const savedVersion = await this.versionsRepo.save(version);
    contract.currentVersionNumber = nextVersion;
    contract.status = 'DRAFT';
    contract.isApproved = false;
    await this.contractsRepo.save(contract);
    return { contract, version: savedVersion };
  }

  async approve(contractId: number, accountId: number) {
    const contract = await this.findContract(contractId, accountId);
    contract.status = 'ACTIVE';
    contract.isApproved = true;
    return this.contractsRepo.save(contract);
  }

  async findAll(query: ContractLibraryQueryDto, accountId: number) {
    const contracts = await this.contractsRepo.find({
      where: {
        accountId,
        ...(query.tenantId ? { tenantId: query.tenantId } : {}),
      },
      order: { id: 'DESC' },
    });
    const enriched = await this.attachCurrentVersionIds(contracts, accountId);
    if (!query.view) {
      return enriched;
    }

    if (query.view === 'ACTIVE') {
      return enriched.filter((c) => c.status === 'ACTIVE');
    }

    const expiringDays = query.expiringInDays ?? 60;
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() + expiringDays);
    const withLatestVersion = await Promise.all(
      enriched.map(async (contract) => ({
        contract,
        latestVersion: await this.versionsRepo.findOne({
          where: { accountId, contractId: contract.id, versionNumber: contract.currentVersionNumber ?? 1 },
        }),
      })),
    );

    if (query.view === 'EXPIRED') {
      return withLatestVersion
        .filter((item) => item.latestVersion && new Date(item.latestVersion.endDate) < now)
        .map((item) => item.contract);
    }

    return withLatestVersion
      .filter(
        (item) =>
          item.latestVersion &&
          new Date(item.latestVersion.endDate) >= now &&
          new Date(item.latestVersion.endDate) <= threshold,
      )
      .map((item) => item.contract);
  }

  async findVersionHistory(contractId: number, accountId: number) {
    await this.findContract(contractId, accountId);
    return this.versionsRepo.find({
      where: { contractId, accountId },
      order: { versionNumber: 'DESC' },
    });
  }

  async findVersion(contractId: number, versionIdOrNumber: number, accountId: number) {
    await this.findContract(contractId, accountId);
    let version = await this.versionsRepo.findOne({
      where: { id: versionIdOrNumber, contractId, accountId },
    });
    if (!version) {
      version = await this.versionsRepo.findOne({
        where: { versionNumber: versionIdOrNumber, contractId, accountId },
      });
    }
    if (!version) {
      throw new NotFoundException('Contract version not found');
    }
    return version;
  }

  private async attachCurrentVersionIds(contracts: Contract[], accountId: number) {
    return Promise.all(
      contracts.map(async (contract) => {
        const versionNumber = contract.currentVersionNumber ?? 1;
        const version = await this.versionsRepo.findOne({
          where: { accountId, contractId: contract.id, versionNumber },
        });
        return {
          ...contract,
          currentVersionNumber: versionNumber,
          currentVersionId: version?.id,
        };
      }),
    );
  }

  private async findContract(contractId: number, accountId: number) {
    const contract = await this.contractsRepo.findOne({ where: { id: contractId, accountId } });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  private async ensureTenant(tenantId: number, accountId: number) {
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId, accountId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }

  async updateCurrentRent(contractId: number, accountId: number, rentAmountRwf: number) {
    const contract = await this.findContract(contractId, accountId);
    const version = await this.versionsRepo.findOne({
      where: {
        accountId,
        contractId: contract.id,
        versionNumber: contract.currentVersionNumber ?? 1,
      },
    });
    if (!version) throw new NotFoundException('Contract version not found');
    version.rentAmountRwf = rentAmountRwf;
    await this.versionsRepo.save(version);
    return { contractId, rentAmountRwf: Number(version.rentAmountRwf) };
  }
}
