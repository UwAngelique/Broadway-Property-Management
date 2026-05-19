import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitsRepo: Repository<Unit>,
  ) {}

  async create(dto: CreateUnitDto, accountId: number) {
    const unit = this.unitsRepo.create({
      accountId,
      unitName: dto.unitName,
      floor: dto.floor,
      buildingId: dto.buildingId,
    });
    return this.unitsRepo.save(unit);
  }

  async findAll(accountId: number) {
    return this.unitsRepo.find({ where: { accountId }, order: { id: 'DESC' } });
  }

  async findByBuilding(buildingId: number, accountId: number) {
    return this.unitsRepo.find({ where: { buildingId, accountId }, order: { id: 'DESC' } });
  }

  async findOne(id: number, accountId: number) {
    const unit = await this.unitsRepo.findOne({ where: { id, accountId } });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: number, dto: UpdateUnitDto, accountId: number) {
    const unit = await this.findOne(id, accountId);
    if (dto.unitName !== undefined) unit.unitName = dto.unitName;
    if (dto.floor !== undefined) unit.floor = dto.floor;
    return this.unitsRepo.save(unit);
  }

  async remove(id: number, accountId: number) {
    const unit = await this.findOne(id, accountId);
    await this.unitsRepo.remove(unit);
    return { deleted: true };
  }
}