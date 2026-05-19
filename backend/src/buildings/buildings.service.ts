import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './building.entity';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingsRepo: Repository<Building>,
  ) {}

  async create(dto: CreateBuildingDto, accountId: number) {
    const building = this.buildingsRepo.create({
      accountId,
      name: dto.name,
      address: dto.address,
      currency: (dto.currency ?? 'RWF').toUpperCase(),
      upi: dto.upi,
      propertyKind: dto.propertyKind ?? 'BUILDING',
      usageType: dto.usageType ?? 'COMMERCIAL',
      district: dto.district,
      sector: dto.sector,
      cell: dto.cell,
      village: dto.village,
      landSizeSqm: dto.landSizeSqm ?? null,
    });

    return this.buildingsRepo.save(building);
  }

  async findAll(accountId: number) {
    // Order newest first
    return this.buildingsRepo.find({ where: { accountId }, order: { id: 'DESC' } });
  }

  async findOne(id: number, accountId: number) {
    const building = await this.buildingsRepo.findOne({ where: { id, accountId } });
    if (!building) throw new NotFoundException('Building not found');
    return building;
  }

  async update(id: number, dto: UpdateBuildingDto, accountId: number) {
    const building = await this.findOne(id, accountId);

    if (dto.name !== undefined) building.name = dto.name;
    if (dto.address !== undefined) building.address = dto.address;
    if (dto.currency !== undefined) building.currency = dto.currency.toUpperCase();
    if (dto.upi !== undefined) building.upi = dto.upi;
    if (dto.propertyKind !== undefined) building.propertyKind = dto.propertyKind;
    if (dto.usageType !== undefined) building.usageType = dto.usageType;
    if (dto.district !== undefined) building.district = dto.district;
    if (dto.sector !== undefined) building.sector = dto.sector;
    if (dto.cell !== undefined) building.cell = dto.cell;
    if (dto.village !== undefined) building.village = dto.village;
    if (dto.landSizeSqm !== undefined) building.landSizeSqm = dto.landSizeSqm;

    return this.buildingsRepo.save(building);
  }

  async remove(id: number, accountId: number) {
    const building = await this.findOne(id, accountId);
    await this.buildingsRepo.remove(building);
    return { deleted: true };
  }
}