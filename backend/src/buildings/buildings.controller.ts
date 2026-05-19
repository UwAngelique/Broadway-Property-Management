import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtUserPayload } from '../auth/types';

@Controller('buildings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @Roles('OWNER', 'LAWYER')
  create(@Body() dto: CreateBuildingDto, @CurrentUser() user: JwtUserPayload) {
    return this.buildingsService.create(dto, user.accountId);
  }

  @Get()
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  findAll(@CurrentUser() user: JwtUserPayload) {
    return this.buildingsService.findAll(user.accountId);
  }

  @Get(':id')
  @Roles('OWNER', 'LAWYER', 'ACCOUNTANT')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.buildingsService.findOne(Number(id), user.accountId);
  }

  @Patch(':id')
  @Roles('OWNER', 'LAWYER')
  update(@Param('id') id: string, @Body() dto: UpdateBuildingDto, @CurrentUser() user: JwtUserPayload) {
    return this.buildingsService.update(Number(id), dto, user.accountId);
  }

  @Delete(':id')
  @Roles('OWNER')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
    return this.buildingsService.remove(Number(id), user.accountId);
  }
}