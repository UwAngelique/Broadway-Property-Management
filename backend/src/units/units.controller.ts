import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';

@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @Roles('OWNER', 'LAWYER')
  create(@Body() dto: CreateUnitDto, @CurrentUser() user: JwtUserPayload) {
    return this.unitsService.create(dto, user.accountId);
  }

  @Get()
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  findAll(@CurrentUser() user: JwtUserPayload) {
    return this.unitsService.findAll(user.accountId);
  }

  @Get('building/:buildingId')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  findByBuilding(@Param('buildingId') buildingId: string, @CurrentUser() user: JwtUserPayload) {
    return this.unitsService.findByBuilding(Number(buildingId), user.accountId);
  }

  @Get(':id')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT', 'TENANT')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.unitsService.findOne(Number(id), user.accountId);
  }

  @Patch(':id')
  @Roles('OWNER', 'LAWYER')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto, @CurrentUser() user: JwtUserPayload) {
    return this.unitsService.update(Number(id), dto, user.accountId);
  }

  @Delete(':id')
  @Roles('OWNER')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.unitsService.remove(Number(id), user.accountId);
  }
}