import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcrypt-ts';
import { User } from './user.entity';
import { TenantProfile } from './tenant-profile.entity';
import { TenantSignupDto } from './dto/tenant-signup.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(TenantProfile) private readonly tenantsRepo: Repository<TenantProfile>,
  ) {}

  async signup(dto: TenantSignupDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const passwordHash = await hash(dto.password, 10);

    const user = this.usersRepo.create({
      accountId: dto.accountId,
      email: dto.email,
      passwordHash,
      role: 'TENANT',
      language: dto.language ?? 'EN',
      isActive: true,
      authProvider: 'LOCAL',
    });
    const savedUser = await this.usersRepo.save(user);

    const profile = this.tenantsRepo.create({
      accountId: dto.accountId,
      userId: savedUser.id,
      unitId: dto.unitId,
      fullName: dto.fullName,
      companyName: dto.companyName,
      businessSector: dto.businessSector,
      tinNumber: dto.tinNumber,
      phone: dto.phone,
      address: dto.address,
    });

    const savedProfile = await this.tenantsRepo.save(profile);

    return {
      userId: savedUser.id,
      tenantProfileId: savedProfile.id,
      email: savedUser.email,
      language: savedUser.language,
    };
  }

  async findAll(accountId: number) {
    return this.tenantsRepo.find({ where: { accountId }, order: { id: 'DESC' } });
  }

  async findProfileIdByUserId(userId: number, accountId: number) {
    const profile = await this.tenantsRepo.findOne({ where: { userId, accountId } });
    if (!profile) {
      throw new NotFoundException('Tenant profile not found');
    }
    return profile.id;
  }

  async findOne(id: number, accountId: number) {
    const tenant = await this.tenantsRepo.findOne({ where: { id, accountId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: number, dto: UpdateTenantProfileDto, accountId: number) {
    const tenant = await this.findOne(id, accountId);
    Object.assign(tenant, dto);
    return this.tenantsRepo.save(tenant);
  }

  async setRdbCertificatePath(id: number, path: string, accountId: number) {
    const tenant = await this.findOne(id, accountId);
    tenant.rdbCertificatePath = path;
    return this.tenantsRepo.save(tenant);
  }

  async disableTenantUser(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    return this.usersRepo.save(user);
  }
}