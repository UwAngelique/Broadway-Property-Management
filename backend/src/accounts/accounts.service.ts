import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt-ts';
import { Account, type AccountActivationStatus, type AccountKind } from './account.entity';
import { isValidSubscriptionPlanId } from '../billing/plan-catalog';
import { UpdateAccountBillingDto } from './dto/update-account-billing.dto';
import { User } from '../tenants/user.entity';
import { CreateClientWorkspaceDto } from './dto/create-client-workspace.dto';
import { CreateAccountUserDto } from './dto/create-account-user.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepo: Repository<Account>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(
    name: string,
    options?: {
      kind?: AccountKind;
      parentAccountId?: number | null;
      activationStatus?: AccountActivationStatus;
    },
  ) {
    const createPayload = {
      name,
      isActive: true,
      currency: 'RWF',
      vatEnabled: true,
      vatRatePercent: 18,
      kind: options?.kind ?? 'LANDLORD',
      parentAccountId: options?.parentAccountId ?? null,
      activationStatus: options?.activationStatus ?? 'ACTIVE',
    };
    try {
      const account = this.accountsRepo.create(createPayload);
      return await this.accountsRepo.save(account);
    } catch (error) {
      const err = error as { code?: string; constraint?: string };
      if (err.code === '23505' && err.constraint === 'accounts_pkey') {
        await this.accountsRepo.query(
          `SELECT setval(pg_get_serial_sequence('accounts','id'), COALESCE(MAX(id),1), true) FROM accounts`,
        );
        const retry = this.accountsRepo.create(createPayload);
        return this.accountsRepo.save(retry);
      }
      throw error;
    }
  }

  /** Self-serve signups: independent landlord workspace */
  async createLandlordAccount(name: string) {
    return this.create(name, { kind: 'LANDLORD', activationStatus: 'ACTIVE' });
  }

  async findOne(id: number) {
    return this.accountsRepo.findOne({ where: { id } });
  }

  async listLandlordChildren(platformAccountId: number) {
    return this.accountsRepo.find({
      where: { parentAccountId: platformAccountId, kind: 'LANDLORD' },
      order: { id: 'DESC' },
    });
  }

  async updateBilling(accountId: number, dto: UpdateAccountBillingDto) {
    const account = await this.findOne(accountId);
    if (!account) return null;
    Object.assign(account, dto);
    return this.accountsRepo.save(account);
  }

  async setSubscriptionPlan(accountId: number, planId: string) {
    if (!isValidSubscriptionPlanId(planId)) {
      throw new BadRequestException('Invalid subscription plan');
    }
    const account = await this.findOne(accountId);
    if (!account) throw new NotFoundException('Account not found');
    account.subscriptionPlanId = planId;
    return this.accountsRepo.save(account);
  }

  async createClientWorkspace(platformAccountId: number, dto: CreateClientWorkspaceDto) {
    const platform = await this.findOne(platformAccountId);
    if (!platform || platform.kind !== 'PLATFORM') {
      throw new ForbiddenException('Only a platform operator account can create landlord client workspaces');
    }
    const existing = await this.usersRepo.findOne({ where: { email: dto.ownerEmail } });
    if (existing) {
      throw new ConflictException('Owner email already exists');
    }
    const account = await this.create(dto.workspaceName, {
      kind: 'LANDLORD',
      parentAccountId: platformAccountId,
      activationStatus: dto.initialActivationStatus ?? 'PENDING',
    });
    const passwordHash = await hash(dto.ownerPassword, 10);
    const owner = this.usersRepo.create({
      accountId: account.id,
      email: dto.ownerEmail,
      passwordHash,
      role: 'OWNER',
      language: dto.language ?? 'EN',
      isActive: true,
      authProvider: 'LOCAL',
    });
    const savedOwner = await this.usersRepo.save(owner);
    return {
      accountId: account.id,
      workspaceName: account.name,
      activationStatus: account.activationStatus,
      ownerUserId: savedOwner.id,
      ownerEmail: savedOwner.email,
    };
  }

  async setLandlordClientActivation(platformAccountId: number, clientAccountId: number, status: AccountActivationStatus) {
    const client = await this.accountsRepo.findOne({ where: { id: clientAccountId } });
    if (!client || client.parentAccountId !== platformAccountId || client.kind !== 'LANDLORD') {
      throw new ForbiddenException('Client workspace not found under your platform');
    }
    client.activationStatus = status;
    client.isActive = status !== 'SUSPENDED';
    return this.accountsRepo.save(client);
  }

  async createUserInAccount(accountId: number, dto: CreateAccountUserDto) {
    const account = await this.findOne(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (dto.startInactive === true && dto.role !== 'TENANT') {
      throw new BadRequestException('startInactive is only valid for tenant users');
    }
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const passwordHash = await hash(dto.password, 10);
    const user = this.usersRepo.create({
      accountId,
      email: dto.email,
      passwordHash,
      role: dto.role,
      language: dto.language ?? 'EN',
      isActive: dto.startInactive === true ? false : true,
      authProvider: 'LOCAL',
    });
    return this.usersRepo.save(user);
  }

  async setUserActiveInAccount(accountId: number, targetUserId: number, isActive: boolean) {
    const target = await this.usersRepo.findOne({ where: { id: targetUserId, accountId } });
    if (!target) {
      throw new NotFoundException('User not found in this workspace');
    }
    target.isActive = isActive;
    return this.usersRepo.save(target);
  }

  async listUsersInAccount(accountId: number) {
    return this.usersRepo.find({
      where: { accountId },
      order: { id: 'DESC' },
      select: {
        id: true,
        email: true,
        role: true,
        language: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
